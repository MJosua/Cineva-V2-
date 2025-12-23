const nodemailer = require("nodemailer");
const { dbConf, dbQuery, dbTMQuery } = require("../../../config/db");
const { formatDate } = require("../../../script/Utility/DateFormat");
const os = require('os');


// PERHATIAN: INI CUMA BISA BERJALAN JIKA DI SERVER PRODUCTION\

function production() {

    function getLocalIp() {
        const networkInterfaces = os.networkInterfaces();
        for (const interfaceName in networkInterfaces) {
            const addresses = networkInterfaces[interfaceName];
            for (const address of addresses) {
                if (address.family === 'IPv4' && !address.internal) {
                    return address.address; // Return the local IP address
                }
            }
        }
    }

    if (getLocalIp() == "10.126.106.105") {
        // return "production"
        return true;
    } else {
        // return "development"
        return false;
    }


}
const isProd = production();

const mailsmtp = isProd ? process.env.MAIL_SMTP_HOST : process.env.MAIL_SMTP_LOCAL_HOST;
const mailPORT = parseInt(isProd ? process.env.MAIL_SMTP_PORT : process.env.MAIL_SMTP_LOCAL_PORT, 10);
const mailUser = isProd ? process.env.MAIL_USERNAME : process.env.MAIL_LOCAL_USERNAME;
const mailPassword = isProd ? process.env.MAIL_PASSWORD : process.env.MAIL_LOCAL_PASSWORD;
const mailaccount = isProd ? 'no-reply@indofoodinternational.com' : 'admin@stieprofesionalindonesia.ac.id';


console.log("mailsmtp:", mailsmtp)
console.log("mailPORT:", mailPORT)


