import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Star, Shield, Crown, Zap, Flame, Target, Trophy, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createCheckoutSession, POLAR_PRODUCTS } from '../../services/billingService';
import toast from 'react-hot-toast';
import { useSubscription } from '../../hooks/useSubscription';

const Plan: React.FC = () => {
  const navigate = useNavigate();
  const { userDocument } = useAuth();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { subscription, isLoading: isSubscriptionLoading, isPro } = useSubscription();

  // Get current plan from subscription
  const currentPlan = subscription?.plan || 'free';

  // Handle checkout success/cancel
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('success') === 'true') {
      toast.success('🎉 Welcome to Pro! Your subscription is now active.');
      // Clean up URL
      window.history.replaceState({}, '', '/plan');
    } else if (params.get('canceled') === 'true') {
      toast.error('Checkout was canceled. Feel free to try again!');
      // Clean up URL
      window.history.replaceState({}, '', '/plan');
    }
  }, []);

  // Calculate Pro pricing based on billing cycle
  const proPrice = billingCycle === 'monthly' ? '$4' : '$40';
  const proPeriod = billingCycle === 'monthly' ? '/mo' : '/yr';
  const proPeriodSavings = billingCycle === 'yearly' ? 'Save $8/year' : null;

  const tiers = [
    {
      id: 'free',
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
      buttonText: 'Current Plan',
      color: 'border-white/10',
      badge: 'Basic'
    },
    {
      id: 'pro',
      name: 'Professional',
      icon: <Shield size={24} className="text-white" />,
      price: proPrice,
      period: proPeriod,
      savings: proPeriodSavings,
      description: 'For those dedicated to growth. Unlock the full potential of your productivity.',
      features: [
        'Unlimited Tasks & Projects',
        'Advanced Analytics & Stats',
        'Custom Progress Categories',
        'Team Collaboration Features',
        'Exclusive Monthly Updates',
        'No Ads or Interruptions',
        'Personal AI Assistant',
        'Priority Support'
      ],
      buffs: [
        { icon: <Flame size={14} />, label: 'Priority Support' },
        { icon: <Users size={14} />, label: 'Team Features' },
        { icon: <Zap size={14} />, label: 'AI-Powered' },
        { icon: <Trophy size={14} />, label: 'Daily Insights' }
      ],
      buttonText: isPro ? 'Manage Subscription' : 'Upgrade to Pro',
      color: 'border-primary',
      badge: 'Popular'
    }
  ];

  const handleUpgrade = async (tierId: string) => {
    if (tierId === currentPlan || isCheckingOut) return;
    
    // If user is Pro and clicks on Pro tier, navigate to settings
    if (tierId === 'pro' && isPro) {
      navigate('/settings');
      return;
    }
    
    setIsCheckingOut(true);
    
    try {
      // Get the appropriate product ID based on billing cycle
      const productId = billingCycle === 'monthly' 
        ? POLAR_PRODUCTS.MONTHLY 
        : POLAR_PRODUCTS.YEARLY;
      
      // Create checkout session and redirect
      await createCheckoutSession(productId);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout. Please try again.');
      setIsCheckingOut(false);
    }
  };

  const toggleExpand = (tierId: string) => {
    setExpandedCard(expandedCard === tierId ? null : tierId);
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Desktop/Tablet Header */}
      <div className="hidden md:block sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-secondary/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-14 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-secondary hover:text-primary transition-colors group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold uppercase tracking-wider text-sm">Back to Settings</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-secondary text-sm font-medium">Current Plan:</span>
              <span className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg text-primary font-black uppercase tracking-widest text-xs">
                {tiers.find(t => t.id === currentPlan)?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-surface/95 backdrop-blur-xl border-b border-secondary/20">
        <div className="p-4 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="flex-1 text-center text-xl font-black uppercase tracking-tighter italic text-white">
            Choose Your Plan
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-14 py-8 md:py-12">
        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-surface border border-secondary/20 rounded-2xl p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-secondary hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-secondary hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span className="ml-2 text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Mobile: Current Plan Banner */}
        <div className="md:hidden mb-8">
          <div className="bg-surface border border-primary/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-secondary">Your Current Plan</span>
              <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-primary font-black uppercase tracking-widest text-[10px]">
                Active
              </span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {tiers.find(t => t.id === currentPlan)?.name}
            </h3>
            <p className="text-secondary text-sm">
              {tiers.find(t => t.id === currentPlan)?.description}
            </p>
          </div>
        </div>

        {/* Section Title - Mobile Only */}
        <div className="md:hidden mb-6">
          <h2 className="text-lg font-black uppercase tracking-wider text-secondary">Upgrade Options</h2>
        </div>

        {/* Desktop/Tablet: Grid Layout */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {tiers.map((tier) => {
            const isCurrent = tier.id === currentPlan;
            const isHighlight = tier.id === 'professional';

            return (
              <div
                key={tier.id}
                className={`group relative rounded-3xl p-8 flex flex-col transition-all duration-500 hover:-translate-y-2 border-2 overflow-hidden ${
                  isCurrent
                    ? 'bg-surface border-primary/40 shadow-[0_0_30px_-12px_rgba(59,130,246,0.4)]'
                    : isHighlight
                    ? 'bg-[#0f172a] border-primary shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] scale-105 z-10'
                    : `bg-white/5 ${tier.color} hover:bg-white/10 hover:border-white/20`
                }`}
              >
                {/* Background Accent */}
                {(isCurrent || isHighlight) && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none"></div>
                )}

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className={`p-3 rounded-2xl ${isCurrent || isHighlight ? 'bg-primary shadow-xl shadow-primary/30' : 'bg-white/5'}`}>
                      {tier.icon}
                    </div>
                    <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      isCurrent || isHighlight ? 'bg-primary text-white' : 'bg-white/10 text-secondary/60'
                    }`}>
                      {isCurrent ? 'Current' : tier.badge}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-2xl font-black mb-2 text-white">{tier.name}</h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-black text-white">{tier.price}</span>
                      {tier.period && <span className="text-sm opacity-40 font-bold text-white">{tier.period}</span>}
                    </div>
                    {tier.savings && (
                      <div className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded inline-block">
                        {tier.savings}
                      </div>
                    )}
                  </div>

                  <p className="text-sm mb-8 leading-relaxed min-h-[4rem] text-secondary/70">
                    {tier.description}
                  </p>

                  {/* Highlights */}
                  <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <div className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2">Highlights</div>
                    <div className="flex flex-wrap gap-2">
                      {tier.buffs.map((buff, bIndex) => (
                        <div key={bIndex} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-bold text-white uppercase tracking-tighter">
                          <span className="text-primary">{buff.icon}</span>
                          {buff.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-10 flex-1">
                    <div className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2">Features</div>
                    {tier.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-start gap-3 text-sm font-medium">
                        <div className={`mt-0.5 p-0.5 rounded-full ${isCurrent || isHighlight ? 'bg-primary text-white' : 'bg-white/10 text-secondary/40'}`}>
                          <Check size={12} strokeWidth={4} />
                        </div>
                        <span className="text-secondary/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={isCurrent || isCheckingOut}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 ${
                      isCurrent
                        ? 'bg-surface border border-primary/30 text-primary cursor-default'
                        : isCheckingOut
                        ? 'bg-primary/50 text-white cursor-wait'
                        : isHighlight
                        ? 'bg-primary text-white hover:scale-105 shadow-xl shadow-primary/30'
                        : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 border border-white/10'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : isCheckingOut ? 'Loading...' : tier.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: Stacked Cards */}
        <div className="md:hidden space-y-4">
          {tiers.filter(t => t.id !== currentPlan).map((tier) => {
            const isExpanded = expandedCard === tier.id;
            const isHighlight = tier.id === 'professional';

            return (
              <div
                key={tier.id}
                className={`bg-surface border-2 rounded-2xl overflow-hidden transition-all ${
                  isHighlight ? 'border-primary/40' : 'border-secondary/20'
                }`}
              >
                {/* Card Header - Always Visible */}
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${isHighlight ? 'bg-primary/20 border border-primary/30' : 'bg-white/5'}`}>
                      {tier.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black text-white">{tier.name}</h3>
                        {isHighlight && (
                          <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-black rounded uppercase tracking-widest">
                            {tier.badge}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white">{tier.price}</span>
                          {tier.period && <span className="text-sm text-secondary">{tier.period}</span>}
                        </div>
                        {tier.savings && (
                          <div className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded mt-1 inline-block">
                            {tier.savings}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-secondary mb-4">
                    {tier.description}
                  </p>

                  {/* Highlights - Always Visible on Mobile */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tier.buffs.map((buff, bIndex) => (
                      <div key={bIndex} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-bold text-white uppercase tracking-tighter">
                        <span className="text-primary">{buff.icon}</span>
                        {buff.label}
                      </div>
                    ))}
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpand(tier.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-secondary hover:text-white"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {isExpanded ? 'Hide' : 'See'} Features
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expandable Features */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3 border-t border-secondary/10 pt-5 animate-in slide-in-from-top-2 duration-200">
                    {tier.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-start gap-3 text-sm font-medium">
                        <div className="mt-0.5 p-0.5 rounded-full bg-primary text-white flex-shrink-0">
                          <Check size={12} strokeWidth={4} />
                        </div>
                        <span className="text-secondary/80">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <div className="p-5 bg-background/40 border-t border-secondary/10">
                  <button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={isCheckingOut}
                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
                      isCheckingOut
                        ? 'bg-primary/50 text-white cursor-wait'
                        : isHighlight
                        ? 'bg-primary text-white hover:bg-cyan-400 shadow-lg shadow-primary/20'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isCheckingOut ? 'Loading...' : tier.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Plan;
