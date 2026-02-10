/**
 * Firestore Data Service
 * 
 * Handles all Firestore operations for user data including:
 * - Tasks (users/{uid}/tasks/{taskId})
 * - Quests (users/{uid}/quests/{questId})
 * - User profile updates (users/{uid})
 * - History (users/{uid}/history/{date})
 * - Oracle Chat (users/{uid}/oracleChat/{messageId})
 */

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Task, 
  MainQuest, 
  DailyActivity, 
  SkillCategory, 
  Goal, 
  TaskTemplate, 
  ProfileLayout,
  ChatMessage,
  computeQuestIndexes
} from '../types';
import { FirestoreSkillData } from './firestoreUserService';
import { fbPaths, paths } from './firebasePaths';

// ============================================
// Types
// ============================================

export interface FirestoreTask {
  id: string;
  title: string;
  description?: string;
  difficulty: string;
  skillCategory: string;
  isHabit: boolean;
  completed: boolean;
  streak: number;
  lastCompletedDate: Timestamp | null;
  createdAt: Timestamp;
  /** Optional tags for flexible filtering */
  tags?: string[];
}

export interface FirestoreQuest {
  id: string;
  title: string;
  categories: MainQuest['categories'];
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  /** Computed index: total number of tasks */
  totalTasks?: number;
  /** Computed index: number of completed tasks */
  completedTasks?: number;
  /** Computed index: unique skill categories (for array-contains queries) */
  skillCategories?: string[];
  /** Computed index: true when all tasks complete */
  isComplete?: boolean;
}

export interface FirestoreHistory {
  date: string;
  totalXP: number;
  taskCount: number;
  taskIds?: string[];
}

export interface FirestoreChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text?: string;
  isTool?: boolean;
  createdAt: Timestamp;
}

// ============================================
// Helper Functions
// ============================================

function taskToFirestore(task: Task): FirestoreTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description || '',
    difficulty: task.difficulty,
    skillCategory: task.skillCategory,
    isHabit: task.isHabit,
    completed: task.completed,
    streak: task.streak,
    lastCompletedDate: task.lastCompletedDate 
      ? Timestamp.fromDate(new Date(task.lastCompletedDate)) 
      : null,
    createdAt: Timestamp.fromDate(new Date(task.createdAt)),
    tags: task.tags || [],
  };
}

function taskFromFirestore(data: FirestoreTask): Task {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    difficulty: data.difficulty as Task['difficulty'],
    skillCategory: data.skillCategory as Task['skillCategory'],
    isHabit: data.isHabit,
    completed: data.completed,
    streak: data.streak,
    lastCompletedDate: data.lastCompletedDate?.toDate().toISOString() || null,
    createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    tags: data.tags || [],
  };
}

function questToFirestore(quest: MainQuest): FirestoreQuest {
  // Compute index fields for efficient queries
  const indexed = computeQuestIndexes(quest);
  
  return {
    id: quest.id,
    title: quest.title,
    categories: quest.categories,
    createdAt: serverTimestamp() as Timestamp,
    completedAt: indexed.isComplete ? serverTimestamp() as Timestamp : null,
    // Index fields for queries
    totalTasks: indexed.totalTasks,
    completedTasks: indexed.completedTasks,
    skillCategories: indexed.skillCategories,
    isComplete: indexed.isComplete,
  };
}

function questFromFirestore(data: FirestoreQuest): MainQuest {
  return {
    id: data.id,
    title: data.title,
    categories: data.categories || [],
    // Include index fields if present
    totalTasks: data.totalTasks,
    completedTasks: data.completedTasks,
    skillCategories: data.skillCategories as SkillCategory[] | undefined,
    isComplete: data.isComplete,
  };
}

// ============================================
// Tasks Operations
// ============================================

/**
 * Get all tasks for a user
 */
export async function getTasks(uid: string): Promise<Task[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const tasksRef = fbPaths.tasksCollection(uid);
  const q = query(tasksRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => taskFromFirestore(doc.data() as FirestoreTask));
}

/**
 * Subscribe to tasks changes (real-time updates)
 */
export function subscribeTasks(
  uid: string, 
  callback: (tasks: Task[]) => void
): Unsubscribe {
  if (!db) throw new Error('Firestore not initialized');
  
  const tasksRef = fbPaths.tasksCollection(uid);
  const q = query(tasksRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => taskFromFirestore(doc.data() as FirestoreTask));
    callback(tasks);
  });
}

