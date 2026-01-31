# Xpeak Firestore Database Schema

> Complete database architecture for the Xpeak gamification platform using Firebase Firestore.
> All user data follows the `users/{UID}` path structure.

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Enums & Constants](#enums--constants)
3. [Top-Level Collections](#top-level-collections)
   - [users](#users-collection)
   - [friendRequests](#friendrequests-collection)
   - [challenges](#challenges-collection)
4. [User Subcollections](#user-subcollections)
   - [friends](#friends-subcollection)
   - [tasks](#tasks-subcollection)
   - [quests](#quests-subcollection)
   - [oracleChat](#oraclechat-subcollection)
   - [activeChallenges](#activechallenges-subcollection)
   - [history](#history-subcollection)
   - [archivedHistory](#archivedhistory-subcollection)
5. [Indexing Requirements](#indexing-requirements)
6. [Security Rules](#security-rules)

---

## Database Overview

```
firestore-root/
│
├── users/                          # Top-level: User profiles
│   └── {UID}/                      # User document
│       ├── friends/                # Accepted friendships
│       │   └── {friendUID}
│       ├── tasks/                  # Daily tasks & habits
│       │   └── {taskId}
│       ├── quests/                 # Main quests with categories
│       │   └── {questId}
│       ├── oracleChat/             # AI assistant chat history
│       │   └── {messageId}
│       ├── activeChallenges/       # References to active challenges
│       │   └── {challengeId}
│       ├── history/                # Recent 60-day activity
│       │   └── {date}
│       └── archivedHistory/        # Archived history batches
│           └── {archiveId}
│
├── friendRequests/                 # Top-level: Pending friend invitations
│   └── {requestId}
│
└── challenges/                     # Top-level: Shared challenge documents
    └── {challengeId}
```

---

## Enums & Constants

### Difficulty
```typescript
enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  EPIC = 'Epic'
}
```

### SkillCategory
```typescript
enum SkillCategory {
  PHYSICAL = 'Physical',
  MENTAL = 'Mental',
  PROFESSIONAL = 'Professional',
  SOCIAL = 'Social',
  CREATIVE = 'Creative',
  MISC = 'Default'
}
```

### ChallengeMode
```typescript
enum ChallengeMode {
  COMPETITIVE = 'competitive',
  COOP = 'coop'
}
```

### TaskStatus
```typescript
type TaskStatus = 'pending' | 'completed' | 'in-progress';
```

### FriendRequestStatus
```typescript
enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked'
}
```

### AuthProvider
```typescript
enum AuthProvider {
  GOOGLE = 'google',
  EMAIL = 'email',
  APPLE = 'apple'
}
```

### Theme
```typescript
enum Theme {
  DARK = 'dark',
  LIGHT = 'light'
}
```

---

## Top-Level Collections

### `users` Collection

**Path:** `users/{UID}`

The core user document containing profile data, gamification stats, and embedded settings.

#### Document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uid` | `string` | Yes | Firebase Auth UID (matches document ID) |
| `email` | `string` | Yes | User's email address |
| `name` | `string` | Yes | User's display name |
| `photoURL` | `string \| null` | No | Profile photo URL |
| `createdAt` | `timestamp` | Yes | Account creation timestamp |
| `updatedAt` | `timestamp` | Yes | Last document update timestamp |
| `lastLoginAt` | `timestamp` | Yes | Last login timestamp |
| `authProvider` | `AuthProvider` | Yes | Authentication provider used |
| `totalXP` | `number` | Yes | Total XP earned (indexed for leaderboards) |
| `level` | `number` | Yes | Current level (indexed for leaderboards) |
| `identity` | `string` | No | Aspirational Directive (Identity Core) |
| `skills` | `SkillsMap` | Yes | Skill progression by category |
| `goals` | `Goal[]` | Yes | User's tasks |
| `templates` | `TaskTemplate[]` | Yes | Saved task templates |
| `layout` | `ProfileLayout` | Yes | Widget layout preferences |
| `settings` | `UserSettings` | Yes | User preferences |

#### Embedded Types

##### SkillsMap
```typescript
interface SkillsMap {
  [SkillCategory.PHYSICAL]: SkillData;
  [SkillCategory.MENTAL]: SkillData;
  [SkillCategory.PROFESSIONAL]: SkillData;
  [SkillCategory.SOCIAL]: SkillData;
  [SkillCategory.CREATIVE]: SkillData;
  [SkillCategory.MISC]: SkillData;
}

// Note: category field removed as it's redundant (the key IS the category)
interface SkillData {
  xp: number;
  level: number;
}
```

##### Goal
```typescript
interface Goal {
  id: string;
  title: string;
  completed: boolean;
}
```

##### TaskTemplate
```typescript
interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  isHabit: boolean;
}
```

##### ProfileLayout
```typescript
interface ProfileLayout {
  widgets: WidgetConfig[];
}

interface WidgetConfig {
  id: WidgetId;
  enabled: boolean;
  order: number;
}

type WidgetId = 'identity' | 'skillMatrix' | 'evolution' | 'tasks' | 'calendar' | 'friends';
```

##### UserSettings
```typescript
interface UserSettings {
  theme: Theme;
  notifications: NotificationSettings;
}

interface NotificationSettings {
  deepWorkMode: boolean;      // Mutes all notifications when true
  contractUpdates: boolean;   // Challenge/contract activity alerts
  levelUps: boolean;          // Level up celebrations
}
```

#### Example Document

```json
{
  "uid": "abc123xyz",
  "email": "user@example.com",
  "name": "Protocol-01",
  "photoURL": "https://storage.googleapis.com/...",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-21T14:45:00Z",
  "lastLoginAt": "2026-01-21T14:45:00Z",
  "authProvider": "google",
  "totalXP": 4850,
  "level": 12,
  "identity": "I am becoming a disciplined software engineer who ships quality code daily.",
  "skills": {
    "Physical": { "xp": 1200, "level": 5 },
    "Mental": { "xp": 2100, "level": 8 },
    "Professional": { "xp": 3500, "level": 10 },
    "Social": { "xp": 800, "level": 4 },
    "Creative": { "xp": 450, "level": 3 },
    "Default": { "xp": 200, "level": 2 }
  },
  "goals": [
    { "id": "g1", "title": "Complete 30-day coding streak", "completed": false },
    { "id": "g2", "title": "Reach Level 15", "completed": false }
  ],
  "templates": [
    {
      "id": "t1",
      "title": "Morning Workout",
      "description": "30 min exercise routine",
      "difficulty": "Medium",
      "skillCategory": "Physical",
      "isHabit": true
    }
  ],
  "layout": {
    "widgets": [
      { "id": "identity", "enabled": true, "order": 0 },
      { "id": "skillMatrix", "enabled": true, "order": 1 },
      { "id": "evolution", "enabled": true, "order": 2 },
      { "id": "calendar", "enabled": true, "order": 3 },
      { "id": "friends", "enabled": true, "order": 4 },
      { "id": "tasks", "enabled": true, "order": 5 }
    ]
  },
  "settings": {
    "theme": "dark",
    "notifications": {
      "deepWorkMode": false,
      "contractUpdates": true,
      "levelUps": true
    }
  }
}
```

---

### `friendRequests` Collection

**Path:** `friendRequests/{requestId}`

Stores pending friend invitations for the bidirectional friendship system.

#### Document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Request ID (matches document ID) |
| `fromUID` | `string` | Yes | Sender's UID |
| `toUID` | `string` | Yes | Recipient's UID |
| `fromDisplayName` | `string` | Yes | Sender's display name (denormalized) |
| `fromPhotoURL` | `string \| null` | No | Sender's photo URL (denormalized) |
| `fromLevel` | `number` | Yes | Sender's level (denormalized) |
| `status` | `FriendRequestStatus` | Yes | Current status of the request |
| `createdAt` | `timestamp` | Yes | When the request was sent |
| `updatedAt` | `timestamp` | Yes | Last status change |

#### Example Document

```json
{
  "id": "req_abc123",
  "fromUID": "user123",
  "toUID": "user456",
  "fromDisplayName": "Cyber-Stalker",
  "fromPhotoURL": "https://storage.googleapis.com/...",
  "fromLevel": 12,
  "status": "pending",
  "createdAt": "2026-01-20T10:00:00Z",
  "updatedAt": "2026-01-20T10:00:00Z"
}
```

---

### `challenges` Collection

**Path:** `challenges/{challengeId}`

Shared challenge documents that both participants can listen to for real-time updates.

#### Document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Challenge ID (matches document ID) |
| `title` | `string` | Yes | Challenge title |
| `description` | `string` | No | Challenge description/terms |
| `creatorUID` | `string` | Yes | UID of the challenge creator |
| `partnerIds` | `string[]` | Yes | Array of all participant/partner UIDs |
| `mode` | `ChallengeMode` | Yes | Competitive or cooperative |
| `categories` | `ChallengeCategory[]` | Yes | Challenge breakdown |
| `status` | `ChallengeStatus` | Yes | active, completed, cancelled, expired |
| `completedBy` | `string \| null` | No | Winner UID (competitive) or completion marker (coop) |
| `completedAt` | `timestamp \| null` | No | When challenge was completed |
| `expiresAt` | `timestamp` | Yes | When challenge expires (client calculates "time left") |
| `createdAt` | `timestamp` | Yes | When challenge was created |

#### Embedded Types

##### ChallengeStatus
```typescript
enum ChallengeStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}
```

##### ChallengeCategory
```typescript
interface ChallengeCategory {
  id: string;
  title: string;
  tasks: ChallengeTask[];
}
```

##### ChallengeTask
```typescript
type TaskStatus = 'completed' | 'pending' | 'in-progress';

interface ChallengeTask {
  task_id: string;
  name: string;
  description?: string;
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  
  // Status tracking by user ID - works for both competitive and coop modes
  // Key is the user's UID, value is their status for this task
  // Absent key = 'pending' (no need to store pending status)
  statusByUser: Record<string, TaskStatus>;
  
  // For coop mode: who completed it (for display purposes)
  completedBy?: string;
}
```

#### Example Document (Competitive)

```json
{
  "id": "chal_xyz789",
  "title": "Sprint to Level 15",
  "description": "First operative to reach Level 15 claims the victory.",
  "creatorUID": "user123",
  "partnerIds": ["user123", "user456"],
  "mode": "competitive",
  "categories": [
    {
      "id": "cat1",
      "title": "Week 1 - Foundation",
      "tasks": [
        {
          "task_id": "t1",
          "name": "30min morning workout",
          "difficulty": "Easy",
          "skillCategory": "Physical",
          "statusByUser": {
            "user123": "completed",
            "user456": "pending"
          }
        },
        {
          "task_id": "t2",
          "name": "Read 20 pages",
          "difficulty": "Easy",
          "skillCategory": "Mental",
          "statusByUser": {
            "user123": "completed",
            "user456": "in-progress"
          }
        }
      ]
    }
  ],
  "status": "active",
  "completedBy": null,
  "completedAt": null,
  "expiresAt": "2026-01-28T10:00:00Z",
  "createdAt": "2026-01-21T10:00:00Z"
}
```

#### Example Document (Coop)

```json
{
  "id": "chal_coop456",
  "title": "Deep Work Protocol",
  "description": "Work together to complete all productivity tasks.",
  "creatorUID": "user123",
  "partnerIds": ["user123", "user456"],
  "mode": "coop",
  "categories": [
    {
      "id": "cat1",
      "title": "Daily Rituals",
      "tasks": [
        {
          "task_id": "t1",
          "name": "Morning meditation 10min",
          "difficulty": "Easy",
          "skillCategory": "Mental",
          "statusByUser": {
            "user123": "completed"
          },
          "completedBy": "user123"
        },
        {
          "task_id": "t2",
          "name": "Journal 5 min",
          "difficulty": "Easy",
          "skillCategory": "Creative",
          "statusByUser": {}
        }
      ]
    }
  ],
  "status": "active",
  "completedBy": null,
  "completedAt": null,
  "expiresAt": "2026-01-22T06:00:00Z",
  "createdAt": "2026-01-21T06:00:00Z"
}
```

---

## User Subcollections

### `friends` Subcollection

**Path:** `users/{UID}/friends/{friendUID}`

Stores accepted bidirectional friendships. When a friend request is accepted, a document is created in both users' `friends` subcollections.

#### Document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Friend's ID (matches document ID) |
| `name` | `string` | Yes | Friend's display name (denormalized) |
| `photoURL` | `string \| null` | No | Friend's photo URL (denormalized) |
| `level` | `number` | Yes | Friend's level (denormalized, update periodically) |
| `xp` | `number` | Yes | Friend's XP (denormalized for leaderboards) |
| `status` | `OnlineStatus` | Yes | Online presence status |
| `lastActive` | `timestamp` | Yes | Last activity timestamp |
| `color` | `string` | Yes | Assigned color for UI |
| `friendsSince` | `timestamp` | Yes | When friendship was established |

#### OnlineStatus
```typescript
enum OnlineStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  BUSY = 'busy'
}
```

#### Example Document

```json
{
  "id": "friend456",
  "name": "Neon-Drifter",
  "photoURL": "https://storage.googleapis.com/...",
  "level": 9,
  "xp": 3200,
  "status": "online",
  "lastActive": "2026-01-21T14:30:00Z",
  "color": "#10b981",
  "friendsSince": "2026-01-10T08:00:00Z"
}
```

---

### `tasks` Subcollection

**Path:** `users/{UID}/tasks/{taskId}`

Daily tasks and recurring habits.

#### Document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Task ID (matches document ID) |
| `title` | `string` | Yes | Task title |
| `description` | `string` | No | Task description |
| `difficulty` | `Difficulty` | Yes | Task difficulty |
| `skillCategory` | `SkillCategory` | Yes | Associated skill |
| `isHabit` | `boolean` | Yes | True if recurring habit |
| `completed` | `boolean` | Yes | Completion status for today |
| `streak` | `number` | Yes | Current streak count (habits only) |
| `lastCompletedDate` | `timestamp \| null` | No | When last completed |
| `createdAt` | `timestamp` | Yes | Task creation date |

#### Example Document

```json
{
  "id": "task_abc123",
  "title": "Morning Workout",
  "description": "30 minutes of exercise",
  "difficulty": "Medium",
  "skillCategory": "Physical",
  "isHabit": true,
  "completed": false,
  "streak": 7,
  "lastCompletedDate": "2026-01-20T07:30:00Z",
  "createdAt": "2026-01-01T10:00:00Z"
}
```

---

### `quests` Subcollection

**Path:** `users/{UID}/quests/{questId}`

Main quests (large projects) with nested categories and tasks.

#### Document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Quest ID (matches document ID) |
| `title` | `string` | Yes | Quest title |
| `categories` | `QuestCategory[]` | Yes | Quest breakdown |
| `createdAt` | `timestamp` | Yes | Quest creation date |
| `completedAt` | `timestamp \| null` | No | When quest was completed |

#### Embedded Types

##### QuestCategory
```typescript
interface QuestCategory {
  id: string;
  title: string;
  tasks: QuestTask[];
}
```

##### QuestTask
```typescript
interface QuestTask {
  task_id: string;
  name: string;
  description?: string;
  completed: boolean;
  difficulty: Difficulty;
  skillCategory: SkillCategory;
}
```

#### Example Document

```json
{
  "id": "quest_learn_rust",
  "title": "Master Rust Programming",
  "categories": [
    {
      "id": "cat1",
      "title": "Phase 1: Fundamentals",
      "tasks": [
        {
          "task_id": "t1",
          "name": "Complete Rust Book Chapter 1-3",
          "description": "Cover ownership, borrowing, and lifetimes",
          "completed": true,
          "difficulty": "Medium",
          "skillCategory": "Professional"
        },
        {
          "task_id": "t2",
          "name": "Build Hello World CLI",
          "completed": false,
          "difficulty": "Easy",
          "skillCategory": "Professional"
        }
      ]
    },
    {
      "id": "cat2",
      "title": "Phase 2: Intermediate",
      "tasks": [
        {
          "task_id": "t3",
          "name": "Learn async/await patterns",
          "completed": false,
          "difficulty": "Hard",
          "skillCategory": "Professional"
        }
      ]
    }
  ],
  "createdAt": "2026-01-15T10:00:00Z",
  "completedAt": null
}
```

---

### `oracleChat` Subcollection

**Path:** `users/{UID}/oracleChat/{messageId}`

AI assistant (Oracle) conversation history, persisted across devices.

#### Document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Message ID (matches document ID) |
| `role` | `MessageRole` | Yes | Who sent the message |
| `text` | `string` | No | Message content |
| `isTool` | `boolean` | No | True if this is a tool call result |
| `createdAt` | `timestamp` | Yes | Message timestamp |

#### MessageRole
```typescript
enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}
```

#### Example Document

```json
{
  "id": "msg_123",
  "role": "user",
  "text": "Create a quest for learning TypeScript",
  "isTool": false,
  "createdAt": "2026-01-21T10:00:00Z"
}
```

```json
{
  "id": "msg_124",
  "role": "model",
  "text": "I've created a comprehensive TypeScript quest for you with 3 phases...",
  "isTool": true,
  "createdAt": "2026-01-21T10:00:05Z"
}
```

---

### `activeChallenges` Subcollection

**Path:** `users/{UID}/activeChallenges/{challengeId}`

References to challenges the user is participating in. Points to the shared document in the top-level `challenges` collection.

#### Document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `challengeId` | `string` | Yes | Reference to `challenges/{challengeId}` |
| `title` | `string` | Yes | Challenge title (denormalized) |
| `mode` | `ChallengeMode` | Yes | Challenge mode (denormalized) |
| `opponentUIDs` | `string[]` | Yes | Other participants' UIDs |
| `opponentNames` | `string[]` | Yes | Other participants' names (denormalized) |
| `status` | `ChallengeStatus` | Yes | Current status |
| `joinedAt` | `timestamp` | Yes | When user joined the challenge |

#### Example Document

```json
{
  "challengeId": "chal_xyz789",
  "title": "Sprint to Level 15",
  "mode": "competitive",
  "opponentUIDs": ["user456"],
  "opponentNames": ["Neon-Drifter"],
  "status": "active",
  "joinedAt": "2026-01-21T10:00:00Z"
}
```

---

### `history` Subcollection

**Path:** `users/{UID}/history/{date}`

Recent activity history (last 60 days). Uses date as document ID for easy querying.

#### Document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | `string` | Yes | Date in YYYY-MM-DD format (matches document ID) |
| `totalXP` | `number` | Yes | Total XP earned that day |
| `taskCount` | `number` | Yes | Number of tasks completed |
| `taskIds` | `string[]` | No | IDs of completed tasks |

#### Example Document

```json
{
  "date": "2026-01-21",
  "totalXP": 145,
  "taskCount": 5,
  "taskIds": ["task1", "task2", "task3", "quest_t1", "quest_t2"]
}
```

---

### `archivedHistory` Subcollection

**Path:** `users/{UID}/archivedHistory/{archiveId}`

Archived history batches for entries older than 60 days. Keeps main app performance high.

#### Document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Archive ID (matches document ID) |
| `entries` | `HistoryEntry[]` | Yes | Archived activity entries |
| `startDate` | `string` | Yes | Earliest date in this batch |
| `endDate` | `string` | Yes | Latest date in this batch |
| `totalXP` | `number` | Yes | Total XP in this archive |
| `totalEntries` | `number` | Yes | Number of entries |
| `archivedAt` | `timestamp` | Yes | When this batch was archived |

#### HistoryEntry
```typescript
interface HistoryEntry {
  date: string;       // YYYY-MM-DD
  xpGained: number;
  taskId: string;
}
```

#### Example Document

```json
{
  "id": "archive_2025_q4",
  "entries": [
    { "date": "2025-10-01", "xpGained": 50, "taskId": "task_old1" },
    { "date": "2025-10-01", "xpGained": 30, "taskId": "task_old2" },
    { "date": "2025-10-02", "xpGained": 75, "taskId": "task_old3" }
  ],
  "startDate": "2025-10-01",
  "endDate": "2025-12-31",
  "totalXP": 8450,
  "totalEntries": 312,
  "archivedAt": "2026-01-01T00:00:00Z"
}
```

---

## Indexing Requirements

### Required Composite Indexes

#### Global Leaderboards
```
Collection: users
Fields: totalXP (DESC), uid (ASC)
```

```
Collection: users
Fields: level (DESC), totalXP (DESC)
```

#### Friends Leaderboards
```
Collection Group: friends
Fields: xp (DESC)
```

#### Friend Requests
```
Collection: friendRequests
Fields: toUID (ASC), status (ASC), createdAt (DESC)
```

```
Collection: friendRequests
Fields: fromUID (ASC), status (ASC), createdAt (DESC)
```

#### Challenges by Participant
```
Collection: challenges
Fields: partnerIds (ARRAY_CONTAINS), status (ASC), createdAt (DESC)
```

#### History by Date
```
Collection Group: history
Fields: date (DESC)
```

### Single-Field Indexes

| Collection | Field | Order |
|------------|-------|-------|
| `users` | `totalXP` | DESC |
| `users` | `level` | DESC |
| `users` | `createdAt` | DESC |
| `friendRequests` | `toUID` | ASC |
| `friendRequests` | `fromUID` | ASC |
| `challenges` | `status` | ASC |

---

## Security Rules

### Basic Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==========================================
    // USERS COLLECTION
    // ==========================================
    match /users/{userId} {
      // Users can read/write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow reading public profile data for leaderboards
      allow read: if request.auth != null;
      
      // Friends subcollection
      match /friends/{friendId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Tasks subcollection
      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Quests subcollection
      match /quests/{questId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Oracle Chat subcollection
      match /oracleChat/{messageId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Active Challenges subcollection
      match /activeChallenges/{challengeId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // History subcollection
      match /history/{date} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Archived History subcollection
      match /archivedHistory/{archiveId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // ==========================================
    // FRIEND REQUESTS COLLECTION
    // ==========================================
    match /friendRequests/{requestId} {
      // Sender can create and read their requests
      allow create: if request.auth != null 
                    && request.resource.data.fromUID == request.auth.uid;
      
      // Both sender and recipient can read
      allow read: if request.auth != null 
                  && (resource.data.fromUID == request.auth.uid 
                      || resource.data.toUID == request.auth.uid);
      
      // Recipient can update (accept/reject)
      allow update: if request.auth != null 
                    && resource.data.toUID == request.auth.uid;
      
      // Sender can delete (cancel request)
      allow delete: if request.auth != null 
                    && resource.data.fromUID == request.auth.uid;
    }
    
    // ==========================================
    // CHALLENGES COLLECTION
    // ==========================================
    match /challenges/{challengeId} {
      // Participants can read and write
      allow read, write: if request.auth != null 
                         && request.auth.uid in resource.data.partnerIds;
      
      // Creator can create
      allow create: if request.auth != null 
                    && request.resource.data.creatorUID == request.auth.uid;
    }
  }
}
```

### Security Notes

1. **Denormalized Data**: Friend display names, levels, and photos are denormalized for performance. Use Cloud Functions to keep them in sync when the source changes.

2. **Challenge Updates**: Both participants can modify the shared challenge document. Consider using Cloud Functions for sensitive operations like XP awarding to prevent cheating.

3. **Rate Limiting**: Implement rate limiting via Cloud Functions for operations like sending friend requests.

4. **Data Validation**: Add validation rules to ensure:
   - XP values are non-negative
   - Difficulty and SkillCategory values are valid enums
   - Required fields are present

---

## Cloud Functions Recommendations

### Suggested Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `onUserCreate` | Auth onCreate | Initialize user document with defaults |
| `onFriendRequestAccept` | Firestore update | Create bidirectional friend documents |
| `onChallengeComplete` | Firestore update | Award XP to participants |
| `syncFriendData` | Scheduled (daily) | Update denormalized friend data |
| `archiveOldHistory` | Scheduled (daily) | Move history > 60 days to archive |
| `cleanupExpiredChallenges` | Scheduled (hourly) | Mark expired challenges |

---

## Migration Notes

When migrating from localStorage to Firestore:

1. **One-time migration**: Create a migration script that reads localStorage data and writes to Firestore
2. **Dual-write period**: Write to both localStorage and Firestore during transition
3. **Feature flags**: Use feature flags to gradually switch users to Firestore
4. **Offline support**: Enable Firestore offline persistence for seamless offline experience

---

*Last Updated: January 2026*
*Schema Version: 1.0.0*
