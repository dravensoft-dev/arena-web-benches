export const DASHBOARDS = [
  { id: 'browse', label: 'All dashboards', icon: 'ph-bold ph-folders' },
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
  { label: 'p50', values: [42, 41, 40, 44, 58, 71, 84, 79, 66, 61, 52, 46], colorId: 2 as const },
  { label: 'p95', values: [118, 112, 109, 126, 168, 214, 261, 248, 197, 176, 149, 131], colorId: 1 as const },
  { label: 'p99', values: [246, 231, 228, 268, 352, 468, 612, 574, 431, 388, 318, 274], colorId: 6 as const },
];

export const REGIONS = ['eu-west', 'eu-north', 'us-east', 'us-west', 'ap-south', 'sa-east'];

export const REQUESTS = [
  { label: '2xx', values: [4820, 3910, 6240, 5180, 2960, 1740], colorId: 7 as const },
  { label: '4xx', values: [310, 244, 508, 392, 271, 118], colorId: 4 as const },
  { label: '5xx', values: [46, 21, 138, 62, 19, 8], colorId: 1 as const },
];

export const BUDGET = [
  { label: 'Error budget', values: [61, 18, 12, 6, 3] },
];

export const BUDGET_LABELS = ['checkout', 'catalogue', 'identity', 'search', 'media'];

export const ENDPOINTS = ['POST /orders', 'GET /catalogue', 'POST /auth', 'GET /search', 'GET /media', 'PUT /cart'];

export const SLOWEST = [
  { label: 'p99 ms', values: [612, 488, 401, 366, 289, 244], colorId: 3 as const },
];

export const HEALTH_AXES = ['Latency', 'Errors', 'Saturation', 'Traffic', 'Freshness', 'Cost'];

export const HEALTH = [
  { label: 'checkout', values: [62, 88, 54, 91, 76, 48], colorId: 5 as const },
  { label: 'catalogue', values: [84, 92, 71, 66, 88, 74], colorId: 2 as const },
];

export const THROUGHPUT = [
  {
    label: 'edge nodes',
    x: [120, 240, 310, 420, 505, 610, 720, 810, 930, 1040],
    y: [38, 41, 47, 52, 61, 78, 96, 121, 168, 244],
    colorId: 8 as const,
  },
];

export const ALERTS = [
  {
    id: 'a1', rule: 'p99 latency above 500ms', service: 'checkout', since: '14m', tone: 'danger' as const, state: 'Firing',
    unit: 'ms', trend: [{ label: 'p99 latency', values: [246, 231, 228, 268, 352, 468, 612, 574, 431, 388, 318, 274] }],
  },
  {
    id: 'a2', rule: '5xx rate above 1%', service: 'checkout', since: '14m', tone: 'danger' as const, state: 'Firing',
    unit: '%', trend: [{ label: '5xx rate', values: [0.3, 0.3, 0.2, 0.4, 0.6, 0.9, 1.4, 1.3, 1.1, 1.2, 1.1, 1.2] }],
  },
  {
    id: 'a3', rule: 'Replica lag above 30s', service: 'orders-db', since: '1h 06m', tone: 'warning' as const, state: 'Pending',
    unit: 's', trend: [{ label: 'Replica lag', values: [4, 3, 3, 5, 8, 12, 19, 24, 28, 31, 33, 32] }],
  },
  {
    id: 'a4', rule: 'Queue depth above 10k', service: 'exports', since: '2h 41m', tone: 'warning' as const, state: 'Pending',
    unit: '', trend: [{ label: 'Queue depth', values: [1200, 1400, 2100, 3600, 5200, 6900, 8100, 8800, 9400, 9900, 10300, 10600] }],
  },
  {
    id: 'a5', rule: 'Certificate expires in 7 days', service: 'edge', since: '9h', tone: 'neutral' as const, state: 'Pending',
    unit: ' days', trend: [{ label: 'Days to expiry', values: [8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7] }],
  },
];

export const RANGES = [
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export const CPU_BANDS = [
  { from: 0, tone: 'success' as const, label: 'Healthy' },
  { from: 60, tone: 'warning' as const, label: 'Elevated' },
  { from: 85, tone: 'danger' as const, label: 'Critical' },
];

export const LATENCY_BUCKETS = [
  { label: 'over 500 ms', values: [12, 9, 8, 14, 31, 58, 96, 84, 49, 38, 22, 15] },
  { label: '250-500 ms', values: [48, 41, 39, 52, 96, 164, 241, 226, 151, 128, 87, 61] },
  { label: '100-250 ms', values: [210, 188, 176, 224, 391, 612, 804, 768, 551, 486, 342, 259] },
  { label: '50-100 ms', values: [624, 571, 548, 660, 1080, 1520, 1810, 1760, 1390, 1250, 940, 742] },
  { label: 'under 50 ms', values: [1480, 1390, 1350, 1560, 2210, 2840, 3120, 3060, 2620, 2440, 1980, 1660] },
];

export const FOLDERS = [
  { id: 'platform', label: 'Platform', icon: 'ph-bold ph-folder' },
  { id: 'edge', label: 'Edge and CDN', icon: 'ph-bold ph-squares-four', parent: 'platform' },
  { id: 'api', label: 'API gateway', icon: 'ph-bold ph-squares-four', parent: 'platform' },
  { id: 'data', label: 'Data', icon: 'ph-bold ph-folder' },
  { id: 'db', label: 'Datastores', icon: 'ph-bold ph-squares-four', parent: 'data' },
  { id: 'queue', label: 'Queues', icon: 'ph-bold ph-squares-four', parent: 'data' },
  { id: 'operations', label: 'Operations', icon: 'ph-bold ph-folder' },
  { id: 'jobs', label: 'Batch jobs', icon: 'ph-bold ph-squares-four', parent: 'operations' },
  { id: 'archive', label: 'Archive', icon: 'ph-bold ph-folder', parent: 'operations' },
  { id: 'billing', label: 'Legacy billing', icon: 'ph-bold ph-squares-four', parent: 'archive', disabled: true },
];

export const QUOTAS = [
  { id: 'series', label: 'Active series', value: 812, max: 1000, low: 600, high: 850, optimum: 0, valueText: '812k of 1M' },
  { id: 'logs', label: 'Logs ingested today', value: 38, max: 50, low: 30, high: 45, optimum: 0, valueText: '38 of 50 GB' },
  { id: 'rules', label: 'Alert rules', value: 41, max: 200, low: 120, high: 180, optimum: 0, valueText: '41 of 200' },
];
