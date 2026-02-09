/**
 * Application Configuration
 * 
 * Centralized configuration for all hardcoded values.
 * Makes it easy to adjust app behavior without searching through code.
 */

// ==========================================
// UI Configuration
// ==========================================

export const UI_CONFIG = {
  // Animations
  levelUpDuration: 3000, // milliseconds
  toastDuration: 3000, // milliseconds
  modalTransitionDuration: 200, // milliseconds
  autoSlideInterval: 3000, // milliseconds for auth page carousels
  
  // Delays
  authRedirectDelay: 100, // milliseconds - delay for auth redirect check
  rateLimitDelay: 100, // milliseconds - delay between batch operations
  
  // Limits
  maxHistoryDisplay: 10, // maximum history items to show
  maxFriendsDisplay: 50, // maximum friends to display at once
  maxChallengesDisplay: 20, // maximum challenges to display at once
  
  // Pagination
  tasksPerPage: 50,
  questsPerPage: 20,
  messagesPerPage: 50,
} as const;

// ==========================================
// Theme Colors
// ==========================================

export const THEME_COLORS = {
  // Primary colors
  primary: '#00e1ff', // Cyan
  primaryDark: '#00b8d4',
  primaryLight: '#33e7ff',
  
  // Background colors
  background: '#0a0a0f',
  surface: '#13131a',
  surfaceHover: '#1a1a24',
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#8b92a7',
  textTertiary: '#6b7280',
  
  // Status colors
  success: '#10b981', // Emerald
  error: '#ef4444', // Red
  warning: '#f59e0b', // Amber
  info: '#3b82f6', // Blue
  
  // Skill category colors
  physical: '#ef4444', // Red
  mental: '#3b82f6', // Blue
  professional: '#f59e0b', // Amber
  social: '#10b981', // Emerald
  creative: '#8b5cf6', // Violet
  misc: '#71717a', // Zinc/Gray
} as const;

// ==========================================
// External URLs
// ==========================================

export const EXTERNAL_URLS = {
  // Auth page images (Unsplash)
  loginSlides: [
    {
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070',
      title: 'Welcome Back,',
      subtitle: 'Continue Your Journey',
    },
    {
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070',
      title: 'Your Quests Await,',
      subtitle: 'Keep Leveling Up',
    },
    {
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070',
      title: 'Progress Awaits,',
      subtitle: 'Resume Your Adventure',
    },
  ],
  signupSlides: [
    {
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070',
      title: 'Begin Your Journey,',
      subtitle: 'Transform Into Your Best Self',
    },
    {
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070',
      title: 'Level Up Your Life,',
      subtitle: 'One Quest at a Time',
    },
    {
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070',
      title: 'Join the Adventure,',
      subtitle: 'Start Building Your Legacy',
    },
  ],
  
  // Social links
  discord: 'https://discord.gg/yourdiscord',
  twitter: 'https://twitter.com/yourapp',
  github: 'https://github.com/yourapp',
  
  // Documentation
  docs: 'https://docs.yourapp.com',
  apiDocs: 'https://api.yourapp.com/docs',
  support: 'https://support.yourapp.com',
} as const;

// ==========================================
// Game Mechanics
// ==========================================

export const GAME_CONFIG = {
  // XP and Leveling
  baseXP: 10, // Base XP for task completion
  difficultyMultipliers: {
    Easy: 1.0,
    Medium: 1.5,
    Hard: 2.0,
    Epic: 3.0,
  },
  
  // Leveling formula: XP needed = 100 * level^1.5
  levelingExponent: 1.5,
  levelingBase: 100,
  
  // Streaks
  streakBonusMultiplier: 0.1, // 10% bonus per streak day
  maxStreakBonus: 2.0, // Maximum 200% (20 day streak)
  
  // Habits
  habitCompletionThreshold: 0.8, // 80% completion required
  
  // Challenges
  defaultChallengeDuration: 7, // days
  minChallengeDuration: 1,
  maxChallengeDuration: 30,
  
  // Quests
  maxQuestCategories: 10,
  maxTasksPerCategory: 20,
} as const;

// ==========================================
// API Configuration
// ==========================================

export const API_CONFIG = {
  // Timeouts
  defaultTimeout: 30000, // 30 seconds
  uploadTimeout: 120000, // 2 minutes for uploads
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  retryMultiplier: 2, // exponential backoff
  
  // Rate limiting (client-side)
  maxConcurrentRequests: 5,
  requestDelay: 100, // milliseconds between requests
} as const;

// ==========================================
// Storage Configuration
// ==========================================

export const STORAGE_CONFIG = {
  // LocalStorage keys
  keys: {
    user: 'xpeak_user',
    tasks: 'xpeak_tasks',
    quests: 'xpeak_quests',
    theme: 'xpeak_theme',
    preferences: 'xpeak_preferences',
  },
  
  // Cache duration
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
  
  // File upload limits
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxImageSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedFileTypes: ['application/pdf', 'text/plain', 'application/json'],
} as const;

// ==========================================
// Feature Flags
// ==========================================

