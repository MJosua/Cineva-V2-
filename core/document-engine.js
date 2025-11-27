/**
 * core/document-engine.js
 * Minimal document generator adapter (placeholder)
 *
 * generateFromHtmlForTicket(moduleKey, ticketId, html, context)
 * -> should return stored file path
 *
 * This is a thin wrapper for your existing document generation utilities.
 * Replace implementation to call your real generator.
 */

const fs = require('fs');
const path = require('path');

class DocumentEngine {
  constructor() {}

  init(/*opts*/) {
    // hook if needed
  }

  /**
   * Very small default implementation: save HTML to public/hots/generateddocuments/<ticketId>.html
   * You should replace this with your PDF generator (wkhtmltopdf, puppeteer, etc).
   */
  async generateFromHtmlForTicket(moduleKey, ticketId, html, context) {
    const folder = path.join(process.cwd(), 'public', 'hots', 'generateddocuments');
    try {
      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
      const fname = `document_${moduleKey || 'svc'}_${ticketId}_${Date.now()}.html`;
      const fpath = path.join(folder, fname);
      fs.writeFileSync(fpath, html, 'utf8');
      return fpath;
    } catch (e) {
      throw e;
    }
  }
}

module.exports = new DocumentEngine();
