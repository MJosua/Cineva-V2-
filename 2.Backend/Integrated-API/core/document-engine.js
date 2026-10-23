/**
 * core/document-engine.js
 * Virtual Document Engine
 *
 * Manages document storage, rendering, and PDF generation.
 * Documents are stored as JSON snapshots in t_document.snapshot_data
 * HTML is rendered on-demand from templates + snapshot
 * PDF is generated as blob only when downloading (not stored on disk)
 */

const fs = require('fs');
const path = require('path');
const { dbHots } = require('../config/db');
const renderSRFHtml = require('./renderers/srf-renderer');
const renderCardHtml = require('./renderers/card-renderer');
const { prepareSRFData, prepareCardData } = require('./document-data-preparer');

class DocumentEngine {
  constructor() {
    this.templates = new Map();
  }

  init(/*opts*/) {
    // Load templates if needed
  }

  // ============================================================
  // VIRTUAL DOCUMENT METHODS
  // ============================================================

  /**
   * Create a virtual document record
   * @param {Object} options
   * @param {string} options.entityType - 'ticket', 'user', 'employee', etc.
   * @param {string} options.entityId - The entity ID (ticket_id, user_id, etc.)
   * @param {string} options.templateName - 'srf', 'invoice', 'completion_card', etc.
   * @param {Object} options.snapshotData - The data needed to render the document
   * @param {string} options.actionOrigin - 'trigger', 'manual_button', 'on_approve'
   * @param {number} options.generatedBy - User ID who generated (0 for system)
   * @returns {Promise<{ok: boolean, documentId?: number, error?: string}>}
   */
  async createDocument({ data, templateName, entityType, entityId, userId, fileExtension = 'pdf' }) {
    try {
      // For virtual HTML documents, we don't write to disk.
      // We store a record that points to the Render Route.
      const isVirtual = fileExtension === 'html';

      const fileName = isVirtual
        ? `virtual_${templateName}_${entityId}_${Date.now()}.html`
        : `physical_${templateName}_${entityId}_${Date.now()}.${fileExtension}`; // Fallback if regular file

      const documentSource = isVirtual ? 'generated_virtual' : 'manual_upload';

      const [result] = await dbHots.promise().query(`
        INSERT INTO t_document 
        (entity_type, entity_id, document_source, file_name, template_name, action_origin, generated_by, snapshot_data, is_virtual)
        VALUES (?, ?, ?, ?, ?, 'trigger', ?, ?, ?)
      `, [
        entityType,
        String(entityId),
        documentSource,
        fileName,
        templateName,
        userId || 0,
        JSON.stringify(data),
        isVirtual ? 1 : 0
      ]);

      const docId = result.insertId;

      // If virtual, we update the file_path to the Render Route
      // Route format: hots_document/render/:id
      // This allows frontend to just calls <iframe src="API_URL/hots_document/render/123">
      if (isVirtual) {
        // Virtual Path is derived dynamically: hots_customfunction/render/:id
        const virtualPath = `hots_customfunction/render/${docId}`;

        console.log(`📄 [DOC_ENGINE] Created virtual document id=${docId}, path=${virtualPath}`);
        return { id: docId, filePath: virtualPath };
      }

      console.log(`📄 [DOC_ENGINE] Created document record id=${docId} (Physical)`);
      return { id: docId, filePath: '' };

    } catch (error) {
      console.error(`❌ [DOC_ENGINE] Error creating document:`, error.message);
      throw error;
    }
  }

  /**
   * Get document record by ID
   * @param {number} documentId
   * @returns {Promise<Object|null>}
   */
  async getDocument(documentId) {
    try {
      const [rows] = await dbHots.promise().query(`
        SELECT id, entity_type, entity_id, document_source, file_name, template_name, 
               action_origin, generated_at, generated_by, snapshot_data
        FROM t_document
        WHERE id = ?
      `, [documentId]);

      if (rows.length === 0) return null;

      const doc = rows[0];
      // Parse snapshot_data if it's a string
      if (typeof doc.snapshot_data === 'string') {
        try {
          doc.snapshot_data = JSON.parse(doc.snapshot_data);
        } catch (e) {
          console.warn(`⚠️ [DOC_ENGINE] Could not parse snapshot_data for document ${documentId}`);
        }
      }
      return doc;
    } catch (error) {
      console.error(`❌ [DOC_ENGINE] Error getting document:`, error.message);
      return null;
    }
  }

