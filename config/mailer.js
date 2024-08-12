const nodemailer = require("nodemailer");
const { dbConf, dbQuery, dbTMQuery } = require("../config/db");
// const { notification } = require("../automation");


// PERHATIAN: INI CUMA BISA BERJALAN JIKA DI SERVER PRODUCTION
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_SMTP_HOST,
    port: process.env.MAIL_SMTP_PORT,
    secure: false,
    auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,

    },
});

//
const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: process.env.GMAIL_MAIL_USERNAME,
        pass: process.env.GMAIL_MAIL_PASSWORD,

    },
});

module.exports = {


    orderRecievedMailSender: async (user_id, employee_id, order_id) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        /*
        Time out berfungsi untuk memberikan delay
        agar memastikan bahwa header sudah terposting
        mencegah error karena header belum ada. 
        waktu diatur semepet mungkin mencegah 
        ada spare waktu antar detail
        yang signifikan
        */

        let userData = (await dbQuery(`
		SELECT su.company_id, su.employee_id, me.email dist_mail, mc.company_name  , group_concat(d.email) iod_mail 
		FROM  sys_user su 
         LEFT JOIN mst_employee me ON su.employee_id = me.employee_id
         LEFT JOIN mst_company mc ON su.company_id = mc.company_id 
         LEFT JOIN map_resp_for_dist a ON a.distributor_id  = su.company_id AND now() BETWEEN a.creation_date AND COALESCE(a.finish_date, '9999-12-31')
         LEFT JOIN mst_team b ON a.team_id = b.team_id AND a.company_id = b.company_id AND b.active = 1 
         LEFT JOIN mst_team_member c ON b.team_id = c.team_id AND b.company_id = c.company_id 
         LEFT JOIN mst_employee d ON a.company_id = d.company_id AND c.employee_id = d.employee_id 
		WHERE su.user_id = ${dbConf.escape(user_id)} AND b.team_category = 6;`))[0];

        // // IF YOU ALREADY SURE, THIS MUST BE PRODUCTION 
        let { dist_mail, company_name, iod_mail, company_id } = userData;

        let carbonCopyQuery = await dbQuery(`SELECT COALESCE(p.person_notice, '') person_notice FROM person p WHERE p.person_id = ${employee_id}`)
        let carbonCopy = carbonCopyQuery[0] ? carbonCopyQuery[0].person_notice.split(', ') : []



        let specialCondition = await dbQuery(`SELECT COALESCE(mcn.conditions, 0) trucking FROM m_config_new mcn WHERE mcn.conditions = 7 AND mcn.company_id = ${company_id}`)
        let truckingChecker = specialCondition[0] ? specialCondition[0].trucking : 0;


        // // FOR DEVELOPMENT
        /*
         let dist_mail = 'frztmr.webdev@gmail.com'
         let { company_name, iod_mail } = userData;
        */
        let emailAnalis = iod_mail.split(',');

        let emailAnalisList = emailAnalis.join(', ')

        setTimeout(async () => {


            let headerData = (await dbQuery(` 
                SELECT
                    DISTINCT 
                    ms.order_id,
                    mo.delv_week_desc,
                    ms.delv_date, 
                    mo.po_buyer,
                    DATE_FORMAT(mo.po_date , '%b %d, %Y') po_date,
                    mo.po_url,
                    CONCAT(mh.harbour_name, ', ', st.txt) AS port_shipment, 
                    mod2.bulk,
                    mod2.cont_size,
                    mod2.cont_qty,
                    mod2.remarks,
                    ms.remarks summary_remarks,
                    mc2.company_name AS ship_to,
                    COALESCE(mo.stuffing_date, 0) stuffing_date,
                    mo.final_dest AS final_dest
                FROM m_summary ms
                LEFT JOIN m_order mo ON ms.order_id = mo.order_id
                LEFT JOIN m_order_dtl mod2 ON ms.order_id = mod2.order_id
                LEFT JOIN mst_product mp ON mp.product_code = ms.sku
                LEFT JOIN mst_company mc2 ON mo.ship_to = mc2.company_id
                LEFT JOIN map_port_for_dist mpfd ON mo.port_shipment = mpfd.harbour_id AND mo.company_id = mpfd.distributor_id
                LEFT JOIN mst_harbour mh ON mpfd.harbour_id = mh.harbour_id
                LEFT JOIN mst_country mc ON mh.country_id = mc.country_id
                LEFT JOIN sys_text st ON st.text_id = mc.country_name_id AND st.lang_id = 1
                LEFT JOIN map_port_for_dist mpfd_fd ON mo.final_dest = mpfd_fd.harbour_id AND mo.company_id = mpfd_fd.distributor_id
                LEFT JOIN mst_harbour mh_fd ON mpfd_fd.harbour_id = mh_fd.harbour_id
                LEFT JOIN mst_country mc_fd ON mh_fd.country_id = mc_fd.country_id
                LEFT JOIN sys_text st_fd ON st_fd.text_id = mc_fd.country_name_id AND st_fd.lang_id = 1
                WHERE
                ms.order_id = ${order_id};`))[0];

            let {
                po_buyer,
                po_date,
                delv_week_desc,
                delv_date,
                po_url,
                port_shipment,
                final_dest,
                cont_size,
                cont_qty,
                ship_to,
                stuffing_date,
                remarks,
                summary_remarks
            } = headerData;

            let po_link = po_url ?
                `<a href='${process.env.BE_URL + po_url}'> 
                    click to open file 
                </a>`
                :
                `<a> no file attached </a> `;

            let skuData = await dbQuery(` 
            SELECT  DISTINCT 
            ms.order_id,  
            ms.qty, 
            COALESCE(mp.product_name_no, mp.product_name) sku_name
            FROM m_summary ms 
            LEFT JOIN m_order mo ON ms.order_id = mo.order_id 
            LEFT JOIN m_order_dtl mod2 ON ms.order_id = mod2.order_id  
            LEFT JOIN mst_product mp ON mp.product_code = ms.sku 
            LEFT JOIN mst_company mc2 ON mo.ship_to = mc2.company_id 
            LEFT JOIN map_port_for_dist mpfd ON mo.port_shipment = mpfd.harbour_id AND mo.company_id = mpfd.distributor_id 
            LEFT JOIN mst_harbour mh ON mpfd.harbour_id = mh.harbour_id 
            LEFT JOIN mst_country mc ON mh.country_id = mc.country_id 
            LEFT JOIN sys_text st ON st.text_id = mc.country_name_id AND st.lang_id = 1
            WHERE ms.order_id = ${order_id};`);

            let raw_qty = parseInt((await dbQuery(`SELECT sum(qty) AS total_qty FROM m_summary ms WHERE ms.order_id = ${dbConf.escape(order_id)};`))[0].total_qty)
            let total_qty = raw_qty.toLocaleString()
            let container = cont_size == 1 ? '20FT' : cont_size == 2 ? '40FT' : cont_size == 4 ? '40HC' : 'truck';

            const printOrderTable = () => {


                // dua ini sama aja aslinya
                if (cont_size == 8) {
                    return skuData.map((val) => {
                        return (
                            `<tr>
                                <td style="border:1px solid black; padding: 5px;">  ${val.sku_name}  </td>
                                <td style="border:1px solid black; padding: 5px;">  ${((val.qty).toLocaleString())}  </td>
                             </tr>`
                        );
                    }).join('');
                } else {
                    return skuData.map((val) => {
                        return (
                            `<tr>
                                <td style="border:1px solid black; padding: 5px;">  ${val.sku_name}  </td>
                                <td style="border:1px solid black; padding: 5px;">  ${((val.qty).toLocaleString())}  </td>
                             </tr>`
                        );
                    }).join('');
                }


            }
            const printDelv_method = () => {

                if (cont_size == 8) {
                    return ` <td>Est. Delivery Date</td> <td>: ${delv_date} </td> `
                } else {
                    return ` <td>Est. Delivery Week</td> <td>: ${delv_week_desc} </td> `
                }

            }
            const printPort_method = () => {
                if (cont_size == 8) {
                    return ` <td> Destination </td> <td>: ${final_dest}</td>  `
                } else {
                    return ` <td>Port of Destination </td> <td>: ${port_shipment}</td>`
                }

            }

            const printContainer_method = () => {
                if (cont_size == 8) {
                    return `  <td>Truck Qty</td> <td>: 1 </td>`
                } else {
                    return `<td> Container </td>  <td>:  ${cont_qty} X ${container}</td> `
                }
            }

            const printRemarks_method = () => {
                if (cont_size == 8) {
                    return `<td> Remarks </td> <td>: ${summary_remarks ? summary_remarks : '-'} </td>`
                } else {
                    return `<td> Remarks </td> <td>:  ${remarks ? remarks : '-'}</td> `
                }
            }
            // let delv_method = isTrucking ? ` <td>Est. Delivery Date</td> <td>: ${stuffing_date} </td> ` : ` <td>Est. Delivery Week</td> <td>: ${delv_week_desc} </td> `;
            // let port_method = isTrucking ? ` <td> Destination </td>   ` : ` <td>Port of Destination	</td> `;
            // let container_method = isTrucking ? `  <td>Truck Qty</td> <td>:${cont_qty}</td>` : `<td> Container </td>  <td>:  ${cont_qty} X ${container}</td> `;





            //TO DISTRIBUTOR
            if (!dist_mail) {
                console.log(`${timestamp} ERROR Cannot send EMAIL to DISTRIBUTOR because its not exist`)
            } else {
                try {
                    await transporter.sendMail({
                        from: 'no-reply@indofoodinternational.com',
                        to: dist_mail,
                        cc: carbonCopy,
                        subject: `[E-Order] Order Submission ${po_buyer} is Successful!`,
                        html: ` <div>
                    <p>
                        Dear ${company_name},
                        <br>
                        This email is to confirm that your order ${order_id} for ${company_name} has been placed successfully and will be reviewed by our sales team.
                    </p>
                    <div>
                        
                        <table> 
                             
                                Order detail: 
                             
                            <tr> 
                              <td>Order ID </td>
                              <td>: ${order_id}</td>
                            </tr>
                            <tr> 
                              <td>PO Buyer </td>
                              <td>: ${po_buyer}</td>
                            </tr>
                            <tr> 
                              <td>PO Date</td>
                              <td>: ${po_date} </td>
                            </tr>
							<tr> 
                                 ${printDelv_method()}
                            </tr>
                            <tr> 
                              <td>Ship to</td>
                              <td>: ${ship_to} </td>
                            </tr>
                            <tr> 
                                ${printPort_method()} 
                            </tr>
                            <tr> 
                              ${printContainer_method()}
                            </tr>
                            <tr> 
                              <td>Items Ordered	</td>
                              <td>: ${total_qty} cartons </td>
                            </tr>
                            <tr> 
                              <td>PO File </td>
                              <td>:
									${po_link}
                              </td>
                            </tr>
                            <tr> 
                              ${printRemarks_method()}
                            </tr>
                          </table>
                    
                    </div>
                    <br>
                    <div>
                        <table style="  border:1px solid black;  ">
                            <tr>
                                <th style="border:1px solid black;">Item Name</th>
                                <th style="border:1px solid black;">Qty</th>
                            </tr>
                             
                            ${printOrderTable()} 
                        </table>
            
                    </div>
                    <p>
                        If you have any questions or concerns, please do not hesitate to contact us via these contact:
                        <br>
                        ${emailAnalisList}
                        <br>
                        Thank you for your order!
                        
                        <br>
                        <br>
                        Sincerely, 
            
                        <span style="font-weight: bold;"> 
                            <br>
                            Indofood International Division
                        </span>
                        <br>
                    </p>
                </div>
                    `,
                    });
                    console.log(timestamp + 'Email Sent to distributor: ' + dist_mail)

                } catch (error) {
                    console.log(timestamp + "MAILER ERROR, Message: " + error)
                }
            }

            //TO ANALIS
            if (!emailAnalisList) {
                console.log(`${timestamp} ERROR Cannot send EMAIL to ANALIS because its not exist`)
            } else {

                try {
                    await transporter.sendMail({
                        from: 'no-reply@indofoodinternational.com',
                        to: emailAnalisList,
                        cc: ['rangga.primanto@icbp.indofood.co.id', 'anisa.novitasari@icbp.indofood.co.id', 'tripomo@icbp.indofood.co.id'],
                        bcc: ['etria.purba@icbp.indofood.co.id', 'yosua.gultom@icbp.indofood.co.id', 'muhammad.asmarakusuma@icbp.indofood.co.id'],

                        subject: `[E-Order] Order Submission ${po_buyer} - ${company_name} is Successful!`,
                        html: ` <div>
                       <p>
                           Dear Analyst,
                           <br>
                           This email is to confirm that your distributor order ${po_buyer} for ${company_name} has been placed and need be reviewed and confirm.
                       </p>
                       <div> 
                           <table>  
                                   Order detail:  
                               <tr> 
                                 <td>Order ID </td>
                                 <td>: ${order_id}</td>
                               </tr>
                               <tr> 
                                 <td>PO Buyer </td>
                                 <td>: ${po_buyer}</td>
                               </tr>
                               <tr> 
                                 <td>PO Date</td>
                                 <td>: ${po_date} </td>
                               </tr>
                               <tr> 
                                 <td>Ship to</td>
                                 <td>: ${ship_to} </td>
                               </tr>
							   <tr> 
                                 ${printDelv_method()}
                                </tr>
                                <tr> 
                                ${printPort_method()} 
                                </tr>
                                 <tr> 
                                ${printContainer_method()}
                                </tr>
                               <tr> 
                                 <td>Items Ordered	</td>
                                 <td>: ${total_qty} cartons </td>
                               </tr> 
                               <tr> 
                                <td>PO File </td>
                                <td>: ${po_link} </td>
                               </tr>
                                <tr> 
                                    ${printRemarks_method()}
                                </tr>
                             </table> 
                       </div>
                       <br>
                       <div>
                         <table style="  border:1px solid black;  ">
                            <tr>
                             <th style="border:1px solid black;">Item Name</th>
                             <th style="border:1px solid black;">Qty</th>
                            </tr> 
                                 ${printOrderTable()} 
                         </table> 
                       </div>
                       <p>
                             
                           <br>
                           <br>
                           Sincerely, 
               
                           <span style="font-weight: bold;"> 
                               <br>
                               Indofood International
                           </span>
                           <br>
                       </p>
                   </div>
                       `,
                    });
                    console.log(timestamp + 'Email Sent to analis :' + emailAnalisList)

                } catch (error) {
                    console.log(timestamp + "MAILER ERROR, Message: " + error)
                }

            }
        }, 1000);

    }
    , forgotPasswordMailSender: async (targetMail, token) => {
        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {

            await transporter.sendMail({
                from: 'no-reply@indofoodinternational.com',
                to: targetMail,
                subject: 'Reset Password',
                html: `<div>
                <h3> To reset password,copy to your browser in incognito page or you can click this link </h3>
                <br> </br>
                <a href='${process.env.FE_URL}e-order/forgot-password/${token}'> 
                ${process.env.FE_URL}e-order/forgot-password/${token} 
                </a>
                <br> </br>
                
                <h4> Please dont give the URL to anyone </h4>
                </div>`,
            })

            console.log(`${timestamp} Sending Mail to ${targetMail}`)
        } catch (error) {
            console.log(`${timestamp} Error sending mail to ${targetMail} error message: ${error}`)
        }
    }
    , NotifyTMGmailBulkMailSender6: async (tm_id) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        /*
                    Time out berfungsi untuk memberikan delay
                    agar memastikan bahwa header sudah terposting
                    mencegah error karena header belum ada. 
                    waktu diatur semepet mungkin mencegah 
                    ada spare waktu antar detail
                    yang signifikan
                    */
        let userData = (await dbTMQuery(`
                    SELECT 
                        me.email as dist_mail       
                    FROM  
                        mst_employee me 
                    LEFT JOIN
                        trademark_info ti ON me.employee_id = ti.employee_id 
                    WHERE ti.team_category = 2;
                `));
        let { dist_mail } = userData;

        setTimeout(async () => {


            /*
            Order data:
            header data: 
            */
            let headerData = (await dbTMQuery(` 
            SELECT 
        TIMESTAMPDIFF(MONTH, NOW(), tm_exp_date) AS month_left,
        TIMESTAMPDIFF(DAY, NOW(), tm_exp_date) AS days_left,
        tm_brand, 
        tm_id,
        tm_label,
        tm_exp_date,
        tm_country, 
        tm_status
    FROM 
        mst_trademark
    WHERE
        TIMESTAMPDIFF(MONTH, NOW(), tm_exp_date) <= 6 AND TIMESTAMPDIFF(MONTH, NOW(), tm_exp_date) > 1;
            `
            ));





            let {
                tm_exp_date,
                tm_status,
                tm_details,
                tm_brand,
                tm_country,
                days_left
            } = headerData;

            const printOrderTable = () => {
                return headerData.map((val) => {
                    return (
                        `<tr>
                        <td>${val.tm_brand}</td>
                        <td>${val.tm_country}</td>
                        <td>${val.tm_status}</td>
                        <td>${val.tm_exp_date}</td>
                        <td style="color:red">${val.days_left}</td>
                   
                      
                      </tr>`
                    );
                }).join('');

            }

            // DISTRIBUTOR
            if (Array.isArray(userData) && userData.length < 0) {

                console.log('Cannot send email because dist mail or iod_mail is not exist')

            } else {
                const dist_mail = userData.map(entry => entry.dist_mail);

                for (let i = 0; i < dist_mail.length; i++) {
                    const recipient = dist_mail[i];
                    try {
                        await transporter.sendMail({
                            from: 'do-not-reply@indofoodinternational.com',
                            to: recipient,
                            subject: `[TM-Mgmt] Trademark Reminder!`,
                            html: `
                            <style>
                            table, th, td {
                              border:1px solid black;
                            }
                            
                            th,td {
                            
                            padding: 15px 5px 15px 5px;
                            
                            }
                            
                            td {
                            text-align:center;
                            }
                            </style>
                            <div 
                            style=
                            "
                            height:500px;
                            "
                            >
                            <div style="
                            width:100%;
                            display:flex;
                            font-size:24px;
                            justify-content:center;
                            ">
                            <strong>
                            <hr>
                            IOD REMINDER
                            <hr>
                            </strong>
                            </div>
                            <br>
                            <div
                            style=
                            "
                            width:100%;
                            display:flex;
                            justify-content:center;
                            color:orange;
                            background-color:black;
                            align-items:center;
                            "
                            >
                            
                            Dear users, please let us remind you that the data below is nearly expired 
                            <br>
                            <br>
                            </div>
                            
                            <div
                            style=
                            "
                            margin-top:30px;
                            width:100%;
                            
                            "
                            >
                            <table style="width:100%">
                              <tr>
                                <th>Brand</th>
                                <th>Country</th>
                                <th>Status</th>
                                <th>Expiry Date</th>
                                <th>Remaining Days</th>
                              </tr>
                              ${printOrderTable()} 
                            </table>
                            </div>
                            <div style="text-align:center; margin-top : 25px">
                            thankyou, best regard 
                            <br>
                            <strong>
                            IOD IT
                            </strong>
                            </div>
                            </div>
                            
                            </div>
                        
                        `,
                        });
                        console.log(timestamp + 'Email Sent !')

                    } catch (error) {
                        console.log(timestamp + "MAILER ERROR, Message: " + error)
                    }
                }

            }

        }, 1000);
    }
    , NotifyTMGmailBulkMailSender1: async (tm_id) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        /*
                    Time out berfungsi untuk memberikan delay
                    agar memastikan bahwa header sudah terposting
                    mencegah error karena header belum ada. 
                    waktu diatur semepet mungkin mencegah 
                    ada spare waktu antar detail
                    yang signifikan
                    */
        let userData = (await dbTMQuery(`
                    SELECT 
                        me.email as dist_mail       
                    FROM  
                        mst_employee me 
                    LEFT JOIN
                        trademark_info ti ON me.employee_id = ti.employee_id 
                    WHERE ti.team_category = 2;
                `));
        let { dist_mail } = userData;

        setTimeout(async () => {


            /*
            Order data:
            header data: 
            */
            let headerData = (await dbTMQuery(` 
            SELECT 
        TIMESTAMPDIFF(MONTH, NOW(), tm_exp_date) AS month_left,
        TIMESTAMPDIFF(DAY, NOW(), tm_exp_date) AS days_left,
        tm_brand, 
        tm_id,
        tm_label,
        tm_exp_date,
        tm_country, 
        tm_status
    FROM 
        mst_trademark
    WHERE
        TIMESTAMPDIFF(MONTH, NOW(), tm_exp_date) = 1;
            `
            ));





            let {
                tm_exp_date,
                tm_status,
                tm_details,
                tm_brand,
                tm_country,
                days_left
            } = headerData;

            const printOrderTable = () => {
                return headerData.map((val) => {
                    return (
                        `<tr>
                        <td>${val.tm_brand}</td>
                        <td>${val.tm_country}</td>
                        <td>${val.tm_status}</td>
                        <td>${val.tm_exp_date}</td>
                        <td style="color:red">${val.days_left}</td>
                      </tr>`
                    );
                }).join('');

            }

            // DISTRIBUTOR
            if (Array.isArray(userData) && userData.length < 0) {

                console.log('Cannot send email because dist mail or iod_mail is not exist')

            } else {
                const dist_mail = userData.map(entry => entry.dist_mail);

                for (let i = 0; i < dist_mail.length; i++) {
                    const recipient = dist_mail[i];
                    try {
                        await transporter.sendMail({
                            from: 'do-not-reply@indofoodinternational.com',
                            to: recipient,
                            subject: `[TM-Mgmt] Under 1 Month Trademark Reminder!`,
                            html: `
                            <style>
                            table, th, td {
                              border:1px solid black;
                            }
                            
                            th,td {
                            
                            padding: 15px 5px 15px 5px;
                            
                            }
                            
                            td {
                            text-align:center;
                            }
                            </style>
                            <div 
                            style=
                            "
                            height:500px;
                            "
                            >
                            <div style="
                            width:100%;
                            display:flex;
                            font-size:24px;
                            justify-content:center;
                            ">
                            <strong>
                            <hr>
                            IOD REMINDER
                            <hr>
                            </strong>
                            </div>
                            <br>
                            <div
                            style=
                            "
                            width:100%;
                            display:flex;
                            justify-content:center;
                            color:red;
                            background-color:black;
                            align-items:center;
                            "
                            >
                            
                            Dear users, please let us remind you that the data below is nearly expired in UNDER <strong>&nbsp; 1 month </strong>
                            <br>
                            <br>
                            </div>
                            
                            <div
                            style=
                            "
                            margin-top:30px;
                            width:100%;
                            
                            "
                            >
                            <table style="width:100%">
                            <tr>
                            <th>Brand</th>
                            <th>Country</th>
                            <th>Status</th>
                            <th>Expiry Date</th>
                            <th>Remaining Days</th>
                          </tr>
                              ${printOrderTable()} 
                            </table>
                            </div>
                            <div style="text-align:center; margin-top : 25px">
                            thankyou, best regard 
                            <br>
                            <strong>
                            IOD IT
                            </strong>
                            </div>
                            </div>
                            
                            </div>
                        
                        `,
                        });
                        console.log(timestamp + 'Email Sent! ')

                    } catch (error) {
                        console.log(timestamp + "MAILER ERROR, Message: " + error)
                    }
                }

            }

        }, 1000);
    }
    , notifMailDeliver: async (order_id,
        dist_mail,
        str_carbon_copy,
        po_buyer,
        company_name,) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        try {

            let trackingDetailQuery = await dbQuery(`
            SELECT
                DATE_FORMAT(trd.delv_date, '%Y-%m-%d') delv_date,
                mo.order_id,
                tr.ship_name vessel_name,
                tr.ship_line shipping_line,
                tr.cont_id,
                DATE_FORMAT(tr.etd, '%Y-%m-%d') etd,
                DATE_FORMAT(tr.eta, '%Y-%m-%d') eta,
                mos.status_order,
                mos.notes status_detail,
                COALESCE(mp.product_name_no, mp.product_name) product_name,
                trd.qty, 
                CASE
                    WHEN sum(ms.qty) <= sum(trd.qty) THEN 1
                    ELSE 0
                    END finished
                    FROM
                    m_order mo
            LEFT JOIN m_summary ms ON
                mo.order_id = ms.order_id
                LEFT JOIN m_order_status mos ON
	            mos.id = mo.status
            LEFT JOIN trs_sales_order tso ON
		        mo.order_id = tso.e_order
                LEFT JOIN trs_realization tr ON
                tso.so_id = tr.so_id
            LEFT JOIN trs_realization_detail trd ON
                tr.cont_id = trd.cont_id
		        AND tr.so_id = trd.so_id
                AND tr.invoice_id = trd.invoice_id
	        LEFT JOIN mst_product mp ON
                trd.sku = mp.product_code
            WHERE
                mo.order_id = ${order_id}
            GROUP BY
                1,2,3,4; `);

            const trackingDetail = () => {
                return trackingDetailQuery.map((val) => {
                    return (
                        `<tr>
                            <th style="border:1px solid black; margin-right: 10px; margin-left: 10px: ">${val.delv_date ? val.delv_date : '-'}</th>
                            <th style="border:1px solid black; margin-right: 10px; margin-left: 10px: ">${val.cont_id ? val.cont_id : '-'}</th>
                            <th style="border:1px solid black; margin-right: 10px; margin-left: 10px: ">${val.product_name ? val.product_name : '-'}</th>
                            <th style="border:1px solid black; margin-right: 10px; margin-left: 10px: ">${val.qty ? (val.qty).toLocaleString() : '-'}</th>
                            <th style="border:1px solid black; margin-right: 10px; margin-left: 10px: ">${val.etd ? val.etd : '-'}</th>
                            <th style="border:1px solid black; margin-right: 10px; margin-left: 10px: ">${val.eta ? val.eta : '-'}</th>
                        </tr>`
                    );
                }).join('');

            }

            let carbon_copy = str_carbon_copy ? str_carbon_copy.split(",") : []

            await transporter.sendMail({
                from: 'no-reply@indofoodinternational.com',
                to: dist_mail,
                //cc: carbon_copy,
                bcc: ['etria.purba@icbp.indofood.co.id', 'muhammad.asmarakusuma@icbp.indofood.co.id'],
                subject: ` [E-Order] Order on Delivery ${po_buyer} - ${company_name}`,
                html: (`
                <div>
                    <p>
                    Dear ${company_name} ,  
                    </p>  
                    <br>
                    <p>
                        This email to inform you that your order ${po_buyer} has been shipped. 
                    </p>  
                    <p>
                        Your order is being shipped via ${trackingDetailQuery[0] ? trackingDetailQuery[0].shipping_line : ' our trusted shipping line'} and is expected to arrive on ${trackingDetailQuery[0] ? trackingDetailQuery[0].eta : 'schedule'}.
                        You can track the status of your shipment using the following tracking details: 
                    </p>  
                
                    <div>
                        <table style="  border:1px solid black;  ">
                            <tr>
                                <th style="border:1px solid black;">Stuffing Date</th>
                                <th style="border:1px solid black;">Container ID</th>
                                <th style="border:1px solid black;">Item Name</th>
                                <th style="border:1px solid black;">Qty</th>
                                <th style="border:1px solid black;">ETD</th>
                                <th style="border:1px solid black;">ETA</th>
                            </tr> 
                          ${trackingDetail()} 
                        </table> 
                    </div>

                    <p>
                      Please note that this is an estimated delivery and arrival date may vary depending on shipping conditions.
                        <br>
                      If you have any questions or concerns, please do not hesitate to contact us.
                        <br>
                    </p>

                    <p>
                        Thank you.
                        <br>
                        <br>
                        Sincerely,
                        <br>
                        Indofood International
                    </p>
                </div>`),
            });

            console.log(timestamp + " Mail just sent to : " + dist_mail);

        } catch (error) {
            console.log(timestamp + " notifMailDeliver ERROR : " + error);
        }
    }

}
