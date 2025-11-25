/**
 * core/document-engine.js
 * Document generation engine: render HTML templates and generate PDF/HTML file
 */
const fs = require('fs');
const path = require('path');
let htmlPdf = null;
try { htmlPdf = require('html-pdf-node'); } catch (e) { htmlPdf = null; }
function safeRenderTemplate(html, data) {
  if (!html) return '';
  return String(html).replace(/\{\{([\w\.\-]+)\}\}/g, (_, key) => {
    const parts = key.split('.');
    let v = data;
    for (const p of parts) {
      if (v == null) break;
      v = v[p];
    }
    return v == null ? '' : String(v);
  });
}
class DocumentEngine {
  constructor() {
    this.dbQuery = null;
    this.engineLoader = null;
    this.outputDir = path.join(process.cwd(), 'public', 'hots', 'generateddocuments');
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
  }
  init({ dbQuery, engineLoader }) {
    this.dbQuery = dbQuery;
    this.engineLoader = engineLoader;
  }
  async generateFromHtmlForTicket(moduleKey, ticketId, htmlTemplate, context = {}) {
    const html = safeRenderTemplate(htmlTemplate, context || {});
    const fileName = `document_${moduleKey}_${ticketId}_${Date.now()}.pdf`;
    const outPath = path.join(this.outputDir, fileName);
    if (!htmlPdf) {
      const htmlFile = outPath.replace(/\.pdf$/, '.html');
      fs.writeFileSync(htmlFile, html, 'utf8');
      return { path: htmlFile, note: 'html saved (no pdf lib available)' };
    }
    const options = { format: 'A4' };
    const file = { content: html };
    try {
      const result = await htmlPdf.generatePdf(file, options);
      fs.writeFileSync(outPath, result);
      return outPath;
    } catch (e) {
      const htmlFile = outPath.replace(/\.pdf$/, '.html');
      fs.writeFileSync(htmlFile, html, 'utf8');
      return { path: htmlFile, error: e.message };
    }
  }
}
module.exports = new DocumentEngine();