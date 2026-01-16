import React from 'react';

export const FocusSystem: React.FC = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-surface/50 to-transparent"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - Timer Display */}
          <div className="bg-surface border border-secondary/20 rounded-3xl p-8 max-w-md">
            <div className="text-center">
              <p className="text-7xl font-bold text-white mb-4 font-mono tracking-wider">25:00</p>
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <div className="w-3 h-3 bg-secondary/30 rounded-full"></div>
                <div className="w-3 h-3 bg-secondary/30 rounded-full"></div>
                <div className="w-3 h-3 bg-secondary/30 rounded-full"></div>
              </div>
              <button className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-sm transition-colors">
                Start Focus Session
              </button>
            </div>
          </div>
          
          {/* Right - Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Practical <span className="text-primary">Focus</span><br />System
            </h2>
            <p className="text-secondary/70 text-base leading-relaxed">
              A clean timer helps you dedicate time to your most important tasks. It reduces distractions so you can complete your work more efficiently and accurately.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
