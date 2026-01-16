import React from 'react';
import { BarChart3, Check } from 'lucide-react';
import { HalftoneDots } from '../../../components/HalftoneDots';

interface SolutionFeature {
  title: string;
  description: string;
}

const solutionFeatures: SolutionFeature[] = [
  {
    title: 'Outcome-Based Planning',
    description: 'Every task is linked to a career goal, so you always know why your work matters.',
  },
  {
    title: 'Guided Focus Sessions',
    description: 'Built-in timers and structured work sessions to maintain concentration on difficult projects.',
  },
  {
    title: 'Clear Progress Reports',
    description: "Track your professional growth with simple charts that show exactly what you've improved.",
  },
];

export const SolutionSection: React.FC = () => {
  return (
    <section id="solution" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface/30 to-transparent"></div>
      <HalftoneDots color="#3b82f6" opacity={0.08} size="40px" fadeDirection="radial" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - App Preview */}
          <div className="relative">
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-4 p-6 w-full">
                    <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-2 bg-primary/30 rounded w-full"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center justify-center">
                      <BarChart3 className="text-primary mb-2" size={24} />
                      <p className="text-slate-600 text-xs">Stats</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <div className="flex gap-1 h-12">
                        {[60, 80, 45, 90, 70].map((h, i) => (
                          <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{height: `${h}%`, marginTop: 'auto'}}>
                            <div className="w-full h-full bg-primary rounded-t" style={{height: `${h}%`}}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 bg-white rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600"></div>
                        <div className="flex-1">
                          <div className="h-2 bg-slate-200 rounded w-3/4 mb-1"></div>
                          <div className="h-1.5 bg-emerald-400 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right - Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              The XPeak <br /><span className="text-primary">Solution</span>
            </h2>
            <p className="text-secondary/70 text-base mb-8 italic">
              "Shift from being busy to being productive."
            </p>
            
            <div className="space-y-6">
              {solutionFeatures.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Check size={18} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{feature.title}</h4>
                    <p className="text-secondary/70 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
