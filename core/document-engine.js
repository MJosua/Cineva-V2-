const fs = require("fs");
const path = require("path");
const engineLoader = require("./engine-loader");
const pdf = require("html-pdf-node"); // Must be installed: npm i html-pdf-node

class DocumentEngine {

    getTemplate(serviceName) {
        const service = engineLoader.getServiceConfig(serviceName);
        return service && service.document_template ? service.document_template : null;
    }

    injectVariables(template, data) {
        let output = template;

        for (const key in data) {
            const token = `{{${key}}}`;
            output = output.replace(new RegExp(token, "g"), data[key]);
        }

        return output;
    }

    async generatePDF(html, filePath) {
        const pdfBuffer = await pdf.generatePdf(
            { content: html },
            { format: "A4" }
        );

        fs.writeFileSync(filePath, pdfBuffer);
        return filePath;
    }

    async generateDocument(serviceName, ticketId, data) {
        // 1. Load template
        const template = this.getTemplate(serviceName);
        if (!template) throw new Error("Template not found");

        // 2. Inject variables
        const html = this.injectVariables(template, data);

        // 3. File path
        const dir = path.join("public", "hots", "generateddocuments");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const filePath = path.join(dir, `${ticketId}.pdf`);

        // 4. Generate PDF
        await this.generatePDF(html, filePath);

        return filePath;
    }
}

module.exports = new DocumentEngine();
