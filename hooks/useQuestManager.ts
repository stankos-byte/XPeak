import { useState, useEffect, useCallback } from 'react';
import { MainQuest, QuestCategory, QuestTask, SkillCategory, Difficulty } from '../types';
import { calculateXP, getQuestBonusAmount, isCategoryComplete, isQuestComplete } from '../utils/gamification';
import { storage, STORAGE_KEYS } from '../services/localStorage';
import { persistenceService } from '../services/persistenceService';
import { generateQuest } from '../services/aiService';
import { DEBUG_FLAGS } from '../config/debugFlags';

interface UseQuestManagerReturn {
  mainQuests: MainQuest[];
  setMainQuests: React.Dispatch<React.SetStateAction<MainQuest[]>>;
  expandedNodes: Set<string>;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  oraclingQuestId: string | null;
  pendingQuestBonus: { qid: string; bonus: number; tid: string; questTitle: string } | null;
  setPendingQuestBonus: React.Dispatch<React.SetStateAction<{ qid: string; bonus: number; tid: string; questTitle: string } | null>>;
  textModalConfig: { isOpen: boolean; type: 'quest' | 'category' | 'edit-quest' | 'edit-category' | null; parentId?: string; categoryId?: string; initialValue?: string; };
  setTextModalConfig: React.Dispatch<React.SetStateAction<{ isOpen: boolean; type: 'quest' | 'category' | 'edit-quest' | 'edit-category' | null; parentId?: string; categoryId?: string; initialValue?: string; }>>;
  questTaskConfig: { isOpen: boolean; questId?: string; categoryId?: string; editingTask?: QuestTask | null; };
  setQuestTaskConfig: React.Dispatch<React.SetStateAction<{ isOpen: boolean; questId?: string; categoryId?: string; editingTask?: QuestTask | null; }>>;
  questToDelete: string | null;
  setQuestToDelete: (id: string | null) => void;
  toggleNode: (id: string) => void;
  handleToggleQuestTask: (qid: string, cid: string, tid: string, onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => void;
  handleConfirmQuestBonus: (onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => void;
  handleQuestOracle: (quest: MainQuest) => Promise<void>;
  handleDeleteQuestTask: (questId: string, categoryId: string, taskId: string, onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => void;
  handleDeleteCategory: (questId: string, categoryId: string, onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => void;
  handleDeleteQuest: (id: string) => void;
  handleCreateQuest: (title: string, categories?: { title: string; tasks: { name: string; difficulty?: Difficulty; skillCategory?: SkillCategory; description?: string }[] }[]) => void;
  handleAiCreateQuest: (title: string, categories?: { title: string; tasks: { name: string; difficulty?: Difficulty; skillCategory?: SkillCategory; description?: string }[] }[]) => void;
  handleCreateQuestTask: (questId: string, categoryId: string, data: { title: string; description?: string; difficulty: Difficulty; skillCategory: SkillCategory }, onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => void;
  handleUpdateQuestTask: (questId: string, categoryId: string, taskId: string, data: { title: string; description?: string; difficulty: Difficulty; skillCategory: SkillCategory }) => void;
  handleCreateCategory: (questId: string, title: string, onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => void;
  handleUpdateQuestTitle: (questId: string, title: string) => void;
  handleUpdateCategoryTitle: (questId: string, categoryId: string, title: string) => void;
}

export const useQuestManager = (
  onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void
): UseQuestManagerReturn => {
  const [mainQuests, setMainQuests] = useState<MainQuest[]>(() => storage.get<MainQuest[]>(STORAGE_KEYS.QUESTS, []));
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const quests = storage.get<MainQuest[]>(STORAGE_KEYS.QUESTS, []);
    return new Set(quests.map((q: MainQuest) => q.id));
  });
  const [oraclingQuestId, setOraclingQuestId] = useState<string | null>(null);
  const [pendingQuestBonus, setPendingQuestBonus] = useState<{ qid: string; bonus: number; tid: string; questTitle: string } | null>(null);
  const [textModalConfig, setTextModalConfig] = useState<{ isOpen: boolean; type: 'quest' | 'category' | 'edit-quest' | 'edit-category' | null; parentId?: string; categoryId?: string; initialValue?: string; }>({ isOpen: false, type: null });
  const [questTaskConfig, setQuestTaskConfig] = useState<{ isOpen: boolean; questId?: string; categoryId?: string; editingTask?: QuestTask | null; }>({ isOpen: false });
  const [questToDelete, setQuestToDelete] = useState<string | null>(null);

  // Save to localStorage (debounced)
  useEffect(() => { 
    persistenceService.set(STORAGE_KEYS.QUESTS, mainQuests); 
  }, [mainQuests]);

  const toggleNode = useCallback((id: string) => {
    setExpandedNodes((p: Set<string>) => { 
      const n = new Set(p); 
      if (n.has(id)) n.delete(id); 
      else n.add(id); 
      return n; 
    });
  }, []);

  const handleToggleQuestTask = useCallback((qid: string, cid: string, tid: string, onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => {
    const q = mainQuests.find(x => x.id === qid);
    const c = q?.categories.find(x => x.id === cid);
    const t = c?.tasks.find(x => x.task_id === tid);
    if (!q || !c || !t) return;

    const isCompleting = !t.completed;
    const xpResult = calculateXP({ 
      difficulty: t.difficulty, 
      skillCategory: t.skillCategory, 
      title: t.name 
    } as any);
    
    const baseAmount = isCompleting ? xpResult.total : -xpResult.total;
    let bonusAmount = 0;
    let popups: Record<string, number> = { [tid]: baseAmount };

    // Section Bonus
    const isCategoryCompleting = isCompleting && c.tasks.every(task => task.task_id === tid || task.completed);
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
        ? cat.tasks.every((task: QuestTask) => task.task_id === tid || task.completed)
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
          completed: isCompleting
        } as QuestTask)
      })
    }));

