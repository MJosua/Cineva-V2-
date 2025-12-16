const nodemailer = require("nodemailer");
const { dbConf, dbQuery } = require("../../config/db");
const { formatDate } = require("../../Utility/DateFormat");
// const { notification } = require("../automation");
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

module.exports = {




    eorderDelivered: async (so_id) => {

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
                tso.so_id,
                su.type_id,
                trs.ata,
                trs.atd,
                mo.order_id,
                GROUP_CONCAT(distinct d.email order by d.email separator ', ') as iod_mail
            from
                iod.sys_user su
            left join iod.mst_employee me on
                su.employee_id = me.employee_id
            left join iod.mst_company mc on
                su.company_id = mc.company_id
            left join iod.map_resp_for_dist a on
                a.distributor_id = su.company_id
                and NOW() between a.creation_date and coalesce(a.finish_date, '9999-12-31')
            left join iod.mst_team b on
                a.team_id = b.team_id
                and a.company_id = b.company_id
                and b.active = 1
            left join iod.mst_team_member c on
                b.team_id = c.team_id
                and b.company_id = c.company_id
            left join iod.mst_employee d on
                a.company_id = d.company_id
                and c.employee_id = d.employee_id
            left join iod.trs_sales_order tso on
                tso.client_id = su.company_id
            left join iod.m_order mo on
                mo.order_id = tso.e_order
            left join iod.trs_realization_searates trs
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
            return;
        }

        // // IF YOU ALREADY SURE, THIS MUST BE PRODUCTION 
        let {
            dist_employeeid = null,
            ata,
            atd,
        } = userData || {};


        console.log("so_id", so_id)
        console.log("userData", userData)


        let carbonCopyQueries = await Promise.all(
            userData.map(u =>
                dbQuery(`SELECT COALESCE(p.person_notice, '') person_notice 
                         FROM iod.person p 
                         WHERE p.person_id = ${u.dist_employeeid}`)
            )
        );

        let carbonCopy = carbonCopyQueries.flatMap(q =>
            q[0] && q[0].person_notice ? q[0].person_notice.split(', ') : []
        );
        // // FOR DEVELOPMENT
        /*
         let dist_mail = 'frztmr.webdev@gmail.com'
         let { company_name, iod_mail } = userData;
        */
        let distMailList = userData.map(u => u.dist_mail).filter(Boolean);

        let distMailEmployeeIds = Array.isArray(dist_employeeid)
            ? dist_employeeid
            : String(dist_employeeid).split(',');

        // Find the email associated with the given employee_id
        let distSenderIndex = distMailEmployeeIds.indexOf(String(1)); // ganti "1" dengan employee id sebenarnya
        let distSender = distSenderIndex !== -1 ? distMailList[distSenderIndex] : null;

        // Remove `distSender` from `distMailList`
        if (distSenderIndex !== -1) {
            distMailList.splice(distSenderIndex, 1);
        }

        // Now distMailList is still an array of emails (keep it that way!)

        // Handle analis emails
        let uniqueAnalisEmails = userData
            .map(u => u.iod_mail) // raw strings
            .filter(Boolean)      // drop null/empty
            .flatMap(m => m.split(',').map(e => e.trim())) // split & trim
            .filter(e => e.length > 0);

        let emailAnalisList = [...new Set(uniqueAnalisEmails)]; // keep as array

        // Merge everything into one Set
        let combinedEmailSet = new Set([
            ...emailAnalisList,   // already array
            ...distMailList,      // already array
            ...carbonCopy         // assumed array
        ]);

        // Final result as comma-separated string
        let finalMergedEmailList = Array.from(combinedEmailSet).join(', ');


        // Removed setTimeout to ensure async execution without delay
        // setTimeout(async () => {

        let orderIds = [...new Set(userData.map(r => r.order_id))];

        // build placeholders (?, ?, ?)
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
        iod.m_summary ms
        left join iod.m_order mo on ms.order_id = mo.order_id
        left join iod.m_order_dtl mod2 on ms.order_id = mod2.order_id
        left join iod.mst_product mp on mp.product_code = ms.sku
        left join iod.mst_company mc2 on mo.ship_to = mc2.company_id
        left join iod.map_port_for_dist mpfd on mo.port_shipment = mpfd.id
            and mo.company_id = mpfd.distributor_id
        left join iod.mst_harbour mh on mpfd.harbour_id = mh.harbour_id
        left join iod.mst_country mc on mh.country_id = mc.country_id
        left join iod.sys_text st on st.text_id = mc.country_name_id
            and st.lang_id = 1
        left join iod.map_port_for_dist mpfd_fd on mo.final_dest = mpfd_fd.harbour_id
            and mo.company_id = mpfd_fd.distributor_id
        left join iod.mst_harbour mh_fd on mpfd_fd.harbour_id = mh_fd.harbour_id
        left join iod.mst_country mc_fd on mh_fd.country_id = mc_fd.country_id
        left join iod.sys_text st_fd on st_fd.text_id = mc_fd.country_name_id
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
            SELECT  DISTINCT 
            ms.order_id,  
            ms.qty, 
            trs.ata,
            trs.atd,
            trs.cont_id,
            CASE 
                    WHEN mp.product_name_no IS NOT NULL 
                    THEN mp.product_name_no
                    ELSE mp.product_name
                END AS sku_name
            FROM iod.m_summary ms 
            LEFT JOIN iod.m_order mo ON ms.order_id = mo.order_id 
            LEFT JOIN iod.m_order_dtl mod2 ON ms.order_id = mod2.order_id  
            LEFT JOIN iod.mst_product mp ON mp.product_code = ms.sku 
            LEFT JOIN iod.mst_company mc2 ON mo.ship_to = mc2.company_id 
            LEFT JOIN iod.map_port_for_dist mpfd ON mo.port_shipment = mpfd.harbour_id AND mo.company_id = mpfd.distributor_id 
            LEFT JOIN iod.mst_harbour mh ON mpfd.harbour_id = mh.harbour_id 
            LEFT JOIN iod.mst_country mc ON mh.country_id = mc.country_id 
            LEFT JOIN iod.sys_text st ON st.text_id = mc.country_name_id AND st.lang_id = 1
            left join iod.trs_sales_order tso on tso.e_order  = mo.order_id
            left join iod.trs_realization tr on tr.so_id = tso.so_id
            left join iod.trs_realization_searates trs on trs.so_id = tr.so_id and trs.cont_id = tr.cont_id
            WHERE ms.order_id = ${order_id};`);

        let raw_qty = parseInt((await dbQuery(`SELECT sum(qty) AS total_qty FROM iod.m_summary ms WHERE ms.order_id = ${dbConf.escape(order_id)};`))[0].total_qty)
        let total_qty = raw_qty.toLocaleString()
        let container = cont_size == 1 ? '20FT' : cont_size == 2 ? '40FT' : cont_size == 4 ? '40HC' : 'truck';

        const printOrderTable = () => {


            // dua ini sama aja aslinya
            if (cont_size == 8) {
                return skuData.map((val) => {
                    return (
                        `<tr>
                                <td style="border:1px solid black; padding: 5px;">  ${val.cont_id || ""}  </td>
                                <td style="border:1px solid black; padding: 5px;">  ${val.sku_name}  </td>
                                <td style="border:1px solid black; padding: 5px;">  ${((val.qty).toLocaleString())}  </td>
                                <td style="border:1px solid black; padding: 5px;">  ${((val.atd || "").toLocaleString())}</td>
                                <td style="border:1px solid black; padding: 5px;">  ${((val.ata || "").toLocaleString())}</td>
                             </tr>`
                    );
                }).join('');
            } else {
                return skuData.map((val) => {
                    return (
                        `<tr>
                                <td style="border:1px solid black; padding: 5px;">  ${val.cont_id || ""}  </td>
                                <td style="border:1px solid black; padding: 5px;">  ${val.sku_name}  </td>
                                <td style="border:1px solid black; padding: 5px;">  ${((val.qty).toLocaleString())}  </td>
                                <td style="border:1px solid black; padding: 5px;">  ${((val.atd || "").toLocaleString())}</td>
                                <td style="border:1px solid black; padding: 5px;">  ${((val.ata || "").toLocaleString())}</td>
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
        if (!distMailList) {
            console.log(`${timestamp} ERROR Cannot send EMAIL to DISTRIBUTOR because its not exist`)
        } else {

            let disthtml = ` <div>
                    <p>
                        Dear ${company_name},
                        <br>
                        <br>
                        This email is to confirm that your order <strong>${order_id}</strong>  has has been successfully delivered. 
                        <br>
                        Your order is arrived at <strong> ${harbour_name}, ${country_desc} </strong> with details below: 
                    </p>
                    <br>
                    <div>
                        <table style="width: 100%; max-width: 600px; border: 1px solid black;">
                            <tr>
                                <th style="border:1px solid black;">Container</th>
                                <th style="border:1px solid black;">Item Name</th>
                                <th style="border:1px solid black;">Qty</th>
                                <th style="border:1px solid black;">ATD</th>
                                <th style="border:1px solid black;">ATA</th>
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
            // const mailLogId = await module.exports.insertMailerLog({
            //     subject: `[E-Order] Order Submission ${po_buyer} is Successful!`,
            //     body: disthtml,
            //     order_id: order_id,
            //     recipient: distSender,
            //     cc: finalMergedEmailList
            // });
            try {
                await transporter.sendMail({
                    from: 'no-reply@indofoodinternational.com',
                    to: distSender,
                    cc: finalMergedEmailList,
                    bcc: ['etria.purba@icbp.indofood.co.id', 'yosua.gultom@icbp.indofood.co.id', 'muhammad.asmarakusuma@icbp.indofood.co.id'],
                    subject: `[E-Order] Order ${po_buyer} is delivered!`,
                    html: disthtml,
                });
                console.log(timestamp + 'Email Sent to distributor: ' + distMailList)
                // await module.exports.markMailerSent(mailLogId);

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
                           <br>
                           This email is to confirm that your distributor order <strong> ${po_buyer} </strong> for <strong> ${company_name} </strong> has been Delivered.
                            <br>
                           Your order is arrived at <strong>${harbour_name}, ${country_desc} </strong> with details below: 
                        </p>
                       <br>
                       <div>
                         <table style="width: 100%; max-width: 600px; border: 1px solid black;">
                            <tr>
                             <th style="border:1px solid black;">Container</th>
                             <th style="border:1px solid black;">Item Name</th>
                             <th style="border:1px solid black;">Qty</th>
                             <th style="border:1px solid black;">ATD</th>
                             <th style="border:1px solid black;">ATA</th>
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
            // const mailLogId = await module.exports.insertMailerLog({
            //     subject: `[E-Order] Order Submission ${po_buyer} is Successful!`,
            //     body: analysthtml,
            //     order_id: order_id,
            //     recipient: emailAnalisList,
            //     cc: finalMergedEmailList
            // });
            try {
                await transporter.sendMail({
                    from: 'no-reply@indofoodinternational.com',
                    to: emailAnalisList,
                    cc: ['rangga.primanto@icbp.indofood.co.id', 'anisa.novitasari@icbp.indofood.co.id', 'tripomo@icbp.indofood.co.id'],
                    bcc: ['etria.purba@icbp.indofood.co.id', 'yosua.gultom@icbp.indofood.co.id', 'muhammad.asmarakusuma@icbp.indofood.co.id'],

                    subject: `[E-Order] Order ${po_buyer} - ${company_name} is Delivered!`,
                    html: analysthtml
                    ,
                });
                console.log(timestamp + 'Email Sent to analis :' + emailAnalisList)
                // await module.exports.markMailerSent(mailLogId);
            } catch (error) {
                console.log(timestamp + "MAILER ERROR, Message: " + error)
            }

        }
        // });
    }






}
