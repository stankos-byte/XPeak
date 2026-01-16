import React from 'react';

export const GrowthPaths: React.FC = () => {
  return (
    <section className="relative max-w-7xl mx-auto px-6 py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left - Tree Illustration */}
        <div className="relative flex items-center justify-center">
          <div className="w-64 h-80 relative">
            {/* Tree trunk */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-40 bg-gradient-to-t from-amber-800 to-amber-700 rounded-t-lg"></div>
            {/* Tree crown */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-56">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full opacity-90"></div>
              <div className="absolute top-4 left-8 w-40 h-40 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full opacity-80"></div>
              <div className="absolute top-8 right-6 w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full opacity-70"></div>
              {/* Decorative dots */}
              <div className="absolute top-12 left-16 w-3 h-3 bg-white/30 rounded-full"></div>
              <div className="absolute top-20 right-16 w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="absolute bottom-16 left-12 w-2 h-2 bg-white/30 rounded-full"></div>
            </div>
            {/* Ground */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-6 bg-gradient-to-t from-amber-900/50 to-transparent rounded-full blur-sm"></div>
          </div>
        </div>
        
        {/* Right - Content */}
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Simple <span className="text-primary">Growth Paths</span>
          </h2>
          <p className="text-secondary/70 text-base mb-8 leading-relaxed">
            Plan your professional development with easy-to-read charts. Follow a clear path for learning new skills and see your progress as you finish each project.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-secondary/80 text-sm">Clear growth milestones</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-secondary/80 text-sm">Simple progress tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-secondary/80 text-sm">Completion certificates</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
