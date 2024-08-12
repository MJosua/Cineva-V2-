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
            filename: (req,file, cb) => {
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
    simpleUploader: (directory, filePrefix) => {

        const storage = multer.diskStorage({
            destination: './public/image/',
            filename: (req, file, callback) => {
                callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
            },
        });

        const upload = multer({ storage });

        // Express routes
        App.post('/upload', upload.single('image'), (req, res) => {
            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }

            const imageUrl = req.file.filename;

            res.status(200).send('File uploaded and saved.');
            console.log("imgURL", imageUrl)
            // console.log("upload", upload)
            console.log("file", req.file)
            console.log("trial Uploader")
        });
    },
    // fileUploader: (directory, filePrefix) => {
    //     // Define lokasi default directory
    //     let defaultDir = './public/documents/';

    //     // Konfigurasi untuk multer
    //     const storageUploader = multer.diskStorage({
    //         destination: (req, file, cb) => {
    //             // Menentukan lokasi penyimpanan
    //             const pathDir = directory ? defaultDir + directory : defaultDir;

    //             // Melakukan pemeriksaan pathDir
    //             /*
    //             if (fs.existsSync(pathDir)) {
    //                 // Jika directory ada, maka akan dijalankan cb untuk menyimpan data
    //                 console.log(`Directory ${pathDir} exist ✅`);
    //                 cb(null, pathDir);
    //             } else {
    //                 fs.mkdir(pathDir, { recursive: true }, (err) => {
    //                     if (err) {
    //                         console.log('Error make directory :', err)
    //                     }
    //                     console.log(`Success created ${pathDir}`);
    //                     return cb(err, pathDir)
    //                 });
    //             }
    //             */

    //             if (fs.existsSync(pathDir)) {
    //                 // console.log(`Directory ${pathDir} exist ✅`);
    //                 cb(null, pathDir);
    //             } else {
    //                 fs.mkdir(pathDir, { recursive: true }, (err) => {
    //                     if (err) {
    //                         // console.log('Error make directory:', err);
    //                         cb(err); // Call cb with error
    //                     } else {
    //                         // console.log(`Success created ${pathDir}`);
    //                         cb(null, pathDir); // Call cb on success
    //                     }
    //                 });
    //             }

    //         },
    //         filename: (req, file, cb) => {
    //             // Membaca tipe data file
    //             let ext = file.originalname.split('.');

    //             let newName = filePrefix + Date.now() + '.' + ext[ext.length - 1];
    //             // console.log('New filename', newName)
    //             cb(null, newName);
    //         }
    //     })

    //     const fileFilter = (req, file, cb) => {
    //         // const extFilter = /\.(jpg|png|webp|jpeg|svg)/;
    //         const extFilter = /\.(pdf|xls|xlsx|jpg|png|jpeg)$/i;

    //         if (file.originalname.toLowerCase().match(extFilter)) {
    //             cb(null, true)
    //         } else {
    //             cb(new Error('Your file ext are denied ❌', false));
    //         }
    //     }

    //     return multer({ storage: storageUploader, fileFilter })
    // },
}