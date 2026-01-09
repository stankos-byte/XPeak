
import React, { useState, useEffect, useRef } from 'react';
import { 
  Task, 
  UserProfile, 
  SkillCategory, 
  Difficulty,
  Goal,
  MainQuest,
  QuestCategory,
  QuestTask,
  TaskTemplate,
  ProfileLayout,
  WidgetId,
  Friend,
  FriendChallenge,
  ChatMessage
} from './types';
import { calculateXP, calculateLevel, getLevelProgress, getXPRequirement } from './utils/gamification';
import { SKILL_COLORS } from './constants';
import SkillRadar from './components/SkillRadar';
import TaskCard from './components/TaskCard';
import CreateTaskModal from './components/CreateTaskModal';
import SimpleInputModal from './components/SimpleInputModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import FeedbackModal from './components/FeedbackModal';
import CreateChallengeModal from './components/CreateChallengeModal';
import AIAssistantView from './components/AIAssistantView';
import { 
  IdentityWidget, 
  SkillMatrixWidget, 
  EvolutionWidget, 
  ObjectivesWidget,
  CalendarWidget,
  FriendsWidget
} from './components/ProfileWidgets';
import { 
  Swords, 
  Trophy, 
  User, 
  Plus, 
  Activity,
  Zap,
  TrendingUp,
  LayoutDashboard,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Target,
  LayoutGrid,
  Clock,
  X,
  Crown,
  CheckSquare,
  Square,
  Trash2,
  Mountain,
  ChevronRight,
  ChevronDown,
  Map,
  Circle,
  CheckCircle2,
  PlayCircle,
  FolderPlus,
  FilePlus,
  Pencil,
  Save,
  Volume2,
  Settings2,
  Minus,
  AlertTriangle,
  Flag,
  Sparkles,
  Timer,
  BarChart2,
  Calendar,
  Layers,
  Hourglass,
  Scissors,
  Brain,
  Home,
  Loader2,
  Settings,
  Eye,
  EyeOff,
  History,
  PlusCircle,
  AlertCircle,
  MessageSquare,
  Users,
  Search,
  ShieldAlert,
  Medal,
  Flame,
  UserPlus,
  Bot,
  MoreVertical
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Helper Functions ---

const isCategoryComplete = (category: QuestCategory) => 
  category.tasks.length > 0 && category.tasks.every(t => t.status === 'completed');

const isQuestComplete = (quest: MainQuest) => 
  quest.categories.length > 0 && quest.categories.every(cat => isCategoryComplete(cat));

const getQuestBonusAmount = (categoryCount: number) => {
  if (categoryCount < 1) return 0;
  if (categoryCount < 3) return 80;
  if (categoryCount <= 5) return 120;
  return 180;
};

// Moving layout and initial state logic outside App component to fix declaration order issues
const DEFAULT_LAYOUT: ProfileLayout = { 
  widgets: [
    { id: 'identity', enabled: true, order: 0 }, 
    { id: 'skillMatrix', enabled: true, order: 1 }, 
    { id: 'evolution', enabled: true, order: 2 }, 
    { id: 'calendar', enabled: true, order: 3 }, 
    { id: 'friends', enabled: true, order: 4 },
    { id: 'objectives', enabled: true, order: 5 }
  ] 
};

const getInitialUserLocal = (): UserProfile => {
  const saved = localStorage.getItem('lvlup_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migration: Ensure all default widgets exist
      const existingIds = new Set(parsed.layout?.widgets?.map((w: any) => w.id) || []);
      const newWidgets = DEFAULT_LAYOUT.widgets.filter(w => !existingIds.has(w.id));
      
      const layout = parsed.layout ? {
          ...parsed.layout,
          widgets: [...parsed.layout.widgets, ...newWidgets]
      } : DEFAULT_LAYOUT;

      return { ...parsed, layout };
    } catch (e) {
      console.error("Failed to load user state", e);
    }
  }
  const skills: any = {};
  Object.values(SkillCategory).forEach(cat => {
    skills[cat] = { category: cat, xp: 0, level: 0 };
  });
  return { 
    name: 'Protocol-01', 
    totalXP: 0, 
    level: 0, 
    skills, 
    history: [], 
    identity: '', 
    goals: [], 
    templates: [], 
    layout: DEFAULT_LAYOUT 
  };
};

// --- Mock Data Initializers ---
const INITIAL_FRIENDS: Friend[] = [
  { id: '1', name: 'Cyber-Stalker', level: 12, xp: 4500, status: 'online', lastActive: 'Now', color: 'bg-red-500' },
  { id: '2', name: 'Neon-Drifter', level: 9, xp: 3200, status: 'offline', lastActive: '2h ago', color: 'bg-emerald-500' },
  { id: '3', name: 'Null-Pointer', level: 10, xp: 3850, status: 'online', lastActive: '5m ago', color: 'bg-amber-500' },
  { id: '4', name: 'Void-Walker', level: 8, xp: 2100, status: 'busy', lastActive: '1d ago', color: 'bg-purple-500' },
  { id: '5', name: 'Glitch-Witch', level: 15, xp: 6200, status: 'offline', lastActive: '3d ago', color: 'bg-pink-500' },
];

const INITIAL_CHALLENGES: FriendChallenge[] = [
  { id: 'c1', title: 'Sprint to Level 13', description: 'First operative to reach Level 13 secures the bounty.', opponentId: '1', metric: 'XP', targetValue: 5000, myProgress: 3950, opponentProgress: 4500, rewardXP: 500, timeLeft: '2d 4h' },
  { id: 'c2', title: 'Deep Work Protocol', description: 'Maintain focus streak. Highest habit completion count wins.', opponentId: '2', metric: 'Tasks', targetValue: 20, myProgress: 12, opponentProgress: 8, rewardXP: 250, timeLeft: '18h' },
];

// --- View Components ---

