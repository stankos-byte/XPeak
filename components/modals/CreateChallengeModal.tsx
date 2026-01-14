
import React, { useState, useEffect } from 'react';
import { Friend, ChallengeQuestCategory, ChallengeQuestTask, Difficulty, SkillCategory, ChallengeModeType, FriendChallenge } from '../../types';
import { X, Swords, Trophy, Users, Plus, Trash2, Edit, ChevronDown, ChevronRight } from 'lucide-react';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  editingChallenge?: FriendChallenge | null;
  onSubmit: (data: any) => void;
}

const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({ isOpen, onClose, friends, editingChallenge, onSubmit }) => {
  const [challengeType, setChallengeType] = useState<ChallengeModeType>('competitive');
  const [title, setTitle] = useState('');
  const [partnerIds, setPartnerIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<ChallengeQuestCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // For adding/editing categories
  const [editingCategory, setEditingCategory] = useState<{ id: string; title: string } | null>(null);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  
  // For adding/editing tasks
  const [editingTask, setEditingTask] = useState<{ categoryId: string; task: ChallengeQuestTask } | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [newTaskSkill, setNewTaskSkill] = useState<SkillCategory>(SkillCategory.MISC);
  const [taskFormCategoryId, setTaskFormCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingChallenge) {
        // Populate form with editing challenge data
        setTitle(editingChallenge.title);
        setPartnerIds(editingChallenge.partnerIds);
        setChallengeType(editingChallenge.mode);
        setCategories(editingChallenge.categories);
        setExpandedCategories(new Set(editingChallenge.categories.map(c => c.id)));
      } else {
        // Reset form for new challenge
        setTitle('');
        setPartnerIds([]);
        setChallengeType('competitive');
        setCategories([]);
        setExpandedCategories(new Set());
      }
      setEditingCategory(null);
      setNewCategoryTitle('');
      setEditingTask(null);
      setNewTaskName('');
      setNewTaskDescription('');
      setNewTaskDifficulty(Difficulty.EASY);
      setNewTaskSkill(SkillCategory.MISC);
      setTaskFormCategoryId(null);
    }
  }, [isOpen, editingChallenge, friends]);

  if (!isOpen) return null;

  const togglePartner = (friendId: string) => {
    setPartnerIds(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleAddCategory = () => {
    if (!newCategoryTitle.trim()) return;
    const newCategory: ChallengeQuestCategory = {
      id: `cat-${Date.now()}`,
      title: newCategoryTitle,
      tasks: []
    };
    setCategories([...categories, newCategory]);
    setExpandedCategories(new Set([...expandedCategories, newCategory.id]));
    setNewCategoryTitle('');
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategoryTitle.trim()) return;
    setCategories(categories.map(cat => 
      cat.id === editingCategory.id ? { ...cat, title: newCategoryTitle } : cat
    ));
    setEditingCategory(null);
    setNewCategoryTitle('');
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
    const newExpanded = new Set(expandedCategories);
    newExpanded.delete(categoryId);
    setExpandedCategories(newExpanded);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddTask = (categoryId: string) => {
    if (!newTaskName.trim()) return;
    const newTask: ChallengeQuestTask = {
      task_id: `task-${Date.now()}`,
      name: newTaskName,
      difficulty: newTaskDifficulty,
      skillCategory: newTaskSkill,
      description: newTaskDescription || undefined,
      // Set status fields based on mode
      ...(challengeType === 'coop' 
        ? { status: 'pending' as const }
        : { myStatus: 'pending' as const, opponentStatus: 'pending' as const }
      )
    };
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, tasks: [...cat.tasks, newTask] } : cat
    ));
    setNewTaskName('');
    setNewTaskDescription('');
    setNewTaskDifficulty(Difficulty.EASY);
    setNewTaskSkill(SkillCategory.MISC);
    setTaskFormCategoryId(null);
  };

  const handleUpdateTask = () => {
    if (!editingTask || !newTaskName.trim()) return;
    setCategories(categories.map(cat => 
      cat.id === editingTask.categoryId 
        ? { 
            ...cat, 
            tasks: cat.tasks.map(task => 
              task.task_id === editingTask.task.task_id 
                ? { 
                    ...task, 
                    name: newTaskName,
                    description: newTaskDescription || undefined,
                    difficulty: newTaskDifficulty,
                    skillCategory: newTaskSkill
                  }
                : task
            )
          }
        : cat
    ));
    setEditingTask(null);
    setNewTaskName('');
    setNewTaskDescription('');
    setNewTaskDifficulty(Difficulty.EASY);
    setNewTaskSkill(SkillCategory.MISC);
  };

  const handleDeleteTask = (categoryId: string, taskId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, tasks: cat.tasks.filter(t => t.task_id !== taskId) } : cat
    ));
  };

  const startEditCategory = (category: ChallengeQuestCategory) => {
    setEditingCategory({ id: category.id, title: category.title });
    setNewCategoryTitle(category.title);
  };

  const startEditTask = (categoryId: string, task: ChallengeQuestTask) => {
    setEditingTask({ categoryId, task });
    setNewTaskName(task.name);
    setNewTaskDescription(task.description || '');
    setNewTaskDifficulty(task.difficulty);
    setNewTaskSkill(task.skillCategory);
    setTaskFormCategoryId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || partnerIds.length === 0) return;

    onSubmit({
      title,
      description: '',
      partnerIds,
      categories,
      mode: challengeType,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-secondary/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden shadow-primary/5">
        <div className="flex items-center justify-between p-5 border-b border-secondary/20 bg-background/40">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-2">
            <Swords size={20} className="text-primary" />
            {editingChallenge ? 'Modify Contract' : 'New Contract'}
          </h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          
          {/* Mode Selector */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setChallengeType('competitive')}
              className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                challengeType === 'competitive' 
                  ? 'bg-red-500 text-background shadow-lg shadow-red-500/20' 
                  : 'bg-background border border-secondary/30 text-secondary hover:text-white'
              }`}
            >
              <Trophy size={16} />
              Competitive
            </button>
            <button
              type="button"
              onClick={() => setChallengeType('coop')}
              className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                challengeType === 'coop' 
                  ? 'bg-emerald-500 text-background shadow-lg shadow-emerald-500/20' 
                  : 'bg-background border border-secondary/30 text-secondary hover:text-white'
              }`}
            >
              <Users size={16} />
              Co-Op
            </button>
          </div>
          
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

          <div>
            <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5">
              {challengeType === 'coop' ? 'Partners' : 'Opponents'} ({partnerIds.length} selected)
            </label>
            <p className="text-xs text-secondary/70 mb-2 font-medium">
              {challengeType === 'coop' 
                ? '✓ Select multiple teammates for cooperative missions' 
                : '✓ Select one or more opponents to compete against'}
            </p>
            {friends.length === 0 ? (
              <div className="bg-background border border-secondary/30 rounded-xl p-4 text-secondary font-bold text-center">
                No Operatives Found
              </div>
            ) : (
              <div className="bg-background border border-secondary/30 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                {friends.map(friend => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => togglePartner(friend.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      partnerIds.includes(friend.id)
                        ? 'bg-primary/20 border border-primary/50 shadow-lg shadow-primary/10'
                        : 'bg-surface border border-secondary/20 hover:border-secondary/40'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      partnerIds.includes(friend.id)
                        ? 'bg-primary border-primary'
                        : 'bg-transparent border-secondary/50'
                    }`}>
                      {partnerIds.includes(friend.id) && (
                        <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: friend.color }}
                    />
                    <span className={`font-bold flex-1 text-left ${
                      partnerIds.includes(friend.id) ? 'text-white' : 'text-secondary'
                    }`}>
                      {friend.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quest Builder */}
          <div className="border-t border-secondary/20 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black text-secondary uppercase tracking-widest">Quest Structure</label>
              <span className="text-xs text-secondary font-bold">{categories.length} Section{categories.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Add/Edit Category Form */}
            <div className="bg-background/50 border border-secondary/20 rounded-xl p-4 space-y-3">
              <input
                type="text"
                value={newCategoryTitle}
                onChange={(e) => setNewCategoryTitle(e.target.value)}
                placeholder="Section title (e.g., Week 1 - Warmup)"
                className="w-full bg-background border border-secondary/30 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none font-medium placeholder-secondary/30"
              />
              <div className="flex gap-2">
                {editingCategory ? (
                  <>
                    <button
                      type="button"
                      onClick={handleUpdateCategory}
                      className="flex-1 bg-primary hover:bg-cyan-400 text-background font-bold uppercase tracking-widest text-xs py-2 rounded-lg transition-all"
                    >
                      Update Section
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingCategory(null); setNewCategoryTitle(''); }}
                      className="px-4 bg-secondary/20 hover:bg-secondary/30 text-secondary font-bold uppercase tracking-widest text-xs py-2 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryTitle.trim()}
                    className="w-full bg-primary hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed text-background font-bold uppercase tracking-widest text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add Section
                  </button>
                )}
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-3">
              {categories.map((category) => {
                const isExpanded = expandedCategories.has(category.id);
                return (
                  <div key={category.id} className="bg-surface border border-secondary/20 rounded-xl overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-background/50 transition-colors"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={16} className="text-secondary" /> : <ChevronRight size={16} className="text-secondary" />}
                        <span className="font-bold text-white text-sm">{category.title}</span>
                        <span className="text-xs text-secondary">({category.tasks.length} task{category.tasks.length !== 1 ? 's' : ''})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); startEditCategory(category); }}
                          className="p-1.5 text-secondary hover:text-primary transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                          className="p-1.5 text-secondary hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3 pt-0 space-y-3">
                        {/* Task Form */}
                        {(taskFormCategoryId === category.id || editingTask?.categoryId === category.id) && (
                          <div className="bg-background border border-secondary/30 rounded-lg p-3 space-y-3">
                            <input
                              type="text"
                              value={newTaskName}
                              onChange={(e) => setNewTaskName(e.target.value)}
                              placeholder="Task name"
                              className="w-full bg-surface border border-secondary/30 rounded-lg p-2 text-white text-sm focus:ring-1 focus:ring-primary outline-none font-medium placeholder-secondary/30"
                            />
                            <textarea
                              value={newTaskDescription}
                              onChange={(e) => setNewTaskDescription(e.target.value)}
                              placeholder="Description (optional)"
                              className="w-full bg-surface border border-secondary/30 rounded-lg p-2 text-white text-sm focus:ring-1 focus:ring-primary outline-none font-medium h-16 resize-none placeholder-secondary/30"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={newTaskDifficulty}
                                onChange={(e) => setNewTaskDifficulty(e.target.value as Difficulty)}
                                className="bg-surface border border-secondary/30 rounded-lg p-2 text-white text-xs font-bold outline-none"
                              >
                                {Object.values(Difficulty).map(d => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                              <select
                                value={newTaskSkill}
                                onChange={(e) => setNewTaskSkill(e.target.value as SkillCategory)}
                                className="bg-surface border border-secondary/30 rounded-lg p-2 text-white text-xs font-bold outline-none"
                              >
                                {Object.values(SkillCategory).map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              {editingTask ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleUpdateTask}
                                    className="flex-1 bg-primary hover:bg-cyan-400 text-background font-bold uppercase text-xs py-2 rounded-lg"
                                  >
                                    Update
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTask(null);
                                      setNewTaskName('');
                                      setNewTaskDescription('');
                                      setNewTaskDifficulty(Difficulty.EASY);
                                      setNewTaskSkill(SkillCategory.MISC);
                                    }}
                                    className="px-4 bg-secondary/20 hover:bg-secondary/30 text-secondary font-bold uppercase text-xs py-2 rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleAddTask(category.id)}
                                    disabled={!newTaskName.trim()}
                                    className="flex-1 bg-primary hover:bg-cyan-400 disabled:opacity-30 text-background font-bold uppercase text-xs py-2 rounded-lg"
                                  >
                                    Add Task
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTaskFormCategoryId(null)}
                                    className="px-4 bg-secondary/20 hover:bg-secondary/30 text-secondary font-bold uppercase text-xs py-2 rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Tasks List */}
                        {category.tasks.map((task) => (
                          <div key={task.task_id} className="bg-background/50 border border-secondary/20 rounded-lg p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-bold text-white text-sm">{task.name}</div>
                                {task.description && (
                                  <div className="text-xs text-secondary mt-1">{task.description}</div>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/20 text-primary">{task.difficulty}</span>
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-secondary/20 text-secondary">{task.skillCategory}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditTask(category.id, task)}
                                  className="p-1.5 text-secondary hover:text-primary transition-colors"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(category.id, task.task_id)}
                                  className="p-1.5 text-secondary hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Add Task Button */}
                        {taskFormCategoryId !== category.id && !editingTask && (
                          <button
                            type="button"
                            onClick={() => setTaskFormCategoryId(category.id)}
                            className="w-full border border-dashed border-secondary/30 rounded-lg p-3 text-secondary hover:text-primary hover:border-primary/30 transition-colors flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider"
                          >
                            <Plus size={16} /> Add Task
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!title.trim() || partnerIds.length === 0 || categories.length === 0}
            className="w-full bg-background hover:bg-background/80 disabled:opacity-30 disabled:grayscale text-white font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all border border-secondary/30 flex items-center justify-center gap-2"
          >
            <Swords size={18} />
            {editingChallenge 
              ? 'Update Contract' 
              : (challengeType === 'coop' ? 'Deploy Mission' : 'Deploy Contract')
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateChallengeModal;
