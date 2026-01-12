
import React, { useState, useEffect, useRef } from 'react';
import { 
  Task, 
  UserProfile, 
  SkillCategory, 
  Difficulty,
  Goal,
  MainQuest,
  QuestCategory,
  QuestTask,
  TaskTemplate,
  ProfileLayout,
  WidgetId,
  Friend,
  FriendChallenge,
  ChatMessage
} from './types';
import { calculateXP, calculateLevel, getLevelProgress, getXPRequirement } from './utils/gamification';
import CreateTaskModal from './components/modals/CreateTaskModal';
import SimpleInputModal from './components/modals/SimpleInputModal';
import DeleteConfirmModal from './components/modals/DeleteConfirmModal';
import FeedbackModal from './components/modals/FeedbackModal';
import CreateChallengeModal from './components/modals/CreateChallengeModal';
import DashboardView from './pages/app/Dashboard';
import QuestsView from './pages/app/Quests';
import ProfileView from './pages/app/Profile';
import ToolsView from './pages/app/Tools';
import FriendsView from './pages/app/Friends';
import AssistantView from './pages/app/Assistant';
import SettingsView from './pages/app/Settings';
import { 
  Swords, 
  Trophy, 
  User, 
  Plus, 
  Activity,
  Zap,
  TrendingUp,
  LayoutDashboard,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Target,
  LayoutGrid,
  Clock,
  X,
  Crown,
  CheckSquare,
  Square,
  Trash2,
  Mountain,
  ChevronRight,
  ChevronDown,
  Map,
  Circle,
  CheckCircle2,
  PlayCircle,
  FolderPlus,
  FilePlus,
  Pencil,
  Save,
  Volume2,
  Settings2,
  Minus,
  AlertTriangle,
  Flag,
  Sparkles,
  Timer,
  BarChart2,
  Calendar,
  Layers,
  Hourglass,
  Scissors,
  Brain,
  Home,
  Loader2,
  Settings,
  Eye,
  EyeOff,
  History,
  PlusCircle,
  AlertCircle,
  MessageSquare,
  Users,
  Search,
  ShieldAlert,
  Medal,
  Flame,
  UserPlus,
  Bot,
  MoreVertical
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Helper Functions ---

const isCategoryComplete = (category: QuestCategory) => 
  category.tasks.length > 0 && category.tasks.every(t => t.status === 'completed');

const isQuestComplete = (quest: MainQuest) => 
  quest.categories.length > 0 && quest.categories.every(cat => isCategoryComplete(cat));

const getQuestBonusAmount = (categoryCount: number) => {
  if (categoryCount < 1) return 0;
  if (categoryCount < 3) return 80;
  if (categoryCount <= 5) return 120;
  return 180;
};

// Moving layout and initial state logic outside App component to fix declaration order issues
const DEFAULT_LAYOUT: ProfileLayout = { 
  widgets: [
    { id: 'identity', enabled: true, order: 0 }, 
    { id: 'skillMatrix', enabled: true, order: 1 }, 
    { id: 'evolution', enabled: true, order: 2 }, 
    { id: 'calendar', enabled: true, order: 3 }, 
    { id: 'friends', enabled: true, order: 4 },
    { id: 'objectives', enabled: true, order: 5 }
  ] 
};

const getInitialUserLocal = (): UserProfile => {
  const saved = localStorage.getItem('lvlup_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migration: Ensure all default widgets exist
      const existingIds = new Set(parsed.layout?.widgets?.map((w: any) => w.id) || []);
      const newWidgets = DEFAULT_LAYOUT.widgets.filter(w => !existingIds.has(w.id));
      
      const layout = parsed.layout ? {
          ...parsed.layout,
          widgets: [...parsed.layout.widgets, ...newWidgets]
      } : DEFAULT_LAYOUT;

      return { ...parsed, layout };
    } catch (e) {
      console.error("Failed to load user state", e);
    }
  }
  const skills: any = {};
  Object.values(SkillCategory).forEach(cat => {
    skills[cat] = { category: cat, xp: 0, level: 0 };
  });
  return { 
    name: 'Protocol-01', 
    totalXP: 0, 
    level: 0, 
    skills, 
    history: [], 
    identity: '', 
    goals: [], 
    templates: [], 
    layout: DEFAULT_LAYOUT 
  };
};

// --- Mock Data Initializers ---
const INITIAL_FRIENDS: Friend[] = [
  { id: '1', name: 'Cyber-Stalker', level: 12, xp: 4500, status: 'online', lastActive: 'Now', color: 'bg-red-500' },
  { id: '2', name: 'Neon-Drifter', level: 9, xp: 3200, status: 'offline', lastActive: '2h ago', color: 'bg-emerald-500' },
  { id: '3', name: 'Null-Pointer', level: 10, xp: 3850, status: 'online', lastActive: '5m ago', color: 'bg-amber-500' },
  { id: '4', name: 'Void-Walker', level: 8, xp: 2100, status: 'busy', lastActive: '1d ago', color: 'bg-purple-500' },
  { id: '5', name: 'Glitch-Witch', level: 15, xp: 6200, status: 'offline', lastActive: '3d ago', color: 'bg-pink-500' },
];

