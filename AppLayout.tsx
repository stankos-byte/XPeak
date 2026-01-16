
import React, { useState, useEffect } from 'react';
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
  Friend,
  FriendChallenge,
  ChatMessage,
  ChallengeQuestCategory,
  ChallengeQuestTask,
  ChallengeModeType
} from './types';
import { calculateXP, calculateLevel, getLevelProgress, calculateChallengeXP } from './utils/gamification';
import { storage, STORAGE_KEYS } from './services/localStorage';
import { useTimer } from './hooks/useTimer';
import { useHabitSync } from './hooks/useHabitSync';
import { gameToast } from './components/ui/GameToast';
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
  BookOpen,
  CheckSquare,
  Map,
  Sparkles,
  MessageSquare,
  Users,
  Bot,
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
  const getDefaultUser = (): UserProfile => {
    const skills = {} as Record<SkillCategory, { category: SkillCategory; xp: number; level: number }>;
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

  const saved = storage.get<UserProfile | null>(STORAGE_KEYS.USER, null);
  
  if (saved) {
    // Migration: Ensure all default widgets exist
    const existingIds = new Set(saved.layout?.widgets?.map((w) => w.id) || []);
    const newWidgets = DEFAULT_LAYOUT.widgets.filter(w => !existingIds.has(w.id));
    
    const layout = saved.layout ? {
        ...saved.layout,
        widgets: [...saved.layout.widgets, ...newWidgets]
    } : DEFAULT_LAYOUT;

    return { ...saved, layout };
  }
  
  return getDefaultUser();
};

// --- Mock Data Initializers ---
const INITIAL_FRIENDS: Friend[] = [
  { id: '1', name: 'Cyber-Stalker', level: 12, xp: 4500, status: 'online', lastActive: 'Now', color: '#ef4444' },
  { id: '2', name: 'Neon-Drifter', level: 9, xp: 3200, status: 'offline', lastActive: '2h ago', color: '#10b981' },
  { id: '3', name: 'Null-Pointer', level: 10, xp: 3850, status: 'online', lastActive: '5m ago', color: '#f59e0b' },
  { id: '4', name: 'Void-Walker', level: 8, xp: 2100, status: 'busy', lastActive: '1d ago', color: '#a855f7' },
  { id: '5', name: 'Glitch-Witch', level: 15, xp: 6200, status: 'offline', lastActive: '3d ago', color: '#ec4899' },
];

const INITIAL_CHALLENGES: FriendChallenge[] = [
  { 
    id: 'c1', 
    title: 'Sprint to Level 13', 
    description: 'First operative to reach Level 13 secures the bounty.', 
    partnerIds: ['1'],
    mode: 'competitive',
    categories: [
      {
        id: 'cat1',
        title: 'Week 1 - Foundation',
        tasks: [
          { task_id: 't1', name: '30min morning workout', myStatus: 'completed', opponentStatus: 'completed', difficulty: Difficulty.EASY, skillCategory: SkillCategory.PHYSICAL },
          { task_id: 't2', name: 'Read 20 pages', myStatus: 'completed', opponentStatus: 'in-progress', difficulty: Difficulty.EASY, skillCategory: SkillCategory.MENTAL },
          { task_id: 't3', name: 'Complete coding challenge', myStatus: 'in-progress', opponentStatus: 'pending', difficulty: Difficulty.MEDIUM, skillCategory: SkillCategory.PROFESSIONAL },
        ]
      },
      {
        id: 'cat2',
        title: 'Week 2 - Intensity',
        tasks: [
          { task_id: 't4', name: '45min cardio session', myStatus: 'pending', opponentStatus: 'pending', difficulty: Difficulty.MEDIUM, skillCategory: SkillCategory.PHYSICAL },
          { task_id: 't5', name: 'Learn new programming concept', myStatus: 'pending', opponentStatus: 'pending', difficulty: Difficulty.HARD, skillCategory: SkillCategory.PROFESSIONAL },
        ]
      }
    ],
    timeLeft: '2d 4h' 
  },
  { 
    id: 'c2', 
    title: 'Deep Work Protocol', 
    description: 'Work together to complete all productivity tasks.', 
    partnerIds: ['2'],
    mode: 'coop',
    categories: [
      {
        id: 'cat3',
        title: 'Daily Rituals',
        tasks: [
          { task_id: 't6', name: 'Morning meditation 10min', status: 'completed', completedBy: 'Protocol-01', difficulty: Difficulty.EASY, skillCategory: SkillCategory.MENTAL },
          { task_id: 't7', name: 'Journal 5 min', status: 'pending', difficulty: Difficulty.EASY, skillCategory: SkillCategory.CREATIVE },
        ]
      }
    ],
    timeLeft: '18h' 
  },
];

