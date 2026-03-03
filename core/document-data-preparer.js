const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const encrypts = require('../config/encrypts');

/**
 * Helper: Convert local image file to Base64 Data URL
 * @param {string} filePath - Absolute or relative path to image
 * @returns {string|null} Base64 data URL or null if failed
 */
const imageToDataURL = (filePath) => {
    try {
        if (!filePath) return null;
        // Remove leading slash if present for relative path resolution
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        // Resolve absolute path (assuming running from root)
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(cleanPath);

        if (!fs.existsSync(absolutePath)) {
            // Fallback for public paths if running from subfolder
            const fallbackPath = path.resolve('public', cleanPath);
            if (!fs.existsSync(fallbackPath)) {
                return null;
            }
            filePath = fallbackPath;
        } else {
            filePath = absolutePath;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
        return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    } catch (err) {
        console.error(`[imageToDataURL] Error reading file ${filePath}:`, err);
        return null;
    }
};

/**
 * Prepares SRF Data Snapshot
 * Fetches data from DB and resolves all IDs to strings/values.
 * 
 * @param {string} ticketId 
 * @param {Object} context - Optional context (db connection, etc)
 * @returns {Promise<Object>} Pure JSON snapshot data
 */
async function prepareSRFData(ticketId, { db, eventSnapshot = null }) {
    // Helper to query
    const query = async (sql, params) => {
        if (db && db.promise) return (await db.promise().query(sql, params))[0];
        throw new Error('Database connection not available for prepareSRFData');
    };

    // 1. Fetch Ticket & Work Data
    const ticketSql = `
        SELECT t.*, CONCAT(u.firstname, ' ', u.lastname) as created_by_name, u.email as created_by_email,
               m.service_name, d.department_name
        FROM t_ticket t
        LEFT JOIN user u ON t.created_by = u.user_id
        LEFT JOIN m_service m ON t.service_id = m.service_id
        LEFT JOIN m_department d ON u.department_id = d.department_id
        WHERE t.ticket_id = ?
    `;
    const ticketRows = await query(ticketSql, [ticketId]);
    if (!ticketRows.length) throw new Error(`Ticket ${ticketId} not found`);
    const ticket = ticketRows[0];

    const workDataSql = `SELECT field_name, field_value FROM t_ticket_work_data WHERE ticket_id = ?`;
    const workDataRows = await query(workDataSql, [ticketId]);
    const workData = {};
    workDataRows.forEach(row => workData[row.field_name] = row.field_value);

    // 2. Resolve Factory & PICs
    let factoryId = workData['factory_id'];
    let factoryName = workData['factory']; // Default if exists
    let toPics = [], ccPics = [];

    if (factoryId) {
        // Fetch specific factory details
        const facSql = `SELECT factory_sname, factory_name FROM iod.mst_factory WHERE factory_id = ?`;
        const facRes = await query(facSql, [factoryId]);
        if (facRes.length) factoryName = facRes[0].factory_sname || facRes[0].factory_name;

        // Fetch PICs
        const picSql = `SELECT pic_name, flag FROM iod.map_factory_pic WHERE factory_id = ? AND end_date IS NULL ORDER BY flag ASC`;
        const picRes = await query(picSql, [factoryId]);
        toPics = picRes.filter(p => p.flag === 1).map(p => p.pic_name);
        ccPics = picRes.filter(p => p.flag === 2).map(p => p.pic_name);
    }

    // 3. Resolve Sample Items (Detail Rows)
    const detailSql = `SELECT * FROM t_ticket_detail WHERE ticket_id = ? ORDER BY order_col ASC`;
    const detailRows = await query(detailSql, [ticketId]);

    const cleanValue = (value) => {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.join(', ') : parsed;
        } catch {
            return value;
        }
    };

    // Robust getByLabel (HOTS + Engine Support)
    const getByLabel = (labelKeyword) => {
        // Try Core Engine format (cstm_col contains field_id)
        let row = detailRows.find(r => r.cstm_col?.toLowerCase().includes(labelKeyword.toLowerCase()));
        if (row) return cleanValue(row.value || '');
        // Fallback to HOTS format (lbl_col contains field_id)
        row = detailRows.find(r => r.lbl_col?.toLowerCase().includes(labelKeyword.toLowerCase()));
        return cleanValue(row?.cstm_col || row?.value || '');
    };

    const isEngineFormat = detailRows.some(r =>
        r.field_type === 'rowgroup_item' ||
        r.lbl_col?.toLowerCase() === 'quantity' ||
        r.lbl_col?.toLowerCase() === 'item name'
    );

    const sampleList = [];
    let totalPcs = 0;
    let totalCtn = 0;

    if (isEngineFormat) {
        const itemRows = detailRows.filter(r =>
            r.lbl_col?.toLowerCase() === 'item name' ||
            (r.field_type === 'rowgroup_item' && r.lbl_col?.toLowerCase().includes('item'))
        );
        const quantityRows = detailRows.filter(r =>
            r.lbl_col?.toLowerCase() === 'quantity' ||
            (r.field_type === 'rowgroup_item' && r.lbl_col?.toLowerCase().includes('quantity'))
        );

        itemRows.forEach((itemRow, i) => {
            const itemName = itemRow.value || '';
            const itemIndex = itemRow.cstm_col?.match(/\d+/)?.[0] || i.toString();
            const qtyRow = quantityRows.find(q => q.cstm_col?.includes(itemIndex)) || quantityRows[i];
            const qtyValue = qtyRow?.value || '';

            let pcs = '', ctn = '';
            const cleanQty = qtyValue.replace(/\|/g, '').trim().toLowerCase();

            if (cleanQty.includes('pcs')) {
                const val = parseInt(cleanQty);
                if (!isNaN(val)) { totalPcs += val; pcs = val.toLocaleString('id-ID') + ' PCS'; }
                else { pcs = qtyValue; }
            } else if (cleanQty.includes('ctn')) {
                const val = parseInt(cleanQty);
                if (!isNaN(val)) { totalCtn += val; ctn = val.toLocaleString('id-ID') + ' CTN'; }
                else { ctn = qtyValue; }
            } else if (cleanQty !== '') {
                const val = parseInt(cleanQty);
                if (!isNaN(val)) { totalPcs += val; pcs = val.toLocaleString('id-ID') + ' PCS'; }
            }

            sampleList.push({ name: itemName, pcs, ctn });
        });
    } else {
        // Legacy HOTS Format
        const itemRows = detailRows.filter(row => row.lbl_col?.toLowerCase().includes('item'));
        itemRows.forEach((row, i) => {
            const itemName = row.value || row.cstm_col || '';
            const qtyRow = detailRows.find(r => r.lbl_col?.toLowerCase().includes('quantity') && r.order_col === row.order_col + 1) || detailRows[i + 1];
            const qty = qtyRow?.value || qtyRow?.cstm_col || '';
            let pcs = '', ctn = '';
            const cleanQty = qty.replace(/\|/g, '').trim().toLowerCase();

            if (cleanQty.includes('pcs')) {
                const val = parseInt(cleanQty);
                if (!isNaN(val)) { totalPcs += val; pcs = val.toLocaleString('id-ID') + ' PCS'; }
                else { pcs = qty; }
            } else if (cleanQty.includes('ctn')) {
                const val = parseInt(cleanQty);
                if (!isNaN(val)) { totalCtn += val; ctn = val.toLocaleString('id-ID') + ' CTN'; }
                else { ctn = qty; }
            } else if (cleanQty !== '') {
                const val = parseInt(cleanQty);
                if (!isNaN(val)) { totalPcs += val; pcs = val.toLocaleString('id-ID') + ' PCS'; }
            }

            sampleList.push({ name: itemName, pcs, ctn });
        });
    }

    // 4. Resolve Approvals & Signatures (Frozen Events or Live)
    let stepNameLookup = {};
    try {
        const wfSql = `SELECT sw.definition FROM m_service_workflow sw WHERE sw.workflow_id = ?`;
        const wfRes = await query(wfSql, [ticket.service_id]);
        if (wfRes.length && wfRes[0].definition) {
            const def = typeof wfRes[0].definition === 'string' ? JSON.parse(wfRes[0].definition) : wfRes[0].definition;
            if (def.steps) def.steps.forEach(step => stepNameLookup[step.level] = step.meta?.name || `Step ${step.level}`);
        }
    } catch (wfErr) { console.warn(`[prepareSRFData] WF Err: ${wfErr.message}`); }

    let approvalEvents = [];
    if (eventSnapshot && Array.isArray(eventSnapshot)) {
        // Option B: Raw array passed directly
        approvalEvents = eventSnapshot;
    } else if (eventSnapshot && typeof eventSnapshot === 'object' && eventSnapshot.events) {
        // Option C: Event wrapper from t_document snapshot
        approvalEvents = eventSnapshot.events;
    } else if (eventSnapshot && typeof eventSnapshot === 'object' && eventSnapshot.approval_columns) {
        // Legacy/Hybrid path support
    } else {
        // Default: Live fetch
        const approvalSql = `
            SELECT e.approval_order, e.approver_id, e.approval_status, e.approve_date, e.remark,
                   CONCAT(u.firstname, ' ', u.lastname) as approver_name, e.approver_leader
            FROM t_ticket_event e
            LEFT JOIN user u ON e.approver_id = u.user_id
            WHERE e.ticket_id = ? AND e.event_type = 'approve'
            ORDER BY e.approval_order ASC
        `;
        approvalEvents = await query(approvalSql, [ticketId]);
    }

    // 4b. Resolve Missing Approver Names (Critical for Snapshots)
    const missingNameIds = [...new Set(approvalEvents.filter(e => !e.approver_name && e.approver_id).map(e => e.approver_id))];
    if (missingNameIds.length > 0) {
        const userSql = `SELECT user_id, CONCAT(firstname, ' ', lastname) as fullname FROM user WHERE user_id IN (?)`;
        const userRows = await db.promise().query(userSql, [missingNameIds]);
        const userMap = {};
        if (Array.isArray(userRows[0])) {
            // Handle mysql2 binary row format if needed, though typically just rows
            userRows[0].forEach(u => userMap[u.user_id] = u.fullname);
        } else {
            // Standard array return
            userRows.forEach(u => userMap[u.user_id] = u.fullname);
            // Note: Depending on driver config, it might be [rows, fields] or just rows. 
            // The helper 'query' returns [0], but here we use raw db.promise() for IN clause safety or map manually.
            // Actually, let's use the helper if we can, but helper expects parameterized array?
            // db.promise().query usually returns [rows, fields].
        }

        // Let's stick to safe raw query pattern:
        const [users] = await db.promise().query(userSql, [missingNameIds]);
        const nameLookup = {};
        users.forEach(u => nameLookup[u.user_id] = u.fullname);

        approvalEvents.forEach(e => {
            if (!e.approver_name && e.approver_id) {
                e.approver_name = nameLookup[e.approver_id] || 'Unknown User';
            }
        });
    }

    // Helper for robust signature resolution
    const resolveSignature = async (userId) => {
        if (!userId) return null;
        try {
            // 1. Try DB-stored path (Profile Handsign)
            const [profile] = await query(`SELECT attribute_value FROM user_profile WHERE user_id = ? AND attribute_name = 'default_signature' AND is_active = 1 LIMIT 1`, [userId]);
            if (profile?.attribute_value) {
                let dataUrl = imageToDataURL(profile.attribute_value);
                if (dataUrl) return dataUrl;

                // Fallback: Try swapping extensions (jpg <-> png) in case of mismatch
                const ext = path.extname(profile.attribute_value).toLowerCase();
                if (ext === '.jpg' || ext === '.jpeg') {
                    dataUrl = imageToDataURL(profile.attribute_value.replace(ext, '.png'));
                } else if (ext === '.png') {
                    dataUrl = imageToDataURL(profile.attribute_value.replace(ext, '.jpg'));
                }
                if (dataUrl) return dataUrl;
            }
            // 2. Try legacy hardcoded path pattern (TTD Fallback)
            return imageToDataURL(`public/ttd/sign-${userId}.jpg`);
        } catch (err) {
            console.warn(`[prepareSRFData] Sign resolution error for user ${userId}:`, err.message);
            return null;
        }
    };

    const approvalColumns = [];
    if (eventSnapshot && typeof eventSnapshot === 'object' && eventSnapshot.approval_columns) {
        approvalColumns.push(...eventSnapshot.approval_columns);
    } else {
        for (const evt of approvalEvents.filter(e => e.approver_leader == 1 && e.approval_order != 2)) {
            const signature_url = evt.approval_status == 1 ? await resolveSignature(evt.approver_id) : null;
            approvalColumns.push({
                order: evt.approval_order,
                name: evt.approver_name,
                role: stepNameLookup[evt.approval_order] || `Step ${evt.approval_order}`,
                status: evt.approval_status,
                signature_url
            });
        }
    }

    let notesList = [];
    if (eventSnapshot && typeof eventSnapshot === 'object' && eventSnapshot.notes_list) {
        notesList = eventSnapshot.notes_list;
    } else {
        notesList = approvalEvents
            .filter(evt => evt.remark && evt.remark.trim() !== '')
            .map(evt => ({
                name: evt.approver_name,
                role: stepNameLookup[evt.approval_order] || `Step ${evt.approval_order}`,
                remark: evt.remark
            }));
    }

    // 5. Requester Signature
    const requesterSignData = await resolveSignature(ticket.created_by);

    // 6. Header Logos
    const logoIndofood = imageToDataURL('public/aset/image/indofood_header_logo.png');
    const logoIcbp = imageToDataURL('public/aset/image/icbp_header_logo.png');

    // 7. Request Detail logic
    const po = getByLabel("PO_Number") || getByLabel("PO Number");
    const week = getByLabel("Week Delivery");
    const isDeclare = getByLabel("field_1761105177705");
    const noteField = getByLabel("field_1761105303599") || getByLabel("Request Detail");

    const request_details = [];
    if (po && !po.toLowerCase().includes("no data found")) request_details.push(`MOHON AGAR PERMINTAAN SAMPLE DIPROSES PADA PO ${po}`);
    if (week && week !== "No Data Found") request_details.push(`MOHON AGAR PERMINTAAN SAMPLE DIPROSES PADA WEEK ${week}`);
    request_details.push(`MOHON AGAR PERMINTAAN SAMPLE ${String(isDeclare).toLowerCase() === 'true' ? '' : 'TIDAK '}DIDECLARE PADA SHIPPING DOCS`);

    return {
        ticket_id: ticketId,
        requester_name: ticket.created_by_name,
        registered_date: ticket.creation_date,
        srf_document_number: workData['srf_document_number'] || `DRAFT/${ticketId}`,
        purpose: getByLabel("Purpose"),
        deliver_to: getByLabel("deliver_to") || getByLabel("Deliver to"),
        sample_category: getByLabel("Category_field"),
        request_details,
        notes: noteField,
        notes_list: notesList,
        to_pics: toPics,
        cc_pics: ccPics,
        sample_list: sampleList,
        totals: { pcs: totalPcs, ctn: totalCtn },
        approval_columns: approvalColumns,
        requester_sign_url: requesterSignData,
        logo_indofood: logoIndofood,
        logo_icbp: logoIcbp
    };
}

