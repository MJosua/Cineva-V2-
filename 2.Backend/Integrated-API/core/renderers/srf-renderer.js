/**
 * SRF Document Renderer
 * Unified Source of Truth for Sample Request Form (SRF)
 * 
 * @requiredFields
 * - ticket_id: string
 * - requester_name: string
 * - srf_document_number: string
 * - sample_list: Array<{name, pcs, ctn}>
 * 
 * @optionalFields
 * - notes_list: Array
 * - approval_columns: Array
 * - requester_role: string (default: 'Business Analyst')
 * - logo_indofood, logo_icbp: Base64 strings
 */
module.exports = function renderSRFHtml(data) {
    const {
        ticket_id,
        requester_name,
        requester_role = 'Business Analyst',
        // SRF specific fields
        srf_document_number,
        request_details = [],
        notes,
        deliver_to,
        purpose,
        product_category,
        sample_category,

        // Arrays
        sample_list = [],
        approval_columns = [],
        to_pics = [],
        cc_pics = [],

        // Single values
        requester_sign_url,
        registered_date,

        // Base64 Logos
        logo_indofood,
        logo_icbp
    } = data;

    // --- Build Sample List HTML ---
    const itemRowsHtml = sample_list.map((item, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${item.name || ''}</td>
            <td>${item.pcs || ''}</td>
            <td>${item.ctn || ''}</td>
        </tr>`).join('');



    // --- Build Notes HTML ---
    const notes_list = data.notes_list || [];
    // User format: <li>Name (step): remark</li>
    const notesHtml = notes_list.map(app => `<li>${app.name} (${app.step_no || app.role || ''}): ${app.remark || app.notes || ''}</li>`).join('');

    const toStr = Array.isArray(to_pics) ? to_pics.join(', ') : to_pics;
    const ccStr = Array.isArray(cc_pics) ? cc_pics.join(', ') : cc_pics;
    const totals = data.totals || { pcs: 0, ctn: 0 };

    // --- HTML Template (Source of Truth) ---
    return `
    <html>
        <head>
            <meta charset="utf-8" />
            <title>SAMPLE REQUEST FORM ( SRF ) - PREVIEW</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; margin: 40px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 5px; text-align: left; }
                .no-border td { border: none; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .section-title { margin-top: 20px; font-weight: bold; font-size: 16px; text-align: center; }
                .note { border: 1px solid #000; padding: 10px; margin-top: 10px; }
                .approval-table td { min-height: 80px; vertical-align: bottom; text-align: center; padding-bottom: 20px; }
                .small { font-size: 10px; }
                .no-border { width: 100%; table-layout: fixed; border-collapse: collapse; }
                .no-border td { vertical-align: top; padding: 4px; }
                .label { width: 12%; font-weight: bold; }
                .content { width: 38% ; }
            </style>
        </head>
        <body>
            <div style="display:flex;justify-content:space-between;width:100%;">
                <div><img src="${logo_indofood || ''}" style="height:35px" /></div>
                <div style="display:flex;justify-content:flex-end;"><img src="${logo_icbp || ''}" style="height:35px" /></div>
            </div>

            <br>
            <table class="no-border">
                <tr><td><strong>PT. INDOFOOD CBP SUKSES MAKMUR</strong></td><td style="text-align:right;">To&nbsp;: <em> ${toStr || ''} </em> </td></tr>
                <tr><td><strong>Division</strong>&nbsp;: IOD </td><td style="text-align:right;"></td></tr>
                <tr><td><strong>Location</strong>&nbsp;: INDOFOOD TOWER LT.23</td><td></td></tr>
                <tr><td><strong>SRF NO</strong>&nbsp;: ${srf_document_number || ''}</td><td></td></tr>
            </table>

            <div class="section-title">SAMPLE REQUEST FORM ( SRF )</div>

            <table class="no-border">
                <tr>
                    <td class="label">To</td><td class="content">: ${toStr || ''}</td>
                    <td class="label">Name/Title</td><td class="content">: ${requester_name || ''}</td>
                </tr>
                <tr>
                    <td class="label">Cc</td><td class="content">: ${ccStr || ''}</td>
                    <td class="label">Purposes</td><td class="content">: ${purpose || ''}</td>
                </tr>
                <tr>
                    <td class="label">Deliver to</td><td class="content">: ${deliver_to || ''}</td>
                    <td class="label">Category</td><td class="content">: ${sample_category || product_category || ''}</td>
                </tr>
            </table>

            <table>
                <thead><tr><th>NO</th><th>DESCRIPTION</th><th>QUANTITY IN PCS</th><th>QUANTITY IN CTN</th></tr></thead>
                <tbody>
                    ${itemRowsHtml}
                    <tr><td colspan="2" class="bold" style="text-align: right;">TOTAL</td><td class="bold">${totals.pcs || 0} PCS</td><td class="bold">${totals.ctn || 0} CTN</td></tr>
                </tbody>
            </table>

            <div class="note">
                <strong>Request Detail:</strong>
                ${request_details.map(d => `<p>${d}</p>`).join('')}
            </div>

            <div class="note">
                <strong>Note:</strong><br>
                ${notesHtml}
                <br>
                <strong>Thank you</strong>
            </div>

            <table class="approval-table" style="width:100%; table-layout:fixed; border-collapse:collapse; margin-top: 30px;">
                <tr class="bold">
                    <td style="text-align:center; vertical-align:middle; height: 35px;">Request by</td>
                    ${approval_columns.map(() => `<td style="text-align:center; vertical-align:middle; height: 35px;">Approved by</td>`).join('')}
                    ${approval_columns.length === 0 ? '<td style="text-align:center; vertical-align:middle; height: 35px;">Approved by</td>' : ''}
                </tr>
                <tr>
                    <td style="padding:15px 5px; vertical-align:top; text-align:center; height: 160px;">
                        <div style="height: 100px; display:flex; align-items: center; justify-content:center; margin-bottom: 20px;">
                            ${requester_sign_url ? `<img alt="sign" src="${requester_sign_url}" style="max-width:140px; max-height: 100px; object-fit: contain;" />` : ''}
                        </div>
                        <div style="margin-top: 20px;">
                            <strong style="font-size: 14px;">${requester_name || ''}</strong><br>
                            <span style="font-size:11px; color: #333;">${requester_role}</span>
                        </div>
                    </td>
                    ${approval_columns.map(col => `
                    <td style="padding:15px 5px; vertical-align:top; text-align:center; height: 160px;">
                        <div style="height: 100px; display:flex; align-items: center; justify-content:center; margin-bottom: 20px;">
                            ${col.signature_url ? `<img alt="sign" src="${col.signature_url}" style="max-width:140px; max-height: 100px; object-fit: contain;" />` : ''}
                        </div>
                        <div style="margin-top: 20px;">
                            <strong style="font-size: 14px;">${col.name || '—'}</strong><br>
                            <span style="font-size:11px; color: #333;">${col.role || ''}</span>
                        </div>
                    </td>`).join('')}
                    ${approval_columns.length === 0 ? '<td style="padding:15px 5px; vertical-align:top; text-align:center; height: 160px;"></td>' : ''}
                </tr>
            </table>
        </body>
    </html>`;
};
