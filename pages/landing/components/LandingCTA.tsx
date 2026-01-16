import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { HalftoneDots } from '../../../components/HalftoneDots';

interface LandingCTAProps {
  onGetStarted?: () => void;
}

export const LandingCTA: React.FC<LandingCTAProps> = ({ onGetStarted }) => {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20 relative">
      <div className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
        <HalftoneDots color="#ffffff" opacity={0.1} size="32px" fadeDirection="radial" />
        
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
            Start Improving<br />Your Workflow Today
          </h2>
          
          <p className="text-white/80 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of professionals who have improved their time management and career growth.
          </p>

          {onGetStarted && (
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center gap-3 bg-white text-primary px-10 py-5 rounded-full font-bold text-base transition-all hover:bg-gray-100 hover:scale-105"
            >
              <Sparkles size={20} />
              <span>Get Started Now</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
