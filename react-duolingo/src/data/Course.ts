export type NodeState = 'done' | 'active' | 'locked';
export type NodeKind = 'lesson' | 'story' | 'chest' | 'trophy';

export type PathNode = {
  id: string;
  kind: NodeKind;
  state: NodeState;
  label: string;
  progress?: number;
  offset: number;
};

export type Unit = {
  id: string;
  number: number;
  title: string;
  blurb: string;
  slot: number;
  nodes: PathNode[];
};

export const UNITS: Unit[] = [
  {
    id: 'u1',
    number: 5,
    title: 'Order food',
    blurb: 'Order at a cafe, ask for the bill',
    slot: 1,
    nodes: [
      { id: 'n1', kind: 'lesson', state: 'done', label: 'Greetings', offset: 0 },
      { id: 'n2', kind: 'lesson', state: 'done', label: 'At the counter', offset: -1 },
      { id: 'n3', kind: 'story', state: 'done', label: 'A busy morning', offset: -2 },
      { id: 'n4', kind: 'lesson', state: 'active', label: 'The bill', progress: 60, offset: -1 },
      { id: 'n5', kind: 'lesson', state: 'locked', label: 'Allergies', offset: 0 },
      { id: 'n6', kind: 'chest', state: 'locked', label: 'Reward', offset: 1 },
      { id: 'n7', kind: 'lesson', state: 'locked', label: 'Tipping', offset: 2 },
      { id: 'n8', kind: 'trophy', state: 'locked', label: 'Unit 5 review', offset: 1 },
    ],
  },
  {
    id: 'u2',
    number: 6,
    title: 'Talk about family',
    blurb: 'Describe your family, use possessives',
    slot: 2,
    nodes: [
      { id: 'm1', kind: 'lesson', state: 'locked', label: 'Parents', offset: 0 },
      { id: 'm2', kind: 'lesson', state: 'locked', label: 'Siblings', offset: -1 },
      { id: 'm3', kind: 'story', state: 'locked', label: 'Sunday lunch', offset: -2 },
      { id: 'm4', kind: 'lesson', state: 'locked', label: 'Possessives', offset: -1 },
    ],
  },
];

export const NODE_ICON: Record<NodeKind, string> = {
  lesson: 'ph-fill ph-star',
  story: 'ph-fill ph-book-open-text',
  chest: 'ph-fill ph-treasure-chest',
  trophy: 'ph-fill ph-trophy',
};

/* Lesson */

export type Choice = { id: string; label: string; hint: string; correct: boolean; image: string };

export const QUESTION = {
  prompt: 'Which one of these is "the bill"?',
  sentence: 'La cuenta, por favor.',
  choices: [
    { id: 'c1', label: 'la cuenta', hint: 'the bill', correct: true, image: 'ph-fill ph-receipt' },
    { id: 'c2', label: 'la cocina', hint: 'the kitchen', correct: false, image: 'ph-fill ph-cooking-pot' },
    { id: 'c3', label: 'la cuchara', hint: 'the spoon', correct: false, image: 'ph-fill ph-fork-knife' },
    { id: 'c4', label: 'la cuerda', hint: 'the rope', correct: false, image: 'ph-fill ph-link-simple' },
  ] as Choice[],
};

/* Right rail and profile */

export const STREAK = 128;
export const GEMS = 1240;
export const HEARTS = 4;
export const HEART_MAX = 5;
export const XP_TODAY = 40;
export const XP_GOAL = 50;

export type Leader = { rank: number; name: string; image: string; xp: number; me?: boolean };

export const LEAGUE: Leader[] = [
  { rank: 1, name: 'Ines Marchetti', image: 'img/l1.jpg', xp: 2480 },
  { rank: 2, name: 'Kofi Mensah', image: 'img/l2.jpg', xp: 2210 },
  { rank: 3, name: 'Lena Ruzicka', image: 'img/l3.jpg', xp: 1970 },
  { rank: 4, name: 'You', image: 'img/l4.jpg', xp: 1815, me: true },
  { rank: 5, name: 'Petra Nowak', image: 'img/l5.jpg', xp: 1640 },
  { rank: 6, name: 'Samir Haddad', image: 'img/l6.jpg', xp: 1502 },
  { rank: 7, name: 'Yuki Tanabe', image: 'img/l7.jpg', xp: 1388 },
  { rank: 8, name: 'Rui Batista', image: 'img/l8.jpg', xp: 1240 },
];

export type Achievement = { id: string; title: string; level: number; icon: string; progress: number; goal: number; slot: number };

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'Wildfire', level: 6, icon: 'ph-fill ph-fire', progress: 128, goal: 150, slot: 6 },
  { id: 'a2', title: 'Sage', level: 4, icon: 'ph-fill ph-graduation-cap', progress: 3400, goal: 5000, slot: 1 },
  { id: 'a3', title: 'Scholar', level: 3, icon: 'ph-fill ph-book-bookmark', progress: 480, goal: 750, slot: 2 },
  { id: 'a4', title: 'Sharpshooter', level: 2, icon: 'ph-fill ph-target', progress: 14, goal: 20, slot: 5 },
];

export const STATS = [
  { id: 's1', label: 'Day streak', value: '128', icon: 'ph-fill ph-fire', slot: 6 },
  { id: 's2', label: 'Total XP', value: '18,420', icon: 'ph-fill ph-lightning', slot: 4 },
  { id: 's3', label: 'Current league', value: 'Ruby', icon: 'ph-fill ph-shield-star', slot: 5 },
  { id: 's4', label: 'Top 3 finishes', value: '11', icon: 'ph-fill ph-medal', slot: 2 },
];