/**
 * Save a single task
 */
export async function saveTask(uid: string, task: Task): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const taskRef = fbPaths.taskDoc(uid, task.id);
  await setDoc(taskRef, taskToFirestore(task));
}

/**
 * Save all tasks (batch operation)
 */
export async function saveTasks(uid: string, tasks: Task[]): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const batch = writeBatch(db);
  
  tasks.forEach(task => {
    const taskRef = fbPaths.taskDoc(uid, task.id);
    batch.set(taskRef, taskToFirestore(task));
  });
  
  await batch.commit();
}

/**
 * Delete a task
 */
export async function deleteTask(uid: string, taskId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const taskRef = fbPaths.taskDoc(uid, taskId);
  await deleteDoc(taskRef);
}

/**
 * Update a task
 */
export async function updateTask(uid: string, taskId: string, updates: Partial<Task>): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const taskRef = fbPaths.taskDoc(uid, taskId);
  
  // Convert date fields to Timestamps
  const firestoreUpdates: Record<string, unknown> = { ...updates };
  if (updates.lastCompletedDate !== undefined) {
    firestoreUpdates.lastCompletedDate = updates.lastCompletedDate 
      ? Timestamp.fromDate(new Date(updates.lastCompletedDate))
      : null;
  }
  
  await updateDoc(taskRef, firestoreUpdates);
}

/**
 * Get tasks by tag (uses array-contains query)
 */
export async function getTasksByTag(uid: string, tag: string): Promise<Task[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const tasksRef = fbPaths.tasksCollection(uid);
  const q = query(tasksRef, where('tags', 'array-contains', tag));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => taskFromFirestore(doc.data() as FirestoreTask));
}

// ============================================
// Quests Operations
// ============================================

/**
 * Get all quests for a user
 */
export async function getQuests(uid: string): Promise<MainQuest[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const questsRef = fbPaths.questsCollection(uid);
  const snapshot = await getDocs(questsRef);
  
  return snapshot.docs.map(doc => questFromFirestore(doc.data() as FirestoreQuest));
}

/**
 * Subscribe to quests changes (real-time updates)
 */
export function subscribeQuests(
  uid: string, 
  callback: (quests: MainQuest[]) => void
): Unsubscribe {
  if (!db) throw new Error('Firestore not initialized');
  
  const questsRef = fbPaths.questsCollection(uid);
  
  return onSnapshot(questsRef, (snapshot) => {
    const quests = snapshot.docs.map(doc => questFromFirestore(doc.data() as FirestoreQuest));
    callback(quests);
  });
}

/**
 * Save a single quest
 */
export async function saveQuest(uid: string, quest: MainQuest): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const questRef = fbPaths.questDoc(uid, quest.id);
  await setDoc(questRef, questToFirestore(quest));
}

/**
 * Save all quests (batch operation)
 */
export async function saveQuests(uid: string, quests: MainQuest[]): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const batch = writeBatch(db);
  
  quests.forEach(quest => {
    const questRef = fbPaths.questDoc(uid, quest.id);
    batch.set(questRef, questToFirestore(quest));
  });
  
  await batch.commit();
}

/**
 * Delete a quest
 */
export async function deleteQuest(uid: string, questId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const questRef = fbPaths.questDoc(uid, questId);
  await deleteDoc(questRef);
}

/**
 * Update a quest
 */
export async function updateQuest(uid: string, questId: string, updates: Partial<MainQuest>): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const questRef = fbPaths.questDoc(uid, questId);
  
  // If categories are being updated, recompute index fields
  if (updates.categories) {
    const indexed = computeQuestIndexes({ 
      id: questId, 
      title: '', 
      categories: updates.categories 
    });
    const firestoreUpdates = {
      ...updates,
      totalTasks: indexed.totalTasks,
      completedTasks: indexed.completedTasks,
      skillCategories: indexed.skillCategories,
      isComplete: indexed.isComplete,
    };
    await updateDoc(questRef, firestoreUpdates as Record<string, unknown>);
  } else {
    await updateDoc(questRef, updates as Record<string, unknown>);
  }
}

/**
 * Get quests by skill category (uses array-contains query)
 */
