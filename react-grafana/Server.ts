import { serve } from 'bun';
import { join } from 'node:path';
import home from './src/index.html';
import { ARENA_SPRITE } from './src/arena.icons.generated.js';

const server = serve({
  port: Number(process.env.PORT ?? 5107),
  development: true,
  routes: {
    [`/${ARENA_SPRITE}`]: () => new Response(Bun.file(join(import.meta.dir, 'src', ARENA_SPRITE))),
    '/': home,
    '/*': home,
  },
});

console.log(`react-grafana bench on ${server.url}`);
