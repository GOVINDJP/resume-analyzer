import http from 'node:http';
import {readFile} from 'node:fs/promises';
const files = {'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js','/analyzer.js':'analyzer.js','/pdf-reader.js':'pdf-reader.js','/vendor/pdf.min.mjs':'vendor/pdf.min.mjs','/vendor/pdf.worker.min.mjs':'vendor/pdf.worker.min.mjs'};
const types = {html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8'};
http.createServer(async (req,res)=>{
  const path = new URL(req.url, 'http://localhost').pathname;
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
  if (!files[path]) {res.writeHead(404);res.end('Not found');return;}
  try {
    const body = await readFile(new URL(files[path], import.meta.url));
    res.writeHead(200, {'Content-Type':types[files[path].split('.').pop()], 'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",'Cache-Control':'no-store'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {res.writeHead(500);res.end('Unable to load file');}
}).listen(Number(process.env.PORT) || 3000, '127.0.0.1', ()=>console.log(`Resume Analyzer: http://localhost:${Number(process.env.PORT) || 3000}`));