export async function getQuestsBySkillCategory(uid: string, skillCategory: SkillCategory): Promise<MainQuest[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const questsRef = fbPaths.questsCollection(uid);
  const q = query(questsRef, where('skillCategories', 'array-contains', skillCategory));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => questFromFirestore(doc.data() as FirestoreQuest));
}

/**
 * Get incomplete quests
 */
export async function getIncompleteQuests(uid: string): Promise<MainQuest[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const questsRef = fbPaths.questsCollection(uid);
  const q = query(questsRef, where('isComplete', '==', false));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => questFromFirestore(doc.data() as FirestoreQuest));
}

// ============================================
// User Profile Operations
// ============================================

/**
 * Update user XP and level
 */
export async function updateUserXP(
  uid: string, 
  totalXP: number, 
  level: number
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const userRef = fbPaths.userDoc(uid);
  await updateDoc(userRef, {
    totalXP,
    level,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update user skills
 */
export async function updateUserSkills(
  uid: string, 
  skills: Record<SkillCategory, FirestoreSkillData>
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const userRef = fbPaths.userDoc(uid);
  await updateDoc(userRef, {
    skills,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update user identity
 */
export async function updateUserIdentity(uid: string, identity: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const userRef = fbPaths.userDoc(uid);
  await updateDoc(userRef, {
    identity,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update user goals
 */
export async function updateUserGoals(uid: string, goals: Goal[]): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const userRef = fbPaths.userDoc(uid);
  await updateDoc(userRef, {
    goals,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update user templates
 */
export async function updateUserTemplates(uid: string, templates: TaskTemplate[]): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const userRef = fbPaths.userDoc(uid);
  await updateDoc(userRef, {
    templates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update user layout
 */
export async function updateUserLayout(uid: string, layout: ProfileLayout): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const userRef = fbPaths.userDoc(uid);
  await updateDoc(userRef, {
    layout,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update multiple user fields at once
 */
export async function updateUserProfile(
  uid: string, 
  updates: {
    totalXP?: number;
    level?: number;
    skills?: Record<SkillCategory, FirestoreSkillData>;
    identity?: string;
    goals?: Goal[];
    templates?: TaskTemplate[];
    layout?: ProfileLayout;
    name?: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const userRef = fbPaths.userDoc(uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// History Operations
// ============================================

/**
 * Get history for a user (limited to recent entries)
 */
export async function getHistory(uid: string, limitCount = 30): Promise<DailyActivity[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const historyRef = fbPaths.historyCollection(uid);
  const q = query(historyRef, orderBy('date', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => doc.data() as DailyActivity);
}

/**
 * Save or update a history entry for a specific date
 */
export async function saveHistoryEntry(uid: string, entry: DailyActivity): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const historyRef = fbPaths.historyDoc(uid, entry.date);
  await setDoc(historyRef, entry, { merge: true });
}

/**
 * Save multiple history entries (batch)
 */
export async function saveHistory(uid: string, entries: DailyActivity[]): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const batch = writeBatch(db);
  
  entries.forEach(entry => {
    const historyRef = fbPaths.historyDoc(uid, entry.date);
    batch.set(historyRef, entry, { merge: true });
  });
  
  await batch.commit();
}

// ============================================
// Oracle Chat Operations
// ============================================

/**
 * Get chat messages for a user
 */
export async function getChatMessages(uid: string, limitCount = 100): Promise<ChatMessage[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const chatRef = fbPaths.oracleChatCollection(uid);
  const q = query(chatRef, orderBy('createdAt', 'asc'), limit(limitCount));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data() as FirestoreChatMessage;
    return {
      id: data.id,
      role: data.role,
      text: data.text,
      isTool: data.isTool,
    };
  });
}

/**
 * Save a chat message
 */
export async function saveChatMessage(uid: string, message: ChatMessage): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const messageRef = fbPaths.oracleChatDoc(uid, message.id);
  await setDoc(messageRef, {
    ...message,
    createdAt: serverTimestamp(),
  });
}

/**
 * Save multiple chat messages (batch)
 */
export async function saveChatMessages(uid: string, messages: ChatMessage[]): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const batch = writeBatch(db);
  
  messages.forEach(message => {
    const messageRef = fbPaths.oracleChatDoc(uid, message.id);
    batch.set(messageRef, {
      ...message,
      createdAt: serverTimestamp(),
    });
  });
  
  await batch.commit();
}

/**
 * Clear all chat messages for a user
 */
export async function clearChatMessages(uid: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const chatRef = fbPaths.oracleChatCollection(uid);
  const snapshot = await getDocs(chatRef);
  
  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

// ============================================
// Reset User Data
// ============================================

/**
 * Delete documents from a collection in paginated batches
 * Handles collections with >500 documents
 */
export async function deletePaginated(collectionRef: CollectionReference): Promise<number> {
  const batchSize = 500;
  let totalDeleted = 0;
  let hasMore = true;
  
  while (hasMore) {
    const q = query(collectionRef, limit(batchSize));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      hasMore = false;
      break;
    }
    
    const batch = writeBatch(db!);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    totalDeleted += snapshot.docs.length;
    
    // Small delay to avoid rate limits
    if (snapshot.docs.length === batchSize) {
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      // Last batch, we're done
      hasMore = false;
    }
  }
  
  return totalDeleted;
}

/**
 * Reset all user data to default state
 * This will:
 * - Reset XP, level, skills to 0
 * - Clear identity
 * - Delete all tasks, quests, history, chat messages, goals, and templates
 */
export async function resetUserData(uid: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  console.log('🔄 Resetting user data to defaults...');
  
  // Reset user profile to defaults
  const userRef = fbPaths.userDoc(uid);
  const defaultSkills: Record<string, { xp: number; level: number }> = {};
  const skillCategories = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'MISC'];
  skillCategories.forEach(cat => {
    defaultSkills[cat] = { xp: 0, level: 0 };
  });
  
  await updateDoc(userRef, {
    totalXP: 0,
    level: 0,
    skills: defaultSkills,
    identity: '',
    layout: { 
      widgets: [
        { id: 'identity', enabled: true, order: 0 }, 
        { id: 'skillMatrix', enabled: true, order: 1 }, 
        { id: 'evolution', enabled: true, order: 2 }, 
        { id: 'calendar', enabled: true, order: 3 }, 
        { id: 'friends', enabled: true, order: 4 },
        { id: 'tasks', enabled: true, order: 5 }
      ] 
    },
    updatedAt: serverTimestamp(),
  });
  console.log('✅ Reset user profile');
  
  // Delete all subcollections with pagination
  const collections = [
    { ref: fbPaths.tasksCollection(uid), name: 'tasks' },
    { ref: fbPaths.questsCollection(uid), name: 'quests' },
    { ref: fbPaths.historyCollection(uid), name: 'history' },
    { ref: fbPaths.oracleChatCollection(uid), name: 'chat messages' },
    { ref: fbPaths.goalsCollection(uid), name: 'goals' },
    { ref: fbPaths.templatesCollection(uid), name: 'templates' },
  ];
  
  for (const { ref: collectionRef, name } of collections) {
    const deleted = await deletePaginated(collectionRef);
    if (deleted > 0) {
      console.log(`✅ Deleted ${deleted} ${name}`);
    }
  }
  
  console.log('🎉 User data reset complete! Refresh the page to see changes.');
}

// ============================================
// Migration Helper
// ============================================

/**
 * Migrate localStorage data to Firestore for a user
 * Call this once when user first logs in and has existing localStorage data
 */
export async function migrateLocalStorageToFirestore(
  uid: string,
  data: {
    tasks?: Task[];
    quests?: MainQuest[];
    history?: DailyActivity[];
    userProfile?: {
      totalXP?: number;
      level?: number;
      skills?: Record<SkillCategory, { xp: number; level: number }>;
      identity?: string;
      goals?: Goal[];
      templates?: TaskTemplate[];
      layout?: ProfileLayout;
    };
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  console.log('🔄 Starting migration from localStorage to Firestore...');
  
  // Migrate tasks
  if (data.tasks && data.tasks.length > 0) {
    await saveTasks(uid, data.tasks);
    console.log(`✅ Migrated ${data.tasks.length} tasks`);
  }
  
  // Migrate quests
  if (data.quests && data.quests.length > 0) {
    await saveQuests(uid, data.quests);
    console.log(`✅ Migrated ${data.quests.length} quests`);
  }
  
  // Migrate history
  if (data.history && data.history.length > 0) {
    await saveHistory(uid, data.history);
    console.log(`✅ Migrated ${data.history.length} history entries`);
  }
  
  // Migrate user profile data
  if (data.userProfile) {
    const updates: Record<string, unknown> = {};
    
    if (data.userProfile.totalXP !== undefined) updates.totalXP = data.userProfile.totalXP;
    if (data.userProfile.level !== undefined) updates.level = data.userProfile.level;
    if (data.userProfile.skills) {
      // Convert to Firestore format (remove redundant category field)
      const firestoreSkills: Record<string, FirestoreSkillData> = {};
      Object.entries(data.userProfile.skills).forEach(([key, value]) => {
        firestoreSkills[key] = { xp: value.xp, level: value.level };
      });
      updates.skills = firestoreSkills;
    }
    if (data.userProfile.identity !== undefined) updates.identity = data.userProfile.identity;
    if (data.userProfile.layout) updates.layout = data.userProfile.layout;
    
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = serverTimestamp();
      const userRef = fbPaths.userDoc(uid);
      await updateDoc(userRef, updates);
      console.log('✅ Migrated user profile data');
    }

    // Migrate goals to subcollection
    if (data.userProfile.goals && data.userProfile.goals.length > 0) {
      for (const goal of data.userProfile.goals) {
        await saveGoal(uid, goal);
      }
      console.log(`✅ Migrated ${data.userProfile.goals.length} goals to subcollection`);
    }

    // Migrate templates to subcollection
    if (data.userProfile.templates && data.userProfile.templates.length > 0) {
      for (const template of data.userProfile.templates) {
        await saveTemplate(uid, template);
      }
      console.log(`✅ Migrated ${data.userProfile.templates.length} templates to subcollection`);
    }
  }
  
  console.log('🎉 Migration complete!');
}

// ============================================
// Goals Operations
// ============================================

/**
 * Get all goals for a user
 */
export async function getGoals(uid: string): Promise<Goal[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const goalsRef = fbPaths.goalsCollection(uid);
  const snapshot = await getDocs(goalsRef);
  
  return snapshot.docs.map(doc => doc.data() as Goal);
}

/**
 * Subscribe to goals changes (real-time updates)
 */
export function subscribeGoals(
  uid: string,
  callback: (goals: Goal[]) => void
): Unsubscribe {
  if (!db) throw new Error('Firestore not initialized');
  
  const goalsRef = fbPaths.goalsCollection(uid);
  
  return onSnapshot(goalsRef, (snapshot) => {
    const goals = snapshot.docs.map(doc => doc.data() as Goal);
    callback(goals);
  });
}

/**
 * Save a single goal
 */
export async function saveGoal(uid: string, goal: Goal): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const goalRef = fbPaths.goalDoc(uid, goal.id);
  await setDoc(goalRef, goal);
}

/**
 * Update a goal
 */
export async function updateGoalData(uid: string, goalId: string, updates: Partial<Goal>): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const goalRef = fbPaths.goalDoc(uid, goalId);
  await updateDoc(goalRef, updates as Record<string, unknown>);
}

/**
 * Delete a goal
 */
export async function deleteGoalData(uid: string, goalId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const goalRef = fbPaths.goalDoc(uid, goalId);
  await deleteDoc(goalRef);
}

// ============================================
// Templates Operations
// ============================================

/**
 * Get all templates for a user
 */
export async function getTemplates(uid: string): Promise<TaskTemplate[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const templatesRef = fbPaths.templatesCollection(uid);
  const snapshot = await getDocs(templatesRef);
  
  return snapshot.docs.map(doc => doc.data() as TaskTemplate);
}

/**
 * Subscribe to templates changes (real-time updates)
 */
export function subscribeTemplates(
  uid: string,
  callback: (templates: TaskTemplate[]) => void
): Unsubscribe {
  if (!db) throw new Error('Firestore not initialized');
  
  const templatesRef = fbPaths.templatesCollection(uid);
  
  return onSnapshot(templatesRef, (snapshot) => {
    const templates = snapshot.docs.map(doc => doc.data() as TaskTemplate);
    callback(templates);
  });
}

/**
 * Save a single template
 */
export async function saveTemplate(uid: string, template: TaskTemplate): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const templateRef = fbPaths.templateDoc(uid, template.id);
  await setDoc(templateRef, template);
}

/**
 * Delete a template
 */
export async function deleteTemplateData(uid: string, templateId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const templateRef = fbPaths.templateDoc(uid, templateId);
  await deleteDoc(templateRef);
}
