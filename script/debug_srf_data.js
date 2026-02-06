const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbQueryHots } = require('../config/db');

async function debugTicket() {
    const ticketId = '260611170002';
    try {
        const details = await dbQueryHots("SELECT * FROM t_ticket_detail WHERE ticket_id = ?", [ticketId]);
        console.log("--- TICKET DETAILS ---");
        console.table(details.map(d => ({ id: d.id, cstm_col: d.cstm_col, lbl: d.lbl_col, val: d.value })));

        const workData = await dbQueryHots("SELECT * FROM t_ticket_work_data WHERE ticket_id = ?", [ticketId]);
        console.log("--- WORK DATA ---");
        console.table(workData.map(w => ({ field: w.field_name, val: w.field_value })));

        const events = await dbQueryHots("SELECT * FROM t_ticket_event WHERE ticket_id = ? ORDER BY event_id ASC", [ticketId]);
        console.log("--- TICKET EVENTS ---");
        console.table(events.map(e => ({ id: e.event_id, event: e.event_name, actor: e.created_by_name, step: e.workflow_step_id })));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

debugTicket();
