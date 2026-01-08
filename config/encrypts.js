const Crypto = require('crypto');
const jwt = require('jsonwebtoken');

/*
DAFTAR ISTILAH: 

=> TANPA ISTILAH: i2i dan e-Order
=> TM: TradeMark Management App
=> SM: Sales Management App
=> CG: Card Generator App
=> HT: HOTS-IOD

*/

module.exports = {
    // ======================================================
    // 🔹 Default App (e-Order)
    // ======================================================
    hashPassword: (pass) => {
        return Crypto.createHmac(
            process.env.SECURITY_HASH_TYPE,
            process.env.SECURITY_HASH_KEY
        ).update(pass).digest("hex");
    },

    createToken: (payload, expiresIn = '30m') => {
        return jwt.sign(payload, process.env.SECURITY_TOKEN_KEY, { expiresIn });
    },

    readToken: (req, res, next) => {
        jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY, (err, decode) => {
            if (err) {
                console.log("Invalid Token Read Token");
                return res.status(401).send({ message: 'ERROR IN AUTH!' });
            }
            req.dataToken = decode;
            next();
        });
    },

    // ======================================================
    // 🔹 TM (TradeMark Management)
    // ======================================================
    hashPasswordTM: (pass) => {
        return Crypto.createHmac(
            process.env.SECURITY_HASH_TYPE_TM,
            process.env.SECURITY_HASH_KEY_TM
        ).update(pass).digest("hex");
    },

    createTokenTM: (payload, expiresIn = '24h') => {
        return jwt.sign(payload, process.env.SECURITY_TOKEN_KEY_TM, { expiresIn });
    },

    readTokenTM: (req, res, next) => {
        jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY_TM, (err, decode) => {
            if (err) {
                console.log("Invalid Token Read Token TM");
                return res.status(401).send({ message: 'ERROR IN AUTH!' });
            }
            req.dataToken = decode;
            next();
        });
    },

    // ======================================================
    // 🔹 CG (Card Generator)
    // ======================================================
    hashPasswordCG: (pass) => {
        return Crypto.createHmac(
            process.env.SECURITY_HASH_TYPE_CG,
            process.env.SECURITY_HASH_KEY_CG
        ).update(pass).digest("hex");
    },

    hashIDCG: (name) => {
        return Crypto.createHmac(
            process.env.SECURITY_HASH_ID_TYPE_CG,
            process.env.SECURITY_HASH_ID_KEY_CG
        ).update(name).digest("hex");
    },

    createTokenCG: (payload, expiresIn = '1h') => {
        return jwt.sign(payload, process.env.SECURITY_TOKEN_KEY_CG, { expiresIn });
    },

    readTokenCG: (req, res, next) => {
        jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY_CG, (err, decode) => {
            if (err) {
                return res.status(401).send({ message: 'ERROR IN AUTH!' });
            }
            req.dataToken = decode;
            next();
        });
    },

    // ======================================================
    // 🔹 HT (HOTS - Help Order Ticket System)
    // ======================================================
    hashPasswordHT: (pass) => {
        return Crypto.createHmac(
            process.env.SECURITY_HASH_TYPE_HT,
            process.env.SECURITY_HASH_KEY_HT
        ).update(pass).digest("hex");
    },

    generateTokenHT: (payload, expiresIn = '1h') => {
        return jwt.sign(payload, process.env.SECURITY_TOKEN_KEY_HT, { expiresIn });
    },

    decodeTokenHT: (req, res, next) => {
        jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY_HT, (err, decode) => {
            if (err) {
                console.log("Invalid Token Read Token HT - Error:", err.message);
                return res.status(401).send({ message: 'UNAUTHORIZED!' });
            }
            req.dataToken = decode;
            next();
        });
    },

    // ======================================================
    // 🔹 HOTS Custom Verification Helpers (for email verify links)
    // ======================================================
    createTokenHT: (payload, expiresIn = '30m') => {
        return jwt.sign(payload, process.env.SECURITY_TOKEN_KEY_HT, { expiresIn });
    },

    verifyTokenHT: (token) => {
        try {
            return jwt.verify(token, process.env.SECURITY_TOKEN_KEY_HT);
        } catch (error) {
            throw new Error("Invalid or expired HOTS token");
        }
    },
};
