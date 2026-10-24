import type { ArenaCatSlot, ArenaTimelineItem } from '@dravensoft/arena-angular';

export type Status = 'To do' | 'In progress' | 'Blocked' | 'In review' | 'Complete';
export type Priority = 'Urgent' | 'High' | 'Normal' | 'Low';

export type Person = { name: string; image: string };

export const PEOPLE: Record<string, Person> = {
  ada: { name: 'Ada Okonjo', image: 'img/u1.jpg' },
  ben: { name: 'Ben Yusuf', image: 'img/u2.jpg' },
  cai: { name: 'Cai Wen', image: 'img/u3.jpg' },
  dia: { name: 'Dia Novak', image: 'img/u4.jpg' },
  eli: { name: 'Eli Ferrand', image: 'img/u5.jpg' },
  fay: { name: 'Fay Ortiz', image: 'img/u6.jpg' },
};

export type Task = {
  id: string;
  name: string;
  status: Status;
  priority: Priority;
  assignees: string[];
  due: string;
  progress: number;
  points: number;
  tags: string[];
  comments: number;
  subtasks: number;
};

export const STATUS_ORDER: Status[] = ['To do', 'In progress', 'Blocked', 'In review', 'Complete'];

export const STATUS_SLOT: Record<Status, ArenaCatSlot> = {
  'To do': 7,
  'In progress': 1,
  Blocked: 6,
  'In review': 4,
  Complete: 5,
};

export const PRIORITY_SLOT: Record<Priority, number> = {
  Urgent: 6, High: 4, Normal: 2, Low: 7,
};

export const TASKS: Task[] = [
  { id: 'CU-241', name: 'Rebuild the onboarding checklist', status: 'In progress', priority: 'Urgent', assignees: ['ada', 'ben'], due: 'Aug 19', progress: 64, points: 8, tags: ['Growth'], comments: 12, subtasks: 4 },
  { id: 'CU-238', name: 'Instrument the activation funnel', status: 'In progress', priority: 'High', assignees: ['cai'], due: 'Aug 21', progress: 40, points: 5, tags: ['Data', 'Growth'], comments: 3, subtasks: 2 },
  { id: 'CU-255', name: 'Move billing to the new pricing table', status: 'Blocked', priority: 'Urgent', assignees: ['dia', 'eli'], due: 'Aug 17', progress: 15, points: 13, tags: ['Billing'], comments: 21, subtasks: 7 },
  { id: 'CU-201', name: 'Ship the workspace search rewrite', status: 'In review', priority: 'High', assignees: ['ben'], due: 'Aug 20', progress: 92, points: 13, tags: ['Platform'], comments: 8, subtasks: 5 },
  { id: 'CU-262', name: 'Audit the notification preferences screen', status: 'To do', priority: 'Normal', assignees: ['fay'], due: 'Aug 27', progress: 0, points: 3, tags: ['Design'], comments: 1, subtasks: 0 },
  { id: 'CU-264', name: 'Reduce cold start on the mobile client', status: 'To do', priority: 'High', assignees: ['cai', 'ada'], due: 'Sep 02', progress: 0, points: 8, tags: ['Mobile', 'Perf'], comments: 0, subtasks: 3 },
  { id: 'CU-190', name: 'Retire the legacy webhook worker', status: 'Complete', priority: 'Low', assignees: ['eli'], due: 'Aug 08', progress: 100, points: 5, tags: ['Platform'], comments: 6, subtasks: 2 },
  { id: 'CU-208', name: 'Localise the trial expiry emails', status: 'Complete', priority: 'Normal', assignees: ['dia'], due: 'Aug 11', progress: 100, points: 3, tags: ['Growth'], comments: 4, subtasks: 1 },
  { id: 'CU-271', name: 'Design the new dashboard widget picker', status: 'To do', priority: 'Normal', assignees: ['fay', 'ada'], due: 'Sep 09', progress: 0, points: 8, tags: ['Design'], comments: 2, subtasks: 0 },
  { id: 'CU-249', name: 'Fix the timezone drift on recurring tasks', status: 'In review', priority: 'Urgent', assignees: ['ben', 'cai'], due: 'Aug 18', progress: 88, points: 5, tags: ['Platform', 'Bug'], comments: 17, subtasks: 3 },
  { id: 'CU-266', name: 'Add SSO group mapping', status: 'Blocked', priority: 'Normal', assignees: ['eli'], due: 'Sep 05', progress: 25, points: 13, tags: ['Security'], comments: 9, subtasks: 6 },
  { id: 'CU-233', name: 'Split the reporting service off the monolith', status: 'In progress', priority: 'Normal', assignees: ['cai', 'dia', 'eli'], due: 'Sep 12', progress: 55, points: 21, tags: ['Platform'], comments: 14, subtasks: 9 },
];

