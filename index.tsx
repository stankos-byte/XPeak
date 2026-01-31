import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { resetUserData } from './services/firestoreDataService';
import { auth } from './config/firebase';

// Expose debug utilities on window for console access
declare global {
  interface Window {
    resetToDefaults: () => Promise<void>;
  }
}

window.resetToDefaults = async () => {
  const user = auth?.currentUser;
  if (!user) {
    console.error('❌ Not logged in. Please log in first.');
    return;
  }
  
  if (!confirm('This will reset ALL your data (XP, tasks, quests, etc.) to defaults. Are you sure?')) {
    console.log('Reset cancelled.');
    return;
  }
  
  await resetUserData(user.uid);
  console.log('Reloading page...');
  window.location.reload();
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);