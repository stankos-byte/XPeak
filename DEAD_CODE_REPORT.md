# Dead Code Detection Report

This report documents all unused code found in the codebase after a systematic search.

## Summary

**Total Dead Code Found:**
- 2 Unused Context Files (entire files)
- 3 Unused Hooks
- 8 Unused Utility Functions
- 3 Unused Toast Functions
- 2 Unused Constants
- 1 Temporary File
- 1 Unused Gamification Function

---

## 1. Unused Context Files

### `contexts/ModalContext.tsx` - **ENTIRE FILE UNUSED**
- **Status:** Complete dead code
- **Reason:** AppLayout manages modals directly using local state instead of this context
- **Exports:**
  - `ModalContext` (line 59)
  - `useModals` (line 61)
  - `ModalProvider` (line 73)
- **Usage:** Not imported anywhere in the codebase

### `contexts/AppStateContext.tsx` - **ENTIRE FILE UNUSED**
- **Status:** Complete dead code
- **Reason:** AppLayout uses hooks directly (useUserManager, useTaskManager, etc.) instead of this context
- **Exports:**
  - `AppStateContext` (line 30)
  - `useAppState` (line 32)
  - `AppStateProvider` (line 45)
- **Usage:** Not imported anywhere in the codebase

---

## 2. Unused Hooks

### `hooks/useLocalStorage.ts`
- **File:** `hooks/useLocalStorage.ts`
- **Unused Exports:**
  - `useLocalStorage` (line 8) - Not used anywhere
  - `useLazyLocalStorage` (line 29) - Not used anywhere
- **Note:** Only mentioned in README.md and IMPROVEMENTS.md (documentation)

### `hooks/useXPSystem.ts`
- **File:** `hooks/useXPSystem.ts`
- **Unused Export:**
  - `useXPSystem` (line 16) - Not used anywhere
- **Note:** Only mentioned in README.md and IMPROVEMENTS.md (documentation)

---

## 3. Unused Utility Functions

### `utils/date.ts`
- **File:** `utils/date.ts`
- **Unused Exports:**
  - `formatDate` (line 7) - Not used anywhere
  - `formatRelativeTime` (line 26) - Not used anywhere
  - `formatTime` (line 55) - Not used anywhere (different formatTime exists in Tools.tsx)
- **Used:**
  - `formatCompletedDate` (line 36) - Used in Dashboard.tsx

### `utils/validation.ts`
- **File:** `utils/validation.ts`
- **Unused Exports:** All validation functions are unused
  - `validateTask` (line 11)
  - `validateQuestTask` (line 25)
  - `validateMainQuest` (line 37)
  - `sanitizeTextInput` (line 47)
  - `validateXP` (line 55)
  - `validateLevel` (line 63)
  - `validateArraySize` (line 71)
  - `safeClone` (line 79)
- **Note:** Only mentioned in IMPROVEMENTS.md (documentation/suggestions)

### `utils/gamification.ts`
- **File:** `utils/gamification.ts`
- **Unused Export:**
  - `calculateUserSkillXP` (line 168) - Not used anywhere
- **Note:** This function calculates skill XP for a specific user in co-op challenges, but appears to be unused

---

## 4. Unused Toast Functions

### `components/ui/GameToast.tsx`
- **File:** `components/ui/GameToast.tsx`
- **Unused Exports:**
  - `toastSuccess` (line 193) - Not used anywhere
  - `toastError` (line 215) - Not used anywhere
  - `toastWarning` (line 237) - Not used anywhere
- **Used:**
  - `GameToaster` - Used in App.tsx
  - `toastXP` - Used via gameToast.xp
  - `toastLevelUp` - Used via gameToast.levelUp
  - `toastStreak` - Used via gameToast.streak
- **Note:** These functions are exported in the `gameToast` object but never called

---

## 5. Unused Constants

### `constants.ts`
- **File:** `constants.ts`
- **Unused Exports:**
  - `LEVEL_CONSTANT` (line 25) - Not used anywhere
  - `LEVEL_EXPONENT` (line 26) - Not used anywhere
- **Used:**
  - `BASE_XP` - Used in gamification.ts
  - `DIFFICULTY_MULTIPLIERS` - Used in gamification.ts
  - `SKILL_COLORS` - Used in multiple components

---

## 6. Temporary/Unused Files

### `temp_quests.txt`
- **File:** `temp_quests.txt`
- **Status:** Temporary file (appears to be old code/notes)
- **Content:** Contains what looks like old component code
- **Recommendation:** Delete if no longer needed

---

## 7. History Service Functions (Internal Use Only)

### `services/historyService.ts`
- **File:** `services/historyService.ts`
- **Note:** Some functions are only used internally within the same file:
  - `aggregateByDate` - Used internally by `migrateToDailyAggregates` and `processHistory`
  - `limitActiveHistory` - Used internally by `addHistoryEntry` and `processHistory`
- **Status:** These are NOT dead code - they're used internally and by `useUserManager.ts`

---

## 8. Landing Components Index

### `pages/landing/components/index.ts`
- **File:** `pages/landing/components/index.ts`
- **Status:** All exports are used
- **Usage:** All components are imported via this index file in `pages/landing/Landing.tsx`

---

## Recommendations

1. **Delete Entire Files:**
   - `contexts/ModalContext.tsx`
   - `contexts/AppStateContext.tsx`
   - `temp_quests.txt`

2. **Remove Unused Exports:**
   - Remove unused functions from `utils/date.ts`, `utils/validation.ts`, `utils/gamification.ts`
   - Remove unused hooks from `hooks/useLocalStorage.ts` and `hooks/useXPSystem.ts`
   - Remove unused toast functions from `components/ui/GameToast.tsx`
   - Remove unused constants from `constants.ts`

3. **Consider Keeping (Future Use):**
   - Validation functions might be useful for future data validation
   - Toast functions (success/error/warning) might be useful for future error handling
   - `useXPSystem` hook might be useful if you want to extract XP logic

---

## Files to Review Before Deletion

Before deleting, verify:
- `contexts/ModalContext.tsx` - Check if there are any plans to use it
- `contexts/AppStateContext.tsx` - Check if there are any plans to use it
- `hooks/useXPSystem.ts` - Check if this was intended to replace XP logic in useUserManager
- `utils/validation.ts` - Check if validation is needed for future features
- `temp_quests.txt` - Verify it's not needed for reference

---

## Statistics

- **Total Files with Dead Code:** 8
- **Total Unused Exports:** 23
- **Total Unused Files:** 3
- **Lines of Dead Code (estimated):** ~500-600 lines