const transporter = nodemailer.createTransport({
    host: mailsmtp,
    port: mailPORT,
    secure: mailPORT === 465,
    auth: {
        user: mailUser,
        pass: mailPassword,
    },
    tls: {
        rejectUnauthorized: false,
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


    insertMailerLog: async ({ subject, order_id, body, recipient, cc }) => {
        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {
            const result = await dbQuery(`
                INSERT INTO t_mailer_eo (subject, body, order_id, recipient, cc)
                VALUES (
                    ${dbConf.escape(subject)},
                    ${dbConf.escape(body)},
                    ${dbConf.escape(order_id)},
                    ${dbConf.escape(recipient)},
                    ${dbConf.escape(cc)}
                )
            `);
            return result.insertId; // return the ID to update later
        } catch (logErr) {
            console.log(`${timestamp} FAILED TO INSERT EMAIL LOG: ${logErr}`);
            return null;
        }
    }
    ,
    markMailerSent: async ({ id }) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        if (!id) return;
        try {
            await dbQuery(`
            UPDATE t_mailer_eo
            SET sent_date = NOW()
            WHERE id = ${dbConf.escape(id)}

        `);
        } catch (err) {
            console.log(`${timestamp} FAILED TO UPDATE sent_date: ${err}`);
        }
    }
    ,
    orderRecievedMailSender: async (user_id, employee_id, order_id_awal, company_id) => {

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
        select
            su.company_id,
            su.employee_id as dist_employeeid,
            me.email as dist_mail,
            mc.company_name,
            GROUP_CONCAT(distinct d.email order by d.email separator ', ') as iod_mail
        from
            sys_user su
        left join mst_employee me on
            su.employee_id = me.employee_id
        left join mst_company mc on
            su.company_id = mc.company_id
        left join map_resp_for_dist a on
            a.distributor_id = su.company_id
            and NOW() between a.creation_date and coalesce(a.finish_date, '9999-12-31')
        left join mst_team b on
            a.team_id = b.team_id
            and a.company_id = b.company_id
            and b.active = 1
        left join mst_team_member c on
            b.team_id = c.team_id
            and b.company_id = c.company_id
        left join mst_employee d on
            a.company_id = d.company_id
            and c.employee_id = d.employee_id
        where
            su.company_id = ${dbConf.escape(company_id)}
            and b.team_category = 6
            and me.email is not null
        group by
            su.company_id,
            me.email
        ;`))[0];

        // // IF YOU ALREADY SURE, THIS MUST BE PRODUCTION 
        let {
            dist_mail = null,
            dist_employeeid = null,
            company_name = null,
            iod_mail = null

        } = userData || {};


        let carbonCopyQuery = await dbQuery(`SELECT COALESCE(p.person_notice, '') person_notice FROM person p WHERE p.person_id = ${employee_id}`)
        let carbonCopy = carbonCopyQuery[0] ? carbonCopyQuery[0].person_notice.split(', ') : []



        let specialCondition = await dbQuery(`SELECT COALESCE(mcn.conditions, 0) trucking FROM m_config_new mcn WHERE mcn.conditions = 7 AND mcn.company_id = ${company_id}`)
        let truckingChecker = specialCondition[0] ? specialCondition[0].trucking : 0;


        // // FOR DEVELOPMENT
        /*
         let dist_mail = 'frztmr.webdev@gmail.com'
         let { company_name, iod_mail } = userData;
        */
        let distMailList = dist_mail ? dist_mail.split(',') : [];
        let distMailEmployeeIds = Array.isArray(dist_employeeid)
            ? dist_employeeid
            : String(dist_employeeid).split(',');

        // Find the email associated with the given employee_id
        let distSenderIndex = distMailEmployeeIds.indexOf(String(employee_id)); // Convert to string for comparison
        let distSender = distSenderIndex !== -1 ? distMailList[distSenderIndex] : null;
        // Remove `distSender` from `distMailList`
        if (distSenderIndex !== -1) {
            distMailList.splice(distSenderIndex, 1);
        }
        // Convert email arrays back to strings for readability
        distMailList = distMailList.join(', ');

        let emailAnalis = iod_mail ? iod_mail.split(',') : [];
        let emailAnalisList = emailAnalis.join(', ');

        let combinedEmailSet = new Set([
            ...emailAnalisList.split(', '),
            ...distMailList.split(', '),
            ...carbonCopy
        ]);

        // Convert back to a single comma-separated string
        let finalMergedEmailList = Array.from(combinedEmailSet).join(', ');

        // Removed setTimeout to ensure async execution without delay
        // setTimeout(async () => {


        let headerData = (await dbQuery(` 
                select
                    distinct 
                                    ms.order_id,
                    mo.delv_week_desc,
                    ms.delv_date,
                    mo.po_buyer,
                    DATE_FORMAT(mo.po_date ,
                    '%b %d, %Y') po_date,
                    mo.po_url,
                    CONCAT(mh.harbour_name,
                    ', ',
                    st.txt) as port_shipment,
                    mod2.bulk,
                    mod2.cont_size,
                    mod2.cont_qty,
                    mod2.remarks,
                    ms.remarks summary_remarks,
                    mc2.company_name as ship_to,
                    coalesce(mo.stuffing_date,
                    0) stuffing_date,
                    mo.final_dest as final_dest
                from
                    m_summary ms
                left join m_order mo on
                    ms.order_id = mo.order_id
                left join m_order_dtl mod2 on
                    ms.order_id = mod2.order_id
                left join mst_product mp on
                    mp.product_code = ms.sku
                left join mst_company mc2 on
                    mo.ship_to = mc2.company_id
                left join map_port_for_dist mpfd on
                    mo.port_shipment = mpfd.id
                    and mo.company_id = mpfd.distributor_id
                left join mst_harbour mh on
                    mpfd.harbour_id = mh.harbour_id
                left join mst_country mc on
                    mh.country_id = mc.country_id
                left join sys_text st on
                    st.text_id = mc.country_name_id
                    and st.lang_id = 1
                left join map_port_for_dist mpfd_fd on
                    mo.final_dest = mpfd_fd.harbour_id
                    and mo.company_id = mpfd_fd.distributor_id
                left join mst_harbour mh_fd on
                    mpfd_fd.harbour_id = mh_fd.harbour_id
                left join mst_country mc_fd on
                    mh_fd.country_id = mc_fd.country_id
                left join sys_text st_fd on
                    st_fd.text_id = mc_fd.country_name_id
                    and st_fd.lang_id = 1
                where
                    ms.order_id = ${order_id_awal};`))[0];

        let {
            po_buyer,
            order_id,
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

        let po_link = po_url && (po_url.trim() !== "" || po_url !== " ") ?
            `<a href='${process.env.BE_URL + po_url}'> 
                    click to open file 
                </a>`
            :
            `<a href='https://www.indofoodinternational.com/e-order/indofoodpo/${order_id}'> 
                    click to open file 
                </a> `;

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
                return ` <td>Est. Delivery Date</td> <td>: ${formatDate(delv_date)} </td> `
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

            let disthtml = ` <div>
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
                        Best Regards,
                        <br>
                        <span style="font-weight: bold;">
                        International Operations Division
                        </span>
                        <br>
                        <span style="font-weight: bold;">
                        PT Indofood CBP Sukses Makmur, Tbk.
                        </span>
                        <br>
                        Indofood Tower, 23rd Floor, Jakarta, Indonesia
                        <br><br>
                        For any inquiries or assistance, please contact our support team.
                        <br>
                        <a href="https://www.indofoodinternational.com/">www.indofoodinternational.com </a>
                        <br>
                        <a href="https://www.indofoodinternational.com/e-order/termsncondition">
                        Order Terms & Conditions
                        </a>
                        <br>
                    </p>
                </div>
                    `
            const mailLogId = await module.exports.insertMailerLog({
                subject: `[E-Order] Order Submission ${po_buyer} is Successful!`,
                body: disthtml,
                order_id: order_id,
                recipient: distSender,
                cc: finalMergedEmailList
            });
            try {
                await transporter.sendMail({
                    from: 'no-reply@indofoodinternational.com',
                    to: distSender,
                    cc: finalMergedEmailList,
                    subject: `[E-Order] Order Submission ${po_buyer} is Successful!`,
                    html: disthtml,
                });
                console.log(timestamp + 'Email Sent to distributor: ' + dist_mail)
                await module.exports.markMailerSent(mailLogId);

            } catch (error) {
                console.log(timestamp + "MAILER ERROR, Message: " + error)
            }
        }

        //TO ANALIS
        if (!emailAnalisList) {
            console.log(`${timestamp} ERROR Cannot send EMAIL to ANALIS because its not exist`)
        } else {

            let analysthtml = ` <div>
                       <p>
                           Dear Analyst,
                           <br>
                           This email is to confirm that your distributor order ${po_buyer} for ${company_name} has been placed and need be reviewed and confirmed.
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
                        If you have any questions or concerns, please do not hesitate to contact us via these contact:
                        <br>
                        ${emailAnalisList}
                        <br>
                        Thank you for your order!
                        
                        <br>
                        <br>
                        Best Regards,
                        <br>
                        <span style="font-weight: bold;">
                        International Operations Division
                        </span>
                        <br>
                        <span style="font-weight: bold;">
                        PT Indofood CBP Sukses Makmur, Tbk.
                        </span>
                        <br>
                        Indofood Tower, 23rd Floor, Jakarta, Indonesia
                        <br><br>
                        For any inquiries or assistance, please contact our support team.
                        <br>
                        <a href="https://www.indofoodinternational.com/">www.indofoodinternational.com </a>
                        <br>
                        <a href="https://www.indofoodinternational.com/e-order/termsncondition">
                        Order Terms & Conditions
                        </a>
                        <br>
                    </p>
                   </div>
                       `


            const mailLogId = await module.exports.insertMailerLog({
                subject: `[E-Order] Order Submission ${po_buyer} is Successful!`,
                body: analysthtml,
                order_id: order_id,
                recipient: emailAnalisList,
                cc: finalMergedEmailList
            });
            try {
                await transporter.sendMail({
                    from: 'no-reply@indofoodinternational.com',
                    to: emailAnalisList,
                    cc: ['rangga.primanto@icbp.indofood.co.id', 'anisa.novitasari@icbp.indofood.co.id', 'tripomo@icbp.indofood.co.id'],
                    bcc: ['etria.purba@icbp.indofood.co.id', 'yosua.gultom@icbp.indofood.co.id', 'muhammad.asmarakusuma@icbp.indofood.co.id'],

                    subject: `[E-Order] Order Submission ${po_buyer} - ${company_name} is Successful!`,
                    html: analysthtml
                    ,
                });
                console.log(timestamp + 'Email Sent to analis :' + emailAnalisList)
                await module.exports.markMailerSent(mailLogId);
            } catch (error) {
                console.log(timestamp + "MAILER ERROR when try to sent mail to analyst, Message: " + error)
            }

        }
    }
    ,
    forgotPasswordMailSender: async (targetMail, token) => {
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
                <a href='${process.env.FE_URL}/e-order/forgot-password/${token}'> 
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
    ,
    NotifyTMGmailBulkMailSender6: async (tm_id) => {

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
    ,
    NotifyTMGmailBulkMailSender1: async (tm_id) => {

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
    ,
    getNotifMailDeliverHtml: async (order_id) => {
        try {
            const trackingDetailQuery = await dbQuery(`
            SELECT
                mc.company_name,
                mo.po_buyer,
                mh.harbour_name,
                DATE_FORMAT(trd.delv_date, '%b %d, %Y') AS delv_date,
                CASE 
                    WHEN mp.product_name_no IS NOT NULL THEN mp.product_name_no
                    ELSE mp.product_name
                END AS product_name,
                trd.qty,
                mo.order_id,
                tr.ship_name AS vessel_name,
                tr.ship_line AS shipping_line,
                DATE_FORMAT(tr.etd, '%b %d, %Y') AS etd,
                DATE_FORMAT(tr.eta, '%b %d, %Y') AS eta,
                tr.cont_id,
                tr.so_id  
            FROM
                m_order mo
            LEFT JOIN trs_sales_order tso ON tso.e_order = mo.order_id
            LEFT JOIN trs_realization tr ON tr.so_id = tso.so_id
            LEFT JOIN trs_realization_detail trd ON tr.cont_id = trd.cont_id
                AND tr.so_id = trd.so_id
                AND tr.invoice_id = trd.invoice_id
            LEFT JOIN trs_realization_searates trs ON trs.so_id = tr.so_id
                AND trs.cont_id = tr.cont_id
            LEFT JOIN mst_product mp ON mp.product_code = trd.sku
            LEFT JOIN mst_company mc ON mc.company_id = mo.company_id
            LEFT JOIN map_port_for_dist mpfd ON mo.company_id = mpfd.distributor_id
            LEFT JOIN mst_harbour mh ON mpfd.harbour_id = mh.harbour_id
            WHERE
                mo.order_id = ${order_id}
            GROUP BY 
                tr.cont_id, trd.sku;
          `);

            const trackingDetailRows = trackingDetailQuery
                .map(
                    (val) => `
              <tr>
                <td style="border:1px solid black; padding: 5px 10px;">${val.delv_date || "-"}</td>
                <td style="border:1px solid black; padding: 5px 10px;">${val.cont_id || "-"}</td>
                <td style="border:1px solid black; padding: 5px 10px;">${val.product_name || "-"}</td>
                <td style="border:1px solid black; padding: 5px 10px;">${val.qty?.toLocaleString() || "-"}</td>
                <td style="border:1px solid black; padding: 5px 10px;">${val.etd || "-"}</td>
                <td style="border:1px solid black; padding: 5px 10px;">${val.eta || "-"}</td>
              </tr>`
                )
                .join("");

            const po_buyer = trackingDetailQuery[0]?.po_buyer || "N/A";
            const company_name = trackingDetailQuery[0]?.company_name || "Customer";

            let html = `
              <div>
                <p>Dear ${company_name},</p> 
                <br>
                <p>This email is to inform you that your order <b>${po_buyer}</b> has been shipped.</p>
                <p>Your order is being shipped via ${trackingDetailQuery[0]?.shipping_line || "our trusted shipping line"} 
                   and is expected to arrive on ${trackingDetailQuery[0]?.eta || "schedule"}.</p>
                <br>
                <table style="border:1px solid black; border-collapse: collapse;">
                  <tr>
                    <th style="border:1px solid black; padding: 5px 10px;">Stuffing Date</th>
                    <th style="border:1px solid black; padding: 5px 10px;">Container ID</th>
                    <th style="border:1px solid black; padding: 5px 10px;">Item Name</th>
                    <th style="border:1px solid black; padding: 5px 10px;">Qty</th>
                    <th style="border:1px solid black; padding: 5px 10px;">ETD</th>
                    <th style="border:1px solid black; padding: 5px 10px;">ETA</th>
                  </tr>
                  ${trackingDetailRows}
                </table>
                <br>
                <p>
                  Please note that this is an estimated delivery, and arrival may vary depending on conditions.<br>
                  Thank you for your order!
                </p>
                <p>
                  <b>International Operations Division</b><br>
                  PT Indofood CBP Sukses Makmur, Tbk.<br>
                  Indofood Tower, 23rd Floor, Jakarta, Indonesia<br>
                  <a href="https://www.indofoodinternational.com/">www.indofoodinternational.com</a>
                </p>
              </div>
            `;

            return { html, po_buyer, company_name };

        } catch (error) {
            return { error: error.message };
        }
    },

    notifMailDeliver: async (
        order_id,
        dist_mail,
        str_carbon_copy,
        po_buyer_ignored, // We fetch it again or use passed one? 
        company_name_ignored
    ) => {
        const date = new Date();
        const timestamp = date.toLocaleDateString("id") + " " + date.toLocaleTimeString("id") + " : ";

        try {
            const { html, po_buyer, company_name, error } = await module.exports.getNotifMailDeliverHtml(order_id);

            if (error) throw new Error(error);

            const carbon_copy = str_carbon_copy
                ? str_carbon_copy.split(",").map((e) => e.trim()).filter(Boolean)
                : [];

            await transporter.sendMail({
                from: "no-reply@indofoodinternational.com",
                to: dist_mail,
                cc: carbon_copy.length ? carbon_copy : undefined,
                bcc: ["etria.purba@icbp.indofood.co.id", "muhammad.asmarakusuma@icbp.indofood.co.id"],
                subject: `[E-Order] Order on Delivery ${po_buyer} - ${company_name}`,
                html: html,
            });

            console.log(`${timestamp} [MAIL SENT] to ${dist_mail}`);
            return true; // ✅ SUCCESS FLAG

        } catch (error) {
            console.log(`${timestamp} notifMailDeliver ERROR: ${error.message}`);
            return false; // ❌ FAIL FLAG
        }
    }
    ,
    getEOrderEmailHtml: async (so_id, type = 'distributor') => {
        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let userData = (await dbQuery(`
        select
                su.company_id,
                su.employee_id as dist_employeeid,
                me.email as dist_mail,
                mc.company_name,
                tso.so_id,
                su.type_id,
                trs.ata,
                trs.atd,
                mo.order_id,
                GROUP_CONCAT(distinct d.email order by d.email separator ', ') as iod_mail
            from
                sys_user su
            left join mst_employee me on
                su.employee_id = me.employee_id
            left join mst_company mc on
                su.company_id = mc.company_id
            left join map_resp_for_dist a on
                a.distributor_id = su.company_id
                and NOW() between a.creation_date and coalesce(a.finish_date, '9999-12-31')
            left join mst_team b on
                a.team_id = b.team_id
                and a.company_id = b.company_id
                and b.active = 1
            left join mst_team_member c on
                b.team_id = c.team_id
                and b.company_id = c.company_id
            left join mst_employee d on
                a.company_id = d.company_id
                and c.employee_id = d.employee_id
            left join trs_sales_order tso on
                tso.client_id = su.company_id
            left join m_order mo on
                mo.order_id = tso.e_order
            left join trs_realization_searates trs
                        on
                trs.so_id = tso.so_id
            where
                tso.so_id = ${dbConf.escape(so_id)}
                and
                        b.team_category = 6
                and 
                        me.email is not null
                and
                        mo.order_id is not null
                and
                        su.type_id = 3
            group by
                su.company_id,
                me.email
        ;`));

        if (!userData || userData.length === 0) {
            console.log("❌ No user data for email, stopping...");
            return { error: 'No user data found' };
        }

        let {
            dist_employeeid = null,
            ata,
            atd,
        } = userData || {};

        let carbonCopyQueries = await Promise.all(
            userData.map(u =>
                dbQuery(`SELECT COALESCE(p.person_notice, '') person_notice 
                         FROM person p 
                         WHERE p.person_id = ${u.dist_employeeid}`)
            )
        );

        let carbonCopy = carbonCopyQueries.flatMap(q =>
            q[0] && q[0].person_notice ? q[0].person_notice.split(', ') : []
        );

        let distMailList = userData.map(u => u.dist_mail).filter(Boolean);

        let distMailEmployeeIds = Array.isArray(dist_employeeid)
            ? dist_employeeid
            : String(dist_employeeid).split(',');

        let distSenderIndex = distMailEmployeeIds.indexOf(String(1));
        let distSender = distSenderIndex !== -1 ? distMailList[distSenderIndex] : null;

        if (distSenderIndex !== -1) {
            distMailList.splice(distSenderIndex, 1);
        }

        let uniqueAnalisEmails = userData
            .map(u => u.iod_mail)
            .filter(Boolean)
            .flatMap(m => m.split(',').map(e => e.trim()))
            .filter(e => e.length > 0);

        let emailAnalisList = [...new Set(uniqueAnalisEmails)];

        let orderIds = [...new Set(userData.map(r => r.order_id))];
        let placeholders = `(${orderIds.map(() => "?").join(",")})`;

        let headerData = (await dbQuery(
            `select
        distinct 
        ms.order_id,
        mo.delv_week_desc,
        ms.delv_date,
        mo.po_buyer,
        DATE_FORMAT(mo.po_date , '%b %d, %Y') po_date,
        mo.po_url,
        CONCAT(mh.harbour_name, ', ', st.txt) as port_shipment,
        mod2.bulk,
        mod2.cont_size,
        mod2.cont_qty,
        mod2.remarks,
        mh.harbour_name,
        mc.country_desc,
        mc2.company_name,
        ms.remarks summary_remarks,
        mc2.company_name as ship_to,
        coalesce(mo.stuffing_date, 0) stuffing_date,
        mo.final_dest as final_dest
    from
        m_summary ms
        left join m_order mo on ms.order_id = mo.order_id
        left join m_order_dtl mod2 on ms.order_id = mod2.order_id
        left join mst_product mp on mp.product_code = ms.sku
        left join mst_company mc2 on mo.ship_to = mc2.company_id
        left join map_port_for_dist mpfd on mo.port_shipment = mpfd.id
            and mo.company_id = mpfd.distributor_id
        left join mst_harbour mh on mpfd.harbour_id = mh.harbour_id
        left join mst_country mc on mh.country_id = mc.country_id
        left join sys_text st on st.text_id = mc.country_name_id
            and st.lang_id = 1
        left join map_port_for_dist mpfd_fd on mo.final_dest = mpfd_fd.harbour_id
            and mo.company_id = mpfd_fd.distributor_id
        left join mst_harbour mh_fd on mpfd_fd.harbour_id = mh_fd.harbour_id
        left join mst_country mc_fd on mh_fd.country_id = mc_fd.country_id
        left join sys_text st_fd on st_fd.text_id = mc_fd.country_name_id
            and st_fd.lang_id = 1
    where
        ms.order_id IN ${placeholders};`,
            orderIds
        ))[0];

        let {
            po_buyer,
            order_id,
            company_name,
            po_date,
            delv_week_desc,
            delv_date,
            po_url,
            port_shipment,
            harbour_name,
            country_desc,
            final_dest,
            cont_size,
            cont_qty,
            ship_to,
            stuffing_date,
            remarks,
            summary_remarks
        } = headerData;

        let po_link = po_url && (po_url.trim() !== "" || po_url !== " ") ?
            `<a href='${process.env.BE_URL + po_url}'> 
                    click to open file 
                </a>`
            :
            `<a href='https://www.indofoodinternational.com/e-order/indofoodpo/${order_id}'> 
                    click to open file 
                </a> `;

        let skuData = await dbQuery(` 
            SELECT DISTINCT
                trd.cont_id,
                trd.qty,
                tr.eta,
                tr.etd,
                trd.delv_date,
                trs.ata,
                trs.atd,
                COALESCE(mp.product_name_no, mp.product_name) as sku_name
            FROM trs_realization_detail trd
            LEFT JOIN trs_realization tr 
                ON trd.so_id = tr.so_id 
                AND trd.cont_id = tr.cont_id
            LEFT JOIN trs_realization_searates trs 
                ON trs.so_id = trd.so_id 
                AND trs.cont_id = trd.cont_id
            LEFT JOIN mst_product mp 
                ON mp.product_code = trd.sku
            WHERE trd.so_id = ${dbConf.escape(so_id)}
            ORDER BY trd.cont_id, sku_name;`);

        let raw_qty = parseInt((await dbQuery(`SELECT sum(qty) AS total_qty FROM m_summary ms WHERE ms.order_id = ${dbConf.escape(order_id)};`))[0].total_qty)
        let total_qty = raw_qty.toLocaleString()
        let container = cont_size == 1 ? '20FT' : cont_size == 2 ? '40FT' : cont_size == 4 ? '40HC' : 'truck';

        const printOrderTable = () => {
            return skuData.map((val) => {
                return (
                    `<tr>
                            <td style="border:1px solid black; padding: 5px 10px;">${formatDate(val.delv_date)}</td>
                            <td style="border:1px solid black; padding: 5px 10px;">${val.cont_id || "-"}</td>
                            <td style="border:1px solid black; padding: 5px 10px;">${val.sku_name}</td>
                            <td style="border:1px solid black; padding: 5px 10px;">${((val.qty).toLocaleString())}</td>
                            <td style="border:1px solid black; padding: 5px 10px;">${val.etd || "-"}</td>
                            <td style="border:1px solid black; padding: 5px 10px;">${val.eta || "-"}</td>
                            <td style="border:1px solid black; padding: 5px 10px;">${val.atd || "-"}</td>
                            <td style="border:1px solid black; padding: 5px 10px;">${val.ata || "-"}</td>
                         </tr>`
                );
            }).join('');
        }

        const printDelv_method = () => {
            if (cont_size == 8) {
                return ` <td>Est. Delivery Date</td> <td>: ${formatDate(delv_date)} </td> `
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

        //TO DISTRIBUTOR
        if (type === 'distributor') {
            let disthtml = ` <div>
                    <p>
                        Dear ${company_name},
                        <br>
                        <br>
                        This email is to confirm that your order <strong>${po_buyer}</strong>  has has been successfully delivered. 
                        <br>
                        Your order is arrived at <strong> ${harbour_name}, ${country_desc} </strong> with details below: 
                    </p>
                    <br>
                    <div>
                        <table style="border:1px solid black; border-collapse: collapse;">
                            <tr>
                                <th style="border:1px solid black; padding: 5px 10px;">Stuffing Date</th>
                                <th style="border:1px solid black; padding: 5px 10px;">Container ID</th>
                                <th style="border:1px solid black; padding: 5px 10px;">Item Name</th>
                                <th style="border:1px solid black; padding: 5px 10px;">Qty</th>
                                <th style="border:1px solid black; padding: 5px 10px;">ETD</th>
                                <th style="border:1px solid black; padding: 5px 10px;">ETA</th>
                                <th style="border:1px solid black; padding: 5px 10px;">ATD</th>
                                <th style="border:1px solid black; padding: 5px 10px;">ATA</th>
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
                        Best Regards,
                        <br>
                        <span style="font-weight: bold;">
                        International Operations Division
                        </span>
                        <br>
                        <span style="font-weight: bold;">
                        PT Indofood CBP Sukses Makmur, Tbk.
                        </span>
                        <br>
                        Indofood Tower, 23rd Floor, Jakarta, Indonesia
                        <br><br>
                        For any inquiries or assistance, please contact our support team.
                        <br>
                        <a href="https://www.indofoodinternational.com/">www.indofoodinternational.com </a>
                        <br>
                        <a href="https://www.indofoodinternational.com/e-order/termsncondition">
                        Order Terms & Conditions
                        </a>
                        <br>
                    </p>
                </div>
                    `
            return {
                html: disthtml,
                to: distSender,
                cc: Array.from(new Set([
                    ...emailAnalisList,
                    ...distMailList,
                    ...carbonCopy
                ])).join(', '),
                bcc: ['etria.purba@icbp.indofood.co.id', 'yosua.gultom@icbp.indofood.co.id', 'muhammad.asmarakusuma@icbp.indofood.co.id'],
                subject: `[E-Order] Order ${po_buyer} is delivered!`
            };
        }

        //TO ANALIS
        if (type === 'analyst') {
            let analysthtml = ` <div>
                       <p>
                           Dear Analyst,
                           <br>
                           <br>
                           This email is to confirm that your distributor order <strong> ${po_buyer} </strong> for <strong> ${company_name} </strong> has been Delivered.
                            <br>
                           Your order is arrived at <strong>${harbour_name}, ${country_desc} </strong> with details below: 
                        </p>
                       <br>
                       <div>
                         <table style="border:1px solid black; border-collapse: collapse;">
                            <tr>
                             <th style="border:1px solid black; padding: 5px 10px;">Stuffing Date</th>
                             <th style="border:1px solid black; padding: 5px 10px;">Container ID</th>
                             <th style="border:1px solid black; padding: 5px 10px;">Item Name</th>
                             <th style="border:1px solid black; padding: 5px 10px;">Qty</th>
                             <th style="border:1px solid black; padding: 5px 10px;">ETD</th>
                             <th style="border:1px solid black; padding: 5px 10px;">ETA</th>
                             <th style="border:1px solid black; padding: 5px 10px;">ATD</th>
                             <th style="border:1px solid black; padding: 5px 10px;">ATA</th>
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
                        Best Regards,
                        <br>
                        <span style="font-weight: bold;">
                        International Operations Division
                        </span>
                        <br>
                        <span style="font-weight: bold;">
                        PT Indofood CBP Sukses Makmur, Tbk.
                        </span>
                        <br>
                        Indofood Tower, 23rd Floor, Jakarta, Indonesia
                        <br><br>
                        For any inquiries or assistance, please contact our support team.
                        <br>
                        <a href="https://www.indofoodinternational.com/">www.indofoodinternational.com </a>
                        <br>
                        <a href="https://www.indofoodinternational.com/e-order/termsncondition">
                        Order Terms & Conditions
                        </a>
                        <br>
                    </p>
                   </div>
                       `
            return {
                html: analysthtml,
                to: emailAnalisList,
                cc: ['rangga.primanto@icbp.indofood.co.id', 'anisa.novitasari@icbp.indofood.co.id', 'tripomo@icbp.indofood.co.id'],
                bcc: ['etria.purba@icbp.indofood.co.id', 'yosua.gultom@icbp.indofood.co.id', 'muhammad.asmarakusuma@icbp.indofood.co.id'],
                subject: `[E-Order] Order ${po_buyer} - ${company_name} is Delivered!`
            };
        }

        return { error: 'Invalid type' };
    }
    ,
    eorderDelivered: async (so_id) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        // Dist Email
        const distData = await module.exports.getEOrderEmailHtml(so_id, 'distributor');
        if (distData.error) {
            console.log(timestamp + "MAILER ERROR (Distributor): " + distData.error);
        } else {
            try {
                await transporter.sendMail({
                    from: 'no-reply@indofoodinternational.com',
                    to: distData.to,
                    cc: distData.cc,
                    bcc: distData.bcc,
                    subject: distData.subject,
                    html: distData.html,
                });
                console.log(timestamp + 'Email Sent to distributor: ' + distData.to)

            } catch (error) {
                console.log(timestamp + "MAILER ERROR, Message: " + error)
            }
        }

        // Analyst Email
        const auditData = await module.exports.getEOrderEmailHtml(so_id, 'analyst');
        if (auditData.error) {
            console.log(timestamp + "MAILER ERROR (Analyst): " + auditData.error);
        } else {
            try {
                await transporter.sendMail({
                    from: 'no-reply@indofoodinternational.com',
                    to: auditData.to,
                    cc: auditData.cc,
                    bcc: auditData.bcc,
                    subject: auditData.subject,
                    html: auditData.html
                    ,
                });
                console.log(timestamp + 'Email Sent to analis :' + auditData.to)
            } catch (error) {
                console.log(timestamp + "MAILER ERROR, Message: " + error)
            }
        }
    }
    ,
    feedback_eorder: async (judul, isi, gambar, company, user) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        try {
            let user_data = await dbQuery(`
                select 
                me.email,
                su.firstname,
                su.lastname 
                from 
                sys_user su
                left join
                mst_employee me 
                on 
                su.employee_id = me.employee_id 
                where
                su.user_id = ${user}
                limit 1
                `);

            let company_name = await dbQuery(`
           
                select company_name
                    from 
                    mst_company mc
                    where
                    mc.company_id = ${company}
                    limit 1
                    `);

            console.log("company", company)

            transporter.sendMail({
                from: 'no-reply@indofoodinternational.com',
                to: user_data[0].email,
                //cc: carbon_copy,
                bcc: ['etria.purba@icbp.indofood.co.id', 'muhammad.asmarakusuma@icbp.indofood.co.id'],
                subject: ` [E-Order] Feedback ${user_data[0].firstname} ${user_data[0].lastname || ""} - ${company_name}`,
                html: (`
                <div>
                    <p>
                    Dear ${company_name[0].company_name} ,  
                    </p>  
                    <br>
                    <p>
                        This email to inform you that your Feedback has been sent as like this email :
                    </p>  
                     <p style="font-weight:900">
                        ${judul}
                    </p>  
                
                    <div>
                       ${isi}
                    </div>

                    <p>
                       
                        Best Regards,
                        <br>
                        <span style="font-weight: bold;">
                        International Operations Division
                        </span>
                        <br>
                        <span style="font-weight: bold;">
                        PT Indofood CBP Sukses Makmur, Tbk.
                        </span>
                        <br>
                        Indofood Tower, 23rd Floor, Jakarta, Indonesia
                        <br><br>
                        For any inquiries or assistance, please contact our support team.
                        <br>
                        <a href="https://www.indofoodinternational.com/">www.indofoodinternational.com </a>
                        <br>
                        <a href="https://www.indofoodinternational.com/e-order/termsncondition">
                        Order Terms & Conditions
                        </a>
                        <br>
                    </p>

                </div>`),
            });

            console.log(timestamp + " Mail just sent to : " + user_data[0].firstname);

        } catch (error) {
            console.log(timestamp + " feedback_eorder ERROR : " + error);
        }

    }
    ,
    feedback_eorder_admin: async (judul, isi, gambar, company, user) => {
        let date = new Date();

        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {



            let analyst_email = await dbQuery(`
                 select distinct
                    GROUP_CONCAT(distinct d.email order by d.email separator ', ') as iod_mail
                from
                    sys_user su
                left join mst_employee me on
                    su.employee_id = me.employee_id
                left join mst_company mc on
                    su.company_id = mc.company_id
                left join map_resp_for_dist a on
                    a.distributor_id = su.company_id
                    and NOW() between a.creation_date and coalesce(a.finish_date, '9999-12-31')
                left join mst_team b on
                    a.team_id = b.team_id
                    and a.company_id = b.company_id
                    and b.active = 1
                left join mst_team_member c on
                    b.team_id = c.team_id
                    and b.company_id = c.company_id
                left join mst_employee d on
                    a.company_id = d.company_id
                    and c.employee_id = d.employee_id
                where
                    su.company_id = ${dbConf.escape(company)}
                    and b.team_category = 6
                    and me.email is not null
                group by
                    su.company_id,
                    me.email
                `);

            let to_emails = analyst_email.length > 0 ? analyst_email[0].iod_mail : '';

            let user_data = await dbQuery(`
           
                select 
                me.email,
                su.firstname,
                su.lastname 
                from 
                sys_user su
                left join
                mst_employee me 
                on 
                su.employee_id = me.employee_id 
                where
                su.user_id = ${user}
                limit 1
                `);

            let company_name = await dbQuery(`
           
                select company_name
                    from 
                    mst_company mc
                    where
                    mc.company_id = ${company}
                    limit 1
                    `);
            console.log("user_data", user_data)
            console.log("user", user)
            transporter.sendMail({
                from: 'no-reply@indofoodinternational.com',
                to: to_emails,
                //cc: carbon_copy,
                bcc: ['etria.purba@icbp.indofood.co.id', 'muhammad.asmarakusuma@icbp.indofood.co.id'],
                subject: ` [E-Order] Feedback ${user_data[0].firstname} ${user_data[0].lastname || ""} - ${company_name}`,
                html: (`
                <div>
                    <p>
                    Dear ${company_name[0].company_name} Analyst ,  
                    </p>  
                    <br>
                    <p>
                        This email to inform you that Feedback from ${user_data[0].firstname} has been collected as like this email :. 
                    </p>  
                    <p style="font-weight:900">
                        ${judul}
                    </p>  
                
                    <div>
                       ${isi}
                    </div>

                    <p>
                       
                        Best Regards,
                        <br>
                        <span style="font-weight: bold;">
                        International Operations Division
                        </span>
                        <br>
                        <span style="font-weight: bold;">
                        PT Indofood CBP Sukses Makmur, Tbk.
                        </span>
                        <br>
                        Indofood Tower, 23rd Floor, Jakarta, Indonesia
                        <br><br>
                        For any inquiries or assistance, please contact our support team.
                        <br>
                        <a href="https://www.indofoodinternational.com/">www.indofoodinternational.com </a>
                        <br>
                        <a href="https://www.indofoodinternational.com/e-order/termsncondition">
                        Order Terms & Conditions
                        </a>
                        <br>
                    </p>


                </div>`),
            });

            console.log(timestamp + " Mail just sent to : " + to_emails);

        } catch (error) {
            console.log(timestamp + " feedback_eorder_admin ERROR : " + error);
        }

    }




}
