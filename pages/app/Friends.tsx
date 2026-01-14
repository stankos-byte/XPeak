import React, { useState } from 'react';
import { UserProfile, Friend, FriendChallenge } from '../../types';
import { Zap, Users, Clock, Plus, Bell, ChevronDown, ChevronUp, Edit2, Trash2, Check } from 'lucide-react';
import { calculateChallengeXP } from '../../utils/gamification';

interface FriendsViewProps {
  user: UserProfile;
  friends: Friend[];
  challenges: FriendChallenge[];
  onCreateChallenge: () => void;
  onEditChallenge: (challenge: FriendChallenge) => void;
  onDeleteChallenge: (id: string) => void;
  onToggleChallengeTask: (challengeId: string, categoryId: string, taskId: string) => void;
}

const FriendsView: React.FC<FriendsViewProps> = ({ user, friends, challenges, onCreateChallenge, onEditChallenge, onDeleteChallenge, onToggleChallengeTask }) => {
  const [expandedChallenges, setExpandedChallenges] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleChallenge = (challengeId: string) => {
    setExpandedChallenges(prev => ({
      ...prev,
      [challengeId]: !prev[challengeId]
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 uppercase tracking-tighter italic">
          GLOBAL NETWORK
        </h1>
        <p className="text-gray-400">Manage alliances and competitive contracts.</p>
      </header>

      {/* Main Layout: Challenges on left, Operatives on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Challenges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Contract Button */}
          <div 
            onClick={onCreateChallenge}
            className="bg-[#1a1f2e] border-2 border-dashed border-gray-700 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-gray-600 transition-all group"
          >
            <div className="w-16 h-16 rounded-full border-2 border-gray-600 flex items-center justify-center mb-6 group-hover:border-primary transition-colors">
              <Plus size={32} className="text-gray-500 group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 italic uppercase tracking-tight">
              CREATE CONTRACT
            </h3>
            <p className="text-gray-400 text-sm">Set terms, wager XP, and prove your superiority.</p>
          </div>

          {/* Challenge Cards */}
          {challenges.map((challenge) => {
            const partners = friends.filter(f => challenge.partnerIds.includes(f.id));
            const isCoop = challenge.mode === 'coop';
            
            const totalTasks = challenge.categories.reduce((sum, cat) => sum + cat.tasks.length, 0);
            
            let myCompletedTasks = 0;
            let partnerCompletedTasks = 0;
            
            if (isCoop) {
              const completedTasks = challenge.categories.reduce((sum, cat) => 
                sum + cat.tasks.filter(t => t.status === 'completed').length, 0
              );
              myCompletedTasks = completedTasks;
            } else {
              myCompletedTasks = challenge.categories.reduce((sum, cat) => 
                sum + cat.tasks.filter(t => t.myStatus === 'completed').length, 0
              );
              partnerCompletedTasks = challenge.categories.reduce((sum, cat) => 
                sum + cat.tasks.filter(t => t.opponentStatus === 'completed').length, 0
              );
            }
            
            const myPercent = totalTasks > 0 ? Math.round((myCompletedTasks / totalTasks) * 100) : 0;
            const partnerPercent = totalTasks > 0 ? Math.round((partnerCompletedTasks / totalTasks) * 100) : 0;
            const challengeXP = calculateChallengeXP(challenge);

            return (
              <div key={challenge.id} className="bg-[#1e2738] border border-gray-700 rounded-2xl p-6 relative">
                {/* Icon */}
                <div className="absolute left-6 top-6">
                  {isCoop ? (
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Users size={24} className="text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Zap size={24} className="text-purple-400" />
                    </div>
                  )}
                </div>

                {/* Participant Avatars and Action Buttons */}
                <div className="absolute right-6 top-6 flex items-center gap-2">
                  {/* Action Buttons */}
                  <button
                    onClick={() => onEditChallenge(challenge)}
                    className="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-blue-500/20 border border-gray-600 hover:border-blue-500 flex items-center justify-center transition-all group"
                    title="Edit Challenge"
                  >
                    <Edit2 size={14} className="text-gray-400 group-hover:text-blue-400" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete challenge "${challenge.title}"?`)) {
                        onDeleteChallenge(challenge.id);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-red-500/20 border border-gray-600 hover:border-red-500 flex items-center justify-center transition-all group"
                    title="Delete Challenge"
                  >
                    <Trash2 size={14} className="text-gray-400 group-hover:text-red-400" />
                  </button>
                  
                  {/* Partner Avatars */}
                  <div className="flex items-center -space-x-2 ml-2">
                    {partners.slice(0, 3).map((partner, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#1e2738]"
                        style={{ backgroundColor: partner.color }}
                      >
                        {partner.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="mt-16">
                  <h3 className="text-xl font-black text-white uppercase mb-2">
                    {challenge.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm mb-6">
                    <span className="text-yellow-400 font-bold">
                      {isCoop ? 'Reward:' : 'Wager:'} {challengeXP} XP
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{isCoop ? 'Shared Goal' : `Ends in ${challenge.timeLeft || '4h'}`}</span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    {isCoop ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Team Objective
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
                      {challenge.categories.map((category) => {
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
                                  {category.tasks.filter(t => 
                                    isCoop ? t.status === 'completed' : t.myStatus === 'completed'
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
                                {category.tasks.map((task) => {
                                  const isCompleted = isCoop 
                                    ? task.status === 'completed'
                                    : task.myStatus === 'completed';
                                  const opponentCompleted = !isCoop && task.opponentStatus === 'completed';
                                  
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
          <div className="bg-[#1e2738] border border-gray-700 rounded-2xl p-6 sticky top-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                OPERATIVES
              </h2>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <Users size={18} className="text-gray-400" />
                </button>
                <button className="w-9 h-9 rounded-full bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-colors relative">
                  <Bell size={18} className="text-gray-400" />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </button>
              </div>
            </div>

            {/* Operatives List */}
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white"
                        style={{ backgroundColor: friend.color }}
                      >
                        {friend.name.charAt(0)}
                      </div>
                      <div 
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1e2738] ${
                          friend.status === 'online' ? 'bg-emerald-500' : 
                          friend.status === 'busy' ? 'bg-red-500' : 
                          'bg-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm group-hover:text-primary transition-colors">
                        {friend.name}
                      </h4>
                      <p className="text-gray-400 text-xs">
                        {friend.xp} XP • {friend.status === 'online' ? 'Online' : friend.status === 'busy' ? 'In Contract' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-black text-gray-500 uppercase">
                    LVL {friend.level}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsView;

