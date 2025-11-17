const engineLoader = require("./engine-loader");
const hotsMailer = require("../mailer/hots/hots_mailer");
const documentEngine = require("./document-engine"); // for future
const dbHots = require("../config/db");

class TriggerEngine {
    constructor() {
        this.actions = {
            send_email_requester: this.sendEmailRequester,
            send_email_next_approver: this.sendEmailNextApprover,
            update_ticket_status: this.updateTicketStatus,
            generate_document: this.generateDocument,
            generate_document: this.generate_document
        };
    }

    /**
     * Load triggers.json for service
     */
    getTriggers(serviceName) {
        const service = engineLoader.getServiceConfig(serviceName);
        return service ? service.triggers : null;
    }

    /**
     * Execute all trigger actions for event
     */
    async run(serviceName, eventName, ticketId, context = {}) {
        const triggers = this.getTriggers(serviceName);
        if (!triggers) return;

        const actions = triggers[eventName];
        if (!actions || actions.length === 0) return;

        for (const actionName of actions) {
            const actionFn = this.actions[actionName];

            if (typeof actionFn === "function") {
                await actionFn(ticketId, context);
            } else {
                console.error("Unknown trigger action:", actionName);
            }
        }
    }

    async generate_document(ticketId, context) {
        const serviceName = context.serviceName;
        const data = context.data;

        const filePath = await documentEngine.generateDocument(
            serviceName,
            ticketId,
            data
        );

        console.log("📄 Document generated:", filePath);
    }


    // --------------------
    // ACTION DEFINITIONS
    // --------------------

    async sendEmailRequester(ticketId, context) {
        const { user_id, subject } = context;

        // Example email
        await hotsMailer(
            context.email,
            "Your ticket has been submitted",
            `<p>Your ticket <b>${ticketId}</b> has been created.</p>`
        );
    }

    async sendEmailNextApprover(ticketId, context) {
        const nextApproverEmail = context.nextApproverEmail;

        await hotsMailer(
            nextApproverEmail,
            "Ticket awaiting your approval",
            `<p>Please review ticket <b>${ticketId}</b></p>`
        );
    }

    async updateTicketStatus(ticketId, context) {
        await dbHots.promise().query(
            `UPDATE t_ticket SET status_id = ? WHERE ticket_id = ?`,
            [context.newStatus, ticketId]
        );
    }

    async generateDocument(ticketId, context) {
        if (!context.data) return;

        await documentEngine.generate(ticketId, context.data);
    }
}

module.exports = new TriggerEngine();
