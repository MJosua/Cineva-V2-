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
    hotsFileUploaderITSupport: (directory, filePrefix) => {
        // Define lokasi default directory
        let defaultDir = './public/files/hots/';

        // Konfigurasi untuk multer
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                const pathDir = directory ? defaultDir + directory : defaultDir;
                if (fs.existsSync(pathDir)) {
                    cb(null, pathDir);
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, pathDir);
                        }
                    });
                }
            },
            filename: (req, file, cb) => {
                let userData = jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY_HT, (err, decode) => {
                    if (err) {
                        return cb(new Error('Authentication failed'));
                    }
                    return decode;
                });
                let ext = file.originalname.split('.');
                let time = new Date;
                let timestamp = time.toLocaleDateString('sv-SE') + '-' + Date.now()
                let user_id = userData ? `${userData.user_id}-` : 'anon-';
                let prefix = filePrefix || '';
                let newName = prefix + user_id + timestamp + '.' + ext[ext.length - 1];

                cb(null, newName);
                req.newName = newName;
            }
        })

        const fileFilter = (req, file, cb) => {
            const extFilter = /\.(pdf|xls|xlsx|doc|docx|jpg|jpeg|png)$/i;
            if (file.originalname && typeof file.originalname === 'string') {
                if (file.originalname.toLowerCase().match(extFilter)) {
                    cb(null, true);
                } else {
                    cb(new Error('Your file extension is denied ❌'), false);
                }
            } else {
                cb(new Error('Invalid file name ❌'), false);
            }
        };

        return multer({ storage: storageUploader, fileFilter })
    },
    hotsITSupport: (directory, filePrefix) => {
        // Define lokasi default directory
        let defaultDir = './public/files/hots/';

        // Konfigurasi untuk multer
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                const pathDir = directory ? defaultDir + directory : defaultDir;

                if (fs.existsSync(pathDir)) {
                    cb(null, pathDir);
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, pathDir);
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
                let ext = file.originalname.split('.');
                let time = new Date;
                let timestamp = time.toLocaleDateString('sv-SE') + '-' + Date.now()
                let user_id = userData ? `${userData.user_id}-` : 'anon-';
                let prefix = filePrefix || '';
                let newName = prefix + user_id + timestamp + '.' + ext[ext.length - 1];

                cb(null, newName);
                req.newName = newName;
            }
        })

        const fileFilter = (req, file, cb) => {
            const extFilter = /\.(pdf|xls|xlsx|doc|docx|jpg|jpeg|png)$/i;

            if (file.originalname && typeof file.originalname === 'string') {
                if (file.originalname.toLowerCase().match(extFilter)) {
                    cb(null, true);
                } else {
                    cb(new Error('Your file extension is denied ❌'), false);
                }
            } else {
                cb(new Error('File originalname is invalid'), false);
            }
        };

        return multer({ storage: storageUploader, fileFilter })
    },
    hotsITComment: (directory, filePrefix) => {
        // Define the default directory
        let defaultDir = './public/files/hots/';

        // Multer storage configuration
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                const pathDir = directory ? defaultDir + directory : defaultDir;
                if (fs.existsSync(pathDir)) {
                    cb(null, pathDir);
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, pathDir);
                        }
                    });
                }
            },
            filename: (req, file, cb) => {
                let userData = jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY_HT, (err, decode) => {
                    if (err) {
                        return cb(new Error('Authentication failed'));
                    }
                    return decode;
                });
                let ext = file.originalname.split('.');
                let time = new Date();
                let timestamp = time.toLocaleDateString('sv-SE') + '-' + Date.now();
                let user_id = userData ? `${userData.user_id}-` : 'anon-';
                let prefix = filePrefix || '';
                let newName = prefix + user_id + timestamp + '.' + ext[ext.length - 1];

                cb(null, newName);
                req.newName = newName;
            }
        });

        const fileFilter = (req, file, cb) => {
            const extFilter = /\.(pdf|xls|xlsx|doc|docx|jpg|jpeg|png)$/i;
            if (file.originalname && typeof file.originalname === 'string') {
                if (file.originalname.toLowerCase().match(extFilter)) {
                    cb(null, true);
                } else {
                    cb(new Error('Your file extension is denied ❌'), false);
                }
            } else {
                cb(new Error('Invalid file name ❌'), false);
            }
        };

        return multer({ storage: storageUploader, fileFilter });
    },
    hotsTempUploader: (directory, filePrefix) => {
        // Define lokasi default directory for temp uploads
        let defaultDir = './public/files/hots/temp/';

        // Konfigurasi untuk multer
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                const pathDir = directory ? defaultDir + directory : defaultDir;

                if (fs.existsSync(pathDir)) {
                    cb(null, pathDir);
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, pathDir);
                        }
                    });
                }
            },
            filename: (req, file, cb) => {
                let userData = jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY_HT, (err, decode) => {
                    if (err) {
                        // console.log("ERROR IN AUTH at temp upload")
                    }
                    return decode;
                });
                let ext = file.originalname.split('.');
                let time = new Date;
                let timestamp = time.toLocaleDateString('sv-SE') + '-' + Date.now();
                let user_id = userData ? `${userData.user_id}-` : 'anon-';
                let prefix = filePrefix || 'temp-';
                let newName = prefix + user_id + timestamp + '.' + ext[ext.length - 1];

                cb(null, newName);
                req.newName = newName;
            }
        });

        const fileFilter = (req, file, cb) => {
            // Allow images, documents, and archives for temp upload
            const extFilter = /\.(pdf|xls|xlsx|doc|docx|jpg|jpeg|png|zip|rar|7z)$/i;

            if (file.originalname && typeof file.originalname === 'string') {
                if (file.originalname.toLowerCase().match(extFilter)) {
                    cb(null, true);
                } else {
                    cb(new Error('Your file extension is denied ❌'), false);
                }
            } else {
                cb(new Error('File originalname is invalid'), false);
            }
        };

        return multer({
            storage: storageUploader,
            fileFilter,
            limits: { fileSize: 50 * 1024 * 1024 } // 50MB Limit (Increased from 3.6MB)
        });
    },
    eventDoorPrize: (req, directory, filePrefix) => {

        // Define the default directory
        let defaultDir = './public/files/DoorPrize/';

        // Multer storage configuration
        const storageUploader = multer.diskStorage({

            // Define destination for uploaded files
            destination: (req, file, cb) => {
                // Check if the first file exists in req.files
                let fileIsExist = req.files && req.files[0];
                console.log("fileIsExist:", fileIsExist);

                // Define the path where the files will be stored
                const pathDir = directory ? defaultDir + directory : defaultDir;

                // Check if the directory exists, if not create it
                if (fs.existsSync(pathDir)) {
                    cb(null, pathDir);  // Directory exists, proceed to store the file
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            console.log('Error creating directory:', err);
                            cb(err);  // Call cb with the error
                        } else {
                            console.log(`Directory created: ${pathDir}`);
                            cb(null, pathDir);  // Directory created successfully
                        }
                    });
                }
            },

            // Define the filename for uploaded files
            filename: (req, file, cb) => {

                // Split the original filename to get the extension
                let ext = file.originalname.split('.');

                // Generate a timestamp for the file name
                let time = new Date();
                let timestamp = time.toLocaleDateString('sv-SE') + '-' + Date.now();

                // Generate the new filename with the user ID and timestamp
                let newName = timestamp + '.' + ext[ext.length - 1];

                cb(null, newName);  // Pass the new filename to multer

                // Save the new filename to req for later use
                req.newName = newName;
            }
        });

        // File filter to accept only specific file types
        const fileFilter = (req, file, cb) => {
            // Allowed file extensions
            const extFilter = /\.(pdf|xls|xlsx|doc|docx|jpg|jpeg|png)$/i;

            if (file.originalname && typeof file.originalname === 'string') {
                if (file.originalname.toLowerCase().match(extFilter)) {
                    console.log(`File passed: ${file.originalname}`);  // Log accepted file
                    cb(null, true);  // Accept the file
                } else {
                    console.log(`File rejected: ${file.originalname}`);  // Log rejected file
                    cb(new Error('Your file extension is denied ❌'), false);  // Reject the file
                }
            } else {
                cb(new Error('Invalid file name ❌'), false);  // Handle missing or invalid file name
            }
        };

        // Return multer configuration with storage and file filter
        return multer({ storage: storageUploader, fileFilter });
    },
    hotsPS: (req, directory, filePrefix) => {

        let date = new Date();
        let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        // Define the default directory
        let defaultDir = './public/files/hots/';

        // Multer storage configuration
        const storageUploader = multer.diskStorage({

            // Define destination for uploaded files
            destination: (req, file, cb) => {
                // Check if the first file exists in req.files
                let fileIsExist = req.files && req.files[0];
                console.log(timestamp, "UPLOADER fileIsExist:", fileIsExist);

                // Define the path where the files will be stored
                const pathDir = directory ? defaultDir + directory : defaultDir;

                // Check if the directory exists, if not create it
                if (fs.existsSync(pathDir)) {
                    cb(null, pathDir);  // Directory exists, proceed to store the file
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => {
                        if (err) {
                            console.log(timestamp, 'UPLOADER Error creating directory:', err);
                            cb(err);  // Call cb with the error
                        } else {
                            console.log(timestamp, `UPLOADER Directory created: ${pathDir}`);
                            cb(null, pathDir);  // Directory created successfully
                        }
                    });
                }
            },

            // Define the filename for uploaded files
            filename: (req, file, cb) => {
                // Verify the user token to extract user data
                let userData = jwt.verify(req.token, process.env.SECURITY_TOKEN_KEY_HT, (err, decode) => {
                    if (err) {
                        console.log(timestamp, "UPLOADER Error in authentication during file upload");
                        return cb(new Error('Authentication failed'));
                    }
                    return decode;
                });

                // console.log(timestamp, " UPLOADER userData:", userData);

                // Split the original filename to get the extension
                let ext = file.originalname.split('.');

                // Generate a timestamp for the file name
                let time = new Date();
                let timestamp = time.toLocaleDateString('sv-SE') + '-' + Date.now();

                // Generate the new filename with the user ID and timestamp
                let user_id = `${userData.user_id}-`;
                let newName = user_id + timestamp + '.' + ext[ext.length - 1];

                cb(null, newName);  // Pass the new filename to multer

                // Save the new filename to req for later use
                req.newName = newName;
            }
        });

        // File filter to accept only specific file types
        const fileFilter = (req, file, cb) => {
            // Allowed file extensions
            const extFilter = /\.(pdf|xls|xlsx|doc|docx)$/i;

            if (file.originalname && typeof file.originalname === 'string') {
                if (file.originalname.toLowerCase().match(extFilter)) {
                    console.log(timestamp, `File passed: ${file.originalname}`);  // Log accepted file
                    cb(null, true);  // Accept the file
                } else {
                    console.log(`File rejected: ${file.originalname}`);  // Log rejected file
                    cb(new Error('Your file extension is denied ❌'), false);  // Reject the file
                }
            } else {
                cb(new Error('Invalid file name ❌'), false);  // Handle missing or invalid file name
            }
        };

        // Return multer configuration with storage and file filter
        return multer({ storage: storageUploader, fileFilter });
    },

}