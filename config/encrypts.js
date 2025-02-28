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
    hashPassword: (pass) => {
        return Crypto.createHmac(
            process.env.SECURITY_HASH_TYPE, process.env.SECURITY_HASH_KEY).update(pass).digest("hex");
    },
    createToken: (payload, expiresIn = '30m') => {
        return jwt.sign(payload, process.env.SECURITY_TOKEN_KEY, {
            expiresIn
        });
    },
    readToken: (req, res, next) => {

        jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY, (err, decode) => {
            if (err) {
                console.log("Invalid Token Read Token ");
                return res.status(401).send({
                    message: 'ERROR IN AUTH!'
                })
            }
            // console.log("decodeded token",decode)
            req.dataToken = decode;
            next();
        })
    },



    hashPasswordTM: (pass) => {
        return Crypto.createHmac(process.env.SECURITY_HASH_TYPE_TM, process.env.SECURITY_HASH_KEY_TM).update(pass).digest("hex");
    },
    createTokenTM: (payload, expiresIn = '24h') => {
        return jwt.sign(payload, process.env.SECURITY_TOKEN_KEY_TM, {
            expiresIn
        });
    },
    readTokenTM: (req, res, next) => {

        jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY_TM, (err, decode) => {
            if (err) {
                console.log("Invalid Token Read Token readTokenTM");
                return res.status(401).send({
                    message: 'ERROR IN AUTH!'
                })
            }

            req.dataToken = decode;
            next();
        })
    },

    hashPasswordCG: (pass) => {
        return Crypto.createHmac(process.env.SECURITY_HASH_TYPE_CG, process.env.SECURITY_HASH_KEY_CG).update(pass).digest("hex");
    },
    hashIDCG: (name) => {
        return Crypto.createHmac(process.env.SECURITY_HASH_ID_TYPE_CG, process.env.SECURITY_HASH_ID_KEY_CG).update(name).digest("hex");
    },
    createTokenCG: (payload, expiresIn = '1h') => {
        return jwt.sign(payload, process.env.SECURITY_TOKEN_KEY_CG, {
            expiresIn
        });
    },
    readTokenCG: (req, res, next) => {

        jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY_CG, (err, decode) => {
            if (err) {
                return res.status(401).send({
                    message: 'ERROR IN AUTH!'
                })
            }

            req.dataToken = decode;
            next();
        })
    },

    hashPasswordHT: (pass) => {
        return Crypto.createHmac(process.env.SECURITY_HASH_TYPE_HT, process.env.SECURITY_HASH_KEY_HT).update(pass).digest("hex");
    },
    generateTokenHT: (payload, expiresIn = '1h') => {
        return jwt.sign(payload, process.env.SECURITY_TOKEN_KEY_HT, {
            expiresIn
        });
    },
    decodeTokenHT: (req, res, next) => {


        // jwt.verify(req.cookies.tokek, process.env.SECURITY_TOKEN_KEY_HT, (err, decode) => {
        jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY_HT, (err, decode) => {

            if (err) {
                console.log("Invalid Token Read Token HT");
                return res.status(401).send({
                    message: 'UNAUTHORIZED!'
                })
            }
            req.dataToken = decode;
            next();
        })
    },


}