const FriendsView = ({ user, friends, challenges, onCreateChallenge, onDeleteChallenge }: { user: UserProfile, friends: Friend[], challenges: FriendChallenge[], onCreateChallenge: () => void, onDeleteChallenge: (id: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'network' | 'challenges'>('network');

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-20 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-1 uppercase tracking-tighter italic">Global Network</h1>
          <p className="text-secondary font-medium tracking-wide">Manage alliances and competitive contracts.</p>
        </div>
        <div className="flex bg-surface border border-secondary/20 rounded-xl p-1 gap-1">
          <button 
            onClick={() => setActiveTab('network')} 
            className={`px-6 py-2 rounded-lg font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${activeTab === 'network' ? 'bg-primary text-background shadow-lg shadow-primary/20' : 'text-secondary hover:text-white'}`}
          >
            <Users size={16} /> Operatives
          </button>
          <button 
            onClick={() => setActiveTab('challenges')} 
            className={`px-6 py-2 rounded-lg font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${activeTab === 'challenges' ? 'bg-primary text-background shadow-lg shadow-primary/20' : 'text-secondary hover:text-white'}`}
          >
            <Swords size={16} /> Challenges
          </button>
        </div>
      </header>

      {activeTab === 'network' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-surface border border-secondary/20 rounded-2xl p-6 shadow-xl">
               <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                  <input type="text" placeholder="Search operative database..." className="w-full bg-background border border-secondary/20 rounded-xl py-4 pl-12 pr-4 text-white focus:border-primary/50 outline-none font-medium placeholder-secondary/40" />
               </div>
               
               <div className="space-y-4">
                  {friends.map(friend => (
                    <div key={friend.id} className="group bg-background/50 border border-secondary/10 hover:border-primary/30 rounded-xl p-4 flex items-center justify-between transition-all hover:bg-background/80">
                       <div className="flex items-center gap-4">
                          <div className="relative">
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-background ${friend.color} shadow-lg shadow-${friend.color.replace('bg-', '')}/20`}>
                                {friend.name.substring(0, 1)}
                             </div>
                             <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface ${friend.status === 'online' ? 'bg-emerald-500' : friend.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                          </div>
                          <div>
                             <h3 className="font-bold text-gray-100">{friend.name}</h3>
                             <p className="text-xs text-secondary font-black uppercase tracking-wider">Level {friend.level} • {friend.xp} XP</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-right mr-2 hidden sm:block">
                             <p className="text-[10px] text-secondary font-bold uppercase">Last Active</p>
                             <p className="text-xs text-primary font-medium">{friend.lastActive}</p>
                          </div>
                          <button className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-background rounded-lg transition-colors" title="Send Challenge">
                             <Swords size={18} />
                          </button>
                          <button className="p-2 bg-secondary/10 text-secondary hover:text-white rounded-lg transition-colors" title="Message">
                             <MessageSquare size={18} />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
          
          <div className="space-y-6">
             <div className="bg-gradient-to-br from-surface to-background border border-primary/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><UserPlus size={100} /></div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest italic mb-2">Invite Operative</h3>
                <p className="text-secondary text-sm mb-6">Expand your network. Earn referral XP bonuses for each verified recruit.</p>
                <button className="w-full bg-primary hover:bg-cyan-400 text-background font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                   <Plus size={18} /> Generate Link
                </button>
             </div>

             <div className="bg-surface border border-secondary/20 rounded-2xl p-6">
                <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ShieldAlert size={14} /> Pending Requests
                </h3>
                <div className="text-center py-8 border border-dashed border-secondary/20 rounded-xl">
                   <p className="text-secondary/50 text-xs font-bold uppercase tracking-widest">No incoming transmissions</p>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {challenges.map(challenge => {
             const opponent = friends.find(f => f.id === challenge.opponentId);
             const myPercent = Math.min(100, (challenge.myProgress / challenge.targetValue) * 100);
             const oppPercent = Math.min(100, (challenge.opponentProgress / challenge.targetValue) * 100);
             const isWinning = challenge.myProgress > challenge.opponentProgress;

             return (
               <div key={challenge.id} className="bg-surface border border-secondary/20 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/40 transition-all">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">PvP Contract</span>
                           <span className="text-secondary text-[10px] font-bold flex items-center gap-1"><Clock size={10} /> {challenge.timeLeft || 'Ongoing'}</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter">{challenge.title}</h3>
                     </div>
                     <div className="flex items-start gap-3">
                        <div className="text-right">
                            <div className="text-xl md:text-2xl font-black text-primary drop-shadow-[0_0_10px_rgba(0,225,255,0.4)]">{challenge.rewardXP} XP</div>
                            <div className="text-[9px] text-secondary font-black uppercase tracking-widest">Bounty</div>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChallenge(challenge.id);
                            }}
                            className="text-secondary hover:text-red-500 transition-colors p-1"
                            title="Delete Challenge"
                        >
                            <Trash2 size={18} />
                        </button>
                     </div>
                  </div>
                  
                  <p className="text-secondary text-sm mb-6 relative z-10">{challenge.description}</p>
                  
                  <div className="space-y-6 relative z-10 bg-background/40 p-4 rounded-xl border border-secondary/10">
                     {/* My Progress */}
                     <div>
                        <div className="flex justify-between items-end mb-1">
                           <span className="text-xs font-black text-primary uppercase tracking-wider">You (Protocol-01)</span>
                           <span className="text-xs font-bold text-white">{Math.floor(challenge.myProgress)} / {challenge.targetValue} {challenge.metric}</span>
                        </div>
                        <div className="h-2 bg-background rounded-full overflow-hidden border border-secondary/20">
                           <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${myPercent}%` }}></div>
                        </div>
                     </div>

                     {/* Opponent Progress */}
                     {opponent && (
                        <div>
                           <div className="flex justify-between items-end mb-1">
                              <span className={`text-xs font-black uppercase tracking-wider ${isWinning ? 'text-secondary' : 'text-red-400'}`}>{opponent.name}</span>
                              <span className="text-xs font-bold text-gray-400">{Math.floor(challenge.opponentProgress)} / {challenge.targetValue} {challenge.metric}</span>
                           </div>
                           <div className="h-2 bg-background rounded-full overflow-hidden border border-secondary/20">
                              <div className={`h-full transition-all duration-1000 ${isWinning ? 'bg-secondary' : 'bg-red-500'}`} style={{ width: `${oppPercent}%` }}></div>
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="mt-4"></div>
                  
                  {/* Background decoration */}
                  <div className="absolute -right-10 -bottom-10 opacity-5 text-primary rotate-12 pointer-events-none">
                     <Swords size={200} />
                  </div>
               </div>
             );
           })}

           <div 
             onClick={onCreateChallenge}
             className="bg-surface/30 border border-dashed border-secondary/20 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] group hover:border-primary/30 transition-all cursor-pointer"
           >
              <div className="w-16 h-16 rounded-full bg-background border border-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xl">
                 <Plus size={32} className="text-secondary group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-white font-black uppercase tracking-widest mb-1">Create Challenge</h3>
              <p className="text-secondary text-sm text-center max-w-xs">Set terms, wager XP, and prove your superiority.</p>
           </div>
        </div>
      )}
    </div>
  );
};

