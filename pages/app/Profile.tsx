import React, { useState } from 'react';
import { UserProfile, ProfileLayout, WidgetId } from '../../types';
import { User, LayoutGrid, Sparkles, Settings } from 'lucide-react';
import { IdentityWidget, SkillMatrixWidget, EvolutionWidget, TasksWidget, CalendarWidget, FriendsWidget } from '../../components/widgets/ProfileWidgets';

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
  onOpenSettings: () => void;
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
  onUpdateLayout,
  onOpenSettings
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
      case 'tasks': return <TasksWidget key={id} user={user} handleAddGoal={handleAddGoal} handleToggleGoal={handleToggleGoal} handleDeleteGoal={handleDeleteGoal} {...props} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20 relative">
      {/* Profile Header with Settings and Customize Button */}
      <div className="flex items-center justify-between">
        {/* Profile Section - Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={onOpenSettings}
            className="relative group"
          >
            <div className="w-20 h-20 rounded-full bg-surface border-2 border-primary/40 flex items-center justify-center text-primary group-hover:border-primary transition-all">
              <User size={36} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background group-hover:scale-110 transition-transform">
              <Settings size={16} className="text-background" />
            </div>
          </button>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">{user.name}</h1>
            <p className="text-primary text-sm font-bold uppercase tracking-wider">Performance Level {user.level}</p>
          </div>
        </div>

        {/* Profile Section - Mobile */}
        <div className="md:hidden flex items-center gap-4">
          <button 
            onClick={onOpenSettings}
            className="relative"
          >
            <div className="w-16 h-16 rounded-full bg-surface border-2 border-primary/40 flex items-center justify-center text-primary">
              <User size={28} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
              <Settings size={13} className="text-background" />
            </div>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">{user.name}</h1>
            <p className="text-primary text-xs font-bold uppercase tracking-wider">Performance Level {user.level}</p>
          </div>
        </div>

        {/* Customize Button */}
        <button onClick={() => setIsCustomizing(!isCustomizing)} className={`p-4 rounded-xl border transition-all ${isCustomizing ? 'bg-primary border-primary text-background shadow-[0_0_25px_rgba(0,225,255,0.5)]' : 'bg-surface border-secondary/20 text-secondary hover:text-primary'}`}>
          <LayoutGrid size={28} strokeWidth={isCustomizing ? 3 : 2} />
        </button>
      </div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-secondary text-xs font-black uppercase tracking-widest flex items-center gap-2">Performance Metrics</h3>
          <div className="flex items-center gap-1.5 text-primary">
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">Total XP: {Math.floor(user.totalXP)}</span>
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

