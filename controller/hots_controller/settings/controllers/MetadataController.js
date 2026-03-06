const { dbHots } = require("../../../../config/db");
const resourceEngine = require('../../../../core/resource-engine');
const { RESOURCE_CATEGORIES } = require('../../../../script/Utility/hotsConstants');

let yellowTerminal = "\x1b[33m";

/**
 * MetadataController
 * Handles Plants, Factories, Sample Categories, DeliverTo, and Superior mapping
 */
module.exports = {
    getSRFPlant: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const queryGetData = `SELECT * FROM m_plant WHERE category != 'NICI/FS'`;

        dbHots.execute(queryGetData, (err1, results1) => {
            if (err1) return res.status(500).send({ success: false, message: err1 });
            res.status(200).send({ success: true, message: "getSRFPlant Status SUCCESS", data: results1 });
        });
    },

    getFactories: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        try {
            const [result] = await dbHots.promise().query(`SELECT factory_id, factory_name FROM iod.mst_factory ORDER BY factory_name`);
            res.status(200).json({ success: true, message: "Get factories SUCCESS", factories: result });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getSRFSampleCategory: async (req, res) => {
        const date = new Date();
        const timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        try {
            const resources = await resourceEngine.getResourcesByCategory(RESOURCE_CATEGORIES.SAMPLE_CATEGORY);
            const results = resources
                .map(r => ({
                    samplecat_id: r.value,
                    samplecat_name: r.label,
                    samplecat_shortname: r.attributes?.shortname || r.resource_key,
                    bom_type: r.attributes?.bom_type || "0", // 👈 Added for filtering
                    active: r.is_active ? 1 : 0
                }));
            res.status(200).send({ success: true, message: "GET getSRFSampleCategory SUCCESS", data: results });
        } catch (err) {
            res.status(500).send({ success: false, message: err.message || err });
        }
    },

    getSRFDeliverTo: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        const queryGetData = `SELECT * FROM iod.v_hots_linked_dist vhld WHERE vhld.user_id = ${user_id} OR vhld.user_id = 0`;

        dbHots.execute(queryGetData, (err1, results1) => {
            if (err1) return res.status(500).send({ success: false, message: err1 });
            res.status(200).send({ success: true, message: "GET getSRFDeliverTo SUCCESS", data: results1 });
        });
    },

    getsuperior: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        const queryGetSuperior = `
            SELECT u.superior_id, CONCAT(us.firstname, " ", us.lastname) AS manager,
                   u.final_superior_id, CONCAT(uf.firstname, " ", uf.lastname) AS bod
            FROM user u
            LEFT JOIN user us ON us.user_id = u.superior_id
            LEFT JOIN user uf ON uf.user_id = u.final_superior_id
            WHERE u.user_id = ?
        `;
        dbHots.execute(queryGetSuperior, [user_id], (err1, results1) => {
            if (err1) return res.status(500).send({ success: false, message: err1 });
            res.status(200).send({ success: true, message: "GET Superior SUCCESS", data: results1 });
        });
    }
};
