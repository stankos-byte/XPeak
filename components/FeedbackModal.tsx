
import React, { useState } from 'react';
import { X, Send, MessageSquare, Bug, Lightbulb, FileText } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'general' | 'bug' | 'feature';

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');

  if (!isOpen) return null;

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const typeLabels = {
        general: 'General Feedback',
        bug: 'Bug Report',
        feature: 'Feature Request'
    };

    const subject = encodeURIComponent(`LevelUp Life: ${typeLabels[feedbackType]}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:developer@example.com?subject=${subject}&body=${body}`;
    
    // Close modal after triggering email client
    onClose();
    setMessage('');
    setFeedbackType('general');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-secondary/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden shadow-primary/5 relative">
        <div className="flex items-center justify-between p-5 border-b border-secondary/20 bg-background/40">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-2">
            <MessageSquare size={20} className="text-primary" />
            Feedback
          </h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSendFeedback} className="p-6 space-y-6">
          
          <div>
             <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Feedback Type</label>
             <div className="grid grid-cols-3 gap-3">
                <button
                    type="button"
                    onClick={() => setFeedbackType('general')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5 ${feedbackType === 'general' ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-background border-secondary/20 text-secondary hover:border-secondary/50 hover:bg-surface'}`}
                >
                    <FileText size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">General</span>
                </button>
                <button
                    type="button"
                    onClick={() => setFeedbackType('bug')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5 ${feedbackType === 'bug' ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/10' : 'bg-background border-secondary/20 text-secondary hover:border-secondary/50 hover:bg-surface'}`}
                >
                    <Bug size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Bug Report</span>
                </button>
                <button
                    type="button"
                    onClick={() => setFeedbackType('feature')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5 ${feedbackType === 'feature' ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/10' : 'bg-background border-secondary/20 text-secondary hover:border-secondary/50 hover:bg-surface'}`}
                >
                    <Lightbulb size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Feature</span>
                </button>
             </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Message</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-background border border-secondary/30 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-secondary/40 font-medium h-32 resize-none"
              placeholder={feedbackType === 'bug' ? "Describe the bug and steps to reproduce..." : feedbackType === 'feature' ? "Describe the feature you'd like to see..." : "Share your thoughts..."}
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            disabled={!message.trim()}
            className="w-full bg-primary hover:bg-cyan-400 disabled:opacity-30 disabled:grayscale text-background font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <Send size={18} />
            Send Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