    // Grant XP
    onXPChange(baseAmount + bonusAmount, tid, popups, t.skillCategory, baseAmount);
  }, [mainQuests]);

  const handleConfirmQuestBonus = useCallback((onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => {
    if (!pendingQuestBonus) return;
    onXPChange(pendingQuestBonus.bonus, `bonus-${pendingQuestBonus.qid}`, { [`quest-bonus-${pendingQuestBonus.qid}`]: pendingQuestBonus.bonus });
    setPendingQuestBonus(null);
  }, [pendingQuestBonus]);

  const handleQuestOracle = useCallback(async (quest: MainQuest) => {
    // Check if quest already has data and confirm overwrite
    if (quest.categories.length > 0) {
      if (!window.confirm("This will overwrite the existing breakdown for this quest. Proceed?")) {
        return;
      }
    }

    setOraclingQuestId(quest.id);
    try {
      const data = await generateQuest(quest.title);
      const newCats = data.map((c: { title: string; tasks: any[] }) => ({ 
        id: crypto.randomUUID(), 
        title: c.title, 
        tasks: c.tasks.map((t: { name: string; difficulty: Difficulty; skillCategory: SkillCategory }) => ({ 
          task_id: crypto.randomUUID(), 
          name: t.name, 
          completed: false, 
          difficulty: t.difficulty, 
          skillCategory: t.skillCategory 
        })) 
      })); 
      
      // REPLACE categories instead of appending
      setMainQuests((prev: MainQuest[]) => prev.map((mq: MainQuest) => mq.id === quest.id ? { ...mq, categories: newCats } : mq));
      if (!expandedNodes.has(quest.id)) toggleNode(quest.id);
    } catch (e) { 
      if (DEBUG_FLAGS.quests) console.error(e); 
    } finally { 
      setOraclingQuestId(null); 
    }
  }, [expandedNodes, toggleNode]);

  const handleDeleteQuestTask = useCallback((questId: string, categoryId: string, taskId: string, onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => {
    const q = mainQuests.find((x: MainQuest) => x.id === questId);
    const c = q?.categories.find((x: QuestCategory) => x.id === categoryId);
    if (!q || !c) return;

    const wasSecComp = isCategoryComplete(c);
    const wasQuestComp = isQuestComplete(q);
    const remainingTasks = c.tasks.filter((t: QuestTask) => t.task_id !== taskId);
    const isSecNowComp = remainingTasks.length > 0 && remainingTasks.every((t: QuestTask) => t.completed);
    
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

    setMainQuests((qs: MainQuest[]) => qs.map((mq: MainQuest) => mq.id !== questId ? { 
      ...mq, 
      categories: mq.categories.map((cat: QuestCategory) => cat.id !== categoryId ? { ...cat, tasks: remainingTasks } : cat) 
    } : mq));

    bonuses.forEach(b => onXPChange(b.amount, b.type, { [b.key]: b.amount }));
  }, [mainQuests]);

  const handleDeleteCategory = useCallback((questId: string, categoryId: string, onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => {
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

    setMainQuests((qs: MainQuest[]) => qs.map((mq: MainQuest) => mq.id !== questId ? { ...mq, categories: remainingCats } : mq));

    if (bonus) {
      onXPChange(bonus.amount, bonus.type, { [bonus.key]: bonus.amount });
    }
  }, [mainQuests]);

  const handleDeleteQuest = useCallback((id: string) => {
    setMainQuests((prev: MainQuest[]) => prev.filter((q: MainQuest) => q.id !== id));
  }, []);

  const handleCreateQuest = useCallback((title: string, categories?: { title: string; tasks: { name: string; difficulty?: Difficulty; skillCategory?: SkillCategory; description?: string }[] }[]) => {
    const newId = crypto.randomUUID();
    
    let questCategories: QuestCategory[] = [];
    if (categories && categories.length > 0) {
         questCategories = categories.map((c) => ({
            id: crypto.randomUUID(),
            title: c.title,
            tasks: c.tasks.map((t) => ({
                task_id: crypto.randomUUID(),
                name: t.name,
                completed: false,
                difficulty: t.difficulty || Difficulty.EASY,
                skillCategory: t.skillCategory || SkillCategory.MISC,
                description: t.description || ''
            }))
        }));
    }

    setMainQuests((p: MainQuest[]) => [{ id: newId, title: title, categories: questCategories }, ...p]);
    setExpandedNodes((prev: Set<string>) => new Set(prev).add(newId));
  }, []);

  const handleAiCreateQuest = useCallback((title: string, categories?: { title: string; tasks: { name: string; difficulty?: Difficulty; skillCategory?: SkillCategory; description?: string }[] }[]) => {
    handleCreateQuest(title, categories);
  }, [handleCreateQuest]);

  const handleCreateQuestTask = useCallback((questId: string, categoryId: string, data: { title: string; description?: string; difficulty: Difficulty; skillCategory: SkillCategory }, onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => {
    setMainQuests((qs: MainQuest[]) => {
      const q = qs.find((x: MainQuest) => x.id === questId);
      const c = q?.categories.find((x: QuestCategory) => x.id === categoryId);
      if (!q || !c) return qs;

      if (isCategoryComplete(c)) onXPChange(-20, `sec-add-revoke-${c.id}`, { [`section-bonus-${c.id}`]: -20 });
      if (isQuestComplete(q)) {
        const bonus = getQuestBonusAmount(q.categories.length);
        onXPChange(-bonus, `quest-add-revoke-${q.id}`, { [`quest-bonus-${q.id}`]: -bonus });
      }
      return qs.map((mq: MainQuest) => mq.id !== questId ? { ...mq, categories: mq.categories.map((cat: QuestCategory) => cat.id !== categoryId ? { ...cat, tasks: [...cat.tasks, { task_id: crypto.randomUUID(), name: data.title, completed: false, difficulty: data.difficulty, skillCategory: data.skillCategory, description: data.description } as QuestTask] } : cat) } : mq);
    });
  }, []);

  const handleUpdateQuestTask = useCallback((questId: string, categoryId: string, taskId: string, data: { title: string; description?: string; difficulty: Difficulty; skillCategory: SkillCategory }) => {
    setMainQuests((qs: MainQuest[]) => {
      const q = qs.find((x: MainQuest) => x.id === questId);
      const c = q?.categories.find((x: QuestCategory) => x.id === categoryId);
      if (!q || !c) return qs;

      return qs.map((mq: MainQuest) => mq.id !== questId ? { ...mq, categories: mq.categories.map((cat: QuestCategory) => cat.id !== categoryId ? { ...cat, tasks: cat.tasks.map((t: QuestTask) => t.task_id === taskId ? { ...t, name: data.title, difficulty: data.difficulty, skillCategory: data.skillCategory, description: data.description } : t) } : cat) } : mq);
    });
  }, []);

  const handleCreateCategory = useCallback((questId: string, title: string, onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => {
    setMainQuests((p: MainQuest[]) => p.map((mq: MainQuest) => {
      if (mq.id === questId) {
        if (isQuestComplete(mq)) {
          const bonus = getQuestBonusAmount(mq.categories.length);
          onXPChange(-bonus, `quest-cat-revoke-${mq.id}`, { [`quest-bonus-${mq.id}`]: -bonus });
        }
        return {...mq, categories: [...mq.categories, { id: crypto.randomUUID(), title: title, tasks: [] }]};
      }
      return mq;
    }));
  }, []);

  const handleUpdateQuestTitle = useCallback((questId: string, title: string) => {
    setMainQuests((p: MainQuest[]) => p.map((q: MainQuest) => q.id === questId ? { ...q, title } : q));
  }, []);

  const handleUpdateCategoryTitle = useCallback((questId: string, categoryId: string, title: string) => {
    setMainQuests((p: MainQuest[]) => p.map((q: MainQuest) => q.id === questId ? { ...q, categories: q.categories.map((c: QuestCategory) => c.id === categoryId ? { ...c, title } : c) } : q));
  }, []);

  return {
    mainQuests,
    setMainQuests,
    expandedNodes,
    setExpandedNodes,
    oraclingQuestId,
    pendingQuestBonus,
    setPendingQuestBonus,
    textModalConfig,
    setTextModalConfig,
    questTaskConfig,
    setQuestTaskConfig,
    questToDelete,
    setQuestToDelete,
    toggleNode,
    handleToggleQuestTask,
    handleConfirmQuestBonus,
    handleQuestOracle,
    handleDeleteQuestTask,
    handleDeleteCategory,
    handleDeleteQuest,
    handleCreateQuest,
    handleAiCreateQuest,
    handleCreateQuestTask,
    handleUpdateQuestTask,
    handleCreateCategory,
    handleUpdateQuestTitle,
    handleUpdateCategoryTitle,
  };
};
