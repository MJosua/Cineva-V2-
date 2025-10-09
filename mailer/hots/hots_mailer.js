const nodemailer = require("nodemailer");
const { dbConf, dbQuery, dbTMQuery, dbHots } = require("../../config/db");
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
        console.log("=========================PRODUCTION=========================")
        return true;
    } else {
        console.log("=========================DEVELOPMENT=========================")
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

    //hots 
    hotsMailer: async (emailAdress, mailSubject, mailBody) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {

            if (emailAdress, mailSubject, mailBody) {
                await transporter.sendMail({
                    from: 'HOTS-noreply@indofoodinternational.com',
                    to: emailAdress,
                    subject: `[IOD HOTS] ${mailSubject}`,
                    html: `${mailBody}`,
                })

                console.log(`${timestamp} Cannot Send Mail! emailAdress, mailSubject, mailBody is invalid or not exist`)

            } else {

                console.log(`${timestamp} Sending Mail to ${emailAdress} with mailSubject : ${mailSubject}`)
            }

        } catch (error) {

            console.log(`${timestamp} Error sending mail to ${emailAdress} error message: ${error}`)

        }



    },

    hotsForgotPasswordMailer: async (address, token) => {
        let date = new Date();
        let timestamp =
            date.toLocaleDateString("id") + " " + date.toLocaleTimeString("id") + " : ";

        try {
            const info = await transporter.sendMail({
                from: mailaccount,
                to: address,
                subject: "Reset Password",
                html: `
              <div>
                <h3>To reset your password, copy this URL into an incognito browser tab or click the link below:</h3>
                <br>
                <a href="${process.env.FE_URL_HOTS}/forgot-password/${token}">
                  ${process.env.FE_URL_HOTS}/forgot-password/${token}
                </a>
                <br><br>
                <h4>Please do not share this link with anyone.</h4>
              </div>
            `,
            });



            console.log(`${timestamp} ✅ Email sent to ${address}`);
            console.log(`Message ID: ${info.messageId}`);
            console.log(`Response: ${info.response}`);
        } catch (error) {
            console.error(`${timestamp} ❌ ERROR sending mail to ${address}`);
            console.error(error);
        }
    },


    hotsSubmitMailer: async (test = "false", ticket_id, user_name, service_name, mailAddress,) => {
        let date = new Date();
        let timestamp =
            date.toLocaleDateString("id") + " " + date.toLocaleTimeString("id") + " : ";


        const [dataResult] = await dbHots.promise().execute(
            "SELECT order_col, cstm_col, lbl_col FROM t_ticket_detail WHERE ticket_id = ?",
            [ticket_id]
        );

        if (test) {
            console.log("Ticket ID param:", ticket_id);
            console.table(dataResult);
        }

        const itemIndex = dataResult.findIndex(r => r.lbl_col === 'Item Name');

        let requestRows = [];
        let itemRows = [];

        if (itemIndex !== -1) {
            requestRows = dataResult.slice(0, itemIndex);        // before Item Name
            itemRows = dataResult.slice(itemIndex);              // from Item Name onwards
        } else {
            requestRows = dataResult; // if no Item Name, everything goes here
            itemRows = [];
        }

        // Generate first table
        const requestTable = requestRows.map(row => `
            ${row.cstm_col ?
                `
            <tr>
                <th style="text-align:left">${row.lbl_col}</th>
                <td style="padding-left:20px;">: ${row.cstm_col || ''}</td>
            </tr>
                `
                :
                ``
            }
        `).join('');

        // Generate second table
        let itemsTable = '';

        if (itemRows.length > 0) {
            itemsTable += `
                 <tr>
                    <th style="border:2px solid black; padding: 8px; background-color: #f2f2f2;">No</th>
                    <th style="border:2px solid black; padding: 8px; background-color: #f2f2f2;">Item Name</th>
                    <th style="border:2px solid black; padding: 8px; background-color: #f2f2f2;">Qty Pcs</th>
                    <th style="border:2px solid black; padding: 8px; background-color: #f2f2f2;">Qty Ctn</th>
                 </tr>
            `;
        }
        let totalPcs = 0;
        let totalCtn = 0;
        let totalQty = 0;
        for (let i = 0; i < itemRows.length; i++) {
            if (itemRows[i].lbl_col === 'Item Name') {
                const itemName = itemRows[i].cstm_col;

                const qty = (itemRows[i + 1] && itemRows[i + 1].lbl_col === 'Quantity + Unit')
                    ? itemRows[i + 1].cstm_col
                    : '';

                const qtypcs = (itemRows[i + 1] && itemRows[i + 1].lbl_col === 'Quantity + Unit' && itemRows[i + 1].cstm_col.toLowerCase().includes('pcs'))
                    ? itemRows[i + 1].cstm_col
                    : '';

                const qtyctn = (itemRows[i + 1] && itemRows[i + 1].lbl_col === 'Quantity + Unit' && itemRows[i + 1].cstm_col.toLowerCase().includes('ctn'))
                    ? itemRows[i + 1].cstm_col
                    : '';

                let pcs = '', ctn = '';

                if (qty.toLowerCase().includes('pcs')) {
                    pcs = qty;
                    const val = parseInt(qty);
                    if (!isNaN(val)) totalPcs += val;
                }

                if (qty.toLowerCase().includes('ctn')) {
                    ctn = qty;
                    const val = parseInt(qty);
                    if (!isNaN(val)) totalCtn += val;
                }

                const qtyNumber = parseFloat(qty) || 0;
                totalQty += qtyNumber;

                itemsTable += `
            <tr>
                <td style="border:2px solid black; padding: 8px;">${(itemsTable.match(/<tr>/g) || []).length}</td>
                <td style="border:2px solid black; padding: 8px;">${itemName}</td>
                <td style="border:2px solid black; padding: 8px;">${qtypcs}</td>
                <td style="border:2px solid black; padding: 8px;">${qtyctn}</td>
            </tr>
        `;
            }
        }

        if (totalQty > 0) {
            itemsTable += `
            <tr>
                <td colspan="2" style="border:2px solid black; padding: 8px; font-weight:bold;">Total</td>
                <td style="border:2px solid black; padding: 8px; font-weight:bold;">${totalPcs}</td>
                <td style="border:2px solid black; padding: 8px; font-weight:bold;">${totalCtn}</td>
            </tr>
        `;
        }

        const [approvalResult] = await dbHots.promise().execute(
            ` SELECT ae.approval_order, ae.approval_status, 
              CONCAT(u.firstname, ' ', u.lastname) as user_name
                from 
                t_approval_event ae
                left join 
                user u on ae.approver_id = u.user_id
                where approval_id = ? and approver_leader = 1`,
            [ticket_id]
        );

        if (test) {
            console.table(approvalResult);
        }



        const approvalTable = approvalResult.map(row => `
            <tr >
                <th style="text-align:left;border:2px solid black; padding: 8px; font-weight:bold;">${row.user_name}</th>
                <td style=" border:2px solid black; text-align : center;  "  > ${row.approval_status === 0 ? "📝" : "✅"}  </td>
            </tr>
        `).join('');

        const dateOnly = date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }); 

        const htmlContent = `
        <div>
            <p>
            Dear ${user_name},
            Your ${service_name} ticket has been successfully submitted to the HOTS system. The ticket details are as follows:
            </p>
            <br>

            <h2> Ticket Detail </h2>

            <table style="border-collapse: collapse; text-align:left; border: none;">
                <tr>
                    <th style="text-align:left">Ticket No</th>
                    <td style="padding-left:20px;">: ${ticket_id}</td>
                </tr>

                <tr>
                    <th style="text-align:left">Request Date</th>
                    <td style="padding-left:20px;">: ${dateOnly}</td>
                </tr>

                <tr>
                    <th style="text-align:left">Requested By</th>
                    <td style="padding-left:20px;">: ${user_name}</td>
                </tr>

                ${requestTable}

            </table>


            <br>
            ${itemsTable &&
            `
            <h2>
                ITEM LIST
            </h2>
            `
            }
        

            <table style="border:2px solid black; border-collapse: collapse; width: 100%; max-width: 600px; font-family: Arial, sans-serif;">
  
          
  
                ${itemsTable}

            </table>
            
            
            ${approvalTable &&

            `
