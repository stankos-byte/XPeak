

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

export type WidgetId = 'identity' | 'skillMatrix' | 'evolution' | 'objectives' | 'calendar' | 'friends';

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
  status: 'completed' | 'pending' | 'in-progress';
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
}

export interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  isHabit: boolean;
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

export interface UserProfile {
  name: string;
  totalXP: number;
  level: number;
  skills: Record<SkillCategory, SkillProgress>;
  history: {
    date: string;
    xpGained: number;
    taskId: string;
  }[];
  identity: string;
  goals: Goal[];
  templates: TaskTemplate[];
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

export interface ChallengeQuestTask {
  task_id: string;
  name: string;
  // For competitive mode: separate status tracking
  myStatus?: 'completed' | 'pending' | 'in-progress';
  opponentStatus?: 'completed' | 'pending' | 'in-progress';
  // For coop mode: unified status and who completed it
  status?: 'completed' | 'pending' | 'in-progress';
  completedBy?: string; // User ID who completed (for coop tracking)
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  description?: string;
}

export interface ChallengeQuestCategory {
  id: string;
  title: string;
  tasks: ChallengeQuestTask[];
}

export interface FriendChallenge {
  id: string;
  title: string;
  description: string;
  partnerIds: string[]; // Array to support multiple partners/opponents
  categories: ChallengeQuestCategory[];
  mode: ChallengeModeType;
  timeLeft: string;
  completedBy?: string; // For competitive: winner ID; For coop: tracks when mission completes
  completedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text?: string;
  isTool?: boolean;
}
