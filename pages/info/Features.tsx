import React from 'react';
import BaseInfoPage from './BaseInfoPage';
import { Target, Zap, BarChart3, Globe, Shield, Trophy, Sparkles, Layout, Clock, Star, Flame, Fingerprint, MousePointer2, Brain } from 'lucide-react';

const Features = () => {
  const mainFeatures = [
    {
      icon: <Target className="text-primary" />,
      title: 'Task Management',
      description: 'Convert your to-do list into organized projects. Set main goals and sub-tasks, each with their own priority levels.',
      detail: 'Includes recurring daily tasks, long-term milestones, and quick tasks for immediate wins.',
      color: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      icon: <Zap className="text-pink-500" />,
      title: 'Skill Development',
      description: 'Visualize your growth across five core areas: Physical, Mental, Professional, Social, and Creative.',
      detail: 'As you complete tasks in specific categories, you unlock achievements that reflect your real-world progress.',
      color: 'from-pink-500/20 to-blue-500/20'
    },
    {
      icon: <BarChart3 className="text-orange-500" />,
      title: 'Advanced Analytics',
      description: 'Track your progress with beautiful, interactive charts. Monitor your productivity streaks and growth over time.',
      detail: 'Get insights into which hours you are most productive and which areas are growing the fastest.',
      color: 'from-orange-500/20 to-red-500/20'
    },
    {
      icon: <Globe className="text-blue-500" />,
      title: 'Team Collaboration',
      description: 'Connect with colleagues to form teams. Take on group challenges where everyone contributes to shared goals.',
      detail: 'Share progress, compete on friendly leaderboards, and keep each other accountable through social motivation.',
      color: 'from-blue-600/20 to-indigo-600/20'
    }
  ];

  const secondaryFeatures = [
    { icon: <Clock size={20} />, name: 'Focus Timer', desc: 'Integrated Pomodoro timer that rewards you for focused work sessions.' },
    { icon: <Shield size={20} />, name: 'Secure Cloud', desc: 'Your data is encrypted and synced across all your devices.' },
    { icon: <Brain size={20} />, name: 'Team Challenges', desc: 'Engage in friendly competitions with colleagues to boost productivity.' },
    { icon: <Trophy size={20} />, name: 'Achievement System', desc: 'Over 100+ unique badges to unlock as you reach important milestones.' },
    { icon: <Sparkles size={20} />, name: 'AI Assistant', desc: 'Our AI assistant suggests tasks based on your goals and current progress.' },
    { icon: <Layout size={20} />, name: 'Custom Dashboard', desc: 'Personalize your dashboard with widgets that matter most to your workflow.' }
  ];

  const stats = [
    { label: 'Physical', value: '75%', color: 'bg-red-500' },
    { label: 'Mental', value: '92%', color: 'bg-blue-500' },
    { label: 'Professional', value: '64%', color: 'bg-green-500' },
    { label: 'Creative', value: '88%', color: 'bg-primary' }
  ];

  return (
    <BaseInfoPage title="Features">
      <div className="space-y-24">
        {/* Hero-like intro */}
        <section className="relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
              <Star size={12} /> XPeak Platform v2.4
            </div>
            <p className="text-2xl md:text-3xl text-secondary/90 font-medium leading-tight mb-8 max-w-3xl">
              XPeak isn't just a productivity app—it's a comprehensive <span className="text-white font-black italic">workflow management system</span> designed to turn your 
              ambitions into clear, achievable progress.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-105 shadow-xl shadow-primary/20">
                Explore Features
              </button>
              <button className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm border border-white/10 transition-all">
                Download Guide
              </button>
            </div>
          </div>
        </section>
        
        {/* Main Features Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mainFeatures.map((feature, index) => (
              <div 
                key={index} 
                className={`group relative overflow-hidden bg-white/5 border border-white/10 rounded-[2.5rem] p-10 hover:bg-white/10 transition-all duration-500`}
              >
                {/* Background Gradient Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-black/20">
                    <div className="transform group-hover:scale-110 transition-transform">
                      {React.cloneElement(feature.icon as React.ReactElement, { size: 32 })}
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-secondary/80 mb-8 leading-relaxed text-lg">{feature.description}</p>
                  <div className="p-5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 group-hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">Highlight</div>
                    </div>
                    <p className="text-sm text-secondary/60 leading-relaxed italic">
                      {feature.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Visual Mechanic: Skill Stats */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center bg-white/5 rounded-[3rem] p-10 md:p-16 border border-white/10 relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10 translate-x-1/4 -translate-y-1/4 pointer-events-none">
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
          </div>

          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest">
              <Flame size={12} /> Real-time Progression
            </div>
            <h2 className="text-4xl font-black text-white leading-tight">Your progress at a glance.</h2>
            <p className="text-secondary/80 text-lg leading-relaxed">
              Every task you complete feeds into your overall progress. Watch your skills develop in real-time as you master your professional and personal life.
            </p>
            
            <div className="space-y-6 max-w-md">
              {stats.map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                    <span className="text-white">{stat.label}</span>
                    <span className="text-secondary/40">{stat.value}</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                    <div 
                      className={`h-full ${stat.color} rounded-full transition-all duration-1000 shadow-lg shadow-black/20`}
                      style={{ width: stat.value }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-[2.5rem] border border-white/10 flex items-center justify-center p-8 relative group overflow-hidden">
              {/* Fake UI Element */}
              <div className="relative w-full h-full bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl p-6 flex flex-col justify-between overflow-hidden">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                      <Fingerprint size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Profile Type</div>
                      <div className="text-lg font-black text-white">Professional</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Level</div>
                    <div className="text-2xl font-black text-primary italic">42</div>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center my-8">
                   <div className="w-32 h-32 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center relative">
                      <div className="absolute inset-0 animate-spin-slow opacity-20 bg-[conic-gradient(from_0deg,_#3b82f6,_transparent)] rounded-full"></div>
                      <Target size={48} className="text-primary/40" />
                   </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Next Milestone: "Complete Q1 Goals"</div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-primary rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Cursor Overlay */}
              <div className="absolute bottom-1/4 right-1/4 pointer-events-none group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700">
                <MousePointer2 size={32} className="text-white drop-shadow-lg fill-white/20" />
              </div>
            </div>
          </div>
        </section>

        {/* Secondary Features Grid */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-white">Additional Features</h2>
            <p className="text-secondary/60 max-w-xl mx-auto">The foundational tools that keep your workflow running smoothly across all your devices.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {secondaryFeatures.map((item, index) => (
              <div key={index} className="flex gap-5 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1 group-hover:text-primary transition-colors">{item.name}</h4>
                  <p className="text-secondary/50 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="bg-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-20 -translate-y-1/2 translate-x-1/2 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
           
           <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic">Ready to Get Started?</h2>
              <p className="text-white/80 text-xl max-w-2xl mx-auto font-medium">
                Join 50,000+ professionals who have already improved their productivity with XPeak.
              </p>
              <button className="bg-white text-primary px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-lg hover:scale-105 transition-transform shadow-2xl shadow-black/20">
                Create Your Account
              </button>
           </div>
        </section>
      </div>
    </BaseInfoPage>
  );
};

export default Features;
