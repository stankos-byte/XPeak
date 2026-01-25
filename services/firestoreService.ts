/**
 * FirestoreService - Centralized Firestore operations aligned with firestore-schema.md
 * 
 * All operations follow the schema structure:
 * - users/{UID} - User documents
 * - users/{UID}/tasks/{taskId} - Tasks subcollection
 * - users/{UID}/quests/{questId} - Quests subcollection
 * - users/{UID}/friends/{friendUID} - Friends subcollection
 * - users/{UID}/activeChallenges/{challengeId} - Active challenges subcollection
 * - users/{UID}/history/{date} - History subcollection
 * - users/{UID}/oracleChat/{messageId} - Oracle chat subcollection
 * - challenges/{challengeId} - Top-level challenges collection
 * - friendRequests/{requestId} - Top-level friend requests collection
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  QueryConstraint,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import {
  UserProfile,
  Task,
  MainQuest,
  Friend,
  FriendChallenge,
  DailyActivity,
  ChatMessage,
  SkillCategory,
  ProfileLayout,
  TaskTemplate,
  Goal,
} from '../types';
import { DEBUG_FLAGS } from '../config/debugFlags';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get current user UID, throw if not authenticated
 */
const getCurrentUID = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to perform this operation');
  }
  return user.uid;
};

/**
 * Convert Firestore timestamp to ISO string
 */
const timestampToISO = (timestamp: any): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

/**
 * Convert ISO string to Firestore timestamp
 */
const isoToTimestamp = (iso: string | null): Timestamp | null => {
  if (!iso) return null;
  return Timestamp.fromDate(new Date(iso));
};

// ==========================================
// USER OPERATIONS
// ==========================================

/**
 * Get user document
 */
export const getUser = async (uid?: string): Promise<UserProfile | null> => {
  try {
    const userId = uid || getCurrentUID();
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    return {
      name: data.name || 'Protocol-01',
      totalXP: data.totalXP || 0,
      level: data.level || 0,
      skills: data.skills || {},
      history: (data.history || []).map((h: any) => ({
        date: h.date,
        totalXP: h.totalXP || 0,
        taskCount: h.taskCount || 0,
        taskIds: h.taskIds || [],
      })),
      identity: data.identity || '',
      goals: data.goals || [],
      templates: data.templates || [],
      layout: data.layout || undefined,
    };
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error getting user:', error);
    throw error;
  }
};

/**
 * Create or update user document
 */
export const setUser = async (userData: Partial<UserProfile>, uid?: string): Promise<void> => {
  try {
    const userId = uid || getCurrentUID();
    const userRef = doc(db, 'users', userId);
    
    // Get existing user data to merge
    const existing = await getUser(userId);
    const mergedData = {
      ...existing,
      ...userData,
      uid: userId,
      email: auth.currentUser?.email || '',
      lastLoginAt: serverTimestamp(),
    };
    
    await setDoc(userRef, mergedData, { merge: true });
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error setting user:', error);
    throw error;
  }
};

/**
 * Create initial user document on signup
 */
export const createUserDocument = async (
  uid: string,
  email: string,
  name: string,
  photoURL: string | null,
  authProvider: 'google' | 'email' | 'apple'
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    
    // Initialize default skills
    const defaultSkills: Record<SkillCategory, { category: SkillCategory; xp: number; level: number }> = {
      [SkillCategory.PHYSICAL]: { category: SkillCategory.PHYSICAL, xp: 0, level: 0 },
      [SkillCategory.MENTAL]: { category: SkillCategory.MENTAL, xp: 0, level: 0 },
      [SkillCategory.PROFESSIONAL]: { category: SkillCategory.PROFESSIONAL, xp: 0, level: 0 },
      [SkillCategory.SOCIAL]: { category: SkillCategory.SOCIAL, xp: 0, level: 0 },
      [SkillCategory.CREATIVE]: { category: SkillCategory.CREATIVE, xp: 0, level: 0 },
      [SkillCategory.MISC]: { category: SkillCategory.MISC, xp: 0, level: 0 },
    };
    
    const defaultLayout: ProfileLayout = {
      widgets: [
        { id: 'identity', enabled: true, order: 0 },
        { id: 'skillMatrix', enabled: true, order: 1 },
        { id: 'evolution', enabled: true, order: 2 },
        { id: 'calendar', enabled: true, order: 3 },
        { id: 'friends', enabled: true, order: 4 },
        { id: 'tasks', enabled: true, order: 5 },
      ],
    };
    
    await setDoc(userRef, {
      uid,
      email,
      name,
      photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      authProvider,
      totalXP: 0,
      level: 0,
      identity: '',
      skills: defaultSkills,
      goals: [],
      templates: [],
      layout: defaultLayout,
      settings: {
        theme: 'dark',
        notifications: {
          deepWorkMode: false,
          contractUpdates: true,
          levelUps: true,
        },
      },
    });
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error creating user document:', error);
    throw error;
  }
};

