export const HOST = {
  name: 'Ines Marchetti',
  role: 'Head of Partnerships, Northwind',
  avatar: 'img/host.jpg',
};

export const EVENT = {
  title: 'Partnership intro call',
  duration: '30 min',
  location: 'Web conference, link sent on confirmation',
  blurb:
    'A first conversation about whether there is something worth building together. Come with the '
    + 'shape of what you have in mind; nothing needs to be finished.',
};

export const MONTH = 'September 2026';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type Day = { n: number; open: boolean; muted?: boolean };

export const DAYS: Day[] = [
  ...[31].map((n) => ({ n, open: false, muted: true })),
  ...Array.from({ length: 30 }, (_, i) => {
    const n = i + 1;
    const weekend = (n + 1) % 7 === 0 || (n + 2) % 7 === 0;
    return { n, open: !weekend && n >= 8 && n <= 26 };
  }),
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ n, open: false, muted: true })),
];

export const SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00',
  '13:00', '13:30', '14:00', '15:30', '16:00',
];

export const ZONES = [
  { value: 'lisbon', label: 'Western European Time (10:41)' },
  { value: 'madrid', label: 'Central European Time (11:41)' },
  { value: 'london', label: 'United Kingdom Time (10:41)' },
  { value: 'new-york', label: 'Eastern Time, US and Canada (05:41)' },
];

export const GUESTS = [
  { value: 'none', label: 'Just me', hint: 'Nobody else is invited' },
  { value: 'team', label: 'Bring my team', hint: 'Up to four more addresses' },
];
