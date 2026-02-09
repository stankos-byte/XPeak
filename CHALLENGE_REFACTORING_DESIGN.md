# Challenge Documents Refactoring - Subcollection Design

**Status:** DESIGN DOCUMENT - Ready for Implementation  
**Priority:** HIGH - Should be done before launch with real users  
**Complexity:** HIGH - Requires changes across frontend and backend

---

## Problem Statement

### Current Issue
Challenge documents store all tasks and categories as nested arrays within a single document:

```typescript
interface FriendChallenge {
  id: string;
  title: string;
  categories: ChallengeQuestCategory[]; // ❌ Problem: nested array
  // ... other fields
}

interface ChallengeQuestCategory {
  id: string;
  title: string;
  tasks: ChallengeQuestTask[]; // ❌ Problem: nested array
}

interface ChallengeQuestTask {
  task_id: string;
  name: string;
  statusByUser: Record<string, TaskStatus>; // ❌ Problem: can grow large
  // ... other fields
}
```

### Scalability Problems

1. **Document Size Limit (1MB):**
   - A challenge with 10 categories × 20 tasks × 4 participants = 800+ task status entries
   - Each task has metadata (name, description, difficulty, etc.)
   - Can easily exceed Firestore's 1MB document limit

2. **Write Contention:**
   - Multiple participants updating the same document simultaneously
   - Causes write conflicts and retries
   - Poor performance under concurrent use

3. **Inefficient Updates:**
   - Updating a single task requires rewriting the entire document
   - Array operations are expensive for large documents
   - No way to query individual tasks

4. **Query Limitations:**
   - Can't query for specific tasks across challenges
   - Can't filter challenges by task completion status
   - Can't get task-level statistics

---

## Proposed Solution: Subcollections

### New Schema Design

```
challenges/{challengeId}
  ├─ (metadata only - lightweight)
  └─ tasks/{taskId}
       └─ (individual task document)
```

### Document Structures

#### Challenge Document (Metadata Only)
```typescript
// Collection: challenges
interface Challenge {
  id: string;
  title: string;
  description: string;
  creatorUID: string;
  partnerIds: string[];
  mode: 'competitive' | 'coop';
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  expiresAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Summary statistics (denormalized for quick access)
  stats: {
    totalTasks: number;
    completedTasks: number;
    tasksPerCategory: Record<string, number>; // categoryId -> task count
    completionByUser: Record<string, number>; // userId -> completed count
  };
  
  // Category metadata (no tasks)
  categories: {
    id: string;
    title: string;
    order: number; // For display ordering
  }[];
  
  // Winner info (for competitive mode)
  completedBy?: string;
  completedAt?: Timestamp;
}
```

#### Task Document (Subcollection)
```typescript
// Collection: challenges/{challengeId}/tasks
interface ChallengeTask {
  id: string; // taskId
  challengeId: string; // Parent challenge ID
  categoryId: string; // Which category this belongs to
  
  // Task details
  name: string;
  description?: string;
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  order: number; // Order within category
  
  // Status tracking
  statusByUser: Record<string, {
    status: TaskStatus;
    completedAt?: Timestamp;
    completedBy?: string; // For coop mode
  }>;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Benefits

### 1. Scalability
- ✅ No document size limits (can have unlimited tasks)
- ✅ Each task update is isolated (no write contention)
- ✅ Efficient updates (only modify affected task)

### 2. Query Capabilities
```typescript
// Get all tasks in a challenge
db.collection('challenges/{id}/tasks').get()

// Get tasks by category
db.collection('challenges/{id}/tasks')
  .where('categoryId', '==', 'fitness')
  .get()

// Get incomplete tasks for a user
db.collection('challenges/{id}/tasks')
  .where(`statusByUser.${userId}.status`, '==', 'pending')
  .get()

// Get tasks across all challenges (collection group)
db.collectionGroup('tasks')
  .where('statusByUser.{userId}.status', '==', 'completed')
  .get()
