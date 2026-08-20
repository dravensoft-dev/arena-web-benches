import { serve } from 'bun';
import { join } from 'node:path';
import home from './src/index.html';

const PUBLIC = join(import.meta.dir, 'public');

const server = serve({
  port: Number(process.env.PORT ?? 5102),
  development: true,
  routes: {
    '/img/:name': async (request) => {
      const file = Bun.file(join(PUBLIC, request.params.name));
      return (await file.exists()) ? new Response(file) : new Response('not found', { status: 404 });
    },
    '/': home,
    '/*': home,
  },
});

console.log(`react-clickup bench on ${server.url}`);
