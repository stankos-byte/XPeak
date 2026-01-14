import React, { useEffect } from 'react';
import { Swords, Zap, Target, TrendingUp, Sparkles, ArrowRight, Play, Facebook, Twitter, Instagram, Linkedin, Youtube, BarChart3, Globe, Download, Users } from 'lucide-react';

interface LandingViewProps {
  onGetStarted?: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onGetStarted }) => {
  // Reset theme attribute when landing page mounts to prevent app theme from affecting it
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.style.backgroundColor = '#0f172a';
    document.body.style.color = '#f8fafc';
  }, []);

  const features = [
    {
      icon: Target,
      title: 'Quest System',
      description: 'Break down goals into strategic quests. Complete tasks and earn XP rewards.',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      buttonText: 'Try Now'
    },
    {
      icon: Zap,
      title: 'Instant XP Tracking',
      description: 'Real-time XP calculation and level progression across all skill categories.',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      buttonText: 'Level Up'
    },
    {
      icon: BarChart3,
      title: 'Multiple Skill Trees',
      description: 'Track progress across Physical, Mental, Professional, Social & Creative skills.',
      color: 'from-primary to-blue-600',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      buttonText: 'Explore'
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description: 'Monitor your growth with detailed charts and insights in real-time.',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      buttonText: 'Track'
    },
    {
      icon: Globe,
      title: 'Social Challenges',
      description: 'XPeak connects you with friends for competitive challenges and motivation.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      buttonText: 'Compete'
    }
  ];

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-700 bg-gradient-to-b from-background via-background to-surface/20">
      {/* Header with Logo and Download Button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/30 shadow-[0_0_20px_rgba(0,225,255,0.2)]">
              <Swords size={28} className="text-primary" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">
              XPeak
            </h1>
          </div>
          
          {onGetStarted && (
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50"
            >
              <Download size={16} />
              Download Now
            </button>
          )}
        </div>
      </header>


      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-[600px] h-[600px] bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        {/* Halftone Dot Patterns - Brand Graphics */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top right circular fade */}
          <div className="absolute top-20 right-10 w-96 h-96 opacity-25">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, #3b82f6 2px, transparent 2px)',
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(circle, black 20%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle, black 20%, transparent 70%)'
            }}></div>
          </div>
          
          {/* Bottom left corner fade */}
          <div className="absolute bottom-10 left-10 w-96 h-96 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, #64748b 2px, transparent 2px)',
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(circle at bottom left, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(circle at bottom left, black 30%, transparent 75%)'
            }}></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div>
