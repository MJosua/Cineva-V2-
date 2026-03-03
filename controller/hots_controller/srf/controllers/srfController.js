const {
    // untuk koneksi ke database hots
    dbHots,
    dbQueryHots,

    //untuk koneksi ke database i2i
    dbConf,
    dbQuery
} = require("../../../../config/db");

const { uploadFile } = require("../../../OnlineOrder/order");
const { hotsMailer } = require('../../../../service/mailer/hots/hots_mailer');
const { ConsoleInfo } = require("../../../../script/Utility/consoleinfo");

// Unified Resource System
const resourceEngine = require("../../../../core/resource-engine");
const { RESOURCE_CATEGORIES } = require("../../../../script/Utility/hotsConstants");


let green = "\x1b[32m"


/*
untuk utilitas pricing structure



*/


module.exports = {


    getRM: async (req, res) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        if (req.dataToken.user_id) {



            let query = ` 	-- get  RM
                              SELECT 
                                distinct UPPER(CONCAT(coalesce(rm_code, ''), " | ", rm_desc)) as product_name_complete
                                from iod.mst_rm
                            `


            dbConf.execute(query, (err, results) => {

                if (err) {

                    res.status(500).send({
                        success: false,
                        message: `INTERNAL SERVER ERROR`
                    });
                    console.log(timestamp, "Error at getRM, message:", err);

                } else {
                    console.log(timestamp, "successfully getRM!");
                    res.status(200).send({
                        success: true,
                        message: "Successfully fetched SKU data",
                        results,
                    });
                }

            })




        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getRM is Unauthorized");
        }


    },

    getSKUNoFilter: async (req, res) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        if (req.dataToken.user_id) {



            let query = ` 	-- get SKU of distributor && RM
                            select
                                distinct UPPER(CONCAT(coalesce(mp.product_code, ''), " | ", coalesce(mp.product_name_no, mp.product_name), " - ", mp.product_sku)) as product_name_complete
                                from
                                map_item_for_dist mi
                            left join mst_company mc on
                                mi.distributor_id = mc.company_id
                            inner join mst_product mp on
                                mi.product_id = mp.product_id
                            and mp.company_id = 100
                            and mp.active = 1
                            left join mst_country c on
                                mc.country_id = c.country_id
                            left join sys_text tc on
                                c.country_name_id = tc.text_id
                            and tc.lang_id = 1
                            left join m_product_link link on
                                mp.product_code = link.product_code
                            and flag = 1
                            left join mst_rm rm on
                                
                            left join mst_brand mb on
                                mp.brand_id = mb.brand_id
                            and mp.company_id = mb.company_id
                            left join mst_product_type mpc on
                                mp.product_type_id = mpc.product_type_id
                            and mp.division_id = mpc.division_id
                            left join mst_flavour mf on
                                mf.flavour_id = mp.flavour_id
                            where
                                now() between mi.creation_date and coalesce(mi.finish_date, '9999-12-31')
                            and mf.company_id = 100
                            and mp.tolling_id not in (1, 6)
                            and coalesce( mi.moq, 0 ) > 0
                            order by
                                mpc.product_type_name
                            `


            dbConf.execute(query, (err, results) => {

                if (err) {

                    res.status(500).send({
                        success: false,
                        message: `INTERNAL SERVER ERROR`
                    });
                    console.log(timestamp, "Error at getSKU, message:", err);

                } else {
                    console.log(timestamp, "successfully getSKU!");
                    res.status(200).send({
                        success: true,
                        message: "Successfully fetched SKU data",
                        results,
                    });
                }

            })




        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "getSKU is Unauthorized");
        }


    },

    getAllSkunRM: async (req, res) => {
        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        if (!req.dataToken.user_id) {
            console.log(timestamp, "getAllProductNames is Unauthorized");
            return res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
        }
        // `       Jadi BOM`
        const queryRM = `
         SELECT DISTINCT
    UPPER(
        CONCAT(
            COALESCE(mb.rm_matcode, ''),
            ' | ',
            COALESCE(mb.rm_desc, ''),
            ' | ',
            COALESCE(mp.product_sku, '')
        )
    ) AS product_name_complete,
    mb.rm_type
        FROM iod.mst_bom mb
        LEFT JOIN iod.mst_product mp
            ON mb.fg_matcode = mp.product_code
        LEFT JOIN iod.mst_bom_type mbt
            ON mbt.id = mb.rm_type;

        `;


        const querySKU = `
            SELECT DISTINCT 
                UPPER(CONCAT(
                    COALESCE(mp.product_code, ''), " | ",
                    COALESCE(mp.product_name_no, mp.product_name), " - ",
                    mp.product_sku
                )) AS product_name_complete,
                0 AS rm_type
            FROM map_item_for_dist mi
            LEFT JOIN mst_company mc ON mi.distributor_id = mc.company_id
            INNER JOIN mst_product mp ON mi.product_id = mp.product_id AND mp.company_id = 100 AND mp.active = 1
            LEFT JOIN mst_country c ON mc.country_id = c.country_id
            LEFT JOIN sys_text tc ON c.country_name_id = tc.text_id AND tc.lang_id = 1
            LEFT JOIN m_product_link link ON mp.product_code = link.product_code AND flag = 1
            -- LEFT JOIN mst_rm rm -- unused, remove to prevent syntax error
            LEFT JOIN mst_brand mb ON mp.brand_id = mb.brand_id AND mp.company_id = mb.company_id
            LEFT JOIN mst_product_type mpc ON mp.product_type_id = mpc.product_type_id AND mp.division_id = mpc.division_id
            LEFT JOIN mst_flavour mf ON mf.flavour_id = mp.flavour_id
            WHERE NOW() BETWEEN mi.creation_date AND COALESCE(mi.finish_date, '9999-12-31')
            AND mf.company_id = 100
            AND mp.tolling_id NOT IN (1, 6)
            AND COALESCE(mi.moq, 0) > 0
            ORDER BY mpc.product_type_name
        `;

        try {
            const [rmResults] = await dbConf.promise().execute(queryRM);
            const [skuResults] = await dbConf.promise().execute(querySKU);

            const combinedResults = [...rmResults, ...skuResults];

            console.log(timestamp, "Successfully fetched RM and SKU data!");
            ConsoleInfo.info("KETARIK COK")
            res.status(200).send({
                success: true,
                message: "Combined RM and SKU results",
                results: combinedResults
            });

        } catch (err) {
            console.log(timestamp, "Error at getAllProductNames, message:", err);
            res.status(500).send({
                success: false,
                message: "INTERNAL SERVER ERROR",
                error: err.message
            });
        }
    },

    getPurpose: async (req, res) => {
        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (!req.dataToken.user_id) {
            console.log(timestamp, "getPurpose is Unauthorized");
            return res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
        }

        try {
            // Fetch from Unified Resource System
            const resources = await resourceEngine.getResourcesByCategory(RESOURCE_CATEGORIES.SRF_PURPOSE);

            // Map unified resource to legacy structure for frontend compatibility
            const results = resources.map(r => ({
                id: r.value,        // resource_key
                purpose: r.label,   // resource_label
                product_category: r.attributes?.product_category || '',
                sub_category: r.attributes?.sub_category || '',
                remarks: r.attributes?.remarks || '',
                active: r.is_active ? 1 : 0
            }));

            console.log(timestamp, "successfully getSRF_Purpose (via ResourceEngine)!");
            res.status(200).send({
                success: true,
                message: "Successfully fetched getSRF_Purpose data",
                results,
            });
        } catch (err) {
            res.status(500).send({
                success: false,
                message: `INTERNAL SERVER ERROR`,
                error: err.message
            });
            console.log(timestamp, "Error at getSRF_Purpose, message:", err);
        }
    },

    getPONumbersrf: async (req, res) => {
        try {
            const today = new Date();
            const deliveryYear = today.getFullYear();
            const company_id = req.params.company_id;
            if (!company_id) {
                return res.status(401).send({
                    success: false,
                    message: "No company ID provided.",
                });
            }

            const query = `
                                       
            select * from v_hots_po_onhand vhpo
            where client_id = ?

            `;

            dbConf.execute(query, [company_id], (err, results) => {
                if (err) {
                    return res.status(500).send({
                        success: false,
                        message: "Error retrieving PO numbers.",
                        error: err.message,
                    });
                }

                if (!results || results.length === 0) {
                    return res.status(404).send({
                        success: false,
                        message: "No PO numbers found with remaining quantity.",
                    });
                }

                res.status(200).send({
                    success: true,
                    data: results,
                });
            });
        } catch (error) {

            res.status(500).send({
                success: false,
                message: "Unexpected server error.",
                error: error.message,
            });
        }
    },

    // ============================================================
    // VIRTUAL DOCUMENT ENDPOINTS
    // ============================================================

    /**
     * GET /srf/document/:documentId/view
     * Render and return HTML for a virtual document
     */
    viewDocument: async (req, res) => {
        const documentEngine = require("../../../../core/document-engine");
        const { documentId } = req.params;
        console.log(`📄 [SRF] Request to VIEW document ${documentId}`);

        try {
            const result = await documentEngine.renderHtml(parseInt(documentId));

            if (!result.ok) {
                console.error(`❌ [SRF] View document failed: ${result.error}`);
                return res.status(404).send(result.error); // Send text error for browser to see
            }

            // Return HTML directly for iframe/embed viewing
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(result.html);
        } catch (error) {
            console.error('❌ [SRF] Error viewing document:', error);
            res.status(500).send(error.message);
        }
    },

    /**
     * GET /srf/document/:documentId/download
     * Generate and return PDF blob for download
     */
    downloadDocument: async (req, res) => {
        const documentEngine = require("../../../../core/document-engine");
        const { documentId } = req.params;
        console.log(`📄 [SRF] Request to DOWNLOAD document ${documentId}`);

        try {
            const result = await documentEngine.generatePdfBlob(parseInt(documentId));

            if (!result.ok) {
                console.error(`❌ [SRF] Download document failed: ${result.error}`);
                return res.status(404).json({ success: false, message: result.error });
            }

            // Send PDF as downloadable file
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
            res.setHeader('Content-Length', result.buffer.length);
            res.send(result.buffer);
        } catch (error) {
            console.error('❌ [SRF] Error downloading document:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * GET /srf/documents/:ticketId
     * List all documents for a ticket
     */
    listDocuments: async (req, res) => {
        const documentEngine = require("../../../../core/document-engine");
        const { ticketId } = req.params;

        try {
            const documents = await documentEngine.listDocuments('ticket', ticketId);

            res.status(200).json({
                success: true,
                data: documents.map(doc => ({
                    id: doc.id,
                    file_name: doc.file_name,
                    template_name: doc.template_name,
                    action_origin: doc.action_origin,
                    generated_at: doc.generated_at,
                    view_url: `/hots_srf/document/${doc.id}/view`,
                    download_url: `/hots_srf/document/${doc.id}/download`
                }))
            });
        } catch (error) {
            console.error('❌ [SRF] Error listing documents:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

}