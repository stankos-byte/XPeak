
import React, { useState, useEffect } from 'react';
import { 
  Task, 
  ProfileLayout,
  FriendChallenge,
  ChatMessage,
} from './types';
import { useTimer } from './hooks/useTimer';
import { useUserManager } from './hooks/useUserManager';
import { useTaskManager } from './hooks/useTaskManager';
import { useQuestManager } from './hooks/useQuestManager';
import { useChallengeManager } from './hooks/useChallengeManager';
import CreateTaskModal from './components/modals/CreateTaskModal';
import SimpleInputModal from './components/modals/SimpleInputModal';
import DeleteConfirmModal from './components/modals/DeleteConfirmModal';
import FeedbackModal from './components/modals/FeedbackModal';
import CreateChallengeModal from './components/modals/CreateChallengeModal';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import DashboardView from './pages/app/Dashboard';
import QuestsView from './pages/app/Quests';
import ProfileView from './pages/app/Profile';
import ToolsView from './pages/app/Tools';
import FriendsView from './pages/app/Friends';
import AssistantView from './pages/app/Assistant';
import SettingsView from './pages/app/Settings';
import { 
  Swords, 
  Trophy, 
  User, 
  BookOpen,
  CheckSquare,
  Map,
  Sparkles,
  MessageSquare,
  Users,
  Bot,
} from 'lucide-react';

// --- Constants ---
const DEFAULT_LAYOUT: ProfileLayout = { 
  widgets: [
    { id: 'identity', enabled: true, order: 0 }, 
    { id: 'skillMatrix', enabled: true, order: 1 }, 
    { id: 'evolution', enabled: true, order: 2 }, 
    { id: 'calendar', enabled: true, order: 3 }, 
    { id: 'friends', enabled: true, order: 4 },
    { id: 'tasks', enabled: true, order: 5 }
  ] 
};

// --- App Component ---

