
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, Search, List, LayoutGrid, Calendar as CalendarIcon, BarChart3, 
  Settings, Moon, Sun, CheckSquare, Inbox, Check, BookOpen, Copy, Loader2, Folder, Briefcase
} from 'lucide-react';
import { isToday } from 'date-fns';
import { useTaskEngine } from './useTaskEngine';
import { TaskCard, SidebarItem, getProgressBgClass } from './TaskComponents';
import { KanbanView, CalendarView, StatsView, TaskEditModal, TagManagementModal, SettingsModal, TemplatesView } from './Views';
import { ViewMode, Task } from './types';
import { generateTagColor } from './constants';
import { getTranslation } from './locales';

export default function App() {
  const engine = useTaskEngine();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const t = getTranslation(engine.settings.language);

  const themedTags = useMemo(() => {
    return engine.tags.map(tag => ({
      ...tag,
      color: generateTagColor(tag.id, engine.isDarkMode)
    }));
  }, [engine.tags, engine.isDarkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      switch (e.key.toLowerCase()) {
        case 'n': e.preventDefault(); engine.addTask(t.newTask); break;
        case 's': e.preventDefault(); searchInputRef.current?.focus(); break;
        case '1': engine.setActiveView(ViewMode.LIST); break;
        case '2': engine.setActiveView(ViewMode.KANBAN); break;
        case '3': engine.setActiveView(ViewMode.CALENDAR); break;
        case '4': engine.setActiveView(ViewMode.STATS); break;
        case '5': engine.setActiveView(ViewMode.TEMPLATES); break;
        case 't': engine.setIsDarkMode(!engine.isDarkMode); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, t]);

  const handleSidebarClick = (type: 'inbox' | 'today' | 'logbook' | 'templates') => {
    engine.setIsTodayView(type === 'today');
    engine.setIsLogbookView(type === 'logbook');
    engine.setSelectedTag(null);
    engine.setSelectedProjectId(null);
    if (type === 'templates') engine.setActiveView(ViewMode.TEMPLATES);
    else if (engine.activeView === ViewMode.TEMPLATES) engine.setActiveView(ViewMode.LIST);
  };

  const contextTasks = engine.filteredTasks;
  const contextProgress = contextTasks.length > 0 ? (contextTasks.filter(tk => tk.completed).length / contextTasks.length) * 100 : 0;
  
  const inboxCount = engine.tasks.filter(tk => !tk.completed && !tk.parentId).length;
  const todayCount = engine.tasks.filter(tk => tk.dueDate && isToday(new Date(tk.dueDate)) && !tk.completed && !tk.parentId).length;
  const logbookCount = engine.tasks.filter(tk => tk.completed && !tk.parentId).length;

  return (
    <div className="flex h-screen overflow-hidden bg-things-lightBg dark:bg-things-bg font-sans selection:bg-things-accent selection:text-white transition-colors duration-500">
      <AnimatePresence>
        {!engine.isLoaded && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-things-lightBg dark:bg-things-bg flex flex-col items-center justify-center space-y-4">
            <Loader2 size={32} className="text-things-accent animate-spin" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-things-secondary opacity-50">Initializing Core...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="w-64 border-r border-things-lightBorder dark:border-things-border px-3 py-6 flex flex-col bg-things-lightSidebar dark:bg-things-sidebar transition-all duration-500">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-things-accent rounded-apple-md flex items-center justify-center text-white shadow-apple-sm"><CheckSquare size={18} /></div>
            <h1 className="text-[14px] font-black tracking-tight uppercase opacity-90 text-things-lightText dark:text-things-text">Things Pro</h1>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-white dark:hover:bg-things-hover rounded-apple-sm transition-all border border-transparent hover:border-things-lightBorder dark:border-things-border"><Settings size={14} className="text-things-subtle" /></button>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-1">
          <nav className="space-y-0.5">
            <SidebarItem icon={Inbox} label={t.inbox} onClick={() => handleSidebarClick('inbox')} active={!engine.selectedTag && !engine.selectedProjectId && !engine.isTodayView && !engine.isLogbookView && engine.activeView !== ViewMode.TEMPLATES} count={inboxCount} progress={(engine.tasks.filter(tk => !tk.parentId && tk.completed).length / Math.max(1, engine.tasks.filter(tk => !tk.parentId).length)) * 100} />
            <SidebarItem icon={CalendarIcon} label={t.today} onClick={() => handleSidebarClick('today')} active={engine.isTodayView} count={todayCount} progress={(engine.tasks.filter(tk => tk.dueDate && isToday(new Date(tk.dueDate)) && !tk.parentId && tk.completed).length / Math.max(1, engine.tasks.filter(tk => tk.dueDate && isToday(new Date(tk.dueDate)) && !tk.parentId).length)) * 100} />
            <SidebarItem icon={BookOpen} label={t.logbook} onClick={() => handleSidebarClick('logbook')} active={engine.isLogbookView} count={logbookCount} />
            <SidebarItem icon={Copy} label={t.templates} onClick={() => handleSidebarClick('templates')} active={engine.activeView === ViewMode.TEMPLATES} count={engine.templates.length} />
          </nav>

          <section>
            <div className="flex items-center justify-between mb-2 px-3">
              <p className="text-[10px] font-black text-things-secondary/40 uppercase tracking-widest">Projects</p>
              <button onClick={() => { const n = prompt('Project Name:'); if (n) engine.addProject(n); }} className="p-1 hover:bg-black/5 dark:hover:bg-things-hover rounded text-things-subtle"><Plus size={10}/></button>
            </div>
            <div className="space-y-0.5">
              {engine.projects.map(p => (
                <SidebarItem key={p.id} icon={Briefcase} label={p.name} active={engine.selectedProjectId === p.id} count={p.taskIds.filter(tid => !engine.tasks.find(tk => tk.id === tid)?.completed).length} onClick={() => { engine.setSelectedProjectId(p.id); engine.setSelectedTag(null); engine.setIsTodayView(false); engine.setIsLogbookView(false); engine.setActiveView(ViewMode.LIST); }} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2 px-3">
              <p className="text-[10px] font-black text-things-secondary/40 uppercase tracking-widest">{t.labels}</p>
              <button onClick={() => setIsTagModalOpen(true)} className="p-1 hover:bg-black/5 dark:hover:bg-things-hover rounded text-things-subtle"><Settings size={10}/></button>
            </div>
            <div className="space-y-0.5">
              {themedTags.map(tag => (
                <SidebarItem key={tag.id} label={tag.name} customIconColor={tag.color} active={engine.selectedTag === tag.id} count={engine.tasks.filter(tk => tk.tags.includes(tag.id) && !tk.completed && !tk.parentId).length} onClick={() => { engine.setSelectedTag(engine.selectedTag === tag.id ? null : tag.id); engine.setIsTodayView(false); engine.setIsLogbookView(false); engine.setSelectedProjectId(null); engine.setActiveView(ViewMode.LIST); }} />
              ))}
            </div>
          </section>
        </div>

        <div className="mt-4 pt-4 border-t border-things-border/30 dark:border-things-border/10 space-y-3 px-1">
          <button onClick={() => engine.setIsDarkMode(!engine.isDarkMode)} className="w-full flex items-center justify-center space-x-2 py-2 text-[11px] font-bold uppercase text-things-secondary hover:text-things-accent rounded-apple-md hover:bg-black/5 dark:hover:bg-things-hover transition-all">{engine.isDarkMode ? <Sun size={14} /> : <Moon size={14} />}<span>{t.toggleTheme}</span></button>
          <button onClick={() => { engine.addTask(t.newTask); engine.setIsLogbookView(false); }} className="w-full flex items-center justify-center space-x-2 py-3 bg-things-accent text-white rounded-apple-md font-bold text-[13px] shadow-apple-md hover:brightness-110 active:scale-[0.98] transition-all"><Plus size={18} /><span>{t.newTask}</span></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-things-lightBg dark:bg-things-bg transition-colors duration-500">
        <header className="px-8 py-4 flex items-center justify-between border-b border-things-lightBorder/30 dark:border-things-border/10 bg-things-lightBg/80 dark:bg-things-bg/80 backdrop-blur-xl z-20">
          <div className="flex items-center bg-things-lightSidebar dark:bg-things-sidebar px-4 py-2 rounded-apple-md flex-1 max-w-sm border border-things-lightBorder/50 dark:border-things-border shadow-apple-sm transition-all focus-within:ring-2 focus-within:ring-things-accent/10 focus-within:border-things-accent/40">
            <Search size={15} className="text-things-subtle opacity-50" />
            <input ref={searchInputRef} type="text" placeholder={t.search} className="bg-transparent border-none focus:outline-none ml-3 text-[13px] w-full font-medium text-things-lightText dark:text-things-text" value={engine.searchQuery} onChange={(e) => engine.setSearchQuery(e.target.value)} />
            <div className="ml-2 px-1.5 py-0.5 bg-black/5 dark:bg-things-hover rounded-apple-sm text-[9px] font-black text-things-subtle/40">S</div>
          </div>
          <div className="flex bg-things-lightSidebar dark:bg-things-sidebar p-1 rounded-apple-lg border border-things-lightBorder/50 dark:border-things-border ml-6 shadow-apple-sm transition-all">
            {[{ id: ViewMode.LIST, icon: List }, { id: ViewMode.KANBAN, icon: LayoutGrid }, { id: ViewMode.CALENDAR, icon: CalendarIcon }, { id: ViewMode.STATS, icon: BarChart3 }].map((v) => (
              <button key={v.id} onClick={() => engine.setActiveView(v.id)} disabled={engine.activeView === ViewMode.TEMPLATES} className={`p-2.5 rounded-apple-md transition-all duration-300 ${engine.activeView === v.id ? 'bg-white dark:bg-things-card shadow-apple-sm text-things-accent scale-105' : 'text-things-subtle hover:text-things-lightText dark:hover:text-things-text disabled:opacity-20'}`}><v.icon size={16} /></button>
            ))}
          </div>
        </header>

        <div className="h-0.5 w-full bg-things-border/10 relative overflow-hidden">
          <motion.div animate={{ left: `${contextProgress - 100}%` }} transition={{ type: 'spring', damping: 25, stiffness: 120 }} className={`absolute inset-y-0 w-full ${getProgressBgClass(contextProgress)}`} />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-8">
          <AnimatePresence mode="wait">
            <motion.div key={engine.activeView + (engine.isLogbookView ? '-log' : '')} initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -10 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="max-w-3xl mx-auto" >
              {engine.activeView === ViewMode.LIST && (
                <div className="space-y-6">
                  <div className="flex items-end justify-between mb-10">
                    <div>
                      <h2 className="text-[34px] font-black tracking-tighter leading-none text-things-lightText dark:text-things-text">
                        {engine.isLogbookView ? t.logbook : (engine.isTodayView ? t.today : (engine.selectedProjectId ? engine.projects.find(p => p.id === engine.selectedProjectId)?.name : (engine.selectedTag ? themedTags.find(tg => tg.id === engine.selectedTag)?.name : t.inbox)))}
                      </h2>
                      <p className="text-[11px] font-black text-things-subtle uppercase tracking-widest mt-3 opacity-50">
                        {engine.isLogbookView ? `${logbookCount} ${t.archived}` : `${contextTasks.filter(tk => tk.completed).length}/${contextTasks.length} ${t.unitsDone}`}
                      </p>
                    </div>
                  </div>
                  <Reorder.Group axis="y" values={engine.filteredTasks} onReorder={(newOrder) => { const others = engine.tasks.filter(tk => tk.parentId || !engine.filteredTasks.find(f => f.id === tk.id)); engine.setTasks([...newOrder, ...others]); }} className="space-y-3 pb-24">
                    <AnimatePresence initial={false}>
                      {engine.filteredTasks.map(task => (
                        <Reorder.Item key={task.id} value={task}>
                          <TaskCard task={task} allTasks={engine.tasks} tags={themedTags} language={engine.settings.language} onToggle={engine.toggleTask} onToggleTimer={engine.toggleTimer} onDelete={engine.deleteTask} onEdit={setEditingTask} onUpdateTask={engine.updateTask} onAddSub={(title, pid) => engine.addTask(title, pid)} />
                        </Reorder.Item>
                      ))}
                    </AnimatePresence>
                    {engine.filteredTasks.length === 0 && (
                      <div className="py-24 text-center opacity-20 flex flex-col items-center"><CheckSquare size={54} strokeWidth={1} className="mb-6 text-things-secondary" /><p className="font-black uppercase text-[11px] tracking-[0.2em] text-things-secondary">{t.frequencyClear}</p></div>
                    )}
                  </Reorder.Group>
                </div>
              )}
              {engine.activeView === ViewMode.KANBAN && <KanbanView tasks={engine.filteredTasks} language={engine.settings.language} onToggle={engine.toggleTask} onDelete={engine.deleteTask} onAddTask={engine.addTask} />}
              {engine.activeView === ViewMode.CALENDAR && <CalendarView tasks={engine.tasks} language={engine.settings.language} onToggle={engine.toggleTask} onAdd={(d) => engine.addTask(t.newTask, undefined, d.toISOString())} />}
              {engine.activeView === ViewMode.STATS && <StatsView tasks={engine.tasks} language={engine.settings.language} />}
              {engine.activeView === ViewMode.TEMPLATES && <TemplatesView templates={engine.templates} tags={themedTags} language={engine.settings.language} onAdd={engine.addTemplate} onUpdate={engine.updateTemplate} onDelete={engine.deleteTemplate} onUse={engine.useTemplate} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {editingTask && <TaskEditModal task={editingTask} tags={themedTags} language={engine.settings.language} onClose={() => setEditingTask(null)} onSave={(tk) => { engine.updateTask(tk); setEditingTask(null); }} />}
        {isTagModalOpen && <TagManagementModal tags={themedTags} language={engine.settings.language} onClose={() => setIsTagModalOpen(false)} onUpdate={engine.setTags} />}
        {isSettingsOpen && <SettingsModal settings={engine.settings} tags={themedTags} onUpdateSettings={engine.setSettings} onExport={engine.exportData} onImport={engine.importData} onReset={engine.resetAllData} onClose={() => setIsSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