export const TAG_SLOT: Record<string, number> = {
  Growth: 1, Data: 2, Billing: 3, Platform: 4, Design: 5, Mobile: 6, Perf: 7, Bug: 8, Security: 3,
};

/* Dashboard */

export const BURNDOWN_LABELS = ['Aug 1', 'Aug 4', 'Aug 7', 'Aug 10', 'Aug 13', 'Aug 16', 'Aug 19'];
export const BURNDOWN = [
  { label: 'Remaining', values: [96, 88, 81, 69, 58, 44, 31], colorId: 1 },
  { label: 'Ideal', values: [96, 80, 64, 48, 32, 16, 0], colorId: 7 },
];

export const THROUGHPUT_LABELS = ['Wk 27', 'Wk 28', 'Wk 29', 'Wk 30', 'Wk 31', 'Wk 32'];
export const THROUGHPUT = [
  { label: 'Shipped', values: [11, 14, 9, 17, 15, 19], colorId: 5 },
  { label: 'Reopened', values: [2, 1, 4, 1, 3, 1], colorId: 6 },
];

export const WORKLOAD_LABELS = ['Ada', 'Ben', 'Cai', 'Dia', 'Eli', 'Fay'];
export const WORKLOAD = [{ label: 'Story points assigned', values: [24, 18, 34, 16, 39, 11], colorId: 2 }];

export const STATUS_SPLIT_LABELS = STATUS_ORDER as readonly string[];
export const STATUS_SPLIT = [
  {
    label: 'Tasks by status',
    values: STATUS_ORDER.map((status) => TASKS.filter((task) => task.status === status).length),
    colorIds: STATUS_ORDER.map((status) => STATUS_SLOT[status]),
  },
];

export const FUNNEL_LABELS = ['Created', 'Started', 'In review', 'Done'];
export const FUNNEL = [{ label: 'Tasks', values: [48, 36, 27, 19] }];

export const PRIORITY_ORDER: Priority[] = ['Urgent', 'High', 'Normal', 'Low'];
export const OPEN_CLOSE_LABELS = PRIORITY_ORDER as readonly string[];
export const OPEN_CLOSE = [
  { label: 'Opened', values: [7, 12, 18, 9], colorId: 4 },
  { label: 'Closed', values: [5, 10, 14, 4], colorId: 5 },
];

/* The sprint is one thing moving through stages, so its stages are a timeline and not a feed. */
export const MILESTONES: ArenaTimelineItem[] = [
  { id: 'm1', title: 'Sprint planned', description: '12 tasks and 96 points committed.', time: 'Aug 12', dateTime: '2026-08-12' },
  { id: 'm2', title: 'Scope added', description: '13 points joined after the start.', time: 'Aug 15', dateTime: '2026-08-15', tone: 'warning' },
  { id: 'm3', title: 'Mid-sprint review', description: 'Burndown checked against the ideal line.', time: 'Aug 19', dateTime: '2026-08-19' },
  { id: 'm4', title: 'Code freeze', time: 'Aug 23', dateTime: '2026-08-23' },
  { id: 'm5', title: 'Demo and retro', time: 'Aug 26', dateTime: '2026-08-26' },
];
export const MILESTONE_NOW = 2;

export type Activity = { id: string; actor: string; action: string; target: string; time: string; tone?: 'success' | 'warning' | 'danger' | 'neutral' };

export const ACTIVITY: Activity[] = [
  { id: 'a1', actor: 'Ben Yusuf', action: 'moved to review', target: 'CU-201', time: '4m' },
  { id: 'a2', actor: 'Dia Novak', action: 'blocked', target: 'CU-255', time: '22m', tone: 'danger' },
  { id: 'a3', actor: 'Eli Ferrand', action: 'closed', target: 'CU-190', time: '1h', tone: 'success' },
  { id: 'a4', actor: 'Cai Wen', action: 'commented on', target: 'CU-233', time: '2h', tone: 'neutral' },
  { id: 'a5', actor: 'Ada Okonjo', action: 'raised the priority of', target: 'CU-241', time: '3h', tone: 'warning' },
];
