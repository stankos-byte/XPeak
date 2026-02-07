# 🔧 Maintenance Mode - System Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIREBASE FIRESTORE                        │
│                                                                  │
│  Collection: config                                              │
│  └── Document: maintenance                                       │
│      ├── isMaintenanceMode: boolean                             │
│      ├── title: string                                           │
│      ├── subtitle: string                                        │
│      ├── date: string                                            │
│      └── lastUpdatedAt: timestamp                                │
│                                                                  │
│  Security Rules:                                                 │
│  ✅ Read: Public (anyone)                                       │
│  ❌ Write: Disabled (Admin SDK only)                           │
└─────────────────────────────────────────────────────────────────┘
                            ▲
                            │
                            │ Real-time updates
                            │ (onSnapshot)
                            │
┌───────────────────────────┴──────────────────────────────────────┐
│                   MAINTENANCE SERVICE                             │
│              (services/maintenanceService.ts)                     │
│                                                                   │
│  Functions:                                                       │
│  • subscribeToMaintenanceMode(callback)  ← Real-time listener   │
│  • getMaintenanceConfig()                ← One-time fetch        │
│  • isMaintenanceMode()                   ← Quick boolean check   │
│                                                                   │
│  Features:                                                        │
│  • Default fallback values                                       │
│  • Timestamp conversion                                          │
│  • Error handling                                                │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            │ Imported by
                            │
┌───────────────────────────┴──────────────────────────────────────┐
│                       YOUR APP                                    │
│                       (App.tsx)                                   │
│                                                                   │
│  useEffect(() => {                                               │
│    const unsubscribe = subscribeToMaintenanceMode((config) => {  │
│      setIsInMaintenance(config.isMaintenanceMode);              │
│      setConfig(config);                                          │
│    });                                                            │
│    return () => unsubscribe();                                   │
│  }, []);                                                          │
│                                                                   │
│  if (isInMaintenance) {                                          │
│    return <MaintenancePage config={config} />;                   │
│  }                                                                │
│                                                                   │
│  return <YourNormalApp />;                                       │
└───────────────────────────┬──────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
┌──────────────────────┐    ┌──────────────────────┐
│  MAINTENANCE PAGE     │    │   NORMAL APP         │
│  (Maintenance.tsx)    │    │   (Dashboard, etc.)  │
│                       │    │                      │
│  Shows:               │    │  Your regular app    │
│  • Title              │    │  routes and pages    │
│  • Subtitle           │    │                      │
│  • Scheduled date     │    │                      │
│  • Refresh button     │    │                      │
└──────────────────────┘    └──────────────────────┘
```

## Data Flow

### 1. Initial Load

```
User opens app
      │
      ▼
App component mounts
      │
      ▼
Subscribe to maintenance config
      │
      ▼
Fetch from Firestore (config/maintenance)
      │
      ├─── Document exists
      │         │
      │         ▼
      │    Parse data, convert timestamps
      │         │
      │         ▼
      │    Call callback with config
      │
      └─── Document doesn't exist
                │
                ▼
           Use default config
                │
                ▼
           Call callback with defaults
      │
      ▼
Update state (isInMaintenance, config)
      │
      ▼
Render appropriate view
      │
      ├─── isInMaintenance = true → Show MaintenancePage
      │
      └─── isInMaintenance = false → Show Normal App
```

### 2. Real-time Updates

```
Admin updates Firestore document
      │
      ▼
Firestore triggers onSnapshot listener
      │
      ▼
maintenanceService receives update
      │
      ▼
Parse new data
      │
      ▼
Call subscribed callbacks
      │
      ▼
App component receives update
      │
      ▼
Update state (isInMaintenance, config)
      │
      ▼
React re-renders
      │
      ├─── isInMaintenance changed to true → Show MaintenancePage
      │
      └─── isInMaintenance changed to false → Show Normal App

✨ No page refresh needed! ✨
```

## Update Process

### Enabling Maintenance Mode

```
┌─────────────────┐
│  Admin wants    │
│  to enable      │
│  maintenance    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Firebase Console                        │
│  Open: config/maintenance document       │
│                                          │
│  Change:                                 │
│  isMaintenanceMode: false → true         │
│  title: "Down for Maintenance"           │
│  subtitle: "We're upgrading..."          │
│  date: "2026-02-07T15:00:00Z"           │
│  lastUpdatedAt: [current timestamp]      │
│                                          │
│  Click: Save                             │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Firestore updates document              │
│  Real-time listeners notified            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  All connected users                     │
│  INSTANTLY see maintenance page          │
│  (within ~100ms)                         │
└──────────────────────────────────────────┘
```

### Disabling Maintenance Mode

```
┌─────────────────┐
│  Admin wants    │
│  to disable     │
│  maintenance    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Firebase Console                        │
│  Open: config/maintenance document       │
│                                          │
│  Change:                                 │
│  isMaintenanceMode: true → false         │
│  lastUpdatedAt: [current timestamp]      │
│                                          │
│  Click: Save                             │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Firestore updates document              │
│  Real-time listeners notified            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  All connected users                     │
│  INSTANTLY return to normal app          │
│  (within ~100ms)                         │
└──────────────────────────────────────────┘
```

## Component Hierarchy

```
App.tsx (Root)
│
├─ useEffect
│  └─ subscribeToMaintenanceMode()
│     └─ Updates: isInMaintenance, config
│
├─ State Management
│  ├─ isInMaintenance: boolean
│  └─ config: MaintenanceConfig | null
│
└─ Conditional Rendering
   │
   ├─ if (isInMaintenance)
   │  └─ <MaintenancePage config={config} />
   │     └─ Displays:
   │        ├─ Title
   │        ├─ Subtitle
   │        ├─ Scheduled date (if set)
   │        ├─ Animated icon
   │        └─ Refresh button
   │
   └─ else
      └─ <YourNormalApp />
         └─ Regular routes and pages
