import React, { createContext, useContext, ReactNode } from 'react';
import { Task, MainQuest, Friend, FriendChallenge, ChatMessage, UserProfile } from '../types';

interface AppStateContextType {
  // User state
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  
  // Tasks state
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  
  // Quests state
  mainQuests: MainQuest[];
  setMainQuests: React.Dispatch<React.SetStateAction<MainQuest[]>>;
  expandedNodes: Set<string>;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // Friends & Challenges state
  friends: Friend[];
  setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
  challenges: FriendChallenge[];
  setChallenges: React.Dispatch<React.SetStateAction<FriendChallenge[]>>;
  
  // AI Assistant state
  aiMessages: ChatMessage[];
  setAiMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

interface AppStateProviderProps {
  children: ReactNode;
  value: AppStateContextType;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children, value }) => {
  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};
