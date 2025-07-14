const {
    // untuk koneksi ke database hots
    dbHots,
    dbQueryHots,

    //untuk koneksi ke database i2i
    dbConf,
    dbQuery
} = require("../../config/db");

const { uploadFile } = require("../order");
const { hotsMailer } = require('../../config/mailer')


let green = "\x1b[32m"


/*
untuk utilitas pricing structure



*/


module.exports = {


    getSKUNoFilter: async (req, res) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        if (req.dataToken.user_id) {



            let query = ` 	-- get SKU of distributor
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


            dbConf.execute(query,  (err, results) => {

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



}