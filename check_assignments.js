const { dbHots } = require('./config/db');

async function checkAssignments() {
    try {
        console.log('🔍 Checking assignments...');
        const [rows] = await dbHots.promise().query(
            "SELECT id, ticket_id, assigned_id, assignment_status, unassigned_at FROM t_ticket_assignment"
        );
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAssignments();
