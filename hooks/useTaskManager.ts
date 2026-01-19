import { useState, useEffect, useCallback } from 'react';
import { Task, TaskTemplate, Difficulty, SkillCategory } from '../types';
import { calculateXP } from '../utils/gamification';
import { storage, STORAGE_KEYS } from '../services/localStorage';
import { persistenceService } from '../services/persistenceService';
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
  const [tasks, setTasks] = useState<Task[]>(() => storage.get<Task[]>(STORAGE_KEYS.TASKS, []));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Sync habits daily
  useHabitSync(tasks, setTasks);

  // Save to localStorage (debounced)
  useEffect(() => { 
    persistenceService.set(STORAGE_KEYS.TASKS, tasks); 
  }, [tasks]);

  const handleCompleteTask = useCallback((id: string) => {
    const task = tasks.find((t: Task) => t.id === id);
    if (!task) return;
    const xpResult = calculateXP(task);
    const amount = xpResult.total;
    
    // Increment streak if habit
    const newStreak = task.isHabit ? (task.streak || 0) + 1 : 0;

    setTasks((prev: Task[]) => prev.map((t: Task) => t.id === id ? { 
        ...t, 
        completed: true, 
        lastCompletedDate: new Date().toISOString(), 
        streak: newStreak 
    } : t));

    onXPChange(amount, id, { [id]: amount }, task.skillCategory);

    // Show streak toast for habits with streaks > 1
    if (task.isHabit && newStreak > 1) {
      setTimeout(() => gameToast.streak(newStreak, task.title), 500);
    }
  }, [tasks, onXPChange]);

  const handleUncompleteTask = useCallback((id: string) => {
    const task = tasks.find((t: Task) => t.id === id);
    if (!task) return;
    const xpResult = calculateXP(task);
    const amount = -xpResult.total;

    // Decrement streak if habit
    const newStreak = task.isHabit ? Math.max(0, (task.streak || 0) - 1) : 0;

    setTasks((prev: Task[]) => prev.map((t: Task) => t.id === id ? { 
        ...t, 
        completed: false, 
        lastCompletedDate: null, 
        streak: newStreak 
    } : t));

    onXPChange(amount, id, { [id]: amount }, task.skillCategory);
  }, [tasks, onXPChange]);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== id));
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

  const handleCreateTask = useCallback((data: Partial<Task>) => {
    setTasks((prev: Task[]) => [{
      id: crypto.randomUUID(),
      title: data.title || 'New Task',
      description: data.description || '',
      difficulty: data.difficulty || Difficulty.EASY,
      skillCategory: data.skillCategory || SkillCategory.MISC,
      isHabit: data.isHabit || false,
      completed: false,
      streak: 0,
      lastCompletedDate: null,
      createdAt: new Date().toISOString()
    }, ...prev]);
  }, []);

  const handleUpdateTask = useCallback((id: string, data: Partial<Task>) => {
    setTasks((prev: Task[]) => prev.map((t: Task) => t.id === id ? { ...t, ...data } : t));
  }, []);

  const handleAiCreateTask = useCallback((task: Partial<Task>) => {
    setTasks((prev: Task[]) => [{
      id: crypto.randomUUID(),
      title: task.title || 'New Assignment',
      description: task.description || '',
      difficulty: task.difficulty || Difficulty.EASY,
      skillCategory: task.skillCategory || SkillCategory.MISC,
      isHabit: task.isHabit || false,
      completed: false,
      streak: 0,
      lastCompletedDate: null,
      createdAt: new Date().toISOString()
    }, ...prev]);
  }, []);

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
