import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const root = path.resolve(import.meta.dirname, '../../..'), app = path.join(root, '1.Frontend/HOTS');
const require = createRequire(path.join(app, 'package.json'));
export async function buildDemo(data, directory, filename = 'Cineva-Melin-Demo.html') {
  const alias = { '@': path.join(app, 'src') };
  const snapshot = JSON.parse(await fs.readFile(path.join(root, '3.Knowledge/scripts/package_upgrade_2026_10_14/snapshot.json'), 'utf8'));
  for (const p of snapshot.packages) alias[p.name] = path.join(root, p.local);
  for (const component of snapshot.components.filter(c => !c.status)) alias[`@hots/ui-kit/components/${component.name.replace(/\.tsx$/, '')}`] = path.join(root, '1.Frontend/packages/ui-kit/src/components', component.name);
  alias['@hots/ui-kit/utils'] = path.join(root, '1.Frontend/packages/ui-kit/src/lib/utils.ts');
  alias['@hots/ui-kit/hooks/use-mobile'] = path.join(root, '1.Frontend/packages/ui-kit/src/hooks/use-mobile.tsx');
  for (const name of ['react', 'react-dom', 'axios', 'framer-motion', 'next-themes', 'react-hook-form', 'recharts', 'react-pdf', 'xlsx', '@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-image', '@tiptap/extension-link']) {
    let dir = path.dirname(require.resolve(name));
    while (true) { try { if (JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8')).name === name) { alias[name] = dir; break; } } catch {} const parent = path.dirname(dir); if (parent === dir) throw new Error(`Dependency missing: ${name}`); dir = parent; }
  }
  const esbuild = require('esbuild');
  const bundle = await esbuild.build({ entryPoints: [path.join(app, 'src/features/cineva-offline/entry.tsx')], outfile: 'demo.js', write: false, bundle: true, platform: 'browser', format: 'iife', target: 'es2022', jsx: 'automatic', alias, minify: true, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' }, logLevel: 'warning' });
  esbuild.stop();
  const assets = path.join(app, 'dist/assets');
  const baseCss = (await Promise.all((await fs.readdir(assets)).filter(f => f.endsWith('.css')).map(f => fs.readFile(path.join(assets, f), 'utf8')))).join('\n');
  // Offline exports never load remote fonts/assets; SVG UI icons remain inline.
  const css = (baseCss + '\n' + bundle.outputFiles.filter(f => f.path.endsWith('.css')).map(f => f.text).join('\n')).replace(/@import\s+[^;]+;/g, '').replace(/url\((?!["']?data:|["']?#)[^)]*\)/g, 'none');
  const js = bundle.outputFiles.find(f => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const storageId = crypto.createHash('sha256').update(json).digest('hex').slice(0, 24);
  const html = `<!doctype html><html lang="id" data-hots-vendor="cineva"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cineva · Creator Client Demo</title><style>${css.replace(/<\/style/gi, '<\\/style')}</style></head><body><div id="root"></div><script id="demo-seed" type="application/json" data-storage-id="${storageId}">${json}</script><script>${js}</script></body></html>`;
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), html);
  return { file: path.join(directory, filename), bytes: Buffer.byteLength(html), storageId };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const out = path.join(root, '5.Client-Demo/Melin-Cineva');
  const data = JSON.parse(await fs.readFile(path.join(out, 'cineva-melin-data.json'), 'utf8'));
  process.stdout.write(JSON.stringify(await buildDemo(data, out)) + '\n');
}