/**
 * Prepare data for Business Card generation
 * @param {number|string} entityId - User ID
 * @param {Object} context - { db, eventSnapshot }
 */
async function prepareCardData(entityId, { db, eventSnapshot = null }) {
    let rawData;
    const query = async (sql, params) => {
        if (db && db.promise) return (await db.promise().query(sql, params));
        if (db && db.query) return new Promise((resolve, reject) => {
            db.query(sql, params, (err, res) => err ? reject(err) : resolve([res]));
        }); // Normalize to [rows]
        throw new Error('Database connection not available');
    };

    // 1. Fetch Data (Snapshot vs Live)
    if (eventSnapshot) {
        rawData = eventSnapshot;
    } else {
        const userSql = `
            SELECT 
                u.user_id, u.firstname, u.lastname, u.email, u.phone, 
                u.jobtitle_id, j.job_title as job_title_name,
                u.department_id, d.department_name
            FROM user u
            LEFT JOIN m_job_title j ON u.jobtitle_id = j.jobtitle_id
            LEFT JOIN m_department d ON u.department_id = d.department_id
            WHERE u.user_id = ?
         `;
        const [rows] = await query(userSql, [entityId]);
        if (!rows || rows.length === 0) throw new Error(`User ${entityId} not found`);
        rawData = rows[0];

        // Fetch additional profile attributes like 'phone'
        const [profileRows] = await query(`
            SELECT attribute_name, attribute_value 
            FROM user_profile 
            WHERE user_id = ? AND is_active = 1
         `, [entityId]);

        if (profileRows) {
            profileRows.forEach(attr => {
                if (attr.attribute_name === 'phone') rawData.cell_phone = attr.attribute_value;
            });
        }
    }

    // 2. Format & Enrich
    const fullname = rawData.fullname || `${rawData.firstname || ''} ${rawData.lastname || ''}`.trim();

    // QR Code Generation
    let qrCodeDataUrl = '';
    try {
        let employeeIdForQR = rawData.user_id;

        // Try to encrypt ID for security
        try {
            if (encrypts && typeof encrypts.encryptEmployeeId === 'function') {
                employeeIdForQR = encrypts.encryptEmployeeId(rawData.user_id);
            }
        } catch (encErr) {
            console.warn('[prepareCardData] Encryption failed, falling back to raw ID:', encErr.message);
        }

        const encodedId = encodeURIComponent(employeeIdForQR);
        // Use the correct public facing URL
        const profileUrl = `https://hots.indofood.com/hots/card/card?employee_id=${encodedId}`;

        qrCodeDataUrl = await QRCode.toDataURL(profileUrl, {
            width: 100,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
        });
    } catch (err) {
        console.warn('[prepareCardData] QR Gen Failed:', err.message);
    }

    return {
        name: fullname,
        position: rawData.job_title_name || '',
        department_name: rawData.department_name || '',
        email: rawData.email || '',
        cellPhone: rawData.cell_phone || rawData.phone || '',
        extPhone: rawData.ext_phone || '',
        company: 'PT. INDOFOOD CBP SUKSES MAKMUR',
        qr_code_url: qrCodeDataUrl
    };
}

module.exports = {
    prepareSRFData,
    prepareCardData
};
