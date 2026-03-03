require('dotenv').config();
const crypto = require('crypto');

// Use ENCRYPTION_SECRET, fallback to JWT_SECRET, or fallback to a hardcoded key if both missing (not recommended for true prod, but safe fallback)
const SECRET_KEY = process.env.ENCRYPT_SECRET || process.env.JWT_SECRET || 'fallback_secret_key_32_chars_lng!';

// Derive a 32-byte key from the secret
const key = crypto.createHash('sha256').update(String(SECRET_KEY)).digest('base64').substring(0, 32);

/**
 * Encrypts a string into a URL-safe Base64 encoded string.
 * @param {string} text - The raw text to encrypt (e.g. "IPL336Z")
 * @returns {string} - The URL-safe encrypted string
 */
function encryptUrlSafe(text) {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(String(text));
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // Combine IV and encrypted data
        const combined = Buffer.concat([iv, encrypted]);

        // Convert to Base64
        let base64 = combined.toString('base64');

        // Make it URL safe (replace + with -, / with _, remove trailing =)
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
        console.error('Encryption error:', e);
        return null;
    }
}

/**
 * Decrypts a URL-safe Base64 encoded string back to its original text.
 * @param {string} encryptedText - The URL-safe encrypted string
 * @returns {string|null} - The decrypted original text, or null if failed
 */
function decryptUrlSafe(encryptedText) {
    if (!encryptedText) return encryptedText;
    try {
        // Revert URL safe characters
        let base64 = encryptedText.replace(/-/g, '+').replace(/_/g, '/');

        // Pad with = so length is a multiple of 4
        while (base64.length % 4) {
            base64 += '=';
        }

        const combined = Buffer.from(base64, 'base64');

        if (combined.length < 16) {
            return null; // Invalid IV length
        }

        // Extract IV and encrypted data
        const iv = combined.slice(0, 16);
        const encrypted = combined.slice(16);

        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (e) {
        console.error('Decryption error:', e);
        return null;
    }
}

module.exports = {
    encryptUrlSafe,
    decryptUrlSafe
};
