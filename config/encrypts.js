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
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).send({ success: false, message: 'TOKEN_EXPIRED' });
                }
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
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).send({ success: false, message: 'TOKEN_EXPIRED' });
                }
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

    verifyTokenEO: (token) => {
        try {
            return jwt.verify(token, process.env.SECURITY_TOKEN_KEY);
        } catch (error) {
            throw new Error("Invalid or expired E-Order token");
        }
    },

    // ======================================================
    // 🔹 Card Generator - Employee ID Encryption (AES-256-CBC)
    // ======================================================
    /**
     * Encrypt employee/user ID for public profile URLs
     * @param {number|string} userId - The user ID to encrypt
     * @returns {string} Hex-encoded encrypted string
     */
    encryptEmployeeId: (userId) => {
        const algorithm = 'aes-256-cbc';
        // Use existing CG keys or fallback to HT keys
        const key = Crypto.scryptSync(
            process.env.SECURITY_HASH_KEY_CG || process.env.SECURITY_HASH_KEY_HT || 'default-key-32chars-here!!!!!',
            'salt',
            32
        );
        const iv = Crypto.randomBytes(16);
        const cipher = Crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(String(userId), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Prepend IV to encrypted data (IV is needed for decryption)
        return iv.toString('hex') + ':' + encrypted;
    },

    /**
     * Decrypt employee/user ID from public profile URLs
     * @param {string} encryptedId - The hex-encoded encrypted string
     * @returns {string} The original user ID
     */
    decryptEmployeeId: (encryptedId) => {
        try {
            const algorithm = 'aes-256-cbc';
            const key = Crypto.scryptSync(
                process.env.SECURITY_HASH_KEY_CG || process.env.SECURITY_HASH_KEY_HT || 'default-key-32chars-here!!!!!',
                'salt',
                32
            );
            const parts = encryptedId.split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = parts[1];
            const decipher = Crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            throw new Error("Invalid encrypted employee ID");
        }
    },
};
