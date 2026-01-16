import React from 'react';
import { FolderKanban, Timer, Users, BarChart3, LucideIcon } from 'lucide-react';

interface IconButton {
  icon: LucideIcon;
  label: string;
}

const iconButtons: IconButton[] = [
  { icon: FolderKanban, label: 'Skill Planning' },
  { icon: Timer, label: 'Focus Tools' },
  { icon: Users, label: 'Group Work' },
  { icon: BarChart3, label: 'Activity Stats' },
];

export const IconButtonsRow: React.FC = () => {
  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {iconButtons.map((item, index) => (
          <button key={index} className="bg-surface border border-secondary/20 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-primary/40 hover:bg-surface/80 transition-all group">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <item.icon size={24} className="text-primary" />
            </div>
            <span className="text-white text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
