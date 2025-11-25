/**
 * core/workflow-engine.js
 * HOTS + EngineService Hybrid Workflow Engine v4
 *
 * Supports:
 *  - JSON workflow from m_engine_modules.workflow_json
 *  - DB workflow from m_service_workflow + m_service_workflow_resolver_params
 *
 * Fully compatible with old HOTS approval logic
 */

class WorkflowEngine {
    constructor() {
        this.dbQuery = null;
        this.engineLoader = null;
        this.formLoader = null;

        this.resolvers = {};  // dynamic resolver registry
    }

    // ============================================================
    // INIT
    // ============================================================
    init({ dbQuery, engineLoader, formLoader }) {
        this.dbQuery = dbQuery;
        this.engineLoader = engineLoader;
        this.formLoader = formLoader;

        // register default HOTS resolvers
        this.registerResolver("direct_user", this._resolver_directUser.bind(this));
        this.registerResolver("direct_superior", this._resolver_directSuperior.bind(this));
        this.registerResolver("team_leader", this._resolver_teamLeader.bind(this));

        console.log("🔥 WorkflowEngine initialized");
    }

    registerResolver(name, fn) {
        this.resolvers[name] = fn;
    }

    // ============================================================
    // BUILT-IN RESOLVERS
    // ============================================================
    async _resolver_directUser(context, resolverParams) {
        if (!resolverParams?.user_id) return [];
        return [{ type: "user", id: resolverParams.user_id }];
    }

    async _resolver_directSuperior(context) {
        const uid = context.actor?.user_id;
        if (!uid) return [];

        try {
            const rows = await this.dbQuery(`
                SELECT manager_id FROM m_employee WHERE user_id=? LIMIT 1
            `, [uid]);

            return rows?.[0]?.manager_id
                ? [{ type: "user", id: rows[0].manager_id }]
                : [];
        } catch {
            return [];
        }
    }

    async _resolver_teamLeader(context) {
        const uid = context.actor?.user_id;
        if (!uid) return [];

        try {
            const rows = await this.dbQuery(`
                SELECT team_leader_id FROM m_team_member WHERE user_id=? LIMIT 1
            `, [uid]);

            return rows?.[0]?.team_leader_id
                ? [{ type: "user", id: rows[0].team_leader_id }]
                : [];
        } catch {
            return [];
        }
    }

    // ============================================================
    // LOAD WORKFLOW (JSON OR DB)
    // ============================================================
    async loadWorkflow(service_id, module) {

        // 1️⃣ prefer JSON workflow from m_engine_modules.workflow_json
        if (module?.workflow_json) {
            return {
                mode: "json",
                steps: module.workflow_json.steps || module.workflow_json.levels || []
            };
        }

        // 2️⃣ fallback to DB workflow
        const rows = await this.dbQuery(`
            SELECT * FROM m_service_workflow
            WHERE service_id=? AND is_active=1
            ORDER BY level ASC
        `, [service_id]);

        const steps = [];

        for (const row of rows) {
            const resolverParams = await this.dbQuery(`
                SELECT * FROM m_service_workflow_resolver_params
                WHERE workflow_id=?
            `, [row.workflow_id]);

            steps.push({
                level: row.level,
                resolver: row.resolver,
                approver_role: row.approver_role,
                approver_user: row.approver_user,
                resolverParams
            });
        }

        return { mode: "db", steps };
    }

    // ============================================================
    // RESOLVE APPROVERS FOR ONE WORKFLOW
    // ============================================================
    async resolveApprovers(workflow, context) {
        const steps = workflow.steps;
        const output = [];

        for (const step of steps) {
            let ids = [];

            // DB approver direct user
            if (step.approver_user) {
                ids.push(step.approver_user);
            }

            // DB approver by role
            if (step.approver_role) {
                const rows = await this.dbQuery(`
                    SELECT user_id FROM m_user_role WHERE role=?
                `, [step.approver_role]);

                ids.push(...rows.map(r => r.user_id));
            }

            // DB resolver
            if (step.resolver) {
                const fn = this.resolvers[step.resolver];
                if (fn) {
                    const r = await fn(context, step.resolverParams);
                    ids.push(...r.map(x => x.id));
                }
            }

            // JSON workflow (Direct array or dynamic)
            if (step.approver_ids) {
                ids.push(...step.approver_ids);
            }

            output.push({
                level: step.level,
                approver_ids: [...new Set(ids)]
            });
        }

        return output;
    }

    // ============================================================
    // APPROVE LOGIC (FULL HOTS STYLE)
    // ============================================================
    async approve({ ticket_id, approver_id, note, module, dbHots }) {
        const p = dbHots.promise();

        const [[header]] = await p.query(`
            SELECT * FROM t_ticket_engine WHERE ticket_id=? LIMIT 1
        `, [ticket_id]);

        if (!header) return { ok: false, error: "Ticket not found" };

        const currentLevel = header.workflow_level;

        // mark this row approved
        await p.query(`
            UPDATE t_ticket_event
            SET status='approved', note=?, updated_at=NOW()
            WHERE ticket_id=? AND actor_id=? AND status='pending'
        `, [note || null, ticket_id, approver_id]);

        // check if any pending approvals left in this level
        const [pending] = await p.query(`
            SELECT * FROM t_ticket_event
            WHERE ticket_id=? AND approval_order=? AND status='pending'
        `, [ticket_id, currentLevel]);

        const allLevelApproved = pending.length === 0;

        if (!allLevelApproved) {
            return {
                ok: true,
                message: "Approval saved. Waiting for other approvers..."
            };
        }

        // NEXT LEVEL
        const workflow = await this.loadWorkflow(header.service_id, module);
        const approverSteps = await this.resolveApprovers(workflow, {
            actor: { user_id: approver_id },
            ticket: { ticket_id }
        });

        const nextLevel = currentLevel + 1;
        const maxLevel = Math.max(...approverSteps.map(s => s.level));

        if (nextLevel > maxLevel) {
            // ticket complete
            await p.query(`
                UPDATE t_ticket_engine
                SET status='approved', updated_at=NOW()
                WHERE ticket_id=?
            `, [ticket_id]);

            return { ok: true, final: true };
        }

        const nextStep = approverSteps.find(s => s.level === nextLevel);

        // insert next approvers
        for (let i = 0; i < nextStep.approver_ids.length; i++) {
            const uid = nextStep.approver_ids[i];
            await p.query(`
                INSERT INTO t_ticket_event (ticket_id,event_type,approval_order,actor_id,status,created_at)
                VALUES (?, 'approve', ?, ?, ?, NOW())
            `, [
                ticket_id,
                nextLevel,
                uid,
                i === 0 ? "pending" : "waiting"
            ]);
        }

        await p.query(`
            UPDATE t_ticket_engine SET workflow_level=? WHERE ticket_id=?
        `, [nextLevel, ticket_id]);

        return { ok: true, next_level: nextLevel };
    }

    // ============================================================
    // REJECT (FULL HOTS STYLE)
    // ============================================================
    async reject({ ticket_id, approver_id, note, dbHots }) {
        const p = dbHots.promise();

        await p.query(`
            UPDATE t_ticket_event
            SET status='rejected', note=?, updated_at=NOW()
            WHERE ticket_id=? AND actor_id=? AND status='pending'
        `, [note || null, ticket_id, approver_id]);

        await p.query(`
            UPDATE t_ticket_engine
            SET status='rejected', updated_at=NOW()
            WHERE ticket_id=?
        `, [ticket_id]);

        return { ok: true, message: "Ticket rejected" };
    }
}

module.exports = new WorkflowEngine();