const INITIAL_CHALLENGES: FriendChallenge[] = [
  { id: 'c1', title: 'Sprint to Level 13', description: 'First operative to reach Level 13 secures the bounty.', opponentId: '1', metric: 'XP', targetValue: 5000, myProgress: 3950, opponentProgress: 4500, rewardXP: 500, timeLeft: '2d 4h' },
  { id: 'c2', title: 'Deep Work Protocol', description: 'Maintain focus streak. Highest habit completion count wins.', opponentId: '2', metric: 'Tasks', targetValue: 20, myProgress: 12, opponentProgress: 8, rewardXP: 250, timeLeft: '18h' },
];

// --- App Component ---

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(getInitialUserLocal);
  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('lvlup_tasks') || '[]'));
  const [mainQuests, setMainQuests] = useState<MainQuest[]>(() => JSON.parse(localStorage.getItem('lvlup_quests') || '[]')); 
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [challenges, setChallenges] = useState<FriendChallenge[]>(INITIAL_CHALLENGES);
  // Chat state lifted to App.tsx for persistence
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: `System Online. Greetings, ${user.name}. I am your designated Support AI. I have access to your skill matrix, active directives, and social protocols. How may I assist in optimizing your progression today?` }
  ]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('lvlup_quests');
    if (saved) return new Set(JSON.parse(saved).map((q: any) => q.id));
    return new Set();
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [xpPopups, setXpPopups] = useState<Record<string, number>>({});
  const [flashKey, setFlashKey] = useState(0);
  const [oraclingQuestId, setOraclingQuestId] = useState<string | null>(null);
  const [pendingQuestBonus, setPendingQuestBonus] = useState<{ qid: string, bonus: number, tid: string, questTitle: string } | null>(null);
  const [textModalConfig, setTextModalConfig] = useState<{ isOpen: boolean; type: 'quest' | 'category' | 'edit-quest' | 'edit-category' | null; parentId?: string; categoryId?: string; initialValue?: string; }>({ isOpen: false, type: null });
  const [questTaskConfig, setQuestTaskConfig] = useState<{isOpen: boolean; questId?: string; categoryId?: string; editingTask?: QuestTask | null;}>({ isOpen: false });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quests' | 'profile' | 'tools' | 'friends' | 'assistant'>('dashboard');
  const [showLevelUp, setShowLevelUp] = useState<{show: boolean, level: number} | null>(null);
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [timerTimeLeft, setTimerTimeLeft] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null);
  const [questToDelete, setQuestToDelete] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Habit Sync Logic
  useEffect(() => {
    const syncHabits = () => {
      const now = new Date();
      // "Today" at 00:00:00
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      // "Yesterday" at 00:00:00
      const yesterday = today - (24 * 60 * 60 * 1000);

      setTasks(prev => {
        let changed = false;
        const next = prev.map(t => {
          if (!t.isHabit) return t;

          // Normalize completion date to midnight timestamp
          const lastDate = t.lastCompletedDate ? new Date(t.lastCompletedDate) : null;
          const lastTime = lastDate ? new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime() : 0;

          let newCompleted = t.completed;
          let newStreak = t.streak;

          // 1. Reset if completed prior to today
          if (t.completed && lastTime < today) {
            newCompleted = false;
            changed = true;
          }

          // 2. Break streak if not completed yesterday or today
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
  }, []);

  // Play notification sound when timer ends
  const playTimerEndSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Pleasant notification tone - longer and more noticeable
      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';
      
      // Fade in and out for smoothness, but louder and longer
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.5);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch (error) {
      console.log('Audio playback not supported');
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timerEndTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((timerEndTime - now) / 1000);
        if (diff <= 0) {
          setIsTimerActive(false);
          setTimerEndTime(null);
          playTimerEndSound(); // Play notification sound
          // Automatically reset to the appropriate duration
          setTimerTimeLeft(timerMode === 'work' ? workDuration : breakDuration);
        } else {
          setTimerTimeLeft(diff);
        }
      }, 500); // Check every 500ms to correct drift quickly
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerEndTime, timerMode, workDuration, breakDuration]);

  useEffect(() => { localStorage.setItem('lvlup_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('lvlup_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('lvlup_quests', JSON.stringify(mainQuests)); }, [mainQuests]);

  const applyGlobalXPChange = (amount: number, historyId: string, popups: Record<string, number>) => {
    const newTotalXP = Math.max(0, user.totalXP + amount);
    const newLevel = calculateLevel(newTotalXP);
    if (amount > 0 && newLevel > user.level) {
      setShowLevelUp({ show: true, level: newLevel });
      setTimeout(() => setShowLevelUp(null), 3000);
    }
    setUser(prev => ({
      ...prev, totalXP: newTotalXP, level: newLevel,
      history: [{ date: new Date().toISOString(), xpGained: amount, taskId: historyId }, ...prev.history]
    }));
    setXpPopups(prev => ({ ...prev, ...popups }));
    setFlashKey(k => k + 1);
    const popupKeys = Object.keys(popups);
    setTimeout(() => setXpPopups(p => { const n = { ...p }; popupKeys.forEach(k => delete n[k]); return n; }), 1500);
  };

  // Logic for task completion on Dashboard
  const handleCompleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const xpResult = calculateXP(task);
    const amount = xpResult.total;
    
    // Increment streak if habit
    const newStreak = task.isHabit ? (task.streak || 0) + 1 : 0;

    setTasks(prev => prev.map(t => t.id === id ? { 
        ...t, 
        completed: true, 
        lastCompletedDate: new Date().toISOString(), 
        streak: newStreak 
    } : t));

    setUser(prev => {
      // Don't update specific skills if category is MISC/Default
      if (task.skillCategory === SkillCategory.MISC) return prev;

      const skill = prev.skills[task.skillCategory];
      const newSkillXP = Math.max(0, skill.xp + amount);
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [task.skillCategory]: {
            ...skill,
            xp: newSkillXP,
            level: calculateLevel(newSkillXP)
          }
        }
      };
    });
    applyGlobalXPChange(amount, id, { [id]: amount });
  };

  // Logic for undoing task completion on Dashboard
  const handleUncompleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const xpResult = calculateXP(task);
    const amount = -xpResult.total;

    // Decrement streak if habit
    const newStreak = task.isHabit ? Math.max(0, (task.streak || 0) - 1) : 0;

    setTasks(prev => prev.map(t => t.id === id ? { 
        ...t, 
        completed: false, 
        lastCompletedDate: null, 
        streak: newStreak 
    } : t));

    setUser(prev => {
      const newTotalXP = Math.max(0, prev.totalXP + amount);
      const newLevel = calculateLevel(newTotalXP);
      
      // Remove the most recent history entry for this task
      const historyIndex = prev.history.findIndex(h => h.taskId === id);
      const newHistory = historyIndex !== -1 
        ? [...prev.history.slice(0, historyIndex), ...prev.history.slice(historyIndex + 1)]
        : prev.history;

      if (task.skillCategory === SkillCategory.MISC) {
        return {
          ...prev,
          totalXP: newTotalXP,
          level: newLevel,
          history: newHistory
        };
      }

      const skill = prev.skills[task.skillCategory];
      const newSkillXP = Math.max(0, skill.xp + amount);
      return {
        ...prev,
        totalXP: newTotalXP,
        level: newLevel,
        skills: {
          ...prev.skills,
          [task.skillCategory]: {
            ...skill,
            xp: newSkillXP,
            level: calculateLevel(newSkillXP)
          }
        },
        history: newHistory
      };
    });
    
    setXpPopups(prev => ({ ...prev, [id]: amount }));
    setFlashKey(k => k + 1);
    setTimeout(() => setXpPopups(p => { const n = { ...p }; delete n[id]; return n; }), 1500);
  };

  // Saving a task as a reusable template
  const handleSaveTemplate = (task: Task) => {
    const template: TaskTemplate = {
      id: crypto.randomUUID(),
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      skillCategory: task.skillCategory,
      isHabit: task.isHabit
    };
    setUser(prev => ({
      ...prev,
      templates: [template, ...prev.templates]
    }));
  };

  const handleToggleQuestTask = (qid: string, cid: string, tid: string) => {
    setMainQuests(qs => {
      const newQuests = [...qs];
      const qIdx = newQuests.findIndex(q => q.id === qid);
      if (qIdx === -1) return qs;
      const cIdx = newQuests[qIdx].categories.findIndex(c => c.id === cid);
      if (cIdx === -1) return qs;
      const tIdx = newQuests[qIdx].categories[cIdx].tasks.findIndex(t => t.task_id === tid);
      if (tIdx === -1) return qs;

      const quest = newQuests[qIdx];
      const category = quest.categories[cIdx];
      const questTask = category.tasks[tIdx];
      const isCompleting = questTask.status !== 'completed';
      
      const mappedTaskForXP: Task = { id: questTask.task_id, difficulty: questTask.difficulty, skillCategory: questTask.skillCategory, title: questTask.name, isHabit: false, completed: questTask.status === 'completed', streak: 0, lastCompletedDate: null, createdAt: '' };
      const xpResult = calculateXP(mappedTaskForXP);
      let immediateBonusXP = 0;
      let awardedSectionBonus = false;

      if (isCompleting) {
        if (category.tasks.every(t => t.task_id === tid || t.status === 'completed')) {
          immediateBonusXP += 20;
          awardedSectionBonus = true;
        }
      } else {
        if (isCategoryComplete(category)) {
          immediateBonusXP -= 20;
          awardedSectionBonus = true;
        }
      }

      const questBonusAmount = getQuestBonusAmount(quest.categories.length);
      const baseAmount = isCompleting ? xpResult.total : -xpResult.total;
      
      if (isCompleting) {
        if (quest.categories.every(cat => cat.id === cid ? cat.tasks.every(t => t.task_id === tid || t.status === 'completed') : isCategoryComplete(cat))) {
          setPendingQuestBonus({ qid, bonus: questBonusAmount, tid, questTitle: quest.title });
        }
      } else {
        if (isQuestComplete(quest)) {
          immediateBonusXP -= questBonusAmount;
          setXpPopups(prev => ({ ...prev, [`quest-bonus-${qid}`]: -questBonusAmount }));
          setTimeout(() => setXpPopups(p => { const n = { ...p }; delete n[`quest-bonus-${qid}`]; return n; }), 1500);
        }
      }

      const totalImmediateXP = baseAmount + immediateBonusXP;
      const newTotalXP = Math.max(0, user.totalXP + totalImmediateXP);
      const newLevel = calculateLevel(newTotalXP);
      if (isCompleting && newLevel > user.level) { setShowLevelUp({ show: true, level: newLevel }); setTimeout(() => setShowLevelUp(null), 3000); }
      
      const skill = user.skills[questTask.skillCategory];
      
      setUser(prev => {
        // When uncompleting, remove the history entry for this task
        let newHistory = prev.history;
        if (!isCompleting) {
          const historyIndex = prev.history.findIndex(h => h.taskId === tid);
          if (historyIndex !== -1) {
            newHistory = [...prev.history.slice(0, historyIndex), ...prev.history.slice(historyIndex + 1)];
          }
        } else {
          newHistory = [{ date: new Date().toISOString(), xpGained: totalImmediateXP, taskId: tid }, ...prev.history];
        }
        
        return {
          ...prev, 
          totalXP: newTotalXP, 
          level: newLevel,
          skills: questTask.skillCategory === SkillCategory.MISC 
            ? prev.skills 
            : { ...prev.skills, [questTask.skillCategory]: { ...skill, xp: Math.max(0, skill.xp + baseAmount), level: calculateLevel(Math.max(0, skill.xp + baseAmount)) } },
          history: newHistory
        };
      });

      const nPopups: Record<string, number> = { [tid]: baseAmount };
      if (awardedSectionBonus) nPopups[`section-bonus-${cid}`] = isCompleting ? 20 : -20;
      setXpPopups(prev => ({ ...prev, ...nPopups }));
      setFlashKey(k => k + 1);
      setTimeout(() => setXpPopups(p => { const n = { ...p }; delete n[tid]; delete n[`section-bonus-${cid}`]; return n; }), 1500);

      newQuests[qIdx].categories[cIdx].tasks[tIdx].status = isCompleting ? 'completed' : 'pending';
      return [...newQuests];
    });
  };

  const handleConfirmQuestBonus = () => {
    if (!pendingQuestBonus) return;
    applyGlobalXPChange(pendingQuestBonus.bonus, `bonus-${pendingQuestBonus.qid}`, { [`quest-bonus-${pendingQuestBonus.qid}`]: pendingQuestBonus.bonus });
    setPendingQuestBonus(null);
  };

  const handleQuestOracle = async (quest: MainQuest) => {
    // Check if quest already has data and confirm overwrite
    if (quest.categories.length > 0) {
      if (!window.confirm("This will overwrite the existing breakdown for this quest. Proceed?")) {
        return;
      }
    }

    setOraclingQuestId(quest.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Break down the quest "${quest.title}" into strategic categories and tasks. 
        For each category, provide a comprehensive list of tasks. 
        Do not limit yourself to a small number; if a category is complex, provide 5-10 actionable steps to fully complete it. 
        Adjust the task count based on the complexity of the section.`,
        config: { 
          responseMimeType: "application/json", 
          responseSchema: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { 
                title: { type: Type.STRING }, 
                tasks: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { 
                      name: { type: Type.STRING }, 
                      difficulty: { type: Type.STRING, enum: Object.values(Difficulty) }, 
                      skillCategory: { type: Type.STRING, enum: Object.values(SkillCategory) } 
                    }, 
                    required: ["name", "difficulty", "skillCategory"] 
                  } 
                } 
              }, 
              required: ["title", "tasks"] 
            } 
          } 
        } 
      });
      const data = JSON.parse(response.text || '[]');
      const newCats = data.map((c: any) => ({ 
        id: crypto.randomUUID(), 
        title: c.title, 
        tasks: c.tasks.map((t: any) => ({ 
          task_id: crypto.randomUUID(), 
          name: t.name, 
          status: 'pending', 
          difficulty: t.difficulty, 
          skillCategory: t.skillCategory 
        })) 
      }));
      
      // REPLACE categories instead of appending
      setMainQuests(prev => prev.map(mq => mq.id === quest.id ? { ...mq, categories: newCats } : mq));
      if (!expandedNodes.has(quest.id)) toggleNode(quest.id);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setOraclingQuestId(null); 
    }
  };

  const handleDeleteQuestTask = (questId: string, categoryId: string, taskId: string) => {
    setMainQuests(qs => {
      const q = qs.find(x => x.id === questId);
      if (!q) return qs;
      const c = q.categories.find(x => x.id === categoryId);
      if (!c) return qs;
      
      const wasSecComp = isCategoryComplete(c);
      const wasQuestComp = isQuestComplete(q);
      const remainingTasks = c.tasks.filter(t => t.task_id !== taskId);
      const isSecNowComp = remainingTasks.length > 0 && remainingTasks.every(t => t.status === 'completed');
      
      if (!wasSecComp && isSecNowComp) {
        applyGlobalXPChange(20, `section-del-bonus-${categoryId}`, { [`section-bonus-${categoryId}`]: 20 });
        const updatedCategory = { ...c, tasks: remainingTasks };
        const updatedQuest = { ...q, categories: q.categories.map(cat => cat.id === categoryId ? updatedCategory : cat) };
        if (!wasQuestComp && isQuestComplete(updatedQuest)) {
          const bonus = getQuestBonusAmount(updatedQuest.categories.length);
          applyGlobalXPChange(bonus, `quest-del-bonus-${questId}`, { [`quest-bonus-${questId}`]: bonus });
        }
      }
      
      return qs.map(mq => mq.id === questId ? { ...mq, categories: mq.categories.map(cat => cat.id === categoryId ? { ...cat, tasks: cat.tasks.filter(t => t.task_id !== taskId) } : cat) } : mq);
    });
  };

  const handleDeleteCategory = (questId: string, categoryId: string) => {
    setMainQuests(qs => {
      const q = qs.find(x => x.id === questId);
      if (!q) return qs;
      const wasQuestComp = isQuestComplete(q);
      const remainingCats = q.categories.filter(c => c.id !== categoryId);
      const isQuestNowComp = remainingCats.length > 0 && remainingCats.every(cat => isCategoryComplete(cat));
      
      if (!wasQuestComp && isQuestNowComp) {
        const bonus = getQuestBonusAmount(remainingCats.length);
        applyGlobalXPChange(bonus, `quest-catdel-bonus-${questId}`, { [`quest-bonus-${questId}`]: bonus });
      }
      
      return qs.map(mq => mq.id === questId ? { ...mq, categories: mq.categories.filter(c => c.id !== categoryId) } : mq);
    });
  };

  const toggleNode = (id: string) => setExpandedNodes(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const handleDeleteQuest = (id: string) => setQuestToDelete(id);

  // Timer Handlers
  const toggleTimer = () => {
    if (isTimerActive) {
      // Pause
      setIsTimerActive(false);
      setTimerEndTime(null);
    } else {
      // Start
      const endTime = Date.now() + timerTimeLeft * 1000;
      setTimerEndTime(endTime);
      setIsTimerActive(true);
    }
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    setTimerEndTime(null);
    setTimerTimeLeft(timerMode === 'work' ? workDuration : breakDuration);
  };

  const switchTimerMode = (mode: 'work' | 'break') => {
    setTimerMode(mode);
    setIsTimerActive(false);
    setTimerEndTime(null);
    setTimerTimeLeft(mode === 'work' ? workDuration : breakDuration);
  };

  const handleAdjustTimer = (change: number) => {
    // Only allow adjusting the preset, not the running timer time, as per original logic pattern.
    // However, if we are inactive, we update the display.
    if (timerMode === 'work') {
      const n = Math.max(60, workDuration + change);
      setWorkDuration(n);
      if (!isTimerActive) setTimerTimeLeft(n);
    } else {
      const n = Math.max(60, breakDuration + change);
      setBreakDuration(n);
      if (!isTimerActive) setTimerTimeLeft(n);
    }
  };

  // AI Assistant Handlers
  const handleAiCreateTask = (task: Partial<Task>) => {
    setTasks(prev => [{
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
  };

  const handleAiCreateQuest = (title: string, categories: any[] = []) => {
    const newId = crypto.randomUUID();
    
    let questCategories: any[] = [];
    if (categories && categories.length > 0) {
         questCategories = categories.map((c: any) => ({
            id: crypto.randomUUID(),
            title: c.title,
            tasks: c.tasks.map((t: any) => ({
                task_id: crypto.randomUUID(),
                name: t.name,
                status: 'pending',
                difficulty: t.difficulty || Difficulty.EASY,
                skillCategory: t.skillCategory || SkillCategory.MISC,
                description: t.description || ''
            }))
        }));
    }

    setMainQuests(p => [{ id: newId, title: title, categories: questCategories }, ...p]);
    setExpandedNodes(prev => new Set(prev).add(newId));
  };

  const handleAiCreateChallenge = (challenge: Partial<FriendChallenge>) => {
    setChallenges(prev => [...prev, {
      id: crypto.randomUUID(),
      title: challenge.title || 'New Challenge',
      description: challenge.description || 'Defeat your opponent.',
      opponentId: challenge.opponentId || '1',
      metric: challenge.metric || 'XP',
      targetValue: challenge.targetValue || 100,
      myProgress: 0,
      opponentProgress: 0,
      rewardXP: challenge.rewardXP || 100,
      timeLeft: '7d'
    }]);
  };
  
  const handleManualCreateChallenge = (data: any) => {
    const newChallenge: FriendChallenge = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description,
        opponentId: data.opponentId,
        metric: data.metric,
        targetValue: data.targetValue,
        myProgress: 0,
        opponentProgress: 0,
        rewardXP: data.rewardXP,
        timeLeft: '7d' // Default duration
    };
    setChallenges(prev => [...prev, newChallenge]);
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' }, 
    { id: 'quests', icon: Map, label: 'Quests' }, 
    { id: 'tools', icon: BookOpen, label: 'Tools' }, 
    { id: 'friends', icon: Users, label: 'Friends' },
    { id: 'assistant', icon: Bot, label: 'Oracle' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col md:flex-row font-sans">
      <nav className="hidden md:flex w-24 lg:w-72 bg-background border-r border-secondary/10 flex-col py-10 sticky top-0 h-screen z-20 justify-between">
        <div className="flex flex-col items-center lg:items-start px-0 lg:px-10 w-full">
          <div className="flex items-center gap-3 mb-16 text-primary"><Swords size={40} /><span className="hidden lg:block text-3xl font-black uppercase tracking-tighter italic">XPeak</span></div>
          <div className="w-full space-y-4">{navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center justify-center lg:justify-start gap-4 p-5 rounded-2xl transition-all border ${activeTab === item.id ? 'bg-primary/10 border-primary/40 text-primary shadow-[0_0_15px_rgba(0,225,255,0.1)]' : 'text-secondary border-transparent hover:bg-surface hover:text-gray-100'}`}>
              <item.icon size={26} /><span className="hidden lg:block font-black uppercase tracking-widest text-xs">{item.label}</span>
            </button>
          ))}</div>
        </div>
        
        <div className="w-full px-0 lg:px-10 mt-auto">
           <button onClick={() => setIsFeedbackOpen(true)} className="w-full flex items-center justify-center lg:justify-start gap-4 p-5 rounded-2xl transition-all border text-secondary border-transparent hover:bg-surface hover:text-gray-100">
              <MessageSquare size={26} /><span className="hidden lg:block font-black uppercase tracking-widest text-xs">Feedback</span>
           </button>
        </div>
      </nav>
      <main className="flex-1 p-6 lg:p-14 pb-32 pt-20 md:pt-6 overflow-y-auto">
        {activeTab === 'profile' && (
          <ProfileView 
            user={user} 
            handleUpdateIdentity={(i:any)=>setUser(p=>({...p,identity:i}))} 
            handleAddGoal={(t:any)=>setUser(p=>({...p,goals:[{id:crypto.randomUUID(),title:t,completed:false},...p.goals]}))} 
            handleToggleGoal={(id:any)=>setUser(p=>({...p,goals:p.goals.map(g=>g.id===id?{...g,completed:!g.completed}:g)}))} 
            handleDeleteGoal={(id:any)=>setUser(p=>({...p,goals:p.goals.filter(g=>g.id!==id)}))} 
            levelProgress={getLevelProgress(user.totalXP, user.level)} 
            flashKey={flashKey} 
            layout={user.layout || DEFAULT_LAYOUT} 
            onUpdateLayout={(l:any)=>setUser(p=>({...p,layout:l}))} 
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
        {activeTab === 'dashboard' && <DashboardView user={user} tasks={tasks} handleCompleteTask={handleCompleteTask} handleUncompleteTask={handleUncompleteTask} handleDeleteTask={(id:any)=>setTasks(t=>t.filter(x=>x.id!==id))} handleEditTask={(t:any)=>{setEditingTask(t);setIsModalOpen(true);}} handleSaveTemplate={handleSaveTemplate} setIsModalOpen={setIsModalOpen} setEditingTask={setEditingTask} levelProgress={getLevelProgress(user.totalXP, user.level)} popups={xpPopups} flashKey={flashKey} />}
        {activeTab === 'quests' && <QuestsView mainQuests={mainQuests} expandedNodes={expandedNodes} toggleNode={toggleNode} setTextModalConfig={setTextModalConfig} setQuestTaskConfig={setQuestTaskConfig} handleToggleQuestTask={handleToggleQuestTask} handleQuestOracle={handleQuestOracle} oraclingQuestId={oraclingQuestId} handleDeleteQuest={handleDeleteQuest} handleDeleteCategory={handleDeleteCategory} handleDeleteQuestTask={handleDeleteQuestTask} handleSaveTemplate={handleSaveTemplate} popups={xpPopups} />}
        {activeTab === 'tools' && <ToolsView switchTimerMode={switchTimerMode} timerMode={timerMode} formatTime={(s:any)=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`} timerTimeLeft={timerTimeLeft} toggleTimer={toggleTimer} isTimerActive={isTimerActive} resetTimer={resetTimer} handleAdjustTimer={handleAdjustTimer} />}
        {activeTab === 'friends' && <FriendsView user={user} friends={friends} challenges={challenges} onCreateChallenge={() => setIsChallengeModalOpen(true)} onDeleteChallenge={(id) => setChallengeToDelete(id)} />}
        {activeTab === 'assistant' && <AssistantView user={user} tasks={tasks} quests={mainQuests} friends={friends} challenges={challenges} onAddTask={handleAiCreateTask} onAddQuest={handleAiCreateQuest} onAddChallenge={handleAiCreateChallenge} messages={aiMessages} setMessages={setAiMessages} />}
      </main>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-b border-secondary/20 p-4 flex items-center justify-center z-50">
        <div className="flex items-center gap-3">
          <Swords size={28} className="text-primary" />
          <span className="text-xl font-black uppercase tracking-tighter italic text-primary">XPeak</span>
        </div>
      </div>

      {/* Restored Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-secondary/20 p-4 flex justify-around z-50 pb-safe">
         {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={activeTab === item.id ? 'text-primary' : 'text-secondary'}>
               <item.icon size={24} />
            </button>
         ))}
         <button onClick={() => setIsFeedbackOpen(true)} className="text-secondary hover:text-primary">
            <MessageSquare size={24} />
         </button>
      </div>

      {pendingQuestBonus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-surface border-2 border-primary/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(0,225,255,0.2)] animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20"><Trophy size={40} className="text-primary animate-bounce" /></div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">Quest Finalized?</h2>
              <p className="text-secondary text-sm font-medium mb-8 leading-relaxed">Strategic objective <span className="text-white font-bold">"{pendingQuestBonus.questTitle}"</span> appears fully neutralized. Deploy final completion rewards?</p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleConfirmQuestBonus} className="w-full bg-primary hover:bg-cyan-400 text-background font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"><Sparkles size={18} /> Confirm Completion</button>
                 <button onClick={() => setPendingQuestBonus(null)} className="w-full bg-surface border border-secondary/30 text-secondary hover:text-white font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all">Not Yet</button>
              </div>
           </div>
        </div>
      )}
      
      <DeleteConfirmModal 
       isOpen={!!questToDelete} 
       onClose={() => setQuestToDelete(null)}
       onConfirm={() => {
           if (questToDelete) {
               setMainQuests(p => p.filter(q => q.id !== questToDelete));
               setQuestToDelete(null);
           }
       }}
       title="Delete Quest?"
       description="Are you sure you want to delete this quest? This action cannot be undone."
      />

      <DeleteConfirmModal 
       isOpen={!!challengeToDelete} 
       onClose={() => setChallengeToDelete(null)}
       onConfirm={() => {
           if (challengeToDelete) {
               setChallenges(p => p.filter(c => c.id !== challengeToDelete));
               setChallengeToDelete(null);
           }
       }}
       title="Abort Contract?"
       description="Are you sure you want to cancel this challenge? All progress will be lost."
      />

      <CreateTaskModal 
        isOpen={isModalOpen || questTaskConfig.isOpen} 
        onClose={()=>{setIsModalOpen(false); setQuestTaskConfig({isOpen:false});}} 
        isQuestTask={questTaskConfig.isOpen}
        onSubmit={(d)=>{ 
            if (questTaskConfig.isOpen) {
                setMainQuests(qs => {
                    const q = qs.find(x => x.id === questTaskConfig.questId);
                    const c = q?.categories.find(x => x.id === questTaskConfig.categoryId);
                    if (!q || !c) return qs;

                    if (questTaskConfig.editingTask) {
                        return qs.map(mq => mq.id === questTaskConfig.questId ? { ...mq, categories: mq.categories.map(cat => cat.id === questTaskConfig.categoryId ? { ...cat, tasks: cat.tasks.map(t => t.task_id === questTaskConfig.editingTask?.task_id ? { ...t, name: d.title, difficulty: d.difficulty, skillCategory: d.skillCategory, description: d.description } : t) } : cat) } : mq);
                    } else {
                        if (isCategoryComplete(c)) applyGlobalXPChange(-20, `sec-add-revoke-${c.id}`, { [`section-bonus-${c.id}`]: -20 });
                        if (isQuestComplete(q)) {
                            const bonus = getQuestBonusAmount(q.categories.length);
                            applyGlobalXPChange(-bonus, `quest-add-revoke-${q.id}`, { [`quest-bonus-${q.id}`]: -bonus });
                        }
                        return qs.map(mq => mq.id === questTaskConfig.questId ? { ...mq, categories: mq.categories.map(cat => cat.id === questTaskConfig.categoryId ? { ...cat, tasks: [...cat.tasks, { task_id: crypto.randomUUID(), name: d.title, status: 'pending', difficulty: d.difficulty, skillCategory: d.skillCategory, description: d.description }] } : cat) } : mq);
                    }
                });
                setQuestTaskConfig({isOpen:false});
            } else {
                if(editingTask) setTasks(p=>p.map(t=>t.id===editingTask.id?{...t,...d}:t)); 
                else setTasks(p=>[{id:crypto.randomUUID(),...d,completed:false,streak:0,lastCompletedDate:null,createdAt:new Date().toISOString()},...p]); 
                setIsModalOpen(false); 
            }
        }} 
        editingTask={questTaskConfig.editingTask ? { id: questTaskConfig.editingTask.task_id, title: questTaskConfig.editingTask.name, description: questTaskConfig.editingTask.description || '', difficulty: questTaskConfig.editingTask.difficulty, skillCategory: questTaskConfig.editingTask.skillCategory, isHabit: false, completed: false, streak: 0, lastCompletedDate: null, createdAt: '' } : editingTask} 
        templates={user.templates} onSaveTemplate={(data)=>setUser(p=>({...p,templates:[...p.templates,{id:crypto.randomUUID(),...data}]}))} onDeleteTemplate={(id)=>setUser(p=>({...p,templates:p.templates.filter(t=>t.id!==id)}))} 
      />

      <SimpleInputModal 
        isOpen={textModalConfig.isOpen} onClose={()=>setTextModalConfig({isOpen:false,type:null})} 
        title={textModalConfig.type === 'edit-quest' ? 'Modify Quest Identifier' : textModalConfig.type === 'edit-category' ? 'Modify Section Title' : `Deploy New ${textModalConfig.type === 'category' ? 'Section' : 'Main Quest'}`} 
        placeholder="Enter identifier..." initialValue={textModalConfig.initialValue}
        onSubmit={(v)=>{ 
            if(textModalConfig.type==='quest') {
                const newId = crypto.randomUUID();
                setMainQuests(p=>[{id: newId, title:v, categories:[]},...p]); 
                setExpandedNodes(prev => new Set(prev).add(newId));
            } else if (textModalConfig.type === 'edit-quest') {
                setMainQuests(p => p.map(q => q.id === textModalConfig.parentId ? { ...q, title: v } : q));
            } else if (textModalConfig.type === 'edit-category') {
                setMainQuests(p => p.map(q => q.id === textModalConfig.parentId ? { ...q, categories: q.categories.map(c => c.id === textModalConfig.categoryId ? { ...c, title: v } : c) } : q));
            } else {
                setMainQuests(p=>p.map(mq=>{
                    if (mq.id===textModalConfig.parentId) {
                        if (isQuestComplete(mq)) {
                            const bonus = getQuestBonusAmount(mq.categories.length);
                            applyGlobalXPChange(-bonus, `quest-cat-revoke-${mq.id}`, { [`quest-bonus-${mq.id}`]: -bonus });
                        }
                        return {...mq, categories:[...mq.categories,{id:crypto.randomUUID(),title:v,tasks:[]}]};
                    }
                    return mq;
                })); 
            }
        }} 
      />
      
      <CreateChallengeModal 
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        friends={friends}
        onSubmit={handleManualCreateChallenge}
      />

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      
      {isSettingsOpen && <SettingsView user={user} onClose={() => setIsSettingsOpen(false)} />}
      
      {showLevelUp && <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-3xl animate-in zoom-in-95 duration-700"><Trophy size={160} className="text-primary animate-bounce shadow-primary/50" /><h2 className="text-8xl font-black text-primary mt-12 mb-4 tracking-tighter uppercase italic drop-shadow-[0_0_30px_rgba(0,225,255,0.6)]">Level Up</h2><p className="text-3xl text-white font-black uppercase tracking-widest">Protocol Rank {showLevelUp.level} Authenticated</p></div>}
    </div>
  );
};

export default App;
