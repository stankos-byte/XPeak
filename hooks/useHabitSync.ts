import { useEffect } from 'react';
import { Task } from '../types';

/**
 * Hook to automatically sync habit completion status daily
 * Resets habits at midnight and breaks streaks if missed
 */
export const useHabitSync = (
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) => {
  useEffect(() => {
    const syncHabits = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterday = today - (24 * 60 * 60 * 1000);

      setTasks(prev => {
        let changed = false;
        const next = prev.map(t => {
          if (!t.isHabit) return t;

          const lastDate = t.lastCompletedDate ? new Date(t.lastCompletedDate) : null;
          const lastTime = lastDate 
            ? new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime() 
            : 0;

          let newCompleted = t.completed;
          let newStreak = t.streak;

          // Reset if completed prior to today
          if (t.completed && lastTime < today) {
            newCompleted = false;
            changed = true;
          }

          // Break streak if not completed yesterday or today
          if (lastTime < yesterday && t.streak > 0) {
            newStreak = 0;
            changed = true;
          }

          return changed ? { ...t, completed: newCompleted, streak: newStreak } : t;
        });
        return changed ? next : prev;
      });
    };

    syncHabits();
    const interval = setInterval(syncHabits, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [setTasks]);
};
