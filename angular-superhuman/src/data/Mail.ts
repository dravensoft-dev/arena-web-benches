export type Thread = {
  id: string;
  from: string;
  avatar: string;
  to: string;
  subject: string;
  snippet: string;
  body: string[];
  at: string;
  unread: boolean;
  starred: boolean;
  split: 'important' | 'other';
  labels: string[];
  attachments: { name: string; size: string; img: string }[];
  count: number;
};

export const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: 'ph-bold ph-tray', badge: '12' },
  { id: 'starred', label: 'Starred', icon: 'ph-bold ph-star' },
  { id: 'snoozed', label: 'Snoozed', icon: 'ph-bold ph-clock-countdown', badge: '3' },
  { id: 'sent', label: 'Sent', icon: 'ph-bold ph-paper-plane-tilt' },
  { id: 'drafts', label: 'Drafts', icon: 'ph-bold ph-note-pencil', badge: '2' },
  { id: 'archive', label: 'Archive', icon: 'ph-bold ph-archive' },
];

export const TEAMS = [
  { id: 'design', label: 'Design review', icon: 'ph-bold ph-hash' },
  { id: 'launch', label: 'Launch', icon: 'ph-bold ph-hash', badge: '5' },
  { id: 'hiring', label: 'Hiring', icon: 'ph-bold ph-hash' },
];

export const THREADS: Thread[] = [
  {
    id: 'contract',
    from: 'Priya Raghunathan',
    avatar: 'img/a1.jpg',
    to: 'you, Marcus, legal',
    subject: 'Redlines on the Wexler contract, section 4 only',
    snippet: 'Legal came back on section 4 and nothing else. Their two asks are the notice period and',
    body: [
      'Legal came back on section 4 and nothing else, which is better than we expected.',
      'Their two asks are the notice period, which they want at sixty days rather than thirty, and the audit clause, which they want to cover subprocessors as well. Neither is a problem for us. I have marked both in the attached copy and left the rest untouched.',
      'If you are happy with the notice period I will send it back this afternoon and we should have it signed before the end of the week.',
    ],
    at: '09:41',
    unread: true,
    starred: true,
    split: 'important',
    labels: ['Legal', 'Wexler'],
    attachments: [
      { name: 'wexler-contract-v4.pdf', size: '284 KB', img: 'img/d1.jpg' },
      { name: 'redlines-summary.pdf', size: '62 KB', img: 'img/d2.jpg' },
    ],
    count: 4,
  },
  {
    id: 'standup',
    from: 'Marcus Bell',
    avatar: 'img/a2.jpg',
    to: 'engineering',
    subject: 'Standup notes, Tuesday',
    snippet: 'Short one today. The migration is through staging and the rollback path is tested.',
    body: ['Short one today. The migration is through staging and the rollback path is tested.'],
    at: '09:12',
    unread: true,
    starred: false,
    split: 'important',
    labels: ['Engineering'],
    attachments: [],
    count: 1,
  },
  {
    id: 'invoice',
    from: 'Nordhaus Studio',
    avatar: 'img/a3.jpg',
    to: 'accounts',
    subject: 'Invoice 2291 is now overdue',
    snippet: 'This is a reminder that invoice 2291 for the October retainer is now fourteen days past',
    body: ['This is a reminder that invoice 2291 for the October retainer is now fourteen days past its due date.'],
    at: '08:55',
    unread: false,
    starred: false,
    split: 'important',
    labels: ['Finance'],
    attachments: [],
    count: 2,
  },
  {
    id: 'hiring',
    from: 'Sofia Almeida',
    avatar: 'img/a4.jpg',
    to: 'you',
    subject: 'Two more for the staff engineer loop',
    snippet: 'Both came through the referral from Ana. I have put my notes against each of them in the',
    body: ['Both came through the referral from Ana. I have put my notes against each of them in the tracker.'],
    at: 'Yesterday',
    unread: false,
    starred: true,
    split: 'important',
    labels: ['Hiring'],
    attachments: [],
    count: 3,
  },
  {
    id: 'launch',
    from: 'Tobias Lund',
    avatar: 'img/a5.jpg',
    to: 'launch',
    subject: 'Copy for the pricing page, second pass',
    snippet: 'I cut the middle section entirely. It was answering a question nobody asked and it made the',
    body: ['I cut the middle section entirely. It was answering a question nobody asked and it made the page twice as long.'],
    at: 'Yesterday',
    unread: false,
    starred: false,
    split: 'important',
    labels: ['Launch', 'Copy'],
    attachments: [{ name: 'pricing-copy-v2.md', size: '9 KB', img: 'img/d3.jpg' }],
    count: 6,
  },
  {
    id: 'digest',
    from: 'Ledger Weekly',
    avatar: 'img/a6.jpg',
    to: 'you',
    subject: 'The week in payments infrastructure',
    snippet: 'Three acquisitions, one outage, and a regulator that has finally said something concrete.',
    body: ['Three acquisitions, one outage, and a regulator that has finally said something concrete.'],
    at: 'Monday',
    unread: false,
    starred: false,
    split: 'other',
    labels: [],
    attachments: [],
    count: 1,
  },
  {
    id: 'receipt',
    from: 'Kestrel Cloud',
    avatar: 'img/a7.jpg',
    to: 'accounts',
    subject: 'Your October usage summary',
    snippet: 'Your October usage came to 4,182 compute hours across three regions.',
    body: ['Your October usage came to 4,182 compute hours across three regions.'],
    at: 'Monday',
    unread: false,
    starred: false,
    split: 'other',
    labels: ['Finance'],
    attachments: [],
    count: 1,
  },
  {
    id: 'event',
    from: 'Ana Ferreira',
    avatar: 'img/a8.jpg',
    to: 'you, Priya',
    subject: 'Dinner on the 14th, moved to the 15th',
    snippet: 'The restaurant lost our booking so I have moved it a day. Same time, same place.',
    body: ['The restaurant lost our booking so I have moved it a day. Same time, same place.'],
    at: 'Sunday',
    unread: false,
    starred: false,
    split: 'other',
    labels: [],
    attachments: [],
    count: 2,
  },
];

