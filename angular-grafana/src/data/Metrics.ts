export const DASHBOARDS = [
  { id: 'edge', label: 'Edge and CDN', icon: 'ph-bold ph-globe-hemisphere-west' },
  { id: 'api', label: 'API gateway', icon: 'ph-bold ph-plugs-connected', badge: '2' },
  { id: 'db', label: 'Datastores', icon: 'ph-bold ph-database' },
  { id: 'queue', label: 'Queues', icon: 'ph-bold ph-queue' },
  { id: 'jobs', label: 'Batch jobs', icon: 'ph-bold ph-clock-clockwise' },
];

export const HOURS = [
  '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
  '12:00', '14:00', '16:00', '18:00', '20:00', '22:00',
];

export const LATENCY = [
  { label: 'p50', values: [42, 41, 40, 44, 58, 71, 84, 79, 66, 61, 52, 46], slot: 2 as const },
  { label: 'p95', values: [118, 112, 109, 126, 168, 214, 261, 248, 197, 176, 149, 131], slot: 1 as const },
  { label: 'p99', values: [246, 231, 228, 268, 352, 468, 612, 574, 431, 388, 318, 274], slot: 6 as const },
];

export const REGIONS = ['eu-west', 'eu-north', 'us-east', 'us-west', 'ap-south', 'sa-east'];

export const REQUESTS = [
  { label: '2xx', values: [4820, 3910, 6240, 5180, 2960, 1740], slot: 7 as const },
  { label: '4xx', values: [310, 244, 508, 392, 271, 118], slot: 4 as const },
  { label: '5xx', values: [46, 21, 138, 62, 19, 8], slot: 1 as const },
];

export const BUDGET = [
  { label: 'Error budget', values: [61, 18, 12, 6, 3] },
];

export const BUDGET_LABELS = ['checkout', 'catalogue', 'identity', 'search', 'media'];

export const ENDPOINTS = ['POST /orders', 'GET /catalogue', 'POST /auth', 'GET /search', 'GET /media', 'PUT /cart'];

export const SLOWEST = [
  { label: 'p99 ms', values: [612, 488, 401, 366, 289, 244], slot: 3 as const },
];

export const HEALTH_AXES = ['Latency', 'Errors', 'Saturation', 'Traffic', 'Freshness', 'Cost'];

export const HEALTH = [
  { label: 'checkout', values: [62, 88, 54, 91, 76, 48], slot: 5 as const },
  { label: 'catalogue', values: [84, 92, 71, 66, 88, 74], slot: 2 as const },
];

export const THROUGHPUT = [
  {
    label: 'edge nodes',
    x: [120, 240, 310, 420, 505, 610, 720, 810, 930, 1040],
    y: [38, 41, 47, 52, 61, 78, 96, 121, 168, 244],
    slot: 8 as const,
  },
];

export const ALERTS = [
  { id: 'a1', rule: 'p99 latency above 500ms', service: 'checkout', since: '14m', tone: 'danger' as const, state: 'Firing' },
  { id: 'a2', rule: '5xx rate above 1%', service: 'checkout', since: '14m', tone: 'danger' as const, state: 'Firing' },
  { id: 'a3', rule: 'Replica lag above 30s', service: 'orders-db', since: '1h 06m', tone: 'warning' as const, state: 'Pending' },
  { id: 'a4', rule: 'Queue depth above 10k', service: 'exports', since: '2h 41m', tone: 'warning' as const, state: 'Pending' },
  { id: 'a5', rule: 'Certificate expires in 7 days', service: 'edge', since: '9h', tone: 'neutral' as const, state: 'Pending' },
];

export const RANGES = [
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];
