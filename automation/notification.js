// Cron dependency
const cron = require('node-cron');
const { dbConf, dbQuery } = require(`../config/db`);
// const order = require('../controller/order');
const { notifMailDeliver } = require('../config/mailer')

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    grey: "\x1b[90m",
};

module.exports = {

    shippingMailNotification: async () => {

        // trial    
        
        console.log(`AUTOMATION => shippingMailNotification [IS READY]`);
        
        
        //prod: per Hour
        cron.schedule('0 * * * *', async () => {
            
            let date = new Date();
            let timestamp = colors.green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ' + colors.reset;
            
            //dev: per 1/2 minutes
             //cron.schedule('*/1 * * * *', async () => {

            try {

                let sqlCheckOrderProceed = await dbQuery(`
                    SELECT
                        el.is_notified,
                        me.email AS "to",
                        p.person_notice cc,
                        mo.order_id,
                        mos.status_order,
                        mo.po_buyer,
                        mc.company_name,
                        mo.created_by user_id
                    FROM
                        m_order mo
                    LEFT JOIN event_logger el ON
                        mo.order_id = el.order_id
                            AND el.event_type = 2
                    LEFT JOIN person p ON
                            mo.created_by = p.person_id
                    LEFT JOIN mst_employee me ON
                            mo.created_by = me.person_id
                    LEFT JOIN m_order_status mos ON
                            mo.status = mos.id
                    LEFT JOIN mst_company mc ON
                            mc.company_id = mo.company_id
                    WHERE
                            mo.status = 3
                            AND el.is_notified IS NULL ;`)

                /**
                 * selama masa pengembangan,pakai => AND mo.company_id = 330;
                 * kalau prod maka gausah
                 */

                // let carbon_copy = (sqlCheckOrderProceed[0].cc).split(',')
                // console.log(`carbon_copy ${carbon_copy}`)

                const sendMail = () => {
                    return sqlCheckOrderProceed.map((val) => {

                        let is_notified = val.is_notified
                        let dist_mail = val.to
                        let carbon_copy = val.cc
                        let order_id = val.order_id
                        let status_order = val.status_order
                        let po_buyer = val.po_buyer
                        let company_name = val.company_name


                        //ubah status order notif
                        let sqlCheck = dbQuery(` SELECT order_id FROM event_logger WHERE order_id = ${val.order_id};`)

                        if (sqlCheck[0]) {

                            let sqlUpdate = dbQuery(`
                            UPDATE
                                event_logger
                            SET
                                login_trial_time = now(),
                                is_notified = 1
                            WHERE order_id = ${val.order_id} `)

                            console.log(`status sqlUpdate ${JSON.stringify(sqlUpdate)}`)

                        } else {

                            let sqlInject = dbQuery(` 
                            INSERT INTO event_logger
                                (login_trial_time,  user_id, event_type, is_notified,  order_id)
                            VALUES
                                (now(),  ${val.user_id},  2,  1,  ${val.order_id} )`)

                            console.log(`status sqlInject ${JSON.stringify(sqlInject)}`)
                        }

                        if (order_id) {
                            return notifMailDeliver(
                                order_id,
                                dist_mail,
                                carbon_copy,
                                po_buyer,
                                company_name,
                            )
                        } else {
                            console.log(`${timestamp} shippingMailNotification => no notification send`)
                        }


                    }

                    )
                }
                sendMail()

                // ganti status menjadi sudah dinotif
                /*
                if (sqlCheckOrderProceed) {

                    const changeStatusNotified = async () => {

                        let sqlCheck = await dbQuery(`
                    SELECT order_id FROM event_logger WHERE order_id = ${sqlCheckOrderProceed[0].order_id};`)

                        if (sqlCheck[0]) {

                            let sqlUpdate = await dbQuery(`
                        UPDATE
                            event_logger
                        SET
                            login_trial_time = now(),
                            is_notified = 1
                        WHERE order_id = ${sqlCheckOrderProceed[0].order_id}
                        `)

                            console.log(`status sqlUpdate ${sqlUpdate}`)

                        } else {

                            let sqlInject = await dbQuery(`
                        INSERT
                        INTO
                        event_logger
                            (login_trial_time,
                                user_id,
                                event_type,
                                is_notified,
                                order_id)
                        VALUES
                            (now(),
                                ${sqlCheckOrderProceed[0].user_id},
                                2,
                                1,
                                ${sqlCheckOrderProceed[0].order_id}
                            )`)

                            console.log(`status sqlInject ${sqlInject}`)
                        }

                    }
                    changeStatusNotified()


                }  
*/

                console.log(timestamp + ` 0/1 * * * * AUTOMATION => shippingMailNotification [IS RUNNING ]`);
            } catch (error) {
                console.log('Error at proceedOrderMailNotification, ' + error)
            }

        });
    },
    callInsertSO: async () => {

        console.log(`AUTOMATION => CALL insert_so [IS READY]`);

        // per minutes
        cron.schedule('*/15 * * * *', async () => {

            let date = new Date();
            let timestamp = colors.green + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ' + colors.reset;

            try {
                let sql = await dbQuery(`CALL insert_so`)
                console.log(timestamp + ` */15 * * * * AUTOMATION => call insert_so [WAS DONE]:` +  JSON.stringify(sql.affectedRows));
            } catch (error) {
                console.log(timestamp + 'Error at callInsertSO, ' + error)
            }
        })


    }

}