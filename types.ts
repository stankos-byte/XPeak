

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  EPIC = 'Epic'
}

export enum SkillCategory {
  PHYSICAL = 'Physical',
  MENTAL = 'Mental',
  PROFESSIONAL = 'Professional',
  SOCIAL = 'Social',
  CREATIVE = 'Creative',
  MISC = 'Default'
}

export type WidgetId = 'identity' | 'skillMatrix' | 'evolution' | 'tasks' | 'calendar' | 'friends';

export interface WidgetConfig {
  id: WidgetId;
  enabled: boolean;
  order: number;
}

export interface ProfileLayout {
  widgets: WidgetConfig[];
}

export interface QuestTask {
  task_id: string;
  name: string;
  completed: boolean;
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  description?: string;
}

export interface QuestCategory {
  id: string;
  title: string;
  tasks: QuestTask[];
}

export interface MainQuest {
  id: string;
  title: string;
  categories: QuestCategory[];
  /** Computed index: total number of tasks across all categories */
  totalTasks?: number;
  /** Computed index: number of completed tasks */
  completedTasks?: number;
  /** Computed index: unique skill categories used (for array-contains queries) */
  skillCategories?: SkillCategory[];
  /** Computed index: true when all tasks are complete */
  isComplete?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  isHabit: boolean;
  completed: boolean;
  streak: number;
  lastCompletedDate: string | null;
  createdAt: string;
  /** Optional tags for flexible filtering with array-contains queries */
  tags?: string[];
}

export interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  isHabit: boolean;
  /** Optional tags for template organization */
  tags?: string[];
}

export interface Goal {
  id: string;
  title: string;
  completed: boolean;
}

export interface SkillProgress {
  category: SkillCategory;
  xp: number;
  level: number;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD format
  totalXP: number;
  taskCount: number;
  taskIds?: string[]; // Optional: for detailed view if needed
}

export interface UserProfile {
  name: string;
  totalXP: number;
  level: number;
  skills: Record<SkillCategory, SkillProgress>;
  history: DailyActivity[]; // Changed to daily aggregates
  identity: string;
  // goals and templates moved to subcollections for scalability
  // but included in the runtime object for component compatibility
  goals?: Goal[];
  templates?: TaskTemplate[];
  layout?: ProfileLayout;
}

export interface XPResult {
  total: number;
  breakdown: {
    base: number;
    difficultyMult: number;
    streakMult: number;
    bonus: number;
  }
}

export interface Friend {
  id: string;
  name: string;
  level: number;
  xp: number;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastActive: string;
  color: string;
}

export type ChallengeModeType = 'competitive' | 'coop';

// Task status type for challenges
export type TaskStatus = 'completed' | 'pending' | 'in-progress';

export interface ChallengeQuestTask {
  task_id: string;
  name: string;
  // Status tracking by user ID - works for both competitive and coop modes
  // Key is the user's UID, value is their status for this task
  statusByUser: Record<string, TaskStatus>;
  // For coop mode: who completed it (optional, for display purposes)
  completedBy?: string;
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  description?: string;
}

export interface ChallengeQuestCategory {
  id: string;
  title: string;
  tasks: ChallengeQuestTask[];
}

// Challenge status enum
export type ChallengeStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export interface FriendChallenge {
  id: string;
  title: string;
  description: string;
  creatorUID: string; // UID of challenge creator
  partnerIds: string[]; // Array of all participant UIDs (including creator)
  categories: ChallengeQuestCategory[];
  mode: ChallengeModeType;
  status: ChallengeStatus;
  expiresAt: string; // ISO timestamp - client calculates "time left" from this
  createdAt: string; // ISO timestamp
  completedBy?: string; // For competitive: winner ID; For coop: tracks when mission completes
  completedAt?: string; // ISO timestamp
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text?: string;
  isTool?: boolean;
}

// ============================================
// Subscription types
// ============================================

