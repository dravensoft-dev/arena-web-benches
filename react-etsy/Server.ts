import { serve } from 'bun';
import { join } from 'node:path';
import home from './src/index.html';
import { ARENA_SPRITE } from './src/arena.icons.generated.js';

const PUBLIC = join(import.meta.dir, 'public');

const server = serve({
  port: Number(process.env.PORT ?? 5105),
  development: true,
  routes: {
    '/img/:name': async (request) => {
      const file = Bun.file(join(PUBLIC, request.params.name));
      return (await file.exists()) ? new Response(file) : new Response('not found', { status: 404 });
    },
    [`/${ARENA_SPRITE}`]: () => new Response(Bun.file(join(import.meta.dir, 'src', ARENA_SPRITE))),
    '/': home,
    '/*': home,
  },
});

console.log(`react-etsy bench on ${server.url}`);
