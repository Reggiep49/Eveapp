import {cpSync, mkdirSync, readdirSync, rmSync} from 'node:fs';
rmSync('dist/client', {recursive: true, force: true});
mkdirSync('dist/client');
for (const entry of readdirSync('dist')) {
  if (entry === 'client' || entry === 'server' || entry.startsWith('.')) continue;
  cpSync('dist/' + entry, 'dist/client/' + entry, {recursive: true});
}