export type SubscriptionStatus = 'free' | 'active' | 'canceled' | 'past_due' | 'payment_failed' | 'refunded';
export type SubscriptionPlan = 'free' | 'pro';
export type BillingCycle = 'monthly' | 'yearly' | null;

export interface TokenUsage {
  inputTokens: number;        // Total input tokens used
  outputTokens: number;       // Total output tokens used
  totalCost: number;          // Total cost in USD
  lastResetAt: Date | null;   // When usage was last reset (null for free users)
  lastUpdatedAt: Date;        // Last usage update timestamp
  isLimitReached: boolean;    // Quick flag for limit checking
}

export interface SubscriptionDocument {
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  polarSubscriptionId: string | null;
  polarCustomerId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
  tokenUsage?: TokenUsage;
}

// ============================================
// Notification types
// ============================================

export type NotificationType = 
  | 'payment_failed' 
  | 'card_expiring' 
  | 'subscription_canceled' 
  | 'refund_issued' 
  | 'plan_changed';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export interface NotificationDocument {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface WebhookEventLog {
  eventId: string; // For idempotency
  eventType: string;
  processed: boolean;
  processedAt?: Date;
  payload?: any;
  error?: string;
}

// ============================================
// Utility functions for challenge data
// ============================================

/**
 * Calculate human-readable time left from an ISO timestamp
 * @param expiresAt ISO timestamp string
 * @returns Human-readable string like "2d 4h", "18h", "5m", or "Expired"
 */
export const calculateTimeLeft = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return diffHours > 0 ? `${diffDays}d ${diffHours}h` : `${diffDays}d`;
  } else if (diffHours > 0) {
    return `${diffHours}h`;
  } else {
    return `${diffMinutes}m`;
  }
};

/**
 * Check if a challenge has expired
 * @param expiresAt ISO timestamp string
 * @returns true if the challenge has expired
 */
export const isChallengeExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt).getTime() <= Date.now();
};

// ============================================
// Utility functions for quest data
// ============================================

/**
 * Compute index fields for a quest (for efficient Firestore queries)
 * Call this before saving a quest to ensure index fields are up-to-date
 * @param quest The quest to compute indexes for
 * @returns Quest with computed index fields
 */
export const computeQuestIndexes = (quest: MainQuest): MainQuest => {
  let totalTasks = 0;
  let completedTasks = 0;
  const skillCategoriesSet = new Set<SkillCategory>();

  quest.categories.forEach(category => {
    category.tasks.forEach(task => {
      totalTasks++;
      if (task.completed) {
        completedTasks++;
      }
      skillCategoriesSet.add(task.skillCategory);
    });
  });

  return {
    ...quest,
    totalTasks,
    completedTasks,
    skillCategories: Array.from(skillCategoriesSet),
    isComplete: totalTasks > 0 && completedTasks === totalTasks,
  };
};

/**
 * Compute completion percentage for a quest
 * @param quest The quest to calculate completion for
 * @returns Percentage (0-100)
 */
export const getQuestCompletionPercent = (quest: MainQuest): number => {
  const total = quest.totalTasks ?? quest.categories.reduce(
    (sum, cat) => sum + cat.tasks.length, 0
  );
  const completed = quest.completedTasks ?? quest.categories.reduce(
    (sum, cat) => sum + cat.tasks.filter(t => t.completed).length, 0
  );
  
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

// ==========================================
// Maintenance Mode Configuration
// ==========================================

/**
 * Maintenance mode configuration stored in Firestore
 * Path: config/maintenance
 */
export interface MaintenanceConfig {
  /** Whether maintenance mode is currently active */
  isMaintenanceMode: boolean;
  
  /** Title to display on maintenance page */
  title: string;
  
  /** Subtitle/message to display on maintenance page */
  subtitle: string;
  
  /** Optional scheduled end date for maintenance */
  date?: string;
  
  /** Last time this config was updated */
  lastUpdatedAt: Date | string;
}