```

### 3. Performance
- ✅ Concurrent task updates don't conflict
- ✅ Smaller document reads/writes
- ✅ Better caching (only changed tasks need refresh)

### 4. Cost Optimization
- ✅ Only read/write tasks that changed
- ✅ Fewer document reads for task lists
- ✅ Better batching opportunities

---

## Implementation Plan

### Phase 1: Backend Changes

#### 1.1 Update Firestore Indexes
Add to `firestore.indexes.json`:
```json
{
  "collectionGroup": "tasks",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "challengeId", "order": "ASCENDING" },
    { "fieldPath": "categoryId", "order": "ASCENDING" },
    { "fieldPath": "order", "order": "ASCENDING" }
  ]
}
```

#### 1.2 Update Security Rules
Add to `firestore.rules`:
```javascript
// Challenge tasks subcollection
match /challenges/{challengeId}/tasks/{taskId} {
  // Participants can read tasks
  allow read: if isAuthenticated() 
              && request.auth.uid in get(/databases/$(database)/documents/challenges/$(challengeId)).data.partnerIds;
  
  // Participants can update their own status
  allow update: if isAuthenticated() 
                && request.auth.uid in get(/databases/$(database)/documents/challenges/$(challengeId)).data.partnerIds
                && onlyUpdatingOwnStatus();
  
  // Only creator can create/delete tasks
  allow create, delete: if isAuthenticated() 
                         && request.auth.uid == get(/databases/$(database)/documents/challenges/$(challengeId)).data.creatorUID;
  
  function onlyUpdatingOwnStatus() {
    // Verify only statusByUser.{currentUserId} is being modified
    let affectedKeys = request.resource.data.diff(resource.data).affectedKeys();
    return affectedKeys.hasOnly(['statusByUser', 'updatedAt']) 
           && affectedKeys.hasAny(['statusByUser.' + request.auth.uid]);
  }
}
```

#### 1.3 Create Cloud Functions for Challenge Management

**`createChallenge`** - Create challenge with initial tasks
```typescript
export const createChallenge = onCall(async (request) => {
  const { title, description, partnerIds, categories, mode, durationDays } = request.data;
  
  // Create challenge document
  const challengeRef = db.collection('challenges').doc();
  const challengeId = challengeRef.id;
  
  // Use batch for atomic operation
  const batch = db.batch();
  
  // Set challenge metadata
  batch.set(challengeRef, {
    id: challengeId,
    title,
    description,
    creatorUID: request.auth.uid,
    partnerIds,
    mode,
    status: 'active',
    expiresAt: Timestamp.fromDate(new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    categories: categories.map((cat, i) => ({
      id: cat.id,
      title: cat.title,
      order: i,
    })),
    stats: {
      totalTasks: 0,
      completedTasks: 0,
      tasksPerCategory: {},
      completionByUser: partnerIds.reduce((acc, uid) => ({ ...acc, [uid]: 0 }), {}),
    },
  });
  
  // Create task subcollection documents
  let taskOrder = 0;
  for (const category of categories) {
    for (const task of category.tasks) {
      const taskRef = challengeRef.collection('tasks').doc();
      
      batch.set(taskRef, {
        id: taskRef.id,
        challengeId,
        categoryId: category.id,
        name: task.name,
        description: task.description,
        difficulty: task.difficulty,
        skillCategory: task.skillCategory,
        order: taskOrder++,
        statusByUser: partnerIds.reduce((acc, uid) => ({
          ...acc,
          [uid]: { status: 'pending' }
        }), {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
  
  await batch.commit();
  return { challengeId };
});
```

**`updateTaskStatus`** - Update task completion status
```typescript
export const updateTaskStatus = onCall(async (request) => {
  const { challengeId, taskId, status } = request.data;
  const userId = request.auth.uid;
  
  // Use transaction to update task and challenge stats atomically
  await db.runTransaction(async (transaction) => {
    const taskRef = db.collection('challenges').doc(challengeId).collection('tasks').doc(taskId);
    const challengeRef = db.collection('challenges').doc(challengeId);
    
    const taskDoc = await transaction.get(taskRef);
    const challengeDoc = await transaction.get(challengeRef);
    
    if (!taskDoc.exists || !challengeDoc.exists) {
      throw new HttpsError('not-found', 'Challenge or task not found');
    }
    
    const taskData = taskDoc.data();
    const challengeData = challengeDoc.data();
    
    // Update task status
    transaction.update(taskRef, {
      [`statusByUser.${userId}.status`]: status,
      [`statusByUser.${userId}.completedAt`]: status === 'completed' ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Update challenge stats
    const wasCompleted = taskData.statusByUser[userId]?.status === 'completed';
    const isNowCompleted = status === 'completed';
    
    if (!wasCompleted && isNowCompleted) {
      transaction.update(challengeRef, {
        'stats.completedTasks': FieldValue.increment(1),
        [`stats.completionByUser.${userId}`]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (wasCompleted && !isNowCompleted) {
      transaction.update(challengeRef, {
        'stats.completedTasks': FieldValue.increment(-1),
        [`stats.completionByUser.${userId}`]: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
  
  return { success: true };
});
```

### Phase 2: Frontend Changes

#### 2.1 Update Types (`types.ts`)
```typescript
// New types for subcollection design
export interface Challenge {
  id: string;
  title: string;
  description: string;
  creatorUID: string;
  partnerIds: string[];
  mode: 'competitive' | 'coop';
  status: ChallengeStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  categories: ChallengeCategoryMeta[];
  stats: ChallengeStats;
  completedBy?: string;
  completedAt?: string;
}

export interface ChallengeCategoryMeta {
  id: string;
  title: string;
  order: number;
}

export interface ChallengeStats {
  totalTasks: number;
  completedTasks: number;
  tasksPerCategory: Record<string, number>;
  completionByUser: Record<string, number>;
}

export interface ChallengeTask {
  id: string;
  challengeId: string;
  categoryId: string;
  name: string;
  description?: string;
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  order: number;
  statusByUser: Record<string, TaskStatusDetail>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStatusDetail {
  status: TaskStatus;
  completedAt?: string;
  completedBy?: string;
}
```

#### 2.2 Update Services (`services/`)
```typescript
// services/challengeService.ts

export async function getChallengeWithTasks(challengeId: string) {
  // Get challenge metadata
  const challengeDoc = await db.collection('challenges').doc(challengeId).get();
  const challenge = challengeDoc.data() as Challenge;
  
  // Get all tasks
  const tasksSnapshot = await db
    .collection('challenges')
    .doc(challengeId)
    .collection('tasks')
    .orderBy('order')
    .get();
  
  const tasks = tasksSnapshot.docs.map(doc => doc.data() as ChallengeTask);
  
  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.categoryId]) acc[task.categoryId] = [];
    acc[task.categoryId].push(task);
    return acc;
  }, {} as Record<string, ChallengeTask[]>);
  
  return { challenge, tasks, tasksByCategory };
}

export async function updateTaskStatus(
  challengeId: string,
  taskId: string,
  status: TaskStatus
) {
  const updateTaskStatus = httpsCallable(functions, 'updateTaskStatus');
  await updateTaskStatus({ challengeId, taskId, status });
}
```

#### 2.3 Update Components
- Update challenge display components to fetch tasks separately
- Update task completion handlers to use new Cloud Function
- Update real-time listeners to watch both challenge and tasks subcollection

### Phase 3: Data Migration

#### 3.1 Create Migration Script
```typescript
// scripts/migrateChallenges.ts

export async function migrateChallengeToSubcollection(challengeId: string) {
  const challengeRef = db.collection('challenges').doc(challengeId);
  const challengeDoc = await challengeRef.get();
  const oldData = challengeDoc.data() as OldFriendChallenge;
  
  // Create new challenge document (metadata only)
  const newChallenge: Challenge = {
    id: oldData.id,
    title: oldData.title,
    description: oldData.description,
    creatorUID: oldData.creatorUID,
    partnerIds: oldData.partnerIds,
    mode: oldData.mode,
    status: oldData.status,
    expiresAt: oldData.expiresAt,
    createdAt: oldData.createdAt,
    updatedAt: oldData.createdAt,
    categories: oldData.categories.map((cat, i) => ({
      id: cat.id,
      title: cat.title,
      order: i,
    })),
    stats: calculateStats(oldData),
    completedBy: oldData.completedBy,
    completedAt: oldData.completedAt,
  };
  
  // Use batch to update challenge and create task docs
  const batch = db.batch();
  
  batch.update(challengeRef, newChallenge);
  
  // Create task documents
  let taskOrder = 0;
  for (const category of oldData.categories) {
    for (const task of category.tasks) {
      const taskRef = challengeRef.collection('tasks').doc();
      
      batch.set(taskRef, {
        id: taskRef.id,
        challengeId: oldData.id,
        categoryId: category.id,
        name: task.name,
        description: task.description,
        difficulty: task.difficulty,
        skillCategory: task.skillCategory,
        order: taskOrder++,
        statusByUser: task.statusByUser,
        createdAt: oldData.createdAt,
        updatedAt: oldData.createdAt,
      });
    }
  }
  
  await batch.commit();
  console.log(`✅ Migrated challenge ${challengeId}`);
}
```

#### 3.2 Migration Cloud Function
```typescript
// For production migration
export const migrateAllChallenges = onCall({ enforceAppCheck: true }, async (request) => {
  // Verify admin
  if (!request.auth?.token.admin) {
    throw new HttpsError('permission-denied', 'Admin only');
  }
  
  const challenges = await db.collection('challenges').get();
  let migrated = 0;
  
  for (const doc of challenges.docs) {
    await migrateChallengeToSubcollection(doc.id);
    migrated++;
  }
  
  return { migrated };
});
```

---

## Rollout Plan

### Stage 1: Development (Pre-Launch)
Since there are no users yet, this can be done directly:
1. ✅ Implement new schema in development
2. ✅ Update all backend code
3. ✅ Update all frontend code
4. ✅ Test thoroughly
5. ✅ Deploy to production

### Stage 2: Production (If there were users)
1. Deploy migration Cloud Function
2. Run migration on all existing challenges
3. Keep old schema as fallback (dual write for safety)
4. Verify migration success
5. Switch all reads/writes to new schema
6. Remove old schema code after 1 week

---

## Testing Checklist

- [ ] Create challenge with 100+ tasks
- [ ] Update task status concurrently from multiple users
- [ ] Query tasks by category
- [ ] Query tasks by status
- [ ] Delete challenge (verify all tasks deleted)
- [ ] Test challenge completion logic
- [ ] Test competitive mode winner calculation
- [ ] Test coop mode completion
- [ ] Verify stats update correctly
- [ ] Test with expired challenges
- [ ] Performance test with 1000+ tasks

---

## Estimated Effort

- **Backend:** 8-12 hours
  - Cloud Functions: 4 hours
  - Security Rules: 2 hours
  - Indexes: 1 hour
  - Testing: 3-5 hours

- **Frontend:** 12-16 hours
  - Services: 4 hours
  - Components: 6-8 hours
  - Types: 2 hours
  - Testing: 4 hours

- **Migration:** 4-6 hours
  - Script: 2 hours
  - Testing: 2-4 hours

**Total:** 24-34 hours

---

## Decision

**Recommendation:** Implement this refactoring **before launch** since there are no users yet. This avoids:
- Complex data migration later
- Risk of data loss during migration
- Downtime during migration
- Supporting two schemas simultaneously

**Alternative (If Launching Soon):** 
- Add task count limits (max 50 tasks per challenge)
- Document size monitoring
- Plan migration for later

---

## Files to Modify

### Backend
- ✅ `firestore.rules` - Add tasks subcollection rules
- ✅ `firestore.indexes.json` - Add task indexes
- ✅ `functions/src/index.ts` - Add challenge Cloud Functions

### Frontend
- ✅ `types.ts` - Update Challenge types
- ✅ `services/challengeService.ts` - Rewrite all challenge operations
- ✅ `hooks/useChallengeManager.ts` - Update hooks (if exists)
- ✅ `components/challenges/` - Update all challenge components
- ✅ Pages using challenges - Update data fetching

### Migration
- ✅ `scripts/migrateChallenges.ts` - Create migration script

---

**Status:** Ready for implementation. Start with backend, then frontend, then test thoroughly before launch.

