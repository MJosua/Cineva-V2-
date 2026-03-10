const { dbConf, dbQuery, addSqlLogger } = require("../../config/db");

module.exports = {

    addCartHeader: async (req, res) => {

        let date = new Date();
        let timestamp = "\x1b[35m" + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 
        if (req.dataToken.user_id) {

            let {
                cart_id,
                user_id,
                company_id,
                delv_week,
                delv_week_desc,
                delv_year,
                id_year,
                po_buyer,
                port_shipment,
                ship_to,
                po_url,
            } = req.body;

            let query = ` INSERT INTO m_cart 
                    (cart_id, company_id, delv_week, delv_week_desc, delv_year, id_year, po_buyer, 
                      created_date, port_shipment, ship_to, po_url, created_by )
                     VALUES
                      (?, ?, ?, ?, ?, ?, ?, date_format(now(),'%Y-%m-%d-%T '), ?, ?, ?, ?); 
                  `

            let parameter = [cart_id, company_id, delv_week, delv_week_desc, delv_year, id_year, po_buyer, port_shipment, ship_to, po_url, user_id]

            dbConf.query(query, parameter,
                (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error Push Cart Data", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `push cart header ${user_id}`);
                        addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), 'addCartHeader');
                    }
                }
            );

        } else {
            res.status(401).send({
                success: false,
                message: 'Unautorized!'
            });
        }
    },

    addCartDetail: async (req, res) => {

        let date = new Date();
        let timestamp = "\x1b[35m" + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 


        if (req.dataToken.user_id) {

            // patch: added delv_week
            let {
                cart_id,
                user_id,
                company_id,
                detail_id,
                cont_size,
                cont_qty,
                sku1,
                sku2,
                sku3,
                qty1,
                qty2,
                qty3,
                price1,
                price2,
                price3,
                remarks,
                bulk,
                delv_week,
                delv_year,
                id_year,
                custom
            } = req.body;

            let query = ` INSERT INTO m_cart_dtl
                    (cart_id, company_id, created_by, detail_id, 
                      cont_size, cont_qty, 
                      sku1, sku2, sku3, qty1, qty2, qty3, price1, price2, price3, 
                      remarks, bulk, delv_week, delv_year, id_year,
                      created_date, custom)
                    VALUES
                    (?, ?, ?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                      date_format(now(),'%Y-%m-%d-%T ')),
                      ?
                      ;
                  `;

            let parameter = [
                cart_id, company_id, user_id, detail_id,
                cont_size, cont_qty,
                sku1, sku2, sku3, qty1, qty2, qty3,
                price1, price2, price3, remarks, bulk, delv_week, delv_year, id_year,
                custom
            ]
            dbConf.query(query, parameter,
                (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error Push Cart Data", err);
                    } else {
                        res.status(200).send(results);
                        console.log(timestamp + `push cart detail for ${user_id} success`);
                        addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), `addCartDetail-${detail_id}`);
                    }
                }
            );



        } else {
            res.status(401).send({
                success: false,
                message: 'Unautorized!'
            });
        }
    },

    editCartHeader: async (req, res) => {

        let date = new Date();
        let timestamp = "\x1b[35m" + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

        if (req.dataToken.user_id) {

            let {
                cart_id,
                delv_week,
                delv_week_desc,
                delv_year,
                id_year,
                po_buyer,
                port_shipment,
                ship_to,
                created_date,
                po_url,
                user_id,
                company_id,
            } = req.body;

            // let sqlDelete = await dbQuery(` DELETE FROM m_cart WHERE company_id = ${req.dataToken.company_id} AND created_date = '${created_date}';  DELETE FROM m_cart_dtl WHERE company_id = ${req.dataToken.company_id} AND created_date = '${created_date}';`);

            let query = ` INSERT INTO m_cart 
      (cart_id, company_id, delv_week, delv_week_desc, delv_year, id_year,
      po_buyer, created_date, port_shipment, ship_to, po_url, created_by )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`

            let parameter = [
                cart_id, company_id, delv_week, delv_week_desc, delv_year, id_year,
                po_buyer, created_date, port_shipment, ship_to, po_url, user_id
            ]
            dbConf.query(
                // `         
                //       UPDATE m_cart
                //       SET delv_week = ${delv_week}, 
                //       delv_week_desc = ${rev_delv_week_desc}, 
                //       po_buyer = ${rev_po_buyer}, 
                //       port_shipment = ${port_shipment}, ship_to = ${ship_to},
                //       po_url = ${rev_po_url}
                //       WHERE cart_id = ${cart_id} AND created_date = ${rev_created_date}
                //       ;`
                query, parameter, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error updateCartHeader", err);
                    } else {

                        res.status(200).send(results);
                        console.log(timestamp + "update Cart Header success cart_id:" + cart_id);
                        addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), 'editCartHeader');
                    }
                }
            );

        } else {
            res.status(401).send({
                success: false,
                message: 'Unautorized!'
            });
        }
    },

    editCartDetail: async (req, res) => {

        let date = new Date();
        let timestamp = "\x1b[35m" + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // timestamp + 

        if (req.dataToken.user_id) {

            let {
                cart_id,
                cont_size,
                cont_qty,
                sku1,
                sku2,
                sku3,
                qty1,
                qty2,
                qty3,
                price1,
                price2,
                price3,
                remarks,
                bulk,
                delv_week,
                delv_year,
                id_year,
                created_date,
                user_id,
                company_id,
                detail_id,
            } = req.body;

            let rev_remarks = "'" + remarks + "'";
            let rev_created_date = "'" + created_date + "'";

            // let sqlDelete = await dbQuery(` DELETE FROM m_cart_dtl WHERE company_id = ${req.dataToken.company_id} AND created_date = '${created_date}';`);

            let query = `   INSERT INTO m_cart_dtl
      (cart_id, company_id, created_by, detail_id, 
      cont_size, cont_qty, 
      sku1, sku2, sku3, qty1, qty2, qty3, price1, price2, price3, 
      remarks, bulk, delv_week, delv_year, id_year, 
      created_date)
      VALUES
      (?, ?, ?, ?, 
      ?, ?, 
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?, 
      ?)
      ; `;

            let parameter = [cart_id, company_id, user_id, detail_id,
                cont_size, cont_qty,
                sku1, sku2, sku3, qty1, qty2, qty3,
                price1, price2, price3,
                remarks, bulk, delv_week, delv_year, id_year,
                created_date]

            dbConf.query(
                // `        
                //       UPDATE m_cart_dtl 
                //       SET cont_size = ${cont_size}, cont_qty = ${cont_qty}, 
                //       sku1 = ${sku1}, sku2 = ${sku2},sku3 = ${sku3},
                //       qty1 = ${qty1}, qty2 = ${qty2}, qty3 = ${qty3},
                //       price1 = ${price1}, price2 = ${price2},  price3 = ${price3},
                //       remarks = ${rev_remarks}, bulk = ${bulk}, 
                //       delv_week = ${delv_week}, 
                //       detail_id=${detail_id}  
                //       WHERE cart_id = ${cart_id} AND created_date = ${rev_created_date}
                //       ;`
                query, parameter, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                        console.log(timestamp + "Error updateCartHeader", err);
                    }
                    res.status(200).send(results);
                    console.log(timestamp +
                        `update Cart Detail success for ${cart_id} and ${rev_created_date}`
                    );
                    addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), 'editCartDetail')
                }

            );



        } else {
            res.status(401).send({
                success: false,
                message: 'Unautorized!'
            });
        }

    },

}
