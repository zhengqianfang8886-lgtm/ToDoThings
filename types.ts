
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum ViewMode {
  LIST = 'list',
  KANBAN = 'kanban',
  CALENDAR = 'calendar',
  STATS = 'stats',
  LOGBOOK = 'logbook',
  TEMPLATES = 'templates'
}

export interface AppSettings {
  userName: string;
  defaultPriority: Priority;
  enableSounds: boolean;
  autoArchive: boolean;
  language: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  tags: string[]; // Tag IDs
  dueDate?: string;
  createdAt: string;
  parentId?: string; // For nesting
  subtaskIds: string[];
  timeSpent: number; // in seconds
  timerStartedAt?: string; // ISO string if timer is running
}

export interface TemplateSubtask {
  id: string;
  title: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  priority: Priority;
  tags: string[];
  subtasks: TemplateSubtask[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  taskIds: string[];
}

export interface AppBackup {
  tasks: Task[];
  tags: Tag[];
  templates: TaskTemplate[];
  settings: AppSettings;
  version: string;
}
