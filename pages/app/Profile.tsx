import React, { useState } from 'react';
import { UserProfile, ProfileLayout, WidgetId } from '../../types';
import { User, LayoutGrid, Sparkles } from 'lucide-react';
import { IdentityWidget, SkillMatrixWidget, EvolutionWidget, ObjectivesWidget, CalendarWidget, FriendsWidget } from '../../components/widgets/ProfileWidgets';

interface ProfileViewProps {
  user: UserProfile;
  handleUpdateIdentity: (text: string) => void;
  handleAddGoal: (title: string) => void;
  handleToggleGoal: (id: string) => void;
  handleDeleteGoal: (id: string) => void;
  levelProgress: { current: number; max: number; percentage: number };
  flashKey: number;
  layout: ProfileLayout;
  onUpdateLayout: (layout: ProfileLayout) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  handleUpdateIdentity, 
  handleAddGoal, 
  handleToggleGoal, 
  handleDeleteGoal, 
  levelProgress, 
  flashKey, 
  layout, 
  onUpdateLayout 
}) => {
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

export default ProfileView;

