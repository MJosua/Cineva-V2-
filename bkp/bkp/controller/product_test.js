
const { dbIndomieku, dbQueryIndomieku } = require("../config/db"); 

let gray = "\x1b[90m"

module.exports = { 

    product_test: async (req, res) => {

        try {
            
            if (req.dataToken.id) {

                let date = new Date();
                let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

                dbIndomieku.query(
                    `
                    SELECT *
                    FROM product;
                    `                    ,
                    (err, results) => {
                        if (err) {
                            res.status(500).send(err);
                            console.log(timestamp + `get product catalog for ${req.dataToken.user_id} error! ${err}`);
                        }

                        res.status(200).send(results);
                        console.log(timestamp + `get product catalog for ${req.dataToken.user_id} success`);

                    })

            } else {

                res.status(401).send({
                    success: false,
                    message: 'unauthorized'
                })

            }
        } catch (error) {

            if (error) {
                res.status(500).send(error);
                console.log(timestamp + `get product order error! ${error}`);
            }
        }



    }
};


/*

OLD QUERY FOR GET PRODUCT
            `
            SELECT DISTINCT CONCAT(COALESCE(mp.product_name_no, mp.product_name), " - ",mp.product_sku ) product_name_complete ,tc.txt country_name,mpc.product_type_name cat_name , mc.company_name, mp.product_code, UPPER(mp.product_sku) product_sku, UPPER(COALESCE(mp.product_name_no, mp.product_name)) product_name, mp.ctn_height, mp.ctn_length, mp.ctn_width, mp.ctn_thick, mp.cont20, mp.cont40, mp.cont40hc,COALESCE(mi.moq, 0) moq ,
            (SELECT rate_unit FROM trs_so_detail WHERE client_id = mi.distributor_id AND company_id = mp.company_id AND sku_id = mp.product_code ORDER BY so_id DESC, version DESC LIMIT 1) rate_unit, 
            (SELECT value FROM trs_so_detail WHERE client_id = mi.distributor_id AND company_id = mp.company_id AND sku_id = mp.product_code ORDER BY so_id DESC, version DESC LIMIT 1) price, 
            link.img, link.order , mb.brand_name, mp.net_weight, mp.per_carton 
            FROM map_item_for_dist mi 
            LEFT JOIN mst_company mc ON mi.distributor_id = mc.company_id 
            LEFT JOIN mst_product mp ON mi.product_id = mp.product_id AND mp.company_id = 100
            LEFT JOIN mst_country c ON mc.country_id = c.country_id 
            LEFT JOIN sys_text tc ON c.country_name_id = tc.text_id AND tc.lang_id = 1
            LEFT JOIN m_product_link link ON mp.product_code = link.product_code AND flag = 1
            LEFT JOIN mst_brand mb ON mp.brand_id = mb.brand_id AND mp.company_id = mb.company_id 
            LEFT JOIN mst_product_type mpc ON mp.product_type_id = mpc.product_type_id 
            WHERE now() BETWEEN mi.creation_date AND COALESCE(mi.finish_date, '9999-12-31') AND mi.distributor_id = ${company_id};
            `
*/







