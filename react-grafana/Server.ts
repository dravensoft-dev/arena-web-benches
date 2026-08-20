import { serve } from 'bun';
import home from './src/index.html';

const server = serve({
  port: Number(process.env.PORT ?? 5107),
  development: true,
  routes: { '/': home, '/*': home },
});

console.log(`react-grafana bench on ${server.url}`);
