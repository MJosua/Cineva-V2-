const {
    dbHots,
    dbQueryHots,
    dbQuery,
} = require("../../config/db");
const { generateTokenHT, hashPasswordHT, createTokenHT, verifyTokenHT } = require("../../config/encrypts");
const { hotsForgotPasswordMailer, hotsVerifyEmailMailer, hotsMailer } = require('../../service/mailer/hots/hots_mailer');
// const cookieParser = require('cookie-parser');
const { compare } = require('bcrypt');
const bcrypt = require('bcrypt'); // For password comparison

const jwt = require('jsonwebtoken');

let yellowTerminal = "\x1b[33m";

module.exports = {
    login: async (req, res) => {
        let date = new Date();

        let current_delv_week = (await dbQuery(`SELECT day2week(NOW()) AS wikwik;`))[0].wikwik;



        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { uid, asin } = req.body
        console.log("req.body", req.body)



        // cari username dulu
        let queryGetUid = `
                            SELECT
                                u.user_id,
                                u.employee_id,
                                u.firstname,
                                u.lastname,
                                u.role_id,
                                u.uid,
                                u.active,
                                u.login_attempt
                            FROM
                                user u
                            WHERE
                                LOWER(u.uid) = LOWER(?)
                                AND u.active = 1
                            LIMIT 1`
        let paramGetUid = [uid]


        // cari username dulu
        dbHots.execute(queryGetUid, paramGetUid, (err1, results1) => {

            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                })
                console.log(timestamp, "HOTS Auth Login : " + uid + " error message : ", err1)
            } else {

                if (!results1[0]) {
                    res.status(200).send({
                        success: false,
                        message: 'Username is not exist!'
                    })

                } else {

                    let dataLogin = results1[0]

                    if (dataLogin.login_attempt > process.env.SECURITY_TRIAL_LOGIN_HT || dataLogin.login_attempt == process.env.SECURITY_TRIAL_LOGIN_HT) {
                        res.status(500).send({
                            message: ` Too many login attempt! Please reset password by "forgot password" to login!`,
                            success: false,
                            // userData,
                            // token,
                            err: ''
                        });
                    } else if (dataLogin.login_attempt < process.env.SECURITY_TRIAL_LOGIN_HT || !dataLogin) {


                        let queryMatchUidPswd = `
                                            select
                                                u.user_id,
                                                u.firstname,
                                                u.lastname,
                                                u.uid,
                                                u.active,
                                                r.role_id,
                                                r.role_name,
                                                d.department_name,
                                                d.department_id,
                                                CONCAT(u.firstname, ' ', u.lastname) as user_name,
                                                u.superior_id,
                                                u.nik,
                                                (
                                                select
                                                    distinct 
                                                                                            JSON_ARRAYAGG(u2.superior_id)
                                                from
                                                    user u2
                                                where
                                                    superior_id is not null 
                                                                                        ) as team_leader_user_id,
                                                (
                                                select
                                                    distinct 
                                                                                            JSON_ARRAYAGG(tm.team_id)
                                                from
                                                    m_team_member tm 
                                                where
                                                    tm.user_id = u.user_id 
                                                                                        ) as team_id_linked
                                            from
                                                user u
                                            left join 
                                                                                                m_role r on
                                                u.role_id = r.role_id
                                            left join 
                                                                                                m_department d on
                                                u.department_id = d.department_id
                                                WHERE
                                                    LOWER(uid) = LOWER(?)
                                                    AND pswd = ?
                                                    AND u.role_id IN (1, 2, 4)
                    
                     `
                        let paramMatchUidPswd = [uid, asin]

                        dbHots.execute(queryMatchUidPswd, paramMatchUidPswd, (err2, results2) => {

                            if (err2) {

                                res.status(501).send({
                                    success: false,
                                    message: 'Username and Password Combination is not correct!',
                                    userData: {},
                                    tokek: ''
                                })

                                console.log(timestamp, "HOTS Auth Login : " + uid + " error message : ", err2)

                            } else if (results2[0]) {

                                let tokek = generateTokenHT(results2[0]);

                                res.status(200).send({
                                    success: true,
                                    message: `Login success! Welcome ${uid}`,
                                    userData: results2[0],
                                    tokek,
                                    current_delv_week
                                })
                                // res.status(200).cookie('tokek', tokek, {
                                //     httpOnly: true,
                                //     secure: true, // Gunakan ini hanya jika menggunakan HTTPS
                                //     maxAge: 3600000 // Cookie berlaku selama 1 jam 
                                // }).send({
                                //     success: true,
                                //     message: `Login success! Welcome ${uid}`,
                                //     userdata: results2[0],
                                //     tokek
                                // })

                                //update token dan terakhir kali login
                                dbHots.execute(`UPDATE user 
                                            SET registration_nr = ?,
                                            last_login_date = now(),
                                            login_attempt = 0
                                            WHERE uid =  ?`, [tokek, uid])

                                console.log(timestamp, "HOTS Auth Login : " + uid + " success")

                            } else {

                                let incrementAttempt = dataLogin.login_attempt + 1

                                let queryUpdate = `UPDATE  user 
                                                    SET 
                                                    login_attempt = ?,
                                                    login_trial_time = now()
                                                    WHERE user_id = ?;`

                                let paramUpdate = [incrementAttempt, dataLogin.user_id]

                                dbHots.execute(queryUpdate, paramUpdate)

                                res.status(201).send({
                                    success: false,
                                    message: ` incorrect Password! ${process.env.SECURITY_TRIAL_LOGIN_HT - dataLogin.login_attempt} attempt left!`
                                })

                                console.log(timestamp, "HOTS Auth Login : " + uid + " incorrect password")

                            }

                        })

                    }
                }
            }
        });
    }
    ,
    keepLogin: async (req, res) => {


        const date = new Date();
        const timestamp =
            yellowTerminal +
            date.toLocaleDateString("id") +
            " " +
            date.toLocaleTimeString("id") +
            " : ";

        // ============================
        // Fetch current week
        // ============================
        let current_delv_week;
        try {
            const weekRow = await dbQuery(`SELECT day2week(NOW()) AS wikwik;`);
            current_delv_week = weekRow?.[0]?.wikwik || null;
        } catch (e) {
            console.error("❌ ERROR fetching week:", e);
            return res.status(500).send({ success: false, message: "weekQuery error", details: e });
        }

        // ============================
        // Token validation
        // ============================
        if (!req.dataToken?.user_id) {
            console.warn("❌ Missing dataToken.user_id");
            return res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
        }


        const queryValidateToken = `
            SELECT registration_nr 
            FROM user 
            WHERE registration_nr = ?
        `;
        const paramValidateToken = [req.token];


        dbHots.execute(queryValidateToken, paramValidateToken, (err1, results1) => {


            if (err1) {
                console.error("❌ SQL ERROR validateToken:", err1);
                return res.status(500).send({
                    success: false,
                    message: `error at validate token`,
                    details: err1
                });
            }


            // ==========================================================
            // USER DATA QUERY
            // ==========================================================

            const queryGetUserData = `
                SELECT
                    u.user_id,
                    u.firstname,
                    u.lastname,
                    u.uid,
                    u.active,
                    r.role_id,
                    r.role_name,
                    d.department_name,
                    d.department_id,
                    u.superior_id,
                    u.nik,
    
                    (
                        SELECT JSON_ARRAYAGG(element)
                        FROM (
                            SELECT u2.superior_id AS element
                            FROM user u2
                            WHERE u2.superior_id IS NOT NULL
                            
                            UNION ALL
                            
                        

                            SELECT tta.assigned_id AS element
                            FROM t_ticket_assignment tta
                            WHERE tta.assigned_id IS NOT NULL
                            and
                            tta.assigned_type="user"
    
                            UNION ALL
    
                            SELECT tm.user_id AS element
                            FROM m_team_member tm
                            WHERE tm.team_leader = 1
                        ) AS combined
                    ) AS team_leader_user_id,
    
                    (
                        SELECT JSON_ARRAYAGG(tm.team_id)
                        FROM m_team_member tm 
                        WHERE tm.user_id = u.user_id 
                    ) AS team_id_linked
    
                FROM user u
                LEFT JOIN m_role r ON u.role_id = r.role_id
                LEFT JOIN m_department d ON u.department_id = d.department_id
    
                WHERE user_id = ?
            `;

            const paramGetUserData = [req.dataToken.user_id];


            dbHots.execute(queryGetUserData, paramGetUserData, (err2, results2) => {


                if (err2) {
                    console.error("❌ SQL ERROR getUserData:", err2);
                    return res.status(500).send({
                        success: false,
                        message: "error at keeplogin",
                        details: err2
                    });
                }


                if (!results2[0]) {
                    console.warn("⚠ No user data found");
                    return res.status(200).send({
                        success: false,
                        message: `no data`
                    });
                }

                const userData = results2[0];

                let tokek;
                try {
                    tokek = generateTokenHT(userData);
                } catch (tokenErr) {
                    console.error("❌ Token generation ERROR:", tokenErr);
                    return res.status(500).send({
                        success: false,
                        message: "Token generation failed",
                        details: tokenErr
                    });
                }

                // ============================
                // Send final response
                // ============================
                res.status(200).send({
                    success: true,
                    userData,
                    tokek,
                    current_delv_week
                });

                // ============================
                // Update DB with new token
                // ============================
                const queryUpdateToken = `
                    UPDATE user 
                    SET registration_nr = ? 
                    WHERE user_id = ?
                `;
                const paramUpdateToken = [tokek, req.dataToken.user_id];


                dbHots.execute(queryUpdateToken, paramUpdateToken, (err3) => {
                    if (err3) {
                        console.error("❌ SQL ERROR updateToken:", err3);
                    } else {
                        console.log("🟢 Token updated successfully");
                    }
                });

                console.log(timestamp, `Hots_auth KeepLogin ${req.dataToken.uid} success`);
            });

        });

    }



    , forgotPassword: async (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let uid = req.body.uid

        if (uid) {
            // Updated: Search by uid OR email using OR condition
            let queryGetEmail = `SELECT u.email, u.user_id, u.uid, u.active FROM user u WHERE u.uid = ? OR u.email = ? LIMIT 1;`;
            let ParamGetEmail = [uid, uid];

            dbHots.execute(queryGetEmail, ParamGetEmail, (err1, results1) => {

                if (err1) {
                    res.status(500).send({
                        success: false,
                        message: `An error occurred while processing your request. Please try again later.`,
                        err1
                    })

                } else {
                    if (results1[0]) {
                        // Check if account is active
                        if (results1[0].active !== 1) {
                            return res.status(200).send({
                                success: false,
                                message: "Your account is inactive. Please contact IT Department to reactivate your account."
                            });
                        }

                        let address = results1[0].email;

                        let token = generateTokenHT({ ...results1[0] })

                        if (address) {
                            hotsForgotPasswordMailer(address, token);

                            let queryUpdateToken = `UPDATE user  SET registration_nr = ? WHERE uid = ?;`
                            let paramUpdateToken = [token, results1[0].uid]

                            dbHots.execute(queryUpdateToken, paramUpdateToken, (err2) => {

                                if (err2) {
                                    console.log(timestamp, "forgotPassword", err2)
                                    res.status(500).send({
                                        success: false,
                                        message: "Failed to process your request. Please try again later."
                                    });

                                } else {
                                    res.status(200).send({
                                        success: true,
                                        message: "Reset Password Link has been sent to your email. Please check your inbox (and spam folder). Note: Email delivery may take a few minutes due to server traffic.",
                                        email: address
                                    });
                                    console.log(timestamp + '##### HOTS FORGOT PASSWORD => ' + uid + " => uid valid send to " + address)

                                }
                            })

                        } else {
                            res.status(200).send({
                                success: false,
                                message: "Your account is not linked to any email address. Please contact IT Department to update your email or reset your password manually."
                            });
                            console.log(timestamp + '##### HOTS FORGOT PASSWORD => ' + uid + " => Cannot send email! No email Address founded!")

                        }

                    } else {
                        console.log(timestamp + '##### HOTS FORGOT PASSWORD => ' + uid + " => uid invalid")

                        res.status(200).send({
                            success: false,
                            message: `User not found. Please check your username or email and try again.`
                        })
                    }

                }

            })

        } else {
            res.status(400).send({
                success: false,
                message: `Please enter your username or email address.`
            })
        }


    }
    , verifyTokenForgotPassword: async (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {

            let query = `SELECT u.uid FROM user u WHERE u.registration_nr = ?`
            let param = [req.token]

            //MEMERIKA APAKAH TOKENN MASIH ADA DI DATABASE ATAU TIDAK. 

            dbHots.execute(query, param, (err, results) => {

                if (err) {

                    res.status(500).send({
                        success: false,
                        message: err,
                    });
                }

                if (!results[0]) {

                    res.status(200).send({
                        success: false,
                        message: "OOPS! Looks like you tried to change password more than once!",
                    });

                } else {

                    if (req.dataToken.Email) {

                        res.status(200).send({
                            success: true,
                            message: "token is valid, continue =>",
                        });

                        console.log(timestamp + `auth token verification for ${req.dataToken.email}`)

                    } else {

                        res.status(500).send({
                            success: false,
                            message: "The RESET Password link has already EXPIRED. Please try to input email again",
                        });

                        console.log(timestamp + `auth token verification Failed. `)

                    }

                }

            })




        } catch (error) {
            console.log(timestamp, "verifyTokenForgotPassword", error);

            res.status(500).send({
                success: false,
                message: "error 500",
            });
        }

    }
    , changePasswordForgotPassword: async (req, res) => {


        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        try {
            let { pswd } = req.body;

            //MENNGHAPUS DATA TOKEN DARI DATABASE UNTUK MENCEGAH USER MENGANTI KEMBALI PASSWORD
            let sqlUpdateToken = await dbQueryHots(`UPDATE user SET registration_nr = ' password reseted ' WHERE email = '${req.dataToken.email}';`);

            if (req.dataToken.email) {

                let queryChangePassword = `
                            UPDATE user 
                            SET asin = ?
                            WHERE Email = ?
                            `
                let paramChangePassword = [hashPasswordHT(pswd), req.dataToken.email]

                dbHots.execute(queryChangePassword, paramChangePassword, (err1, results1) => {

                    if (err1) {
                        res.status(500).send({
                            success: false,
                            message: err1,
                        });

                    } else {

                        let queryUpdateChangePassLog = `
                        UPDATE user 
                        SET 
                        last_pswd_changed = now(),
                        login_attempt = 0 
                        WHERE Email = ?;`;
                        let paramUpdateChangePassLog = [req.dataToken.email]

                        dbHots.execute(queryUpdateChangePassLog, paramUpdateChangePassLog, (err2, results2) => {
                            if (err2) {
                                res.status(500).send({
                                    success: false,
                                    message: err2,
                                });
                            } else {

                                // Send password change confirmation email
                                const confirmationHtml = `
                                <div style="font-family: Arial, sans-serif; color: #333;">
                                    <h2>Password Changed Successfully</h2>
                                    <p>Your password has been successfully changed.</p>
                                    <p>If you did not make this change, please contact IT support immediately.</p>
                                    <p>Best regards,<br><strong>HOTS System</strong></p>
                                </div>`;
                                hotsMailer(req.dataToken.email, 'Password Changed Successfully', confirmationHtml);

                                res.status(200).send({
                                    success: true,
                                    message: "Your Password has Changed!",
                                });
                                console.log(timestamp + "Auth forgot password change for email:", req.dataToken.email);



                            }
                        })

                    }

                })



            } else {
                res.status(401).send({
                    success: false,
                    message: "unauthorized",
                });
                console.log(timestamp + "Auth forgot password change for email UNANUNUNUN bodo ah");

            }


        } catch (error) {

            console.log(timestamp, "changePasswordForgotPassword", error);

            res.status(500).send({
                success: false,
                message: "something wrong",
            });

        }


    },
    // Get User Profile
    getProfile: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        let queryGetProfile = `
        SELECT 
            u.user_id,
            u.firstname,
            u.lastname,
            u.email,
            u.phone,
            u.employee_id,
            u.role_id,
            ur.role_name,
            u.department_id,
            d.department_name,
            u.superior_id,
            CONCAT(sup.firstname, ' ', sup.lastname) as superior_name,
            u.registration_date,
            u.active,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'team_id', tm.team_id,
                        'team_name', t.team_name,
                        'team_leader', tm.team_leader
                    )
                )
                FROM m_team_member tm
                LEFT JOIN m_team t ON t.team_id = tm.team_id
                WHERE tm.user_id = u.user_id 
            ) as teams
        FROM user u
        LEFT JOIN m_role ur ON ur.role_id = u.role_id
        LEFT JOIN m_department d ON d.department_id = u.department_id
        LEFT JOIN user sup ON sup.user_id = u.superior_id
        WHERE u.user_id = ?
    `;

        dbHots.execute(queryGetProfile, [user_id], (err, results) => {
            if (err) {
                console.log(timestamp, "GET PROFILE ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }

            if (!results.length) {
                return res.status(404).send({
                    success: false,
                    message: 'User not found!'
                });
            }

            console.log(timestamp, "GET PROFILE SUCCESS");
            return res.status(200).send({
                success: true,
                message: "GET PROFILE SUCCESS",
                data: results[0]
            });
        });
    },

    register: async (req, res) => {
        const { uid, firstname, lastname, email, password, department_id } = req.body;
        console.log("start debug register hots auth");
        // ✅ 1. Basic Validation
        if (!uid || !firstname || !lastname || !email || !password || !department_id) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        try {
            // ✅ 2. Check if email/username already exists in user or user_draft
            const [existingUser] = await dbHots.promise().query(
                "SELECT user_id FROM user WHERE email = ? OR uid = ? LIMIT 1",
                [email, uid]
            );

            const [existingDraft] = await dbHots.promise().query(
                "SELECT draft_id FROM user_draft WHERE email = ? OR uid = ? LIMIT 1",
                [email, uid]
            );

            if (existingUser.length > 0 || existingDraft.length > 0) {
                return res.status(409).json({ success: false, message: "Email or username already registered." });
            }

            // ✅ 3. Hash password securely
            const hashedPassword = await bcrypt.hash(password, 10);

            // ✅ 4. Find department leader
            const [leader] = await dbHots.promise().query(`
            SELECT u.user_id AS leader_id, u.firstname, u.lastname
            FROM m_department d
            JOIN user u ON d.department_head = u.user_id
            WHERE d.department_id = ?
            LIMIT 1
          `, [department_id]);

            const leader_id = leader?.[0]?.leader_id || null;

            // ✅ 5. Insert new draft user
            const [result] = await dbHots.promise().query(`
            INSERT INTO user_draft 
            (uid, firstname, lastname, email, password_hash, department_id, leader_id, approval_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
          `, [uid, firstname, lastname, email, password, department_id, leader_id]);

            const draftId = result.insertId;

            // ✅ 6. Create a verification token (valid 30 minutes)
            const token = createTokenHT({ draft_id: draftId, email }, "30m");

            // ✅ 7. Save token in registration_token column
            await dbHots.promise().query(
                `UPDATE user_draft SET registration_token = ? WHERE draft_id = ?`,
                [token, draftId]
            );

            // ✅ 8. Send email verification link
            await hotsVerifyEmailMailer(email, token, firstname, lastname);

            return res.status(201).json({
                success: true,
                message: "Registration successful. Please verify your email address.",
            });

        } catch (err) {
            console.error("registerUser error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },


    verifyByEmail: async (req, res) => {
        const { token } = req.params;
        const date = new Date();
        console.log("verifyEmail token:", token);

        try {
            // 🔹 Verify the JWT token
            const data = verifyTokenHT(token);
            const { draft_id, email } = data;

            // 🔹 Find the draft record
            const [drafts] = await dbHots.promise().query(
                "SELECT * FROM user_draft WHERE draft_id = ? AND email = ? LIMIT 1",
                [draft_id, email]
            );

            if (!drafts.length) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired token.",
                });
            }

            const draft = drafts[0];

            if (draft.approval_status === "verified") {
                return res.status(200).json({
                    success: true,
                    message: "Your email has already been verified.",
                });
            }

            // ✅ Step 1: Mark user_draft as verified
            await dbHots.promise().query(
                `UPDATE user_draft 
             SET approval_status = 'verified', approval_date = NOW()
             WHERE draft_id = ?`,
                [draft_id]
            );

            // ✅ Step 2: Copy data into the user table
            const [insertResult] = await dbHots.promise().query(
                `INSERT INTO user (
                role_id, firstname, lastname, uid, pswd, email, 
                superior_id, active, status, registration_date
            ) VALUES (1, ?, ?, ?, ?, ?,  ?, 1, 'pending', NOW())`,
                [
                    draft.firstname,
                    draft.lastname,
                    draft.uid,
                    draft.password_hash,
                    draft.email,
                    draft.leader_id
                ]
            );

            const newUserId = insertResult.insertId;

            // ✅ Step 3: Link user_draft → user
            await dbHots.promise().query(
                `UPDATE user_draft SET user_id = ? WHERE draft_id = ?`,
                [newUserId, draft_id]
            );

            console.log(
                `${date.toLocaleString("id")} ✅ Verified user copied to 'user' table. ID: ${newUserId}`
            );

            return res.status(200).json({
                success: true,
                message:
                    "Email verified successfully. You can now log in and complete your profile.",
                user_id: newUserId,
            });
        } catch (err) {
            console.error("verifyEmail error:", err.message);

            // 🧩 Handle expired token by regenerating and resending
            try {
                const jwt = require("jsonwebtoken");
                const decoded = jwt.decode(token);

                if (decoded?.email) {
                    const [drafts] = await dbHots.promise().query(
                        "SELECT * FROM user_draft WHERE email = ? AND approval_status = 'pending'",
                        [decoded.email]
                    );

                    if (drafts.length > 0) {
                        const draft = drafts[0];

                        const newToken = createTokenHT(
                            { draft_id: draft.draft_id, email: draft.email },
                            "30m"
                        );

                        await dbHots.promise().query(
                            `UPDATE user_draft SET registration_token = ? WHERE draft_id = ?`,
                            [newToken, draft.draft_id]
                        );

                        await hotsVerifyEmailMailer(
                            draft.email,
                            newToken,
                            draft.firstname,
                            draft.lastname
                        );

                        console.log(`🟡 Resent new verification email to ${draft.email}`);

                        return res.status(200).json({
                            success: false,
                            message:
                                "Your verification link expired. A new one has been sent to your email.",
                        });
                    }
                }
            } catch (e) {
                console.error("verifyEmail recovery error:", e.message);
            }

            return res.status(400).json({
                success: false,
                message: "Verification failed or link expired.",
            });
        }
    },


    manualVerifyAndPromoteUserByUID: async (uid) => {
        const date = new Date();
        const timestamp = date.toLocaleString("id");

        try {
            // 🔹 1️⃣ Find the draft by username (uid)
            const [drafts] = await dbHots.promise().query(
                "SELECT * FROM user_draft WHERE uid = ? LIMIT 1",
                [uid]
            );

            if (!drafts.length) {
                console.log(`❌ No user_draft found for username '${uid}'`);
                return;
            }

            const draft = drafts[0];

            // Check if already verified
            if (draft.approval_status === "verified") {
                console.log(`⚠️ User '${uid}' is already verified.`);
                return;
            }

            // 🔹 2️⃣ Mark verified


            // 🔹 3️⃣ Copy to user table
            const [result] = await dbHots.promise().query(
                `INSERT INTO user (
                role_id, firstname, lastname, uid, pswd, email, 
                superior_id, active, status, registration_date
            ) VALUES (1, ?, ?, ?, ?, ?,  ?, 1, 'pending', NOW())`,
                [
                    draft.firstname,
                    draft.lastname,
                    draft.uid,
                    draft.password_hash,
                    draft.email,
                    draft.leader_id
                ]
            );

            const newUserId = result.insertId;

            // 🔹 4️⃣ Link user_draft → user
            await dbHots.promise().query(
                `UPDATE user_draft SET user_id = ? WHERE uid = ?`,
                [newUserId, uid]
            );

            await dbHots.promise().query(
                `UPDATE user_draft 
             SET approval_status = 'verified', approval_date = NOW()
             WHERE uid = ?`,
                [uid]
            );

            console.log(`✅ [${timestamp}] Manual verify complete`);
            console.log(`   → Username: ${uid}`);
            console.log(`   → Draft ID: ${draft.draft_id}`);
            console.log(`   → User created: ${newUserId} (${draft.email})`);

            // 🔹 5️⃣ Optional: Return token for testing login
            const token = createTokenHT(
                { user_id: newUserId, firstname: draft.firstname, email: draft.email },
                "4h"
            );

            console.log(`   → Token: ${token}`);

            return {
                success: true,
                user_id: newUserId,
                token,
            };
        } catch (err) {
            console.error(`❌ manualVerifyAndPromoteUserByUID error:`, err);
            return { success: false, error: err.message };
        }
    },

    approveDraft: async (req, res) => {
        const { draft_id } = req.params;
        const { decision, reason } = req.body; // decision = 'approve' or 'reject'

        try {
            const [drafts] = await dbHots.promise().query(
                "SELECT * FROM user_draft WHERE draft_id = ? LIMIT 1",
                [draft_id]
            );
            const draft = drafts[0];
            if (!draft) return res.status(404).json({ success: false, message: "Draft not found" });

            if (decision === 'reject') {
                await dbHots.promise().query(`
              UPDATE user_draft 
              SET approval_status = 'rejected', rejected_reason = ?, approval_date = NOW()
              WHERE draft_id = ?
            `, [reason, draft_id]);

                return res.json({ success: true, message: "Draft rejected successfully." });
            }

            // 1️⃣ Insert into user table
            const [userResult] = await dbHots.promise().query(`
            INSERT INTO user (
              firstname, lastname, uid, pswd, email,
              department_id, superior_id, active, status, registration_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'active', NOW())
          `, [
                draft.firstname, draft.lastname, draft.uid, draft.password_hash,
                draft.email, draft.department_id, draft.leader_id
            ]);

            const newUserId = userResult.insertId;

            // 2️⃣ Link back to user_draft
            await dbHots.promise().query(`
            UPDATE user_draft 
            SET approval_status = 'approved', approval_date = NOW(), user_id = ?
            WHERE draft_id = ?
          `, [newUserId, draft_id]);

            res.json({
                success: true,
                message: "User approved and activated successfully.",
                user_id: newUserId
            });
        } catch (err) {
            console.error("approveDraft error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },


    // / / / / // 
    pmlogin: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let { uid, asin } = req.body



        // cari username dulu
        let queryGetUid = `
                            SELECT
                                u.user_id,
                                u.employee_id,
                                u.firstname,
                                u.lastname,
                                u.role_id,
                                u.uid,
                                u.active,
                                u.login_attempt
                            FROM
                                user u
                            WHERE
                                LOWER(u.uid) = LOWER(?)
                                AND u.active = 1
                            LIMIT 1`
        let paramGetUid = [uid]


        // cari username dulu
        dbHots.execute(queryGetUid, paramGetUid, (err1, results1) => {

            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                })
                console.log(timestamp, "HOTS Auth Login : " + uid + " error message : ", err1)
            } else {

                if (!results1[0]) {
                    res.status(200).send({
                        success: false,
                        message: 'Username is not exist!'
                    })

                } else {

                    let dataLogin = results1[0]

                    if (dataLogin.login_attempt > process.env.SECURITY_TRIAL_LOGIN_HT || dataLogin.login_attempt == process.env.SECURITY_TRIAL_LOGIN_HT) {
                        res.status(500).send({
                            message: ` Too many login attempt! Please reset password by "forgot password" to login!`,
                            success: false,
                            // userData,
                            // token,
                            err: ''
                        });
                    } else if (dataLogin.login_attempt < process.env.SECURITY_TRIAL_LOGIN_HT || !dataLogin) {


                        let queryMatchUidPswd = `
                                            select
                                            u.user_id,
                                            u.firstname,
                                            u.lastname,
                                            u.uid,
                                            u.active,
                                            r.role_id,
                                            r.role_name,
                                            d.department_name,
                                            d.department_id,
                                            CONCAT(u.firstname, ' ', u.lastname) as user_name,
                                            u.superior_id,
                                            u.nik,
                                            (
                                            select distinct 
                                                JSON_ARRAYAGG(u2.superior_id)
                                            from
                                                user u2
                                            where 
                                            superior_id is not null 
                                            ) as team_leader_user_id,
                                                (
                                                select
                                                    distinct 
                                                                                            JSON_ARRAYAGG(tm.team_id)
                                                from
                                                    m_team_member tm 
                                                where
                                                    tm.user_id = u.user_id 
                                                                                        ) as team_id_linked
                                                from
                                                    user u
                                                left join 
                                                    m_role r on
                                                    u.role_id = r.role_id
                                                left join 
                                                    m_department d on
                                                    u.department_id = d.department_id
                                                WHERE
                                                    LOWER(uid) = LOWER(?)
                                                    AND pswd = ?
                                                    AND u.role_id IN (1, 2, 4)
                    
                     `
                        let paramMatchUidPswd = [uid, asin]

                        dbHots.execute(queryMatchUidPswd, paramMatchUidPswd, (err2, results2) => {

                            if (err2) {

                                res.status(501).send({
                                    success: false,
                                    message: 'Username and Password Combination is not correct!',
                                    userData: {},
                                    tokek: ''
                                })

                                console.log(timestamp, "HOTS Auth Login : " + uid + " error message : ", err2)

                            } else if (results2[0]) {

                                let tokek = generateTokenHT(results2[0]);

                                res.status(200).send({
                                    success: true,
                                    message: `Login success! Welcome ${uid}`,
                                    userData: results2[0],
                                    tokek
                                })
                                // res.status(200).cookie('tokek', tokek, {
                                //     httpOnly: true,
                                //     secure: true, // Gunakan ini hanya jika menggunakan HTTPS
                                //     maxAge: 3600000 // Cookie berlaku selama 1 jam 
                                // }).send({
                                //     success: true,
                                //     message: `Login success! Welcome ${uid}`,
                                //     userdata: results2[0],
                                //     tokek
                                // })

                                //update token dan terakhir kali login
                                dbHots.execute(`UPDATE user 
                                            SET registration_nr = ?,
                                            last_login_date = now(),
                                            login_attempt = 0
                                            WHERE uid =  ?`, [tokek, uid])

                                console.log(timestamp, "HOTS Auth Login : " + uid + " success")

                            } else {

                                let incrementAttempt = dataLogin.login_attempt + 1

                                let queryUpdate = `UPDATE  user 
                                                    SET 
                                                    login_attempt = ?,
                                                    login_trial_time = now()
                                                    WHERE user_id = ?;`

                                let paramUpdate = [incrementAttempt, dataLogin.user_id]

                                dbHots.execute(queryUpdate, paramUpdate)

                                res.status(201).send({
                                    success: false,
                                    message: ` incorrect Password! ${process.env.SECURITY_TRIAL_LOGIN_HT - dataLogin.login_attempt} attempt left!`
                                })

                                console.log(timestamp, "HOTS Auth Login : " + uid + " incorrect password")

                            }

                        })

                    }
                }
            }
        });
    },

    pmlogout: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            console.log(timestamp, `Logout for user: ${user_id}`);

            res.status(200).json({
                success: true,
                message: "Logout successful"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    pmkeepLogin: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const [users] = await dbHots.promise().query(`
            SELECT u.*, r.role_name, d.department_name, jt.job_title as title_name
            FROM m_users u
            LEFT JOIN m_role r ON u.role_id = r.role_id
            LEFT JOIN m_department d ON u.department_id = d.department_id
            LEFT JOIN m_job_title jt ON u.jobtitle_id = jt.jobtitle_id
            WHERE u.user_id = ? AND u.active = 1
        `, [user_id]);

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }

            const user = users[0];
            console.log(timestamp, `Keep login successful for user: ${user_id}`);

            res.status(200).json({
                success: true,
                message: "Token valid",
                data: {
                    user: {
                        user_id: user.user_id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        role_name: user.role_name,
                        department_name: user.department_name,
                        title_name: user.title_name
                    }
                }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    pmregister: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const { firstname, lastname, uid, email, password, role_id, department_id, team_id, jobtitle_id } = req.body;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            await dbPM.promise().query(`
                INSERT INTO pm_users 
                (firstname, lastname, uid, email, password, role_id, department_id, team_id, jobtitle_id, is_active, created_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
            `, [firstname, lastname, uid, email, hashedPassword, role_id, department_id, team_id, jobtitle_id]);

            console.log(`${timestamp}User registration success for ${email}`);

            res.status(201).json({
                success: true,
                message: "User registered successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Get user profile
    pmgetProfile: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const [result] = await dbPM.promise().query(`
                SELECT u.*, r.role_name, d.department_name, t.team_name, j.job_title
                FROM pm_users u
                LEFT JOIN pm_role r ON u.role_id = r.role_id
                LEFT JOIN pm_department d ON u.department_id = d.department_id
                LEFT JOIN pm_team t ON u.team_id = t.team_id
                LEFT JOIN pm_job_title j ON u.jobtitle_id = j.jobtitle_id
                WHERE u.user_id = ? AND u.is_deleted = 0
            `, [user_id]);

            console.log(`${timestamp}Profile fetch success for user ${user_id}`);

            res.status(200).json({
                success: true,
                data: result[0] || null
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Update user profile
    pmupdateProfile: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { firstname, lastname, email, phone, profile_picture } = req.body;

        try {
            await dbPM.promise().query(`
                UPDATE pm_users 
                SET firstname = ?, lastname = ?, email = ?, phone = ?, profile_picture = ?, updated_date = NOW()
                WHERE user_id = ?
            `, [firstname, lastname, email, phone, profile_picture, user_id]);

            console.log(`${timestamp}Profile update success for user ${user_id}`);

            res.status(200).json({
                success: true,
                message: "Profile updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Forgot password
    pmforgotPassword: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const { email } = req.body;

        try {
            const [user] = await dbPM.promise().query(`
                SELECT user_id, email, firstname, lastname FROM pm_users 
                WHERE email = ? AND is_active = 1 AND is_deleted = 0
            `, [email]);

            if (user.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

            await dbPM.promise().query(`
                UPDATE pm_users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?
            `, [resetToken, resetExpiry, user[0].user_id]);

            console.log(`${timestamp}Password reset token generated for ${email}`);

            res.status(200).json({
                success: true,
                message: "Password reset token sent",
                reset_token: resetToken // In production, send via email
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Reset password
    pmresetPassword: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        const { reset_token, new_password } = req.body;

        try {
            const [user] = await dbPM.promise().query(`
                SELECT user_id FROM pm_users 
                WHERE reset_token = ? AND reset_token_expiry > NOW() AND is_deleted = 0
            `, [reset_token]);

            if (user.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired reset token"
                });
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);

            await dbPM.promise().query(`
                UPDATE pm_users 
                SET password = ?, reset_token = NULL, reset_token_expiry = NULL, updated_date = NOW()
                WHERE user_id = ?
            `, [hashedPassword, user[0].user_id]);

            console.log(`${timestamp}Password reset success for user ${user[0].user_id}`);

            res.status(200).json({
                success: true,
                message: "Password reset successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },




    /* 
     
    */

}