import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskTemplate, Difficulty, SkillCategory } from '../types';
import { calculateXP } from '../utils/gamification';
import { storage, STORAGE_KEYS } from '../services/localStorage';
import { persistenceService } from '../services/persistenceService';
import { useHabitSync } from './useHabitSync';
import { gameToast } from '../components/ui/GameToast';
import { useAuth } from '../contexts/AuthContext';
import { 
  getTasks, 
  saveTask, 
  deleteTask as firestoreDeleteTask,
  updateTask
} from '../services/firestoreDataService';

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
  isLoading: boolean;
}

export const useTaskManager = (
  onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void,
  onSaveTemplate: (template: TaskTemplate) => void
): UseTaskManagerReturn => {
  const { user } = useAuth();
  // Initialize with empty array - we'll load from the correct source in useEffect
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading
  
  // Track if we're syncing from Firestore to prevent loops
  const isSyncingRef = useRef(false);
  // Track if initial load is complete
  const initialLoadCompleteRef = useRef(false);

  // Sync habits daily
  useHabitSync(tasks, setTasks);

  // Load tasks from correct source based on auth state
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      isSyncingRef.current = true;
      
      try {
        if (user) {
          // Authenticated: ALWAYS use Firestore as source of truth
          const firestoreTasks = await getTasks(user.uid);
          setTasks(firestoreTasks); // Use Firestore data even if empty
        } else {
          // Not authenticated: use localStorage (scoped by anonymous session)
          const localTasks = storage.get<Task[]>(STORAGE_KEYS.TASKS, [], null);
          setTasks(localTasks);
        }
        initialLoadCompleteRef.current = true;
      } catch (error) {
        console.error('Failed to load tasks:', error);
        // On error, fall back to localStorage (scoped by anonymous session)
        const localTasks = storage.get<Task[]>(STORAGE_KEYS.TASKS, [], null);
        setTasks(localTasks);
        initialLoadCompleteRef.current = true;
      } finally {
        isSyncingRef.current = false;
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [user]);

  // Save to Firestore when tasks change (only after initial load)
  useEffect(() => {
    // Skip if syncing from Firestore or initial load not complete
    if (isSyncingRef.current || !initialLoadCompleteRef.current) return;
    
    if (user) {
      // Debounced save to Firestore - we handle individual saves in handlers
      // This is a fallback for bulk state changes
    } else {
      // Save to localStorage when not authenticated (scoped by anonymous session)
      persistenceService.set(STORAGE_KEYS.TASKS, tasks, null);
    }
  }, [tasks, user]);

  const handleCompleteTask = useCallback((id: string) => {
    const task = tasks.find((t: Task) => t.id === id);
    if (!task) return;
    const xpResult = calculateXP(task);
    const amount = xpResult.total;
    
    // Increment streak if habit
    const newStreak = task.isHabit ? (task.streak || 0) + 1 : 0;
    const now = new Date().toISOString();

    const updatedTask = { 
      ...task, 
      completed: true, 
      lastCompletedDate: now, 
      streak: newStreak 
    };

    setTasks((prev: Task[]) => prev.map((t: Task) => t.id === id ? updatedTask : t));

    // Save to Firestore if authenticated
    if (user) {
      updateTask(user.uid, id, {
        completed: true,
        lastCompletedDate: now,
        streak: newStreak
      }).catch((error) => {
        console.error('Failed to save task completion:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    }

    onXPChange(amount, id, { [id]: amount }, task.skillCategory);

    // Show streak toast for habits with streaks > 1
    if (task.isHabit && newStreak > 1) {
      setTimeout(() => gameToast.streak(newStreak, task.title), 500);
    }
  }, [tasks, onXPChange, user]);

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

    // Save to Firestore if authenticated
    if (user) {
      updateTask(user.uid, id, {
        completed: false,
        lastCompletedDate: null,
        streak: newStreak
      }).catch((error) => {
        console.error('Failed to save task uncomplete:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    }

    onXPChange(amount, id, { [id]: amount }, task.skillCategory);
  }, [tasks, onXPChange, user]);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== id));
    
    // Delete from Firestore if authenticated
    if (user) {
      firestoreDeleteTask(user.uid, id).catch((error) => {
        console.error('Failed to delete task from Firestore:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    }
  }, [user]);

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
    const newTask: Task = {
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
    };

    setTasks((prev: Task[]) => [newTask, ...prev]);

    // Save to Firestore if authenticated
    if (user) {
      saveTask(user.uid, newTask).catch((error) => {
        console.error('Failed to save new task to Firestore:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    }
  }, [user]);

  const handleUpdateTask = useCallback((id: string, data: Partial<Task>) => {
    setTasks((prev: Task[]) => prev.map((t: Task) => t.id === id ? { ...t, ...data } : t));
    
    // Save to Firestore if authenticated
    if (user) {
      updateTask(user.uid, id, data).catch((error) => {
        console.error('Failed to update task in Firestore:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    }
  }, [user]);

  const handleAiCreateTask = useCallback((task: Partial<Task>) => {
    const newTask: Task = {
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
    };

    setTasks((prev: Task[]) => [newTask, ...prev]);

    // Save to Firestore if authenticated
    if (user) {
      saveTask(user.uid, newTask).catch((error) => {
        console.error('Failed to save AI-generated task to Firestore:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    }
  }, [user]);

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
    isLoading,
  };
};