export const FEATURE_FLAGS = {
  // Features that can be toggled
  enableChallenges: true,
  enableFriends: true,
  enableAIOracle: true,
  enableQuests: true,
  enableSubscriptions: true,
  enableNotifications: true,
  enableAnalytics: import.meta.env.PROD,
  enableDebugMode: import.meta.env.DEV,
  
  // Experimental features
  enableExperimentalUI: false,
  enableBetaFeatures: false,
} as const;

// ==========================================
// Validation Rules
// ==========================================

export const VALIDATION = {
  // User input limits
  minNicknameLength: 2,
  maxNicknameLength: 30,
  minPasswordLength: 8,
  maxPasswordLength: 128,
  
  // Task/Quest limits
  minTaskNameLength: 1,
  maxTaskNameLength: 100,
  maxTaskDescriptionLength: 500,
  
  minQuestTitleLength: 3,
  maxQuestTitleLength: 100,
  maxQuestDescriptionLength: 1000,
  
  // Challenge limits
  minChallengeTitle: 3,
  maxChallengeTitle: 100,
  maxChallengeDescription: 500,
  minParticipants: 2,
  maxParticipants: 10,
  
  // Message limits
  minMessageLength: 1,
  maxMessageLength: 2000,
  
  // File validation
  maxFileSizeMB: 5,
  maxImageSizeMB: 10,
} as const;

// ==========================================
// Accessibility Configuration
// ==========================================

export const A11Y_CONFIG = {
  // ARIA labels
  labels: {
    mainNavigation: 'Main navigation',
    userMenu: 'User menu',
    taskList: 'Task list',
    questList: 'Quest list',
    friendsList: 'Friends list',
    notifications: 'Notifications',
    settings: 'Settings',
  },
  
  // Keyboard shortcuts
  shortcuts: {
    openTaskModal: 'n',
    openQuestModal: 'q',
    openSearch: '/',
    closeModal: 'Escape',
    save: 'ctrl+s',
  },
  
  // Focus management
  focusTrapEnabled: true,
  skipLinksEnabled: true,
  
  // Reduced motion
  respectReducedMotion: true,
} as const;

// ==========================================
// SEO & Meta
// ==========================================

export const SEO_CONFIG = {
  siteName: 'XPeak - Level Up Your Life',
  siteDescription: 'Gamify your life with XPeak. Track tasks, complete quests, and level up in real life.',
  siteUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  twitterHandle: '@xpeak',
  
  // Open Graph defaults
  ogImage: '/og-image.png',
  ogType: 'website',
  
  // Structured data
  organizationType: 'SoftwareApplication',
  applicationCategory: 'ProductivityApplication',
} as const;

// ==========================================
// Error Messages
// ==========================================

export const ERROR_MESSAGES = {
  // Network errors
  networkError: 'Network error. Please check your connection.',
  timeout: 'Request timed out. Please try again.',
  serverError: 'Server error. Please try again later.',
  
  // Authentication errors
  authRequired: 'You must be logged in to perform this action.',
  invalidCredentials: 'Invalid email or password.',
  emailInUse: 'Email address is already in use.',
  weakPassword: 'Password is too weak. Please use at least 8 characters.',
  
  // Validation errors
  requiredField: 'This field is required.',
  invalidEmail: 'Please enter a valid email address.',
  invalidUrl: 'Please enter a valid URL.',
  fileTooLarge: 'File size exceeds the maximum allowed size.',
  invalidFileType: 'File type is not supported.',
  
  // Generic errors
  unknownError: 'An unexpected error occurred. Please try again.',
  permissionDenied: 'You do not have permission to perform this action.',
  notFound: 'The requested resource was not found.',
  rateLimitExceeded: 'Too many requests. Please slow down.',
} as const;

// ==========================================
// Success Messages
// ==========================================

export const SUCCESS_MESSAGES = {
  // Task operations
  taskCreated: 'Task created successfully!',
  taskUpdated: 'Task updated successfully!',
  taskCompleted: 'Task completed! XP earned.',
  taskDeleted: 'Task deleted successfully.',
  
  // Quest operations
  questCreated: 'Quest created successfully!',
  questUpdated: 'Quest updated successfully!',
  questCompleted: 'Quest completed! Bonus XP earned.',
  questDeleted: 'Quest deleted successfully.',
  
  // Challenge operations
  challengeCreated: 'Challenge created successfully!',
  challengeAccepted: 'Challenge accepted!',
  challengeCompleted: 'Challenge completed!',
  
  // Profile operations
  profileUpdated: 'Profile updated successfully!',
  passwordChanged: 'Password changed successfully!',
  
  // Generic
  changesSaved: 'Changes saved successfully!',
  actionCompleted: 'Action completed successfully!',
} as const;

// Export all configs as a single object for convenience
export const APP_CONFIG = {
  ui: UI_CONFIG,
  theme: THEME_COLORS,
  urls: EXTERNAL_URLS,
  game: GAME_CONFIG,
  api: API_CONFIG,
  storage: STORAGE_CONFIG,
  features: FEATURE_FLAGS,
  validation: VALIDATION,
  a11y: A11Y_CONFIG,
  seo: SEO_CONFIG,
  errors: ERROR_MESSAGES,
  success: SUCCESS_MESSAGES,
} as const;

export default APP_CONFIG;
