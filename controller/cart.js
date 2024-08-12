const { json } = require("body-parser");
const { dbConf, dbQuery, addSqlLogger } = require("../config/db");

let magenta = "\x1b[35m"
module.exports = {
  getPoWeek: async (req, res) => {

    let date = new Date();
    let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
    // timestamp + 
    // let { company_id } = req.body

    try {
      if (req.dataToken.user_id) {

        let query = `
        SELECT DISTINCT 
        mo.delv_week, mo.delv_week_desc, mo.cart_id, date_format(mo.created_date,'%Y-%m-%d-%T ') created_date 
        FROM 
        m_cart mo
        JOIN mst_company mco ON mo.company_id = mco.company_id  
        LEFT JOIN map_port_for_dist mpfd ON mo.port_shipment = mpfd.harbour_id 
        AND mo.company_id  = mpfd.distributor_id  
        LEFT JOIN mst_company stp ON stp.company_id = mo.ship_to 
        LEFT JOIN sys_user su ON su.user_id = mo.created_by  
        WHERE mo.company_id = ${req.dataToken.company_id} ;
       `;
        dbConf.query(query, (err, results) => {
          if (err) {
            res.status(500).send(err);
            console.log(timestamp + "Error! at get", err);
          } else {
            res.status(200).send(results);
            console.log(timestamp + `get cart PoWeek at Cart: ${req.dataToken.company_id}`);
            addSqlLogger(req.dataToken.user_id, '-- query data cart', '-- data cart', 'getPoWeek');
          }
        }
        );
      } else {
        res.status(200).send({
          success: false,
          message: "unauthorized",
        });
      }
    } catch (error) {
      console.log(timestamp + error);
      res.status(500).send(error);
    }
  },
  getCartHeader: async (req, res) => {

    let date = new Date();
    let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
    // timestamp + 

    // revision ver 4.4: pattch: added some query
    // revisin 20240508: 1 user hanya bisa melihat draft 1 user itu sendiri bukan per company

    try {
      if (req.dataToken.user_id) {
        dbConf.query(
          `
            SELECT DISTINCT 
            mc.cart_id, mc.ship_to , mco.company_name, mc.delv_week, mc.delv_week_desc, mc.delv_year, mc.id_year,
            mc.po_buyer, mc.final_dest , mc.po_buyer, stp.company_name , 
            mc.po_url, su.firstname  created_by, mcd.cont_size, 
            mcd.cont_qty, mct.container_name, 
            date_format(mc.created_date,'%Y-%m-%d-%T ') created_date,
            mc.port_shipment, mpfd.harbour_id, mc.stuffing_date
            FROM 
                    m_cart mc
                    JOIN mst_company mco ON mc.company_id = mco.company_id  
                    LEFT JOIN map_port_for_dist mpfd ON mc.port_shipment = mpfd.harbour_id 
                    AND mc.company_id  = mpfd.distributor_id  
                    LEFT JOIN mst_company stp ON stp.company_id = mc.ship_to 
                    LEFT JOIN sys_user su ON su.user_id = mc.created_by 
                    LEFT JOIN m_cart_dtl mcd ON mc.cart_id = mcd.cart_id 
                    LEFT JOIN mst_container mct ON mct.container_id = mcd.cont_size 
                    WHERE mc.created_by  = ${req.dataToken.user_id} ;
                        `,
          (err, results) => {
            if (err) {
              res.status(500).send(err);
              console.log(timestamp + "Error!", err);
            } else {
              res.status(200).send(results); 
              console.log(timestamp + `get cart Header success: ${req.dataToken.user_id}`);
              addSqlLogger(req.dataToken.user_id, '-- query data cart', '-- data cart', 'getCartHeader');
            }
          }
        );
      } else {
        res.status(200).send({
          success: false,
          message: "unauthorized",
        });
      }
    } catch (error) {
      console.log(timestamp + error);
      res.status(500).send(error);
    }
  },
  getCartDetail: async (req, res) => {

    let date = new Date();
    let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    // revisin 20240508: 1 user hanya bisa melihat draft 1 user itu sendiri bukan per company

    try {
      if (req.dataToken.user_id) {
        let query = `
        SELECT 
        det.cart_id, det.company_id, mco.company_name, det.created_by, su.firstname,  
        det.detail_id, det.cont_size, mc.container_name, det.cont_qty, 
        det.sku1,COALESCE(mp1.product_name_no, mp1.product_name) product_name_1,
        mpl1.img url_1, det.qty1,det.price1, mp1.product_sku prod_sku1,
        det.sku2,COALESCE(mp2.product_name_no, mp2.product_name) product_name_2,
        mpl2.img url_2, det.qty2,det.price2, mp2.product_sku prod_sku2,
        det.sku3,COALESCE(mp3.product_name_no, mp3.product_name) product_name_3,
        mpl3.img url_3, det.qty3, det.price3, mp3.product_sku prod_sku3,
        det.remarks, det.bulk, det.delv_week, det.delv_year, det.id_year
        FROM 
        m_cart_dtl det
        JOIN mst_company mco ON det.company_id = mco.company_id  
        LEFT JOIN sys_user su ON su.user_id = det.created_by 
        LEFT JOIN mst_container mc ON mc.container_id = det.cont_size
        LEFT JOIN mst_product mp1 ON det.sku1 = mp1.product_code
        LEFT JOIN mst_product mp2 ON det.sku2 = mp2.product_code
        LEFT JOIN mst_product mp3 ON det.sku3 = mp3.product_code
        LEFT JOIN m_product_link mpl1 ON det.sku1 = mpl1.product_code 
        LEFT JOIN m_product_link mpl2 ON det.sku2 = mpl2.product_code 
        LEFT JOIN m_product_link mpl3 ON det.sku3 = mpl3.product_code 
        WHERE det.created_by = ${req.dataToken.user_id} 
        ORDER BY det.delv_week, det.cart_id , det.detail_id ;
        `
        dbConf.query(query, (err, results) => {
          if (err) {
            res.status(500).send(err);
            console.log(timestamp + "Error!", err);
          } else {
            res.status(200).send(results); 
            console.log(timestamp + `get cart Detail: ${req.dataToken.company_id}`);
            addSqlLogger(req.dataToken.user_id, '-- query data cart', '-- data cart', 'getCartDetail');
          }
        });

      } else {
        res.status(200).send({
          success: false,
          message: "unauthorized",
        });
      }
    } catch (error) {
      console.log(timestamp + error);
      res.status(500).send(error);
    }
  },
  delete: async (req, res) => {

    let date = new Date();
    let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
    // timestamp + 


    if (req.dataToken.user_id) {

      //   let { company_id, created_date } = req.body;
      //   let rev_created_date = "'" + created_date + "'";

      let cart_id = req.params.cart_id;

      console.log(timestamp, "req.params", req.params);
      console.log(timestamp, "cart_id", cart_id);


      if (cart_id) {

        let query = `
        DELETE FROM m_cart WHERE cart_id = ?; 
        
        DELETE FROM m_cart_dtl WHERE cart_id = ?; 
        `
        let parameter = [cart_id, cart_id];

        dbConf.query(query, parameter,
          (err, results) => {
            if (err) {
              res.status(500).send(err);
              console.log(timestamp + "Error while deleteing cart:", err);
            } else {
              res.status(200).send(results);
              console.log(timestamp + "delete Cart for : ", req.dataToken.company_id + "| cart_id: " + cart_id);
              addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), 'deleteCart');
            }
          }
        );

      } else {
        res.status(200).send();
        console.log(timestamp + "cart is not deleted :/ ");
        addSqlLogger(req.dataToken.user_id, '--cart is not deleted', '-- warning, cart is not deleted', 'deleteCart');
      }

    } else {
      res.status(200).send({
        success: false,
        message: "unauthorized",
      });
    }

  },
  addCartHeader: async (req, res) => {

    let date = new Date();
    let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
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
    let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
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
        id_year
      } = req.body;

      let query = ` INSERT INTO m_cart_dtl
                    (cart_id, company_id, created_by, detail_id, 
                      cont_size, cont_qty, 
                      sku1, sku2, sku3, qty1, qty2, qty3, price1, price2, price3, 
                      remarks, bulk, delv_week, delv_year, id_year,
                      created_date)
                    VALUES
                    (?, ?, ?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                      date_format(now(),'%Y-%m-%d-%T '));
                  `;

      let parameter = [
        cart_id, company_id, user_id, detail_id,
        cont_size, cont_qty,
        sku1, sku2, sku3, qty1, qty2, qty3,
        price1, price2, price3, remarks, bulk, delv_week, delv_year, id_year
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
  getCart_id: async (req, res) => {

    let date = new Date();
    let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    try {
      if (req.dataToken.user_id) {

        let query = `SELECT  MAX(cart_id) AS LATEST
        FROM m_cart
        WHERE created_by = ${req.dataToken.user_id} ;`;

        dbConf.query(query, (err, results) => {
          if (err) {
            res.status(500).send(err);
            console.log(timestamp + "Error get cart id", err);
          } else {
            res.status(200).send(results);
            console.log(timestamp + "get cart_id success:", results[0].LATEST);
            addSqlLogger(req.dataToken.user_id, query, (JSON.stringify(results)), 'getCart_id');
          }
        });

      } else {

        res.status(200).send({
          success: false,
          message: "unauthorized",
        });

      }

    } catch (error) {
      console.log(timestamp + error);
      res.status(500).send(error);
    }
  },
  editCartHeader: async (req, res) => {

    let date = new Date();
    let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
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
    let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
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
  addCart: async (req, res) => {

    let date = new Date();
    let timestamp = magenta + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    let { user_id, company_id } = req.dataToken;

    //   request bodynya jadi gini: 
    /*
           cart: {
                    [
                        {
                            delv_week: 0,
                            delv_week_desc: "",
                            delv_year: 0,
                            po_buyer: "",
                            stuffing_date: "YYYY-MM-DD",
                            port_shipment: 0,
                            ship_to: 0,
                            po_url: "",
                            final_dest: '',
                            tolling_id: 1,
                            remarks: '-',
                            detail: [{
                                detail_id: 0,
                                cont_size: 0,
                                cont_qty: 0,
                                bulk: 1,
                                remarks: "",
                                Flavour:
                                    [{
                                        sku: 0,
                                        qty: 0,
                                    }],
                            }] 
                        }
                    ]
                };
    */

    let cart = req.body.cart
 

    async function generate_cart_id(year) {

      let selectYear = year ? year : parseInt(date.getFullYear())


      try {

        let prevOrderId = (await dbQuery(`SELECT MAX(cart_id) AS LATEST FROM m_cart WHERE created_by = ${user_id} AND delv_year = ${year};`))[0].LATEST;

        // membuat kepala tahun order_id 
        let yearOrderId = selectYear ? selectYear.toString() : date.getFullYear().toString();
        let stringCuttedYear = yearOrderId.slice(2, 5);

        if (prevOrderId === null) {
          return (parseInt(stringCuttedYear + "00" + user_id + "00000"));

        } else if (prevOrderId !== null) {
          return (parseInt(prevOrderId))

        } else if (prevOrderId == (parseInt(stringCuttedYear + "00" + user_id + "99999"))) {

          res.status(200).send({
            success: false,
            message: 'Too many draft. Please delete the last draft order'
          })

        }

      } catch (error) {

        console.log(timestamp + "error get order_id: " + error)

        res.status(500).send({
          success: false,
          message: 'add order failed'
        })

      }

    }

    async function emergencyDeleteOrder(cart_id) {

      // const queryGetOrder_id = ' SELECT mo.order_id FROM m_order mo WHERE mo.po_buyer = ?';
      const queryEmergencyDeleteCart = `DELETE FROM m_cart WHERE cart_id = ${cart_id}; DELETE FROM m_cart WHERE cart_id = ${cart_id};`;

      setTimeout(async () => {

        let parameterEmergencyDeleteCart = [cart_id];

        //jalankan query untuk menghapus cart berdasarkan cart_id
        dbConf.query(queryEmergencyDeleteCart, parameterEmergencyDeleteCart, async (err, results) => {


          if (err) {

            console.log(timestamp + " EMERGENCY DELETE ORDER FAILED cart_id " + (cart_id))

          } else {

            addSqlLogger(req.dataToken.user_id, ` ${queryEmergencyDeleteCart} + ${cart_id}`, results, `DELETE error cart_id-${cart_id}`);

            console.log(timestamp + " just run emergency delete cart for cart_id" + (cart_id))

          }

        });

      }, 3000);

    }

    if (cart) {

      try {
        let cart_id_raw = await generate_cart_id(cart[0].delv_year);

        let cartIndex = 0;

        for (const cart_data of cart) {

          cartIndex++;

          let cart_id = cart_id_raw + cartIndex; 

          let {
            po_buyer,
            port_shipment, ship_to, po_url, final_dest
          } = cart_data;

          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');

          let formattedDate = `${year}-${month}-${day}`;

          let delv_year = cart_data.delv_year ? cart_data.delv_year : 0;

          let delv_week = cart_data.delv_week ? cart_data.delv_week : (await dbQuery(`SELECT day2week('${cart_data.stuffing_date}') AS wikwik;`))[0].wikwik;
          let delv_week_desc = cart_data.delv_week_desc ? cart_data.delv_week_desc : `Week: ${(await dbQuery(`SELECT day2week('${cart_data.stuffing_date}') AS wikwik;`))[0].wikwik} Date: ${cart_data.stuffing_date} `
          let tolling_id = cart_data.tolling_id ? cart_data.tolling_id : 0;

          let stuffing_date_rev = cart_data.stuffing_date ? cart_data.stuffing_date : formattedDate;
          let final_dest_check = final_dest ? final_dest : 0;

          let id_year = parseInt(delv_year.toString() + delv_week.toString())

          let query = ` 
          INSERT INTO m_cart 
            (cart_id, company_id, delv_week, delv_week_desc, 
             delv_year, id_year, po_buyer, 
             created_date, port_shipment, ship_to, po_url, 
             created_by, stuffing_date, final_dest, tolling_id )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, 
            date_format(now(),'%Y-%m-%d-%T '), ?, ?, ?, ?,
             ?, ?, ?); 
        `

          let parameter = [
            cart_id, company_id, delv_week, delv_week_desc, 
            delv_year, id_year, po_buyer,
            port_shipment, ship_to, po_url, 
            user_id, stuffing_date_rev, final_dest_check, tolling_id
          ]

          dbConf.query(query, parameter,

            (err, results) => {

              if (err) {
                emergencyDeleteOrder(cart_id)
                console.log(timestamp + "Error Push Cart Data", err);
                res.status(500).send({ message: `cannot insert cart po_buyer :${po_buyer} ` });
              } else {
                console.log(timestamp + `push cart header user_id: ${user_id} po_buyer :${po_buyer} cart_id: ${cart_id}   `);
                addSqlLogger(req.dataToken.user_id, (query.concat(parameter)), (JSON.stringify(results)), 'addCartHeader');


                //memasukkan detailll
                for (const detail of (cart_data.detail)) {
  
                  let queryDetail = ` INSERT INTO m_cart_dtl
                  (cart_id, company_id, created_by, detail_id, 
                    cont_size, cont_qty, 
                    sku1, sku2, sku3, 
                    qty1, qty2, qty3, 
                    price1, price2, price3, 
                    remarks, bulk, delv_week, delv_year, id_year,
                    created_date)
                  VALUES
                  (?, ?, ?, ?, 
                    ?, ?,  
                    ?, ?, ?, 
                    ?, ?, ?, 
                    ?, ?, ?, 
                    ?, ?, ?, ?, ?,
                    date_format(now(),'%Y-%m-%d-%T '));
                `;
                  let parameterDetail = [
                    cart_id, company_id, user_id, detail.detail_id,
                    detail.cont_size, detail.cont_qty,
                    (detail.Flavour[0] ? (detail.Flavour[0].sku > 1 ? detail.Flavour[0].sku : 0) : 0), (detail.Flavour[1] ? (detail.Flavour[1].sku > 1 ? detail.Flavour[1].sku : 0) : 0), (detail.Flavour[2] ? (detail.Flavour[2].sku > 1 ? detail.Flavour[2].sku : 0) : 0),
                    (detail.Flavour[0] ? (detail.Flavour[0].qty > 1 ? detail.Flavour[0].qty : 0) : 0), (detail.Flavour[1] ? (detail.Flavour[1].qty > 1 ? detail.Flavour[1].qty : 0) : 0), (detail.Flavour[2] ? (detail.Flavour[2].qty > 1 ? detail.Flavour[2].qty : 0) : 0),
                    0, 0, 0,
                    cart_data.remarks, detail.bulk, delv_week, delv_year, id_year
                  ]

                  dbConf.query(queryDetail, parameterDetail,
                    (err, results) => {
                      if (err) {
                        emergencyDeleteOrder(cart_id)
                        console.log(timestamp + "Error Push Cart Data", err);
                        res.status(500).send({ message: `cannot insert cart po_buyer :${po_buyer} ` })
                      } else {
                        console.log(timestamp + `push cart detail user_id:  ${user_id} po_buyer :${po_buyer} detail_id:${detail.detail_id}  `);
                        addSqlLogger(req.dataToken.user_id, (queryDetail.concat(parameterDetail)), (JSON.stringify(results)), `addCartDetail-${detail.detail_id}`);
                      }
                    }
                  );



                }

              }

            }
          );

          

        }
        setTimeout(() => {
          console.log(timestamp + `==========> add Cart is success`)
          res.status(200).send({
            success: true,
            message: 'All cart has been added. check Draft Orders'
          })
        }, 2000)
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Something wrong but its not your fault "
        });
        console.log(timestamp + ` Error happend. cart is not inserted! message ${error}`);
      }


    } else {
      res.status(401).send({
        success: false,
        message: "cart data is not available. cannot insert order"
      });
      console.log(timestamp + `add cart is unavailabe. cart is not inserted`);

    }


  }

};
