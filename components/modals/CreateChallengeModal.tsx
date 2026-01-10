
import React, { useState, useEffect } from 'react';
import { Friend, FriendChallenge } from '../../types';
import { X, Swords, Target, Trophy, Users } from 'lucide-react';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  onSubmit: (data: any) => void;
}

const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({ isOpen, onClose, friends, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [opponentId, setOpponentId] = useState('');
  const [metric, setMetric] = useState<'XP' | 'Tasks' | 'Streak'>('XP');
  const [targetValue, setTargetValue] = useState<string>('100');
  const [rewardXP, setRewardXP] = useState<string>('50');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setOpponentId(friends.length > 0 ? friends[0].id : '');
      setMetric('XP');
      setTargetValue('100');
      setRewardXP('50');
    }
  }, [isOpen, friends]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !opponentId) return;

    onSubmit({
      title,
      description,
      opponentId,
      metric,
      targetValue: parseInt(targetValue) || 100,
      rewardXP: parseInt(rewardXP) || 50,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-secondary/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden shadow-primary/5">
        <div className="flex items-center justify-between p-5 border-b border-secondary/20 bg-background/40">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-2">
            <Swords size={20} className="text-primary" />
            New Contract
          </h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div>
            <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5">Challenge Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-secondary/30 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary focus:border-transparent outline-none font-bold placeholder-secondary/30"
              placeholder="e.g. The Week of Power"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5">Opponent</label>
                <div className="relative">
                    <select 
                        value={opponentId}
                        onChange={(e) => setOpponentId(e.target.value)}
                        className="w-full bg-background border border-secondary/30 rounded-xl p-4 text-white outline-none font-bold appearance-none cursor-pointer"
                        disabled={friends.length === 0}
                    >
                        {friends.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                        {friends.length === 0 && <option value="">No Operatives Found</option>}
                    </select>
                    <Users size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                </div>
             </div>
             <div>
                <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5">Victory Metric</label>
                <div className="relative">
                    <select 
                        value={metric}
                        onChange={(e) => setMetric(e.target.value as any)}
                        className="w-full bg-background border border-secondary/30 rounded-xl p-4 text-white outline-none font-bold appearance-none cursor-pointer"
                    >
                        <option value="XP">Total XP</option>
                        <option value="Tasks">Tasks Done</option>
                        <option value="Streak">Highest Streak</option>
                    </select>
                    <Target size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5">Target Goal</label>
                <input 
                    type="number" 
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full bg-background border border-secondary/30 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary focus:border-transparent outline-none font-bold"
                />
             </div>
             <div>
                <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5">Bounty (XP)</label>
                <input 
                    type="number" 
                    value={rewardXP}
                    onChange={(e) => setRewardXP(e.target.value)}
                    className="w-full bg-background border border-secondary/30 rounded-xl p-4 text-primary focus:ring-1 focus:ring-primary focus:border-transparent outline-none font-black"
                />
             </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5">Terms & Conditions</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-secondary/30 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary focus:border-transparent outline-none font-medium h-24 resize-none placeholder-secondary/30"
              placeholder="Describe the rules of engagement..."
            />
          </div>

          <button 
            type="submit" 
            disabled={!title.trim() || !opponentId}
            className="w-full bg-primary hover:bg-cyan-400 disabled:opacity-30 disabled:grayscale text-background font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <Swords size={18} />
            Deploy Challenge
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateChallengeModal;
