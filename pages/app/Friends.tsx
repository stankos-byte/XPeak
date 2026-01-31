import React, { useState } from 'react';
import { UserProfile, Friend, FriendChallenge, ChallengeQuestCategory, ChallengeQuestTask, SkillCategory, SkillProgress } from '../../types';
import { Zap, Users, Plus, Bell, ChevronDown, ChevronUp, Pencil, Trash2, Check, X } from 'lucide-react';
import { calculateChallengeXP } from '../../utils/gamification';
import { SKILL_COLORS } from '../../constants';
import { DEBUG_FLAGS } from '../../config/debugFlags';

interface FriendsViewProps {
  user: UserProfile;
  friends: Friend[];
  challenges: FriendChallenge[];
  onCreateChallenge: () => void;
  onEditChallenge: (challenge: FriendChallenge) => void;
  onDeleteChallenge: (id: string) => void;
  onToggleChallengeTask: (challengeId: string, categoryId: string, taskId: string) => void;
}

// TODO: Replace with actual user ID from auth context
const CURRENT_USER_ID = 'currentUser';

// Helper to check if a task is completed by a specific user
const isTaskCompletedByUser = (task: ChallengeQuestTask, userId: string): boolean => {
  return task.statusByUser[userId] === 'completed';
};

// Helper to get the opponent ID(s) from a challenge (everyone except current user)
const getOpponentIds = (challenge: FriendChallenge, currentUserId: string): string[] => {
  return challenge.partnerIds.filter(id => id !== currentUserId);
};

