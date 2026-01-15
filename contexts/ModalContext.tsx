import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Task, QuestTask, FriendChallenge } from '../types';

interface TextModalConfig {
  isOpen: boolean;
  type: 'quest' | 'category' | 'edit-quest' | 'edit-category' | null;
  parentId?: string;
  categoryId?: string;
  initialValue?: string;
}

interface QuestTaskConfig {
  isOpen: boolean;
  questId?: string;
  categoryId?: string;
  editingTask?: QuestTask | null;
}

interface ModalContextType {
  // Task Modal
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  
  // Text Input Modal
  textModalConfig: TextModalConfig;
  setTextModalConfig: (config: TextModalConfig) => void;
  
  // Quest Task Modal
  questTaskConfig: QuestTaskConfig;
  setQuestTaskConfig: (config: QuestTaskConfig) => void;
  
  // Delete Modals
  questToDelete: string | null;
  setQuestToDelete: (id: string | null) => void;
  challengeToDelete: string | null;
  setChallengeToDelete: (id: string | null) => void;
  
  // Challenge Modal
  isChallengeModalOpen: boolean;
  setIsChallengeModalOpen: (open: boolean) => void;
  editingChallenge: FriendChallenge | null;
  setEditingChallenge: (challenge: FriendChallenge | null) => void;
  
  // Feedback Modal
  isFeedbackOpen: boolean;
  setIsFeedbackOpen: (open: boolean) => void;
  
  // Settings Modal
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  
  // Quest Bonus Modal
  pendingQuestBonus: { qid: string; bonus: number; tid: string; questTitle: string } | null;
  setPendingQuestBonus: (bonus: { qid: string; bonus: number; tid: string; questTitle: string } | null) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModals = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModals must be used within ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [textModalConfig, setTextModalConfig] = useState<TextModalConfig>({ isOpen: false, type: null });
  const [questTaskConfig, setQuestTaskConfig] = useState<QuestTaskConfig>({ isOpen: false });
  const [questToDelete, setQuestToDelete] = useState<string | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<FriendChallenge | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingQuestBonus, setPendingQuestBonus] = useState<{ qid: string; bonus: number; tid: string; questTitle: string } | null>(null);

  const value: ModalContextType = {
    isTaskModalOpen,
    setIsTaskModalOpen,
    editingTask,
    setEditingTask,
    textModalConfig,
    setTextModalConfig,
    questTaskConfig,
    setQuestTaskConfig,
    questToDelete,
    setQuestToDelete,
    challengeToDelete,
    setChallengeToDelete,
    isChallengeModalOpen,
    setIsChallengeModalOpen,
    editingChallenge,
    setEditingChallenge,
    isFeedbackOpen,
    setIsFeedbackOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    pendingQuestBonus,
    setPendingQuestBonus,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};
