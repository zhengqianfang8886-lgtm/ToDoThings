
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Trash2, Edit3, Plus, Clock, Flag, Check, Star, Play, Pause, Timer, Tag as TagIcon
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { Task, Priority, Tag } from './types';
import { PRIORITY_COLORS, COLORS } from './constants';
import { getTranslation } from './locales';

export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

export const getProgressColorClass = (percent: number): string => {
  if (percent === 0) return 'text-things-subtle';
  if (percent <= 25) return 'text-things-critical';
  if (percent <= 50) return 'text-things-warning';
  if (percent <= 75) return 'text-things-accent';
  return 'text-things-success';
};

export const getProgressBgClass = (percent: number): string => {
  if (percent <= 25) return 'bg-things-critical';
  if (percent <= 50) return 'bg-things-warning';
  if (percent <= 75) return 'bg-things-accent';
  return 'bg-things-success';
};

const SpectacularConfetti = ({ x, y }: { x: number; y: number }) => {
  const particles = Array.from({ length: 40 });
  return (
    <div className="absolute pointer-events-none z-50" style={{ left: x, top: y }}>
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2 + (Math.random() * 0.5);
        const velocity = 50 + Math.random() * 100;
        const targetX = Math.cos(angle) * velocity;
        const targetY = Math.sin(angle) * velocity - 20;
        const color = [COLORS.PINK, COLORS.GREEN, COLORS.CYAN, COLORS.PURPLE, COLORS.ORANGE][i % 5];
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 2 }}
            animate={{ x: targetX, y: targetY + 100, opacity: 0, scale: 0 }}
            transition={{ duration: 2, ease: [0.1, 0.6, 0.2, 1] }}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        );
      })}
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  allTasks: Task[]; 
  tags: Tag[];
  language: string;
  onToggle: (id: string) => void;
  onToggleTimer: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onAddSub: (title: string, parentId: string) => void;
  depth?: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, allTasks, tags, language, onToggle, onToggleTimer, onDelete, onEdit, onUpdateTask, onAddSub, depth = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [currentTime, setCurrentTime] = useState(task.timeSpent);
  const tStrings = getTranslation(language);
  
  const childTasks = allTasks.filter(tk => tk.parentId === task.id);
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed;

  useEffect(() => {
    let interval: any;
    if (task.timerStartedAt) {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - new Date(task.timerStartedAt!).getTime()) / 1000);
        setCurrentTime(task.timeSpent + elapsed);
      }, 1000);
    } else {
      setCurrentTime(task.timeSpent);
    }
    return () => clearInterval(interval);
  }, [task.timerStartedAt, task.timeSpent]);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 2000); 
    }
    onToggle(task.id);
  };

  const completedChildren = childTasks.filter(c => c.completed).length;
  const progressPercent = childTasks.length > 0 ? (completedChildren / childTasks.length) * 100 : 0;

  // Resolve tag names and colors
  const assignedTags = task.tags.map(tid => tags.find(tg => tg.id === tid)).filter(Boolean) as Tag[];

  return (
    <motion.div 
      layout
      className={`group transition-all duration-300 ${depth > 0 ? 'ml-6 mt-1.5 border-l-2 border-things-border/30 dark:border-things-border/20 pl-4' : ''}`}
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative overflow-hidden bg-things-lightCard dark:bg-things-card border cursor-pointer transition-all duration-300 rounded-apple-lg p-3 ${isExpanded ? 'border-things-accent dark:border-things-accent/50 shadow-apple-md' : 'border-things-lightBorder dark:border-things-border shadow-apple-sm hover:shadow-apple-md hover:bg-things-hover/10 dark:hover:bg-things-hover'}`}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-things-accent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-start space-x-3.5 relative z-10">
          <div className="relative pt-0.5">
            <button 
              onClick={handleComplete} 
              className={`relative flex items-center justify-center w-5.5 h-5.5 transition-all duration-500 rounded-apple-sm border-[1.8px] ${
                task.completed 
                  ? 'bg-things-success border-things-success text-white scale-110' 
                  : 'border-things-lightBorder dark:border-things-disabled hover:border-things-accent dark:hover:border-things-accent hover:scale-110'
              }`}
            >
              <AnimatePresence>
                {task.completed && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check size={13} strokeWidth={4} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            {celebrating && <SpectacularConfetti x={12} y={12} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <h3 className={`text-[14px] font-semibold truncate transition-all duration-500 ${task.completed ? 'text-things-subtle line-through opacity-60' : 'text-things-lightText dark:text-things-text'} ${isOverdue ? 'text-things-critical font-bold' : ''}`}>
                {task.title}
              </h3>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!task.completed && depth === 0 && (
                  <button onClick={(e) => { e.stopPropagation(); onToggleTimer(task.id); }} className={`p-1.5 rounded-apple-sm transition-all ${task.timerStartedAt ? 'bg-things-accent text-white animate-pulse' : 'text-things-subtle hover:text-things-accent'}`}>
                    {task.timerStartedAt ? <Pause size={13} /> : <Play size={13} />}
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 text-things-subtle hover:text-things-accent hover:bg-black/5 rounded-apple-sm"><Edit3 size={13}/></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 text-things-subtle hover:text-things-critical hover:bg-things-critical/10 rounded-apple-sm"><Trash2 size={13}/></button>
              </div>
            </div>
            
            <div className="flex items-center mt-1.5 space-x-3 overflow-hidden">
              <button 
                onClick={(e) => { e.stopPropagation(); const order = [Priority.LOW, Priority.MEDIUM, Priority.HIGH]; onUpdateTask({...task, priority: order[(order.indexOf(task.priority) + 1) % 3]}); }}
                className="flex items-center space-x-1.5 px-2 py-0.5 rounded-apple-sm text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-110 flex-shrink-0"
                style={{ color: PRIORITY_COLORS[task.priority], backgroundColor: PRIORITY_COLORS[task.priority] + '15' }}
              >
                <Flag size={10} fill={task.priority === Priority.HIGH ? 'currentColor' : 'none'} />
                <span>{tStrings[task.priority]}</span>
              </button>

              {/* Tag Display */}
              {assignedTags.length > 0 && (
                <div className="flex items-center space-x-1.5 overflow-hidden">
                  {assignedTags.map(tg => (
                    <div 
                      key={tg.id} 
                      className="px-2 py-0.5 rounded-apple-sm text-[9px] font-black uppercase tracking-widest truncate max-w-[80px]" 
                      style={{ color: tg.color, backgroundColor: tg.color + '15' }}
                    >
                      {tg.name}
                    </div>
                  ))}
                </div>
              )}

              {task.dueDate && (
                <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center flex-shrink-0 ${isOverdue ? 'text-things-critical' : 'text-things-subtle opacity-70'}`}>
                  <Clock size={11} className="mr-1.5" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}

              {(currentTime > 0 || task.timerStartedAt) && (
                <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center flex-shrink-0 ${task.timerStartedAt ? 'text-things-accent' : 'text-things-subtle opacity-50'}`}>
                  <Timer size={11} className={`mr-1.5 ${task.timerStartedAt ? 'animate-spin-slow' : ''}`} />
                  {formatDuration(currentTime)}
                </span>
              )}

              {childTasks.length > 0 && (
                <div className="flex items-center space-x-3 flex-1 max-w-[100px]">
                  <div className="h-1 bg-things-border rounded-full flex-1 overflow-hidden opacity-30">
                    <motion.div animate={{ width: `${progressPercent}%` }} className={`h-full ${getProgressBgClass(progressPercent)}`} />
                  </div>
                  <span className="text-[9px] font-black text-things-subtle/50">{completedChildren}/{childTasks.length}</span>
                </div>
              )}
            </div>
          </div>
          <ChevronRight size={15} className={`text-things-subtle transition-transform duration-500 mt-1 ${isExpanded ? 'rotate-90 text-things-accent' : 'opacity-60'}`} />
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 pt-3 border-t border-things-border/50 space-y-4">
              {task.description && <p className="text-[12px] text-things-secondary px-1 whitespace-pre-wrap">{task.description}</p>}
              <div className="space-y-2">
                {childTasks.map(sub => (
                  <TaskCard key={sub.id} task={sub} allTasks={allTasks} tags={tags} language={language} onToggle={onToggle} onToggleTimer={onToggleTimer} onDelete={onDelete} onEdit={onEdit} onUpdateTask={onUpdateTask} onAddSub={onAddSub} depth={depth + 1} />
                ))}
                <div className="flex items-center space-x-3 bg-things-lightSidebar dark:bg-things-sidebar/50 rounded-apple-md px-3 py-2 border border-things-lightBorder dark:border-things-border focus-within:border-things-accent transition-all shadow-apple-sm">
                  <Plus size={13} className="text-things-accent" />
                  <input onKeyDown={e => { if (e.key === 'Enter' && e.currentTarget.value) { onAddSub(e.currentTarget.value, task.id); e.currentTarget.value = ''; } }} onClick={e => e.stopPropagation()} className="bg-transparent border-none focus:outline-none text-[12px] w-full font-medium text-things-lightText dark:text-things-text" placeholder={tStrings.addSubtask} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const SidebarItem: React.FC<any> = ({ icon: Icon, label, onClick, active, count, customIconColor }) => {
  return (
    <button 
      onClick={onClick} 
      className={`w-full group relative flex items-center px-3 py-1.5 rounded-apple-md transition-all duration-150 ${
        active 
          ? 'bg-black/5 dark:bg-things-hover text-things-lightText dark:text-things-text' 
          : 'hover:bg-black/5 dark:hover:bg-things-hover/60 text-things-secondary'
      }`}
    >
      {/* Active Indicator Bar */}
      {active && (
        <motion.div 
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-things-accent rounded-r-full"
        />
      )}

      <div className="relative mr-3.5 w-6 h-6 flex items-center justify-center flex-shrink-0">
        {Icon ? (
          <Icon 
            size={18} 
            className={`transition-all duration-300 z-10 ${
              active 
                ? 'text-things-accent' 
                : 'text-things-subtle group-hover:text-things-secondary'
            }`} 
          />
        ) : (
          <div 
            className="w-3 h-3 rounded-full z-10" 
            style={{ backgroundColor: customIconColor || 'currentColor' }} 
          />
        )}
      </div>
      
      <span className={`flex-1 text-left truncate text-[13px] tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>
        {label}
      </span>

      {count !== undefined && count > 0 && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-apple-sm ml-2 transition-all ${
          active 
            ? 'bg-things-accent text-white shadow-sm' 
            : 'bg-black/5 dark:bg-things-border/60 text-things-subtle'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
};