const FriendsView: React.FC<FriendsViewProps> = ({ friends, challenges, onCreateChallenge, onEditChallenge, onDeleteChallenge, onToggleChallengeTask }) => {
  const [expandedChallenges, setExpandedChallenges] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const toggleChallenge = (challengeId: string) => {
    setExpandedChallenges((prev: Record<string, boolean>) => ({
      ...prev,
      [challengeId]: !prev[challengeId]
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev: Record<string, boolean>) => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter italic">
            Network
          </h1>
          <p className="text-secondary font-medium tracking-wide">Manage connections and competitive challenges.</p>
        </div>
        <button 
          onClick={onCreateChallenge}
          className="flex items-center gap-2 bg-primary hover:bg-cyan-400 text-background px-6 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 w-full md:w-auto justify-center"
        >
          <Plus size={20} strokeWidth={3} />
          Create Challenge
        </button>
      </header>

      {/* Main Layout: Challenges on left, Operatives on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Challenges */}
        <div className="lg:col-span-2 space-y-6">

          {/* Challenge Cards */}
          {challenges.map((challenge: FriendChallenge) => {
            const partners = friends.filter((f: Friend) => challenge.partnerIds.includes(f.id));
            const isCoop = challenge.mode === 'coop';
            
            const totalTasks = challenge.categories.reduce((sum: number, cat: ChallengeQuestCategory) => sum + cat.tasks.length, 0);
            const opponentIds = getOpponentIds(challenge, CURRENT_USER_ID);
            const primaryOpponentId = opponentIds[0]; // For display purposes, use first opponent
            
            // Count tasks completed by current user
            const myCompletedTasks = challenge.categories.reduce((sum: number, cat: ChallengeQuestCategory) => 
              sum + cat.tasks.filter((t: ChallengeQuestTask) => isTaskCompletedByUser(t, CURRENT_USER_ID)).length, 0
            );
            
            // For competitive mode, count opponent's completed tasks
            const partnerCompletedTasks = !isCoop && primaryOpponentId
              ? challenge.categories.reduce((sum: number, cat: ChallengeQuestCategory) => 
                  sum + cat.tasks.filter((t: ChallengeQuestTask) => isTaskCompletedByUser(t, primaryOpponentId)).length, 0
                )
              : 0;
            
            const myPercent = totalTasks > 0 ? Math.round((myCompletedTasks / totalTasks) * 100) : 0;
            const partnerPercent = totalTasks > 0 ? Math.round((partnerCompletedTasks / totalTasks) * 100) : 0;
            const challengeXP = calculateChallengeXP(challenge);

            return (
              <div key={challenge.id} className="bg-[#1e2738] border border-gray-700 rounded-2xl p-6 relative">
                {/* Participant Avatars and Mode Text on Left */}
                <div className="absolute left-6 top-6 flex flex-col items-start gap-1.5">
                  {/* Partner Avatars */}
                  <div className="flex items-center -space-x-2">
                    {partners.slice(0, 3).map((partner: Friend, idx: number) => (
                      <div
                        key={idx}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#1e2738]"
                        style={{ backgroundColor: partner.color }}
                      >
                        {partner.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  {/* Mode Text */}
                  <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isCoop 
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                      : 'text-red-400 bg-red-500/10 border border-red-500/20'
                  }`}>
                    {isCoop ? 'COOP' : 'COMPETITIVE'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="absolute right-6 top-6 flex items-center gap-2">
                  <button
                    onClick={() => onEditChallenge(challenge)}
                    className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Edit Challenge"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete challenge "${challenge.title}"?`)) {
                        onDeleteChallenge(challenge.id);
                      }
                    }}
                    className="p-1.5 text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete Challenge"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="mt-20">
                  <h3 className="text-xl font-black text-white uppercase mb-2">
                    {challenge.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm mb-6">
                    <span className="text-blue-400 font-bold">
                      {isCoop ? 'Reward:' : 'Wager:'} {challengeXP} XP
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    {isCoop ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Shared Objective
                          </span>
                          <span className="text-sm font-bold text-white">
                            {myCompletedTasks} / {totalTasks} TASKS
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#0f1419] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${myPercent}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Progress
                          </span>
                          <span className="text-sm font-bold text-white">
                            {myPercent}% / {partnerPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#0f1419] rounded-full overflow-hidden relative">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 absolute left-0"
                            style={{ width: `${myPercent}%` }}
                          />
                          <div 
                            className="h-full bg-red-500 transition-all duration-500 absolute right-0"
                            style={{ width: `${partnerPercent}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Expand/Collapse Toggle */}
                  <button
                    onClick={() => toggleChallenge(challenge.id)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors group"
                  >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-300">
                      {expandedChallenges[challenge.id] ? 'Hide Tasks' : 'Show Tasks'}
                    </span>
                    {expandedChallenges[challenge.id] ? (
                      <ChevronUp size={16} className="text-gray-400 group-hover:text-gray-300" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 group-hover:text-gray-300" />
                    )}
                  </button>

                  {/* Expanded Categories and Tasks */}
                  {expandedChallenges[challenge.id] && (
                    <div className="mt-4 space-y-3 border-t border-gray-700 pt-4">
                      {challenge.categories.map((category: ChallengeQuestCategory) => {
                        const categoryKey = `${challenge.id}-${category.id}`;
                        return (
                          <div key={category.id} className="space-y-2">
                            {/* Category Header */}
                            <button
                              onClick={() => toggleCategory(categoryKey)}
                              className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-gray-700/20 hover:bg-gray-700/30 transition-colors"
                            >
                              <span className="text-sm font-bold text-white uppercase">
                                {category.title}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  {category.tasks.filter((t: ChallengeQuestTask) => 
                                    isTaskCompletedByUser(t, CURRENT_USER_ID)
                                  ).length} / {category.tasks.length}
                                </span>
                                {expandedCategories[categoryKey] ? (
                                  <ChevronUp size={16} className="text-gray-400" />
                                ) : (
                                  <ChevronDown size={16} className="text-gray-400" />
                                )}
                              </div>
                            </button>

                            {/* Tasks List */}
                            {expandedCategories[categoryKey] && (
                              <div className="space-y-2 pl-3">
                                {category.tasks.map((task: ChallengeQuestTask) => {
                                  const opponentIds = getOpponentIds(challenge, CURRENT_USER_ID);
                                  const primaryOpponentId = opponentIds[0];
                                  const isCompleted = isTaskCompletedByUser(task, CURRENT_USER_ID);
                                  const opponentCompleted = !isCoop && primaryOpponentId && isTaskCompletedByUser(task, primaryOpponentId);
                                  
                                  return (
                                    <div
                                      key={task.task_id}
                                      className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[#0f1419] hover:bg-[#1a1f2e] transition-colors group"
                                    >
                                      {/* Checkbox */}
                                      <button
                                        onClick={() => onToggleChallengeTask(challenge.id, category.id, task.task_id)}
                                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                          isCompleted
                                            ? isCoop
                                              ? 'bg-emerald-500 border-emerald-500'
                                              : 'bg-blue-500 border-blue-500'
                                            : 'border-gray-600 hover:border-gray-500'
                                        }`}
                                      >
                                        {isCompleted && <Check size={14} className="text-white" />}
                                      </button>
                                      
                                      {/* Task Name */}
                                      <span className={`flex-1 text-sm ${
                                        isCompleted ? 'text-gray-500 line-through' : 'text-gray-300'
                                      }`}>
                                        {task.name}
                                      </span>

                                      {/* Opponent Status (Competitive mode only) */}
                                      {!isCoop && (
                                        <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                          opponentCompleted
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-gray-700'
                                        }`}>
                                          {opponentCompleted && <Check size={14} className="text-white" />}
                                        </div>
                                      )}

                                      {/* Difficulty Badge */}
                                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded font-bold ${
                                        task.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                        task.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                        task.difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-400' :
                                        'bg-purple-500/20 text-purple-400'
                                      }`}>
                                        {task.difficulty}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column - Operatives */}
        <div className="lg:col-span-1">
          <div className="bg-[#1e2738] border border-gray-700 rounded-2xl p-6 sticky top-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-2 min-w-0 max-w-full">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight flex-shrink min-w-0 truncate">
                NETWORK
              </h2>
              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                <button 
                  onClick={() => setIsAddFriendOpen(true)}
                  className="w-9 h-9 rounded-full bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-colors flex-shrink-0"
                  title="Add Friend"
                >
                  <Users size={18} className="text-gray-400" />
                </button>
                <button 
                  onClick={() => setIsNotificationsOpen(true)}
                  className="w-9 h-9 rounded-full bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-colors relative flex-shrink-0"
                  title="Notifications"
                >
                  <Bell size={18} className="text-gray-400" />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </button>
              </div>
            </div>

            {/* Operatives List */}
            <div className="space-y-3">
              {friends.map((friend: Friend) => (
                <div 
                  key={friend.id} 
                  className="flex items-center justify-between group cursor-pointer"
                  onClick={() => setSelectedFriend(friend)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white cursor-pointer flex-shrink-0"
                      style={{ backgroundColor: friend.color }}
                    >
                      {friend.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-bold text-sm group-hover:text-primary transition-colors cursor-pointer truncate">
                        {friend.name}
                      </h4>
                    </div>
                  </div>
                  <div className="text-xs font-black text-gray-500 uppercase flex-shrink-0">
                    LVL {friend.level}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Friend Profile Modal */}
      {selectedFriend && (
        <FriendProfileModal
          friend={selectedFriend}
          isOpen={!!selectedFriend}
          onClose={() => setSelectedFriend(null)}
        />
      )}

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        existingFriends={friends}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

interface FriendProfileModalProps {
  friend: Friend;
  isOpen: boolean;
  onClose: () => void;
}

const FriendProfileModal: React.FC<FriendProfileModalProps> = ({ friend, isOpen, onClose }) => {
  if (!isOpen) return null;

  // For now, we'll create placeholder skills since Friend doesn't have skills
  // This can be updated when friend data includes skills
  // Filter out MISC (Default) as it's not a skill category
  const placeholderSkills: SkillProgress[] = Object.values(SkillCategory)
    .filter(category => category !== SkillCategory.MISC)
    .map(category => ({
      category,
      xp: 0,
      level: 1
    }));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#1e2738] border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white"
              style={{ backgroundColor: friend.color }}
            >
              {friend.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">{friend.name}</h2>
              <p className="text-sm text-gray-400">LVL {friend.level}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-secondary hover:text-primary transition-colors"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Level and XP */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0f1419] rounded-xl">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Level</span>
              <span className="text-2xl font-black text-white">{friend.level}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0f1419] rounded-xl">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total XP</span>
              <span className="text-2xl font-black text-blue-400">{friend.xp.toLocaleString()}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Skills</h3>
            <div className="space-y-1.5">
              {placeholderSkills.map((skill) => (
                <div key={skill.category} className="flex items-center justify-between p-2 bg-[#0f1419] rounded-lg">
                  <span 
                    className="text-xs font-bold uppercase"
                    style={{ color: SKILL_COLORS[skill.category] }}
                  >
                    {skill.category}
                  </span>
                  <span className="text-xs text-gray-400">LVL {skill.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingFriends: Friend[];
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ isOpen, onClose, existingFriends }) => {
  const [friendId, setFriendId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendId.trim()) return;
    // TODO: Implement add friend functionality
    if (DEBUG_FLAGS.social) console.log('Add friend:', friendId);
    onClose();
    setFriendId('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#1e2738] border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Add Friend</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
              Friend ID or Username
            </label>
            <input 
              type="text" 
              value={friendId}
              onChange={(e) => setFriendId(e.target.value)}
              className="w-full bg-[#0f1419] border border-gray-700 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-500 font-bold"
              placeholder="Enter friend ID or username"
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            disabled={!friendId.trim()}
            className="w-full bg-primary hover:bg-cyan-400 disabled:opacity-30 disabled:grayscale text-background font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            Send Friend Request
          </button>
        </form>
      </div>
    </div>
  );
};

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'friend_request' | 'challenge_invite' | 'challenge_update';
  message: string;
  timestamp: string;
  read: boolean;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  // TODO: Replace with actual notifications from state/context
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'friend_request',
      message: 'Cyber-Stalker sent you a friend request',
      timestamp: '2h ago',
      read: false
    },
    {
      id: '2',
      type: 'challenge_invite',
      message: 'Neon-Drifter invited you to a challenge',
      timestamp: '5h ago',
      read: false
    }
  ]);

  if (!isOpen) return null;

  const handleNotificationClick = (notification: Notification) => {
    // TODO: Implement notification action
    if (DEBUG_FLAGS.social) console.log('Notification clicked:', notification);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#1e2738] border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Notifications</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 font-bold">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 rounded-xl transition-colors ${
                    notification.read 
                      ? 'bg-[#0f1419] hover:bg-[#1a1f2e]' 
                      : 'bg-primary/10 border border-primary/20 hover:bg-primary/20'
                  }`}
                >
                  <p className="text-white font-bold text-sm mb-1">{notification.message}</p>
                  <p className="text-gray-400 text-xs">{notification.timestamp}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsView;

