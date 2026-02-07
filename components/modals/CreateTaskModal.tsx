
import React, { useState, useEffect } from 'react';
import { Difficulty, SkillCategory, Task, TaskTemplate } from '../../types';
import { X, ChevronDown, Save, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { analyzeTask } from '../../services/aiService';
import { DEBUG_FLAGS } from '../../config/debugFlags';
import { useSubscription } from '../../hooks/useSubscription';
import { useThrottle } from '../../hooks/useDebounce';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string, description: string, difficulty: Difficulty, skillCategory: SkillCategory, isHabit: boolean }) => void;
  editingTask?: Task | null;
  templates?: TaskTemplate[];
  onSaveTemplate?: (data: Omit<TaskTemplate, 'id'>) => void;
  onDeleteTemplate?: (id: string) => void;
  isQuestTask?: boolean;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingTask, 
  templates = [],
  onSaveTemplate,
  onDeleteTemplate,
  isQuestTask = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [skillCategory, setSkillCategory] = useState<SkillCategory>(SkillCategory.MISC);
  const [isHabit, setIsHabit] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const { requireAIAccess } = useSubscription();

  useEffect(() => {
    if (isOpen) {
      setShowTemplates(false);
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description || '');
        setDifficulty(editingTask.difficulty);
        setSkillCategory(editingTask.skillCategory);
        setIsHabit(editingTask.isHabit);
      } else {
        setTitle('');
        setDescription('');
        setDifficulty(Difficulty.EASY);
        setSkillCategory(SkillCategory.MISC);
        setIsHabit(false);
      }
    }
  }, [isOpen, editingTask]);

  // Internal function to execute AI task analysis
  const executeSmartAudit = async () => {
    if (!title.trim()) return;
    
    // Check AI access before making AI call (Pro OR free with credits)
    if (!requireAIAccess('AI Task Analysis')) {
      return;
    }
    
    setIsAuditing(true);
    try {
      const result = await analyzeTask(title);
      if (result.difficulty) setDifficulty(result.difficulty);
      if (result.skillCategory) setSkillCategory(result.skillCategory);
      if (result.suggestedDescription && !description) setDescription(result.suggestedDescription);
    } catch (error) {
      if (DEBUG_FLAGS.tasks) console.error("Smart Audit failed:", error);
    } finally {
      setIsAuditing(false);
    }
  };

  // Throttled version to prevent spamming (300ms cooldown)
  const handleSmartAudit = useThrottle(executeSmartAudit, 300);

  if (!isOpen) return null;

  const applyTemplate = (tpl: TaskTemplate) => {
    setTitle(tpl.title);
    setDescription(tpl.description || '');
    setDifficulty(tpl.difficulty);
    setSkillCategory(tpl.skillCategory);
    // If it's a quest task, force isHabit to false even if template has it true
    setIsHabit(isQuestTask ? false : tpl.isHabit);
    setShowTemplates(false);
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!title.trim() || !onSaveTemplate) return;
    onSaveTemplate({
      title,
      description,
      difficulty,
      skillCategory,
      isHabit
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, description, difficulty, skillCategory, isHabit });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="bg-surface border border-secondary/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden shadow-primary/5">
        <div className="flex items-center justify-between p-5 border-b border-secondary/20 bg-background/40">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">{editingTask ? 'Modify Objective' : 'New Objective'}</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-black text-secondary uppercase tracking-widest">Objective Title</label>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={handleSaveCurrentAsTemplate}
                  disabled={!title.trim()}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-primary disabled:opacity-30 transition-colors"
                >
                  <Save size={12} />
                  Save Template
                </button>
              </div>
            </div>
            
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-secondary/30 rounded-xl p-4 pr-12 text-white focus:ring-1 focus:ring-primary focus:border-transparent outline-none font-bold"
                  placeholder="Read documentation..."
                  autoFocus
                />
                <button 
                  type="button"
                  onClick={() => templates.length > 0 && setShowTemplates(!showTemplates)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${showTemplates ? 'text-primary' : 'text-secondary hover:text-primary'} ${templates.length === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  <ChevronDown size={20} className={`transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleSmartAudit}
                disabled={isAuditing || !title.trim()}
                className={`p-4 rounded-xl border transition-all flex items-center justify-center ${isAuditing ? 'bg-secondary/20 border-secondary' : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'}`}
                title="AI Analysis"
              >
                {isAuditing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              </button>
            </div>

            {showTemplates && templates.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-10 bg-surface border border-primary/30 rounded-xl shadow-2xl p-2 max-h-64 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                <div className="p-2 text-[10px] font-black text-secondary uppercase tracking-widest border-b border-secondary/10 mb-2">Saved Templates</div>
                {templates.map(tpl => (
                  <div key={tpl.id} className="flex items-center gap-2 group">
                    <button
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="flex-1 text-left p-3 hover:bg-primary/10 rounded-lg group/item transition-colors flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-200 group-hover/item:text-primary">{tpl.title}</span>
                        <span className="text-[8px] text-secondary uppercase font-black">{tpl.skillCategory} • {tpl.difficulty}</span>
                      </div>
                    </button>
                    <button 
                      type="button"
                      onClick={() => onDeleteTemplate?.(tpl.id)}
                      className="p-2 text-secondary hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-secondary/30 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary focus:border-transparent outline-none h-24 resize-none font-medium"
              placeholder="Sector details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5">Complexity</label>
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full bg-background border border-secondary/30 rounded-xl p-4 text-white outline-none font-bold appearance-none cursor-pointer"
              >
                {Object.values(Difficulty).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5">Skill Category</label>
              <select 
                value={skillCategory} 
                onChange={(e) => setSkillCategory(e.target.value as SkillCategory)}
                className="w-full bg-background border border-secondary/30 rounded-xl p-4 text-white outline-none font-bold appearance-none cursor-pointer"
              >
                {Object.values(SkillCategory).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {!isQuestTask && (
            <div className="flex items-center gap-3 py-2">
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input 
                      type="checkbox" 
                      id="toggle-habit" 
                      checked={isHabit}
                      onChange={(e) => setIsHabit(e.target.checked)}
                      className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300"
                      style={{ left: isHabit ? '1.5rem' : '0', borderColor: isHabit ? '#00E1FF' : '#505353' }}
                  />
                  <label 
                      htmlFor="toggle-habit" 
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${isHabit ? 'bg-primary' : 'bg-secondary'}`}
                  ></label>
              </div>
              <label htmlFor="toggle-habit" className="text-xs font-black text-white uppercase tracking-widest cursor-pointer">
                Recurring Habit
              </label>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-cyan-400 text-background font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 mt-4"
          >
            {editingTask ? 'Update Objective' : 'Create Objective'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
