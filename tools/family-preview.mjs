import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {extname, resolve, sep} from 'node:path';
import worker from '../dist/server/index.js';

const db = new DatabaseSync(':memory:');
db.exec(readFileSync('drizzle/0000_family.sql', 'utf8'));
// Serve the source folder directly so edits show up on refresh (the worker and build output stay private).
const root = resolve('dist');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.txt':'text/plain'};
const env = {
  DB: {prepare(sql) {return {bind(...values) {
    const stmt = db.prepare(sql);
    return {first: async () => stmt.get(...values), run: async () => ({meta:stmt.run(...values)})};
  }};}},
  ASSETS: {async fetch(request) {
    const path = resolve(root, '.' + (new URL(request.url).pathname === '/' ? '/index.html' : new URL(request.url).pathname));
    if (!path.startsWith(root + sep) || /^[\\/](server|client)([\\/]|$)/.test(path.slice(root.length))) return new Response(null,{status:404});
    try {return new Response(await readFile(path),{headers:{'Content-Type':types[extname(path)] || 'application/octet-stream'}});}
    catch {return new Response(null,{status:404});}
  }}
};
const port = Number(process.env.PORT || 4173);
createServer(async (req,res) => {
  try {
    const origin = 'http://' + req.headers.host;
    const headers = new Headers(req.headers);
    headers.set('oai-authenticated-user-id', 'local-qa-family');
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request(origin + req.url, {
      method:req.method,headers,body:chunks.length ? Buffer.concat(chunks) : undefined
    });
    const response = await worker.fetch(request, env);
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.writeHead(500).end();
  }
}).listen(port,'0.0.0.0',()=>console.log('Eve preview at http://127.0.0.1:' + port + '/'));
