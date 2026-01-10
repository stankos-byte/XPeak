import React, { useState } from 'react';
import { UserProfile, Friend, FriendChallenge } from '../../types';
import { Swords, Users, MessageSquare, Clock, Trash2, Plus, UserPlus, ShieldAlert, Search } from 'lucide-react';

interface FriendsViewProps {
  user: UserProfile;
  friends: Friend[];
  challenges: FriendChallenge[];
  onCreateChallenge: () => void;
  onDeleteChallenge: (id: string) => void;
}

const FriendsView: React.FC<FriendsViewProps> = ({ user, friends, challenges, onCreateChallenge, onDeleteChallenge }) => {
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

export default FriendsView;

