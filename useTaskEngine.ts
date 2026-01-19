
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, Priority, ViewMode, AppSettings, AppBackup, Tag, TaskTemplate } from './types';
import { isToday } from 'date-fns';
import { autoSave, initBridge, loadData } from './bridge';
import { INITIAL_TAGS } from './constants';

const INITIAL_SETTINGS: AppSettings = {
  userName: 'User',
  defaultPriority: Priority.MEDIUM,
  enableSounds: true,
  autoArchive: false,
  language: 'zh'
};

const BACKUP_KEY = 'things-pro-backup';

export function useTaskEngine() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>(INITIAL_TAGS);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('things-theme');
    return saved === 'dark';
  });
  
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.LIST);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isTodayView, setIsTodayView] = useState(false);
  const [isLogbookView, setIsLogbookView] = useState(false);

  // 1. Initial Load Sequence
  useEffect(() => {
    const initialize = async () => {
      // Establish connection
      await initBridge();

      // Fetch data from bridge or local
      const saved = await loadData(BACKUP_KEY);

      if (saved) {
        if (saved.tasks) setTasks(saved.tasks);
        if (saved.tags) setTags(saved.tags);
        if (saved.templates) setTemplates(saved.templates);
        if (saved.settings) setSettings({ ...INITIAL_SETTINGS, ...saved.settings });
      } else {
        // Fallback for first-time usage if loadData returns null
        const legacyTasks = localStorage.getItem('things-tasks-v4');
        if (legacyTasks) setTasks(JSON.parse(legacyTasks));
        const legacyTemplates = localStorage.getItem('things-templates-v1');
        if (legacyTemplates) setTemplates(JSON.parse(legacyTemplates));
      }
      
      setIsLoaded(true);
    };

    initialize();
  }, []);

  // 2. Persistent Saving
  useEffect(() => {
    // IMPORTANT: Only save if data has been loaded to avoid overwriting with empty defaults
    if (!isLoaded) return;

    const dataToSave = {
      tasks,
      tags,
      templates,
      settings,
      version: '1.0.0'
    };

    autoSave(BACKUP_KEY, dataToSave);
    
    // Compatibility keys
    localStorage.setItem('things-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [tasks, tags, templates, settings, isDarkMode, isLoaded]);

  const addTask = useCallback((title: string, parentId?: string, dueDate?: string, extra?: Partial<Task>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const finalDueDate = dueDate || (isTodayView && !parentId ? new Date().toISOString() : undefined);

    const newTask: Task = {
      id,
      title: title || 'New Task',
      description: '',
      completed: false,
      priority: settings.defaultPriority,
      tags: (selectedTag && !parentId) ? [selectedTag] : [],
      createdAt: new Date().toISOString(),
      subtaskIds: [],
      parentId,
      dueDate: finalDueDate,
      timeSpent: 0,
      ...extra
    };
    
    setTasks(prev => {
      const next = [...prev, newTask];
      if (parentId) {
        return next.map(t => t.id === parentId ? { ...t, subtaskIds: [...t.subtaskIds, id] } : t);
      }
      return next;
    });
    return id;
  }, [settings.defaultPriority, isTodayView, selectedTag]);

  const updateTask = useCallback((updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => {
      const target = prev.find(t => t.id === id);
      if (!target) return prev;
      const newState = !target.completed;
      
      let finalTimerStartedAt = target.timerStartedAt;
      let finalTimeSpent = target.timeSpent;
      if (newState && target.timerStartedAt) {
        const elapsed = Math.floor((new Date().getTime() - new Date(target.timerStartedAt).getTime()) / 1000);
        finalTimeSpent += elapsed;
        finalTimerStartedAt = undefined;
      }

      const childIds = new Set(target.subtaskIds);
      return prev.map(t => {
        if (t.id === id) return { ...t, completed: newState, timeSpent: finalTimeSpent, timerStartedAt: finalTimerStartedAt };
        if (childIds.has(t.id)) return { ...t, completed: newState };
        return t;
      });
    });
  }, []);

  const toggleTimer = useCallback((id: string) => {
    setTasks(prev => {
      return prev.map(t => {
        if (t.id === id) {
          if (t.timerStartedAt) {
            const elapsed = Math.floor((new Date().getTime() - new Date(t.timerStartedAt).getTime()) / 1000);
            return { ...t, timeSpent: t.timeSpent + elapsed, timerStartedAt: undefined };
          } else {
            return { ...t, timerStartedAt: new Date().toISOString() };
          }
        } else if (t.timerStartedAt) {
          const elapsed = Math.floor((new Date().getTime() - new Date(t.timerStartedAt).getTime()) / 1000);
          return { ...t, timeSpent: t.timeSpent + elapsed, timerStartedAt: undefined };
        }
        return t;
      });
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const toDelete = new Set([id]);
      const target = prev.find(t => t.id === id);
      if (target) target.subtaskIds.forEach(sid => toDelete.add(sid));
      return prev.filter(t => !toDelete.has(t.id));
    });
  }, []);

  const addTemplate = useCallback((template: Partial<TaskTemplate>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTemplate: TaskTemplate = {
      id,
      name: template.name || 'New Template',
      title: template.title || 'Task Title',
      description: template.description || '',
      priority: template.priority || Priority.MEDIUM,
      tags: template.tags || [],
      subtasks: template.subtasks || []
    };
    setTemplates(prev => [...prev, newTemplate]);
  }, []);

  const updateTemplate = useCallback((updated: TaskTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const useTemplate = useCallback((id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    const parentId = addTask(template.title, undefined, undefined, {
      description: template.description,
      priority: template.priority,
      tags: template.tags
    });
    if (template.subtasks) template.subtasks.forEach(sub => addTask(sub.title, parentId));
  }, [templates, addTask]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.parentId) return false;
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || t.tags.includes(selectedTag);
      const matchesToday = !isTodayView || (t.dueDate ? isToday(new Date(t.dueDate)) : false);
      if (isLogbookView) return t.completed && matchesSearch && matchesTag;
      return !t.completed && matchesSearch && matchesTag && matchesToday;
    });
  }, [tasks, searchQuery, selectedTag, isTodayView, isLogbookView]);

  return {
    isLoaded,
    tasks, setTasks,
    tags, setTags,
    templates, setTemplates,
    settings, setSettings,
    filteredTasks,
    isDarkMode, setIsDarkMode,
    activeView, setActiveView,
    searchQuery, setSearchQuery,
    selectedTag, setSelectedTag,
    isTodayView, setIsTodayView,
    isLogbookView, setIsLogbookView,
    addTask, updateTask, toggleTask, toggleTimer, deleteTask,
    addTemplate, updateTemplate, deleteTemplate,
    useTemplate,
    exportData: useCallback(() => {
      const data: AppBackup = {
        tasks,
        tags,
        templates,
        settings,
        version: '1.0.0'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `things-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }, [tasks, tags, templates, settings]),
    importData: useCallback((json: string) => {
      try {
        const data: AppBackup = JSON.parse(json);
        if (data.tasks) setTasks(data.tasks);
        if (data.tags) setTags(data.tags);
        if (data.templates) setTemplates(data.templates);
        if (data.settings) setSettings(data.settings);
      } catch (e) {
        console.error('Import failed', e);
      }
    }, []),
    resetAllData: useCallback(() => {
      if (window.confirm('Reset all data? This cannot be undone.')) {
        setTasks([]);
        setTemplates([]);
        setSettings(INITIAL_SETTINGS);
        localStorage.clear();
        window.location.reload();
      }
    }, [])
  };
}
