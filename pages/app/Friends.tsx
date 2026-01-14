import React, { useState } from 'react';
import { UserProfile, Friend, FriendChallenge } from '../../types';
import { Zap, Users, Clock, Plus, Bell } from 'lucide-react';
import { calculateChallengeXP } from '../../utils/gamification';

interface FriendsViewProps {
  user: UserProfile;
  friends: Friend[];
  challenges: FriendChallenge[];
  onCreateChallenge: () => void;
  onDeleteChallenge: (id: string) => void;
  onToggleChallengeTask: (challengeId: string, categoryId: string, taskId: string) => void;
}

const FriendsView: React.FC<FriendsViewProps> = ({ user, friends, challenges, onCreateChallenge, onDeleteChallenge, onToggleChallengeTask }) => {
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

                {/* Participant Avatars */}
                <div className="absolute right-6 top-6 flex items-center -space-x-2">
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

