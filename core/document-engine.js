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
          html = await this._renderSrfTemplate(doc.snapshot_data);
          break;
        case 'invoice':
          html = await this._renderInvoiceTemplate(doc.snapshot_data);
          break;
        case 'completion_card':
          html = await this._renderCompletionCardTemplate(doc.snapshot_data);
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

  /**
   * Render SRF document template
   * @param {Object} data - Snapshot data
   * @returns {Promise<string>} HTML string
   */
  /**
   * Render SRF HTML using the shared renderer
   * @param {Object} data 
   * @returns {Promise<string>}
   */
  async _renderSrfTemplate(data) {
    const {
      detail_rows = [],
      sample_list = [],
      approval_columns = [],
      to_pics = [],
      cc_pics = [],
      srf_document_number,
      requester_name,
      purpose,
      deliver_to,
      sample_category,
      product_category,
      background,
      objective,
      requester_sign_url
    } = data;

    // Check key in data or detail_rows fallback
    const getByLabel = (key) => {
      if (data[key] !== undefined) return data[key];
      const row = detail_rows.find(r => (r.lbl_col || r.cstm_col || '').toLowerCase().includes(key.toLowerCase()));
      return row ? (row.value || row.cstm_col) : '';
    };

    // Build Sample List HTML
    let totalPcs = 0;
    let totalCtn = 0;

    // Use sample_list if available (preferred), else fallback to parsing detail_rows
    const itemsToRender = sample_list.length > 0 ? sample_list : [];
    // (If sample_list is empty, we could try to re-parse detail_rows, but generator should have provided it)

    const itemRowsHtml = itemsToRender.map((item, i) => {
      const qty = item.quantity || '';
      let pcs = '', ctn = '';

      const cleanQty = qty.toString().replace(/\|/g, '').trim().toLowerCase();
      if (cleanQty.includes('pcs')) {
        const val = parseInt(cleanQty);
        if (!isNaN(val)) { totalPcs += val; pcs = val.toLocaleString(); } else { pcs = qty; }
      }
      if (cleanQty.includes('ctn')) {
        const val = parseInt(cleanQty);
        if (!isNaN(val)) { totalCtn += val; ctn = val.toLocaleString(); } else { ctn = qty; }
      }

      // If no unit found, assume pcs if parsing numeric? Or leave blank? 
      // Matching original logic: if just number, maybe put in pcs column? 
      // Original logic: "if (qty.toLowerCase().includes('pcs'))" -> explicit check.

      return `
            <tr>
                <td>${i + 1}</td>
                <td>${item.name || ''}</td>
                <td>${pcs}</td>
                <td>${ctn}</td>
            </tr>`;
    }).join('');

    // Build Approval Columns HTML
    // Filter out 'Logistic Analyst' (order 2) as per original logic if needed, or use all
    // Original: .filter(a => a.approval_order !== 2)
    const validApprovals = approval_columns.filter(a => a.order !== 2);

    const approvalColumnsHtml = validApprovals.map(col => {
      const isSigned = col.status === 'Approved' || col.status === 1; // Check status convention
      const signImg = (isSigned && col.signature_url)
        ? `<img src="${col.signature_url}" style="width:120px;display:block;margin:0 auto 5px auto;" alt="sign"/>`
        : `<div style="height:50px;"></div>`;

      return `
        <td style="padding:10px 10px 15px 10px;vertical-align:top;">
            <div style="height: 100%; max-height:130px; display:flex; align-items:center; justify-content:center;">
                 ${signImg}
            </div>
            <br>
            ${col.name || '—'}
            <br>
            <span style="font-size:12px;color:#555;display:inline-block;margin-bottom:10px;">${col.role || `Step ${col.order}`}</span>
        </td>`;
    }).join('');

    // Build Notes HTML from approvals
    let notesHtml = '';
    approval_columns.forEach(app => {
      if (app.remark && app.remark.trim() !== '') {
        notesHtml += `<li>${app.name} (${app.role}): ${app.remark}</li>`;
      }
    });

    // Formatting To/Cc
    const toStr = Array.isArray(to_pics) ? to_pics.join(', ') : to_pics;
    const ccStr = Array.isArray(cc_pics) ? cc_pics.join(', ') : cc_pics;

    return `
    <html>
        <head>
            <meta charset="utf-8" />
            <title>SAMPLE REQUEST FORM ( SRF )</title>
            <style>
                body {font-family: Arial, sans-serif; font-size: 12px; margin: 40px; min-width: 700px; max-width: 794px; }
                table {width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td {border: 1px solid #000; padding: 5px; text-align: left; }
                .no-border td {border: none; }
                .center {text-align: center; }
                .bold {font-weight: bold; }
                .section-title {margin-top: 20px; font-weight: bold; font-size: 16px; text-align: center; }
                .note {border: 1px solid #000; padding: 10px; margin-top: 10px; }
                .approval-table td {height: 60px; vertical-align: bottom; text-align: center; word-break: break-word; overflow-wrap: break-word; }
                .approval-table {table-layout: fixed; }
                .approval-table td {width: 25%; }
                .small {font-size: 10px; }
            </style>
        </head>
        <body>
            <div style="display:flex;justify-content:space-between;width:100%;">
                <div>
                   <!-- LOGOS: Using generic titles or text if images fail. Ideal: Base64 embedded -->
                   <h3 style="margin:0;">INDOFOOD</h3>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                   <h3 style="margin:0;">ICBP</h3>
                </div>
            </div>

            <br>

            <table class="no-border">
                <tr>
                    <td><strong>PT. INDOFOOD CBP SUKSES MAKMUR</strong></td>
                    <td style="text-align:right;">To&nbsp;: <em> ${toStr} </em> </td>
                </tr>
                <tr>
                    <td><strong>Division</strong>&nbsp;: IOD </td>
                    <td style="text-align:right;"></td>
                </tr>
                <tr>
                    <td><strong>Location</strong>&nbsp;: INDOFOOD TOWER LT.23</td>
                    <td></td>
                </tr>
                <tr>
                    <td><strong>SRF NO</strong>&nbsp;: ${srf_document_number || 'DRAFT'}</td>
                    <td></td>
                </tr>
            </table>

            <div class="section-title">SAMPLE REQUEST FORM ( SRF )</div>

            <style>
                .no-border { width: 100%; table-layout: fixed; border-collapse: collapse; }
                .no-border td { vertical-align: top; padding: 4px; }
                .label { width: 12%; font-weight: bold; }
                .content { width: 38%; }
            </style>

            <table class="no-border">
                <tr>
                    <td class="label">To</td>
                    <td class="content">:  ${toStr}</td>
                    <td class="label">Name/Title</td>
                    <td class="content">: ${requester_name || ''}</td>
                </tr>
                <tr>
                    <td class="label">Cc</td>
                    <td class="content">:  ${ccStr}</td>
                    <td class="label">Purposes</td>
                    <td class="content">: ${purpose || ''}</td>
                </tr>
                <tr>
                    <td class="label">Deliver to</td>
                    <td class="content">: ${deliver_to || ''}</td>
                    <td class="label">Category</td>
                    <td class="content">: ${sample_category || product_category || getByLabel('Category_field')}</td>
                </tr>
            </table>

            <table>
                <thead>
                    <tr>
                        <th>NO</th>
                        <th>DESCRIPTION</th>
                        <th>QUANTITY IN PCS</th>
                        <th>QUANTITY IN CTN</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRowsHtml}
                    <tr>
                        <td colspan="2" class="bold" style="text-align: right;">TOTAL</td>
                        <td class="bold">${totalPcs.toLocaleString()} PCS</td>
                        <td class="bold">${totalCtn.toLocaleString()} CTN</td>
                    </tr>
                </tbody>
            </table>

            <div class="note">
                <strong>Request Detail:</strong>
                <p>${background ? `Background: ${background}` : ''}</p>
                <p>${objective ? `Objective: ${objective}` : ''}</p>
                <!-- Add other notes/week delivery checks here if needed -->
            </div>

            <div class="note">
                <strong>Note:</strong>
                <br>
                <ul>
                    ${notesHtml}
                </ul>
                <strong>Thank you</strong>
            </div>

            <table class="approval-table" style="width:100%; table-layout:fixed; border-collapse:collapse;">
                <tr class="bold">
                    <td style="text-align:center; vertical-align:middle;">Request by</td>
                    <td style="text-align:center; vertical-align:middle;">Approved by</td>
                    <td style="text-align:center; vertical-align:middle;">Approved by</td>
                    <td style="text-align:center; vertical-align:middle;">Approved by</td>
                </tr>
                <tr>
                    <td style="padding:10px 10px 15px 10px;vertical-align:top;">
                        <div style="height: 100%; max-height:130px;display:flex; align-items: center; justify-content:center;">
                            ${requester_sign_url ? `<img alt="sign" src="${requester_sign_url}" style="width:120px;display:block;margin:0 auto 5px auto;" />` : ''}
                        </div>
                        <br>
                        ${requester_name || ''}
                        <br>
                        <span style="font-size:12px;color:#555;display:inline-block;margin-bottom:10px;">Requester</span>
                    </td>
                    ${approvalColumnsHtml}
                </tr>
            </table>
        </body>
    </html>
    `;
  }

  async _renderInvoiceTemplate(data) {
    // Placeholder for invoice template
    return `<html><body><h1>Invoice</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
  }

  async _renderCompletionCardTemplate(data) {
    // Placeholder for completion card template
    return `<html><body><h1>Completion Card</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
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
