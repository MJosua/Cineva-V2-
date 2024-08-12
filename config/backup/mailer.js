const nodemailer = require("nodemailer");
const { dbConf, dbQuery } = require("../config/db");


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

    basicMailSender: async (targetMail, ccMail, subjectMail, contentMail) => {
        await transporter.sendMail({
            from: 'no-reply@indofoodinternational.com',
            to: targetMail,
            cc: ccMail,
            subject: subjectMail,
            text: contentMail,
        })
    }
    // , orderRecieved_LocalMailSender: async (iodMail, mailData) => {
    , orderRecieved_LocalMailSender: async (iodMail, mailData) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        //Mail body data
        let {
            company_name,
            order_id,
            po_buyer,
            po_date,
            port_shipment,
            ship_to,
            cont_qty,
            sku_name1, sku_name2, sku_name3,
            qty1, qty2, qty3,
        } = mailData;

        let row2 = qty2 > 0 ? `<tr>
            <td style="border:1px solid black;">${sku_name2}</td>
            <td style="border:1px solid black;">${qty2}</td>
        </tr>` : '<br>';

        let row3 = qty2 > 0 ? `<tr>
            <td style="border:1px solid black;">${sku_name3}</td>
            <td style="border:1px solid black;">${qty3}</td>
        </tr>` : '<br>';

        let total_qty = (qty1 + qty2 + qty3)

        // DISTRIBUTOR
        if (!dist_mail || !iodMail) {
            console.log('Cannot send email because dist mail or iod_mail is not exist')
        } else {

            try {
                await transporter.sendMail({
                    from: 'no-reply@indofoodinternational.com',
                    to: iodMail,
                    // DEPLOYMENT CONFIG
                    // bcc: ['etria.purba@icbp.indofood.co.id', 't.tripomo@icbp.indofood.co.id', 'rangga.primanto@icbp.indofood.co.id', 'yosua.gultom@icbp.indofood.co.id'], 

                    //DEVELOPMENT CONFIG
                    bcc: ['etria.purba@icbp.indofood.co.id', 'yosua.gultom@icbp.indofood.co.id', 'muhammad.asmarakusuma@icbp.indofood.co.id'],
                    subject: `[E-Order] Order Submission Successful!`,
                    html: ` <div>
                   <p>
                       Dear Analyst,
                       <br>
                       This email is to confirm that your distributor order ${order_id} for ${company_name} has been placed and need be reviewed and confirm.
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
                             <td>Port Destination	</td>
                             <td>: ${port_shipment}</td>
                           </tr>
                           <tr> 
                             <td>Total Container	</td>
                             <td>: ${cont_qty}</td>
                           </tr>
                           <tr> 
                             <td>Items Ordered	</td>
                             <td>: ${total_qty} </td>
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
                           <tr style="border:1px solid black;">
                               <td style="border:1px solid black;">${sku_name1}</td>
                               <td style="border:1px solid black;">${qty1}</td>
                           </tr>
                           ${row2}
                           ${row3}
                       </table>
           
                   </div>
                   <p>
                        
                       <br>
                       Thank you and have a nice day :)
                       
                       <br>
                       <br>
                       Sincerely, 
           
                       <span style="font-weight: bold;"> 
                           <br>
                           IT IOD
                       </span>
                       <br>
                   </p>
               </div>
                   `,
                });
                console.log(timestamp + 'Email Sent' + dist_mail)
            } catch (error) {
                console.log(timestamp + "MAILER ERROR, Message: " + error)
            }

        }

        // console.log(timestamp + "data passing", distributorMail, iodMail, mailData)
    }
    , orderRecieved_GmailMailSender: async (user_id, order_id, mailData) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        /* Additional database REQUIRED DATA:
            employee_id, 
            email =  dist_mail,
            company_name,
            (d.email) iod_mail (raw tanpa proses dijadikan array)
        */


        /*
                    Time out berfungsi untuk memberikan delay
                    agar memastikan bahwa header sudah terposting
                    mencegah error karena header belum ada. 
                    waktu diatur semepet mungkin mencegah 
                    ada spare waktu antar detail
                    yang signifikan
                    */

        let userData = (await dbQuery(`SELECT su.employee_id, me.email dist_mail, mc.company_name  , group_concat(d.email) iod_mail 
                   FROM  sys_user su 
                   LEFT JOIN mst_employee me ON su.employee_id = me.employee_id
                   LEFT JOIN mst_company mc ON su.company_id = mc.company_id 
                   LEFT JOIN map_resp_for_dist a ON a.distributor_id  = su.company_id  
                   LEFT JOIN mst_team b ON a.team_id = b.team_id AND a.company_id = b.company_id 
                   LEFT JOIN mst_team_member c ON b.team_id = c.team_id AND b.company_id = c.company_id 
                   LEFT JOIN mst_employee d ON a.company_id = d.company_id AND c.employee_id = d.employee_id 
                   LEFT JOIN mst_employee e ON a.company_id = e.company_id AND b.rm_id = e.employee_id 
                   WHERE su.user_id = ${dbConf.escape(user_id)} AND b.team_category = 6;`))[0];
        let { dist_mail, company_name, iod_mail } = userData;
        let emailAnalis = iod_mail.split(',');
        console.log("userData @ mailer : ", userData, emailAnalis)

        setTimeout(async () => {


            /*
            Order data:
            header data: 
            */
            let orderHeaderData = (await dbQuery(`SELECT mo.order_id, mo.po_buyer, DATE_FORMAT(mo.po_date ,'%b %d, %Y') po_date, mc2.company_name AS ship_to  , concat(mh.harbour_name, ', ', st.txt) AS port_shipment 
        FROM m_order mo 
        LEFT JOIN mst_company mc2 ON mo.ship_to = mc2.company_id 
        LEFT JOIN map_port_for_dist mpfd ON mo.port_shipment = mpfd.harbour_id AND mo.company_id = mpfd.distributor_id 
        LEFT JOIN mst_harbour mh ON mpfd.harbour_id = mh.harbour_id 
        LEFT JOIN mst_country mc ON mh.country_id = mc.country_id 
        LEFT JOIN sys_text st ON st.text_id = mc.country_name_id AND st.lang_id = 1
        WHERE mo.order_id = ${order_id};`))[0];
            let {
                po_buyer,
                po_date,
                ship_to,
                port_shipment
            } = orderHeaderData;


            //Mail body data
            let {
                bulk,
                cont_size,
                cont_qty,
                sku_name1, sku_name2, sku_name3,
                qty1, qty2, qty3,
            } = mailData;

            //set row 2 blank if there is no skus
            let row2 = qty2 > 0 ? `<tr>
        <td style="border:1px solid black;">${sku_name2}</td>
        <td style="border:1px solid black;">${qty2}</td>
        </tr>` : '';

            //set row 3 blank if there is no skus
            let row3 = qty2 > 0 ? `<tr>
            <td style="border:1px solid black;">${sku_name3}</td>
            <td style="border:1px solid black;">${qty3}</td>
        </tr>` : '';

            let total_qty = (qty1 + qty2 + qty3)
            let container = cont_size == 1 ? '20FT' : cont_size == 2 ? '40FT' : '40HC';
            let container_type = bulk == 1 ? `${cont_qty} X` : `1 X`

            // DISTRIBUTOR
            if (!dist_mail) {

                console.log('Cannot send email because dist mail or iod_mail is not exist')

            } else {
                try {
                    await gmailTransporter.sendMail({
                        from: 'do-not-reply@indofoodinternational.com',
                        to: dist_mail,
                        subject: `[E-Order] Order Submission Successful!`,
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
                              <td>Ship to</td>
                              <td>: ${ship_to} </td>
                            </tr>
                            <tr> 
                              <td>Port Destination	</td>
                              <td>: ${port_shipment}</td>
                            </tr>
                            <tr> 
                              <td>Container	</td>
                              <td>:  ${container_type + container}</td>
                            </tr>
                            <tr> 
                              <td>Items Ordered	</td>
                              <td>: ${total_qty} </td>
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
                            <tr style="border:1px solid black;">
                                <td style="border:1px solid black;">${sku_name1}</td>
                                <td style="border:1px solid black;">${qty1}</td>
                            </tr>
                            ${row2}
                            ${row3}
                        </table>
            
                    </div>
                    <p>
                        If you have any questions or concerns, please do not hesitate to contact us via these contact:
                        <br>
                        ${iod_mail}
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
                    console.log(timestamp + 'Email Sent to' + dist_mail)

                } catch (error) {
                    console.log(timestamp + "MAILER ERROR, Message: " + error)
                }
            }

        }, 1000);
    }
    , forgotPasswordMailSender: async (targetMail, token) => {
        await transporter.sendMail({
            from: 'no-reply@indofoodinternational.com',
            to: targetMail,
            subject: 'Reset Password',
            html: `<div>
            <h4> to reset password, you can click this link or copy to your browser </h4>
            <a href='${process.env.FE_URL}/e-order/forgot-password/${token}'> 
            ${process.env.FE_URL}/e-order/forgot-password/${token} 
            </a>
            </div>`,
        })
    }


}

/*
// mail sending format
const { mailSender } = require('../config/mailer')

mailSender('frztmr.webdev@gmail.com', 'frztmr1996@gmail.com', '[Mail Test]', 'testing')
*/

/*

           const { transporter } = require('../config/mailer');

             await transporter.sendMail({
             from: 'no-reply@indofoodinternational.com',
             to: 'muhammad.asmarakusuma@icbp.indofood.co.id',
             subject: 'This is a test',
             text: "Test test",
           })
           
*/