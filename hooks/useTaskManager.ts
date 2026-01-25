import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Task, TaskTemplate, Difficulty, SkillCategory } from '../types';
import { calculateXP } from '../utils/gamification';
import { auth } from '../config/firebase';
import { getTasks, createTask, updateTask, deleteTask, subscribeToTasks } from '../services/firestoreService';
import { useHabitSync } from './useHabitSync';
import { gameToast } from '../components/ui/GameToast';

interface UseTaskManagerReturn {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  handleCompleteTask: (id: string) => void;
  handleUncompleteTask: (id: string) => void;
  handleDeleteTask: (id: string) => void;
  handleEditTask: (task: Task) => void;
  handleSaveTemplate: (task: Task, onSaveTemplate: (template: TaskTemplate) => void) => void;
  handleCreateTask: (data: Partial<Task>) => void;
  handleUpdateTask: (id: string, data: Partial<Task>) => void;
  handleAiCreateTask: (task: Partial<Task>) => void;
}

export const useTaskManager = (
  onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void,
  onSaveTemplate: (template: TaskTemplate) => void
): UseTaskManagerReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize tasks from Firestore on mount and auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const firestoreTasks = await getTasks(firebaseUser.uid);
          setTasks(firestoreTasks);
        } catch (error) {
          console.error('Error loading tasks:', error);
          setTasks([]);
        }
      } else {
        setTasks([]);
      }
      setIsInitialized(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // Subscribe to real-time task updates
  useEffect(() => {
    if (!isInitialized || !auth.currentUser) return;

    const unsubscribe = subscribeToTasks((firestoreTasks) => {
      setTasks(firestoreTasks);
    });

    return () => unsubscribe();
  }, [isInitialized]);

  // Sync habits daily
  useHabitSync(tasks, setTasks);

  const handleCompleteTask = useCallback(async (id: string) => {
    if (!auth.currentUser) return;

    const task = tasks.find((t: Task) => t.id === id);
    if (!task) return;
    const xpResult = calculateXP(task);
    const amount = xpResult.total;
    
    // Increment streak if habit
    const newStreak = task.isHabit ? (task.streak || 0) + 1 : 0;

    try {
      await updateTask(id, {
        completed: true,
        lastCompletedDate: new Date().toISOString(),
        streak: newStreak
      });
      // Real-time listener will update tasks automatically
    } catch (error) {
      console.error('Error completing task:', error);
      gameToast.error('Failed to complete task');
      return;
    }

    onXPChange(amount, id, { [id]: amount }, task.skillCategory);

    // Show streak toast for habits with streaks > 1
    if (task.isHabit && newStreak > 1) {
      setTimeout(() => gameToast.streak(newStreak, task.title), 500);
    }
  }, [tasks, onXPChange]);

  const handleUncompleteTask = useCallback(async (id: string) => {
    if (!auth.currentUser) return;

    const task = tasks.find((t: Task) => t.id === id);
    if (!task) return;
    const xpResult = calculateXP(task);
    const amount = -xpResult.total;

    // Decrement streak if habit
    const newStreak = task.isHabit ? Math.max(0, (task.streak || 0) - 1) : 0;

    try {
      await updateTask(id, {
        completed: false,
        lastCompletedDate: null,
        streak: newStreak
      });
      // Real-time listener will update tasks automatically
    } catch (error) {
      console.error('Error uncompleting task:', error);
      gameToast.error('Failed to uncomplete task');
      return;
    }

    onXPChange(amount, id, { [id]: amount }, task.skillCategory);
  }, [tasks, onXPChange]);

  const handleDeleteTask = useCallback(async (id: string) => {
    if (!auth.currentUser) return;

    try {
      await deleteTask(id);
      // Real-time listener will update tasks automatically
    } catch (error) {
      console.error('Error deleting task:', error);
      gameToast.error('Failed to delete task');
    }
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  }, []);

  const handleSaveTemplate = useCallback((task: Task, onSaveTemplate: (template: TaskTemplate) => void) => {
    const template: TaskTemplate = {
      id: crypto.randomUUID(),
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      skillCategory: task.skillCategory,
      isHabit: task.isHabit
    };
    onSaveTemplate(template);
  }, []);

  const handleCreateTask = useCallback(async (data: Partial<Task>) => {
    if (!auth.currentUser) return;

    const newTask: Omit<Task, 'id'> = {
      title: data.title || 'New Task',
      description: data.description || '',
      difficulty: data.difficulty || Difficulty.EASY,
      skillCategory: data.skillCategory || SkillCategory.MISC,
      isHabit: data.isHabit || false,
      completed: false,
      streak: 0,
      lastCompletedDate: null,
      createdAt: new Date().toISOString()
    };

    try {
      await createTask(newTask);
      // Real-time listener will update tasks automatically
    } catch (error) {
      console.error('Error creating task:', error);
      gameToast.error('Failed to create task');
    }
  }, []);

  const handleUpdateTask = useCallback(async (id: string, data: Partial<Task>) => {
    if (!auth.currentUser) return;

    try {
      await updateTask(id, data);
      // Real-time listener will update tasks automatically
    } catch (error) {
      console.error('Error updating task:', error);
      gameToast.error('Failed to update task');
    }
  }, []);

  const handleAiCreateTask = useCallback(async (task: Partial<Task>) => {
    await handleCreateTask(task);
  }, [handleCreateTask]);

  return {
    tasks,
    setTasks,
    isModalOpen,
    setIsModalOpen,
    editingTask,
    setEditingTask,
    handleCompleteTask,
    handleUncompleteTask,
    handleDeleteTask,
    handleEditTask,
    handleSaveTemplate,
    handleCreateTask,
    handleUpdateTask,
    handleAiCreateTask,
  };
};
