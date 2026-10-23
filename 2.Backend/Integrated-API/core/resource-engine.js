/**
 * Resource Engine - Unified Resource Management
 * 
 * Provides helpers for interacting with the resource_m_data architecture.
 */
const { dbHots } = require("../config/db");
const { RESOURCE_CATEGORIES } = require("../script/Utility/hotsConstants");

class ResourceEngine {
    /**
     * Get all resources for a specific category
     * @param {string} category - Use RESOURCE_CATEGORIES constant
     * @param {boolean} activeOnly - If true, filter by is_active = 1
     */
    async getResourcesByCategory(category, activeOnly = true) {
        let query = `
      SELECT 
        resource_key as value,
        resource_label as label,
        attributes,
        is_active
      FROM hots.resource_m_data
      WHERE resource_category = ?
    `;

        const params = [category];
        if (activeOnly) {
            query += " AND is_active = 1";
        }

        query += " ORDER BY resource_label ASC";

        const [rows] = await dbHots.promise().query(query, params);
        return rows.map(r => ({
            ...r,
            attributes: typeof r.attributes === 'string' ? JSON.parse(r.attributes) : r.attributes
        }));
    }

    /**
     * Get a single resource by category and key
     */
    async getResource(category, key) {
        const [rows] = await dbHots.promise().query(`
      SELECT * FROM hots.resource_m_data 
      WHERE resource_category = ? AND resource_key = ?
    `, [category, key]);

        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            ...row,
            attributes: typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes
        };
    }
}

module.exports = new ResourceEngine();