export const COMMANDS = [
  { id: 'archive', label: 'Archive conversation', icon: 'ph-bold ph-archive', group: 'This conversation' },
  { id: 'snooze', label: 'Snooze until tomorrow', icon: 'ph-bold ph-clock-countdown', group: 'This conversation' },
  { id: 'reply', label: 'Reply', icon: 'ph-bold ph-arrow-bend-up-left', group: 'This conversation' },
  { id: 'forward', label: 'Forward', icon: 'ph-bold ph-arrow-bend-double-up-right', group: 'This conversation' },
  { id: 'label', label: 'Add label', icon: 'ph-bold ph-tag', group: 'Organise' },
  { id: 'split', label: 'Move to Other', icon: 'ph-bold ph-arrows-split', group: 'Organise' },
];

/* Where a snoozed conversation comes back, and what the send caret offers besides sending now. */
export const SNOOZES = [
  { value: 'evening', label: 'Later today', hint: 'Today at 18:00' },
  { value: 'tomorrow', label: 'Tomorrow', hint: 'Wednesday at 08:00' },
  { value: 'weekend', label: 'This weekend', hint: 'Saturday at 09:00' },
  { value: 'week', label: 'Next week', hint: 'Monday at 08:00' },
];

export const SENDS = [
  { label: 'Send later', icon: 'ph-bold ph-clock' },
  { label: 'Send and archive', icon: 'ph-bold ph-archive' },
];

export function thread(id: string) {
  const found = THREADS.find((one) => one.id === id);
  if (!found) throw new Error(`no thread ${id}`);
  return found;
}
