
import React, { useState, useRef } from 'react';
import { Crown, Pencil, Save, TrendingUp, Mountain, CheckSquare, Square, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Activity, Calendar, Users, UserPlus, Trophy, Circle } from 'lucide-react';
import { UserProfile, Goal, SkillCategory } from '../types';
import SkillRadar from './SkillRadar';
import { getLevelProgress } from '../utils/gamification';

interface WidgetProps {
  isCustomizing: boolean;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  enabled: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

const WidgetControls: React.FC<WidgetProps> = ({ onToggle, onMoveUp, onMoveDown, enabled, isFirst, isLast }) => (
  <div className="absolute top-2 right-2 z-30 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
    <div className="flex bg-background/80 backdrop-blur-md border border-primary/30 rounded-lg overflow-hidden shadow-xl">
      <button 
        onClick={onMoveUp} 
        disabled={isFirst}
        className="p-2 hover:bg-primary/10 text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-r border-primary/20"
      >
        <ChevronUp size={16} strokeWidth={3} />
      </button>
      <button 
        onClick={onMoveDown} 
        disabled={isLast}
        className="p-2 hover:bg-primary/10 text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronDown size={16} strokeWidth={3} />
      </button>
    </div>
    <button 
      onClick={onToggle} 
      className={`p-2 rounded-lg shadow-lg transition-all ${enabled ? 'bg-primary text-background' : 'bg-surface border border-secondary/30 text-secondary'}`}
    >
      {enabled ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  </div>
);

export const IdentityWidget: React.FC<{ 
  user: UserProfile; 
  handleUpdateIdentity: (text: string) => void; 
} & WidgetProps> = ({ user, handleUpdateIdentity, isCustomizing, onToggle, onMoveUp, onMoveDown, enabled, isFirst, isLast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [temp, setTemp] = useState(user.identity);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  if (!enabled && !isCustomizing) return null;

  return (
    <section className={`bg-surface border p-6 rounded-2xl relative overflow-hidden shadow-xl group/identity transition-all duration-300 ${!enabled ? 'opacity-30 border-dashed grayscale scale-[0.98]' : 'border-secondary/20'}`}>
      {isCustomizing && (
        <WidgetControls onToggle={onToggle} onMoveUp={onMoveUp} onMoveDown={onMoveDown} enabled={enabled} isFirst={isFirst} isLast={isLast} isCustomizing={isCustomizing} />
      )}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Crown size={120} className="text-primary" /></div>
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2 text-primary">
          <Crown size={20} />
          <h3 className="font-black uppercase tracking-widest text-xs">Identity Core</h3>
        </div>
        {!isCustomizing && (
          <button 
            onClick={() => { if(isEditing) handleUpdateIdentity(temp); setIsEditing(!isEditing); setTimeout(() => inputRef.current?.focus(), 50); }}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-2 ${isEditing ? 'bg-primary text-background border-primary' : 'bg-background/50 border-secondary/20 text-secondary opacity-0 group-hover/identity:opacity-100'}`}
          >
            {isEditing ? <Save size={14} /> : <Pencil size={14} />}
          </button>
        )}
      </div>
      <div className="relative z-10">
        {isEditing ? (
          <textarea ref={inputRef} value={temp} onChange={(e) => setTemp(e.target.value)} className="w-full bg-background/30 border-secondary/20 rounded-xl p-3 text-xl font-bold text-gray-200 outline-none resize-none" rows={2} />
        ) : (
          <p className={`text-xl md:text-2xl font-bold tracking-tight ${user.identity ? 'text-gray-100' : 'text-secondary/40 italic'}`}>{user.identity || "Who are you striving to become?"}</p>
        )}
        <p className="text-[10px] text-secondary mt-2 uppercase tracking-widest font-black italic">Aspirational Directive</p>
      </div>
    </section>
  );
};

export const SkillMatrixWidget: React.FC<{ user: UserProfile } & WidgetProps> = ({ user, isCustomizing, onToggle, onMoveUp, onMoveDown, enabled, isFirst, isLast }) => {
  if (!enabled && !isCustomizing) return null;
  return (
    <section className={`relative transition-all duration-300 ${!enabled ? 'opacity-30 border-dashed grayscale scale-[0.98]' : ''} h-full`}>
      {isCustomizing && (
        <WidgetControls onToggle={onToggle} onMoveUp={onMoveUp} onMoveDown={onMoveDown} enabled={enabled} isFirst={isFirst} isLast={isLast} isCustomizing={isCustomizing} />
      )}
      <h3 className="text-secondary text-xs font-black mb-3 uppercase tracking-widest flex items-center gap-2"><Activity size={16} /> Skill Attributes</h3>
      <div className="bg-surface border border-secondary/20 rounded-xl p-4 shadow-lg h-64 overflow-hidden">
        <SkillRadar user={user} />
      </div>
    </section>
  );
};

export const EvolutionWidget: React.FC<{ user: UserProfile; flashKey: number } & WidgetProps> = ({ user, flashKey, isCustomizing, onToggle, onMoveUp, onMoveDown, enabled, isFirst, isLast }) => {
  if (!enabled && !isCustomizing) return null;
  return (
    <section className={`relative transition-all duration-300 ${!enabled ? 'opacity-30 border-dashed grayscale scale-[0.98]' : ''} h-full`}>
      {isCustomizing && (
        <WidgetControls onToggle={onToggle} onMoveUp={onMoveUp} onMoveDown={onMoveDown} enabled={enabled} isFirst={isFirst} isLast={isLast} isCustomizing={isCustomizing} />
      )}
      <h3 className="text-secondary text-xs font-black mb-3 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={16} /> Evolution</h3>
      <div className="bg-surface border border-secondary/20 rounded-xl p-5 shadow-lg h-64 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          {Object.values(SkillCategory)
            .filter(cat => cat !== SkillCategory.MISC)
            .map(cat => {
              const skill = user.skills[cat];
              const skillProgress = getLevelProgress(skill.xp, skill.level);
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1 font-bold uppercase tracking-wider">
                    <span className="text-gray-300">{cat}</span>
                    <span className="text-primary">Lvl {skill.level}</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden border border-secondary/10 relative">
                    <div className="h-full rounded-full bg-primary shadow-[0_0_5px_rgba(0,225,255,0.5)] transition-all duration-500" style={{ width: `${skillProgress.percentage}%` }}>
                      <div key={flashKey} className="absolute inset-0 bg-white opacity-0 animate-bar-flash pointer-events-none"></div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
};

export const CalendarWidget: React.FC<{ user: UserProfile } & WidgetProps> = ({ user, isCustomizing, onToggle, onMoveUp, onMoveDown, enabled, isFirst, isLast }) => {
  if (!enabled && !isCustomizing) return null;

  // Helper to get days in month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  
  const days = [];
  // Padding for start
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Calculate activity
  const activityMap = new Map<string, number>();
  user.history.forEach(h => {
     if (h.xpGained > 0) {
         const dateStr = new Date(h.date).toLocaleDateString(); // Local date string
         activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
     }
  });

  const getIntensity = (count: number) => {
      if (count === 0) return 'bg-surface border-secondary/10 text-secondary';
      if (count <= 2) return 'bg-primary/20 border-primary/30 text-primary shadow-[0_0_10px_rgba(0,225,255,0.1)]';
      if (count <= 5) return 'bg-primary/40 border-primary/50 text-white shadow-[0_0_10px_rgba(0,225,255,0.3)]';
      return 'bg-primary border-primary text-background font-black shadow-[0_0_15px_rgba(0,225,255,0.5)]';
  }

  return (
    <section className={`relative transition-all duration-300 ${!enabled ? 'opacity-30 border-dashed grayscale scale-[0.98]' : ''} h-full`}>
       {isCustomizing && (
        <WidgetControls onToggle={onToggle} onMoveUp={onMoveUp} onMoveDown={onMoveDown} enabled={enabled} isFirst={isFirst} isLast={isLast} isCustomizing={isCustomizing} />
      )}
      <h3 className="text-secondary text-xs font-black mb-3 uppercase tracking-widest flex items-center gap-2"><Calendar size={16} /> Activity Log</h3>
      <div className="bg-surface border border-secondary/20 rounded-xl p-4 shadow-xl">
         <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-bold uppercase tracking-wider">{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <div className="flex items-center gap-1.5 text-[8px] uppercase font-bold text-secondary">
               <span>Less</span>
               <div className="flex gap-0.5">
                  <div className="w-2 h-2 rounded bg-primary/20"></div>
                  <div className="w-2 h-2 rounded bg-primary/60"></div>
                  <div className="w-2 h-2 rounded bg-primary"></div>
               </div>
               <span>More</span>
            </div>
         </div>
         <div className="grid grid-cols-7 gap-1 mb-1">
            {['S','M','T','W','T','F','S'].map(d => (
                <div key={d} className="text-center text-[8px] font-black text-secondary">{d}</div>
            ))}
         </div>
         <div className="grid grid-cols-7 gap-1">
            {days.map((date, idx) => {
                if (!date) return <div key={idx} className="aspect-square"></div>;
                const count = activityMap.get(date.toLocaleDateString()) || 0;
                const isToday = date.toDateString() === today.toDateString();
                
                return (
                    <div key={idx} className={`aspect-square rounded border flex flex-col items-center justify-center relative group transition-all duration-300 ${getIntensity(count)} ${isToday ? 'ring-1 ring-white' : ''}`}>
                        <span className="text-[10px] font-bold">{date.getDate()}</span>
                        {count > 0 && <span className="absolute bottom-0.5 w-0.5 h-0.5 rounded-full bg-current"></span>}
                        {count > 0 && (
                            <div className="absolute bottom-full mb-1 bg-background border border-secondary/20 px-1.5 py-0.5 rounded text-[8px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 text-white font-bold">
                                {count} Tasks
                            </div>
                        )}
                    </div>
                );
            })}
         </div>
      </div>
    </section>
  );
}

export const ObjectivesWidget: React.FC<{ 
  user: UserProfile; 
  handleAddGoal: (t: string) => void; 
  handleToggleGoal: (id: string) => void; 
  handleDeleteGoal: (id: string) => void; 
} & WidgetProps> = ({ user, handleAddGoal, handleToggleGoal, handleDeleteGoal, isCustomizing, onToggle, onMoveUp, onMoveDown, enabled, isFirst, isLast }) => {
  const [val, setVal] = useState('');
  if (!enabled && !isCustomizing) return null;

  return (
    <section className={`relative transition-all duration-300 ${!enabled ? 'opacity-30 border-dashed grayscale scale-[0.98]' : ''}`}>
      {isCustomizing && (
        <WidgetControls onToggle={onToggle} onMoveUp={onMoveUp} onMoveDown={onMoveDown} enabled={enabled} isFirst={isFirst} isLast={isLast} isCustomizing={isCustomizing} />
      )}
      <h3 className="text-secondary text-xs font-black mb-3 uppercase tracking-widest flex items-center gap-2"><Mountain size={16} /> Major Objectives</h3>
      <div className="bg-surface border border-secondary/20 rounded-xl p-6 shadow-xl">
        {!isCustomizing && (
          <form onSubmit={(e) => { e.preventDefault(); handleAddGoal(val); setVal(''); }} className="flex gap-3 mb-6">
            <input type="text" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Add a major milestone..." className="flex-1 bg-background border border-secondary/30 rounded-lg p-3 text-white outline-none placeholder-secondary/50 font-bold" />
            <button type="submit" disabled={!val.trim()} className="bg-primary hover:bg-cyan-400 disabled:opacity-30 text-background px-4 rounded-lg font-black uppercase tracking-widest text-xs transition-colors">Add</button>
          </form>
        )}
        <div className="space-y-2">
          {user.goals.length === 0 && <p className="text-secondary text-center text-xs py-4 uppercase font-bold tracking-widest">No goals initialized.</p>}
          {user.goals.map((goal: Goal) => (
            <div key={goal.id} className="group flex items-center justify-between p-3 bg-background rounded-lg border border-secondary/10 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <button onClick={() => handleToggleGoal(goal.id)} className={`transition-colors ${goal.completed ? 'text-primary' : 'text-secondary hover:text-primary'}`}>
                  {goal.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
                <span className={`text-sm font-bold uppercase tracking-tight ${goal.completed ? 'line-through text-secondary' : 'text-gray-200'}`}>{goal.title}</span>
              </div>
              <button onClick={() => handleDeleteGoal(goal.id)} className="text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const FriendsWidget: React.FC<{ user: UserProfile } & WidgetProps> = ({ user, isCustomizing, onToggle, onMoveUp, onMoveDown, enabled, isFirst, isLast }) => {
  if (!enabled && !isCustomizing) return null;

  // Mock data for leaderboard
  const mockFriends = [
    { id: '1', name: 'Cyber-Stalker', level: user.level + 2, xp: user.totalXP + 350, online: true, color: 'bg-red-500', isMe: false },
    { id: '2', name: 'Neon-Drifter', level: Math.max(1, user.level - 1), xp: Math.max(0, user.totalXP - 120), online: false, color: 'bg-emerald-500', isMe: false },
    { id: '3', name: 'Null-Pointer', level: user.level, xp: user.totalXP + 50, online: true, color: 'bg-amber-500', isMe: false },
    { id: '4', name: 'Void-Walker', level: Math.max(1, user.level - 2), xp: Math.max(0, user.totalXP - 450), online: false, color: 'bg-purple-500', isMe: false },
  ];

  // Combine user and mock friends, then sort by XP
  const leaderboard = [
    ...mockFriends,
    { id: 'me', name: user.name, level: user.level, xp: user.totalXP, online: true, color: 'bg-primary', isMe: true }
  ].sort((a, b) => b.xp - a.xp);

  return (
    <section className={`relative transition-all duration-300 ${!enabled ? 'opacity-30 border-dashed grayscale scale-[0.98]' : ''} h-full flex flex-col`}>
      {isCustomizing && (
        <WidgetControls onToggle={onToggle} onMoveUp={onMoveUp} onMoveDown={onMoveDown} enabled={enabled} isFirst={isFirst} isLast={isLast} isCustomizing={isCustomizing} />
      )}
      <div className="flex items-center justify-between mb-3 flex-none">
        <h3 className="text-secondary text-xs font-black uppercase tracking-widest flex items-center gap-2"><Users size={16} /> Global Network</h3>
        {!isCustomizing && (
             <button className="text-secondary hover:text-primary transition-colors">
                <UserPlus size={16} />
             </button>
        )}
      </div>
      
      <div className="bg-surface border border-secondary/20 rounded-xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-0">
        <div className="p-3 bg-background/50 border-b border-secondary/10 grid grid-cols-12 gap-4 text-[10px] uppercase font-black text-secondary tracking-widest flex-none">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-7">Operative</div>
            <div className="col-span-4 text-right">Lvl / XP</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {leaderboard.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-secondary/5 last:border-0 hover:bg-white/5 transition-colors ${entry.isMe ? 'bg-primary/5' : ''}`}
                >
                    <div className="col-span-1 flex justify-center">
                        {index === 0 ? <Trophy size={16} className="text-amber-400" /> : 
                         index === 1 ? <Trophy size={16} className="text-gray-400" /> :
                         index === 2 ? <Trophy size={16} className="text-amber-700" /> :
                         <span className="text-secondary font-bold text-sm">{index + 1}</span>}
                    </div>
                    <div className="col-span-7 flex items-center gap-3">
                        <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-background ${entry.color}`}>
                                {entry.name.substring(0, 1)}
                            </div>
                            {entry.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface"></div>}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-sm font-bold leading-none ${entry.isMe ? 'text-primary' : 'text-gray-300'}`}>{entry.name}</span>
                            <span className="text-[10px] text-secondary font-medium mt-1">{entry.isMe ? 'Active Protocol' : entry.online ? 'Online' : 'Offline'}</span>
                        </div>
                    </div>
                    <div className="col-span-4 text-right">
                        <div className="text-sm font-black text-white">{entry.level}</div>
                        <div className="text-[10px] text-secondary font-medium">{Math.floor(entry.xp)} XP</div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};
