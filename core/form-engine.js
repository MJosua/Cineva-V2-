const engineLoader = require("./engine-loader");

class FormEngine {
    constructor() {}

    /**
     * Get the form definition for a specific service
     */
    getFormConfig(serviceName) {
        const service = engineLoader.getServiceConfig(serviceName);
        if (!service) return null;

        const formConfig = service.form;
        return formConfig ? formConfig : null;
    }

    /**
     * Validate input based on form.json rules (required, type)
     */
    validateFormData(serviceName, data) {
        const form = this.getFormConfig(serviceName);
        if (!form) return { valid: false, errors: ["Form not found"] };

        const errors = [];

        form.fields.forEach(field => {
            const value = data[field.key];

            if (field.required && (!value || value === "")) {
                errors.push(`${field.label} is required`);
            }

            // Example: type validation (text, select, etc.)
            if (field.type === "number" && isNaN(value)) {
                errors.push(`${field.label} must be a number`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Convert form JSON → EAV structure for DB insert
     */
    convertToEAV(serviceName, data, ticket_id) {
        const form = this.getFormConfig(serviceName);
        if (!form) return [];

        const eavArray = [];

        form.fields.forEach(field => {
            const value = data[field.key] ?? "";

            eavArray.push({
                ticket_id,
                cstm_col: field.cstm_col,
                lbl_col: field.label,
                value: value
            });
        });

        return eavArray;
    }

    /**
     * Convert EAV → JSON result (for editing or viewing)
     */
    convertFromEAV(serviceName, eavRows) {
        const form = this.getFormConfig(serviceName);
        if (!form) return {};

        const result = {};

        form.fields.forEach(field => {
            const row = eavRows.find(r => r.cstm_col === field.cstm_col);
            result[field.key] = row ? row.value : "";
        });

        return result;
    }
}

module.exports = new FormEngine();
