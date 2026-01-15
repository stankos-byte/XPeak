import { useState, useCallback } from 'react';
import { calculateLevel } from '../utils/gamification';

interface XPPopup {
  [key: string]: number;
}

interface UseXPSystemReturn {
  xpPopups: XPPopup;
  flashKey: number;
  applyXPChange: (amount: number, historyId: string, popups: XPPopup) => void;
  showLevelUp: { show: boolean; level: number } | null;
  setShowLevelUp: (value: { show: boolean; level: number } | null) => void;
}

export const useXPSystem = (
  currentLevel: number,
  currentXP: number,
  onXPChange: (amount: number, historyId: string) => void
): UseXPSystemReturn => {
  const [xpPopups, setXpPopups] = useState<XPPopup>({});
  const [flashKey, setFlashKey] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState<{ show: boolean; level: number } | null>(null);

  const applyXPChange = useCallback((amount: number, historyId: string, popups: XPPopup) => {
    const newTotalXP = Math.max(0, currentXP + amount);
    const newLevel = calculateLevel(newTotalXP);
    
    // Show level up animation
    if (amount > 0 && newLevel > currentLevel) {
      setShowLevelUp({ show: true, level: newLevel });
      setTimeout(() => setShowLevelUp(null), 3000);
    }
    
    // Apply the XP change
    onXPChange(amount, historyId);
    
    // Show XP popups
    setXpPopups(prev => ({ ...prev, ...popups }));
    setFlashKey(k => k + 1);
    
    // Clear popups after animation
    const popupKeys = Object.keys(popups);
    setTimeout(() => {
      setXpPopups(p => {
        const n = { ...p };
        popupKeys.forEach(k => delete n[k]);
        return n;
      });
    }, 1500);
  }, [currentXP, currentLevel, onXPChange]);

  return {
    xpPopups,
    flashKey,
    applyXPChange,
    showLevelUp,
    setShowLevelUp,
  };
};
