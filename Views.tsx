
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, ChevronRight, X, Clock, Calendar as CalendarIcon,
  Settings, Download, Upload, Plus, Copy, Edit3, Check, Trash, ChevronDown, Globe, Timer, BarChart, FileJson
} from 'lucide-react';
import { format, isToday, eachDayOfInterval, isSameDay, addMonths } from 'date-fns';
import { Task, Priority, Tag, AppSettings, TaskTemplate } from './types';
import { PRIORITY_COLORS, COLORS, generateTagColor } from './constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getProgressBgClass, getProgressColorClass, formatDuration } from './TaskComponents';
import { getTranslation } from './locales';

const StyledSelect = ({ value, onChange, options, label, icon: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  const selected = options.find((opt: any) => opt.value === value) || options[0];
  return (
    <div className="space-y-1 relative" ref={containerRef}>
      {label && <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">{label}</label>}
      <div onClick={() => setIsOpen(!isOpen)} className="w-full bg-things-lightSidebar dark:bg-things-sidebar p-3 pr-9 rounded-apple-md text-[12px] font-bold border border-things-lightBorder dark:border-things-border hover:border-things-accent/50 transition-all cursor-pointer shadow-apple-sm flex items-center justify-between select-none">
        <div className="flex items-center space-x-2.5 truncate">{Icon && <Icon size={14} className="opacity-40" />}{selected.label}</div>
        <ChevronDown size={14} className={`transition-transform duration-400 opacity-40 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 6, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute z-[300] w-full bg-things-lightCard dark:bg-things-card border border-things-lightBorder dark:border-things-border rounded-apple-lg shadow-apple-lg overflow-hidden py-2">
            {options.map((opt: any) => (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`px-4 py-2.5 text-[12px] font-bold cursor-pointer flex items-center justify-between transition-colors ${value === opt.value ? 'bg-things-accent/10 text-things-accent' : 'hover:bg-black/5 dark:hover:bg-things-hover'}`}>
                {opt.label}{value === opt.value && <Check size={12} strokeWidth={3} />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const KanbanView = ({ tasks, language, onToggle, onDelete }: any) => {
  const t = getTranslation(language);
  return (
    <div className="flex space-x-6 h-full overflow-x-auto pb-6 scrollbar-hide">
      {[Priority.HIGH, Priority.MEDIUM, Priority.LOW].map(p => {
        const pTasks = tasks.filter((tk: Task) => tk.priority === p && !tk.parentId);
        return (
          <div key={p} className="w-72 flex-shrink-0 flex flex-col space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black uppercase text-things-secondary tracking-[0.2em]">{t[p]}</h3>
              <span className="text-[10px] font-bold opacity-30 bg-things-border px-2 py-0.5 rounded-full">{pTasks.length}</span>
            </div>
            <div className="flex-1 bg-things-lightSidebar/40 dark:bg-things-sidebar/40 rounded-apple-xl p-3 space-y-3 overflow-y-auto custom-scrollbar border border-things-lightBorder dark:border-things-border">
              {pTasks.map((tk: Task) => (
                <div key={tk.id} className="bg-things-lightCard dark:bg-things-card p-3.5 rounded-apple-lg shadow-apple-sm border border-things-lightBorder dark:border-things-border group hover:shadow-apple-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className={`text-[13px] font-semibold leading-tight ${tk.completed ? 'line-through opacity-30' : ''}`}>{tk.title}</span>
                    <button onClick={() => onToggle(tk.id)} className={`transition-all duration-300 ${tk.completed ? 'text-things-success' : 'text-things-subtle opacity-40 hover:opacity-100'}`}><CheckCircle2 size={16}/></button>
                  </div>
                  <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onDelete(tk.id)} className="text-things-subtle hover:text-things-critical p-1"><Trash size={12}/></button></div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const CalendarView = ({ tasks, language, onToggle, onAdd }: any) => {
  const [viewDate, setViewDate] = useState(new Date());
  const monthDays = eachDayOfInterval({ start: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1), end: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0) });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black tracking-tighter">{format(viewDate, 'MMMM yyyy')}</h2>
        <div className="flex bg-things-lightSidebar dark:bg-things-sidebar p-1.5 rounded-apple-lg border border-things-lightBorder dark:border-things-border shadow-apple-sm">
          <button onClick={() => setViewDate(addMonths(viewDate, -1))} className="p-2 hover:bg-white dark:hover:bg-things-hover rounded-apple-md transition-all"><ChevronRight className="rotate-180" size={14}/></button>
          <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-2 hover:bg-white dark:hover:bg-things-hover rounded-apple-md transition-all"><ChevronRight size={14}/></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-things-border rounded-apple-2xl overflow-hidden border border-things-border shadow-apple-md opacity-90">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="bg-things-lightSidebar dark:bg-things-sidebar p-3 text-center text-[10px] font-black text-things-secondary uppercase tracking-[0.2em]">{d}</div>)}
        {monthDays.map(day => {
          const dayTasks = tasks.filter((tk: Task) => tk.dueDate && isSameDay(new Date(tk.dueDate), day));
          return (
            <div key={day.toISOString()} onClick={() => onAdd(day)} className="bg-things-lightCard dark:bg-things-card min-h-[90px] p-2 hover:bg-things-hover transition-all cursor-pointer relative group/cell">
              <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full transition-all ${isToday(day) ? 'bg-things-accent text-white shadow-apple-sm scale-110' : 'text-things-subtle'}`}>{format(day, 'd')}</span>
              <div className="mt-2 space-y-1 flex-1">
                {dayTasks.slice(0, 2).map((tk: Task) => (
                  <div key={tk.id} className={`text-[9px] px-2 py-1 rounded-apple-sm truncate font-bold transition-all ${tk.completed ? 'bg-things-success/10 text-things-success opacity-50' : 'bg-things-accent/10 text-things-accent'}`}>{tk.title}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const StatsView = ({ tasks, language }: any) => {
  const t = getTranslation(language);
  const done = tasks.filter((tk: Task) => tk.completed).length;
  const total = tasks.length;
  const progress = total > 0 ? (done / total) * 100 : 0;
  const totalSeconds = tasks.reduce((acc: number, tk: Task) => acc + tk.timeSpent, 0);

  const priorityData = [
    { name: t.high, value: tasks.filter((tk: Task) => tk.priority === Priority.HIGH).reduce((acc: number, tk: Task) => acc + tk.timeSpent, 0), color: PRIORITY_COLORS[Priority.HIGH] },
    { name: t.medium, value: tasks.filter((tk: Task) => tk.priority === Priority.MEDIUM).reduce((acc: number, tk: Task) => acc + tk.timeSpent, 0), color: PRIORITY_COLORS[Priority.MEDIUM] },
    { name: t.low, value: tasks.filter((tk: Task) => tk.priority === Priority.LOW).reduce((acc: number, tk: Task) => acc + tk.timeSpent, 0), color: PRIORITY_COLORS[Priority.LOW] },
  ].filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }).map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const trendData = last7Days.map(date => ({
    name: format(date, 'MMM d'),
    completed: tasks.filter((tk: Task) => tk.completed && tk.dueDate && isSameDay(new Date(tk.dueDate), date)).length,
    created: tasks.filter((tk: Task) => isSameDay(new Date(tk.createdAt), date)).length
  }));

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col mb-4">
        <h2 className="text-3xl font-black tracking-tighter">{t.statsTitle}</h2>
        <p className="text-[11px] font-bold text-things-secondary uppercase tracking-widest mt-2 opacity-50">Insights across {total} cycles</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-things-lightSidebar dark:bg-things-sidebar p-6 rounded-apple-xl border border-things-lightBorder dark:border-things-border shadow-apple-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-things-accent mb-4 flex items-center"><CheckCircle2 size={16} className="mr-2"/> Completion Rate</div>
            <div className="flex items-baseline space-x-2"><span className="text-4xl font-black">{Math.round(progress)}%</span><span className="text-[10px] font-bold opacity-40">{done}/{total}</span></div>
         </div>
         <div className="bg-things-lightSidebar dark:bg-things-sidebar p-6 rounded-apple-xl border border-things-lightBorder dark:border-things-border shadow-apple-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-things-warning mb-4 flex items-center"><Timer size={16} className="mr-2"/> {t.totalTime}</div>
            <div className="text-3xl font-black tracking-tight">{formatDuration(totalSeconds)}</div>
         </div>
         <div className="bg-things-lightSidebar dark:bg-things-sidebar p-6 rounded-apple-xl border border-things-lightBorder dark:border-things-border shadow-apple-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-things-info mb-4 flex items-center"><BarChart size={16} className="mr-2"/> Current Velocity</div>
            <div className="flex items-baseline space-x-2"><span className="text-4xl font-black">{trendData[6].completed}</span><span className="text-[10px] font-bold opacity-40 uppercase">Resolved Today</span></div>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-things-lightCard dark:bg-things-card p-8 rounded-apple-xl border border-things-lightBorder dark:border-things-border shadow-apple-md">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-things-secondary mb-8">{t.timeDistribution}</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={priorityData} innerRadius="65%" outerRadius="90%" paddingAngle={8} dataKey="value" stroke="none" cx="50%" cy="50%">{priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={(v: number) => formatDuration(v)} /></PieChart></ResponsiveContainer></div>
          <div className="mt-4 flex justify-center space-x-6">{priorityData.map(d => <div key={d.name} className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-[10px] font-bold opacity-60 uppercase">{d.name}</span></div>)}</div>
        </div>
        <div className="bg-things-lightCard dark:bg-things-card p-8 rounded-apple-xl border border-things-lightBorder dark:border-things-border shadow-apple-md">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-things-secondary mb-8">{t.completionTrends}</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><ReBarChart data={trendData}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, opacity: 0.4 }} dy={10} /><YAxis hide /><Tooltip /><Bar dataKey="completed" fill={COLORS.GREEN} radius={[6, 6, 0, 0]} /><Bar dataKey="created" fill={COLORS.ACCENT} opacity={0.3} radius={[6, 6, 0, 0]} /></ReBarChart></ResponsiveContainer></div>
          <div className="mt-4 flex justify-center space-x-6"><div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-things-success" /><span className="text-[10px] font-bold opacity-60 uppercase">Completed</span></div><div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-things-accent opacity-30" /><span className="text-[10px] font-bold opacity-60 uppercase">Created</span></div></div>
        </div>
      </div>
    </div>
  );
};

export const TemplatesView = ({ templates, tags, language, onAdd, onUpdate, onDelete, onUse }: any) => {
  const tStrings = getTranslation(language);
  const [editorState, setEditorState] = useState<Partial<TaskTemplate> | null>(null);
  const handleSave = () => {
    if (!editorState || !editorState.name || !editorState.title) return;
    const data = { ...editorState, subtasks: (editorState.subtasks || []).filter(s => s.title.trim() !== '') };
    if (editorState.id) onUpdate(data as TaskTemplate); else onAdd(data);
    setEditorState(null);
  };
  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between mb-10">
        <div><h2 className="text-[34px] font-black tracking-tighter leading-none">{tStrings.templates}</h2><p className="text-[11px] font-black text-things-secondary uppercase tracking-widest mt-4 opacity-50">{templates.length} {tStrings.blueprints}</p></div>
        <button onClick={() => setEditorState({ name: '', title: '', description: '', priority: Priority.MEDIUM, tags: [], subtasks: [] })} className="flex items-center space-x-2.5 px-6 py-3 bg-things-accent text-white rounded-apple-md font-bold text-[13px] shadow-apple-md hover:scale-105 active:scale-95 transition-all"><Plus size={16} /><span>{tStrings.newTemplate}</span></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template: TaskTemplate) => (
          <motion.div key={template.id} layout className="bg-things-lightCard dark:bg-things-card border border-things-lightBorder dark:border-things-border p-6 rounded-apple-xl group hover:shadow-apple-md transition-all flex flex-col h-full shadow-apple-sm">
            <div className="flex justify-between items-start mb-4"><h3 className="font-black text-[16px] opacity-90">{template.name}</h3><div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditorState({...template})} className="p-2 hover:bg-black/5 dark:hover:bg-things-hover rounded-apple-sm"><Edit3 size={14}/></button><button onClick={() => onDelete(template.id)} className="p-2 hover:bg-things-critical/10 rounded-apple-sm"><Trash size={14} className="text-things-critical"/></button></div></div>
            <div className="flex-1 space-y-3"><p className="text-[13px] font-bold text-things-secondary italic">"{template.title}"</p><div className="flex flex-wrap gap-1.5 mt-auto pt-4"><span className="px-2.5 py-0.5 rounded-apple-sm text-[9px] font-black uppercase border" style={{ color: PRIORITY_COLORS[template.priority], borderColor: PRIORITY_COLORS[template.priority] + '30' }}>{tStrings[template.priority]}</span></div></div>
            <button onClick={() => onUse(template.id)} className="mt-6 w-full py-3 bg-things-accent text-white rounded-apple-md font-black text-[11px] uppercase tracking-widest shadow-apple-sm hover:brightness-110 transition-all">{tStrings.useOneKey}</button>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {editorState && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-things-lightCard dark:bg-things-card w-full max-w-lg rounded-apple-xl p-8 shadow-apple-lg space-y-6 overflow-y-auto max-h-[90vh] border border-things-border custom-scrollbar">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-things-accent">{editorState.id ? tStrings.updateBlueprint : tStrings.configureBlueprint}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">{tStrings.templateName}</label><input value={editorState.name || ''} onChange={e => setEditorState({...editorState, name: e.target.value})} className="w-full bg-things-lightSidebar dark:bg-things-sidebar rounded-apple-md p-3.5 text-[13px] border border-things-lightBorder dark:border-things-border outline-none" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">{tStrings.taskTitle}</label><input value={editorState.title || ''} onChange={e => setEditorState({...editorState, title: e.target.value})} className="w-full bg-things-lightSidebar dark:bg-things-sidebar rounded-apple-md p-3.5 text-[13px] font-bold border border-things-lightBorder dark:border-things-border outline-none" /></div>
              </div>
              <StyledSelect label={tStrings.priority} value={editorState.priority} onChange={(v: Priority) => setEditorState({...editorState, priority: v})} options={[{value: Priority.LOW, label: tStrings.low}, {value: Priority.MEDIUM, label: tStrings.medium}, {value: Priority.HIGH, label: tStrings.high}]} />
              <div className="flex justify-end space-x-3 pt-8"><button onClick={() => setEditorState(null)} className="text-[11px] font-black uppercase px-6 py-3 hover:bg-black/5 dark:hover:bg-things-hover rounded-apple-md">{tStrings.cancel}</button><button onClick={handleSave} className="bg-things-accent text-white px-8 py-3 rounded-apple-md font-black text-[11px] uppercase tracking-[0.2em] shadow-apple-md hover:brightness-110 transition-all">{tStrings.saveBlueprint}</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SettingsModal = ({ settings, tags, onUpdateSettings, onExport, onImport, onReset, onClose }: any) => {
  const t = getTranslation(settings.language);
  const [local, setLocal] = useState({...settings});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        onImport(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-things-lightCard dark:bg-things-card w-full max-w-lg rounded-apple-2xl p-8 shadow-apple-lg flex flex-col max-h-[85vh] border border-things-border">
        <div className="flex justify-between items-center mb-8"><div className="flex items-center space-x-3 text-things-accent"><Settings size={22}/><h3 className="text-[17px] font-black tracking-tight">{t.settings}</h3></div><button onClick={onClose} className="p-2.5 hover:bg-black/5 dark:hover:bg-things-hover rounded-full transition-colors"><X size={18}/></button></div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-10 pr-2">
          <section className="space-y-5">
            <h4 className="text-[11px] font-black uppercase opacity-30 tracking-[0.25em] ml-2">{t.profile}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-things-lightSidebar dark:bg-things-sidebar p-4 rounded-apple-md border border-things-lightBorder dark:border-things-border"><label className="text-[10px] font-black uppercase opacity-40 block mb-1">{t.name}</label><input value={local.userName} onChange={e => { const ns = {...local, userName: e.target.value}; setLocal(ns); onUpdateSettings(ns); }} className="bg-transparent border-none focus:outline-none w-full font-bold" /></div>
              <StyledSelect label={t.language} value={local.language} onChange={(v: string) => { const ns = {...local, language: v}; setLocal(ns); onUpdateSettings(ns); }} options={[{value:'en', label:'English'}, {value:'zh', label:'中文'}]} icon={Globe} />
            </div>
          </section>

          <section className="space-y-5 pt-6 border-t border-things-border/50">
            <h4 className="text-[11px] font-black uppercase opacity-30 tracking-[0.25em] ml-2">{t.dataManagement}</h4>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => onExport(tags)} 
                className="flex items-center justify-center space-x-3 p-4 bg-things-lightSidebar dark:bg-things-sidebar hover:bg-black/5 dark:hover:bg-things-hover border border-things-lightBorder dark:border-things-border rounded-apple-md transition-all group"
              >
                <Download size={16} className="text-things-accent group-hover:scale-110 transition-transform" />
                <span className="text-[12px] font-black uppercase tracking-widest">{t.export}</span>
              </button>
              <button 
                onClick={handleImportClick} 
                className="flex items-center justify-center space-x-3 p-4 bg-things-lightSidebar dark:bg-things-sidebar hover:bg-black/5 dark:hover:bg-things-hover border border-things-lightBorder dark:border-things-border rounded-apple-md transition-all group"
              >
                <Upload size={16} className="text-things-info group-hover:scale-110 transition-transform" />
                <span className="text-[12px] font-black uppercase tracking-widest">{t.import}</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json"
              />
            </div>
          </section>

          <section className="pt-6 border-t border-things-border/50">
            <button onClick={onReset} className="w-full p-4 bg-things-critical/10 text-things-critical rounded-apple-md font-black uppercase text-[11px] tracking-widest hover:bg-things-critical hover:text-white transition-all">
              {t.resetApp}
            </button>
          </section>
        </div>
        
        <button onClick={onClose} className="mt-10 w-full py-4 bg-things-lightText dark:bg-things-text text-white dark:text-things-bg rounded-apple-md font-black text-[12px] uppercase tracking-[0.3em] shadow-apple-lg">
          {t.done}
        </button>
      </motion.div>
    </div>
  );
};

export const TaskEditModal = ({ task, tags, language, onClose, onSave }: any) => {
  const [edited, setEdited] = useState({...task});
  const t = getTranslation(language);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-things-lightCard dark:bg-things-card w-full max-w-md rounded-apple-2xl p-8 shadow-apple-lg space-y-6 border border-things-border">
        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-things-critical">{t.editEntry}</h3>
        <input value={edited.title} onChange={e => setEdited({...edited, title: e.target.value})} className="w-full text-xl font-bold bg-transparent outline-none text-things-lightText dark:text-things-text" placeholder={t.taskTitle} />
        <textarea value={edited.description || ''} onChange={e => setEdited({...edited, description: e.target.value})} className="w-full bg-things-lightSidebar dark:bg-things-sidebar rounded-apple-md p-4 text-[13px] border border-things-lightBorder dark:border-things-border min-h-[100px] outline-none text-things-lightText dark:text-things-text" placeholder={t.notes} />
        <StyledSelect label={t.priority} value={edited.priority} onChange={(v: Priority) => setEdited({...edited, priority: v})} options={[{value: Priority.LOW, label: t.low}, {value: Priority.MEDIUM, label: t.medium}, {value: Priority.HIGH, label: t.high}]} />
        <div className="flex justify-end space-x-3 pt-6 border-t border-things-border/50"><button onClick={onClose} className="text-[11px] font-black uppercase px-6 py-3 hover:bg-black/5 dark:hover:bg-things-hover rounded-apple-md">{t.abort}</button><button onClick={() => onSave(edited)} className="bg-things-accent text-white px-8 py-3 rounded-apple-md font-black text-[11px] uppercase tracking-[0.2em] shadow-apple-md">{t.commit}</button></div>
      </motion.div>
    </div>
  );
};

export const TagManagementModal = ({ tags, language, onClose, onUpdate }: any) => {
  const [local, setLocal] = useState([...tags]);
  const t = getTranslation(language);
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Refresh local colors if theme changes while modal is open (re-generates HSL based on isDarkMode)
  useEffect(() => {
    setLocal(prev => prev.map(tag => ({
      ...tag,
      color: generateTagColor(tag.id, isDarkMode)
    })));
  }, [isDarkMode]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-things-lightCard dark:bg-things-card w-full max-w-sm rounded-apple-2xl p-8 shadow-apple-lg space-y-6 border border-things-border">
        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-things-info">{t.tokens}</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
          {local.map((tag, idx) => (
            <div key={tag.id} className="flex items-center space-x-3 bg-things-lightSidebar dark:bg-things-sidebar p-2.5 rounded-apple-md border border-things-lightBorder dark:border-things-border group/item transition-all hover:border-things-accent/30">
              <div className="w-3.5 h-3.5 rounded-full shadow-sm transition-transform group-hover/item:scale-125" style={{ backgroundColor: tag.color }} />
              <input 
                value={tag.name} 
                onChange={e => { const n = [...local]; n[idx].name = e.target.value; setLocal(n); }} 
                className="bg-transparent border-none flex-1 text-[13px] font-bold outline-none text-things-lightText dark:text-things-text" 
              />
              <button onClick={() => setLocal(local.filter(tg => tg.id !== tag.id))} className="text-things-subtle hover:text-things-critical p-1.5 transition-colors opacity-0 group-hover/item:opacity-100"><Trash size={14}/></button>
            </div>
          ))}
          <button 
            onClick={() => {
              const newId = Math.random().toString(36).substr(2, 9);
              setLocal([...local, { 
                id: newId, 
                name: 'New Tag', 
                color: generateTagColor(newId, isDarkMode) 
              }]);
            }} 
            className="w-full border-2 border-dashed border-things-border py-4 rounded-apple-md text-[10px] font-black uppercase opacity-40 hover:opacity-100 hover:border-things-accent/50 transition-all flex items-center justify-center space-x-2"
          >
            <Plus size={14}/>
            <span>{t.newTask}</span>
          </button>
        </div>
        <button onClick={() => { onUpdate(local); onClose(); }} className="w-full bg-things-info text-white py-4 rounded-apple-md font-black text-[12px] uppercase tracking-[0.3em] shadow-apple-md hover:brightness-110 active:scale-[0.98] transition-all">{t.save}</button>
      </motion.div>
    </div>
  );
};