```

## Security Model

```
┌────────────────────────────────────────────────────────────┐
│                     FIRESTORE RULES                         │
│                                                             │
│  config/maintenance:                                        │
│    ✅ allow read: if true                                  │
│       → Anyone can check maintenance status                 │
│       → Even unauthenticated users                          │
│       → Required to show maintenance page                   │
│                                                             │
│    ❌ allow write: if false                                │
│       → Nobody can write from client                        │
│       → Prevents unauthorized changes                       │
│       → Forces updates via:                                 │
│          • Firebase Console (manual)                        │
│          • Admin SDK (Cloud Functions)                      │
│          • Server-side scripts                              │
└────────────────────────────────────────────────────────────┘
```

## File Dependencies

```
App.tsx
  │
  ├─ imports: services/maintenanceService
  │            └─ imports: config/firebase
  │                         services/firebasePaths
  │                         types
  │
  └─ imports: pages/Maintenance
              └─ imports: types
```

## Type System

```typescript
// types.ts
interface MaintenanceConfig {
  isMaintenanceMode: boolean;
  title: string;
  subtitle: string;
  date?: string;
  lastUpdatedAt: Date | string;
}

// services/maintenanceService.ts
export const subscribeToMaintenanceMode = (
  callback: (config: MaintenanceConfig) => void
): (() => void) => { ... }

export const getMaintenanceConfig = async (): Promise<MaintenanceConfig> => { ... }

export const isMaintenanceMode = async (): Promise<boolean> => { ... }

// App.tsx
const [config, setConfig] = useState<MaintenanceConfig | null>(null);
const [isInMaintenance, setIsInMaintenance] = useState<boolean>(false);
```

## Timeline Example

```
Time    │ Action                           │ Result
────────┼──────────────────────────────────┼──────────────────────────────
00:00   │ User opens app                   │ Shows loading state
00:00.1 │ Subscribe to maintenance config  │ Fetching from Firestore...
00:00.2 │ Receive config (maintenance OFF) │ Show normal app
        │                                  │ User browses normally
        │                                  │
01:30   │ Admin enables maintenance        │ Document updated in Firestore
01:30.1 │ Real-time listener fires         │ Callback receives new config
01:30.1 │ State updates                    │ isInMaintenance: true
01:30.2 │ React re-renders                 │ MaintenancePage displayed
        │                                  │ User sees maintenance message
        │                                  │
02:00   │ Admin disables maintenance       │ Document updated in Firestore
02:00.1 │ Real-time listener fires         │ Callback receives new config
02:00.1 │ State updates                    │ isInMaintenance: false
02:00.2 │ React re-renders                 │ Normal app displayed
        │                                  │ User continues browsing

Total time from admin update to user seeing change: ~100-200ms ⚡
```

## Best Practices Illustrated

```
✅ DO THIS:
┌──────────────────────────────────────┐
│ App loads                            │
│   ↓                                  │
│ Subscribe to real-time updates       │
│   ↓                                  │
│ Store state in component             │
│   ↓                                  │
│ Conditionally render based on state  │
└──────────────────────────────────────┘

❌ DON'T DO THIS:
┌──────────────────────────────────────┐
│ App loads                            │
│   ↓                                  │
│ Fetch maintenance config once        │
│   ↓                                  │
│ Never check again                    │
│   ↓                                  │
│ User might miss maintenance updates  │
└──────────────────────────────────────┘

✅ DO THIS:
┌──────────────────────────────────────┐
│ Update via Firebase Console          │
│   or                                 │
│ Update via Cloud Function (Admin)    │
└──────────────────────────────────────┘

❌ DON'T DO THIS:
┌──────────────────────────────────────┐
│ Try to update from client code       │
│ (Will fail - rules prevent it)       │
└──────────────────────────────────────┘
```

## Summary

This maintenance mode system provides:

- ✅ **Real-time updates** - No page refresh needed
- ✅ **Centralized control** - Single source of truth
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Secure** - Read-only from client
- ✅ **Simple** - Easy to understand and use
- ✅ **Reliable** - Default fallback values
- ✅ **Fast** - Updates in ~100ms
- ✅ **Scalable** - Works for any number of users

All users see maintenance changes instantly, ensuring consistent experience across your entire user base!