// --- App Component ---

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(getInitialUserLocal);
  const [tasks, setTasks] = useState<Task[]>(() => storage.get<Task[]>(STORAGE_KEYS.TASKS, []));
  const [mainQuests, setMainQuests] = useState<MainQuest[]>(() => storage.get<MainQuest[]>(STORAGE_KEYS.QUESTS, [])); 
  const friends = INITIAL_FRIENDS;
  const [challenges, setChallenges] = useState<FriendChallenge[]>(INITIAL_CHALLENGES);
  // Chat state lifted to App.tsx for persistence
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: `System Online. Greetings, ${user.name}. I am your designated Support AI. I have access to your skill matrix, active directives, and social protocols. How may I assist in optimizing your progression today?` }
  ]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const quests = storage.get<MainQuest[]>(STORAGE_KEYS.QUESTS, []);
    return new Set(quests.map((q: MainQuest) => q.id));
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
  const [questToDelete, setQuestToDelete] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<FriendChallenge | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Use custom hooks for timer and habit sync
  const timer = useTimer(25 * 60, 5 * 60);
  useHabitSync(tasks, setTasks);

  // Save to localStorage with error handling
  useEffect(() => { storage.set(STORAGE_KEYS.USER, user); }, [user]);
  useEffect(() => { storage.set(STORAGE_KEYS.TASKS, tasks); }, [tasks]);
  useEffect(() => { storage.set(STORAGE_KEYS.QUESTS, mainQuests); }, [mainQuests]);

  const applyGlobalXPChange = (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => {
    setUser(prev => {
      const newTotalXP = Math.max(0, prev.totalXP + amount);
      const newLevel = calculateLevel(newTotalXP);
      
      if (amount > 0 && newLevel > prev.level) {
        setShowLevelUp({ show: true, level: newLevel });
        gameToast.levelUp(newLevel);
        setTimeout(() => setShowLevelUp(null), 3000);
      }

      let newSkills = prev.skills;
      if (skillCategory && skillCategory !== SkillCategory.MISC) {
        const amountToGrant = skillAmount !== undefined ? skillAmount : amount;
        const skill = prev.skills[skillCategory];
        const newSkillXP = Math.max(0, skill.xp + amountToGrant);
        newSkills = {
          ...prev.skills,
          [skillCategory]: {
            ...skill,
            xp: newSkillXP,
            level: calculateLevel(newSkillXP)
          }
        };
      }

      return {
        ...prev,
        totalXP: newTotalXP,
        level: newLevel,
        skills: newSkills,
        history: [{ date: new Date().toISOString(), xpGained: amount, taskId: historyId }, ...prev.history]
      };
    });

    // Show toast notification for XP changes
    if (amount > 0) {
      const category = skillCategory && skillCategory !== SkillCategory.MISC ? skillCategory : undefined;
      gameToast.xp(amount, category ? `${category} skill boost` : undefined);
    }

    setXpPopups((prev: Record<string, number>) => ({ ...prev, ...popups }));
    setFlashKey((k: number) => k + 1);
    const popupKeys = Object.keys(popups);
    setTimeout(() => setXpPopups((p: Record<string, number>) => { 
      const n = { ...p }; 
      popupKeys.forEach((k: string) => delete n[k]); 
      return n; 
    }), 1500);
  };

  // Logic for task completion on Dashboard
  const handleCompleteTask = (id: string) => {
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

    applyGlobalXPChange(amount, id, { [id]: amount }, task.skillCategory);

    // Show streak toast for habits with streaks > 1
    if (task.isHabit && newStreak > 1) {
      setTimeout(() => gameToast.streak(newStreak, task.title), 500);
    }
  };

  // Logic for undoing task completion on Dashboard
  const handleUncompleteTask = (id: string) => {
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

    applyGlobalXPChange(amount, id, { [id]: amount }, task.skillCategory);
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
    const q = mainQuests.find(x => x.id === qid);
    const c = q?.categories.find(x => x.id === cid);
    const t = c?.tasks.find(x => x.task_id === tid);
    if (!q || !c || !t) return;

    const isCompleting = t.status !== 'completed';
    const xpResult = calculateXP({ 
      difficulty: t.difficulty, 
      skillCategory: t.skillCategory, 
      title: t.name 
    } as Task);
    
    const baseAmount = isCompleting ? xpResult.total : -xpResult.total;
    let bonusAmount = 0;
    let popups: Record<string, number> = { [tid]: baseAmount };

    // Section Bonus
    const isCategoryCompleting = isCompleting && c.tasks.every(task => task.task_id === tid || task.status === 'completed');
    const wasCategoryComplete = !isCompleting && isCategoryComplete(c);
    
    if (isCategoryCompleting) {
      bonusAmount += 20;
      popups[`section-bonus-${cid}`] = 20;
    } else if (wasCategoryComplete) {
      bonusAmount -= 20;
      popups[`section-bonus-${cid}`] = -20;
    }

    // Award Quest Bonus
    const questBonusValue = getQuestBonusAmount(q.categories.length);
    const isQuestCompleting = isCompleting && q.categories.every((cat: QuestCategory) => 
      cat.id === cid 
        ? cat.tasks.every((task: QuestTask) => task.task_id === tid || task.status === 'completed')
        : isCategoryComplete(cat)
    );
    const wasQuestCompleteBefore = !isCompleting && isQuestComplete(q);

    if (isQuestCompleting) {
      setPendingQuestBonus({ qid, bonus: questBonusValue, tid, questTitle: q.title });
    } else if (wasQuestCompleteBefore) {
      bonusAmount -= questBonusValue;
      popups[`quest-bonus-${qid}`] = -questBonusValue;
    }

    // Update Quests State
    setMainQuests((qs: MainQuest[]) => qs.map((mq: MainQuest) => mq.id !== qid ? mq : {
      ...mq,
      categories: mq.categories.map((cat: QuestCategory) => cat.id !== cid ? cat : {
        ...cat,
        tasks: cat.tasks.map((task: QuestTask) => task.task_id !== tid ? task : {
          ...task,
          status: isCompleting ? 'completed' : 'pending'
        } as QuestTask)
      })
    }));

    // Grant XP using the new safe function
    applyGlobalXPChange(baseAmount + bonusAmount, tid, popups, t.skillCategory, baseAmount);
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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
      const newCats = data.map((c: { title: string; tasks: any[] }) => ({ 
        id: crypto.randomUUID(), 
        title: c.title, 
        tasks: c.tasks.map((t: { name: string; difficulty: Difficulty; skillCategory: SkillCategory }) => ({ 
          task_id: crypto.randomUUID(), 
          name: t.name, 
          status: 'pending', 
          difficulty: t.difficulty, 
          skillCategory: t.skillCategory 
        })) 
      }));
      
      // REPLACE categories instead of appending
      setMainQuests((prev: MainQuest[]) => prev.map((mq: MainQuest) => mq.id === quest.id ? { ...mq, categories: newCats } : mq));
      if (!expandedNodes.has(quest.id)) toggleNode(quest.id);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setOraclingQuestId(null); 
    }
  };

  const handleDeleteQuestTask = (questId: string, categoryId: string, taskId: string) => {
    const q = mainQuests.find((x: MainQuest) => x.id === questId);
    const c = q?.categories.find((x: QuestCategory) => x.id === categoryId);
    if (!q || !c) return;

    const wasSecComp = isCategoryComplete(c);
    const wasQuestComp = isQuestComplete(q);
    const remainingTasks = c.tasks.filter((t: QuestTask) => t.task_id !== taskId);
    const isSecNowComp = remainingTasks.length > 0 && remainingTasks.every((t: QuestTask) => t.status === 'completed');
    
    let bonuses: { amount: number; type: string; key: string; }[] = [];

    if (!wasSecComp && isSecNowComp) {
      bonuses.push({ amount: 20, type: `section-del-bonus-${categoryId}`, key: `section-bonus-${categoryId}` });
      
      const updatedQuest = { 
        ...q, 
        categories: q.categories.map((cat: QuestCategory) => cat.id === categoryId ? { ...cat, tasks: remainingTasks } : cat) 
      };
      
      if (!wasQuestComp && isQuestComplete(updatedQuest)) {
        const bonus = getQuestBonusAmount(updatedQuest.categories.length);
        bonuses.push({ amount: bonus, type: `quest-del-bonus-${questId}`, key: `quest-bonus-${questId}` });
      }
    }

    setMainQuests((qs: MainQuest[]) => qs.map((mq: MainQuest) => mq.id === questId ? { 
      ...mq, 
      categories: mq.categories.map((cat: QuestCategory) => cat.id === categoryId ? { ...cat, tasks: remainingTasks } : cat) 
    } : mq));

    bonuses.forEach(b => applyGlobalXPChange(b.amount, b.type, { [b.key]: b.amount }));
  };

  const handleDeleteCategory = (questId: string, categoryId: string) => {
    const q = mainQuests.find((x: MainQuest) => x.id === questId);
    if (!q) return;

    const wasQuestComp = isQuestComplete(q);
    const remainingCats = q.categories.filter((c: QuestCategory) => c.id !== categoryId);
    const isQuestNowComp = remainingCats.length > 0 && remainingCats.every((cat: QuestCategory) => isCategoryComplete(cat));
    
    let bonus: { amount: number; type: string; key: string; } | null = null;

    if (!wasQuestComp && isQuestNowComp) {
      const bonusValue = getQuestBonusAmount(remainingCats.length);
      bonus = { amount: bonusValue, type: `quest-catdel-bonus-${questId}`, key: `quest-bonus-${questId}` };
    }

    setMainQuests((qs: MainQuest[]) => qs.map((mq: MainQuest) => mq.id === questId ? { ...mq, categories: remainingCats } : mq));

    if (bonus) {
      applyGlobalXPChange(bonus.amount, bonus.type, { [bonus.key]: bonus.amount });
    }
  };

  const toggleNode = (id: string) => setExpandedNodes((p: Set<string>) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const handleDeleteQuest = (id: string) => setQuestToDelete(id);

  // Timer handlers now come from useTimer hook

  // AI Assistant Handlers
  const handleAiCreateTask = (task: Partial<Task>) => {
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
  };

  const handleAiCreateQuest = (title: string, categories: { title: string; tasks: { name: string; difficulty?: Difficulty; skillCategory?: SkillCategory; description?: string }[] }[] = []) => {
    const newId = crypto.randomUUID();
    
    let questCategories: QuestCategory[] = [];
    if (categories && categories.length > 0) {
         questCategories = categories.map((c) => ({
            id: crypto.randomUUID(),
            title: c.title,
            tasks: c.tasks.map((t) => ({
                task_id: crypto.randomUUID(),
                name: t.name,
                status: 'pending',
                difficulty: t.difficulty || Difficulty.EASY,
                skillCategory: t.skillCategory || SkillCategory.MISC,
                description: t.description || ''
            }))
        }));
    }

    setMainQuests((p: MainQuest[]) => [{ id: newId, title: title, categories: questCategories }, ...p]);
    setExpandedNodes((prev: Set<string>) => new Set(prev).add(newId));
  };

  const handleAiCreateChallenge = (challenge: Partial<FriendChallenge>) => {
    setChallenges((prev: FriendChallenge[]) => [...prev, {
      id: crypto.randomUUID(),
      title: challenge.title || 'New Challenge',
      description: challenge.description || 'Defeat your opponent.',
      partnerIds: challenge.partnerIds || ['1'],
      mode: challenge.mode || 'competitive',
      categories: challenge.categories || [],
      timeLeft: '7d'
    }]);
  };
  
  const handleManualCreateChallenge = (data: { title: string; description: string; partnerIds: string[]; categories: ChallengeQuestCategory[]; mode: ChallengeModeType }) => {
    if (editingChallenge) {
      // Update existing challenge
      setChallenges((prev: FriendChallenge[]) => prev.map((c: FriendChallenge) => c.id === editingChallenge.id ? {
        ...c,
        title: data.title,
        description: data.description || '',
        partnerIds: data.partnerIds,
        mode: data.mode || 'competitive',
        categories: data.categories || []
      } : c));
      setEditingChallenge(null);
    } else {
      // Create new challenge
      const newChallenge: FriendChallenge = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description || '',
        partnerIds: data.partnerIds,
        mode: data.mode || 'competitive',
        categories: data.categories || [],
        timeLeft: '7d' // Default duration
      };
      setChallenges((prev: FriendChallenge[]) => [...prev, newChallenge]);
    }
  };

  const handleEditChallenge = (challenge: FriendChallenge) => {
    setEditingChallenge(challenge);
    setIsChallengeModalOpen(true);
  };

  // Handle challenge task completion
  const handleToggleChallengeTask = (challengeId: string, categoryId: string, taskId: string) => {
    setChallenges((prev: FriendChallenge[]) => prev.map((challenge: FriendChallenge) => {
      if (challenge.id !== challengeId) return challenge;
      if (challenge.completedBy) return challenge; // Already completed, no changes

      const isCoop = challenge.mode === 'coop';

      // Toggle the task status based on mode
      const updatedCategories = challenge.categories.map((cat: ChallengeQuestCategory) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          tasks: cat.tasks.map((task: ChallengeQuestTask) => {
            if (task.task_id !== taskId) return task;
            
            if (isCoop) {
              // Co-op: toggle unified status and track who completed it
              const newStatus = task.status === 'completed' ? 'pending' : 'completed';
              return { 
                ...task, 
                status: newStatus,
                completedBy: newStatus === 'completed' ? user.name : undefined
              } as ChallengeQuestTask;
            } else {
              // Competitive: toggle myStatus only
              const newStatus = task.myStatus === 'completed' ? 'pending' : 'completed';
              return { ...task, myStatus: newStatus } as ChallengeQuestTask;
            }
          })
        };
      });

      const updatedChallenge = { ...challenge, categories: updatedCategories };

      // Check if all tasks are now completed
      const allTasksCompleted = isCoop
        ? updatedCategories.every((cat: ChallengeQuestCategory) => cat.tasks.every((task: ChallengeQuestTask) => task.status === 'completed'))
        : updatedCategories.every((cat: ChallengeQuestCategory) => cat.tasks.every((task: ChallengeQuestTask) => task.myStatus === 'completed'));

      // If all tasks completed, award XP and mark challenge as complete
      if (allTasksCompleted && !challenge.completedBy) {
        const challengeXP = calculateChallengeXP(updatedChallenge);
        
        if (isCoop) {
          // Co-op: Award total XP to user
          applyGlobalXPChange(challengeXP, `challenge-${challengeId}`, { [`challenge-${challengeId}`]: challengeXP });
          
          // Award skill XP only for tasks completed by this user
          updatedCategories.forEach((cat: ChallengeQuestCategory) => {
            cat.tasks.forEach((task: ChallengeQuestTask) => {
              if (task.completedBy === user.name && task.status === 'completed') {
                const taskXP = calculateXP({ difficulty: task.difficulty } as any).total;
                const skill = user.skills[task.skillCategory];
                if (skill) {
                  const newSkillXP = skill.xp + taskXP;
                  setUser(prev => ({
                    ...prev,
                    skills: {
                      ...prev.skills,
                      [task.skillCategory]: {
                        ...skill,
                        xp: newSkillXP,
                        level: calculateLevel(newSkillXP)
                      }
                    }
                  }));
                }
              }
            });
          });
        } else {
          // Competitive: Award all XP (total + skill) to winner
          applyGlobalXPChange(challengeXP, `challenge-${challengeId}`, { [`challenge-${challengeId}`]: challengeXP });
        }
        
        // Mark challenge as complete
        return {
          ...updatedChallenge,
          completedBy: user.name,
          completedAt: new Date().toISOString()
        };
      }

      return updatedChallenge;
    }));
  };

  const navItems = [
    { id: 'dashboard', icon: CheckSquare, label: 'Tasks' }, 
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
      {/* Main Layout */}
      <main className="flex-1 p-6 lg:p-14 pb-32 pt-20 md:pt-6 overflow-y-auto">
        {activeTab === 'profile' && (
          <ProfileView 
            user={user} 
            handleUpdateIdentity={(i: string) => setUser((p: UserProfile) => ({ ...p, identity: i }))} 
            handleAddGoal={(t: string) => setUser((p: UserProfile) => ({ ...p, goals: [{ id: crypto.randomUUID(), title: t, completed: false }, ...p.goals] }))} 
            handleToggleGoal={(id: string) => setUser((p: UserProfile) => ({ ...p, goals: p.goals.map((g: Goal) => g.id === id ? { ...g, completed: !g.completed } : g) }))} 
            handleDeleteGoal={(id: string) => setUser((p: UserProfile) => ({ ...p, goals: p.goals.filter((g: Goal) => g.id !== id) }))} 
            levelProgress={getLevelProgress(user.totalXP, user.level)} 
            flashKey={flashKey} 
            layout={user.layout || DEFAULT_LAYOUT} 
            onUpdateLayout={(l: ProfileLayout) => setUser((p: UserProfile) => ({ ...p, layout: l }))} 
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
        {activeTab === 'dashboard' && <DashboardView user={user} tasks={tasks} handleCompleteTask={handleCompleteTask} handleUncompleteTask={handleUncompleteTask} handleDeleteTask={(id: string) => setTasks((t: Task[]) => t.filter((x: Task) => x.id !== id))} handleEditTask={(t: Task) => { setEditingTask(t); setIsModalOpen(true); }} handleSaveTemplate={handleSaveTemplate} setIsModalOpen={setIsModalOpen} setEditingTask={setEditingTask} levelProgress={getLevelProgress(user.totalXP, user.level)} popups={xpPopups} flashKey={flashKey} />}
        {activeTab === 'quests' && <QuestsView mainQuests={mainQuests} expandedNodes={expandedNodes} toggleNode={toggleNode} setTextModalConfig={setTextModalConfig} setQuestTaskConfig={setQuestTaskConfig} handleToggleQuestTask={handleToggleQuestTask} handleQuestOracle={handleQuestOracle} oraclingQuestId={oraclingQuestId} handleDeleteQuest={handleDeleteQuest} handleDeleteCategory={handleDeleteCategory} handleDeleteQuestTask={handleDeleteQuestTask} handleSaveTemplate={handleSaveTemplate} popups={xpPopups} />}
        {activeTab === 'tools' && <ToolsView switchTimerMode={timer.switchMode} timerMode={timer.mode} formatTime={(s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`} timerTimeLeft={timer.timeLeft} toggleTimer={timer.toggleTimer} isTimerActive={timer.isActive} resetTimer={timer.resetTimer} handleAdjustTimer={timer.adjustTimer} />}
        {activeTab === 'friends' && <FriendsView user={user} friends={friends} challenges={challenges} onCreateChallenge={() => setIsChallengeModalOpen(true)} onEditChallenge={handleEditChallenge} onDeleteChallenge={(id: string) => setChallengeToDelete(id)} onToggleChallengeTask={handleToggleChallengeTask} />}
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
               setMainQuests((p: MainQuest[]) => p.filter((q: MainQuest) => q.id !== questToDelete));
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
               setChallenges((p: FriendChallenge[]) => p.filter((c: FriendChallenge) => c.id !== challengeToDelete));
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
        onSubmit={(d: any)=>{ 
            if (questTaskConfig.isOpen) {
                setMainQuests((qs: MainQuest[]) => {
                    const q = qs.find((x: MainQuest) => x.id === questTaskConfig.questId);
                    const c = q?.categories.find((x: QuestCategory) => x.id === questTaskConfig.categoryId);
                    if (!q || !c) return qs;

                    if (questTaskConfig.editingTask) {
                        return qs.map((mq: MainQuest) => mq.id === questTaskConfig.questId ? { ...mq, categories: mq.categories.map((cat: QuestCategory) => cat.id === questTaskConfig.categoryId ? { ...cat, tasks: cat.tasks.map((t: QuestTask) => t.task_id === questTaskConfig.editingTask?.task_id ? { ...t, name: d.title, difficulty: d.difficulty, skillCategory: d.skillCategory, description: d.description } : t) } : cat) } : mq);
                    } else {
                        if (isCategoryComplete(c)) applyGlobalXPChange(-20, `sec-add-revoke-${c.id}`, { [`section-bonus-${c.id}`]: -20 });
                        if (isQuestComplete(q)) {
                            const bonus = getQuestBonusAmount(q.categories.length);
                            applyGlobalXPChange(-bonus, `quest-add-revoke-${q.id}`, { [`quest-bonus-${q.id}`]: -bonus });
                        }
                        return qs.map((mq: MainQuest) => mq.id === questTaskConfig.questId ? { ...mq, categories: mq.categories.map((cat: QuestCategory) => cat.id === questTaskConfig.categoryId ? { ...cat, tasks: [...cat.tasks, { task_id: crypto.randomUUID(), name: d.title, status: 'pending', difficulty: d.difficulty, skillCategory: d.skillCategory, description: d.description } as QuestTask] } : cat) } : mq);
                    }
                });
                setQuestTaskConfig({isOpen:false});
            } else {
                if(editingTask) setTasks((p: Task[])=>p.map((t: Task)=>t.id===editingTask.id?{...t,...d}:t)); 
                else setTasks((p: Task[])=>[{id:crypto.randomUUID(),...d,completed:false,streak:0,lastCompletedDate:null,createdAt:new Date().toISOString()},...p]); 
                setIsModalOpen(false); 
            }
        }} 
        editingTask={questTaskConfig.editingTask ? { id: questTaskConfig.editingTask.task_id, title: questTaskConfig.editingTask.name, description: questTaskConfig.editingTask.description || '', difficulty: questTaskConfig.editingTask.difficulty, skillCategory: questTaskConfig.editingTask.skillCategory, isHabit: false, completed: false, streak: 0, lastCompletedDate: null, createdAt: '' } : editingTask} 
        templates={user.templates} onSaveTemplate={(data: any)=>setUser((p: UserProfile)=>({...p,templates:[...p.templates,{id:crypto.randomUUID(),...data}]}))} onDeleteTemplate={(id: string)=>setUser((p: UserProfile)=>({...p,templates:p.templates.filter((t: TaskTemplate)=>t.id!==id)}))} 
      />

      <SimpleInputModal 
        isOpen={textModalConfig.isOpen} onClose={()=>setTextModalConfig({isOpen:false,type:null})} 
        title={textModalConfig.type === 'edit-quest' ? 'Modify Quest Identifier' : textModalConfig.type === 'edit-category' ? 'Modify Section Title' : `Deploy New ${textModalConfig.type === 'category' ? 'Section' : 'Main Quest'}`} 
        placeholder="Enter identifier..." initialValue={textModalConfig.initialValue}
        onSubmit={(v: string)=>{ 
            if(textModalConfig.type==='quest') {
                const newId = crypto.randomUUID();
                setMainQuests((p: MainQuest[])=>[{id: newId, title:v, categories:[]},...p]); 
                setExpandedNodes((prev: Set<string>) => new Set(prev).add(newId));
            } else if (textModalConfig.type === 'edit-quest') {
                setMainQuests((p: MainQuest[]) => p.map((q: MainQuest) => q.id === textModalConfig.parentId ? { ...q, title: v } : q));
            } else if (textModalConfig.type === 'edit-category') {
                setMainQuests((p: MainQuest[]) => p.map((q: MainQuest) => q.id === textModalConfig.parentId ? { ...q, categories: q.categories.map((c: QuestCategory) => c.id === textModalConfig.categoryId ? { ...c, title: v } : c) } : q));
            } else {
                setMainQuests((p: MainQuest[])=>p.map((mq: MainQuest)=>{
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
        onClose={() => {
          setIsChallengeModalOpen(false);
          setEditingChallenge(null);
        }}
        friends={friends}
        editingChallenge={editingChallenge}
        onSubmit={handleManualCreateChallenge}
      />

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      
      {isSettingsOpen && <SettingsView user={user} onClose={() => setIsSettingsOpen(false)} />}
      
      {showLevelUp && <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-3xl animate-in zoom-in-95 duration-700"><Trophy size={160} className="text-primary animate-bounce shadow-primary/50" /><h2 className="text-8xl font-black text-primary mt-12 mb-4 tracking-tighter uppercase italic drop-shadow-[0_0_30px_rgba(0,225,255,0.6)]">Level Up</h2><p className="text-3xl text-white font-black uppercase tracking-widest">Protocol Rank {showLevelUp.level} Authenticated</p></div>}
    </div>
  );
};

export default App;
