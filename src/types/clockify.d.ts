// Clockify API Type Definitions

export interface ClockifyConfig {
  apiKey?: string;
  workspaceId?: string;
  defaultProject?: string;
  timeFormat: '12h' | '24h';
  billableByDefault: boolean;
  autoStartTimer: boolean;
  notificationsEnabled: boolean;
}

export interface TimeEntry {
  id: string;
  description: string;
  start: Date;
  end?: Date;
  project?: Project;
  task?: Task;
  billable: boolean;
  tags?: Tag[];
  userId: string;
  workspaceId: string;
}

export interface Project {
  id: string;
  name: string;
  client?: Client;
  color: string;
  archived: boolean;
  billable: boolean;
  estimate?: ProjectEstimate;
  workspaceId: string;
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
  assigneeIds: string[];
  estimate?: TaskEstimate;
  status: 'ACTIVE' | 'DONE';
}

export interface Client {
  id: string;
  name: string;
  workspaceId: string;
  archived: boolean;
}

export interface Tag {
  id: string;
  name: string;
  workspaceId: string;
  archived: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  hourlyRate?: number;
  memberships: WorkspaceMembership[];
  workspaceSettings: WorkspaceSettings;
}

export interface WorkspaceMembership {
  userId: string;
  hourlyRate?: number;
  costRate?: number;
  targetId: string;
  membershipType: 'WORKSPACE' | 'PROJECT';
  membershipStatus: 'PENDING' | 'ACTIVE' | 'DECLINED' | 'INACTIVE';
}

export interface WorkspaceSettings {
  timeRoundingInReports: boolean;
  onlyAdminsSeeBillableRates: boolean;
  onlyAdminsCreateProject: boolean;
  onlyAdminsSeeDashboard: boolean;
  defaultBillableProjects: boolean;
  lockTimeEntries?: Date;
  round: {
    round: string;
    minutes: string;
  };
  projectFavorites: boolean;
  canSeeTimeSheet: boolean;
  canSeeTracker: boolean;
  projectPickerSpecialFilter: boolean;
  forceProjects: boolean;
  forceTasks: boolean;
  forceDescription: boolean;
  onlyAdminsSeeAllTimeEntries: boolean;
  onlyAdminsSeePublicProjectsEntries: boolean;
  trackTimeDownToSecond: boolean;
  projectGroupingLabel: string;
  adminOnlyPages: string[];
  automaticLock?: {
    changeDay: string;
    dayOfMonth: number;
    firstDay: string;
    olderThanPeriod: string;
    olderThanValue: number;
    type: string;
  };
  onlyAdminsCreateTag: boolean;
  onlyAdminsCreateTask: boolean;
  timeTrackingMode: 'DEFAULT' | 'STOPWATCH_ONLY';
  isProjectPublicByDefault: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  memberships: WorkspaceMembership[];
  profilePicture: string;
  activeWorkspace: string;
  defaultWorkspace: string;
  settings: UserSettings;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UserSettings {
  weekStart: string;
  timeZone: string;
  timeFormat: string;
  dateFormat: string;
  sendNewsletter: boolean;
  weeklyUpdates: boolean;
  longRunning: boolean;
  scheduledReports: boolean;
  approval: boolean;
  pto: boolean;
  alerts: boolean;
  reminders: boolean;
  timeTrackingManual: boolean;
  summaryReportSettings: {
    group: string;
    subgroup: string;
  };
  isCompactViewOn: boolean;
  dashboardSelection: string;
  dashboardViewType: string;
  dashboardPinToTop: boolean;
  projectListCollapse: number;
  collapseAllProjectLists: boolean;
  groupSimilarEntriesDisabled: boolean;
  myStartOfDay: string;
  projectPickerTaskFilter: boolean;
  lang: string;
  multiFactorEnabled: boolean;
  theme: string;
}

export interface ProjectEstimate {
  estimate: string;
  type: 'AUTO' | 'MANUAL';
}

export interface TaskEstimate {
  estimate: string;
  type: 'AUTO' | 'MANUAL';
}

// API Response Types
export interface ClockifyApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: number;
  };
}

export interface TimeEntryRequest {
  start: string; // ISO 8601 format
  end?: string;
  billable?: boolean;
  description?: string;
  projectId?: string;
  taskId?: string;
  tagIds?: string[];
}

export interface ApiError {
  message: string;
  code: number;
  details?: Record<string, unknown>;
}

// CLI Specific Types
export interface CliOptions {
  project?: string;
  task?: string;
  description?: string;
  billable?: boolean;
  startTime?: string;
  endTime?: string;
  format?: 'table' | 'json' | 'csv';
  verbose?: boolean;
}

export interface TimerStatus {
  isRunning: boolean;
  currentEntry?: TimeEntry;
  elapsed?: string;
  project?: string;
  task?: string;
  description?: string;
}

export interface ReportOptions {
  period: 'today' | 'week' | 'month' | 'custom';
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
  format?: 'table' | 'json' | 'csv';
  export?: boolean;
}

export interface DatabaseSchema {
  timeEntries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
  workspaces: Workspace[];
  lastSync: Date;
}

// Security Types
export interface SecureCredentials {
  apiKey: string;
  expiresAt?: Date;
  refreshToken?: string;
}

export interface ValidationSchema {
  apiKey: RegExp;
  projectName: RegExp;
  description: RegExp;
  timeFormat: RegExp;
} 