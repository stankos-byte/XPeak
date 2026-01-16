import React from 'react';
import { Swords } from 'lucide-react';

interface LandingNavbarProps {
  onGetStarted?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onGetStarted }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20">
            <Swords size={22} className="text-primary" />
          </div>
          <span className="text-lg font-black text-white uppercase tracking-tighter italic">
            XPeak
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-secondary/80 hover:text-white text-sm font-medium transition-colors">Home</a>
          <a href="#solution" className="text-secondary/80 hover:text-white text-sm font-medium transition-colors">Features</a>
          <a href="#pricing" className="text-secondary/80 hover:text-white text-sm font-medium transition-colors">Pricing</a>
        </div>
        
        {onGetStarted && (
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
          >
            Get Started
          </button>
        )}
      </div>
    </nav>
  );
};
