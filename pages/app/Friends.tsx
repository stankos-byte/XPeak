import React, { useState } from 'react';
import { UserProfile, Friend, FriendChallenge } from '../../types';
import { Swords, Users, MessageSquare, Clock, Trash2, Plus, UserPlus, ShieldAlert, Search, Trophy, CheckCircle2, Circle } from 'lucide-react';
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
             const partner = friends.find(f => f.id === challenge.partnerId);
             const isCoop = challenge.mode === 'coop';
             
             // Calculate progress based on completed tasks
             const totalTasks = challenge.categories.reduce((sum, cat) => sum + cat.tasks.length, 0);
             
             let myCompletedTasks = 0;
             let partnerCompletedTasks = 0;
             
             if (isCoop) {
               // In co-op, count completed tasks (status === 'completed')
               const completedTasks = challenge.categories.reduce((sum, cat) => 
                 sum + cat.tasks.filter(t => t.status === 'completed').length, 0
               );
               myCompletedTasks = completedTasks;
               partnerCompletedTasks = completedTasks;
             } else {
               // In competitive, count separately
               myCompletedTasks = challenge.categories.reduce((sum, cat) => 
                 sum + cat.tasks.filter(t => t.myStatus === 'completed').length, 0
               );
               partnerCompletedTasks = challenge.categories.reduce((sum, cat) => 
                 sum + cat.tasks.filter(t => t.opponentStatus === 'completed').length, 0
               );
             }
             
             const myPercent = totalTasks > 0 ? (myCompletedTasks / totalTasks) * 100 : 0;
             const partnerPercent = totalTasks > 0 ? (partnerCompletedTasks / totalTasks) * 100 : 0;
             const isWinning = myCompletedTasks > partnerCompletedTasks;
             
             // Calculate dynamic XP
             const challengeXP = calculateChallengeXP(challenge);
             const isCompleted = !!challenge.completedBy;
             const iWon = challenge.completedBy === user.name || challenge.completedBy === 'Protocol-01';
             const partnerWon = challenge.completedBy === partner?.name;

             return (
               <div key={challenge.id} className="bg-surface border border-secondary/20 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/40 transition-all">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           {isCoop ? (
                             <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Co-op Mission</span>
                           ) : (
                             <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">PvP Contract</span>
                           )}
                           <span className="text-secondary text-[10px] font-bold flex items-center gap-1"><Clock size={10} /> {challenge.timeLeft || 'Ongoing'}</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter">{challenge.title}</h3>
                     </div>
                     <div className="flex items-start gap-3">
                        <div className="text-right">
                            {isCompleted ? (
                              <div className="flex flex-col items-end">
                                <div className={`text-xl md:text-2xl font-black ${isCoop || iWon ? 'text-primary' : 'text-red-400'} drop-shadow-[0_0_10px_rgba(0,225,255,0.4)] flex items-center gap-2`}>
                                  {isCoop || iWon ? <Trophy size={24} /> : <CheckCircle2 size={24} />}
                                  {isCoop || iWon ? `+${challengeXP}` : '0'} XP
                                </div>
                                <div className="text-[9px] text-secondary font-black uppercase tracking-widest">
                                  {isCoop ? 'Completed!' : (iWon ? 'Victory!' : 'Defeated')}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-xl md:text-2xl font-black text-primary drop-shadow-[0_0_10px_rgba(0,225,255,0.4)]">{challengeXP} XP</div>
                                <div className="text-[9px] text-secondary font-black uppercase tracking-widest">
                                  {isCoop ? 'Team Reward' : 'Winner Takes All'}
                                </div>
                              </>
                            )}
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
                  
                  <div className="space-y-4 relative z-10">
                     {/* Overall Progress */}
                     <div className="bg-background/40 p-4 rounded-xl border border-secondary/10 space-y-4">
                        {isCoop ? (
                           // Co-op: Show unified progress
                           <div>
                              <div className="flex justify-between items-end mb-1">
                                 <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Team Progress</span>
                                 <span className="text-xs font-bold text-white">{myCompletedTasks} / {totalTasks} Tasks</span>
                              </div>
                              <div className="h-2 bg-background rounded-full overflow-hidden border border-secondary/20">
                                 <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${myPercent}%` }}></div>
                              </div>
                           </div>
                        ) : (
                           // Competitive: Show separate progress bars
                           <>
                              {/* My Progress */}
                              <div>
                                 <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs font-black text-primary uppercase tracking-wider">You (Protocol-01)</span>
                                    <span className="text-xs font-bold text-white">{myCompletedTasks} / {totalTasks} Tasks</span>
                                 </div>
                                 <div className="h-2 bg-background rounded-full overflow-hidden border border-secondary/20">
                                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${myPercent}%` }}></div>
                                 </div>
                              </div>

                              {/* Opponent Progress */}
                              {partner && (
                                 <div>
                                    <div className="flex justify-between items-end mb-1">
                                       <span className={`text-xs font-black uppercase tracking-wider ${isWinning ? 'text-secondary' : 'text-red-400'}`}>{partner.name}</span>
                                       <span className="text-xs font-bold text-gray-400">{partnerCompletedTasks} / {totalTasks} Tasks</span>
                                    </div>
                                    <div className="h-2 bg-background rounded-full overflow-hidden border border-secondary/20">
                                       <div className={`h-full transition-all duration-1000 ${isWinning ? 'bg-secondary' : 'bg-red-500'}`} style={{ width: `${partnerPercent}%` }}></div>
                                    </div>
                                 </div>
                              )}
                           </>
                        )}
                     </div>

                     {/* Quest Sections */}
                     <div className="space-y-3">
                        {challenge.categories.map((category) => {
                           let myCatCompleted, partnerCatCompleted;
                           
                           if (isCoop) {
                              const completedTasks = category.tasks.filter(t => t.status === 'completed').length;
                              myCatCompleted = completedTasks;
                              partnerCatCompleted = completedTasks;
                           } else {
                              myCatCompleted = category.tasks.filter(t => t.myStatus === 'completed').length;
                              partnerCatCompleted = category.tasks.filter(t => t.opponentStatus === 'completed').length;
                           }
                           
                           return (
                              <div key={category.id} className="bg-background/60 border border-secondary/10 rounded-lg p-3">
                                 <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-black text-primary uppercase tracking-wider">{category.title}</h4>
                                    {isCoop ? (
                                       <div className="flex items-center gap-2 text-xs font-bold">
                                          <span className="text-emerald-400">{myCatCompleted}/{category.tasks.length}</span>
                                       </div>
                                    ) : (
                                       <div className="flex items-center gap-2 text-xs font-bold">
                                          <span className="text-primary">{myCatCompleted}/{category.tasks.length}</span>
                                          <span className="text-secondary">vs</span>
                                          <span className={partnerCatCompleted > myCatCompleted ? 'text-red-400' : 'text-secondary'}>{partnerCatCompleted}/{category.tasks.length}</span>
                                       </div>
                                    )}
                                 </div>
                                 
                                 <div className="space-y-2">
                                    {category.tasks.map((task) => (
                                       <div 
                                          key={task.task_id} 
                                          className={`bg-surface/50 border rounded-lg p-3 flex items-start gap-3 transition-all ${
                                             isCompleted 
                                                ? 'border-secondary/10 opacity-60' 
                                                : 'border-secondary/10 hover:border-primary/30 hover:bg-surface'
                                          }`}
                                       >
                                          {/* Checkbox Button */}
                                          <button
                                             onClick={() => !isCompleted && onToggleChallengeTask(challenge.id, category.id, task.task_id)}
                                             disabled={isCompleted}
                                             className={`flex-shrink-0 mt-0.5 transition-colors focus:outline-none ${
                                                (isCoop ? task.status === 'completed' : task.myStatus === 'completed')
                                                   ? 'text-emerald-500 hover:text-red-400' 
                                                   : 'text-secondary hover:text-primary'
                                             } ${isCompleted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                             title={(isCoop ? task.status === 'completed' : task.myStatus === 'completed') ? "Undo completion" : "Complete task"}
                                          >
                                             {(isCoop ? task.status === 'completed' : task.myStatus === 'completed') ? (
                                                <CheckCircle2 size={20} />
                                             ) : (
                                                <Circle size={20} />
                                             )}
                                          </button>
                                             
                                          <div className="flex-1">
                                             <div className={`text-sm font-medium ${(isCoop ? task.status === 'completed' : task.myStatus === 'completed') ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                                                {task.name}
                                             </div>
                                             <div className="flex gap-1 mt-1.5">
                                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary">{task.difficulty}</span>
                                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">{task.skillCategory}</span>
                                             </div>
                                          </div>
                                          
                                          {/* Partner/Opponent status indicator */}
                                          {!isCoop && (
                                             <div className="flex items-center ml-2">
                                                <div 
                                                   className={`w-2.5 h-2.5 rounded-full ${task.opponentStatus === 'completed' ? 'bg-red-400' : 'bg-secondary/30'}`} 
                                                   title={task.opponentStatus === 'completed' ? 'Opponent completed' : 'Opponent not completed'}
                                                ></div>
                                             </div>
                                          )}
                                          {isCoop && task.status === 'completed' && task.completedBy && (
                                             <div className="flex items-center ml-2">
                                                <span className="text-[9px] text-secondary">
                                                   by {task.completedBy === user.name ? 'you' : partner?.name}
                                                </span>
                                             </div>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
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

