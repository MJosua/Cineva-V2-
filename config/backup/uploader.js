const multer = require('multer');
const fs = require('fs');


module.exports = {
    uploader: (directory, filePrefix) => {
        let defaultDir = './public';

        const storageUploader = multer.diskStorage({
            destination: (req, files, cb) => {
                // Menentukan lokasi penyimpanan
                const pathDir = directory ? defaultDir + directory : defaultDir;

                // Melakukan pemeriksaan pathDir
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

                console.log('file at uploader', file)
                console.log('req at uploader', req)
            },
            filename: (req, file, cb) => {
                // Membaca tipe data file
                let ext = file.originalname.split('.');

                let newName = filePrefix + Date.now() + '.' + ext[ext.length - 1];
                console.log('New filename', newName)
                cb(null, newName);
            }
        })

        const fileFilter = (req, file, cb) => {
            const extFilter = /\.(jpg|png|webp|jpeg|svg)/;

            if (file.originalname.toLowerCase().match(extFilter)) {
                cb(null, true)
            } else {
                cb(new Error('Your file ext are denied ❌', false));
            }

            console.log("req.file.originalname @ uploader", req.file.originalname)
        }

        return multer({ storage: storageUploader, fileFilter })
    }
    ,
    uploaderPDF: (directory, filePrefix) => {
        // Define lokasi default directory
        let defaultDir = './public/pdf';

        // Konfigurasi untuk multer
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                // Menentukan lokasi penyimpanan
                const pathDir = directory ? defaultDir + directory : defaultDir;

                // Melakukan pemeriksaan pathDir
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
            },
            filename: (req, file, cb) => {
                // Membaca tipe data file
                let ext = file.originalname.split('.');

                let newName = filePrefix + Date.now() + '.' + ext[ext.length - 1];
                console.log('New filename', newName)
                cb(null, newName);
            }
        })

        const fileFilter = (req, file, cb) => {
            const extFilter = /\.(pdf|PDF)/;

            if (file.originalname.toLowerCase().match(extFilter)) {
                cb(null, true)
            } else {
                cb(new Error('Your file ext are denied ❌', false));
            }
        }

        return multer({ storage: storageUploader, fileFilter })
    },
    uploaderIMG: (directory, filePrefix) => {
        // Define lokasi default directory
        let defaultDir = './public/image';

        // Konfigurasi untuk multer
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                // Menentukan lokasi penyimpanan
                const pathDir = directory ? defaultDir + directory : defaultDir;

                // Melakukan pemeriksaan pathDir
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
            },
            filename: (req, file, cb) => {
                // Membaca tipe data file
                let ext = file.originalname.split('.');

                let newName = filePrefix + Date.now() + '.' + ext[ext.length - 1];
                console.log('New filename', newName)
                cb(null, newName);
            }
        })

        const fileFilter = (req, file, cb) => {
            const extFilter = /\.(jpg|JPG|png|PNG|gif|GIF)/;

            if (file.originalname.toLowerCase().match(extFilter)) {
                cb(null, true)
            } else {
                cb(new Error('Your file ext are denied ❌', false));
            }
        }

        return multer({ storage: storageUploader, fileFilter })
    },
    uploaderImgFeedback: (directory, filePrefix) => {
        // Define lokasi default directory
        let defaultDir = './public/image/feedback';

        // Konfigurasi untuk multer
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                // Menentukan lokasi penyimpanan
                const pathDir = directory ? defaultDir + directory : defaultDir;

                // Melakukan pemeriksaan pathDir
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
            },
            filename: (req, file, cb) => {
                // Membaca tipe data file
                let ext = file.originalname.split('.');

                let newName = filePrefix + Date.now() + '.' + ext[ext.length - 1];
                console.log('New filename', newName)
                cb(null, newName);
            }
        })

        const fileFilter = (req, file, cb) => {
            const extFilter = /\.(jpg|JPG|png|PNG|gif|GIF)/;

            if (file.originalname.toLowerCase().match(extFilter)) {
                cb(null, true)
            } else {
                cb(new Error('Your file ext are denied ❌', false));
            }
        }

        return multer({ storage: storageUploader, fileFilter })
    },

}