<br>
            <h2> Approval List </h2>

                        <table style="border:2px solid black; border-collapse: collapse; width: 100%; max-width: 600px; font-family: Arial, sans-serif;">
                
                            ${approvalTable}

                        </table>
            `



            }
            


            <p>
            Best regards,

            <strong>
                HOTS
            </strong>
            </p>

        </div>
        `;

        if (test) {
            console.log("html", htmlContent)
        }

        // try {
        //     const info = await transporter.sendMail({
        //         from: mailaccount,
        //         to: mailAddress,
        //         subject: `[HOTS] - ${service_name} Submission Confirmation - Ticket No. ${ticket_id}`,
        //         html: htmlContent,
        //     });

        //     if (test) {
        //         console.log("html", htmlContent)
        //     }

        //     console.log(`${timestamp} ✅ Email sent to ${mailAddress} `);
        //     console.log(`Message ID: ${info.messageId} `);
        //     console.log(`Response: ${info.response} `);
        // } catch (error) {
        //     console.error(`${timestamp} ❌ ERROR sending hotsSubmitMailer mail to ${mailAddress} `);
        //     console.error(error);
        // }
    },

    hotsApproveRequest: async (test = "false", ticket_id,) => {
        let date = new Date();
        let timestamp =
            date.toLocaleDateString("id") + " " + date.toLocaleTimeString("id") + " : ";



        const [dataResult] = await dbHots.promise().execute(
            `SELECT td.order_col, td.cstm_col, td.lbl_col,
            ms.service_name,
            CONCAT(u.firstname, ' ', u.lastname) as user_name,
            t.current_step
            FROM 
            t_ticket_detail td
            LEFT JOIN
            t_ticket t ON t.ticket_id = td.ticket_id
            LEFT JOIN
            m_service ms ON ms.service_id = t.service_id
            LEFT JOIN
            user u ON u.user_id = t.created_by 
            WHERE td.ticket_id = ?`,
            [ticket_id]
        );
        console.log("dataResult",dataResult[0])
        const service_name = dataResult[0].service_name;
        const user_name = dataResult[0].user_name;
        const currentstep = dataResult[0].current_step;

        const [approvalResult] = await dbHots.promise().execute(
            ` SELECT ae.approval_order, ae.approval_status, 
              CONCAT(u.firstname, ' ', u.lastname) as user_name,
              u.email
                from 
                t_approval_event ae
                left join 
                user u on ae.approver_id = u.user_id
                where approval_id = ? `,
            [ticket_id]
        );

        const emailAddresses = approvalResult
            .filter(item => Number(item.approval_order) === Number(currentstep) && !!item.email)
            .map(item => item.email);

        if (!emailAddresses || emailAddresses.length === 0) {
            console.log("approvalResult", approvalResult)
            console.log("currentstep", currentstep)
            console.log("emailAddress", emailAddresses)
            console.log("No email address, nothing to send");
            return 0;
        }


        if (test) {
            console.log("Ticket ID param:", ticket_id);
            console.table(dataResult);
        }

        const itemIndex = dataResult.findIndex(r => r.lbl_col === 'Item Name');

        let requestRows = [];
        let itemRows = [];

        if (itemIndex !== -1) {
            requestRows = dataResult.slice(0, itemIndex);        // before Item Name
            itemRows = dataResult.slice(itemIndex);              // from Item Name onwards
        } else {
            requestRows = dataResult; // if no Item Name, everything goes here
            itemRows = [];
        }

        // Generate first table
        const requestTable = requestRows.map(row => `
            ${row.cstm_col ?
                `
            <tr>
                <th style="text-align:left">${row.lbl_col}</th>
                <td style="padding-left:20px;">: ${row.cstm_col || ''}</td>
            </tr>
                `
                :
                ``
            }
           
        `).join('');

        // Generate second table
        let itemsTable = '';

        if (itemRows.length > 0) {
            itemsTable += `
                 <tr>
                    <th style="border:2px solid black; padding: 8px; background-color: #f2f2f2;">No</th>
                    <th style="border:2px solid black; padding: 8px; background-color: #f2f2f2;">Item Name</th>
                    <th style="border:2px solid black; padding: 8px; background-color: #f2f2f2;">Qty Pcs</th>
                    <th style="border:2px solid black; padding: 8px; background-color: #f2f2f2;">Qty Ctn</th>
                 </tr>
            `;
        }

        let totalPcs = 0;
        let totalCtn = 0;
        let totalQty = 0;
        for (let i = 0; i < itemRows.length; i++) {
            if (itemRows[i].lbl_col === 'Item Name') {
                const itemName = itemRows[i].cstm_col;

                const qty = (itemRows[i + 1] && itemRows[i + 1].lbl_col === 'Quantity + Unit')
                    ? itemRows[i + 1].cstm_col
                    : '';

                const qtypcs = (itemRows[i + 1] && itemRows[i + 1].lbl_col === 'Quantity + Unit' && itemRows[i + 1].cstm_col.toLowerCase().includes('pcs'))
                    ? itemRows[i + 1].cstm_col
                    : '';

                const qtyctn = (itemRows[i + 1] && itemRows[i + 1].lbl_col === 'Quantity + Unit' && itemRows[i + 1].cstm_col.toLowerCase().includes('ctn'))
                    ? itemRows[i + 1].cstm_col
                    : '';

                let pcs = '', ctn = '';

                if (qty.toLowerCase().includes('pcs')) {
                    pcs = qty;
                    const val = parseInt(qty);
                    if (!isNaN(val)) totalPcs += val;
                }

                if (qty.toLowerCase().includes('ctn')) {
                    ctn = qty;
                    const val = parseInt(qty);
                    if (!isNaN(val)) totalCtn += val;
                }

                const qtyNumber = parseFloat(qty) || 0;
                totalQty += qtyNumber;

                itemsTable += `
            <tr>
                <td style="border:2px solid black; padding: 8px;">${(itemsTable.match(/<tr>/g) || []).length}</td>
                <td style="border:2px solid black; padding: 8px;">${itemName}</td>
                <td style="border:2px solid black; padding: 8px;">${qtypcs}</td>
                <td style="border:2px solid black; padding: 8px;">${qtyctn}</td>
            </tr>
        `;
            }
        }

        if (totalQty > 0) {
            itemsTable += `
            <tr>
                <td colspan="2" style="border:2px solid black; padding: 8px; font-weight:bold;">Total</td>
                <td style="border:2px solid black; padding: 8px; font-weight:bold;">${totalPcs}</td>
                <td style="border:2px solid black; padding: 8px; font-weight:bold;">${totalCtn}</td>
            </tr>
        `;
        }





        if (test) {
            console.table(approvalResult);
        }



        const approvalTable = approvalResult.map(row => `
            <tr >
                <th style="text-align:left;border:2px solid black; padding: 8px; font-weight:bold;">${row.user_name}</th>
                <td style=" border:2px solid black; text-align : center;  "  > ${row.approval_status === 0 ? "📝" : "✅"}  </td>
            </tr>
        `).join('');

        const htmlContent = `
        <div>
            <p>
            Dear Approver,
            You have a pending approval request for the following:
            </p>
            <br>

            <h2> Ticket Detail </h2>
            <table style="border-collapse: collapse; text-align:left; border: none;">
                <tr>
                    <th style="text-align:left">Ticket No</th>
                    <td style="padding-left:20px;">: ${ticket_id}</td>
                </tr>

                <tr>
                    <th style="text-align:left" >Request Date</th>
                    <td style="padding-left:20px;">: ${date}</td>
                </tr>

                <tr>
                    <th style="text-align:left">Requested By</th>
                    <td style="padding-left:20px;">: ${user_name}</td>
                </tr>

                ${requestTable}

            </table>


            <br>
            ${itemsTable &&
            `
            <h2>
                ITEM LIST
            </h2>
            `
            }
        

            <table style="border:2px solid black; border-collapse: collapse; width: 100%; max-width: 600px; font-family: Arial, sans-serif;">
  
          
  
                ${itemsTable}

            </table>
 
            <p style="font-weight:900; text-align:center;">
            Click this to visit the Hots Task Page, please login first and click again if not directly sending you to the ticket detail page :
            <br>
            <a style="font-weight:700;" href="https://www.indofoodinternational.com/hots/ticket/${ticket_id}">Click Me</a>
            </p>
            
            ${approvalTable &&

            `
<br>
            <h2> Approval List </h2>

                        <table style="border:2px solid black; border-collapse: collapse; width: 100%; max-width: 600px; font-family: Arial, sans-serif;">
                
                            ${approvalTable}

                        </table>
            `



            }
            


            <p>
            Best regards,

            <strong>
                HOTS
            </strong>
            </p>

        </div>
        `;

        if (test) {
            console.log("html", htmlContent)
        }

        // try {
        //     const info = await transporter.sendMail({
        //         from: mailaccount,
        //         to: emailAddresses,
        //         subject: `[HOTS] - ${service_name} Approval Notification - Ticket No. ${ticket_id}`,
        //         html: htmlContent,
        //     });

        //     if (test) {
        //         console.log("html", htmlContent)
        //     }

        //     console.log(`${timestamp} ✅ Email sent to ${emailAddresses} `);
        //     console.log(`Message ID: ${info.messageId} `);
        //     console.log(`Response: ${info.response} `);
        // } catch (error) {
        //     console.error(`${timestamp} ❌ ERROR sending hotsApproveRequest mail to ${emailAddresses} `);
        //     console.error(error);
        // }
    },




}
