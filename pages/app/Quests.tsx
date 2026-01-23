import React, { useState } from 'react';
import { MainQuest, Task, QuestTask } from '../../types';
import { Crown, Pencil, PlusCircle, Sparkles, Trash2, ChevronDown, ChevronRight, Plus, Loader2, MoreVertical } from 'lucide-react';
import TaskCard from '../../components/cards/TaskCard';

interface QuestsViewProps {
  mainQuests: MainQuest[];
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  setTextModalConfig: (config: { isOpen: boolean; type: 'quest' | 'category' | 'edit-quest' | 'edit-category' | null; parentId?: string; categoryId?: string; initialValue?: string; }) => void;
  setQuestTaskConfig: (config: { isOpen: boolean; questId?: string; categoryId?: string; editingTask?: QuestTask | null; }) => void;
  handleToggleQuestTask: (qid: string, cid: string, tid: string) => void;
  handleQuestOracle: (quest: MainQuest) => void;
  oraclingQuestId: string | null;
  handleDeleteQuest: (id: string) => void;
  handleDeleteCategory: (questId: string, categoryId: string) => void;
  handleDeleteQuestTask: (questId: string, categoryId: string, taskId: string) => void;
  handleSaveTemplate: (task: Task) => void;
  popups: Record<string, number>;
}

