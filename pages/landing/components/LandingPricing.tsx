import React from 'react';
import { Check } from 'lucide-react';

interface LandingPricingProps {
  onGetStarted?: () => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onGetStarted }) => {
  return (
    <section id="pricing" className="max-w-5xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Choose Your <span className="text-primary">Plan</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Plan */}
        <div className="bg-surface/50 border border-secondary/20 rounded-3xl p-8">
          <div className="mb-6">
            <span className="text-secondary/60 text-sm uppercase tracking-wider">Basic</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-secondary/60 text-sm">/mo</span>
            </div>
            <p className="text-secondary/60 text-sm mt-2">For individuals starting to improve their workflow.</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <Check size={18} className="text-primary" />
              <span className="text-secondary/80 text-sm">Basic Skill Planning</span>
            </div>
            <div className="flex items-center gap-3">
              <Check size={18} className="text-primary" />
              <span className="text-secondary/80 text-sm">Focus Timer</span>
            </div>
            <div className="flex items-center gap-3">
              <Check size={18} className="text-primary" />
              <span className="text-secondary/80 text-sm">Task Management</span>
            </div>
            <div className="flex items-center gap-3">
              <Check size={18} className="text-primary" />
              <span className="text-secondary/80 text-sm">Basic Stats</span>
            </div>
          </div>
          
          <button onClick={onGetStarted} className="w-full bg-surface border border-secondary/30 text-white py-4 rounded-full font-bold text-sm hover:bg-white/5 transition-all">
            Start For Free
          </button>
        </div>
        
        {/* Pro Plan */}
        <div className="bg-gradient-to-br from-primary/20 to-blue-400/20 border border-primary/40 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
            Pro
          </div>
          
          <div className="mb-6">
            <span className="text-primary text-sm uppercase tracking-wider font-medium">Pro</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black text-white">$29</span>
              <span className="text-secondary/60 text-sm">/mo</span>
            </div>
            <p className="text-secondary/60 text-sm mt-2">Full features for busy professionals.</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <Check size={18} className="text-primary" />
              <span className="text-white text-sm">Unlimited Skill Plans</span>
            </div>
            <div className="flex items-center gap-3">
              <Check size={18} className="text-primary" />
              <span className="text-white text-sm">Advanced Activity Stats</span>
            </div>
            <div className="flex items-center gap-3">
              <Check size={18} className="text-primary" />
              <span className="text-white text-sm">Team Collaboration Tools</span>
            </div>
            <div className="flex items-center gap-3">
              <Check size={18} className="text-primary" />
              <span className="text-white text-sm">Customer Support</span>
            </div>
          </div>
          
          <button onClick={onGetStarted} className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-full font-bold text-sm hover:from-blue-600 hover:to-primary transition-all shadow-lg shadow-primary/30">
            Get Pro Plan
          </button>
        </div>
      </div>
    </section>
  );
};
