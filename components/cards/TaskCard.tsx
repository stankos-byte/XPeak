import React from 'react';
import { motion } from 'framer-motion';
import { Task, Difficulty, SkillCategory } from '../../types';
import { SKILL_COLORS } from '../../constants';
import { CheckCircle2, Circle, Repeat, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onSaveTemplate: (task: Task) => void;
  activePopup?: number; // XP amount to show in floating animation
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onUncomplete, onDelete, onEdit, onSaveTemplate, activePopup }) => {
  const skillColor = SKILL_COLORS[task.skillCategory];
  
  const getDiffColor = (d: Difficulty) => {
    switch (d) {
      case Difficulty.EASY: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case Difficulty.MEDIUM: return 'bg-primary/10 text-primary border-primary/20';
      case Difficulty.HARD: return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case Difficulty.EPIC: return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        'group relative bg-surface border border-secondary/20 rounded-xl p-4 transition-colors duration-300',
        'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
        task.completed && 'opacity-50 grayscale'
      )}
    >
      {/* Floating XP Animation */}
      {activePopup !== undefined && (
        <motion.div 
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: -40 }}
          transition={{ duration: 1.5, times: [0, 0.1, 0.8, 1] }}
          className="absolute -top-4 left-4 z-20 pointer-events-none flex items-center gap-1"
        >
          <span className={cn(
            'text-xl font-black drop-shadow-[0_0_12px_rgba(0,0,0,0.8)]',
            activePopup > 0 ? 'text-primary' : 'text-red-400'
          )}>
            {activePopup > 0 ? `+${activePopup}` : activePopup} XP
          </span>
        </motion.div>
      )}

      <div className="flex items-start justify-between gap-4">
        
        <motion.button 
          onClick={() => task.completed ? onUncomplete(task.id) : onComplete(task.id)}
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.1 }}
          className={cn(
            'mt-1 transition-colors focus:outline-none',
            task.completed 
              ? 'text-emerald-500 hover:text-red-400' 
              : 'text-secondary hover:text-primary'
          )}
          title={task.completed ? "Undo completion" : "Complete Task"}
        >
          {task.completed ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <CheckCircle2 size={24} />
            </motion.div>
          ) : (
            <Circle size={24} />
          )}
        </motion.button>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              'font-semibold text-base md:text-lg',
              task.completed ? 'line-through text-secondary' : 'text-gray-100'
            )}>
              {task.title}
            </h4>
            {task.isHabit && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 font-bold uppercase tracking-wider"
              >
                <Repeat size={10} className="mr-1" />
                Streak: {task.streak}
              </motion.span>
            )}
          </div>
          
          <p className="text-xs md:text-sm text-secondary mb-3 line-clamp-2">{task.description || "No description provided."}</p>

          <div className="flex flex-wrap gap-2">
            <span className={cn(
              'text-[10px] px-2 py-1 rounded-md border font-bold uppercase tracking-widest',
              getDiffColor(task.difficulty)
            )}>
              {task.difficulty}
            </span>
            {task.skillCategory !== SkillCategory.MISC && (
              <span 
                className="text-[10px] px-2 py-1 rounded-md border font-bold uppercase tracking-widest bg-opacity-10"
                style={{ 
                  backgroundColor: `${skillColor}20`, 
                  borderColor: `${skillColor}40`,
                  color: skillColor
                }}
              >
                {task.skillCategory}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end justify-between h-full gap-2">
           <div className="flex items-center gap-1 transition-opacity">
              <motion.button 
                  onClick={() => onEdit(task)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Edit Task"
              >
                  <Pencil size={16} />
              </motion.button>
              <motion.button 
                  onClick={() => onDelete(task.id)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  title="Abandon Task"
              >
                  <Trash2 size={16} />
              </motion.button>
           </div>
        </div>
      </div>
      
      {/* Skill color indicator bar */}
      <motion.div 
        className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
        style={{ backgroundColor: skillColor }}
        layoutId={`skill-bar-${task.id}`}
      />
    </motion.div>
  );
};

export default TaskCard;
