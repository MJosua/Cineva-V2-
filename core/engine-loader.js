const fs = require("fs");
const path = require("path");

class EngineLoader {
    constructor() {
        this.modules = {};
        this.basePath = path.join(__dirname, "..", "modules");
    }

    init() {
        const moduleFolders = fs.readdirSync(this.basePath);

        moduleFolders.forEach((folder) => {
            const modulePath = path.join(this.basePath, folder);

            if (fs.lstatSync(modulePath).isDirectory()) {
                this.modules[folder] = this.loadModule(folder);
            }
        });
    }

    loadModule(moduleName) {
        const folder = path.join(this.basePath, moduleName);
        const config = {};

        const files = fs.readdirSync(folder);

        files.forEach((file) => {
            const fullPath = path.join(folder, file);

            if (file.endsWith(".json")) {
                const raw = fs.readFileSync(fullPath, "utf-8");

                try {
                    const json = JSON.parse(raw);
                    config[file.replace(".json", "")] = json;
                } catch (err) {
                    console.error(`❌ Failed to parse JSON: ${fullPath}`);
                    console.error("Error:", err.message);
                }
            }

            if (file.endsWith(".html")) {
                config["document_template"] = fs.readFileSync(fullPath, "utf-8");
            }
        });

        return config;
    }

    getServiceConfig(serviceName) {
        return this.modules[serviceName] || null;
    }

    listServices() {
        return Object.keys(this.modules);
    }
}

module.exports = new EngineLoader();
