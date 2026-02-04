/**
 * User Service - Shared user management functions
 * Used by both hotsSettingsController.js and hotsAdmin.js
 */
const { dbHots } = require("../config/db");

const yellowTerminal = '\x1b[33m';

/**
 * Create a new user
 * @param {Object} userData - User data object
 * @param {string} userData.firstname
 * @param {string} userData.lastname
 * @param {string} userData.uid - Username (optional, auto-generated if not provided)
 * @param {string} userData.email
 * @param {number} userData.role_id
 * @param {number} userData.department_id
 * @param {number} userData.jobtitle_id
 * @param {number} userData.superior_id
 * @param {string} userData.nik
 * @param {string} userData.phone
 * @param {string} userData.description
 * @param {number} userData.grade
 * @returns {Promise<{success: boolean, data?: {user_id: number}, message?: string}>}
 */
async function createUser(userData) {
    const {
        firstname,
        lastname,
        uid,
        email,
        role_id,
        department_id,
        jobtitle_id,
        superior_id,
        nik,
        phone,
        description,
        grade
    } = userData;

    // Auto-generate uid if not provided
    const generatedUid = uid || `${firstname}.${lastname}`;
    const defaultPassword = "Indofood01";

    try {
        const [result] = await dbHots.promise().query(`
            INSERT INTO hots.user (
                firstname, lastname, uid, email, 
                role_id, department_id, jobtitle_id, superior_id, 
                nik, phone, description, grade_id,
                registration_date, pswd
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `, [
            firstname, lastname, generatedUid, email,
            role_id, department_id, jobtitle_id, superior_id,
            nik, phone, description, grade,
            defaultPassword
        ]);

        const timestamp = yellowTerminal + new Date().toLocaleDateString('id') + ' ' + new Date().toLocaleTimeString('id') + ' : ';
        console.log(`${timestamp} [userService] User created: ${generatedUid} (ID: ${result.insertId})`);

        return {
            success: true,
            data: { user_id: result.insertId, uid: generatedUid }
        };
    } catch (err) {
        console.error('[userService] createUser error:', err.message);
        return {
            success: false,
            message: err.message
        };
    }
}

/**
 * Update an existing user
 * @param {number} userId - The user_id to update
 * @param {Object} userData - Fields to update
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function updateUser(userId, userData) {
    const {
        firstname,
        lastname,
        uid,
        email,
        role_id,
        department_id,
        jobtitle_id,
        superior_id,
        nik,
        phone,
        grade
    } = userData;

    try {
        const [result] = await dbHots.promise().query(`
            UPDATE hots.user 
            SET firstname = ?, lastname = ?, uid = ?, email = ?, 
                role_id = ?, department_id = ?, jobtitle_id = ?, superior_id = ?,
                nik = ?, phone = ?, grade_id = ?
            WHERE user_id = ? AND finished_date IS NULL
        `, [
            firstname, lastname, uid, email,
            role_id, department_id, jobtitle_id, superior_id,
            nik, phone, grade,
            userId
        ]);

        if (result.affectedRows === 0) {
            return {
                success: false,
                message: "User not found or already deleted"
            };
        }

        const timestamp = yellowTerminal + new Date().toLocaleDateString('id') + ' ' + new Date().toLocaleTimeString('id') + ' : ';
        console.log(`${timestamp} [userService] User updated: ID ${userId}`);

        return { success: true };
    } catch (err) {
        console.error('[userService] updateUser error:', err.message);
        return {
            success: false,
            message: err.message
        };
    }
}

/**
 * Soft delete a user (set finished_date)
 * @param {number} userId - The user_id to delete
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function deleteUser(userId) {
    try {
        const [result] = await dbHots.promise().query(`
            UPDATE hots.user 
            SET finished_date = NOW() 
            WHERE user_id = ? AND finished_date IS NULL
        `, [userId]);

        if (result.affectedRows === 0) {
            return {
                success: false,
                message: "User not found or already deleted"
            };
        }

        const timestamp = yellowTerminal + new Date().toLocaleDateString('id') + ' ' + new Date().toLocaleTimeString('id') + ' : ';
        console.log(`${timestamp} [userService] User soft-deleted: ID ${userId}`);

        return { success: true };
    } catch (err) {
        console.error('[userService] deleteUser error:', err.message);
        return {
            success: false,
            message: err.message
        };
    }
}

/**
 * Get user by ID
 * @param {number} userId
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
async function getUserById(userId) {
    try {
        const [rows] = await dbHots.promise().query(`
            SELECT 
                u.user_id, u.firstname, u.lastname, u.uid, u.email,
                u.role_id, u.department_id, u.jobtitle_id, u.superior_id,
                u.nik, u.phone, u.grade_id, u.active, u.registration_date
            FROM hots.user u
            WHERE u.user_id = ? AND u.finished_date IS NULL
        `, [userId]);

        if (rows.length === 0) {
            return {
                success: false,
                message: "User not found"
            };
        }

        return {
            success: true,
            data: rows[0]
        };
    } catch (err) {
        console.error('[userService] getUserById error:', err.message);
        return {
            success: false,
            message: err.message
        };
    }
}

module.exports = {
    createUser,
    updateUser,
    deleteUser,
    getUserById
};
