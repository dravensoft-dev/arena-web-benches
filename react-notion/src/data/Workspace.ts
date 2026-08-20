import type { ArenaCatSlot } from '@dravensoft/arena-react';

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'numbered'; text: string; index: number }
  | { kind: 'todo'; text: string; done: boolean }
  | { kind: 'quote'; text: string }
  | { kind: 'callout'; icon: string; text: string }
  | { kind: 'toggle'; text: string; body: string }
  | { kind: 'code'; language: string; text: string }
  | { kind: 'divider' }
  | { kind: 'image'; src: string; caption: string };

export const PAGE_TITLE = 'Engineering wiki';
export const PAGE_ICON = 'ph-fill ph-book-open-text';
export const PAGE_COVER = '/img/cover.jpg';

export const DOC_BLOCKS: Block[] = [
  {
    kind: 'text',
    text:
      'Everything a new engineer needs in their first week. Start with the environment setup, '
      + 'then read the architecture note, then pick a starter issue from the board.',
  },
  { kind: 'callout', icon: 'ph-fill ph-lightbulb', text: 'Ask in #eng-help before you spend more than thirty minutes stuck. Nobody here reads a long silence as diligence.' },
  { kind: 'h2', text: 'Getting set up' },
  { kind: 'text', text: 'The whole toolchain is pinned. Do not install a global version of anything.' },
  { kind: 'todo', text: 'Clone the monorepo and run the bootstrap script', done: true },
  { kind: 'todo', text: 'Request access to the staging cluster', done: true },
  { kind: 'todo', text: 'Pair with your onboarding buddy on a first deploy', done: false },
  { kind: 'code', language: 'bash', text: 'git clone git@github.com:acme/platform.git\ncd platform\n./scripts/bootstrap.sh --with-devtools' },
  { kind: 'h2', text: 'How the platform is put together' },
  {
    kind: 'text',
    text:
      'Three services and one gateway. The gateway owns authentication and nothing else, which is '
      + 'why a service never reads a session and never writes one.',
  },
  { kind: 'image', src: '/img/architecture.jpg', caption: 'The request path, drawn at the last architecture review' },
  { kind: 'bullet', text: 'The gateway terminates TLS and resolves the session' },
  { kind: 'bullet', text: 'Each service owns its own schema and migrates it independently' },
  { kind: 'bullet', text: 'Nothing shares a database, and nothing reads another service tables' },
  { kind: 'toggle', text: 'Why we do not share a database', body: 'A shared schema turns every deploy into a coordination problem, and the coordination cost is paid by whoever ships last. Two services that need the same fact exchange it over an API and each keeps its own copy.' },
  { kind: 'h2', text: 'Shipping' },
  { kind: 'numbered', text: 'Open a pull request against main', index: 1 },
  { kind: 'numbered', text: 'Wait for the gate to go green', index: 2 },
  { kind: 'numbered', text: 'Merge, and watch the canary for ten minutes', index: 3 },
  { kind: 'divider' },
  { kind: 'quote', text: 'A deploy nobody watched is a deploy nobody owns.' },
  { kind: 'h3', text: 'Rolling back' },
  { kind: 'text', text: 'Every release is a tag and every tag is deployable. Rolling back is deploying the previous tag, and it needs no approval.' },
];

export type Task = {
  id: string;
  name: string;
  status: 'Not started' | 'In progress' | 'In review' | 'Done';
  owner: string;
  ownerImage: string;
  tags: string[];
  due: string;
  effort: number;
};

export const TASKS: Task[] = [
  { id: 'T-104', name: 'Split the session store out of the gateway', status: 'In progress', owner: 'Marta Ilves', ownerImage: '/img/p1.jpg', tags: ['Platform', 'Backend'], due: 'Aug 22, 2026', effort: 8 },
  { id: 'T-098', name: 'Document the deploy gate for new starters', status: 'In review', owner: 'Owen Baptiste', ownerImage: '/img/p2.jpg', tags: ['Docs'], due: 'Aug 18, 2026', effort: 2 },
  { id: 'T-121', name: 'Replace the nightly export with a stream', status: 'Not started', owner: 'Priya Raman', ownerImage: '/img/p3.jpg', tags: ['Data', 'Backend'], due: 'Sep 04, 2026', effort: 13 },
  { id: 'T-087', name: 'Migrate the billing schema off the shared cluster', status: 'Done', owner: 'Tomas Klein', ownerImage: '/img/p4.jpg', tags: ['Platform'], due: 'Aug 08, 2026', effort: 5 },
  { id: 'T-133', name: 'Add a canary check for the checkout path', status: 'In progress', owner: 'Priya Raman', ownerImage: '/img/p3.jpg', tags: ['Reliability'], due: 'Aug 29, 2026', effort: 5 },
  { id: 'T-140', name: 'Retire the legacy admin console', status: 'Not started', owner: 'Marta Ilves', ownerImage: '/img/p1.jpg', tags: ['Frontend', 'Cleanup'], due: 'Sep 19, 2026', effort: 8 },
  { id: 'T-076', name: 'Write the incident review for the July outage', status: 'Done', owner: 'Owen Baptiste', ownerImage: '/img/p2.jpg', tags: ['Docs', 'Reliability'], due: 'Jul 30, 2026', effort: 3 },
];

export const BOARD_COLUMNS: Task['status'][] = ['Not started', 'In progress', 'In review', 'Done'];

export const TAG_SLOT: Record<string, ArenaCatSlot> = {
  Platform: 1, Backend: 2, Docs: 3, Data: 4, Reliability: 5, Frontend: 6, Cleanup: 7,
};

export type RecentPage = { id: string; title: string; icon: string; where: string; when: string };

export const RECENT: RecentPage[] = [
  { id: 'wiki', title: 'Engineering wiki', icon: 'ph-fill ph-book-open-text', where: 'Engineering', when: 'Edited 12 minutes ago' },
  { id: 'roadmap', title: 'Q3 roadmap', icon: 'ph-fill ph-map-trifold', where: 'Product', when: 'Edited 2 hours ago' },
  { id: 'tasks', title: 'Sprint tasks', icon: 'ph-fill ph-kanban', where: 'Engineering', when: 'Edited yesterday' },
  { id: 'hiring', title: 'Hiring pipeline', icon: 'ph-fill ph-users-three', where: 'People', when: 'Edited yesterday' },
  { id: 'incident', title: 'July outage review', icon: 'ph-fill ph-siren', where: 'Reliability', when: 'Edited 3 days ago' },
  { id: 'brand', title: 'Brand guidelines', icon: 'ph-fill ph-palette', where: 'Design', when: 'Edited last week' },
];

export const TEMPLATES = [
  { id: 'meeting', title: 'Meeting notes', icon: 'ph-fill ph-microphone-stage', blurb: 'Agenda, decisions and the follow-ups that came out of them.' },
  { id: 'spec', title: 'Product spec', icon: 'ph-fill ph-target', blurb: 'The problem, who has it, and what shipping looks like.' },
  { id: 'retro', title: 'Retrospective', icon: 'ph-fill ph-arrows-counter-clockwise', blurb: 'What went well, what did not, and one thing to change.' },
];
