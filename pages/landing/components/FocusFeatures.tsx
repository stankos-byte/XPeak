import React from 'react';
import { Brain, Target, Zap, LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Brain,
    title: 'Reduce Distractions',
    description: 'Constant notifications lower your focus. Use our tools to block out noise and keep your most important work front and center.',
  },
  {
    icon: Target,
    title: 'Stay Motivated',
    description: 'Working alone can lead to burnout. Connect with a professional community to share progress and stay on track.',
  },
  {
    icon: Zap,
    title: 'Learn Faster',
    description: "Don't just complete tasks—build real skills. Follow structured paths to reach your professional and personal goals sooner.",
  },
];

export const FocusFeatures: React.FC = () => {
  return (
    <section id="features" className="relative max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
          Focus On What <span className="text-primary">Matters</span>
        </h2>
        <p className="text-secondary/70 text-base max-w-2xl mx-auto">
          Traditional tools manage tasks, but they don't help you build skills or maintain deep focus. We solve these common work challenges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-surface/50 border border-secondary/10 rounded-2xl p-8 hover:border-primary/30 transition-all group">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <feature.icon size={28} className="text-primary" />
            </div>
            <h3 className="text-white font-bold text-lg mb-3">{feature.title}</h3>
            <p className="text-secondary/70 text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
