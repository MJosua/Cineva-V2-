const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbHots } = require("../config/db");

async function generateChallengeData() {
    const connection = await dbHots.promise().getConnection();
    try {
        console.log("🚀 Starting data generation for Challenge (Jan-Mar) with specific IDs...");
        await connection.beginTransaction();

        const userId = 1004; // As per existing data
        const currentUserId = 1; // The user's ID
        const teamId = 2; // IT Team
        const companyId = 1;
        const serviceId = 23; // IT Project

        // 0. Ensure user 1 is in IT Team
        const [teamCheck] = await connection.query(
            "SELECT * FROM m_team_member WHERE user_id = ? AND team_id = ?",
            [currentUserId, teamId]
        );
        if (teamCheck.length === 0) {
            console.log(`➕ Adding User ${currentUserId} to IT Team (Team ${teamId})...`);
            await connection.query(
                "INSERT INTO m_team_member (team_id, user_id, team_leader) VALUES (?, ?, ?)",
                [teamId, currentUserId, 0]
            );
        }

        const projectList = [
            // Month 01 (January)
            { id: '262310040001', month: '01', day: '15', category: 'HOTS', title: 'HOTS Platform Upgrade', priority: 'high', desc: 'Upgrading core modules to node v18.' },
            { id: '262310040002', month: '01', day: '18', category: 'E-Order', title: 'fix error e-order', priority: 'medium', desc: 'Resolving checkout and mailer issues.' },
            { id: '262310040003', month: '01', day: '20', category: 'Event', title: 'Event Planning', priority: 'low', desc: 'Annual kickoff townhall logistics.' },
            { id: '262310040004', month: '01', day: '25', category: 'E-Order', title: 'add type container truck di e-order', priority: 'medium', desc: 'Added new vehicle type definitions.' },
            { id: '262310040005', month: '01', day: '28', category: 'E-Order', title: 'add tolling rule in e-order', priority: 'high', desc: 'Integrated toll road pricing logic.' },
            { id: '262310040006', month: '01', day: '30', category: 'E-Order', title: 'fix mailer e-order', priority: 'medium', desc: 'Fixed SMTP timeout for notifications.' },

            // Month 02 (February)
            { id: '262310040007', month: '02', day: '05', category: 'Event', title: 'event africa design', priority: 'medium', desc: 'Marketing assets for Africa exhibition.' },
            { id: '262310040008', month: '02', day: '10', category: 'Event', title: 'event maldives design', priority: 'medium', desc: 'Theme and stage design for Maldives summit.' },
            { id: '262310040009', month: '02', day: '15', category: 'HOTS', title: 'fix meeting book', priority: 'high', desc: 'Resolved room booking double-reservation bug.' },
            { id: '262310040010', month: '02', day: '18', category: 'HOTS', title: 'fix hots project management', priority: 'high', desc: 'Fixed dashboard aggregate data logic.' },
            { id: '262310040011', month: '02', day: '20', category: 'HOTS', title: 'fix hots assignment', priority: 'medium', desc: 'Corrected team visibility in assignments.' },
            { id: '262310040012', month: '02', day: '25', category: 'HOTS', title: 'enchance SRF form', priority: 'medium', desc: 'Added dynamic validation to SRF fields.' },

            // Month 03 (March)
            { id: '262310040013', month: '03', day: '02', category: 'HOTS', title: 'ennchance SRF assignment', priority: 'medium', desc: 'Simplified multi-assignee selection.' },
            { id: '262310040014', month: '03', day: '05', category: 'HOTS', title: 'create SRF Reporting dashboard', priority: 'high', desc: 'New visualization for SRF throughput.' },
            { id: '262310040015', month: '03', day: '08', category: 'HOTS', title: 'create data change form', priority: 'medium', desc: 'New standardized form for master data changes.' },
            { id: '262310040016', month: '03', day: '10', category: 'HOTS', title: 'create data change report', priority: 'low', desc: 'Audit log visualization for master data.' },
            { id: '262310040017', month: '03', day: '12', category: 'HOTS', title: 'create data change logic', priority: 'high', desc: 'Backend validation for master data integrity.' },
            { id: '262310040018', month: '03', day: '14', category: 'HOTS', title: 'Monthly Performance Review', priority: 'high', desc: 'Compiling Q1 infrastructure metrics.' },
        ];

        for (const project of projectList) {
            const ticketId = project.id;
            const dateStr = `2026-${project.month}-${project.day}`;
            const creationDate = `${dateStr} 09:00:00`;
            const finishDate = `${dateStr} 17:00:00`;

            console.log(`📝 Processing ${ticketId}: ${project.title}`);

            // Clean up existing to allow re-run
            await connection.query("DELETE FROM t_ticket_work_data_report WHERE ticket_id = ?", [ticketId]);
            await connection.query("DELETE FROM t_ticket_work_data_env WHERE ticket_id = ?", [ticketId]);
            await connection.query("DELETE FROM t_ticket_assignment WHERE ticket_id = ?", [ticketId]);
            await connection.query("DELETE FROM t_ticket_work_data WHERE ticket_id = ?", [ticketId]);
            await connection.query("DELETE FROM t_ticket_detail WHERE ticket_id = ?", [ticketId]);
            await connection.query("DELETE FROM t_ticket WHERE ticket_id = ?", [ticketId]);

            // 1. Insert t_ticket
            await connection.query(`
                INSERT INTO t_ticket (
                    ticket_id, service_id, status_id, creation_date, last_update, 
                    title, created_by, company_id, submitted_at, service_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [ticketId, serviceId, 1, creationDate, finishDate, project.title, userId, companyId, creationDate, project.category]);

            // 2. Insert t_ticket_detail (Corrected columns: lbl_col, cstm_col)
            const detailFields = [
                ['project_title', project.title],
                ['project_description', project.desc],
                ['project_category', project.category],
                ['priority', project.priority],
                ['target_date', dateStr]
            ];

            for (let i = 0; i < detailFields.length; i++) {
                await connection.query(`
                    INSERT INTO t_ticket_detail (ticket_id, lbl_col, cstm_col, sequence)
                    VALUES (?, ?, ?, ?)
                `, [ticketId, detailFields[i][0], detailFields[i][1], i + 1]);
            }

            // 3. Insert t_ticket_work_data (Corrected columns: field_name, field_value)
            const entityId = `PRJ_${Date.now()}_${project.month}${project.day}`;
            await connection.query(`
                INSERT INTO t_ticket_work_data (
                    ticket_id, service_id, data_type, entity_id, field_name, field_value, 
                    created_by, created_at, root_ticket_id, is_latest, company_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [ticketId, serviceId, 'project_info', entityId, 'description', project.desc, userId, creationDate, ticketId, 1, companyId]);

            // 4. Insert t_ticket_assignment (Assigned to Team 2)
            const [assignRes] = await connection.query(`
                INSERT INTO t_ticket_assignment (
                    ticket_id, assigned_type, assigned_id, assigned_by, assignment_status, notes, assigned_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [ticketId, 'team', teamId, userId, 'completed', `Handled by IT Team: ${project.title}`, creationDate]);
            const assignmentId = assignRes.insertId;

            // 5. Insert t_ticket_work_data_env (Environment/Hierarchical Task)
            const taskId = `TASK_${Date.now()}_${project.month}${project.day}`;
            await connection.query(`
                INSERT INTO t_ticket_work_data_env (
                    entity_id, ticket_id, root_ticket_id, depth, sort_order, status, report, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [taskId, ticketId, ticketId, 1, 1, 'done', `Completed implementation for ${project.title}`, creationDate]);

            // 6. Insert t_ticket_work_data_report (Task Report)
            await connection.query(`
                INSERT INTO t_ticket_work_data_report (
                    entity_id, ticket_id, assignment_id, content, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [taskId, ticketId, assignmentId, `Final report for ${project.title}: All requirements met and deployed.`, userId, finishDate]);

        }

        await connection.commit();
        console.log("✅ Data generation complete! 18 projects created with full work data.");
    } catch (error) {
        await connection.rollback();
        console.error("❌ Data generation failed:", error);
    } finally {
        connection.release();
        process.exit();
    }
}

generateChallengeData();