/**
 * Subscribe to user document changes
 */
export const subscribeToUser = (
  callback: (user: UserProfile | null) => void,
  uid?: string
): Unsubscribe => {
  const userId = uid || getCurrentUID();
  const userRef = doc(db, 'users', userId);
  
  return onSnapshot(userRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    const data = snapshot.data();
    callback({
      name: data.name || 'Protocol-01',
      totalXP: data.totalXP || 0,
      level: data.level || 0,
      skills: data.skills || {},
      history: (data.history || []).map((h: any) => ({
        date: h.date,
        totalXP: h.totalXP || 0,
        taskCount: h.taskCount || 0,
        taskIds: h.taskIds || [],
      })),
      identity: data.identity || '',
      goals: data.goals || [],
      templates: data.templates || [],
      layout: data.layout || undefined,
    });
  }, (error) => {
    if (DEBUG_FLAGS.storage) console.error('Error in user subscription:', error);
    callback(null);
  });
};

// ==========================================
// TASKS OPERATIONS
// ==========================================

/**
 * Get all tasks for current user
 */
export const getTasks = async (uid?: string): Promise<Task[]> => {
  try {
    const userId = uid || getCurrentUID();
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const snapshot = await getDocs(tasksRef);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastCompletedDate: timestampToISO(doc.data().lastCompletedDate),
      createdAt: timestampToISO(doc.data().createdAt) || new Date().toISOString(),
    })) as Task[];
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error getting tasks:', error);
    throw error;
  }
};

/**
 * Create a task
 */
export const createTask = async (task: Omit<Task, 'id'>, uid?: string): Promise<string> => {
  try {
    const userId = uid || getCurrentUID();
    const taskId = crypto.randomUUID();
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    
    await setDoc(taskRef, {
      ...task,
      id: taskId,
      lastCompletedDate: task.lastCompletedDate ? isoToTimestamp(task.lastCompletedDate) : null,
      createdAt: task.createdAt ? isoToTimestamp(task.createdAt) : serverTimestamp(),
    });
    
    return taskId;
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error creating task:', error);
    throw error;
  }
};

/**
 * Update a task
 */
export const updateTask = async (taskId: string, updates: Partial<Task>, uid?: string): Promise<void> => {
  try {
    const userId = uid || getCurrentUID();
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    
    const updateData: any = { ...updates };
    if (updates.lastCompletedDate !== undefined) {
      updateData.lastCompletedDate = updates.lastCompletedDate ? isoToTimestamp(updates.lastCompletedDate) : null;
    }
    if (updates.createdAt !== undefined) {
      updateData.createdAt = updates.createdAt ? isoToTimestamp(updates.createdAt) : serverTimestamp();
    }
    
    await updateDoc(taskRef, updateData);
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error updating task:', error);
    throw error;
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string, uid?: string): Promise<void> => {
  try {
    const userId = uid || getCurrentUID();
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error deleting task:', error);
    throw error;
  }
};

/**
 * Subscribe to tasks changes
 */
export const subscribeToTasks = (
  callback: (tasks: Task[]) => void,
  uid?: string
): Unsubscribe => {
  const userId = uid || getCurrentUID();
  const tasksRef = collection(db, 'users', userId, 'tasks');
  
  return onSnapshot(tasksRef, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastCompletedDate: timestampToISO(doc.data().lastCompletedDate),
      createdAt: timestampToISO(doc.data().createdAt) || new Date().toISOString(),
    })) as Task[];
    callback(tasks);
  }, (error) => {
    if (DEBUG_FLAGS.storage) console.error('Error in tasks subscription:', error);
    callback([]);
  });
};

