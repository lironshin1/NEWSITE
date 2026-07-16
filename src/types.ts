import { LucideIcon } from 'lucide-react';

export type AppId = 'monday' | 'dashboard' | 'settings';

export interface AppConfig {
  id: AppId;
  name: string;
  icon: LucideIcon;
  color: string;
}

// Monday Types
export type ColumnType = 'text' | 'status' | 'date' | 'person' | 'number' | 'priority' | 'time' | 'formula' | 'summary';

export interface ColumnDefinition {
  id: string;
  title: string;
  type: ColumnType;
  width?: number;
  settings?: any;
}

export interface TaskValue {
  columnId: string;
  value: any;
}

export interface Task {
  id: string;
  content: string;
  values: Record<string, any>;
  subtasks: Task[];
  isExpanded?: boolean;
}

export interface Group {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  title: string;
  columns: ColumnDefinition[];
  subtaskColumns?: ColumnDefinition[];
  groups: Group[];
  taskColumnWidth?: number;
  taskColumnTitle?: string;
  subtaskColumnTitle?: string;
  automations?: Automation[];
}

export interface Workspace {
  id: string;
  title: string;
  boards: Board[];
}

export interface Automation {
  id: string;
  trigger: {
    type: 'status_change' | 'date_reached' | 'task_created' | 'status_to_number' | 'subtask_status_change' | 'all_subtasks_status_change';
    config: any;
  };
  action: {
    type: 'move_to_group' | 'notify' | 'create_subtask' | 'change_status' | 'set_number' | 'change_parent_status';
    config: any;
  };
  enabled: boolean;
}
