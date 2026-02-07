# Maintenance Mode Integration Example

This guide shows how to integrate the maintenance mode check into your app's main component.

## Example: App Router Integration

Here's how to add maintenance mode checking to your main App component:

```typescript
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { subscribeToMaintenanceMode } from './services/maintenanceService';
import { MaintenanceConfig } from './types';
import MaintenancePage from './pages/Maintenance';

// Your existing pages
import Dashboard from './pages/app/Dashboard';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

function App() {
  const [isInMaintenance, setIsInMaintenance] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to maintenance mode changes
    const unsubscribe = subscribeToMaintenanceMode((config) => {
      setIsInMaintenance(config.isMaintenanceMode);
      setMaintenanceConfig(config);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show loading state while checking maintenance mode
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Show maintenance page if maintenance mode is active
  if (isInMaintenance) {
    return <MaintenancePage config={maintenanceConfig || undefined} />;
  }

  // Show normal app
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/app/*" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Alternative: Context-Based Approach

For more complex apps, you might want to use a Context Provider:

```typescript
// contexts/MaintenanceContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToMaintenanceMode } from '../services/maintenanceService';
import { MaintenanceConfig } from '../types';

interface MaintenanceContextType {
  isInMaintenance: boolean;
  config: MaintenanceConfig | null;
  isLoading: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isInMaintenance: false,
  config: null,
  isLoading: true,
});

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInMaintenance, setIsInMaintenance] = useState(false);
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToMaintenanceMode((maintenanceConfig) => {
      setIsInMaintenance(maintenanceConfig.isMaintenanceMode);
      setConfig(maintenanceConfig);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <MaintenanceContext.Provider value={{ isInMaintenance, config, isLoading }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within MaintenanceProvider');
  }
  return context;
};
```

Then in your App:

```typescript
import React from 'react';
import { MaintenanceProvider, useMaintenance } from './contexts/MaintenanceContext';
import MaintenancePage from './pages/Maintenance';

function AppContent() {
  const { isInMaintenance, config, isLoading } = useMaintenance();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isInMaintenance) {
    return <MaintenancePage config={config || undefined} />;
  }

  return (
    // Your normal app routes
    <YourAppRoutes />
  );
}

function App() {
  return (
    <MaintenanceProvider>
      <AppContent />
    </MaintenanceProvider>
  );
}

export default App;
```

## Maintenance Page with Authentication Bypass

If you want to allow certain users (e.g., admins) to bypass maintenance mode:

```typescript
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user } = useAuth();
  const [isInMaintenance, setIsInMaintenance] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceConfig | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMaintenanceMode((config) => {
      setIsInMaintenance(config.isMaintenanceMode);
      setMaintenanceConfig(config);
    });

    return () => unsubscribe();
  }, []);

  // Check if user is an admin (implement your own logic)
  const isAdmin = user?.email === 'admin@example.com' || user?.isAdmin === true;

  // Show maintenance page only if:
  // 1. Maintenance mode is active AND
  // 2. User is not an admin
  if (isInMaintenance && !isAdmin) {
    return <MaintenancePage config={maintenanceConfig || undefined} />;
  }

  return (
    // Normal app
  );
}
```

## Testing Maintenance Mode

### Test in Development

1. Create the document in Firestore with `isMaintenanceMode: false`
2. Start your app
3. Go to Firebase Console
4. Update the document: set `isMaintenanceMode: true`
5. Your app should immediately show the maintenance page (no refresh needed!)
6. Set it back to `false` to exit maintenance mode

### Test with Custom Hook

Create a custom hook for easier testing:

```typescript
// hooks/useMaintenance.ts
import { useEffect, useState } from 'react';
import { subscribeToMaintenanceMode } from '../services/maintenanceService';
import { MaintenanceConfig } from '../types';

export const useMaintenance = () => {
  const [isInMaintenance, setIsInMaintenance] = useState(false);
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToMaintenanceMode((maintenanceConfig) => {
      setIsInMaintenance(maintenanceConfig.isMaintenanceMode);
      setConfig(maintenanceConfig);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isInMaintenance, config, isLoading };
};
```

Use it in your App:

```typescript
function App() {
  const { isInMaintenance, config, isLoading } = useMaintenance();

  if (isLoading) return <LoadingScreen />;
  if (isInMaintenance) return <MaintenancePage config={config || undefined} />;
  
  return <YourApp />;
}
```

## Advanced: Scheduled Maintenance

You can implement automatic maintenance based on scheduled dates:

```typescript
import { useEffect, useState } from 'react';
import { subscribeToMaintenanceMode } from '../services/maintenanceService';
import { MaintenanceConfig } from '../types';

export const useMaintenance = () => {
  const [shouldShowMaintenance, setShouldShowMaintenance] = useState(false);
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMaintenanceMode((maintenanceConfig) => {
      setConfig(maintenanceConfig);
      
      // Check if maintenance is manually enabled
      if (maintenanceConfig.isMaintenanceMode) {
        setShouldShowMaintenance(true);
        return;
      }
      
      // Check if we're within scheduled maintenance window
      if (maintenanceConfig.date) {
        const scheduledDate = new Date(maintenanceConfig.date);
        const now = new Date();
        
        // Show maintenance page 5 minutes before scheduled time
        // and until manually disabled
        const fiveMinutesBefore = new Date(scheduledDate.getTime() - 5 * 60 * 1000);
        
        if (now >= fiveMinutesBefore) {
          setShouldShowMaintenance(true);
          return;
        }
      }
      
      setShouldShowMaintenance(false);
    });

    return () => unsubscribe();
  }, []);

  return { isInMaintenance: shouldShowMaintenance, config };
};
```

## Error Handling

Add error boundaries to handle any issues:

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class MaintenanceErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Maintenance check error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // If maintenance check fails, show the app anyway
      // (better to show the app than block everyone)
      return this.props.children;
    }

    return this.props.children;
  }
}

function App() {
  return (
    <MaintenanceErrorBoundary>
      <AppWithMaintenanceCheck />
    </MaintenanceErrorBoundary>
  );
}
```

## Summary

The key steps to integrate maintenance mode:

1. ✅ **Import the service**: `import { subscribeToMaintenanceMode } from './services/maintenanceService'`
2. ✅ **Subscribe to changes**: Use `subscribeToMaintenanceMode()` in `useEffect`
3. ✅ **Check the flag**: If `isMaintenanceMode` is true, show maintenance page
4. ✅ **Pass the config**: Pass the configuration to `<MaintenancePage />`
5. ✅ **Handle loading**: Show a loading state while checking maintenance status
6. ✅ **Clean up**: Return the unsubscribe function from `useEffect`

That's it! Your app will now automatically respond to maintenance mode changes in real-time.