// ==========================================
// QUESTS OPERATIONS
// ==========================================

/**
 * Get all quests for current user
 */
export const getQuests = async (uid?: string): Promise<MainQuest[]> => {
  try {
    const userId = uid || getCurrentUID();
    const questsRef = collection(db, 'users', userId, 'quests');
    const snapshot = await getDocs(questsRef);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: timestampToISO(doc.data().createdAt) || new Date().toISOString(),
      completedAt: timestampToISO(doc.data().completedAt) || null,
    })) as MainQuest[];
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error getting quests:', error);
    throw error;
  }
};

/**
 * Create a quest
 */
export const createQuest = async (quest: Omit<MainQuest, 'id'>, uid?: string): Promise<string> => {
  try {
    const userId = uid || getCurrentUID();
    const questId = crypto.randomUUID();
    const questRef = doc(db, 'users', userId, 'quests', questId);
    
    await setDoc(questRef, {
      ...quest,
      id: questId,
      createdAt: serverTimestamp(),
      completedAt: null,
    });
    
    return questId;
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error creating quest:', error);
    throw error;
  }
};

/**
 * Update a quest
 */
export const updateQuest = async (questId: string, updates: Partial<MainQuest>, uid?: string): Promise<void> => {
  try {
    const userId = uid || getCurrentUID();
    const questRef = doc(db, 'users', userId, 'quests', questId);
    
    const updateData: any = { ...updates };
    if (updates.completedAt !== undefined) {
      updateData.completedAt = updates.completedAt ? isoToTimestamp(updates.completedAt) : null;
    }
    
    await updateDoc(questRef, updateData);
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error updating quest:', error);
    throw error;
  }
};

/**
 * Delete a quest
 */
export const deleteQuest = async (questId: string, uid?: string): Promise<void> => {
  try {
    const userId = uid || getCurrentUID();
    const questRef = doc(db, 'users', userId, 'quests', questId);
    await deleteDoc(questRef);
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error deleting quest:', error);
    throw error;
  }
};

/**
 * Subscribe to quests changes
 */
export const subscribeToQuests = (
  callback: (quests: MainQuest[]) => void,
  uid?: string
): Unsubscribe => {
  const userId = uid || getCurrentUID();
  const questsRef = collection(db, 'users', userId, 'quests');
  
  return onSnapshot(questsRef, (snapshot) => {
    const quests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: timestampToISO(doc.data().createdAt) || new Date().toISOString(),
      completedAt: timestampToISO(doc.data().completedAt) || null,
    })) as MainQuest[];
    callback(quests);
  }, (error) => {
    if (DEBUG_FLAGS.storage) console.error('Error in quests subscription:', error);
    callback([]);
  });
};

// ==========================================
// FRIENDS OPERATIONS
// ==========================================

/**
 * Get all friends for current user
 */
export const getFriends = async (uid?: string): Promise<Friend[]> => {
  try {
    const userId = uid || getCurrentUID();
    const friendsRef = collection(db, 'users', userId, 'friends');
    const snapshot = await getDocs(friendsRef);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastActive: timestampToISO(doc.data().lastActive) || 'Now',
      friendsSince: timestampToISO(doc.data().friendsSince) || new Date().toISOString(),
    })) as Friend[];
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error getting friends:', error);
    throw error;
  }
};

/**
 * Subscribe to friends changes
 */
export const subscribeToFriends = (
  callback: (friends: Friend[]) => void,
  uid?: string
): Unsubscribe => {
  const userId = uid || getCurrentUID();
  const friendsRef = collection(db, 'users', userId, 'friends');
  
  return onSnapshot(friendsRef, (snapshot) => {
    const friends = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastActive: timestampToISO(doc.data().lastActive) || 'Now',
      friendsSince: timestampToISO(doc.data().friendsSince) || new Date().toISOString(),
    })) as Friend[];
    callback(friends);
  }, (error) => {
    if (DEBUG_FLAGS.storage) console.error('Error in friends subscription:', error);
    callback([]);
  });
};