const QuestsView: React.FC<QuestsViewProps> = ({ 
  mainQuests, 
  expandedNodes, 
  toggleNode, 
  setTextModalConfig, 
  setQuestTaskConfig, 
  handleToggleQuestTask, 
  handleQuestOracle, 
  oraclingQuestId, 
  handleDeleteQuest, 
  handleDeleteCategory, 
  handleDeleteQuestTask, 
  handleSaveTemplate, 
  popups 
}) => {
  const [mobileMenuId, setMobileMenuId] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-500 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-1 uppercase tracking-tighter italic">Operations</h1>
          <p className="text-secondary font-medium tracking-wide">Strategic breakdown of complex tasks into mastery paths.</p>
        </div>
        <button 
          onClick={() => setTextModalConfig({ isOpen: true, type: 'quest' })}
          className="flex items-center gap-2 bg-primary hover:bg-cyan-400 text-background px-6 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 w-full md:w-auto justify-center"
        >
          <Plus size={20} strokeWidth={3} />
          Create Operation
        </button>
      </header>
      
      <div className="space-y-6">
        {mainQuests.map((mainQuest) => {
          const isMainExpanded = expandedNodes.has(mainQuest.id);
          const isOracling = oraclingQuestId === mainQuest.id;
          const isMobileMenuOpen = mobileMenuId === mainQuest.id;

          return (
            <div key={mainQuest.id} className="bg-surface border border-secondary/10 rounded-2xl overflow-hidden shadow-xl transition-all relative">
              {popups[`quest-bonus-${mainQuest.id}`] !== undefined && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-xp-float flex items-center gap-2 whitespace-nowrap">
                  <span className={`text-2xl font-black drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] ${popups[`quest-bonus-${mainQuest.id}`] > 0 ? 'text-primary' : 'text-red-400'}`}>
                            {popups[`quest-bonus-${mainQuest.id}`] > 0 ? `+${popups[`quest-bonus-${mainQuest.id}`]}` : popups[`quest-bonus-${mainQuest.id}`]} XP [COMPLETION BONUS]
                  </span>
                  <Sparkles className="text-primary animate-pulse" size={24} />
                </div>
              )}

              <div 
                className={`p-6 bg-background border-b border-secondary/10 cursor-pointer hover:bg-surface transition-colors flex flex-col group/q`}
                onClick={() => toggleNode(mainQuest.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-primary"><Crown size={28} /></div>
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic">{mainQuest.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setTextModalConfig({ isOpen: true, type: 'edit-quest', parentId: mainQuest.id, initialValue: mainQuest.title }); }}
                        className="p-2.5 rounded-xl border border-secondary/20 text-secondary hover:text-primary hover:border-primary/40 transition-all"
                        title="Edit Operation Title"
                      >
                        <Pencil size={20} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setTextModalConfig({ isOpen: true, type: 'category', parentId: mainQuest.id }); }}
                        className="p-2.5 rounded-xl border border-secondary/20 text-secondary hover:text-primary hover:border-primary/40 transition-all"
                        title="Add Phase"
                      >
                        <PlusCircle size={20} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleQuestOracle(mainQuest); }}
                        disabled={isOracling}
                        className={`p-2.5 rounded-xl transition-all border ${isOracling ? 'border-primary text-primary animate-pulse' : 'border-secondary/20 text-secondary hover:text-primary hover:border-primary/40'}`}
                        title="Generate Breakdown"
                      >
                        {isOracling ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteQuest(mainQuest.id); }}
                        className="p-2.5 rounded-xl border border-secondary/20 text-secondary hover:text-red-400 hover:border-red-400/40 transition-all"
                        title="Delete Operation"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMobileMenuId(isMobileMenuOpen ? null : mainQuest.id); }}
                      className={`md:hidden p-2 rounded-xl border border-secondary/20 text-secondary hover:text-primary transition-colors ${isMobileMenuOpen ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
                    >
                      <MoreVertical size={24} />
                    </button>
                    
                    <div className="text-secondary ml-1">{isMainExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}</div>
                  </div>
                </div>

                {/* Mobile Menu Actions */}
                {isMobileMenuOpen && (
                  <div className="md:hidden mt-4 pt-4 border-t border-secondary/10 flex items-center justify-between gap-2 animate-in slide-in-from-top-2 fade-in">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTextModalConfig({ isOpen: true, type: 'edit-quest', parentId: mainQuest.id, initialValue: mainQuest.title }); setMobileMenuId(null); }}
                      className="flex-1 p-3 rounded-xl border border-secondary/20 text-secondary hover:text-primary hover:border-primary/40 transition-all flex justify-center bg-surface"
                      title="Edit"
                    >
                      <Pencil size={20} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTextModalConfig({ isOpen: true, type: 'category', parentId: mainQuest.id }); setMobileMenuId(null); }}
                      className="flex-1 p-3 rounded-xl border border-secondary/20 text-secondary hover:text-primary hover:border-primary/40 transition-all flex justify-center bg-surface"
                      title="Add Section"
                    >
                      <PlusCircle size={20} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleQuestOracle(mainQuest); setMobileMenuId(null); }}
                      disabled={isOracling}
                      className={`flex-1 p-3 rounded-xl border transition-all flex justify-center bg-surface ${isOracling ? 'border-primary text-primary animate-pulse' : 'border-secondary/20 text-secondary hover:text-primary hover:border-primary/40'}`}
                      title="AI Oracle"
                    >
                      {isOracling ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteQuest(mainQuest.id); setMobileMenuId(null); }}
                      className="flex-1 p-3 rounded-xl border border-secondary/20 text-secondary hover:text-red-400 hover:border-red-400/40 transition-all flex justify-center bg-surface"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>
              
              {isMainExpanded && (
                <div className="p-6 space-y-8 bg-surface animate-in slide-in-from-top-2">
                  {mainQuest.categories.map((category) => (
                    <div key={category.id} className="space-y-4 group/c relative">
                      {popups[`section-bonus-${category.id}`] !== undefined && (
                        <div className="absolute -top-6 right-10 z-50 pointer-events-none animate-xp-float flex items-center gap-1 whitespace-nowrap">
                          <span className={`text-lg font-black drop-shadow-[0_0_12px_rgba(0,0,0,0.8)] ${popups[`section-bonus-${category.id}`] > 0 ? 'text-primary' : 'text-red-400'}`}>
                            {popups[`section-bonus-${category.id}`] > 0 ? `+${popups[`section-bonus-${category.id}`]}` : popups[`section-bonus-${category.id}`]} XP [PHASE BONUS]
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-l-4 border-primary/40 pl-4 py-1">
                        <h3 className="text-base md:text-lg font-black text-primary uppercase tracking-widest italic">{category.title}</h3>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setTextModalConfig({ isOpen: true, type: 'edit-category', parentId: mainQuest.id, categoryId: category.id, initialValue: category.title })}
                            className="p-1.5 text-secondary hover:text-primary transition-all"
                            title="Edit Phase Title"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => setQuestTaskConfig({ isOpen: true, questId: mainQuest.id, categoryId: category.id })}
                            className="p-1.5 text-secondary hover:text-primary transition-all"
                            title="Add Task"
                          >
                            <PlusCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(mainQuest.id, category.id)}
                            className="p-1.5 text-secondary hover:text-red-400 transition-all"
                            title="Delete Phase"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="pl-6 space-y-4">
                        {category.tasks.map((task) => {
                          const mappedTask: Task = {
                            id: task.task_id,
                            title: task.name,
                            description: task.description,
                            difficulty: task.difficulty,
                            skillCategory: task.skillCategory,
                            completed: task.completed,
                            isHabit: false,
                            streak: 0,
                            lastCompletedDate: null,
                            createdAt: ''
                          };

                          return (
                            <TaskCard 
                              key={task.task_id}
                              task={mappedTask}
                              onComplete={() => handleToggleQuestTask(mainQuest.id, category.id, task.task_id)}
                              onUncomplete={() => handleToggleQuestTask(mainQuest.id, category.id, task.task_id)}
                              onDelete={() => handleDeleteQuestTask(mainQuest.id, category.id, task.task_id)}
                              onEdit={() => setQuestTaskConfig({ isOpen: true, questId: mainQuest.id, categoryId: category.id, editingTask: task })}
                              onSaveTemplate={() => handleSaveTemplate(mappedTask)}
                              activePopup={popups[task.task_id]}
                            />
                          );
                        })}
                        
                        {category.tasks.length === 0 && (
                          <p className="text-[10px] text-secondary/40 font-black uppercase tracking-widest p-4 border border-dashed border-secondary/10 rounded-xl text-center">No tasks in this phase</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {mainQuest.categories.length === 0 && (
                    <div className="text-center py-10 bg-background/20 rounded-2xl border border-dashed border-secondary/10">
                      <p className="text-secondary font-black uppercase tracking-widest text-xs italic">No phases defined.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestsView;

