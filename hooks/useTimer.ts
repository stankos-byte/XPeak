import { useState, useEffect, useCallback } from 'react';

interface UseTimerReturn {
  timeLeft: number;
  isActive: boolean;
  mode: 'work' | 'break';
  workDuration: number;
  breakDuration: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: 'work' | 'break') => void;
  adjustTimer: (change: number) => void;
}

export const useTimer = (
  initialWorkDuration: number = 25 * 60,
  initialBreakDuration: number = 5 * 60
): UseTimerReturn => {
  const [workDuration, setWorkDuration] = useState(initialWorkDuration);
  const [breakDuration, setBreakDuration] = useState(initialBreakDuration);
  const [timeLeft, setTimeLeft] = useState(initialWorkDuration);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [endTime, setEndTime] = useState<number | null>(null);

  // Play notification sound when timer ends
  const playTimerEndSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.5);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch (error) {
      console.log('Audio playback not supported');
    }
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((endTime - now) / 1000);
        if (diff <= 0) {
          setIsActive(false);
          setEndTime(null);
          playTimerEndSound();
          setTimeLeft(mode === 'work' ? workDuration : breakDuration);
        } else {
          setTimeLeft(diff);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isActive, endTime, mode, workDuration, breakDuration, playTimerEndSound]);

  const toggleTimer = useCallback(() => {
    if (isActive) {
      setIsActive(false);
      setEndTime(null);
    } else {
      const newEndTime = Date.now() + timeLeft * 1000;
      setEndTime(newEndTime);
      setIsActive(true);
    }
  }, [isActive, timeLeft]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setEndTime(null);
    setTimeLeft(mode === 'work' ? workDuration : breakDuration);
  }, [mode, workDuration, breakDuration]);

  const switchMode = useCallback((newMode: 'work' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setEndTime(null);
    setTimeLeft(newMode === 'work' ? workDuration : breakDuration);
  }, [workDuration, breakDuration]);

  const adjustTimer = useCallback((change: number) => {
    if (mode === 'work') {
      const newDuration = Math.max(60, workDuration + change);
      setWorkDuration(newDuration);
      if (!isActive) setTimeLeft(newDuration);
    } else {
      const newDuration = Math.max(60, breakDuration + change);
      setBreakDuration(newDuration);
      if (!isActive) setTimeLeft(newDuration);
    }
  }, [mode, workDuration, breakDuration, isActive]);

  return {
    timeLeft,
    isActive,
    mode,
    workDuration,
    breakDuration,
    toggleTimer,
    resetTimer,
    switchMode,
    adjustTimer,
  };
};