<h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                Empower Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                  Personal Growth
                </span> with <br />
                XPeak
              </h1>
              
              {onGetStarted && (
                <button
                  onClick={onGetStarted}
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-full font-bold text-sm transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105"
                >
                  <Download size={20} />
                  <span>Download App</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-12">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-500 border-2 border-background"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-background"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-400 border-2 border-background"></div>
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">3.1M</p>
                    <p className="text-secondary/60 text-xs">Active Users</p>
                  </div>
                </div>
                
                <div className="h-8 w-px bg-secondary/30"></div>
                
                <div className="text-secondary/60 text-xs flex items-center gap-2">
                  <span>Available on</span>
                  <div className="flex gap-1">
                    <div className="w-5 h-5 rounded-md bg-surface flex items-center justify-center">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <div className="w-5 h-5 rounded-md bg-surface flex items-center justify-center">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Laptop & Phone Mockup */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative">
                {/* Background glow effects */}
                <div className="absolute -inset-10 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl"></div>
                
                {/* Laptop Mockup */}
                <div className="relative">
                  {/* Laptop screen */}
                  <div className="relative w-[500px] h-[320px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-2xl border-4 border-gray-700 shadow-2xl overflow-hidden">
                    {/* Screen bezel */}
                    <div className="absolute inset-2 bg-surface rounded-lg overflow-hidden">
                      {/* Placeholder for screenshot - will be replaced later */}
                      <div className="w-full h-full bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Sparkles size={48} className="text-primary" />
                          </div>
                          <p className="text-white font-bold text-lg">XPeak Dashboard</p>
                          <p className="text-secondary/60 text-sm">Screenshot placeholder</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Webcam notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-800 rounded-b-lg"></div>
                  </div>
                  
                  {/* Laptop base */}
                  <div className="w-[520px] h-3 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-xl -ml-2.5"></div>
                  <div className="w-[560px] h-1.5 bg-gray-800 rounded-b-lg -ml-[30px] shadow-lg"></div>
                </div>
                
                {/* Phone Mockup - positioned at bottom right */}
                <div className="absolute -right-8 bottom-8">
                  {/* Phone glow */}
                  <div className="absolute inset-0 bg-primary/30 rounded-[2.5rem] blur-2xl"></div>
                  
                  {/* Phone frame */}
                  <div className="relative w-[180px] h-[360px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                    {/* Phone screen */}
                    <div className="w-full h-full bg-surface rounded-[1.8rem] overflow-hidden">
                      {/* Placeholder for screenshot - will be replaced later */}
                      <div className="w-full h-full bg-gradient-to-b from-surface to-background flex items-center justify-center p-6">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Target size={32} className="text-primary" />
                          </div>
                          <p className="text-white font-bold text-xs">Mobile App</p>
                          <p className="text-secondary/60 text-[10px]">Screenshot placeholder</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notch */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-gray-900 rounded-b-2xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Logos Section */}
      <section className="relative max-w-7xl mx-auto px-6 py-12 border-t border-secondary/10">
        {/* Uniform dot grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-8" style={{
          backgroundImage: 'radial-gradient(circle, #64748b 2px, transparent 2px)',
          backgroundSize: '24px 24px'
        }}></div>

        <div className="relative flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
          <span className="text-secondary font-bold text-sm">ProductHunt</span>
          <span className="text-secondary font-bold text-sm">TechCrunch</span>
          <span className="text-secondary font-bold text-sm">AppStore</span>
          <span className="text-secondary font-bold text-sm">LifeHacker</span>
          <span className="text-secondary font-bold text-sm">TheVerge</span>
          <span className="text-secondary font-bold text-sm">Wired</span>
          <span className="text-secondary font-bold text-sm">Forbes</span>
          <span className="text-secondary font-bold text-sm">Medium</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative max-w-7xl mx-auto px-6 py-20">
        {/* Dot pattern decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-20 w-80 h-80 opacity-15" style={{
            backgroundImage: 'radial-gradient(circle, #3b82f6 2px, transparent 2px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(circle, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 80%)'
          }}></div>
        </div>

        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-surface/80 border border-primary/30 rounded-full mb-4">
            <span className="text-primary text-xs font-bold uppercase tracking-wider">Highlights</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Meet the new era of productivity
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quest System - Large Green Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/30 transition-all">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-3">
                {features[0].title}
              </h3>
              <p className="text-white/90 text-sm mb-6 max-w-sm">
                {features[0].description}
              </p>
              <button className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-full font-bold text-sm hover:bg-gray-100 transition-all shadow-lg">
                {features[0].buttonText}
                <ArrowRight size={16} />
              </button>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                <Target size={64} className="text-white" />
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-white/5 rounded-full"></div>
            <div className="absolute -left-8 top-8 w-24 h-24 bg-white/5 rounded-full"></div>
          </div>

          {/* Instant Progress - Pink Card */}
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-pink-500/30 transition-all">
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-xl font-bold text-white mb-3">
                {features[1].title}
              </h3>
              <p className="text-white/90 text-sm mb-6">
                {features[1].description}
              </p>
              
              {/* Mock XP level UI */}
              <div className="mt-auto space-y-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
                  <span className="text-white text-xs font-medium">Level 10</span>
                  <span className="text-white text-sm font-bold">5,432 XP</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
                  <span className="text-white text-xs font-medium">Level 11</span>
                  <span className="text-white text-sm font-bold">6,000 XP</span>
                </div>
                <button className="w-full bg-white text-pink-600 px-4 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all">
                  {features[1].buttonText}
                </button>
              </div>
            </div>
          </div>

          {/* Multiple Categories - Blue Card */}
          <div className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/30 transition-all">
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-xl font-bold text-white mb-3">
                {features[2].title}
              </h3>
              <p className="text-white/90 text-sm mb-6">
                {features[2].description}
              </p>
              
              {/* Mock skill category boxes */}
              <div className="mt-auto space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center">
                    <BarChart3 size={24} className="text-white mb-1" />
                    <p className="text-white text-xs font-medium">Mental</p>
                  </div>
                  <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center">
                    <Users size={24} className="text-white mb-1" />
                    <p className="text-white text-xs font-medium">Social</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center">
                  <Target size={24} className="text-white mb-1" />
                  <p className="text-white text-xs font-medium">Professional</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics - Blue Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/30 transition-all">
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-xl font-bold text-white mb-3">
                {features[3].title}
              </h3>
              <p className="text-white/90 text-sm mb-6">
                {features[3].description}
              </p>
              
              {/* Mock chart */}
              <div className="mt-auto flex items-end gap-2 h-32">
                {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                  <div key={i} className="flex-1 bg-white/30 rounded-t-lg relative group-hover:bg-white/40 transition-all" style={{height: `${height}%`}}>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cross-Platform - Purple Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/30 transition-all">
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-xl font-bold text-white mb-3">
                {features[4].title}
              </h3>
              <p className="text-white/90 text-sm mb-6">
                {features[4].description}
              </p>
              
              {/* Globe icons */}
              <div className="mt-auto flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Globe size={32} className="text-purple-600" />
                </div>
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                  <Sparkles size={32} className="text-white" />
                </div>
                <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center">`r`n                  <Zap size={32} className="text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden pt-20">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
          </div>

          {/* Dot pattern overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle, #3b82f6 2px, transparent 2px)',
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(circle, black 35%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(circle, black 35%, transparent 75%)'
            }}></div>
            <div className="absolute bottom-10 left-10 w-64 h-64 opacity-15" style={{
              backgroundImage: 'radial-gradient(circle, #a855f7 2px, transparent 2px)',
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(circle, black 35%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(circle, black 35%, transparent 75%)'
            }}></div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
              Ready To Level Up Your Life?
            </h2>
            
            <p className="text-secondary text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users who are transforming their daily routines into an epic adventure. 
              Start your journey today and unlock your full potential.
            </p>

            {onGetStarted && (
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-5 rounded-full font-bold text-base transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105"
              >
                <Download size={20} />
                <span>Get Started Now</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface/50 border-t border-secondary/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-xl border border-primary/30">
                  <Swords size={28} className="text-primary" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">
                  XPeak
                </h3>
              </div>
              <p className="text-secondary/80 text-sm leading-relaxed mb-6">
                Transform your life into an epic journey. Complete quests, level up your skills, and achieve your goals with gamified productivity.
              </p>
              
              {/* Social Media Icons */}
              <div className="flex gap-3">
                <a href="#" className="p-2 bg-background border border-secondary/20 rounded-lg hover:border-primary/40 hover:bg-primary/10 transition-all group">
                  <Facebook size={20} className="text-secondary group-hover:text-primary transition-colors" />
                </a>
                <a href="#" className="p-2 bg-background border border-secondary/20 rounded-lg hover:border-primary/40 hover:bg-primary/10 transition-all group">
                  <Twitter size={20} className="text-secondary group-hover:text-primary transition-colors" />
                </a>
                <a href="#" className="p-2 bg-background border border-secondary/20 rounded-lg hover:border-primary/40 hover:bg-primary/10 transition-all group">
                  <Instagram size={20} className="text-secondary group-hover:text-primary transition-colors" />
                </a>
                <a href="#" className="p-2 bg-background border border-secondary/20 rounded-lg hover:border-primary/40 hover:bg-primary/10 transition-all group">
                  <Linkedin size={20} className="text-secondary group-hover:text-primary transition-colors" />
                </a>
                <a href="#" className="p-2 bg-background border border-secondary/20 rounded-lg hover:border-primary/40 hover:bg-primary/10 transition-all group">
                  <Youtube size={20} className="text-secondary group-hover:text-primary transition-colors" />
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="text-white font-black uppercase tracking-wider text-sm mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-secondary/80 hover:text-primary transition-colors text-sm">Features</a>
                </li>
                <li>
                  <a href="#" className="text-secondary/80 hover:text-primary transition-colors text-sm">Pricing</a>
                </li>
                <li>
                  <a href="#" className="text-secondary/80 hover:text-primary transition-colors text-sm">FAQ</a>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="text-white font-black uppercase tracking-wider text-sm mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-secondary/80 hover:text-primary transition-colors text-sm">About Us</a>
                </li>
                <li>
                  <a href="#" className="text-secondary/80 hover:text-primary transition-colors text-sm">Blog</a>
                </li>
                <li>
                  <a href="#" className="text-secondary/80 hover:text-primary transition-colors text-sm">
                    Feedback
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="text-white font-black uppercase tracking-wider text-sm mb-4">Get The App</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="inline-flex items-center gap-2 text-secondary/80 hover:text-primary transition-colors text-sm bg-background border border-secondary/20 rounded-lg px-4 py-2 hover:border-primary/40">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    iOS App
                  </a>
                </li>
                <li>
                  <a href="#" className="inline-flex items-center gap-2 text-secondary/80 hover:text-primary transition-colors text-sm bg-background border border-secondary/20 rounded-lg px-4 py-2 hover:border-primary/40">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    Android App
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-secondary/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-secondary/60 text-sm">
              © 2026 XPeak. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-secondary/60 hover:text-primary transition-colors">Support</a>
              <a href="#" className="text-secondary/60 hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-secondary/60 hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;

