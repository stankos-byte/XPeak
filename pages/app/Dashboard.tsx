import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, UserProfile } from '../../types';
import { Sparkles, Trophy, Plus, History, CheckCircle2, Trash2 } from 'lucide-react';
import TaskCard from '../../components/cards/TaskCard';
import { SKILL_COLORS } from '../../constants';
import { formatCompletedDate } from '../../utils/date';

interface DashboardViewProps {
  user: UserProfile;
  tasks: Task[];
  handleCompleteTask: (id: string) => void;
  handleUncompleteTask: (id: string) => void;
  handleDeleteTask: (id: string) => void;
  handleEditTask: (task: Task) => void;
  handleSaveTemplate: (task: Task) => void;
  setIsModalOpen: (open: boolean) => void;
  setEditingTask: (task: Task | null) => void;
  levelProgress: { current: number; max: number; percentage: number };
  popups: Record<string, number>;
  flashKey: number;
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  user, 
  tasks, 
  handleCompleteTask, 
  handleUncompleteTask, 
  handleDeleteTask, 
  handleEditTask, 
  handleSaveTemplate, 
  setIsModalOpen, 
  setEditingTask, 
  levelProgress, 
  popups, 
  flashKey 
}) => {
  const activeTasks = tasks.filter((t: Task) => !t.completed);
  
  // History now includes completed habits so they show up there instead of active list
  const recentHistory = tasks
    .filter((t: Task) => t.completed)
    .sort((a: Task, b: Task) => new Date(b.lastCompletedDate || 0).getTime() - new Date(a.lastCompletedDate || 0).getTime())
    .slice(0, 10); // Increased slice to show more history since habits go here now

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-secondary text-xs font-black uppercase tracking-widest flex items-center gap-2">Performance Metrics</h3>
          <div className="flex items-center gap-1.5 text-primary">
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">Total XP: {Math.floor(user.totalXP)}</span>
          </div>
        </div>
        <div className="bg-surface border border-secondary/20 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-20"></div>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-white">{Math.floor(levelProgress.current)}</span>
              <span className="text-secondary text-sm font-bold">/ {Math.floor(levelProgress.max)} XP</span>
            </div>
            <span className="text-primary font-black italic">{Math.floor(levelProgress.percentage)}% COMPLETE</span>
          </div>
          <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-secondary/20 relative">
            <div className="h-full bg-primary transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(0,225,255,0.6)]" style={{ width: `${levelProgress.percentage}%` }}>
                <div className="absolute inset-0 bg-white opacity-20 w-full animate-pulse"></div>
                <div key={flashKey} className="absolute inset-0 bg-white opacity-0 animate-bar-flash pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>

      <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter italic">Active Tasks</h2>
          <p className="text-secondary font-medium tracking-wide">{activeTasks.length} tasks currently active.</p>
        </div>
        <button 
          onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-cyan-400 text-background px-6 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 w-full md:w-auto justify-center"
        >
          <Plus size={20} strokeWidth={3} />
          Add Task
        </button>
      </header>

      <div className="space-y-4 mb-16">
        <AnimatePresence mode="popLayout">
          {activeTasks.map((task: Task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onComplete={handleCompleteTask} 
              onUncomplete={handleUncompleteTask}
              onDelete={handleDeleteTask} 
              onEdit={handleEditTask}
              onSaveTemplate={handleSaveTemplate}
              activePopup={popups[task.id]}
            />
          ))}
        </AnimatePresence>
        
        {activeTasks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-surface/30 rounded-2xl border border-dashed border-secondary/20"
          >
            <Trophy className="mx-auto text-secondary/40 mb-4" size={64} />
            <p className="text-secondary font-black uppercase tracking-widest text-sm">All tasks complete. System optimized.</p>
          </motion.div>
        )}
      </div>

      <section className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-3 mb-6 px-1">
          <History size={18} className="text-secondary" />
          <h2 className="text-lg font-black text-secondary uppercase tracking-widest italic">Completion History</h2>
        </div>
        
        <div className="space-y-3">
          {recentHistory.length > 0 ? (
            recentHistory.map((task: Task, index: number) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-center justify-between p-4 bg-surface/30 border border-secondary/10 rounded-xl hover:border-secondary/30 transition-all opacity-70 hover:opacity-100"
              >
                <div className="flex items-center gap-4 relative">
                  {popups[task.id] !== undefined && (
                    <div className="absolute -top-6 left-0 z-20 pointer-events-none animate-xp-float flex items-center gap-1">
                      <span className="text-sm font-black text-secondary drop-shadow-[0_0_8px_rgba(80,83,83,0.8)]">
                        {popups[task.id]} XP
                      </span>
                    </div>
                  )}

                  <button 
                    onClick={() => handleUncompleteTask(task.id)}
                    className="text-emerald-500 hover:text-red-400 transition-colors focus:outline-none"
                    title="Undo Completion"
                  >
                    <CheckCircle2 size={24} />
                  </button>

                  <div className="flex items-center gap-3">
                    <div 
                      className="w-1 h-8 rounded-full" 
                      style={{ backgroundColor: SKILL_COLORS[task.skillCategory] }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-300 line-through decoration-secondary/50 text-sm">{task.title}</h4>
                        {task.isHabit && (
                          <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                            Consistency: {task.streak}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-secondary font-black uppercase tracking-widest">
                        Confirmed: {formatCompletedDate(task.lastCompletedDate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <span className="text-[8px] font-black uppercase tracking-widest text-secondary border border-secondary/20 px-2 py-0.5 rounded-md mr-2">
                     {task.difficulty}
                   </span>
                   <button 
                     onClick={() => handleDeleteTask(task.id)}
                     className="p-2 text-secondary hover:text-red-400 bg-background/50 rounded-lg transition-all"
                     title="Remove Record"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-10 border border-dashed border-secondary/10 rounded-xl">
              <p className="text-[10px] text-secondary/40 font-black uppercase tracking-widest">No completion history available.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardView;

