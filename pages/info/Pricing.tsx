import React from 'react';
import BaseInfoPage from './BaseInfoPage';
import { Check, Star, Shield, Crown, Zap, Flame, Target, Trophy, Users } from 'lucide-react';

const Pricing = () => {
  const tiers = [
    {
      name: 'Starter',
      icon: <Star size={24} className="text-secondary/40" />,
      price: 'Free',
      description: 'The starting point for everyone. Perfect for individuals just beginning their productivity journey.',
      features: [
        'Basic Task Management (20 Tasks)',
        'Standard Progress Tracking (5 areas)',
        'Mobile App Access',
        'Basic Achievement System',
        'Community Forum Access'
      ],
      buffs: [
        { icon: <Zap size={14} />, label: 'Standard Progress' },
        { icon: <Target size={14} />, label: 'Self-Guided' }
      ],
      buttonText: 'Get Started',
      highlight: false,
      color: 'border-white/10',
      badge: 'Basic'
    },
    {
      name: 'Professional',
      icon: <Shield size={24} className="text-white" />,
      price: '$9.99',
      period: '/mo',
      description: 'For those dedicated to growth. Unlock the full potential of your productivity.',
      features: [
        'Unlimited Tasks & Projects',
        'Advanced Analytics & Stats',
        'Custom Progress Categories',
        'Team Collaboration Features',
        'Exclusive Monthly Updates',
        'No Ads or Interruptions'
      ],
      buffs: [
        { icon: <Flame size={14} />, label: 'Priority Support' },
        { icon: <Users size={14} />, label: 'Team Features' },
        { icon: <Zap size={14} />, label: 'Daily Insights' }
      ],
      buttonText: 'Go Professional',
      highlight: true,
      color: 'border-primary',
      badge: 'Popular'
    },
    {
      name: 'Enterprise',
      icon: <Crown size={24} className="text-orange-400" />,
      price: '$19.99',
      period: '/mo',
      description: 'The ultimate plan. For high achievers who want every advantage available.',
      features: [
        'Everything in Professional plan',
        'Personal AI Assistant',
        'Early Beta Feature Access',
        'Dedicated Support',
        'Unlimited Custom Themes',
        'Priority Feature Requests'
      ],
      buffs: [
        { icon: <Flame size={14} />, label: 'AI-Powered' },
        { icon: <Trophy size={14} />, label: 'VIP Access' },
        { icon: <Zap size={14} />, label: 'Weekly Reports' },
        { icon: <Star size={14} />, label: 'Custom Branding' }
      ],
      buttonText: 'Go Enterprise',
      highlight: false,
      color: 'border-orange-400/30',
      badge: 'Premium'
    }
  ];

  return (
    <BaseInfoPage title="Pricing">
      <div className="space-y-24">
        <header className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            Choose Your Plan
          </div>
          <h2 className="text-4xl font-black text-white">Find the right plan for you.</h2>
          <p className="text-xl text-secondary/80 leading-relaxed">
            Every journey requires the right tools. Choose the plan that fits your ambitions and start improving today.
          </p>
          <div className="inline-flex p-1.5 bg-white/5 rounded-2xl border border-white/10">
            <button className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20">Monthly</button>
            <button className="px-8 py-2.5 text-secondary/60 hover:text-white transition-colors rounded-xl font-bold text-sm">Annually (Save 20%)</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {tiers.map((tier, index) => (
            <div 
              key={index} 
              className={`group relative rounded-[3rem] p-10 flex flex-col transition-all duration-500 hover:-translate-y-4 border-2 overflow-hidden ${
                tier.highlight 
                  ? 'bg-[#0f172a] border-primary shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] scale-105 z-10' 
                  : `bg-white/5 ${tier.color} hover:bg-white/10 hover:border-white/20`
              }`}
            >
              {/* Background Accents for highlight */}
              {tier.highlight && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none"></div>
              )}
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div className={`p-4 rounded-2xl ${tier.highlight ? 'bg-primary shadow-xl shadow-primary/30' : 'bg-white/5'}`}>
                    {tier.icon}
                  </div>
                  <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${tier.highlight ? 'bg-primary text-white' : 'bg-white/10 text-secondary/60'}`}>
                    {tier.badge}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className={`text-3xl font-black mb-2 ${tier.highlight ? 'text-white' : 'text-white'}`}>{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">{tier.price}</span>
                    {tier.period && <span className="text-sm opacity-40 font-bold text-white">{tier.period}</span>}
                  </div>
                </div>

                <p className={`text-sm mb-10 leading-relaxed min-h-[4rem] ${tier.highlight ? 'text-white/70' : 'text-secondary/60'}`}>
                  {tier.description}
                </p>

                {/* Highlights Section */}
                <div className="mb-10 p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                  <div className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">Highlights</div>
                  <div className="flex flex-wrap gap-2">
                    {tier.buffs.map((buff, bIndex) => (
                      <div key={bIndex} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-bold text-white uppercase tracking-tighter">
                        <span className="text-primary">{buff.icon}</span>
                        {buff.label}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4 mb-12 flex-1">
                  <div className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2">Features</div>
                  {tier.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-4 text-sm font-medium">
                      <div className={`mt-1 p-0.5 rounded-full ${tier.highlight ? 'bg-primary text-white' : 'bg-white/10 text-secondary/40'}`}>
                        <Check size={12} strokeWidth={4} />
                      </div>
                      <span className={tier.highlight ? 'text-white/90' : 'text-secondary/80'}>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button 
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 ${
                    tier.highlight 
                      ? 'bg-primary text-white hover:scale-105 shadow-xl shadow-primary/30' 
                      : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 border border-white/10'
                  }`}
                >
                  {tier.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise Section */}
        <section className="relative p-12 md:p-16 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-[3rem] border border-white/10 text-center overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-2xl font-black text-white mb-4 italic tracking-tight">Need an Enterprise Solution?</h4>
            <p className="text-secondary/80 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Looking to boost your entire team or organization? We offer custom solutions for companies of all sizes with dedicated support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <button className="bg-white text-primary px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-xl">
                  Contact Sales
               </button>
               <span className="text-secondary/40 font-bold uppercase tracking-widest text-[10px]">or</span>
               <button className="text-white hover:text-primary transition-colors font-black uppercase tracking-widest text-xs underline decoration-primary/30 underline-offset-8">
                  View Case Studies
               </button>
            </div>
          </div>
        </section>

        {/* Trust/Social Proof */}
        <div className="flex flex-wrap justify-center items-center gap-12 grayscale opacity-30">
           <span className="text-2xl font-black italic">TechCrunch</span>
           <span className="text-2xl font-black italic">Forbes</span>
           <span className="text-2xl font-black italic">Wired</span>
           <span className="text-2xl font-black italic">ProductHunt</span>
        </div>
      </div>
    </BaseInfoPage>
  );
};

export default Pricing;