// ==========================================
// CHALLENGES OPERATIONS
// ==========================================

/**
 * Get challenge by ID
 */
export const getChallenge = async (challengeId: string): Promise<FriendChallenge | null> => {
  try {
    const challengeRef = doc(db, 'challenges', challengeId);
    const snapshot = await getDoc(challengeRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      completedAt: timestampToISO(data.completedAt) || undefined,
      createdAt: timestampToISO(data.createdAt) || new Date().toISOString(),
    } as FriendChallenge;
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error getting challenge:', error);
    throw error;
  }
};

/**
 * Get all challenges for current user (where user is a participant)
 */
export const getUserChallenges = async (uid?: string): Promise<FriendChallenge[]> => {
  try {
    const userId = uid || getCurrentUID();
    const challengesRef = collection(db, 'challenges');
    const q = query(challengesRef, where('partnerIds', 'array-contains', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      completedAt: timestampToISO(doc.data().completedAt) || undefined,
      createdAt: timestampToISO(doc.data().createdAt) || new Date().toISOString(),
    })) as FriendChallenge[];
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error getting user challenges:', error);
    throw error;
  }
};

/**
 * Create a challenge
 */
export const createChallenge = async (challenge: Omit<FriendChallenge, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const challengeId = crypto.randomUUID();
    const challengeRef = doc(db, 'challenges', challengeId);
    const currentUID = getCurrentUID();
    
    await setDoc(challengeRef, {
      ...challenge,
      id: challengeId,
      creatorUID: currentUID,
      status: 'active',
      createdAt: serverTimestamp(),
      completedAt: null,
      completedBy: null,
    });
    
    // Add to user's activeChallenges subcollection
    const activeChallengeRef = doc(db, 'users', currentUID, 'activeChallenges', challengeId);
    await setDoc(activeChallengeRef, {
      challengeId,
      title: challenge.title,
      mode: challenge.mode,
      opponentUIDs: challenge.partnerIds.filter(id => id !== currentUID),
      opponentNames: [], // Will be populated by Cloud Function or query
      status: 'active',
      joinedAt: serverTimestamp(),
    });
    
    return challengeId;
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error creating challenge:', error);
    throw error;
  }
};

/**
 * Update a challenge
 */
export const updateChallenge = async (challengeId: string, updates: Partial<FriendChallenge>): Promise<void> => {
  try {
    const challengeRef = doc(db, 'challenges', challengeId);
    
    const updateData: any = { ...updates };
    if (updates.completedAt !== undefined) {
      updateData.completedAt = updates.completedAt ? isoToTimestamp(updates.completedAt) : null;
    }
    
    await updateDoc(challengeRef, updateData);
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error updating challenge:', error);
    throw error;
  }
};

/**
 * Delete a challenge
 */
export const deleteChallenge = async (challengeId: string, uid?: string): Promise<void> => {
  try {
    const userId = uid || getCurrentUID();
    
    // Delete from challenges collection
    const challengeRef = doc(db, 'challenges', challengeId);
    await deleteDoc(challengeRef);
    
    // Delete from user's activeChallenges
    const activeChallengeRef = doc(db, 'users', userId, 'activeChallenges', challengeId);
    await deleteDoc(activeChallengeRef);
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error deleting challenge:', error);
    throw error;
  }
};

/**
 * Subscribe to challenges for current user
 */
export const subscribeToChallenges = (
  callback: (challenges: FriendChallenge[]) => void,
  uid?: string
): Unsubscribe => {
  const userId = uid || getCurrentUID();
  const challengesRef = collection(db, 'challenges');
  const q = query(challengesRef, where('partnerIds', 'array-contains', userId));
  
  return onSnapshot(q, (snapshot) => {
    const challenges = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      completedAt: timestampToISO(doc.data().completedAt) || undefined,
      createdAt: timestampToISO(doc.data().createdAt) || new Date().toISOString(),
    })) as FriendChallenge[];
    callback(challenges);
  }, (error) => {
    if (DEBUG_FLAGS.storage) console.error('Error in challenges subscription:', error);
    callback([]);
  });
};

