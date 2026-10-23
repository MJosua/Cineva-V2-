// Handles all room-related API routes using Universal Generic Resource System
const express = require('express');
const router = express.Router();
const { dbHots } = require('../../config/db');

console.log("[MB-ROOMS] Router loaded and initialized.");

router.use((req, res, next) => {
    console.log(`[MB-ROOMS] Request received: ${req.method} ${req.originalUrl} -> ${req.url}`);
    next();
});

router.post('/battery-status', async (req, res) => {
    console.log(`[BATT] Incoming report:`, {
        url: req.originalUrl,
        body: req.body,
        headers: req.headers.authorization ? 'Bearer present' : 'none'
    });
    const connection = await dbHots.promise().getConnection();
    try {
        const { resource_key, battery_level, is_charging } = req.body;
        console.log(`[BATT] Values: Key=${resource_key}, Level=${battery_level}, Charging=${is_charging}`);

        if (!resource_key) {
            return res.status(400).json({ success: false, message: "resource_key is required" });
        }

        await connection.beginTransaction();

        // 1. Get current attributes
        const [rows] = await connection.query(
            "SELECT attributes FROM resource_m_data WHERE resource_key = ? AND resource_category = 'meeting_room' FOR UPDATE",
            [resource_key]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        let attributes = {};
        try {
            attributes = typeof rows[0].attributes === 'string' ? JSON.parse(rows[0].attributes) : (rows[0].attributes || {});
        } catch (e) {
            console.error("Error parsing attributes for update:", resource_key);
        }

        // 2. Update battery info
        const updatedAttributes = {
            ...attributes,
            battery_level: Number(battery_level),
            is_charging: !!is_charging,
            last_battery_update: new Date().toISOString()
        };

        // 3. Save back to DB
        await connection.query(
            "UPDATE resource_m_data SET attributes = ? WHERE resource_key = ? AND resource_category = 'meeting_room'",
            [JSON.stringify(updatedAttributes), resource_key]
        );

        await connection.commit();
        res.status(200).json({ success: true, message: "Battery status updated successfully" });
    } catch (err) {
        await connection.rollback();
        console.error(`Error updating battery status: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        connection.release();
    }
});

// 🔔 POST /battery-alert — fires when kiosk battery < 20%
// Creates an IT Support ticket and emails IT team (dept_id=10) + CC etria.purba
router.post('/battery-alert', async (req, res) => {
    const { resource_key, battery_level, is_charging } = req.body;
    const CC_EMAIL = 'etria.purba@icbp.indofood.co.id';
    const IT_DEPT_ID = 10;
    const IT_SERVICE_ID = 7;

    if (!resource_key) {
        return res.status(400).json({ success: false, message: 'resource_key is required' });
    }

    const connection = await dbHots.promise().getConnection();
    try {
        console.log(`[BATT-ALERT] Low battery alert triggered: ${resource_key} = ${battery_level}%`);

        // ── 1. Guard: only alert once per 2 hours per room ──────────────────
        const [roomRows] = await connection.query(
            "SELECT attributes FROM resource_m_data WHERE resource_key = ? AND resource_category = 'meeting_room'",
            [resource_key]
        );
        if (roomRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        let attrs = {};
        try { attrs = typeof roomRows[0].attributes === 'string' ? JSON.parse(roomRows[0].attributes) : (roomRows[0].attributes || {}); } catch (e) { }

        const lastAlert = attrs.last_battery_alert ? new Date(attrs.last_battery_alert).getTime() : 0;
        const twoHours = 2 * 60 * 60 * 1000;
        if (Date.now() - lastAlert < twoHours) {
            console.log(`[BATT-ALERT] Alert suppressed (sent within 2 hours) for ${resource_key}`);
            return res.json({ success: true, message: 'Alert already sent recently, suppressed.' });
        }

        // ── 2. Get IT team emails (dept_id = 10) ─────────────────────────────
        const [itUsers] = await connection.query(
            `SELECT email FROM \`user\` WHERE department_id = ? AND active = 1 AND email IS NOT NULL AND email != ''`,
            [IT_DEPT_ID]
        );
        const toEmails = itUsers.map(u => u.email);

        if (toEmails.length === 0) {
            console.warn('[BATT-ALERT] No IT team emails found (dept_id=10)');
        }

        // ── 3. Create IT Support ticket (service 7) ──────────────────────────
        await connection.beginTransaction();

        const issueDesc = `⚠️ LOW BATTERY ALERT — Kiosk tablet in meeting room "${resource_key}" is at ${battery_level}%. Please check the power connection immediately.`;

        // Insert into t_ticket
        const [ticketResult] = await connection.query(
            `INSERT INTO t_ticket (service_id, created_by, status, created_at, updated_at, title)
             VALUES (?, ?, 'open', NOW(), NOW(), ?)`,
            [IT_SERVICE_ID, 10105, `[KIOSK] Low Battery in ${resource_key} — ${battery_level}%`]
        );
        const ticket_id = ticketResult.insertId;

        // Insert ticket detail fields matching service 7 form JSON
        const fields = [
            { order_col: 0, cstm_col: 'requester_name', lbl_col: 'Requester Name', value: 'Tablet IOD Asia (Kiosk)' },
            { order_col: 1, cstm_col: 'department', lbl_col: 'Department', value: 'IT Operations' },
            { order_col: 2, cstm_col: 'email', lbl_col: 'Email', value: 'it.support@iod.indofood.com' },
            { order_col: 3, cstm_col: 'support_type', lbl_col: 'Support Type', value: 'Hardware Issue' },
            { order_col: 4, cstm_col: 'urgency', lbl_col: 'Urgency Level', value: 'High' },
            { order_col: 5, cstm_col: 'issue_description', lbl_col: 'Issue Description', value: issueDesc },
            { order_col: 6, cstm_col: 'device_type', lbl_col: 'Device Type', value: 'Other' },
        ];

        for (const f of fields) {
            await connection.query(
                `INSERT INTO t_ticket_detail (ticket_id, order_col, cstm_col, lbl_col, value) VALUES (?, ?, ?, ?, ?)`,
                [ticket_id, f.order_col, f.cstm_col, f.lbl_col, f.value]
            );
        }

        // ── 4. Stamp last_battery_alert timestamp ───────────────────────────
        const updatedAttrs = { ...attrs, last_battery_alert: new Date().toISOString() };
        await connection.query(
            "UPDATE resource_m_data SET attributes = ? WHERE resource_key = ? AND resource_category = 'meeting_room'",
            [JSON.stringify(updatedAttrs), resource_key]
        );

        await connection.commit();
        console.log(`[BATT-ALERT] Ticket #${ticket_id} created for ${resource_key}`);

        // ── 5. Send email (non-blocking) ──────────────────────────────────────
        const { hotsBatteryAlertMailer } = require('../../service/mailer/hots/hots_mailer');
        hotsBatteryAlertMailer(
            toEmails.length > 0 ? toEmails : [CC_EMAIL],
            [CC_EMAIL],
            resource_key,
            battery_level
        ).catch(err => console.error('[BATT-ALERT] Email error:', err));

        return res.json({
            success: true,
            ticket_id,
            message: `Low battery alert ticket #${ticket_id} created and email sent.`
        });

    } catch (err) {
        await connection.rollback();
        console.error(`[BATT-ALERT] Error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        connection.release();
    }
});


router.get('/summary', async (req, res) => {
    try {
        const [rows] = await dbHots.promise().query(`
            SELECT 
                resource_key,
                resource_label,
                attributes
            FROM resource_m_data 
            WHERE resource_category = 'meeting_room' 
            AND is_active = 1
        `);

        const kpis = {
            total_rooms: rows.length,
            low_battery: 0,
            charging: 0,
            avg_battery: 0
        };

        let totalCharged = 0;
        let roomCount = 0;

        rows.forEach(row => {
            let attrs = {};
            try {
                attrs = typeof row.attributes === 'string' ? JSON.parse(row.attributes) : (row.attributes || {});
            } catch (e) { }

            const level = attrs.battery_level || 0;
            if (level > 0) {
                totalCharged += level;
                roomCount++;
            }
            if (level <= 20 && level > 0) kpis.low_battery++;
            if (attrs.is_charging) kpis.charging++;
        });

        kpis.avg_battery = roomCount > 0 ? Math.round(totalCharged / roomCount) : 0;

        res.status(200).json({
            success: true,
            kpis: kpis
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const [rows] = await dbHots.promise().query(`
            SELECT 
                id, 
                resource_key, 
                resource_label AS room_name,
                attributes
            FROM resource_m_data 
            WHERE resource_category = 'meeting_room' 
            AND is_active = 1
        `);

        // Parse attributes and format for frontend compatibility
        const formattedData = rows.map(row => {
            let attrs = {};
            try {
                attrs = typeof row.attributes === 'string' ? JSON.parse(row.attributes) : (row.attributes || {});
            } catch (e) {
                console.error("Error parsing attributes for room:", row.resource_key);
            }

            return {
                id: row.id,
                room_name: row.room_name,
                resource_key: row.resource_key,
                ...attrs
            };
        });

        res.status(200).json({
            success: true,
            data: formattedData,
            message: "Meeting Rooms list retrieved successfully"
        });
    } catch (err) {
        console.error(`Error getting Meeting Rooms list: ${err.message}`);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;