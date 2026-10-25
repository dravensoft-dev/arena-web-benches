// What the builder writes beside the browser output and no page deploys: its bookkeeping.
import { rmSync } from 'node:fs';

for (const name of ['prerendered-routes.json', '3rdpartylicenses.txt']) rmSync(`dist/${name}`, { force: true });
