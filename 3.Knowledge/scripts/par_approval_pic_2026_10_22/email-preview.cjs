/** @purpose Renders the real Email Activity component with synthetic states for local visual QA, without network calls. */
const fs = require('node:fs');
const Module = require('node:module');
const root = 'D:/Kantor/1.Frontend/overseas_module/par';
const req = Module.createRequire(`${root}/package.json`);
const React = req('react');
const ts = req('typescript');
const { renderToStaticMarkup } = req('react-dom/server');
const output = 'D:/Project/Cineva-V2-/3.Knowledge/reports/par_approval_pic_2026_10_22';
const fixture = { expected: [], history: [
  { id: 189, kind: 'approved_proceed', status: 'DONE', delivery_status: 'SMTP_ACCEPTED', retry_count: 0 },
  { id: 188, kind: 'payment_assignment', status: 'DONE', delivery_status: 'SMTP_ACCEPTED', retry_count: 0 },
  { id: 162, kind: 'approval_step', status: 'DONE', delivery_status: 'SMTP_ACCEPTED', retry_count: 0 },
] };
let state = 0;
let current = fixture;
const filename = `${root}/src/views/ParEmailStatus.tsx`;
const mod = new Module(filename);
mod.filename = filename;
mod.require = name => name === 'react' ? { ...React, useEffect: () => {}, useState: initial => [state++ === 0 ? current : state === 4 ? false : initial, () => {}] } : name.includes('parApi') ? { requestHotsApi: () => { throw new Error('No network'); } } : req(name);
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const render = data => { state = 0; current = data; return renderToStaticMarkup(React.createElement(mod.exports.ParEmailStatus, { ticketId: 'demo', session: {}, refreshKey: 0 })); };
const css = ['ticket-detail.css', 'detail-feedback.css'].map(file => fs.readFileSync(`${root}/src/styles/${file}`, 'utf8')).join('\n');
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#f8fafc;padding:24px;font-family:system-ui}.preview{width:360px;max-width:100%}${css}</style></head><body><main class="preview">${render(fixture)}</main></body></html>`;
fs.writeFileSync(`${output}/email-preview.html`, html);
const fsPromises = require('node:fs/promises');
(async () => {
  const puppeteer = Module.createRequire('D:/Kantor/2.Backend/Integrated-API/package.json')('puppeteer');
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 408, height: 620, deviceScaleFactor: 1.5 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: `${output}/email-preview.png`, fullPage: true });
    const result = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, cards: document.querySelectorAll('.par-email-status-row').length, font: getComputedStyle(document.querySelector('h3')).fontFamily }));
    if (result.overflow || result.cards !== 3) throw new Error(JSON.stringify(result));
    await page.setViewport({ width: 320, height: 620, deviceScaleFactor: 1 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw new Error('Overflow at 320px');
    const edge = { expected: [{ kind: 'payment_assignment', status: 'RECIPIENT_MISSING' }], history: [
      { id: 4, kind: 'payment_assignment', status: 'DEAD', retry_count: 3, error_log: '{"code":"SMTP_FAILED"}' },
      { id: 3, kind: 'approval_step', status: 'PROCESSING', retry_count: 1 },
      { id: 2, kind: 'approval_step', status: 'DONE', delivery_status: 'SKIPPED_STALE_STEP', retry_count: 0 },
    ] };
    await page.setContent(html.replace(render(fixture), render(edge)));
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Status overflow');
    await fsPromises.writeFile(`${output}/email-visual-check.json`, JSON.stringify({ ...result, mobile320: 'no overflow', additionalStates: ['recipient missing', 'failed', 'sending', 'skipped'], evidence: 'real component SSR with synthetic React state, browser layout only; API/hooks not exercised' }, null, 2));
    process.stdout.write(JSON.stringify(result));
  } finally { await browser.close(); }
})();
