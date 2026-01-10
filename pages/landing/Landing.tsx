import React from 'react';
import { Swords, Zap, Target, TrendingUp, Sparkles, ArrowRight, Play } from 'lucide-react';

interface LandingViewProps {
  onGetStarted?: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: Target,
      title: 'Quest System',
      description: 'Break down ambitious goals into strategic quests with categories and actionable tasks. Track progress with XP rewards and completion bonuses.'
    },
    {
      icon: Zap,
      title: 'Gamified Progress',
      description: 'Earn XP for every completed task. Level up your skills across multiple categories and watch your total level increase.'
    },
    {
      icon: TrendingUp,
      title: 'Skill Matrix',
      description: 'Visualize your growth across different skill categories. Track your evolution with detailed progress charts and analytics.'
    },
    {
      icon: Sparkles,
      title: 'AI Assistant',
      description: 'Get strategic breakdowns of complex goals. Your AI Oracle can generate quest structures and help optimize your progression.'
    }
  ];

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/30 shadow-[0_0_30px_rgba(0,225,255,0.3)]">
              <Swords size={64} className="text-primary" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic">
              LevelUp
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-secondary font-bold mb-4 max-w-2xl mx-auto">
            Transform Your Life Into A Game
          </p>
          
          <p className="text-secondary/80 text-base md:text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
            Level up your skills, complete quests, earn XP, and track your evolution. 
            Turn productivity into progression with a gamified life management system.
          </p>

          {onGetStarted && (
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center gap-3 bg-primary hover:bg-cyan-400 text-background px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105"
            >
              <span>Begin Your Journey</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary/40 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-primary rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic mb-4">
            System Capabilities
          </h2>
          <p className="text-secondary text-lg max-w-2xl mx-auto">
            Everything you need to gamify your personal development and track your journey to mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group bg-surface border border-secondary/20 rounded-2xl p-8 hover:border-primary/40 transition-all hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-xl border border-primary/20 mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon size={32} className="text-primary" />
                </div>
                
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-surface to-background border border-primary/20 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center p-6 bg-primary/10 rounded-full border border-primary/30 mb-8 shadow-[0_0_30px_rgba(0,225,255,0.2)]">
              <Play size={48} className="text-primary ml-1" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic mb-6">
              Ready To Level Up?
            </h2>
            
            <p className="text-secondary text-lg mb-10 max-w-2xl mx-auto">
              Start tracking your progress, complete quests, and watch your skills evolve. 
              Every task is a step toward your next level.
            </p>

            {onGetStarted && (
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center gap-3 bg-primary hover:bg-cyan-400 text-background px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105"
              >
                <span>Launch Protocol</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingView;

