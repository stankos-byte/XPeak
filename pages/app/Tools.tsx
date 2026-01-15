import React from 'react';
import { Zap, Target, Activity, Timer, BarChart2, Calendar, Layers, Hourglass, Scissors, Brain, Home, TrendingUp, Play, Pause, RotateCcw, Minus, Plus } from 'lucide-react';

interface ToolsViewProps {
  switchTimerMode: (mode: 'work' | 'break') => void;
  timerMode: 'work' | 'break';
  formatTime: (seconds: number) => string;
  timerTimeLeft: number;
  toggleTimer: () => void;
  isTimerActive: boolean;
  resetTimer: () => void;
  handleAdjustTimer: (change: number) => void;
}

const ToolsView: React.FC<ToolsViewProps> = ({ 
  switchTimerMode, 
  timerMode, 
  formatTime, 
  timerTimeLeft, 
  toggleTimer, 
  isTimerActive, 
  resetTimer, 
  handleAdjustTimer 
}: ToolsViewProps) => {
  const productivityTools = [
    { title: "The 2-Minute Rule", icon: Zap, desc: "Beat procrastination by immediately executing any task that takes less than two minutes. This prevents small chores from piling up into a massive backlog." },
    { title: "Eat the Frog", icon: Target, desc: "Tackle your most challenging, significant, or dreaded task first thing in the morning. Completing it gives you momentum and eliminates looming anxiety for the rest of the day." },
    { title: "Deep Work", icon: Activity, desc: "Dedicate set periods to distraction-free, cognitively demanding tasks. Turn off notifications and focus intensely to maximize output and master complex information quickly." },
    { title: "The 5-Second Rule", icon: Timer, desc: "When you have an impulse to act on a goal, physically move within 5 seconds to bypass your brain's hesitation and fear response before it stops you." },
    { title: "The 80/20 Rule", icon: BarChart2, desc: "Focus your energy on the vital 20% of activities that yield 80% of your results. Identify and prioritize high-impact tasks while delegating or eliminating low-value busywork." },
    { title: "Time Blocking", icon: Calendar, desc: "Schedule your day into distinct blocks of time dedicated to specific tasks or task types. This creates a structured framework that reduces decision fatigue and keeps you on track." },
    { title: "Time Batching", icon: Layers, desc: "Group similar low-intensity tasks (like email, admin, or calls) and do them all at once. This minimizes the mental penalty of context switching and preserves flow state for harder work." },
    { title: "Parkinson's Law", icon: Hourglass, desc: "Set artificial, shorter deadlines for your tasks. Since work expands to fill the time available, limiting the time forces you to focus on essentials and finish faster." },
    { title: "Chunking", icon: Scissors, desc: "Break down overwhelming projects into small, manageable, bite-sized action items. This reduces friction and makes starting easier by clarifying exactly what to do next." },
    { title: "Zeigarnik Effect", icon: Brain, desc: "Your brain dwells on unfinished tasks. Offload them by writing them down in a trusted system to clear your mental RAM and reduce anxiety, allowing you to focus on the present." },
    { title: "Environmental Design", icon: Home, desc: "Optimize your physical space to reduce friction for good habits and increase it for bad ones. Put distractions out of sight and keep tools for success within immediate reach." },
    { title: "The 1% Rule", icon: TrendingUp, desc: "Focus on consistent, marginal improvements rather than massive overnight success. Getting 1% better every day compounds into a 37x improvement over the course of a year." }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic">System Utilities</h1>
      </header>
      <section className="bg-surface border border-secondary/20 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[250px] border-primary/10">
        {isTimerActive && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(circle, rgba(59, 130, 246, 0.4) 2px, transparent 2px),
                radial-gradient(circle, rgba(147, 51, 234, 0.3) 2px, transparent 2px)
              `,
              backgroundSize: '20px 20px, 30px 30px',
              backgroundPosition: '0 0, 10px 10px',
              maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 90%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 60%, transparent 90%)',
              opacity: 0.8
            }}
          />
        )}
        <div className="flex gap-4 mb-6 relative z-10">
          <button onClick={() => switchTimerMode('work')} className={`px-4 py-2 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${timerMode === 'work' ? 'bg-primary text-background shadow-[0_0_20px_rgba(0,225,255,0.4)] scale-105' : 'text-secondary border border-secondary/30 hover:border-primary/50'}`}>Work Protocol</button>
          <button onClick={() => switchTimerMode('break')} className={`px-4 py-2 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${timerMode === 'break' ? 'bg-emerald-500 text-background shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105' : 'text-secondary border border-secondary/30 hover:border-emerald-500/50'}`}>Rest Mode</button>
        </div>
        <div className="flex items-center justify-center gap-4 mb-6 relative z-10 w-full max-w-lg">
          {!isTimerActive && <button onClick={() => handleAdjustTimer(-60)} className="p-2 bg-background border border-secondary/20 rounded-full text-secondary hover:text-primary transition-all active:scale-90"><Minus size={20} /></button>}
          <div className="text-5xl md:text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(0,225,255,0.4)] italic">{formatTime(timerTimeLeft)}</div>
          {!isTimerActive && <button onClick={() => handleAdjustTimer(60)} className="p-2 bg-background border border-secondary/20 rounded-full text-secondary hover:text-primary transition-all active:scale-90"><Plus size={20} /></button>}
        </div>
        <div className="flex gap-4 relative z-10">
          <button onClick={toggleTimer} className={`p-4 rounded-full border transition-all active:scale-95 ${isTimerActive ? 'bg-surface border-secondary/30 text-secondary hover:text-red-400' : 'bg-background border-primary/40 text-primary hover:bg-surface shadow-[0_0_25px_rgba(0,225,255,0.2)]'}`}>{isTimerActive ? <Pause size={24} /> : <Play size={24} className="ml-1" />}</button>
          <button onClick={resetTimer} className="bg-background border border-secondary/30 text-secondary hover:text-white p-4 rounded-full transition-all active:rotate-180 duration-500"><RotateCcw size={24} /></button>
        </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {productivityTools.map((tool, idx) => (
          <div key={idx} className="bg-surface border border-secondary/10 rounded-2xl p-6 hover:border-primary/40 transition-all group hover:shadow-2xl">
            <div className="flex items-center gap-4 mb-3 text-primary">
              <tool.icon size={24} className="shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-widest italic">{tool.title}</h3>
            </div>
            <p className="text-secondary text-sm font-medium leading-relaxed group-hover:text-gray-200 transition-colors">{tool.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsView;