// ==========================================
// HISTORY OPERATIONS
// ==========================================

/**
 * Get history entry for a specific date
 */
export const getHistoryEntry = async (date: string, uid?: string): Promise<DailyActivity | null> => {
  try {
    const userId = uid || getCurrentUID();
    const historyRef = doc(db, 'users', userId, 'history', date);
    const snapshot = await getDoc(historyRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.data();
    return {
      date: data.date || date,
      totalXP: data.totalXP || 0,
      taskCount: data.taskCount || 0,
      taskIds: data.taskIds || [],
    };
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error getting history entry:', error);
    throw error;
  }
};

/**
 * Set or update history entry for a date
 */
export const setHistoryEntry = async (entry: DailyActivity, uid?: string): Promise<void> => {
  try {
    const userId = uid || getCurrentUID();
    const historyRef = doc(db, 'users', userId, 'history', entry.date);
    await setDoc(historyRef, entry, { merge: true });
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error setting history entry:', error);
    throw error;
  }
};

/**
 * Get all history entries (limited to recent)
 */
export const getHistory = async (limit: number = 365, uid?: string): Promise<DailyActivity[]> => {
  try {
    const userId = uid || getCurrentUID();
    const historyRef = collection(db, 'users', userId, 'history');
    const q = query(historyRef, orderBy('date', 'desc'), limit(limit));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      date: doc.data().date || doc.id,
      totalXP: doc.data().totalXP || 0,
      taskCount: doc.data().taskCount || 0,
      taskIds: doc.data().taskIds || [],
    }));
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error getting history:', error);
    throw error;
  }
};

// ==========================================
// FRIEND REQUESTS OPERATIONS
// ==========================================

/**
 * Get pending friend requests for current user
 */
export const getFriendRequests = async (uid?: string): Promise<any[]> => {
  try {
    const userId = uid || getCurrentUID();
    const requestsRef = collection(db, 'friendRequests');
    const q = query(requestsRef, where('toUID', '==', userId), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: timestampToISO(doc.data().createdAt),
      updatedAt: timestampToISO(doc.data().updatedAt),
    }));
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error getting friend requests:', error);
    throw error;
  }
};

/**
 * Create a friend request
 */
export const createFriendRequest = async (
  toUID: string,
  fromDisplayName: string,
  fromPhotoURL: string | null,
  fromLevel: number
): Promise<string> => {
  try {
    const fromUID = getCurrentUID();
    const requestId = crypto.randomUUID();
    const requestRef = doc(db, 'friendRequests', requestId);
    
    await setDoc(requestRef, {
      id: requestId,
      fromUID,
      toUID,
      fromDisplayName,
      fromPhotoURL,
      fromLevel,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return requestId;
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error creating friend request:', error);
    throw error;
  }
};

/**
 * Update friend request status
 */
export const updateFriendRequest = async (requestId: string, status: 'accepted' | 'rejected' | 'blocked'): Promise<void> => {
  try {
    const requestRef = doc(db, 'friendRequests', requestId);
    await updateDoc(requestRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error updating friend request:', error);
    throw error;
  }
};

// ==========================================
// ORACLE CHAT OPERATIONS
// ==========================================

/**
 * Get oracle chat messages
 */
export const getOracleChat = async (limit: number = 50, uid?: string): Promise<ChatMessage[]> => {
  try {
    const userId = uid || getCurrentUID();
    const chatRef = collection(db, 'users', userId, 'oracleChat');
    const q = query(chatRef, orderBy('createdAt', 'desc'), limit(limit));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[];
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error getting oracle chat:', error);
    throw error;
  }
};

/**
 * Add oracle chat message
 */
export const addOracleChatMessage = async (message: Omit<ChatMessage, 'id'>, uid?: string): Promise<string> => {
  try {
    const userId = uid || getCurrentUID();
    const messageId = crypto.randomUUID();
    const messageRef = doc(db, 'users', userId, 'oracleChat', messageId);
    
    await setDoc(messageRef, {
      ...message,
      id: messageId,
      createdAt: serverTimestamp(),
    });
    
    return messageId;
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error adding oracle chat message:', error);
    throw error;
  }
};
