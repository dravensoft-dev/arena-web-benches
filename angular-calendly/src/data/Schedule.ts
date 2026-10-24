export const ZONE = 'Europe/Lisbon';

export const WEEK = '2026-09-14';

export type Meeting = {
  id: string;
  title: string;
  who: string;
  start: string;
  end: string;
  kind: 1 | 2 | 3;
};

/* One slot of the ramp per event type, so a type keeps its colour wherever it appears. */
export const MEETINGS: Meeting[] = [
  { id: 'm1', title: 'Intro call, Daniel Okafor', who: 'Daniel Okafor', start: '2026-09-14T10:00:00+01:00', end: '2026-09-14T10:30:00+01:00', kind: 1 },
  { id: 'm2', title: 'Quarterly partner review', who: 'Fabrikam, four guests', start: '2026-09-15T14:00:00+01:00', end: '2026-09-15T15:00:00+01:00', kind: 2 },
  { id: 'm3', title: 'Intro call, Priya Raman', who: 'Priya Raman', start: '2026-09-16T09:30:00+01:00', end: '2026-09-16T10:00:00+01:00', kind: 1 },
  { id: 'm4', title: 'Intro call, Tomas Varga', who: 'Tomas Varga', start: '2026-09-17T14:00:00+01:00', end: '2026-09-17T14:30:00+01:00', kind: 1 },
  { id: 'm5', title: 'Integration deep dive', who: 'Contoso engineering', start: '2026-09-17T15:30:00+01:00', end: '2026-09-17T17:00:00+01:00', kind: 3 },
  { id: 'm6', title: 'Intro call, Lena Haas', who: 'Lena Haas', start: '2026-09-17T16:00:00+01:00', end: '2026-09-17T16:30:00+01:00', kind: 1 },
  { id: 'm7', title: 'Quarterly partner review', who: 'Tailspin, two guests', start: '2026-09-18T11:00:00+01:00', end: '2026-09-18T12:00:00+01:00', kind: 2 },
];

export const LINK = 'https://book.northwind.example/ines-marchetti/partnership-intro';

export const WEEKDAY_OPTIONS = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
];

export const BOOKING_STEPS = [
  { label: 'Time', description: 'A day and a slot' },
  { label: 'Details', description: 'Who is coming' },
  { label: 'Confirmed', description: 'The invitation is sent' },
];
