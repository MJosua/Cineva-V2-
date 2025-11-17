const engineLoader = require("./engine-loader");
const dbHots = require("../config/db")

class WorkflowEngine {

    constructor() {
        this.resolvers = {
            getImmediateSuperior: this.getImmediateSuperior,
            getFinalSuperior: this.getFinalSuperior,
            getTeamLeader: this.getTeamLeader
        };
    }

    /**
     * Get workflow config from JSON
     */
    getWorkflowConfig(serviceName) {
        const moduleConfig = engineLoader.getServiceConfig(serviceName);
        return moduleConfig ? moduleConfig.workflow : null;
    }

    /**
     * Resolve approvers for each level
     */
    async resolveApprovers(user_id, serviceName) {
        const workflow = this.getWorkflowConfig(serviceName);
        if (!workflow || !workflow.levels) return [];

        const result = [];

        for (const lvl of workflow.levels) {
            const resolverFunction = this.resolvers[lvl.resolver];

            if (typeof resolverFunction !== "function") {
                console.error("Unknown resolver:", lvl.resolver);
                continue;
            }

            const approverList = await resolverFunction(user_id, serviceName);

            result.push({
                level: lvl.level,
                approvers: approverList
            });
        }

        return result;
    }

    /**
     * Insert approval rows into DB
     */
    async insertApprovalRows(ticketId, workflowRows) {
        let insertRows = [];

        workflowRows.forEach(wf => {
            wf.approvers.forEach(appr => {
                insertRows.push([ticketId, wf.level, appr]);
            });
        });

        if (insertRows.length === 0) return;

        await dbHots.promise().query(
            `INSERT INTO t_approval_event (approval_id, approval_order, approver_id) VALUES ?`,
            [insertRows]
        );
    }

    // -------------------
    // RESOLVER FUNCTIONS
    // -------------------
    async getImmediateSuperior(user_id) {
        const [rows] = await dbHots.promise().query(
            `SELECT superior_id FROM t_employee WHERE user_id = ?`,
            [user_id]
        );
        return rows.length ? [rows[0].superior_id] : [];
    }

    async getFinalSuperior(user_id) {
        const [rows] = await dbHots.promise().query(
            `SELECT final_superior_id FROM t_employee WHERE user_id = ?`,
            [user_id]
        );
        return rows.length ? [rows[0].final_superior_id] : [];
    }

    async getTeamLeader(user_id, service_id) {
        const [rows] = await dbHots.promise().query(
            `SELECT user_id FROM t_team WHERE service_id = ?`,
            [service_id]
        );
        return rows.map(r => r.user_id);
    }
}

module.exports = new WorkflowEngine();
