
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, Priority, ViewMode, AppSettings, AppBackup, Tag, TaskTemplate, Project } from './types';
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('things-theme');
    return saved === 'dark';
  });
  
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.LIST);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isTodayView, setIsTodayView] = useState(false);
  const [isLogbookView, setIsLogbookView] = useState(false);

  // 1. Initial Load Sequence
  useEffect(() => {
    const initialize = async () => {
      await initBridge();
      const saved = await loadData(BACKUP_KEY);

      if (saved) {
        if (saved.tasks) setTasks(saved.tasks);
        if (saved.tags) setTags(saved.tags);
        if (saved.projects) setProjects(saved.projects);
        if (saved.templates) setTemplates(saved.templates);
        if (saved.settings) setSettings({ ...INITIAL_SETTINGS, ...saved.settings });
      } else {
        const legacyTasks = localStorage.getItem('things-tasks-v4');
        if (legacyTasks) setTasks(JSON.parse(legacyTasks));
      }
      setIsLoaded(true);
    };
    initialize();
  }, []);

  // 2. Persistent Saving
  useEffect(() => {
    if (!isLoaded) return;
    const dataToSave = {
      tasks,
      tags,
      projects,
      templates,
      settings,
      version: '1.1.0'
    };
    autoSave(BACKUP_KEY, dataToSave);
    
    localStorage.setItem('things-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [tasks, tags, projects, templates, settings, isDarkMode, isLoaded]);

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

    if (selectedProjectId && !parentId) {
      setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, taskIds: [...p.taskIds, id] } : p));
    }

    return id;
  }, [settings.defaultPriority, isTodayView, selectedTag, selectedProjectId]);

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
    setTasks(prev => prev.map(t => {
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
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const toDelete = new Set([id]);
      const target = prev.find(t => t.id === id);
      if (target) target.subtaskIds.forEach(sid => toDelete.add(sid));
      return prev.filter(t => !toDelete.has(t.id));
    });
    setProjects(prev => prev.map(p => ({ ...p, taskIds: p.taskIds.filter(tid => tid !== id) })));
  }, []);

  const addProject = useCallback((name: string) => {
    const id = `project-${Math.random().toString(36).substr(2, 5)}`;
    setProjects(prev => [...prev, { id, name, color: '#4C8DFF', taskIds: [] }]);
    return id;
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  }, [selectedProjectId]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const tagMap = new Map(tags.map(tg => [tg.id, tg.name.toLowerCase()]));

    return tasks.filter(t => {
      if (t.parentId) return false;

      // Project filter
      if (selectedProjectId) {
        const project = projects.find(p => p.id === selectedProjectId);
        if (!project || !project.taskIds.includes(t.id)) return false;
      }

      // Deep Search (Title + Description + Tag names)
      const taskTagNames = t.tags.map(tid => tagMap.get(tid) || '').join(' ');
      const matchesSearch = !query || 
        t.title.toLowerCase().includes(query) || 
        (t.description || '').toLowerCase().includes(query) ||
        taskTagNames.includes(query);

      const matchesTag = !selectedTag || t.tags.includes(selectedTag);
      const matchesToday = !isTodayView || (t.dueDate ? isToday(new Date(t.dueDate)) : false);

      if (isLogbookView) return t.completed && matchesSearch && matchesTag;
      return !t.completed && matchesSearch && matchesTag && matchesToday;
    });
  }, [tasks, searchQuery, selectedTag, selectedProjectId, isTodayView, isLogbookView, projects, tags]);

  // Fixed missing template management functions
  const addTemplate = useCallback((template: Omit<TaskTemplate, 'id'>) => {
    const id = `template-${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate = { ...template, id } as TaskTemplate;
    setTemplates(prev => [...prev, newTemplate]);
    return id;
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

  return {
    isLoaded,
    tasks, setTasks,
    tags, setTags,
    projects, setProjects,
    templates, setTemplates,
    settings, setSettings,
    filteredTasks,
    isDarkMode, setIsDarkMode,
    activeView, setActiveView,
    searchQuery, setSearchQuery,
    selectedTag, setSelectedTag,
    selectedProjectId, setSelectedProjectId,
    isTodayView, setIsTodayView,
    isLogbookView, setIsLogbookView,
    addTask, updateTask, toggleTask, toggleTimer, deleteTask,
    addProject, deleteProject,
    addTemplate, updateTemplate, deleteTemplate, useTemplate,
    exportData: useCallback(() => {
      const data: AppBackup = { tasks, tags, templates, settings, projects, version: '1.1.0' };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `things-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }, [tasks, tags, templates, settings, projects]),
    importData: useCallback((json: string) => {
      try {
        const data: any = JSON.parse(json);
        if (data.tasks) setTasks(data.tasks);
        if (data.tags) setTags(data.tags);
        if (data.projects) setProjects(data.projects);
        if (data.templates) setTemplates(data.templates);
        if (data.settings) setSettings(data.settings);
      } catch (e) { console.error('Import failed', e); }
    }, []),
    resetAllData: useCallback(() => {
      if (window.confirm('Reset all data?')) {
        setTasks([]);
        setProjects([]);
        setTemplates([]);
        setSettings(INITIAL_SETTINGS);
        localStorage.clear();
        window.location.reload();
      }
    }, [])
  };
}
