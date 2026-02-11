const { dbHots, dbQueryHots } = require("../../../../config/db");

let yellowTerminal = "\x1b[33m";

/**
 * SystemUtilityController
 * Handles Meeting Rooms, Operational Calendar (todaysweek), and Trigger Config/Schema
 */
module.exports = {
    getmeetingroom: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        dbHots.execute(`SELECT * FROM m_meeting_room`, (err1, results1) => {
            if (err1) return res.status(500).send({ success: false, message: err1 });
            res.status(200).send({ success: true, message: "GET meetingroom SUCCESS", data: results1 });
        });
    },

    getmeetingroom_static: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        dbHots.execute(`SELECT * FROM m_meeting_room_static`, (err1, results1) => {
            if (err1) return res.status(500).send({ success: false, message: err1 });
            res.status(200).send({ success: true, message: "GET meetingroom static SUCCESS", data: results1 });
        });
    },

    todaysweek: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        try {
            const query = `
                SELECT opcal_id, week, year, DATE(FROM_UNIXTIME(opcal_id * 100)) as date_converted
                FROM dat_operational_calendar
                WHERE DATE(FROM_UNIXTIME(opcal_id * 100)) = CURDATE()
                LIMIT 1
            `;
            const [result] = await dbHots.promise().query(query);
            res.status(200).json({ success: true, data: result[0] });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getTriggers: async (req, res) => {
        const { service_id } = req.params;
        try {
            const [result] = await dbHots.promise().query(`SELECT * FROM m_service_triggers WHERE service_id = ?`, [service_id]);
            const triggers = result.map(t => ({
                ...t,
                trigger_config: typeof t.trigger_config === 'string' ? JSON.parse(t.trigger_config) : t.trigger_config
            }));
            res.status(200).json({ success: true, data: triggers });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    saveTriggers: async (req, res) => {
        const { service_id } = req.params;
        const { triggers } = req.body; // Array of trigger objects
        try {
            // Delete existing
            await dbHots.promise().query(`DELETE FROM m_service_triggers WHERE service_id = ?`, [service_id]);
            // Insert new
            if (triggers && triggers.length > 0) {
                for (const t of triggers) {
                    await dbHots.promise().query(`
                        INSERT INTO m_service_triggers (service_id, trigger_name, trigger_config, active, created_at, updated_at)
                        VALUES (?, ?, ?, ?, NOW(), NOW())
                    `, [service_id, t.trigger_name, JSON.stringify(t.trigger_config), t.active]);
                }
            }
            res.status(200).json({ success: true, message: "Triggers saved successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getSchemaInfo: async (req, res) => {
        try {
            const [tables] = await dbHots.promise().query(`SHOW TABLES`);
            res.status(200).json({ success: true, data: tables });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    validateTriggerConfig: async (req, res) => {
        const { config } = req.body;
        // Mock validation for now
        res.status(200).json({ success: true, valid: true });
    },

    getcompletionstatus: (req, res) => {
        dbHots.execute(`SELECT * FROM m_service_status`, (err1, results1) => {
            if (err1) return res.status(500).send({ success: false, message: err1 });
            res.status(200).send({ success: true, data: results1 });
        });
    },

    getmenu: (req, res) => {
        let user_id = req.dataToken.user_id;
        dbHots.execute(`SELECT role_id FROM user WHERE user_id = ? AND active = 1 LIMIT 1`, [user_id], (err1, res1) => {
            if (err1 || !res1.length) return res.status(500).send({ success: false, message: "Role error" });
            const role_id = res1[0].role_id;
            let query = `SELECT * FROM menu`;
            if (role_id !== 4) query += ` WHERE role_id = ${role_id} AND active = 1`;
            dbHots.execute(query, (err2, res2) => {
                if (err2) return res.status(500).send({ success: false, message: err2 });
                res.status(200).send({ success: true, data: res2 });
            });
        });
    },

    getDataDiff: async (req, res) => {
        try {
            const po_number = req.query.po_number || req.params.id;
            if (!po_number) return res.status(400).json({ success: false, message: 'PO Number is required' });
            const query = `
                SELECT tso.so_id, DATE_FORMAT(tso.so_date, '%d/%m/%Y') as so_date, tso.po_number,
                    DATE_FORMAT(tso.po_date, '%d/%m/%Y') as po_date, tso.client_id, mc.company_name as client_name,
                    tso.ship_to_id, mc2.company_name as ship_to_name, DATE_FORMAT(tso.delv_date, '%d/%m/%Y') as delv_date,
                    tso.week_delv, tso.year_delv, tso.completion_note, tso.trade_promo, tso.final_dest,
                    tso.incoterm_id, mi.incoterm_name as incoterm_desc, tso.factory_id, mf.factory_name
                FROM iod.trs_sales_order tso
                LEFT JOIN iod.mst_company mc ON tso.client_id = mc.company_id
                LEFT JOIN iod.mst_company mc2 ON tso.ship_to_id = mc2.company_id
                LEFT JOIN iod.mst_incoterm mi ON tso.incoterm_id = mi.id 
                LEFT JOIN iod.mst_factory mf ON tso.factory_id = mf.factory_id
                WHERE tso.po_number = ? ORDER BY tso.so_id DESC LIMIT 1
            `;
            const [results] = await dbHots.promise().query(query, [po_number]);
            if (!results || results.length === 0) return res.json({ success: true, data: [], message: "No SO found" });
            const so = results[0];
            const data = [
                { key: "SO Date", field: "so_date", value: so.so_date, editable: false },
                { key: "PO Number", field: "po_number", value: so.po_number || '', editable: false },
                { key: "PO Date", field: "po_date", value: so.po_date || '', editable: true },
                { key: "Client", field: "client_name", value: so.client_name || '', editable: false },
                { key: "Ship To", field: "ship_to_name", value: so.ship_to_name || '', editable: false },
                { key: "Delivery Date", field: "delv_date", value: so.delv_date || '', editable: true },
                { key: "Week Delivery", field: "week_delv", value: String(so.week_delv || ''), editable: true },
                { key: "Completion Note", field: "completion_note", value: so.completion_note || '', editable: true },
                { key: "Trade Promo", field: "trade_promo", value: so.trade_promo || '', editable: true },
                { key: "Final Destination", field: "final_dest", value: so.final_dest || '', editable: true },
                { key: "Incoterm", field: "incoterm_desc", value: so.incoterm_desc || '', editable: false },
                { key: "Factory", field: "factory_name", value: so.factory_name || '', editable: false }
            ];
            return res.json({ success: true, data: data, meta: { so_id: so.so_id, client_id: so.client_id } });
        } catch (e) {
            return res.status(500).json({ success: false, message: e.message });
        }
    }
};
