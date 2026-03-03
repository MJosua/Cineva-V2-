/**
 * Winner Generator Logic
 * 
 * Pure business logic for drawing winners from a pool.
 * This module operates on MOCK_POOL_ITEMS and is designed for 1:1 backend replacement.
 * 
 * Schema Alignment:
 * - Reads from: EVENT_m_pool_item (via MOCK_POOL_ITEMS)
 * - Writes to: EVENT_t_winner (not implemented here, backend responsibility)
 * 
 * Strategies:
 * - RANDOM: Shuffle eligible items, pick first N
 * - FIRST_N: Take first N eligible items (deterministic, FIFO)
 * 
 * Usage:
 *   import { drawWinners, getAvailablePoolItems } from './winnerGenerator';
 *   const result = drawWinners(poolId, 5, 'RANDOM');
 */

import { MOCK_POOL_ITEMS, MOCK_POOLS } from './mockCoupons';

/**
 * Get all available (unused) items from a specific pool
 * @param {number} poolId - The pool to query
 * @returns {Array} Array of available pool items
 */
export function getAvailablePoolItems(poolId) {
    return MOCK_POOL_ITEMS.filter(item =>
        item.pool_id === poolId &&
        item.is_used === 0
    );
}

/**
 * Get pool metadata by ID
 * @param {number} poolId - The pool ID
 * @returns {Object|null} Pool object or null if not found
 */
export function getPoolById(poolId) {
    return MOCK_POOLS.find(pool => pool.pool_id === poolId) || null;
}

/**
 * Fisher-Yates shuffle algorithm (in-place)
 * Creates a new shuffled array without mutating the original
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Draw winners from a pool
 * 
 * @param {number} poolId - The pool to draw from
 * @param {number} count - Number of winners to draw
 * @param {string} strategy - 'RANDOM' or 'FIRST_N'
 * @returns {Object} Result object with winners and metadata
 * 
 * @example
 * const result = drawWinners(3, 5, 'RANDOM');
 * // Returns:
 * // {
 * //   success: true,
 * //   winner_items: [{ item_id: 4, value: 'LUCKY-002', ... }, ...],
 * //   metadata: { pool_id: 3, drawn_at: '2026-02-02T...', strategy: 'RANDOM', count: 5 },
 * //   error: null
 * // }
 */
export function drawWinners(poolId, count, strategy = 'RANDOM') {
    // Validate inputs
    if (!poolId || typeof poolId !== 'number') {
        return {
            success: false,
            winner_items: [],
            metadata: null,
            error: 'Invalid pool_id: must be a number'
        };
    }

    if (!count || count < 1) {
        return {
            success: false,
            winner_items: [],
            metadata: null,
            error: 'Invalid count: must be at least 1'
        };
    }

    const validStrategies = ['RANDOM', 'FIRST_N'];
    if (!validStrategies.includes(strategy)) {
        return {
            success: false,
            winner_items: [],
            metadata: null,
            error: `Invalid strategy: must be one of ${validStrategies.join(', ')}`
        };
    }

    // Get pool metadata for validation
    const pool = getPoolById(poolId);
    if (!pool) {
        return {
            success: false,
            winner_items: [],
            metadata: null,
            error: `Pool not found: ${poolId}`
        };
    }

    // Get available items
    const availableItems = getAvailablePoolItems(poolId);

    if (availableItems.length === 0) {
        return {
            success: false,
            winner_items: [],
            metadata: {
                pool_id: poolId,
                pool_name: pool.name,
                drawn_at: new Date().toISOString(),
                strategy,
                requested_count: count,
                available_count: 0
            },
            error: 'No available items in pool'
        };
    }

    // Determine actual count (can't draw more than available)
    const actualCount = Math.min(count, availableItems.length);

    // Select winners based on strategy
    let selectedItems;

    switch (strategy) {
        case 'RANDOM':
            // Shuffle and take first N
            const shuffled = shuffleArray(availableItems);
            selectedItems = shuffled.slice(0, actualCount);
            break;

        case 'FIRST_N':
            // Take first N (deterministic, order by item_id)
            selectedItems = availableItems
                .sort((a, b) => a.item_id - b.item_id)
                .slice(0, actualCount);
            break;

        default:
            selectedItems = [];
    }

    // Mark selected items as used (IN-MEMORY ONLY)
    // In production, this would be a database transaction
    const winnerItems = selectedItems.map(item => {
        // Find and update the item in MOCK_POOL_ITEMS
        const originalItem = MOCK_POOL_ITEMS.find(i => i.item_id === item.item_id);
        if (originalItem) {
            originalItem.is_used = 1;
            originalItem.used_at = new Date().toISOString();
            // Note: used_by_submission_id would be set by actual submission in production
        }

        return {
            ...item,
            is_used: 1,
            used_at: new Date().toISOString()
        };
    });

    // Build response
    return {
        success: true,
        winner_items: winnerItems,
        metadata: {
            pool_id: poolId,
            pool_name: pool.name,
            drawn_at: new Date().toISOString(),
            strategy,
            requested_count: count,
            actual_count: winnerItems.length,
            remaining_count: availableItems.length - winnerItems.length
        },
        error: null
    };
}

/**
 * Preview a draw without modifying state
 * Useful for UI to show "what would be selected"
 * 
 * @param {number} poolId - The pool to preview
 * @param {number} count - Number of items to preview
 * @param {string} strategy - 'RANDOM' or 'FIRST_N'
 * @returns {Object} Preview result (same structure as drawWinners, but no state change)
 */
export function previewDraw(poolId, count, strategy = 'RANDOM') {
    const pool = getPoolById(poolId);
    if (!pool) {
        return {
            success: false,
            preview_items: [],
            metadata: null,
            error: `Pool not found: ${poolId}`
        };
    }

    const availableItems = getAvailablePoolItems(poolId);
    const actualCount = Math.min(count, availableItems.length);

    let previewItems;

    switch (strategy) {
        case 'RANDOM':
            previewItems = shuffleArray(availableItems).slice(0, actualCount);
            break;
        case 'FIRST_N':
            previewItems = availableItems
                .sort((a, b) => a.item_id - b.item_id)
                .slice(0, actualCount);
            break;
        default:
            previewItems = [];
    }

    return {
        success: true,
        preview_items: previewItems,
        metadata: {
            pool_id: poolId,
            pool_name: pool.name,
            strategy,
            requested_count: count,
            available_count: availableItems.length,
            preview_count: previewItems.length
        },
        error: null
    };
}

/**
 * Get draw statistics for a pool
 * @param {number} poolId - The pool ID
 * @returns {Object} Statistics object
 */
export function getPoolDrawStats(poolId) {
    const pool = getPoolById(poolId);
    if (!pool) return null;

    const allItems = MOCK_POOL_ITEMS.filter(item => item.pool_id === poolId);
    const usedItems = allItems.filter(item => item.is_used === 1);
    const availableItems = allItems.filter(item => item.is_used === 0);

    return {
        pool_id: poolId,
        pool_name: pool.name,
        pool_type: pool.type,
        total_items: allItems.length,
        used_items: usedItems.length,
        available_items: availableItems.length,
        exhausted: availableItems.length === 0
    };
}
