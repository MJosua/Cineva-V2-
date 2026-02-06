module.exports = function renderSRFHtml(data) {
    const {
        ticket_id,
        requester_name,
        // SRF specific fields
        srf_document_number,
        request_details = [],
        notes,
        background,
        objective,
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
            <td style="text-align:center;">${i + 1}</td>
            <td>${item.name || ''}</td>
            <td style="text-align:center;">${item.pcs || ''}</td>
            <td style="text-align:center;">${item.ctn || ''}</td>
        </tr>`).join('');

    // --- Build Approval Columns HTML ---
    const approvalColumnsHtml = approval_columns.map(col => {
        const isSigned = !!col.signature_url;
        let signContent = `<div style="height: 100%; max-height:130px; display:flex; align-items:center;"></div>`;
        if (isSigned) {
            signContent = `
                <div style="height: 100%; max-height:130px; display:flex; align-items:center;">
                    <img alt="sign" src="${col.signature_url}" style="width:120px;display:block;margin:0 auto 5px auto;"/>
                </div>`;
        }

        return `
        <td style="padding:10px 10px 15px 10px;vertical-align:top;">
            ${signContent}
            <br>
            ${col.name || '—'}
            <br>
            <span style="font-size:12px;color:#555;display:inline-block;margin-bottom:10px;">${col.role || ''}</span>
        </td>`;
    }).join('');

    // --- Build Notes HTML ---
    const notes_list = data.notes_list || [];
    const notesHtml = notes_list.map(app => `<li>${app.name} (${app.role}): ${app.remark}</li>`).join('');

    const toStr = Array.isArray(to_pics) ? to_pics.join(', ') : to_pics;
    const ccStr = Array.isArray(cc_pics) ? cc_pics.join(', ') : cc_pics;
    const totals = data.totals || { pcs: 0, ctn: 0 };

    // --- HTML Template ---
    return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8" />
            <title>SAMPLE REQUEST FORM ( SRF )</title>
            <style>
                @page { size: A4; margin: 0; }
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    font-size: 12px; 
                    margin: 0;
                    padding: 40px;
                    color: #000; 
                    line-height: 1.4;
                    -webkit-print-color-adjust: exact;
                }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
                .no-border, .no-border tr, .no-border td { border: none !important; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .header-logos { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-end; }
                .header-title { font-weight: bold; font-size: 16px; text-align: center; margin: 20px 0; }
                .note-box { border: 1px solid #000; padding: 10px; margin-top: 15px; }
                .approval-table { table-layout: fixed; margin-top: 30px; width: 100%; }
                .label { width: 12%; font-weight: bold; vertical-align: top; }
                .content { width: 38%; vertical-align: top; }
                p { margin: 3px 0; }
                ul { margin: 5px 0 5px 20px; padding: 0; }
                li { margin-bottom: 2px; }
            </style>
        </head>
        <body>
            <div class="header-logos">
                <div><img src="${logoIndofoodSrc}" style="height:45px; display:block;"></div>
                <div><img src="${logoIcbpSrc}" style="height:45px; display:block;"></div>
            </div>

            <table class="no-border">
                <tr>
                    <td style="width:60%;"><strong>PT. INDOFOOD CBP SUKSES MAKMUR</strong></td>
                    <td style="text-align:right;">To&nbsp;: <em>${toStr}</em></td>
                </tr>
                <tr>
                    <td><strong>Division</strong>&nbsp;: IOD</td>
                    <td></td>
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

            <div class="header-title">SAMPLE REQUEST FORM ( SRF )</div>

            <table class="no-border">
                <tr>
                    <td class="label">To</td>
                    <td class="content">: ${toStr}</td>
                    <td class="label">Name/Title</td>
                    <td class="content">: ${requester_name || ''}</td>
                </tr>
                <tr>
                    <td class="label">Cc</td>
                    <td class="content">: ${ccStr}</td>
                    <td class="label">Purposes</td>
                    <td class="content">: ${purpose || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Deliver to</td>
                    <td class="content">: ${deliver_to || '-'}</td>
                    <td class="label">Category</td>
                    <td class="content">: ${sample_category || product_category || '-'}</td>
                </tr>
            </table>

            <table>
                <thead>
                    <tr style="background-color:#fefefe;">
                        <th style="text-align:center; width:40px;">NO</th>
                        <th style="text-align:center;">DESCRIPTION</th>
                        <th style="text-align:center; width:130px;">QUANTITY IN PCS</th>
                        <th style="text-align:center; width:130px;">QUANTITY IN CTN</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRowsHtml}
                    <tr>
                        <td colspan="2" class="bold" style="text-align:right;">TOTAL</td>
                        <td class="bold center">${totals.pcs.toLocaleString('id-ID')} PCS</td>
                        <td class="bold center">${totals.ctn.toLocaleString('id-ID')} CTN</td>
                    </tr>
                </tbody>
            </table>

            <div class="note-box">
                <strong>Request Detail:</strong>
                <div style="margin-top:5px;">
                    ${request_details.map(d => `<p style="margin:2px 0;">${d}</p>`).join('')}
                </div>
            </div>

            <div class="note-box">
                <strong>Note:</strong>
                <div style="margin-top:5px;">
                    ${notes ? `<p style="margin:2px 0;">${notes}</p>` : ''}
                    <ul style="margin:5px 0 5px 20px; padding:0;">
                        ${notesHtml}
                    </ul>
                    <strong>Thank you</strong>
                </div>
            </div>

            <table class="approval-table">
                <tr class="bold">
                    <td style="text-align:center; vertical-align:middle;">Request by</td>
                    ${approval_columns.map(() => `<td style="text-align:center; vertical-align:middle;">Approved by</td>`).join('')}
                </tr>
                <tr>
                    <td style="padding:10px 10px 15px 10px;vertical-align:top; text-align:center;">
                        <div style="height: 100%; max-height:130px; display:flex; align-items:center; justify-content:center;">
                            ${requester_sign_url ? `<img alt="sign" src="${requester_sign_url}" style="width:120px;display:block;margin:0 auto 5px auto;"/>` : ''}
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
    </html>`;
};