const App: React.FC = () => {
  // Initialize all custom hooks
  const userManager = useUserManager();
  const taskManager = useTaskManager(userManager.applyGlobalXPChange, userManager.saveTemplate);
  const questManager = useQuestManager(userManager.applyGlobalXPChange);
  const challengeManager = useChallengeManager(userManager.applyGlobalXPChange, userManager.user.uid);
  const timer = useTimer(25 * 60, 5 * 60);

  // Local UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quests' | 'profile' | 'tools' | 'friends' | 'assistant'>('dashboard');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // AI Assistant state
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: `System Online. Greetings, ${userManager.user.nickname}. I am your Performance Analytics Assistant. I have access to your skill matrix, active tasks, and network protocols. How may I assist in optimizing your total XP today?` }
  ]);

  // Update AI message when user nickname changes
  useEffect(() => {
    if (aiMessages.length === 1 && aiMessages[0].id === 'init') {
      setAiMessages([{ id: 'init', role: 'model', text: `System Online. Greetings, ${userManager.user.nickname}. I am your Performance Analytics Assistant. I have access to your skill matrix, active tasks, and network protocols. How may I assist in optimizing your total XP today?` }]);
    }
  }, [userManager.user.nickname]);

  // Wrapper functions for task handlers
  const handleCompleteTask = (id: string) => {
    taskManager.handleCompleteTask(id);
  };

  const handleUncompleteTask = (id: string) => {
    taskManager.handleUncompleteTask(id);
  };

  const handleDeleteTask = (id: string) => {
    taskManager.handleDeleteTask(id);
  };

  const handleEditTask = (task: Task) => {
    taskManager.handleEditTask(task);
  };

  const handleSaveTemplate = (task: Task) => {
    taskManager.handleSaveTemplate(task, userManager.saveTemplate);
  };

  // Wrapper functions for quest handlers
  const handleToggleQuestTask = (qid: string, cid: string, tid: string) => {
    questManager.handleToggleQuestTask(qid, cid, tid, userManager.applyGlobalXPChange);
  };

  const handleConfirmQuestBonus = () => {
    questManager.handleConfirmQuestBonus(userManager.applyGlobalXPChange);
  };

  const handleDeleteQuestTask = (questId: string, categoryId: string, taskId: string) => {
    questManager.handleDeleteQuestTask(questId, categoryId, taskId, userManager.applyGlobalXPChange);
  };

  const handleDeleteCategory = (questId: string, categoryId: string) => {
    questManager.handleDeleteCategory(questId, categoryId, userManager.applyGlobalXPChange);
  };

  const handleDeleteQuest = (id: string) => {
    questManager.setQuestToDelete(id);
  };

  // Wrapper functions for challenge handlers
  const handleToggleChallengeTask = (challengeId: string, categoryId: string, taskId: string) => {
    challengeManager.handleToggleChallengeTask(challengeId, categoryId, taskId, userManager.user, userManager.setUser, userManager.applyGlobalXPChange);
  };

  const handleEditChallenge = (challenge: FriendChallenge) => {
    challengeManager.handleEditChallenge(challenge);
  };

  const handleDeleteChallenge = (id: string) => {
    challengeManager.setChallengeToDelete(id);
  };

  const handleRemoveFriend = (friendId: string) => {
    challengeManager.handleRemoveFriend(friendId);
  };

  // Modal submit handlers
  const handleTaskModalSubmit = (d: any) => {
    if (questManager.questTaskConfig.isOpen) {
      const { questId, categoryId, editingTask } = questManager.questTaskConfig;
      if (!questId || !categoryId) return;

      if (editingTask) {
        questManager.handleUpdateQuestTask(questId, categoryId, editingTask.task_id, {
          title: d.title,
          description: d.description,
          difficulty: d.difficulty,
          skillCategory: d.skillCategory
        });
      } else {
        questManager.handleCreateQuestTask(questId, categoryId, {
          title: d.title,
          description: d.description,
          difficulty: d.difficulty,
          skillCategory: d.skillCategory
        }, userManager.applyGlobalXPChange);
      }
      questManager.setQuestTaskConfig({ isOpen: false });
    } else {
      if (taskManager.editingTask) {
        taskManager.handleUpdateTask(taskManager.editingTask.id, d);
      } else {
        taskManager.handleCreateTask(d);
      }
      taskManager.setIsModalOpen(false);
    }
  };

  const handleTextModalSubmit = (v: string) => {
    const { type, parentId, categoryId } = questManager.textModalConfig;
    
    if (type === 'quest') {
      questManager.handleCreateQuest(v);
      const newQuests = [...questManager.mainQuests];
      const newQuest = newQuests.find(q => q.title === v);
      if (newQuest) {
        questManager.setExpandedNodes((prev: Set<string>) => new Set(prev).add(newQuest.id));
      }
    } else if (type === 'edit-quest' && parentId) {
      questManager.handleUpdateQuestTitle(parentId, v);
    } else if (type === 'edit-category' && parentId && categoryId) {
      questManager.handleUpdateCategoryTitle(parentId, categoryId, v);
    } else if (type === 'category' && parentId) {
      questManager.handleCreateCategory(parentId, v, userManager.applyGlobalXPChange);
    }
    
    questManager.setTextModalConfig({ isOpen: false, type: null });
  };

  const navItems = [
    { id: 'dashboard', icon: CheckSquare, label: 'Dashboard' }, 
    { id: 'quests', icon: Map, label: 'Operations' }, 
    { id: 'tools', icon: BookOpen, label: 'Tools' }, 
    { id: 'friends', icon: Users, label: 'Network' },
    { id: 'assistant', icon: Bot, label: 'Analytics' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col font-sans">
      {/* Email Verification Banner */}
      <EmailVerificationBanner />
      
      <div className="flex flex-col md:flex-row flex-1">
      <nav className="hidden md:flex w-24 lg:w-72 bg-background border-r border-secondary/10 flex-col py-10 sticky top-0 h-screen z-20 justify-between">
        <div className="flex flex-col items-center lg:items-start px-0 lg:px-10 w-full">
          <div className="flex items-center gap-3 mb-16 text-primary"><Swords size={40} /><span className="hidden lg:block text-3xl font-black uppercase tracking-tighter italic">XPeak</span></div>
          <div className="w-full space-y-4">{navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center justify-center lg:justify-start gap-4 p-5 rounded-2xl transition-all border ${activeTab === item.id ? 'bg-primary/10 border-primary/40 text-primary shadow-[0_0_15px_rgba(0,225,255,0.1)]' : 'text-secondary border-transparent hover:bg-surface hover:text-gray-100'}`}>
              <item.icon size={26} /><span className="hidden lg:block font-black uppercase tracking-widest text-xs">{item.label}</span>
            </button>
          ))}</div>
        </div>
        
        <div className="w-full px-0 lg:px-10 mt-auto space-y-2">
           <button onClick={() => setIsFeedbackOpen(true)} className="w-full flex items-center justify-center lg:justify-start gap-4 p-5 rounded-2xl transition-all border text-secondary border-transparent hover:bg-surface hover:text-gray-100">
              <MessageSquare size={26} /><span className="hidden lg:block font-black uppercase tracking-widest text-xs">Feedback</span>
           </button>
        </div>
      </nav>
      {/* Main Layout */}
      <main className="flex-1 p-6 lg:p-14 pb-32 pt-20 md:pt-6 overflow-y-auto">
        {activeTab === 'profile' && (
          <ProfileView 
            user={userManager.user} 
            handleUpdateIdentity={userManager.updateIdentity} 
            handleAddGoal={userManager.addGoal} 
            handleToggleGoal={userManager.toggleGoal} 
            handleDeleteGoal={userManager.deleteGoal} 
            levelProgress={userManager.levelProgress} 
            flashKey={userManager.flashKey} 
            layout={userManager.user.layout || DEFAULT_LAYOUT} 
            onUpdateLayout={userManager.updateLayout} 
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardView 
            user={userManager.user} 
            tasks={taskManager.tasks} 
            handleCompleteTask={handleCompleteTask} 
            handleUncompleteTask={handleUncompleteTask} 
            handleDeleteTask={handleDeleteTask} 
            handleEditTask={handleEditTask} 
            handleSaveTemplate={handleSaveTemplate} 
            setIsModalOpen={taskManager.setIsModalOpen} 
            setEditingTask={taskManager.setEditingTask} 
            levelProgress={userManager.levelProgress} 
            popups={userManager.xpPopups} 
            flashKey={userManager.flashKey} 
          />
        )}
        {activeTab === 'quests' && (
          <QuestsView 
            mainQuests={questManager.mainQuests} 
            expandedNodes={questManager.expandedNodes} 
            toggleNode={questManager.toggleNode} 
            setTextModalConfig={questManager.setTextModalConfig} 
            setQuestTaskConfig={questManager.setQuestTaskConfig} 
            handleToggleQuestTask={handleToggleQuestTask} 
            handleQuestOracle={questManager.handleQuestOracle} 
            oraclingQuestId={questManager.oraclingQuestId} 
            handleDeleteQuest={handleDeleteQuest} 
            handleDeleteCategory={handleDeleteCategory} 
            handleDeleteQuestTask={handleDeleteQuestTask} 
            handleSaveTemplate={handleSaveTemplate} 
            popups={userManager.xpPopups} 
          />
        )}
        {activeTab === 'tools' && (
          <ToolsView 
            switchTimerMode={timer.switchMode} 
            timerMode={timer.mode} 
            formatTime={(s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`} 
            timerTimeLeft={timer.timeLeft} 
            toggleTimer={timer.toggleTimer} 
            isTimerActive={timer.isActive} 
            resetTimer={timer.resetTimer} 
            handleAdjustTimer={timer.adjustTimer} 
          />
        )}
        {activeTab === 'friends' && (
          <FriendsView 
            user={userManager.user} 
            friends={challengeManager.friends} 
            challenges={challengeManager.challenges} 
            onCreateChallenge={() => challengeManager.setIsChallengeModalOpen(true)} 
            onEditChallenge={handleEditChallenge} 
            onDeleteChallenge={handleDeleteChallenge} 
            onToggleChallengeTask={handleToggleChallengeTask}
            onRemoveFriend={handleRemoveFriend}
          />
        )}
        {activeTab === 'assistant' && (
          <AssistantView 
            user={userManager.user} 
            tasks={taskManager.tasks} 
            quests={questManager.mainQuests} 
            friends={challengeManager.friends} 
            challenges={challengeManager.challenges} 
            onAddTask={taskManager.handleAiCreateTask} 
            onAddQuest={questManager.handleAiCreateQuest} 
            onAddChallenge={challengeManager.handleAiCreateChallenge} 
            messages={aiMessages} 
            setMessages={setAiMessages} 
          />
        )}
      </main>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-b border-secondary/20 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <Swords size={28} className="text-primary" />
          <span className="text-xl font-black uppercase tracking-tighter italic text-primary">XPeak</span>
        </div>
      </div>

      {/* Restored Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-secondary/20 p-4 flex justify-around z-50 pb-safe">
         {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={activeTab === item.id ? 'text-primary' : 'text-secondary'}>
               <item.icon size={24} />
            </button>
         ))}
         <button onClick={() => setIsFeedbackOpen(true)} className="text-secondary hover:text-primary">
            <MessageSquare size={24} />
         </button>
      </div>

      {questManager.pendingQuestBonus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-surface border-2 border-primary/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(0,225,255,0.2)] animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20"><Trophy size={40} className="text-primary animate-bounce" /></div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">Operation Complete?</h2>
              <p className="text-secondary text-sm font-medium mb-8 leading-relaxed">Strategic objective <span className="text-white font-bold">"{questManager.pendingQuestBonus.questTitle}"</span> appears fully completed. Deploy final performance rewards?</p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleConfirmQuestBonus} className="w-full bg-primary hover:bg-cyan-400 text-background font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"><Sparkles size={18} /> Confirm Completion</button>
                 <button onClick={() => questManager.setPendingQuestBonus(null)} className="w-full bg-surface border border-secondary/30 text-secondary hover:text-white font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all">Not Yet</button>
              </div>
           </div>
        </div>
      )}
      
      <DeleteConfirmModal 
       isOpen={!!questManager.questToDelete} 
       onClose={() => questManager.setQuestToDelete(null)}
       onConfirm={() => {
           if (questManager.questToDelete) {
               questManager.handleDeleteQuest(questManager.questToDelete);
               questManager.setQuestToDelete(null);
           }
       }}
       title="Delete Operation?"
       description="Are you sure you want to delete this operation? This action cannot be undone."
      />

      <DeleteConfirmModal 
       isOpen={!!challengeManager.challengeToDelete} 
       onClose={() => challengeManager.setChallengeToDelete(null)}
       onConfirm={() => {
           if (challengeManager.challengeToDelete) {
               challengeManager.handleDeleteChallenge(challengeManager.challengeToDelete);
               challengeManager.setChallengeToDelete(null);
           }
       }}
       title="Terminate Challenge?"
       description="Are you sure you want to cancel this challenge? All progress will be lost."
      />

      <CreateTaskModal 
        isOpen={taskManager.isModalOpen || questManager.questTaskConfig.isOpen} 
        onClose={() => {
          taskManager.setIsModalOpen(false); 
          questManager.setQuestTaskConfig({ isOpen: false });
        }} 
        isQuestTask={questManager.questTaskConfig.isOpen}
        onSubmit={handleTaskModalSubmit} 
        editingTask={questManager.questTaskConfig.editingTask ? { 
          id: questManager.questTaskConfig.editingTask.task_id, 
          title: questManager.questTaskConfig.editingTask.name, 
          description: questManager.questTaskConfig.editingTask.description || '', 
          difficulty: questManager.questTaskConfig.editingTask.difficulty, 
          skillCategory: questManager.questTaskConfig.editingTask.skillCategory, 
          isHabit: false, 
          completed: false, 
          streak: 0, 
          lastCompletedDate: null, 
          createdAt: '' 
        } : taskManager.editingTask} 
        templates={userManager.user.templates} 
        onSaveTemplate={(data: any) => userManager.saveTemplate({ id: crypto.randomUUID(), ...data })} 
        onDeleteTemplate={userManager.deleteTemplate} 
      />

      <SimpleInputModal 
        isOpen={questManager.textModalConfig.isOpen} 
        onClose={() => questManager.setTextModalConfig({ isOpen: false, type: null })} 
        title={questManager.textModalConfig.type === 'edit-quest' ? 'Modify Operation Title' : questManager.textModalConfig.type === 'edit-category' ? 'Modify Phase Title' : `Create New ${questManager.textModalConfig.type === 'category' ? 'Phase' : 'Operation'}`} 
        placeholder="Enter title..." 
        initialValue={questManager.textModalConfig.initialValue}
        onSubmit={handleTextModalSubmit} 
      />
      
      <CreateChallengeModal 
        isOpen={challengeManager.isChallengeModalOpen}
        onClose={() => {
          challengeManager.setIsChallengeModalOpen(false);
          challengeManager.setEditingChallenge(null);
        }}
        friends={challengeManager.friends}
        editingChallenge={challengeManager.editingChallenge}
        onSubmit={challengeManager.handleCreateChallenge}
      />

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      
      {isSettingsOpen && <SettingsView user={userManager.user} onClose={() => setIsSettingsOpen(false)} onUpdateNickname={userManager.updateNickname} />}
      
      {userManager.showLevelUp && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-3xl animate-in zoom-in-95 duration-700">
          <Trophy size={160} className="text-primary animate-bounce shadow-primary/50" />
          <h2 className="text-8xl font-black text-primary mt-12 mb-4 tracking-tighter uppercase italic drop-shadow-[0_0_30px_rgba(0,225,255,0.6)]">Level Up</h2>
          <p className="text-3xl text-white font-black uppercase tracking-widest">Performance Level {userManager.showLevelUp.level} Achieved</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default App;