const DashboardView = ({ user, tasks, handleCompleteTask, handleUncompleteTask, handleDeleteTask, handleEditTask, handleSaveTemplate, setIsModalOpen, setEditingTask, levelProgress, popups, flashKey }: any) => {
  const activeTasks = tasks.filter((t: Task) => !t.completed);
  
  // History now includes completed habits so they show up there instead of active list
  const recentHistory = tasks
    .filter((t: Task) => t.completed)
    .sort((a: Task, b: Task) => new Date(b.lastCompletedDate || 0).getTime() - new Date(a.lastCompletedDate || 0).getTime())
    .slice(0, 10); // Increased slice to show more history since habits go here now

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-secondary text-xs font-black uppercase tracking-widest flex items-center gap-2">Level Status</h3>
          <div className="flex items-center gap-1.5 text-primary">
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">Lifetime XP: {Math.floor(user.totalXP)}</span>
          </div>
        </div>
        <div className="bg-surface border border-secondary/20 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-20"></div>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-white">{Math.floor(levelProgress.current)}</span>
              <span className="text-secondary text-sm font-bold">/ {Math.floor(levelProgress.max)} XP</span>
            </div>
            <span className="text-primary font-black italic">{Math.floor(levelProgress.percentage)}% COMPLETE</span>
          </div>
          <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-secondary/20 relative">
            <div className="h-full bg-primary transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(0,225,255,0.6)]" style={{ width: `${levelProgress.percentage}%` }}>
                <div className="absolute inset-0 bg-white opacity-20 w-full animate-pulse"></div>
                <div key={flashKey} className="absolute inset-0 bg-white opacity-0 animate-bar-flash pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>

      <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter italic">Active Quests</h2>
          <p className="text-secondary font-medium tracking-wide">{activeTasks.length} objectives currently deployed.</p>
        </div>
        <button 
          onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-cyan-400 text-background px-6 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 w-full md:w-auto justify-center"
        >
          <Plus size={20} strokeWidth={3} />
          Initiate Quest
        </button>
      </header>

      <div className="space-y-4 mb-16">
        {activeTasks.map((task: Task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onComplete={handleCompleteTask} 
            onUncomplete={handleUncompleteTask}
            onDelete={handleDeleteTask} 
            onEdit={handleEditTask}
            onSaveTemplate={handleSaveTemplate}
            activePopup={popups[task.id]}
          />
        ))}
        
        {activeTasks.length === 0 && (
          <div className="text-center py-20 bg-surface/30 rounded-2xl border border-dashed border-secondary/20">
            <Trophy className="mx-auto text-secondary/40 mb-4" size={64} />
            <p className="text-secondary font-black uppercase tracking-widest text-sm">Zone Secured. No active threats.</p>
          </div>
        )}
      </div>

      <section className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-3 mb-6 px-1">
          <History size={18} className="text-secondary" />
          <h2 className="text-lg font-black text-secondary uppercase tracking-widest italic">Mission History</h2>
        </div>
        
        <div className="space-y-3">
          {recentHistory.length > 0 ? (
            recentHistory.map((task: Task) => (
              <div 
                key={task.id} 
                className="group flex items-center justify-between p-4 bg-surface/30 border border-secondary/10 rounded-xl hover:border-secondary/30 transition-all opacity-70 hover:opacity-100"
              >
                <div className="flex items-center gap-4 relative">
                  {popups[task.id] !== undefined && (
                    <div className="absolute -top-6 left-0 z-20 pointer-events-none animate-xp-float flex items-center gap-1">
                      <span className="text-sm font-black text-secondary drop-shadow-[0_0_8px_rgba(80,83,83,0.8)]">
                        {popups[task.id]} XP
                      </span>
                    </div>
                  )}

                  <button 
                    onClick={() => handleUncompleteTask(task.id)}
                    className="text-emerald-500 hover:text-red-400 transition-colors focus:outline-none"
                    title="Undo Completion"
                  >
                    <CheckCircle2 size={24} />
                  </button>

                  <div className="flex items-center gap-3">
                    <div 
                      className="w-1 h-8 rounded-full" 
                      style={{ backgroundColor: SKILL_COLORS[task.skillCategory] }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-300 line-through decoration-secondary/50 text-sm">{task.title}</h4>
                        {task.isHabit && (
                          <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                            Streak: {task.streak}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-secondary font-black uppercase tracking-widest">
                        Confirmed: {task.lastCompletedDate ? new Date(task.lastCompletedDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <span className="text-[8px] font-black uppercase tracking-widest text-secondary border border-secondary/20 px-2 py-0.5 rounded-md mr-2">
                     {task.difficulty}
                   </span>
                   <button 
                     onClick={() => handleDeleteTask(task.id)}
                     className="p-2 text-secondary hover:text-red-400 bg-background/50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                     title="Purge Record"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 border border-dashed border-secondary/10 rounded-xl">
              <p className="text-[10px] text-secondary/40 font-black uppercase tracking-widest">No historical data found in current session.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const QuestsView = ({ mainQuests, expandedNodes, toggleNode, setTextModalConfig, setQuestTaskConfig, handleToggleQuestTask, handleQuestOracle, oraclingQuestId, handleDeleteQuest, handleDeleteCategory, handleDeleteQuestTask, handleSaveTemplate, popups }: any) => {
  const [mobileMenuId, setMobileMenuId] = useState<string | null>(null);

  return (
  <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-500 pb-24">
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 px-1">
      <div>
         <h1 className="text-2xl md:text-3xl font-black text-white mb-1 uppercase tracking-tighter italic">Quest Log</h1>
         <p className="text-secondary font-medium tracking-wide">Strategic breakdown of multi-stage operations.</p>
      </div>
      <button 
        onClick={() => setTextModalConfig({ isOpen: true, type: 'quest' })}
        className="flex items-center gap-2 bg-primary hover:bg-cyan-400 text-background px-6 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 w-full md:w-auto justify-center"
      >
        <Plus size={20} strokeWidth={3} />
        Deploy Main Quest
      </button>
    </header>
    
    <div className="space-y-6">
      {mainQuests.map((mainQuest: MainQuest) => {
        const isMainExpanded = expandedNodes.has(mainQuest.id);
        const isOracling = oraclingQuestId === mainQuest.id;
        const isMobileMenuOpen = mobileMenuId === mainQuest.id;

        return (
          <div key={mainQuest.id} className="bg-surface border border-secondary/10 rounded-2xl overflow-hidden shadow-xl transition-all relative">
            {popups[`quest-bonus-${mainQuest.id}`] !== undefined && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-xp-float flex items-center gap-2 whitespace-nowrap">
                <span className={`text-2xl font-black drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] ${popups[`quest-bonus-${mainQuest.id}`] > 0 ? 'text-primary' : 'text-red-400'}`}>
                  {popups[`quest-bonus-${mainQuest.id}`] > 0 ? `+${popups[`quest-bonus-${mainQuest.id}`]}` : popups[`quest-bonus-${mainQuest.id}`]} XP [QUEST BONUS]
                </span>
                <Sparkles className="text-primary animate-pulse" size={24} />
              </div>
            )}

            <div 
              className={`p-6 bg-background border-b border-secondary/10 cursor-pointer hover:bg-surface transition-colors flex flex-col group/q`}
              onClick={() => toggleNode(mainQuest.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="text-primary"><Crown size={28} /></div>
                   <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic">{mainQuest.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                   {/* Desktop Menu */}
                   <div className="hidden md:flex items-center gap-2">
                     <button 
                       onClick={(e) => { e.stopPropagation(); setTextModalConfig({ isOpen: true, type: 'edit-quest', parentId: mainQuest.id, initialValue: mainQuest.title }); }}
                       className="p-2.5 rounded-xl border border-secondary/20 text-secondary hover:text-primary hover:border-primary/40 transition-all opacity-60 hover:opacity-100"
                       title="Edit Quest Identifier"
                     >
                       <Pencil size={20} />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setTextModalConfig({ isOpen: true, type: 'category', parentId: mainQuest.id }); }}
                       className="p-2.5 rounded-xl border border-secondary/20 text-secondary hover:text-primary hover:border-primary/40 transition-all opacity-60 hover:opacity-100"
                       title="Add New Section"
                     >
                       <PlusCircle size={20} />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleQuestOracle(mainQuest); }}
                       disabled={isOracling}
                       className={`p-2.5 rounded-xl transition-all border ${isOracling ? 'border-primary text-primary animate-pulse' : 'border-secondary/20 text-secondary hover:text-primary hover:border-primary/40 opacity-60 hover:opacity-100'}`}
                       title="Summon AI Oracle"
                     >
                       {isOracling ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleDeleteQuest(mainQuest.id); }}
                       className="p-2.5 rounded-xl border border-secondary/20 text-secondary hover:text-red-400 hover:border-red-400/40 transition-all opacity-60 hover:opacity-100"
                       title="Abort Quest Chain"
                     >
                       <Trash2 size={20} />
                     </button>
                   </div>
                   
                   {/* Mobile Menu Button */}
                   <button 
                     onClick={(e) => { e.stopPropagation(); setMobileMenuId(isMobileMenuOpen ? null : mainQuest.id); }}
                     className={`md:hidden p-2 rounded-xl border border-secondary/20 text-secondary hover:text-primary transition-colors ${isMobileMenuOpen ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
                   >
                     <MoreVertical size={24} />
                   </button>
                   
                   <div className="text-secondary ml-1">{isMainExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}</div>
                </div>
              </div>

              {/* Mobile Menu Actions */}
              {isMobileMenuOpen && (
                <div className="md:hidden mt-4 pt-4 border-t border-secondary/10 flex items-center justify-between gap-2 animate-in slide-in-from-top-2 fade-in">
                   <button 
                     onClick={(e) => { e.stopPropagation(); setTextModalConfig({ isOpen: true, type: 'edit-quest', parentId: mainQuest.id, initialValue: mainQuest.title }); setMobileMenuId(null); }}
                     className="flex-1 p-3 rounded-xl border border-secondary/20 text-secondary hover:text-primary hover:border-primary/40 transition-all flex justify-center bg-surface"
                     title="Edit"
                   >
                     <Pencil size={20} />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setTextModalConfig({ isOpen: true, type: 'category', parentId: mainQuest.id }); setMobileMenuId(null); }}
                     className="flex-1 p-3 rounded-xl border border-secondary/20 text-secondary hover:text-primary hover:border-primary/40 transition-all flex justify-center bg-surface"
                     title="Add Section"
                   >
                     <PlusCircle size={20} />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleQuestOracle(mainQuest); setMobileMenuId(null); }}
                     disabled={isOracling}
                     className={`flex-1 p-3 rounded-xl border transition-all flex justify-center bg-surface ${isOracling ? 'border-primary text-primary animate-pulse' : 'border-secondary/20 text-secondary hover:text-primary hover:border-primary/40'}`}
                     title="AI Oracle"
                   >
                     {isOracling ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDeleteQuest(mainQuest.id); setMobileMenuId(null); }}
                     className="flex-1 p-3 rounded-xl border border-secondary/20 text-secondary hover:text-red-400 hover:border-red-400/40 transition-all flex justify-center bg-surface"
                     title="Delete"
                   >
                     <Trash2 size={20} />
                   </button>
                </div>
              )}
            </div>
            
            {isMainExpanded && (
              <div className="p-6 space-y-8 bg-surface animate-in slide-in-from-top-2">
                {mainQuest.categories.map((category) => (
                  <div key={category.id} className="space-y-4 group/c relative">
                    {popups[`section-bonus-${category.id}`] !== undefined && (
                      <div className="absolute -top-6 right-10 z-50 pointer-events-none animate-xp-float flex items-center gap-1 whitespace-nowrap">
                        <span className={`text-lg font-black drop-shadow-[0_0_12px_rgba(0,0,0,0.8)] ${popups[`section-bonus-${category.id}`] > 0 ? 'text-primary' : 'text-red-400'}`}>
                          {popups[`section-bonus-${category.id}`] > 0 ? `+${popups[`section-bonus-${category.id}`]}` : popups[`section-bonus-${category.id}`]} XP [SECTION BONUS]
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-l-4 border-primary/40 pl-4 py-1">
                      <h3 className="text-base md:text-lg font-black text-primary uppercase tracking-widest italic">{category.title}</h3>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setTextModalConfig({ isOpen: true, type: 'edit-category', parentId: mainQuest.id, categoryId: category.id, initialValue: category.title })}
                          className="p-1.5 text-secondary hover:text-primary transition-all opacity-60 hover:opacity-100"
                          title="Edit Section Title"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => setQuestTaskConfig({ isOpen: true, questId: mainQuest.id, categoryId: category.id })}
                          className="p-1.5 text-secondary hover:text-primary transition-all opacity-60 hover:opacity-100"
                          title="Add Objective"
                        >
                          <PlusCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(mainQuest.id, category.id)}
                          className="p-1.5 text-secondary hover:text-red-400 transition-all opacity-60 hover:opacity-100"
                          title="Purge Section"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="pl-6 space-y-4">
                      {category.tasks.map((task) => {
                        const mappedTask: Task = {
                          id: task.task_id,
                          title: task.name,
                          description: task.description,
                          difficulty: task.difficulty,
                          skillCategory: task.skillCategory,
                          completed: task.status === 'completed',
                          isHabit: false,
                          streak: 0,
                          lastCompletedDate: null,
                          createdAt: ''
                        };

                        return (
                          <TaskCard 
                            key={task.task_id}
                            task={mappedTask}
                            onComplete={() => handleToggleQuestTask(mainQuest.id, category.id, task.task_id)}
                            onUncomplete={() => handleToggleQuestTask(mainQuest.id, category.id, task.task_id)}
                            onDelete={() => handleDeleteQuestTask(mainQuest.id, category.id, task.task_id)}
                            onEdit={() => setQuestTaskConfig({ isOpen: true, questId: mainQuest.id, categoryId: category.id, editingTask: task })}
                            onSaveTemplate={() => handleSaveTemplate(mappedTask)}
                            activePopup={popups[task.task_id]}
                          />
                        );
                      })}
                      
                      {category.tasks.length === 0 && (
                        <p className="text-[10px] text-secondary/40 font-black uppercase tracking-widest p-4 border border-dashed border-secondary/10 rounded-xl text-center">Empty Section</p>
                      )}
                    </div>
                  </div>
                ))}

                {mainQuest.categories.length === 0 && (
                  <div className="text-center py-10 bg-background/20 rounded-2xl border border-dashed border-secondary/10">
                    <p className="text-secondary font-black uppercase tracking-widest text-xs italic">No sections defined.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
  );
};

const ProfileView = ({ user, handleUpdateIdentity, handleAddGoal, handleToggleGoal, handleDeleteGoal, levelProgress, flashKey, layout, onUpdateLayout }: any) => {
  const [isCustomizing, setIsCustomizing] = useState(false);

  const toggleWidget = (id: WidgetId) => {
    const newWidgets = layout.widgets.map((w: any) => w.id === id ? { ...w, enabled: !w.enabled } : w);
    onUpdateLayout({ widgets: newWidgets });
  };

  const moveWidget = (id: WidgetId, direction: 'up' | 'down') => {
    const sorted = [...layout.widgets].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(w => w.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const tempOrder = sorted[index].order;
    sorted[index].order = sorted[newIndex].order;
    sorted[newIndex].order = tempOrder;
    onUpdateLayout({ widgets: sorted });
  };

  const sortedWidgets = [...layout.widgets].sort((a, b) => a.order - b.order);

  const renderWidget = (id: WidgetId, isFirst: boolean, isLast: boolean) => {
    const config = layout.widgets.find((w: any) => w.id === id);
    const props = { isCustomizing, enabled: config.enabled, onToggle: () => toggleWidget(id), onMoveUp: () => moveWidget(id, 'up'), onMoveDown: () => moveWidget(id, 'down'), isFirst, isLast };
    switch (id) {
      case 'identity': return <IdentityWidget key={id} user={user} handleUpdateIdentity={handleUpdateIdentity} {...props} />;
      case 'skillMatrix': return <SkillMatrixWidget key={id} user={user} {...props} />;
      case 'evolution': return <EvolutionWidget key={id} user={user} flashKey={flashKey} {...props} />;
      case 'calendar': return <CalendarWidget key={id} user={user} {...props} />;
      case 'friends': return <FriendsWidget key={id} user={user} {...props} />;
      case 'objectives': return <ObjectivesWidget key={id} user={user} handleAddGoal={handleAddGoal} handleToggleGoal={handleToggleGoal} handleDeleteGoal={handleDeleteGoal} {...props} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-right-8 duration-500 pb-20 relative">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 bg-surface rounded-full flex items-center justify-center border-4 border-primary text-primary relative shadow-[0_0_20px_rgba(0,225,255,0.3)]">
              <User size={40} />
              <div className="absolute -bottom-1 -right-1 bg-background border border-primary/40 rounded-full p-1.5">
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic">{user.name}</h1>
              <p className="text-primary font-black uppercase tracking-widest text-xs mt-1">Evolved Rank {user.level} Protocol</p>
            </div>
          </div>
          <button onClick={() => setIsCustomizing(!isCustomizing)} className={`p-4 rounded-xl border transition-all ${isCustomizing ? 'bg-primary border-primary text-background shadow-[0_0_25px_rgba(0,225,255,0.5)]' : 'bg-surface border-secondary/20 text-secondary hover:text-primary'}`}>
             <LayoutGrid size={28} strokeWidth={isCustomizing ? 3 : 2} />
          </button>
       </div>
       <section className="bg-surface border border-secondary/20 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-20"></div>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-white">{Math.floor(levelProgress.current)}</span>
              <span className="text-secondary text-sm font-bold">/ {Math.floor(levelProgress.max)} XP</span>
            </div>
            <span className="text-primary font-black italic">{Math.floor(levelProgress.percentage)}% TO NEXT RANK</span>
          </div>
          <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-secondary/20 relative mb-4">
            <div className="h-full bg-primary transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(0,225,255,0.6)]" style={{ width: `${levelProgress.percentage}%` }}>
                <div className="absolute inset-0 bg-white opacity-20 w-full animate-pulse"></div>
                <div key={flashKey} className="absolute inset-0 bg-white opacity-0 animate-bar-flash pointer-events-none"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-secondary/10">
             <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Lifetime Accumulation</span>
             <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                <span className="text-sm font-black text-white tracking-widest">{Math.floor(user.totalXP)} XP</span>
             </div>
          </div>
       </section>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {sortedWidgets.map((w, idx) => {
           if (!w.enabled && !isCustomizing) return null;
           const isHalfWidth = w.id === 'skillMatrix' || w.id === 'evolution' || w.id === 'calendar' || w.id === 'friends';
           return (
             <div key={w.id} className={isHalfWidth ? "col-span-1" : "col-span-1 md:col-span-2"}>
               {renderWidget(w.id as WidgetId, idx === 0, idx === sortedWidgets.length - 1)}
             </div>
           );
         })}
       </div>
    </div>
  );
};

const ToolsView = ({ switchTimerMode, timerMode, formatTime, timerTimeLeft, toggleTimer, isTimerActive, resetTimer, handleAdjustTimer }: any) => {
  const productivityTools = [
    { title: "The 2-Minute Rule", icon: Zap, desc: "Beat procrastination by immediately executing any task that takes less than two minutes. This prevents small chores from piling up into a massive backlog." },
    { title: "Eat the Frog", icon: Target, desc: "Tackle your most challenging, significant, or dreaded task first thing in the morning. Completing it gives you momentum and eliminates looming anxiety for the rest of the day." },
    { title: "Deep Work", icon: Activity, desc: "Dedicate set periods to distraction-free, cognitively demanding tasks. Turn off notifications and focus intensely to maximize output and master complex information quickly." },
    { title: "The 5-Second Rule", icon: Timer, desc: "When you have an impulse to act on a goal, physically move within 5 seconds to bypass your brain's hesitation and fear response before it stops you." },
    { title: "The 80/20 Rule", icon: BarChart2, desc: "Focus your energy on the vital 20% of activities that yield 80% of your results. Identify and prioritize high-impact tasks while delegating or eliminating low-value busywork." },
    { title: "Time Blocking", icon: Calendar, desc: "Schedule your day into distinct blocks of time dedicated to specific tasks or task types. This creates a structured framework that reduces decision fatigue and keeps you on track." },
    { title: "Time Batching", icon: Layers, desc: "Group similar low-intensity tasks (like email, admin, or calls) and do them all at once. This minimizes the mental penalty of context switching and preserves flow state for harder work." },
    { title: "Parkinson’s Law", icon: Hourglass, desc: "Set artificial, shorter deadlines for your tasks. Since work expands to fill the time available, limiting the time forces you to focus on essentials and finish faster." },
    { title: "Chunking", icon: Scissors, desc: "Break down overwhelming projects into small, manageable, bite-sized action items. This reduces friction and makes starting easier by clarifying exactly what to do next." },
    { title: "Zeigarnik Effect", icon: Brain, desc: "Your brain dwells on unfinished tasks. Offload them by writing them down in a trusted system to clear your mental RAM and reduce anxiety, allowing you to focus on the present." },
    { title: "Environmental Design", icon: Home, desc: "Optimize your physical space to reduce friction for good habits and increase it for bad ones. Put distractions out of sight and keep tools for success within immediate reach." },
    { title: "The 1% Rule", icon: TrendingUp, desc: "Focus on consistent, marginal improvements rather than massive overnight success. Getting 1% better every day compounds into a 37x improvement over the course of a year." }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic">System Utilities</h1>
        </header>
        <section className="bg-surface border border-secondary/20 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[250px] border-primary/10">
           {isTimerActive && <div className="absolute inset-0 bg-primary/5 animate-pulse-slow pointer-events-none"></div>}
           <div className="flex gap-4 mb-6 relative z-10">
              <button onClick={() => switchTimerMode('work')} className={`px-4 py-2 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${timerMode === 'work' ? 'bg-primary text-background shadow-[0_0_20px_rgba(0,225,255,0.4)] scale-105' : 'text-secondary border border-secondary/30 hover:border-primary/50'}`}>Work Protocol</button>
              <button onClick={() => switchTimerMode('break')} className={`px-4 py-2 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${timerMode === 'break' ? 'bg-emerald-500 text-background shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105' : 'text-secondary border border-secondary/30 hover:border-emerald-500/50'}`}>Rest Mode</button>
           </div>
           <div className="flex items-center justify-center gap-4 mb-6 relative z-10 w-full max-w-lg">
             {!isTimerActive && <button onClick={() => handleAdjustTimer(-60)} className="p-2 bg-background border border-secondary/20 rounded-full text-secondary hover:text-primary transition-all active:scale-90"><Minus size={20} /></button>}
             <div className="text-5xl md:text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(0,225,255,0.4)] italic">{formatTime(timerTimeLeft)}</div>
             {!isTimerActive && <button onClick={() => handleAdjustTimer(60)} className="p-2 bg-background border border-secondary/20 rounded-full text-secondary hover:text-primary transition-all active:scale-90"><Plus size={20} /></button>}
           </div>
           <div className="flex gap-4 relative z-10">
              <button onClick={toggleTimer} className={`p-4 rounded-full border transition-all active:scale-95 ${isTimerActive ? 'bg-surface border-secondary/30 text-secondary hover:text-red-400' : 'bg-background border-primary/40 text-primary hover:bg-surface shadow-[0_0_25px_rgba(0,225,255,0.2)]'}`}>{isTimerActive ? <Pause size={24} /> : <Play size={24} className="ml-1" />}</button>
              <button onClick={resetTimer} className="bg-background border border-secondary/30 text-secondary hover:text-white p-4 rounded-full transition-all active:rotate-180 duration-500"><RotateCcw size={24} /></button>
           </div>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {productivityTools.map((tool, idx) => (
             <div key={idx} className="bg-surface border border-secondary/10 rounded-2xl p-6 hover:border-primary/40 transition-all group hover:shadow-2xl">
                <div className="flex items-center gap-4 mb-3 text-primary">
                  <tool.icon size={24} className="shrink-0" />
                  <h3 className="text-sm font-black uppercase tracking-widest italic">{tool.title}</h3>
                </div>
                <p className="text-secondary text-sm font-medium leading-relaxed group-hover:text-gray-200 transition-colors">{tool.desc}</p>
             </div>
           ))}
        </div>
    </div>
  );
};

// --- App Component ---

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(getInitialUserLocal);
  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('lvlup_tasks') || '[]'));
  const [mainQuests, setMainQuests] = useState<MainQuest[]>(() => JSON.parse(localStorage.getItem('lvlup_quests') || '[]')); 
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [challenges, setChallenges] = useState<FriendChallenge[]>(INITIAL_CHALLENGES);
  // Chat state lifted to App.tsx for persistence
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: `System Online. Greetings, ${user.name}. I am your designated Support AI. I have access to your skill matrix, active directives, and social protocols. How may I assist in optimizing your progression today?` }
  ]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('lvlup_quests');
    if (saved) return new Set(JSON.parse(saved).map((q: any) => q.id));
    return new Set();
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [xpPopups, setXpPopups] = useState<Record<string, number>>({});
  const [flashKey, setFlashKey] = useState(0);
  const [oraclingQuestId, setOraclingQuestId] = useState<string | null>(null);
  const [pendingQuestBonus, setPendingQuestBonus] = useState<{ qid: string, bonus: number, tid: string, questTitle: string } | null>(null);
  const [textModalConfig, setTextModalConfig] = useState<{ isOpen: boolean; type: 'quest' | 'category' | 'edit-quest' | 'edit-category' | null; parentId?: string; categoryId?: string; initialValue?: string; }>({ isOpen: false, type: null });
  const [questTaskConfig, setQuestTaskConfig] = useState<{isOpen: boolean; questId?: string; categoryId?: string; editingTask?: QuestTask | null;}>({ isOpen: false });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quests' | 'profile' | 'tools' | 'friends' | 'assistant'>('dashboard');
  const [showLevelUp, setShowLevelUp] = useState<{show: boolean, level: number} | null>(null);
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [timerTimeLeft, setTimerTimeLeft] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null);
  const [questToDelete, setQuestToDelete] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);

  // Habit Sync Logic
  useEffect(() => {
    const syncHabits = () => {
      const now = new Date();
      // "Today" at 00:00:00
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      // "Yesterday" at 00:00:00
      const yesterday = today - (24 * 60 * 60 * 1000);

      setTasks(prev => {
        let changed = false;
        const next = prev.map(t => {
          if (!t.isHabit) return t;

          // Normalize completion date to midnight timestamp
          const lastDate = t.lastCompletedDate ? new Date(t.lastCompletedDate) : null;
          const lastTime = lastDate ? new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime() : 0;

          let newCompleted = t.completed;
          let newStreak = t.streak;

          // 1. Reset if completed prior to today
          if (t.completed && lastTime < today) {
            newCompleted = false;
            changed = true;
          }

          // 2. Break streak if not completed yesterday or today
          if (lastTime < yesterday && t.streak > 0) {
            newStreak = 0;
            changed = true;
          }

          return changed ? { ...t, completed: newCompleted, streak: newStreak } : t;
        });
        return changed ? next : prev;
      });
    };

    syncHabits();
    const interval = setInterval(syncHabits, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timerEndTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((timerEndTime - now) / 1000);
        if (diff <= 0) {
          setTimerTimeLeft(0);
          setIsTimerActive(false);
          setTimerEndTime(null);
          // Optional: Notification sound can be triggered here
        } else {
          setTimerTimeLeft(diff);
        }
      }, 500); // Check every 500ms to correct drift quickly
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerEndTime]);

  useEffect(() => { localStorage.setItem('lvlup_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('lvlup_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('lvlup_quests', JSON.stringify(mainQuests)); }, [mainQuests]);

  const applyGlobalXPChange = (amount: number, historyId: string, popups: Record<string, number>) => {
    const newTotalXP = Math.max(0, user.totalXP + amount);
    const newLevel = calculateLevel(newTotalXP);
    if (amount > 0 && newLevel > user.level) {
      setShowLevelUp({ show: true, level: newLevel });
      setTimeout(() => setShowLevelUp(null), 3000);
    }
    setUser(prev => ({
      ...prev, totalXP: newTotalXP, level: newLevel,
      history: [{ date: new Date().toISOString(), xpGained: amount, taskId: historyId }, ...prev.history]
    }));
    setXpPopups(prev => ({ ...prev, ...popups }));
    setFlashKey(k => k + 1);
    const popupKeys = Object.keys(popups);
    setTimeout(() => setXpPopups(p => { const n = { ...p }; popupKeys.forEach(k => delete n[k]); return n; }), 1500);
  };

  // Logic for task completion on Dashboard
  const handleCompleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const xpResult = calculateXP(task);
    const amount = xpResult.total;
    
    // Increment streak if habit
    const newStreak = task.isHabit ? (task.streak || 0) + 1 : 0;

    setTasks(prev => prev.map(t => t.id === id ? { 
        ...t, 
        completed: true, 
        lastCompletedDate: new Date().toISOString(), 
        streak: newStreak 
    } : t));

    setUser(prev => {
      // Don't update specific skills if category is MISC/Default
      if (task.skillCategory === SkillCategory.MISC) return prev;

      const skill = prev.skills[task.skillCategory];
      const newSkillXP = Math.max(0, skill.xp + amount);
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [task.skillCategory]: {
            ...skill,
            xp: newSkillXP,
            level: calculateLevel(newSkillXP)
          }
        }
      };
    });
    applyGlobalXPChange(amount, id, { [id]: amount });
  };

  // Logic for undoing task completion on Dashboard
  const handleUncompleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const xpResult = calculateXP(task);
    const amount = -xpResult.total;

    // Decrement streak if habit
    const newStreak = task.isHabit ? Math.max(0, (task.streak || 0) - 1) : 0;

    setTasks(prev => prev.map(t => t.id === id ? { 
        ...t, 
        completed: false, 
        lastCompletedDate: null, 
        streak: newStreak 
    } : t));

    setUser(prev => {
      if (task.skillCategory === SkillCategory.MISC) return prev;

      const skill = prev.skills[task.skillCategory];
      const newSkillXP = Math.max(0, skill.xp + amount);
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [task.skillCategory]: {
            ...skill,
            xp: newSkillXP,
            level: calculateLevel(newSkillXP)
          }
        }
      };
    });
    applyGlobalXPChange(amount, id, { [id]: amount });
  };

  // Saving a task as a reusable template
  const handleSaveTemplate = (task: Task) => {
    const template: TaskTemplate = {
      id: crypto.randomUUID(),
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      skillCategory: task.skillCategory,
      isHabit: task.isHabit
    };
    setUser(prev => ({
      ...prev,
      templates: [template, ...prev.templates]
    }));
  };

  const handleToggleQuestTask = (qid: string, cid: string, tid: string) => {
    setMainQuests(qs => {
      const newQuests = [...qs];
      const qIdx = newQuests.findIndex(q => q.id === qid);
      if (qIdx === -1) return qs;
      const cIdx = newQuests[qIdx].categories.findIndex(c => c.id === cid);
      if (cIdx === -1) return qs;
      const tIdx = newQuests[qIdx].categories[cIdx].tasks.findIndex(t => t.task_id === tid);
      if (tIdx === -1) return qs;

      const quest = newQuests[qIdx];
      const category = quest.categories[cIdx];
      const questTask = category.tasks[tIdx];
      const isCompleting = questTask.status !== 'completed';
      
      const mappedTaskForXP: Task = { id: questTask.task_id, difficulty: questTask.difficulty, skillCategory: questTask.skillCategory, title: questTask.name, isHabit: false, completed: questTask.status === 'completed', streak: 0, lastCompletedDate: null, createdAt: '' };
      const xpResult = calculateXP(mappedTaskForXP);
      let immediateBonusXP = 0;
      let awardedSectionBonus = false;

      if (isCompleting) {
        if (category.tasks.every(t => t.task_id === tid || t.status === 'completed')) {
          immediateBonusXP += 20;
          awardedSectionBonus = true;
        }
      } else {
        if (isCategoryComplete(category)) {
          immediateBonusXP -= 20;
          awardedSectionBonus = true;
        }
      }

      const questBonusAmount = getQuestBonusAmount(quest.categories.length);
      const baseAmount = isCompleting ? xpResult.total : -xpResult.total;
      
      if (isCompleting) {
        if (quest.categories.every(cat => cat.id === cid ? cat.tasks.every(t => t.task_id === tid || t.status === 'completed') : isCategoryComplete(cat))) {
          setPendingQuestBonus({ qid, bonus: questBonusAmount, tid, questTitle: quest.title });
        }
      } else {
        if (isQuestComplete(quest)) {
          immediateBonusXP -= questBonusAmount;
          setXpPopups(prev => ({ ...prev, [`quest-bonus-${qid}`]: -questBonusAmount }));
          setTimeout(() => setXpPopups(p => { const n = { ...p }; delete n[`quest-bonus-${qid}`]; return n; }), 1500);
        }
      }

      const totalImmediateXP = baseAmount + immediateBonusXP;
      const newTotalXP = Math.max(0, user.totalXP + totalImmediateXP);
      const newLevel = calculateLevel(newTotalXP);
      if (isCompleting && newLevel > user.level) { setShowLevelUp({ show: true, level: newLevel }); setTimeout(() => setShowLevelUp(null), 3000); }
      
      const skill = user.skills[questTask.skillCategory];
      
      setUser(prev => ({
        ...prev, 
        totalXP: newTotalXP, 
        level: newLevel,
        skills: questTask.skillCategory === SkillCategory.MISC 
          ? prev.skills 
          : { ...prev.skills, [questTask.skillCategory]: { ...skill, xp: Math.max(0, skill.xp + baseAmount), level: calculateLevel(Math.max(0, skill.xp + baseAmount)) } },
        history: isCompleting ? [{ date: new Date().toISOString(), xpGained: totalImmediateXP, taskId: tid }, ...prev.history] : prev.history.filter((h, idx) => !(h.taskId === tid && idx === 0))
      }));

      const nPopups: Record<string, number> = { [tid]: baseAmount };
      if (awardedSectionBonus) nPopups[`section-bonus-${cid}`] = isCompleting ? 20 : -20;
      setXpPopups(prev => ({ ...prev, ...nPopups }));
      setFlashKey(k => k + 1);
      setTimeout(() => setXpPopups(p => { const n = { ...p }; delete n[tid]; delete n[`section-bonus-${cid}`]; return n; }), 1500);

      newQuests[qIdx].categories[cIdx].tasks[tIdx].status = isCompleting ? 'completed' : 'pending';
      return [...newQuests];
    });
  };

  const handleConfirmQuestBonus = () => {
    if (!pendingQuestBonus) return;
    applyGlobalXPChange(pendingQuestBonus.bonus, `bonus-${pendingQuestBonus.qid}`, { [`quest-bonus-${pendingQuestBonus.qid}`]: pendingQuestBonus.bonus });
    setPendingQuestBonus(null);
  };

  const handleQuestOracle = async (quest: MainQuest) => {
    // Check if quest already has data and confirm overwrite
    if (quest.categories.length > 0) {
      if (!window.confirm("This will overwrite the existing breakdown for this quest. Proceed?")) {
        return;
      }
    }

    setOraclingQuestId(quest.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Break down the quest "${quest.title}" into strategic categories and tasks. 
        For each category, provide a comprehensive list of tasks. 
        Do not limit yourself to a small number; if a category is complex, provide 5-10 actionable steps to fully complete it. 
        Adjust the task count based on the complexity of the section.`,
        config: { 
          responseMimeType: "application/json", 
          responseSchema: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { 
                title: { type: Type.STRING }, 
                tasks: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { 
                      name: { type: Type.STRING }, 
                      difficulty: { type: Type.STRING, enum: Object.values(Difficulty) }, 
                      skillCategory: { type: Type.STRING, enum: Object.values(SkillCategory) } 
                    }, 
                    required: ["name", "difficulty", "skillCategory"] 
                  } 
                } 
              }, 
              required: ["title", "tasks"] 
            } 
          } 
        } 
      });
      const data = JSON.parse(response.text || '[]');
      const newCats = data.map((c: any) => ({ 
        id: crypto.randomUUID(), 
        title: c.title, 
        tasks: c.tasks.map((t: any) => ({ 
          task_id: crypto.randomUUID(), 
          name: t.name, 
          status: 'pending', 
          difficulty: t.difficulty, 
          skillCategory: t.skillCategory 
        })) 
      }));
      
      // REPLACE categories instead of appending
      setMainQuests(prev => prev.map(mq => mq.id === quest.id ? { ...mq, categories: newCats } : mq));
      if (!expandedNodes.has(quest.id)) toggleNode(quest.id);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setOraclingQuestId(null); 
    }
  };

  const handleDeleteQuestTask = (questId: string, categoryId: string, taskId: string) => {
    setMainQuests(qs => {
      const q = qs.find(x => x.id === questId);
      if (!q) return qs;
      const c = q.categories.find(x => x.id === categoryId);
      if (!c) return qs;
      
      const wasSecComp = isCategoryComplete(c);
      const wasQuestComp = isQuestComplete(q);
      const remainingTasks = c.tasks.filter(t => t.task_id !== taskId);
      const isSecNowComp = remainingTasks.length > 0 && remainingTasks.every(t => t.status === 'completed');
      
      if (!wasSecComp && isSecNowComp) {
        applyGlobalXPChange(20, `section-del-bonus-${categoryId}`, { [`section-bonus-${categoryId}`]: 20 });
        const updatedCategory = { ...c, tasks: remainingTasks };
        const updatedQuest = { ...q, categories: q.categories.map(cat => cat.id === categoryId ? updatedCategory : cat) };
        if (!wasQuestComp && isQuestComplete(updatedQuest)) {
          const bonus = getQuestBonusAmount(updatedQuest.categories.length);
          applyGlobalXPChange(bonus, `quest-del-bonus-${questId}`, { [`quest-bonus-${questId}`]: bonus });
        }
      }
      
      return qs.map(mq => mq.id === questId ? { ...mq, categories: mq.categories.map(cat => cat.id === categoryId ? { ...cat, tasks: cat.tasks.filter(t => t.task_id !== taskId) } : cat) } : mq);
    });
  };

  const handleDeleteCategory = (questId: string, categoryId: string) => {
    setMainQuests(qs => {
      const q = qs.find(x => x.id === questId);
      if (!q) return qs;
      const wasQuestComp = isQuestComplete(q);
      const remainingCats = q.categories.filter(c => c.id !== categoryId);
      const isQuestNowComp = remainingCats.length > 0 && remainingCats.every(cat => isCategoryComplete(cat));
      
      if (!wasQuestComp && isQuestNowComp) {
        const bonus = getQuestBonusAmount(remainingCats.length);
        applyGlobalXPChange(bonus, `quest-catdel-bonus-${questId}`, { [`quest-bonus-${questId}`]: bonus });
      }
      
      return qs.map(mq => mq.id === questId ? { ...mq, categories: mq.categories.filter(c => c.id !== categoryId) } : mq);
    });
  };

  const toggleNode = (id: string) => setExpandedNodes(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const handleDeleteQuest = (id: string) => setQuestToDelete(id);

  // Timer Handlers
  const toggleTimer = () => {
    if (isTimerActive) {
      // Pause
      setIsTimerActive(false);
      setTimerEndTime(null);
    } else {
      // Start
      const endTime = Date.now() + timerTimeLeft * 1000;
      setTimerEndTime(endTime);
      setIsTimerActive(true);
    }
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    setTimerEndTime(null);
    setTimerTimeLeft(timerMode === 'work' ? workDuration : breakDuration);
  };

  const switchTimerMode = (mode: 'work' | 'break') => {
    setTimerMode(mode);
    setIsTimerActive(false);
    setTimerEndTime(null);
    setTimerTimeLeft(mode === 'work' ? workDuration : breakDuration);
  };

  const handleAdjustTimer = (change: number) => {
    // Only allow adjusting the preset, not the running timer time, as per original logic pattern.
    // However, if we are inactive, we update the display.
    if (timerMode === 'work') {
      const n = Math.max(60, workDuration + change);
      setWorkDuration(n);
      if (!isTimerActive) setTimerTimeLeft(n);
    } else {
      const n = Math.max(60, breakDuration + change);
      setBreakDuration(n);
      if (!isTimerActive) setTimerTimeLeft(n);
    }
  };

  // AI Assistant Handlers
  const handleAiCreateTask = (task: Partial<Task>) => {
    setTasks(prev => [{
      id: crypto.randomUUID(),
      title: task.title || 'New Assignment',
      description: task.description || '',
      difficulty: task.difficulty || Difficulty.EASY,
      skillCategory: task.skillCategory || SkillCategory.MISC,
      isHabit: task.isHabit || false,
      completed: false,
      streak: 0,
      lastCompletedDate: null,
      createdAt: new Date().toISOString()
    }, ...prev]);
  };

  const handleAiCreateQuest = (title: string, categories: any[] = []) => {
    const newId = crypto.randomUUID();
    
    let questCategories: any[] = [];
    if (categories && categories.length > 0) {
         questCategories = categories.map((c: any) => ({
            id: crypto.randomUUID(),
            title: c.title,
            tasks: c.tasks.map((t: any) => ({
                task_id: crypto.randomUUID(),
                name: t.name,
                status: 'pending',
                difficulty: t.difficulty || Difficulty.EASY,
                skillCategory: t.skillCategory || SkillCategory.MISC,
                description: t.description || ''
            }))
        }));
    }

    setMainQuests(p => [{ id: newId, title: title, categories: questCategories }, ...p]);
    setExpandedNodes(prev => new Set(prev).add(newId));
  };

  const handleAiCreateChallenge = (challenge: Partial<FriendChallenge>) => {
    setChallenges(prev => [...prev, {
      id: crypto.randomUUID(),
      title: challenge.title || 'New Challenge',
      description: challenge.description || 'Defeat your opponent.',
      opponentId: challenge.opponentId || '1',
      metric: challenge.metric || 'XP',
      targetValue: challenge.targetValue || 100,
      myProgress: 0,
      opponentProgress: 0,
      rewardXP: challenge.rewardXP || 100,
      timeLeft: '7d'
    }]);
  };
  
  const handleManualCreateChallenge = (data: any) => {
    const newChallenge: FriendChallenge = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description,
        opponentId: data.opponentId,
        metric: data.metric,
        targetValue: data.targetValue,
        myProgress: 0,
        opponentProgress: 0,
        rewardXP: data.rewardXP,
        timeLeft: '7d' // Default duration
    };
    setChallenges(prev => [...prev, newChallenge]);
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' }, 
    { id: 'quests', icon: Map, label: 'Quests' }, 
    { id: 'tools', icon: BookOpen, label: 'Tools' }, 
    { id: 'friends', icon: Users, label: 'Friends' },
    { id: 'assistant', icon: Bot, label: 'Oracle' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col md:flex-row font-sans">
      <nav className="hidden md:flex w-24 lg:w-72 bg-background border-r border-secondary/10 flex-col py-10 sticky top-0 h-screen z-20 justify-between">
        <div className="flex flex-col items-center lg:items-start px-0 lg:px-10 w-full">
          <div className="flex items-center gap-3 mb-16 text-primary"><Swords size={40} /><span className="hidden lg:block text-3xl font-black uppercase tracking-tighter italic">LevelUp</span></div>
          <div className="w-full space-y-4">{navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center justify-center lg:justify-start gap-4 p-5 rounded-2xl transition-all border ${activeTab === item.id ? 'bg-primary/10 border-primary/40 text-primary shadow-[0_0_15px_rgba(0,225,255,0.1)]' : 'text-secondary border-transparent hover:bg-surface hover:text-gray-100'}`}>
              <item.icon size={26} /><span className="hidden lg:block font-black uppercase tracking-widest text-xs">{item.label}</span>
            </button>
          ))}</div>
        </div>
        
        <div className="w-full px-0 lg:px-10 mt-auto">
           <button onClick={() => setIsFeedbackOpen(true)} className="w-full flex items-center justify-center lg:justify-start gap-4 p-5 rounded-2xl transition-all border text-secondary border-transparent hover:bg-surface hover:text-gray-100">
              <MessageSquare size={26} /><span className="hidden lg:block font-black uppercase tracking-widest text-xs">Feedback</span>
           </button>
        </div>
      </nav>
      <main className="flex-1 p-6 lg:p-14 pb-32 overflow-y-auto">
        {activeTab === 'profile' && <ProfileView user={user} handleUpdateIdentity={(i:any)=>setUser(p=>({...p,identity:i}))} handleAddGoal={(t:any)=>setUser(p=>({...p,goals:[{id:crypto.randomUUID(),title:t,completed:false},...p.goals]}))} handleToggleGoal={(id:any)=>setUser(p=>({...p,goals:p.goals.map(g=>g.id===id?{...g,completed:!g.completed}:g)}))} handleDeleteGoal={(id:any)=>setUser(p=>({...p,goals:p.goals.filter(g=>g.id!==id)}))} levelProgress={getLevelProgress(user.totalXP, user.level)} flashKey={flashKey} layout={user.layout || DEFAULT_LAYOUT} onUpdateLayout={(l:any)=>setUser(p=>({...p,layout:l}))} />}
        {activeTab === 'dashboard' && <DashboardView user={user} tasks={tasks} handleCompleteTask={handleCompleteTask} handleUncompleteTask={handleUncompleteTask} handleDeleteTask={(id:any)=>setTasks(t=>t.filter(x=>x.id!==id))} handleEditTask={(t:any)=>{setEditingTask(t);setIsModalOpen(true);}} handleSaveTemplate={handleSaveTemplate} setIsModalOpen={setIsModalOpen} setEditingTask={setEditingTask} levelProgress={getLevelProgress(user.totalXP, user.level)} popups={xpPopups} flashKey={flashKey} />}
        {activeTab === 'quests' && <QuestsView mainQuests={mainQuests} expandedNodes={expandedNodes} toggleNode={toggleNode} setTextModalConfig={setTextModalConfig} setQuestTaskConfig={setQuestTaskConfig} handleToggleQuestTask={handleToggleQuestTask} handleQuestOracle={handleQuestOracle} oraclingQuestId={oraclingQuestId} handleDeleteQuest={handleDeleteQuest} handleDeleteCategory={handleDeleteCategory} handleDeleteQuestTask={handleDeleteQuestTask} handleSaveTemplate={handleSaveTemplate} popups={xpPopups} />}
        {activeTab === 'tools' && <ToolsView switchTimerMode={switchTimerMode} timerMode={timerMode} formatTime={(s:any)=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`} timerTimeLeft={timerTimeLeft} toggleTimer={toggleTimer} isTimerActive={isTimerActive} resetTimer={resetTimer} handleAdjustTimer={handleAdjustTimer} />}
        {activeTab === 'friends' && <FriendsView user={user} friends={friends} challenges={challenges} onCreateChallenge={() => setIsChallengeModalOpen(true)} onDeleteChallenge={(id) => setChallengeToDelete(id)} />}
        {activeTab === 'assistant' && <AIAssistantView user={user} tasks={tasks} quests={mainQuests} friends={friends} challenges={challenges} onAddTask={handleAiCreateTask} onAddQuest={handleAiCreateQuest} onAddChallenge={handleAiCreateChallenge} messages={aiMessages} setMessages={setAiMessages} />}
      </main>

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

      {pendingQuestBonus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-surface border-2 border-primary/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(0,225,255,0.2)] animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20"><Trophy size={40} className="text-primary animate-bounce" /></div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">Quest Finalized?</h2>
              <p className="text-secondary text-sm font-medium mb-8 leading-relaxed">Strategic objective <span className="text-white font-bold">"{pendingQuestBonus.questTitle}"</span> appears fully neutralized. Deploy final completion rewards?</p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleConfirmQuestBonus} className="w-full bg-primary hover:bg-cyan-400 text-background font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"><Sparkles size={18} /> Confirm Completion</button>
                 <button onClick={() => setPendingQuestBonus(null)} className="w-full bg-surface border border-secondary/30 text-secondary hover:text-white font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all">Not Yet</button>
              </div>
           </div>
        </div>
      )}
      
      <DeleteConfirmModal 
       isOpen={!!questToDelete} 
       onClose={() => setQuestToDelete(null)}
       onConfirm={() => {
           if (questToDelete) {
               setMainQuests(p => p.filter(q => q.id !== questToDelete));
               setQuestToDelete(null);
           }
       }}
       title="Delete Quest?"
       description="Are you sure you want to delete this quest? This action cannot be undone."
      />

      <DeleteConfirmModal 
       isOpen={!!challengeToDelete} 
       onClose={() => setChallengeToDelete(null)}
       onConfirm={() => {
           if (challengeToDelete) {
               setChallenges(p => p.filter(c => c.id !== challengeToDelete));
               setChallengeToDelete(null);
           }
       }}
       title="Abort Contract?"
       description="Are you sure you want to cancel this challenge? All progress will be lost."
      />

      <CreateTaskModal 
        isOpen={isModalOpen || questTaskConfig.isOpen} 
        onClose={()=>{setIsModalOpen(false); setQuestTaskConfig({isOpen:false});}} 
        isQuestTask={questTaskConfig.isOpen}
        onSubmit={(d)=>{ 
            if (questTaskConfig.isOpen) {
                setMainQuests(qs => {
                    const q = qs.find(x => x.id === questTaskConfig.questId);
                    const c = q?.categories.find(x => x.id === questTaskConfig.categoryId);
                    if (!q || !c) return qs;

                    if (questTaskConfig.editingTask) {
                        return qs.map(mq => mq.id === questTaskConfig.questId ? { ...mq, categories: mq.categories.map(cat => cat.id === questTaskConfig.categoryId ? { ...cat, tasks: cat.tasks.map(t => t.task_id === questTaskConfig.editingTask?.task_id ? { ...t, name: d.title, difficulty: d.difficulty, skillCategory: d.skillCategory, description: d.description } : t) } : cat) } : mq);
                    } else {
                        if (isCategoryComplete(c)) applyGlobalXPChange(-20, `sec-add-revoke-${c.id}`, { [`section-bonus-${c.id}`]: -20 });
                        if (isQuestComplete(q)) {
                            const bonus = getQuestBonusAmount(q.categories.length);
                            applyGlobalXPChange(-bonus, `quest-add-revoke-${q.id}`, { [`quest-bonus-${q.id}`]: -bonus });
                        }
                        return qs.map(mq => mq.id === questTaskConfig.questId ? { ...mq, categories: mq.categories.map(cat => cat.id === questTaskConfig.categoryId ? { ...cat, tasks: [...cat.tasks, { task_id: crypto.randomUUID(), name: d.title, status: 'pending', difficulty: d.difficulty, skillCategory: d.skillCategory, description: d.description }] } : cat) } : mq);
                    }
                });
                setQuestTaskConfig({isOpen:false});
            } else {
                if(editingTask) setTasks(p=>p.map(t=>t.id===editingTask.id?{...t,...d}:t)); 
                else setTasks(p=>[{id:crypto.randomUUID(),...d,completed:false,streak:0,lastCompletedDate:null,createdAt:new Date().toISOString()},...p]); 
                setIsModalOpen(false); 
            }
        }} 
        editingTask={questTaskConfig.editingTask ? { id: questTaskConfig.editingTask.task_id, title: questTaskConfig.editingTask.name, description: questTaskConfig.editingTask.description || '', difficulty: questTaskConfig.editingTask.difficulty, skillCategory: questTaskConfig.editingTask.skillCategory, isHabit: false, completed: false, streak: 0, lastCompletedDate: null, createdAt: '' } : editingTask} 
        templates={user.templates} onSaveTemplate={(data)=>setUser(p=>({...p,templates:[...p.templates,{id:crypto.randomUUID(),...data}]}))} onDeleteTemplate={(id)=>setUser(p=>({...p,templates:p.templates.filter(t=>t.id!==id)}))} 
      />

      <SimpleInputModal 
        isOpen={textModalConfig.isOpen} onClose={()=>setTextModalConfig({isOpen:false,type:null})} 
        title={textModalConfig.type === 'edit-quest' ? 'Modify Quest Identifier' : textModalConfig.type === 'edit-category' ? 'Modify Section Title' : `Deploy New ${textModalConfig.type === 'category' ? 'Section' : 'Main Quest'}`} 
        placeholder="Enter identifier..." initialValue={textModalConfig.initialValue}
        onSubmit={(v)=>{ 
            if(textModalConfig.type==='quest') {
                const newId = crypto.randomUUID();
                setMainQuests(p=>[{id: newId, title:v, categories:[]},...p]); 
                setExpandedNodes(prev => new Set(prev).add(newId));
            } else if (textModalConfig.type === 'edit-quest') {
                setMainQuests(p => p.map(q => q.id === textModalConfig.parentId ? { ...q, title: v } : q));
            } else if (textModalConfig.type === 'edit-category') {
                setMainQuests(p => p.map(q => q.id === textModalConfig.parentId ? { ...q, categories: q.categories.map(c => c.id === textModalConfig.categoryId ? { ...c, title: v } : c) } : q));
            } else {
                setMainQuests(p=>p.map(mq=>{
                    if (mq.id===textModalConfig.parentId) {
                        if (isQuestComplete(mq)) {
                            const bonus = getQuestBonusAmount(mq.categories.length);
                            applyGlobalXPChange(-bonus, `quest-cat-revoke-${mq.id}`, { [`quest-bonus-${mq.id}`]: -bonus });
                        }
                        return {...mq, categories:[...mq.categories,{id:crypto.randomUUID(),title:v,tasks:[]}]};
                    }
                    return mq;
                })); 
            }
        }} 
      />
      
      <CreateChallengeModal 
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        friends={friends}
        onSubmit={handleManualCreateChallenge}
      />

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      
      {showLevelUp && <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-3xl animate-in zoom-in-95 duration-700"><Trophy size={160} className="text-primary animate-bounce shadow-primary/50" /><h2 className="text-8xl font-black text-primary mt-12 mb-4 tracking-tighter uppercase italic drop-shadow-[0_0_30px_rgba(0,225,255,0.6)]">Level Up</h2><p className="text-3xl text-white font-black uppercase tracking-widest">Protocol Rank {showLevelUp.level} Authenticated</p></div>}
    </div>
  );
};

export default App;
