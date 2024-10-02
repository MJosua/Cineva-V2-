const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');

module.exports = {
    imageUploader: (directory, filePrefix) => {
        // Define lokasi default directory
        let defaultDir = './public/image/';

        // Konfigurasi untuk multer
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                // Menentukan lokasi penyimpanan
                const pathDir = directory ? defaultDir + directory : defaultDir;

                // Melakukan pemeriksaan pathDir
                /*
                if (fs.existsSync(pathDir)) {
                    // Jika directory ada, maka akan dijalankan cb untuk menyimpan data
                    console.log(`Directory ${pathDir} exist ✅`);
                    cb(null, pathDir);
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            console.log('Error make directory :', err)
                        }
                        console.log(`Success created ${pathDir}`);
                        return cb(err, pathDir)
                    });
                }
                */

                if (fs.existsSync(pathDir)) {
                    // console.log(`Directory ${pathDir} exist ✅`);
                    cb(null, pathDir);
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            // console.log('Error make directory:', err);
                            cb(err); // Call cb with error
                        } else {
                            // console.log(`Success created ${pathDir}`);
                            cb(null, pathDir); // Call cb on success
                        }
                    });
                }

            },
            filename: (req, file, cb) => {
                jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY, (err, decode) => {
                    if (err) {
                        console.log("ERROR IN AUTH")
                    }

                    req.dataToken = decode;

                    let ext = file.originalname.split('.');

                    let time = new Date;
                    let timestamp = time.toLocaleDateString('sv-SE') + '-' + Date.now()

                    let user_id = req.dataToken.user_id + '-'

                    let newName = filePrefix + user_id + timestamp + '.' + ext[ext.length - 1];
                    // let newName = filePrefix + Date.now() + '.' + ext[ext.length - 1];
                    // console.log('New filename', newName)
                    cb(null, newName);
                })
            }
        })

        const fileFilter = (req, file, cb) => {
            // const extFilter = /\.(jpg|png|webp|jpeg|svg)/;
            const extFilter = /\.(jpg|png|webp|jpeg|svg)$/i;


            if (file.originalname.toLowerCase().match(extFilter)) {
                cb(null, true)
            } else {
                cb(new Error('Your file ext are denied ❌', false));
            }
        }

        return multer({ storage: storageUploader, fileFilter })
    },
    fileUploader: (directory, filePrefix) => {
        // Define lokasi default directory
        let defaultDir = './public/files/';

        // Konfigurasi untuk multer
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                // Menentukan lokasi penyimpanan
                const pathDir = directory ? defaultDir + directory : defaultDir;

                // Melakukan pemeriksaan pathDir 
                if (fs.existsSync(pathDir)) {
                    // console.log(`Directory ${pathDir} exist ✅`);
                    cb(null, pathDir);
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            // console.log('Error make directory:', err);
                            cb(err); // Call cb with error
                        } else {
                            // console.log(`Success created ${pathDir}`);
                            cb(null, pathDir); // Call cb on success
                        }
                    });
                }

            },
            filename: (req, file, cb) => {
                jwt.verify(req.token, process.env.KEY_TOKEN, (err, decode) => {

                    // console.log('req.data@readToken', req)
                    // console.log('Pemecah token', decode); 
                    req.dataToken = decode;

                    let ext = file.originalname.split('.');

                    let time = new Date;
                    let timestamp = time.toLocaleDateString('sv-SE') + '-' + Date.now()

                    let user_id = req.dataToken.user_id + '-'

                    let newName = filePrefix + user_id + timestamp + '.' + ext[ext.length - 1];
                    // let newName = filePrefix + Date.now() + '.' + ext[ext.length - 1];
                    // console.log('New filename', newName)
                    cb(null, newName);
                })

            }
        })

        const fileFilter = (req, file, cb) => {
            // const extFilter = /\.(jpg|png|webp|jpeg|svg)/;
            const extFilter = /\.(pdf|xls|xlsx|doc|docx|jpg|jpeg|png|)$/i;


            if (file.originalname.toLowerCase().match(extFilter)) {
                cb(null, true)
            } else {
                cb(new Error('Your file ext are denied ❌', false));
            }
        }

        return multer({ storage: storageUploader, fileFilter })
    },
    poUploader: (directory, filePrefix) => {

        // Define lokasi default directory
        let defaultDir = './public/files/';

        // Konfigurasi untuk multer
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {

                // jwt.verify(req.token, process.env.KEY_TOKEN, (err, decode) => {
                //     if (err) {
                //         return res.status(401).send({
                //             message: 'ERROR IN AUTH!'
                //         })
                //     }

                //    req.dataToken = decode;


                const pathDir = directory ? defaultDir + directory : defaultDir;
                // const pathDir = directory ? defaultDir + req.dataToken.company_id + '/' + directory : defaultDir + req.dataToken.company_id + '/';

                // Melakukan pemeriksaan pathDir 
                if (fs.existsSync(pathDir)) {
                    // console.log(`Directory ${pathDir} exist ✅`);
                    cb(null, pathDir);
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            // console.log('Error make directory:', err);
                            cb(err); // Call cb with error
                        } else {
                            // console.log(`Success created ${pathDir}`);
                            cb(null, pathDir); // Call cb on success
                        }
                    });
                }
                //})


            },
            filename: (req, file, cb) => {

                //read token
                jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY, (err, decode) => {
                    if (err) {
                        console.log("ERROR IN AUTH")
                    }
                    req.dataToken = decode;

                    let ext = file.originalname.split('.');

                    let time = new Date;
                    let timestamp = time.toLocaleDateString('sv-SE') + '-' + Date.now()

                    let user_id = req.dataToken.user_id + '-'


                    let newName = filePrefix + user_id + timestamp + '.' + ext[ext.length - 1];
                    // let newName = filePrefix + Date.now() + '.' + ext[ext.length - 1];
                    // console.log('New filename', newName)
                    cb(null, newName);
                })

            }
        })

        const fileFilter = (req, file, cb) => {
            // const extFilter = /\.(jpg|png|webp|jpeg|svg)/;
            const extFilter = /\.(pdf|xls|xlsx|doc|docx|jpg|jpeg|png|)$/i;


            if (file.originalname.toLowerCase().match(extFilter)) {
                cb(null, true)
            } else {
                cb(new Error('Your file ext are denied ❌', false));
            }
        }

        return multer({ storage: storageUploader, fileFilter })
    },
    hotsFileUploaderITSupport: (req, directory, filePrefix) => {

        // Define lokasi default directory
        let defaultDir = './public/files/hots/';

        let userData = jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY, (err, decode) => {
            if (err) {
                console.log("ERROR IN AUTH at upload")
            }
            return decode
        })

        let fileIsExist = req.files[0]

        console.log("fileIsExist", fileIsExist)
        // Konfigurasi untuk multer
        const storageUploader = multer.diskStorage({

            destination: (cb) => {

                const pathDir = directory ? defaultDir + directory : defaultDir;


                if (fs.existsSync(pathDir)) {
                    // console.log(`Directory ${pathDir} exist ✅`);
                    cb(null, pathDir);

                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            // console.log('Error make directory:', err);
                            cb(err); // Call cb with error
                        } else {
                            // console.log(`Success created ${pathDir}`);
                            cb(null, pathDir); // Call cb on success
                        }
                    });
                }


            },
            filename: (file, cb) => {

                let ext = file.originalname.split('.');


                let time = new Date;
                let timestamp = time.toLocaleDateString('sv-SE') + '-' + Date.now()

                let user_id = userData.user_id + '-'


                let newName = filePrefix + user_id + timestamp + '.' + ext[ext.length - 1];

                cb(null, newName);


            }
        })

        const fileFilter = (file, cb) => {
            const extFilter = /\.(pdf|xls|xlsx|doc|docx|jpg|jpeg|png|)$/i;


            if (file.originalname.toLowerCase().match(extFilter)) {
                cb(null, true)
            } else {
                cb(new Error('Your file ext are denied ❌', false));
            }
        }

        return multer({ storage: storageUploader, fileFilter })
    },
    hotsITSupport: (req, directory, filePrefix) => {

        // Define lokasi default directory
        let defaultDir = './public/hots/';


        // Konfigurasi untuk multer
        const storageUploader = multer.diskStorage({

            destination: (req, file, cb) => {


                let fileIsExist = req.files[0]
                console.log("fileIsExist", fileIsExist)

                const pathDir = directory ? defaultDir + directory : defaultDir;


                if (fs.existsSync(pathDir)) {
                    // console.log(`Directory ${pathDir} exist ✅`);
                    cb(null, pathDir);

                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            // console.log('Error make directory:', err);
                            cb(err); // Call cb with error
                        } else {
                            // console.log(`Success created ${pathDir}`);
                            cb(null, pathDir); // Call cb on success
                        }
                    });
                }


            },
            filename: (req, file, cb) => {

                let userData = jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY_HT, (err, decode) => {
                    if (err) {
                        console.log("ERROR IN AUTH at upload")
                    }
                    return decode
                })
                console.log("userData",userData)
                let ext = file.originalname.split('.');


                let time = new Date;
                let timestamp = time.toLocaleDateString('sv-SE') + '-' + Date.now()

                let user_id = `${userData.user_id}-`


                let newName = user_id + timestamp + '.' + ext[ext.length - 1];

                cb(null, newName);

                req.newName = newName


            }
        })

        const fileFilter = (req, file, cb) => {
            const extFilter = /\.(pdf|xls|xlsx|doc|docx|jpg|jpeg|png)$/i;

            if (file.originalname && typeof file.originalname === 'string') {
                if (file.originalname.toLowerCase().match(extFilter)) {
                    console.log(`File passed: ${file.originalname}`); // Log the file name
                    cb(null, true);  // Accept the file
                } else {
                    console.log(`File rejected: ${file.originalname}`); // Log the rejected file name
                    cb(new Error('Your file extension is denied ❌'), false);  // Reject the file
                }
            } else {
                cb(new Error('File originalname is invalid'), false);  // Handle missing or invalid file name
            }
        };

        return multer({ storage: storageUploader, fileFilter })
    },


}