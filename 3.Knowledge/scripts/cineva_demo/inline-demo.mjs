import fs from 'fs'; import path from 'path';
const [dir, out] = process.argv.slice(2);
let html = fs.readFileSync(path.join(dir, 'cineva-preview.html'), 'utf8');
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+)"[^>]*>/g, (_, f) => `<style>${fs.readFileSync(path.join(dir, f), 'utf8')}</style>`);
html = html.replace(/<script type="module"[^>]*src="\.\/(assets\/[^"]+)"[^>]*><\/script>/g, (_, f) => `<script type="module">${fs.readFileSync(path.join(dir, f), 'utf8').replace(/<\/script/gi, '<\/script')}</script>`);
if (/\.\/assets\//.test(html)) throw new Error('masih ada referensi assets');
fs.writeFileSync(out, html); console.log(out, (fs.statSync(out).size / 1e6).toFixed(2) + ' MB');
