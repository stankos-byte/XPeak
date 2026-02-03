/**
 * Firebase Paths Service
 * 
 * Centralized path management for all Firestore collections and documents.
 * This provides:
 * - Type-safe document and collection references
 * - Consistent path structure across the app
 * - Easy refactoring if paths need to change
 * - Better maintainability and reduced typos
 */

import { 
  doc, 
  collection, 
  DocumentReference, 
  CollectionReference,
  Firestore
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// Path String Constants
// ============================================

export const COLLECTIONS = {
  USERS: 'users',
  CHALLENGES: 'challenges',
  FRIEND_REQUESTS: 'friendRequests',
} as const;

export const USER_SUBCOLLECTIONS = {
  TASKS: 'tasks',
  QUESTS: 'quests',
  HISTORY: 'history',
  ARCHIVED_HISTORY: 'archivedHistory',
  ORACLE_CHAT: 'oracleChat',
  FRIENDS: 'friends',
  ACTIVE_CHALLENGES: 'activeChallenges',
} as const;

// ============================================
// Path Builder Functions (String-based)
// ============================================

/**
 * String-based path builders for when you need the path as a string
 * (e.g., for logging, debugging, or building dynamic paths)
 */
export const paths = {
  // User paths
  user: (uid: string) => `${COLLECTIONS.USERS}/${uid}`,
  
  // User subcollection paths
  userTasks: (uid: string) => `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.TASKS}`,
  userTask: (uid: string, taskId: string) => 
    `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.TASKS}/${taskId}`,
  
  userQuests: (uid: string) => `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.QUESTS}`,
  userQuest: (uid: string, questId: string) => 
    `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.QUESTS}/${questId}`,
  
  userHistory: (uid: string) => `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.HISTORY}`,
  userHistoryEntry: (uid: string, date: string) => 
    `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.HISTORY}/${date}`,
  
  userArchivedHistory: (uid: string) => 
    `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.ARCHIVED_HISTORY}`,
  userArchivedHistoryEntry: (uid: string, archiveId: string) => 
    `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.ARCHIVED_HISTORY}/${archiveId}`,
  
  userOracleChat: (uid: string) => `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.ORACLE_CHAT}`,
  userOracleChatMessage: (uid: string, messageId: string) => 
    `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.ORACLE_CHAT}/${messageId}`,
  
  userFriends: (uid: string) => `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.FRIENDS}`,
  userFriend: (uid: string, friendId: string) => 
    `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.FRIENDS}/${friendId}`,
  
  userActiveChallenges: (uid: string) => 
    `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.ACTIVE_CHALLENGES}`,
  userActiveChallenge: (uid: string, challengeId: string) => 
    `${COLLECTIONS.USERS}/${uid}/${USER_SUBCOLLECTIONS.ACTIVE_CHALLENGES}/${challengeId}`,
  
  // Top-level collection paths
  challenge: (challengeId: string) => `${COLLECTIONS.CHALLENGES}/${challengeId}`,
  friendRequest: (requestId: string) => `${COLLECTIONS.FRIEND_REQUESTS}/${requestId}`,
} as const;

// ============================================
// Firebase Reference Class
// ============================================

/**
 * Class-based path service that returns actual Firestore DocumentReference 
 * and CollectionReference objects, ready to use with Firestore SDK.
 */
class FirebasePathsService {
  private db: Firestore | null;

  constructor() {
    this.db = db;
  }

  private ensureDb(): Firestore {
    if (!this.db) {
      throw new Error('Firestore is not initialized');
    }
    return this.db;
  }

  // ==========================================
  // User Document & Subcollections
  // ==========================================

  /** Get user document reference */
  userDoc(uid: string): DocumentReference {
    return doc(this.ensureDb(), COLLECTIONS.USERS, uid);
  }

  /** Get users collection reference */
  usersCollection(): CollectionReference {
    return collection(this.ensureDb(), COLLECTIONS.USERS);
  }

  // ==========================================
  // Tasks
  // ==========================================

  /** Get user's tasks collection reference */
  tasksCollection(uid: string): CollectionReference {
    return collection(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.TASKS);
  }

  /** Get specific task document reference */
  taskDoc(uid: string, taskId: string): DocumentReference {
    return doc(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.TASKS, taskId);
  }

  // ==========================================
  // Quests
  // ==========================================

  /** Get user's quests collection reference */
  questsCollection(uid: string): CollectionReference {
    return collection(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.QUESTS);
  }

  /** Get specific quest document reference */
  questDoc(uid: string, questId: string): DocumentReference {
    return doc(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.QUESTS, questId);
  }

  // ==========================================
  // History
  // ==========================================

  /** Get user's history collection reference */
  historyCollection(uid: string): CollectionReference {
    return collection(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.HISTORY);
  }

  /** Get specific history entry document reference */
  historyDoc(uid: string, date: string): DocumentReference {
    return doc(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.HISTORY, date);
  }

  // ==========================================
  // Archived History
  // ==========================================

  /** Get user's archived history collection reference */
  archivedHistoryCollection(uid: string): CollectionReference {
    return collection(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.ARCHIVED_HISTORY);
  }

  /** Get specific archived history document reference */
  archivedHistoryDoc(uid: string, archiveId: string): DocumentReference {
    return doc(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.ARCHIVED_HISTORY, archiveId);
  }

  // ==========================================
  // Oracle Chat
  // ==========================================

  /** Get user's oracle chat collection reference */
  oracleChatCollection(uid: string): CollectionReference {
    return collection(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.ORACLE_CHAT);
  }

  /** Get specific chat message document reference */
  oracleChatDoc(uid: string, messageId: string): DocumentReference {
    return doc(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.ORACLE_CHAT, messageId);
  }

  // ==========================================
  // Friends
  // ==========================================

  /** Get user's friends collection reference */
  friendsCollection(uid: string): CollectionReference {
    return collection(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.FRIENDS);
  }

  /** Get specific friend document reference */
  friendDoc(uid: string, friendId: string): DocumentReference {
    return doc(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.FRIENDS, friendId);
  }

  // ==========================================
  // Active Challenges (User Subcollection)
  // ==========================================

  /** Get user's active challenges collection reference */
  activeChallengesCollection(uid: string): CollectionReference {
    return collection(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.ACTIVE_CHALLENGES);
  }

  /** Get specific active challenge document reference */
  activeChallengeDoc(uid: string, challengeId: string): DocumentReference {
    return doc(this.ensureDb(), COLLECTIONS.USERS, uid, USER_SUBCOLLECTIONS.ACTIVE_CHALLENGES, challengeId);
  }

  // ==========================================
  // Top-Level Collections
  // ==========================================

  /** Get challenges collection reference */
  challengesCollection(): CollectionReference {
    return collection(this.ensureDb(), COLLECTIONS.CHALLENGES);
  }

  /** Get specific challenge document reference */
  challengeDoc(challengeId: string): DocumentReference {
    return doc(this.ensureDb(), COLLECTIONS.CHALLENGES, challengeId);
  }

  /** Get friend requests collection reference */
  friendRequestsCollection(): CollectionReference {
    return collection(this.ensureDb(), COLLECTIONS.FRIEND_REQUESTS);
  }

  /** Get specific friend request document reference */
  friendRequestDoc(requestId: string): DocumentReference {
    return doc(this.ensureDb(), COLLECTIONS.FRIEND_REQUESTS, requestId);
  }
}

// Export singleton instance
export const fbPaths = new FirebasePathsService();

// Export class for testing or custom instances
export { FirebasePathsService };