  /**
   * List documents for an entity
   * @param {string} entityType
   * @param {string} entityId
   * @returns {Promise<Array>}
   */
  async listDocuments(entityType, entityId) {
    try {
      const [rows] = await dbHots.promise().query(`
        SELECT id, entity_type, entity_id, document_source, file_name, template_name, 
               action_origin, generated_at, generated_by
        FROM t_document
        WHERE entity_type = ? AND entity_id = ?
        ORDER BY generated_at DESC
      `, [entityType, String(entityId)]);

      return rows;
    } catch (error) {
      console.error(`❌ [DOC_ENGINE] Error listing documents:`, error.message);
      return [];
    }
  }

  /**
   * Render HTML from a document's snapshot_data
   * Uses the template_name to determine which renderer to use
   * @param {number} documentId
   * @returns {Promise<{ok: boolean, html?: string, error?: string}>}
   */
  async renderHtml(documentId) {
    try {
      const doc = await this.getDocument(documentId);
      if (!doc) {
        return { ok: false, error: 'Document not found' };
      }

      if (!doc.snapshot_data) {
        return { ok: false, error: 'No snapshot data available' };
      }

      // Route to appropriate template renderer
      let html;
      switch (doc.template_name) {
        case 'srf':
          // Resolve raw snapshot → renderer-ready data via prepareSRFData
          // Uses entity_id (ticket_id) for live lookups (factory, PICs, signatures, logos)
          // Passes snapshot_data as eventSnapshot to preserve frozen approval events
          const srfData = await prepareSRFData(doc.entity_id, {
            db: dbHots,
            eventSnapshot: doc.snapshot_data
          });
          html = renderSRFHtml(srfData);
          break;
        case 'card':
          // Resolve data via prepareCardData
          const cardData = await prepareCardData(doc.entity_id, {
            db: dbHots,
            eventSnapshot: doc.snapshot_data
          });
          html = renderCardHtml(cardData);
          break;
        case 'invoice':
          html = await this._renderInvoiceTemplate(doc.snapshot_data);
          break;
        default:
          html = await this._renderGenericTemplate(doc.snapshot_data, doc.template_name);
      }

      return { ok: true, html, document: doc };
    } catch (error) {
      console.error(`❌ [DOC_ENGINE] Error rendering HTML:`, error.message);
      return { ok: false, error: error.message };
    }
  }

  /**
   * Generate PDF blob from document
   * Uses Puppeteer to render HTML and return PDF buffer (not saved to disk)
   * @param {number} documentId
   * @returns {Promise<{ok: boolean, buffer?: Buffer, fileName?: string, error?: string}>}
   */
  async generatePdfBlob(documentId) {
    try {
      const renderResult = await this.renderHtml(documentId);
      if (!renderResult.ok) {
        return renderResult;
      }

      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();

      await page.setContent(renderResult.html, { waitUntil: 'domcontentloaded', timeout: 60000 });
      // Give images a chance to load
      await new Promise(resolve => setTimeout(resolve, 1500));

      const pdfBuffer = await page.pdf({ format: 'A4' });
      await browser.close();

      // Generate filename for download
      const doc = renderResult.document;
      const fileName = `${doc.template_name}_${doc.entity_id}_${doc.id}.pdf`;

      console.log(`📄 [DOC_ENGINE] Generated PDF blob for document ${documentId} (${pdfBuffer.length} bytes)`);

      return { ok: true, buffer: pdfBuffer, fileName };
    } catch (error) {
      console.error(`❌ [DOC_ENGINE] Error generating PDF:`, error.message);
      return { ok: false, error: error.message };
    }
  }

  // ============================================================
  // TEMPLATE RENDERERS
  // ============================================================

  // _renderSrfTemplate REMOVED - using core/renderers/srf-renderer.js

  async _renderInvoiceTemplate(data) {
    // Placeholder for invoice template
    return `<html><body><h1>Invoice</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
  }

  async _renderGenericTemplate(data, templateName) {
    return `
      <html>
      <head><style>body { font-family: Arial; padding: 20px; }</style></head>
      <body>
        <h1>${templateName || 'Document'}</h1>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </body>
      </html>
    `;
  }

  // ============================================================
  // LEGACY METHOD (backward compatibility)
  // ============================================================

  /**
   * Legacy: Generate physical HTML file (kept for backward compatibility)
   * @deprecated Use createDocument + renderHtml instead
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
