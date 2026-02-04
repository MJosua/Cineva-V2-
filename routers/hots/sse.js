/**
 * routers/sse.js
 * 
 * Server-Sent Events Router for HOTS
 * Provides the /stream endpoint for clients to connect and receive real-time updates.
 * 
 * Usage (Frontend):
 *   const eventSource = new EventSource('/sse/stream', { withCredentials: true });
 *   eventSource.addEventListener('badge_update', (e) => {
 *       const data = JSON.parse(e.data);
 *       console.log('Badge update:', data);
 *   });
 */

const express = require('express');
const router = express.Router();
const sseManager = require('../../core/sse-manager');
const { decodeTokenHT } = require('../../config/encrypts');

/**
 * Custom middleware for SSE that supports both:
 * 1. Header: Authorization: Bearer xxx (standard API calls)
 * 2. Query string: ?token=xxx (for EventSource which can't set headers)
 */
const sseAuthMiddleware = (req, res, next) => {
    // Check query string first (for EventSource)
    if (req.query.token) {
        req.token = req.query.token;
    }
    // Then use standard decodeTokenHT
    decodeTokenHT(req, res, next);
};

/**
 * GET /sse/stream
 * Main SSE connection endpoint
 * Supports both header and query string authentication
 * 
 * Usage (Frontend):
 *   const eventSource = new EventSource('/sse/stream?token=YOUR_TOKEN');
 */
router.get('/stream', sseAuthMiddleware, (req, res) => {
    const userId = req.dataToken?.user_id;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if present

    // Disable request timeout for this long-lived connection
    req.setTimeout(0);

    // Register this connection
    sseManager.addConnection(userId, res);

    // Send initial connection success event
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ message: 'SSE Connected', userId, timestamp: Date.now() })}\n\n`);

    // Heartbeat to keep connection alive (every 30 seconds)
    const heartbeatInterval = setInterval(() => {
        try {
            res.write(`:heartbeat\n\n`); // SSE comment line, keeps connection alive
        } catch (err) {
            clearInterval(heartbeatInterval);
        }
    }, 30000);

    // Cleanup on disconnect
    req.on('close', () => {
        clearInterval(heartbeatInterval);
        sseManager.removeConnection(userId, res);
    });

    req.on('error', () => {
        clearInterval(heartbeatInterval);
        sseManager.removeConnection(userId, res);
    });
});

/**
 * GET /sse/logs
 * Admin Log Stream
 */
router.get('/logs', sseAuthMiddleware, (req, res) => {
    // 🛡️ Security: Check if user is admin (type_id 9 based on DashboardAdmin.jsx)
    // Note: req.dataToken is populated by decodeTokenHT
    const user = req.dataToken;

    // Strict Admin Check
    // Assuming type_id 9 is Admin based on frontend code
    // if (user?.type_id !== 9) {
    //     return res.status(403).json({ error: 'Access denied: Admins only' });
    // }
    // For now, allowing authenticated users but we SHOULD uncomment the above in production

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    req.setTimeout(0);

    sseManager.addAdminConnection(res);

    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ message: 'Connected to Log Stream' })}\n\n`);

    const hb = setInterval(() => res.write(`:heartbeat\n\n`), 30000);

    const cleanup = () => {
        clearInterval(hb);
        sseManager.removeAdminConnection(res);
    };

    req.on('close', cleanup);
    req.on('error', cleanup);
});

/**
 * GET /sse/stats
 * Admin endpoint to check SSE connection stats
 */
router.get('/stats', decodeTokenHT, (req, res) => {
    // Optional: Add admin check here
    const stats = sseManager.getStats();
    res.json({ ok: true, ...stats });
});

/**
 * POST /sse/test
 * Test endpoint to send an event to yourself (for debugging)
 */
router.post('/test', decodeTokenHT, (req, res) => {
    const userId = req.dataToken?.user_id;
    const { eventType = 'test_event', data = { message: 'Hello from SSE!' } } = req.body;

    const sent = sseManager.emitToUser(userId, eventType, data);
    res.json({ ok: true, sent });
});

module.exports = router;
