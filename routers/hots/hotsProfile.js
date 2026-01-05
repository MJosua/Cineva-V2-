const express = require('express');
const route = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { decodeTokenHT } = require('../../config/encrypts');

const hotsProfile = require('../../controller/hots_controller/profile/controllers/profileController');

// Simple signature uploader for HOTS - saves to temp, controller handles the rest
const signatureStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, '../../public/hots/temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const timestamp = Date.now();
        cb(null, `sig_temp_${timestamp}${ext}`);
    }
});

const signatureFilter = (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PNG and JPEG images are allowed'), false);
    }
};

const signatureUploader = multer({
    storage: signatureStorage,
    fileFilter: signatureFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
}).single('signature');

/**
 * HOTS Profile Routes
 * Base Path: /hots_profile
 */

// Get current user's profile
route.get('/me', decodeTokenHT, hotsProfile.getProfile);

// Update profile attributes
route.post('/update', decodeTokenHT, hotsProfile.updateProfile);

// Upload signature - decodeTokenHT FIRST, then uploader
route.post('/upload_signature', decodeTokenHT, signatureUploader, hotsProfile.uploadSignature);

module.exports = route;
