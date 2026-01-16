import React, { useState } from 'react';
import BaseInfoPage from './BaseInfoPage';
import { Send, Star, MessageSquare, ThumbsUp, Bug, Lightbulb, Heart, Target } from 'lucide-react';

const Feedback = () => {
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [category, setCategory] = useState('general');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const categories = [
    { id: 'general', label: 'General', icon: <MessageSquare size={16} /> },
    { id: 'bug', label: 'Report Bug', icon: <Bug size={16} /> },
    { id: 'feature', label: 'Feature Request', icon: <Lightbulb size={16} /> },
    { id: 'love', label: 'Praise', icon: <Heart size={16} /> }
  ];

  if (submitted) {
    return (
      <BaseInfoPage title="Feedback Sent!">
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[3rem] p-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_-10px_rgba(59,130,246,0.5)] transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
              <Send size={40} className="text-white ml-1" />
            </div>
            <h2 className="text-4xl font-black text-white mb-6 italic tracking-tight">Thank You!</h2>
            <p className="text-secondary/80 max-w-lg mx-auto mb-12 text-lg leading-relaxed font-medium">
              Your feedback has been received. We'll use your insights to continue improving XPeak for everyone.
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-xl shadow-primary/20"
              >
                Back to Dashboard
              </button>
              <button 
                onClick={() => setSubmitted(false)}
                className="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-all"
              >
                Send Another
              </button>
            </div>
          </div>
        </div>
      </BaseInfoPage>
    );
  }

  return (
    <BaseInfoPage title="Send Feedback">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
        <div className="space-y-12">
          <div className="space-y-6">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                Your Voice Matters
             </div>
             <h2 className="text-4xl md:text-5xl font-black text-white leading-tight italic tracking-tight">
               Help us build a <span className="text-primary not-italic">better product.</span>
             </h2>
             <p className="text-xl text-secondary/80 leading-relaxed max-w-lg font-medium">
               How's your experience so far? Whether it's a bug that needs fixing or a feature that would make your workflow better, we're listening.
             </p>
          </div>

          <div className="space-y-8">
             <div className="flex items-center gap-4 group cursor-pointer p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                   <ThumbsUp size={24} />
                </div>
                <div>
                   <h4 className="text-white font-bold mb-0.5">Feature Requests</h4>
                   <p className="text-secondary/40 text-[10px] font-black uppercase tracking-widest">See what others are requesting</p>
                </div>
             </div>
             <div className="flex items-center gap-4 group cursor-pointer p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                   <Target size={24} />
                </div>
                <div>
                   <h4 className="text-white font-bold mb-0.5">Known Issues</h4>
                   <p className="text-secondary/40 text-[10px] font-black uppercase tracking-widest">View current technical issues</p>
                </div>
             </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <form 
            onSubmit={handleSubmit} 
            className="relative z-10 space-y-8 bg-[#1e293b] border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl"
          >
            {/* Category Toggle */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-2">Select Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      category === cat.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'bg-white/5 border border-white/10 text-secondary/40 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-2">Overall Experience</label>
              <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className="group relative"
                  >
                    <Star 
                      size={32} 
                      className={`transition-all duration-300 ${
                        (hoveredRating || rating) >= star 
                        ? 'text-primary scale-110' 
                        : 'text-secondary/20'
                      }`}
                      fill={(hoveredRating || rating) >= star ? "currentColor" : "none"}
                    />
                    {rating === star && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-ping"></div>
                    )}
                  </button>
                ))}
                <div className="ml-auto flex items-center">
                   <span className="text-white font-black text-xl italic">{rating || 0}<span className="text-secondary/20 not-italic">/5</span></span>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-2">Your Message</label>
              <textarea 
                required
                className="w-full h-40 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-white placeholder:text-secondary/40 focus:outline-none focus:border-primary focus:bg-white/10 transition-all resize-none font-medium leading-relaxed"
                placeholder={
                  category === 'bug' ? "What happened? How can we reproduce it?" :
                  category === 'feature' ? "Describe your feature idea..." :
                  "Tell us what's on your mind..."
                }
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-primary text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform shadow-2xl shadow-primary/20"
            >
              <Send size={20} className="ml-1" />
              Send Feedback
            </button>
            
            <p className="text-center text-[10px] font-black text-secondary/40 uppercase tracking-widest">
               Your feedback is encrypted and secure
            </p>
          </form>
        </div>
      </div>
    </BaseInfoPage>
  );
};

export default Feedback;
