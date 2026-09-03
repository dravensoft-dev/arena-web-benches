export type Account = { handle: string; name: string; avatar: string; verified?: boolean };

export const ME: Account = { handle: 'juno.reyes', name: 'Juno Reyes', avatar: 'img/av1.jpg' };

export const ACCOUNTS: Record<string, Account> = {
  'juno.reyes': ME,
  'atlas.knits': { handle: 'atlas.knits', name: 'Atlas Knitwear', avatar: 'img/av2.jpg', verified: true },
  'marisol.b': { handle: 'marisol.b', name: 'Marisol Bruna', avatar: 'img/av3.jpg' },
  'kite.studio': { handle: 'kite.studio', name: 'Kite Studio', avatar: 'img/av4.jpg', verified: true },
  'oren.field': { handle: 'oren.field', name: 'Oren Field', avatar: 'img/av5.jpg' },
  'saltandpine': { handle: 'saltandpine', name: 'Salt and Pine', avatar: 'img/av6.jpg' },
  'tavi.roads': { handle: 'tavi.roads', name: 'Tavi Roads', avatar: 'img/av7.jpg' },
  'huesandco': { handle: 'huesandco', name: 'Hues and Co', avatar: 'img/av8.jpg', verified: true },
};

export type Story = { handle: string; seen: boolean; live?: boolean };

export const STORIES: Story[] = [
  { handle: 'juno.reyes', seen: false },
  { handle: 'atlas.knits', seen: false, live: true },
  { handle: 'marisol.b', seen: false },
  { handle: 'kite.studio', seen: false },
  { handle: 'oren.field', seen: true },
  { handle: 'saltandpine', seen: false },
  { handle: 'tavi.roads', seen: true },
  { handle: 'huesandco', seen: true },
];

export type Comment = { handle: string; text: string; likes: number; when: string };

export type Post = {
  id: string;
  handle: string;
  place?: string;
  media: string[];
  caption: string;
  likes: number;
  likedBy: string;
  comments: Comment[];
  when: string;
  liked: boolean;
  saved: boolean;
};

export const POSTS: Post[] = [
  {
    id: 'p1',
    handle: 'atlas.knits',
    place: 'Reykjavik, Iceland',
    media: ['img/post1.jpg', 'img/post2.jpg', 'img/post3.jpg'],
    caption: 'Three weights of undyed wool, spun on the same day. The middle one is going into the winter run.',
    likes: 4821,
    likedBy: 'marisol.b',
    when: '4 hours ago',
    liked: false,
    saved: false,
    comments: [
      { handle: 'marisol.b', text: 'the middle one, no question', likes: 34, when: '3h' },
      { handle: 'oren.field', text: 'what is the micron count on these', likes: 4, when: '2h' },
      { handle: 'huesandco', text: 'stunning as always', likes: 12, when: '1h' },
    ],
  },
  {
    id: 'p2',
    handle: 'kite.studio',
    place: 'Lisbon, Portugal',
    media: ['img/post4.jpg'],
    caption: 'Second floor is finished. Took the wall out and the room found its own proportions.',
    likes: 1290,
    likedBy: 'tavi.roads',
    when: '9 hours ago',
    liked: true,
    saved: true,
    comments: [
      { handle: 'saltandpine', text: 'the light in here', likes: 7, when: '8h' },
      { handle: 'juno.reyes', text: 'what did you do with the beam', likes: 2, when: '6h' },
    ],
  },
  {
    id: 'p3',
    handle: 'saltandpine',
    media: ['img/post5.jpg', 'img/post6.jpg'],
    caption: 'Cold morning, warm bread. That is the whole post.',
    likes: 8734,
    likedBy: 'kite.studio',
    when: '1 day ago',
    liked: false,
    saved: false,
    comments: [
      { handle: 'atlas.knits', text: 'perfect crumb', likes: 51, when: '22h' },
    ],
  },
];

export const SUGGESTIONS = ['marisol.b', 'oren.field', 'tavi.roads', 'huesandco', 'kite.studio'];

export type GridPost = { id: string; src: string; likes: number; comments: number; kind: 'single' | 'carousel' | 'reel' };

export const PROFILE_GRID: GridPost[] = [
  { id: 'g1', src: 'img/post7.jpg', likes: 1204, comments: 22, kind: 'carousel' },
  { id: 'g2', src: 'img/post8.jpg', likes: 892, comments: 14, kind: 'single' },
  { id: 'g3', src: 'img/post9.jpg', likes: 3311, comments: 87, kind: 'reel' },
  { id: 'g4', src: 'img/post10.jpg', likes: 640, comments: 9, kind: 'single' },
  { id: 'g5', src: 'img/post11.jpg', likes: 2108, comments: 41, kind: 'carousel' },
  { id: 'g6', src: 'img/post12.jpg', likes: 1755, comments: 30, kind: 'single' },
  { id: 'g7', src: 'img/post1.jpg', likes: 970, comments: 11, kind: 'single' },
  { id: 'g8', src: 'img/post3.jpg', likes: 4402, comments: 122, kind: 'reel' },
  { id: 'g9', src: 'img/post5.jpg', likes: 1388, comments: 26, kind: 'carousel' },
];

export const HIGHLIGHTS = [
  { id: 'h1', label: 'Studio', src: 'img/post2.jpg' },
  { id: 'h2', label: 'Iceland', src: 'img/post4.jpg' },
  { id: 'h3', label: 'Dyeing', src: 'img/post6.jpg' },
  { id: 'h4', label: 'Shop', src: 'img/post8.jpg' },
];

export function writeCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
