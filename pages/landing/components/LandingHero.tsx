import React from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { HalftoneDots } from '../../../components/HalftoneDots';

interface LandingHeroProps {
  onGetStarted?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-[600px] h-[600px] bg-primary rounded-full blur-3xl"></div>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden pt-20">
        <HalftoneDots className="-translate-x-1/4 -translate-y-1/4" color="#3b82f6" opacity={0.15} size="30px" fadeDirection="radial" />
        <HalftoneDots className="translate-x-1/4 translate-y-1/4 bottom-0 right-0" color="#3b82f6" opacity={0.12} size="30px" fadeDirection="radial" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div>
            <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <span className="text-primary text-xs font-bold uppercase tracking-wider">✦ Now Available</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              Boost Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                Productivity,
              </span> <br />
              Master Your Skills
            </h1>
            
            <p className="text-secondary/80 text-lg mb-8 max-w-lg leading-relaxed">
              Improve your workflow with interactive learning tools and focus systems designed for professionals. Accomplish more and grow your career.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-10">
              {onGetStarted && (
                <button
                  onClick={onGetStarted}
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white px-8 py-4 rounded-full font-bold text-sm transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105"
                >
                  <span>Create Your Account</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <button className="inline-flex items-center gap-2 border border-secondary/30 text-white px-6 py-4 rounded-full font-medium text-sm hover:bg-white/5 transition-all">
                <Download size={18} />
                Download App
              </button>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-500 border-2 border-background"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-background"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 border-2 border-background"></div>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">100K+</p>
                  <p className="text-secondary/60 text-xs">Active Users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Phone Mockups */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-blue-400/30 rounded-[3rem] blur-3xl"></div>
              
              {/* Main Phone */}
              <div className="relative w-72 h-[520px] bg-white rounded-[2.5rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-b from-slate-100 to-white rounded-[2rem] p-4 flex flex-col">
                  <div className="text-center mb-4">
                    <p className="text-slate-800 text-xs font-medium">Dashboard Productivity</p>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full bg-gradient-to-br from-primary/20 to-blue-400/20 flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-white text-2xl font-bold">78%</p>
                          <p className="text-white/80 text-xs">Focus Score</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="bg-slate-100 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-slate-600 text-xs">Tasks Completed</span>
                      <span className="text-slate-800 text-sm font-bold">24/30</span>
                    </div>
                    <div className="bg-slate-100 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-slate-600 text-xs">Weekly Progress</span>
                      <span className="text-emerald-500 text-sm font-bold">+12%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Secondary Phone */}
              <div className="absolute -right-16 top-20 w-48 h-80 bg-surface rounded-[1.5rem] p-2 shadow-xl border border-secondary/20 transform rotate-6">
                <div className="w-full h-full bg-gradient-to-b from-surface to-background rounded-[1.25rem] p-3 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-cyan-500"></div>
                    <div>
                      <p className="text-white text-[10px] font-bold">Focus Timer</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-primary text-3xl font-bold">25:00</p>
                      <p className="text-secondary/60 text-xs">Pomodoro</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-1 bg-primary rounded-full"></div>
                    <div className="flex-1 h-1 bg-primary/30 rounded-full"></div>
                    <div className="flex-1 h-1 bg-primary/30 rounded-full"></div>
                    <div className="flex-1 h-1 bg-primary/30 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
