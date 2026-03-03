import { useEffect, useRef } from 'react';

/**
 * Custom hook to subscribe to Server-Sent Events
 * @param {string} url - The SSE endpoint URL
 * @param {Object} eventHandlers - Map of event names to handler functions
 */
export function useSSE(endpoint, eventHandlers = {}) {
    const eventSourceRef = useRef(null);
    // Use a ref for handlers so we don't reconnect on handler changes
    const handlersRef = useRef(eventHandlers);

    useEffect(() => {
        handlersRef.current = eventHandlers;
    }, [eventHandlers]);

    useEffect(() => {
        if (!endpoint) return;

        // Auto-append token for Event Engine
        let finalUrl = endpoint;
        const isAdminStream = endpoint.includes('event-engine');

        // Check local storage for actual admin token
        const adminStr = localStorage.getItem('event_admin');
        const adminData = adminStr ? JSON.parse(adminStr) : null;
        const token = adminData?.token || 'guest';

        // Fix path if it lacks 'admin/' prefix but is an engine stream
        if (isAdminStream && !endpoint.includes('admin/')) {
            finalUrl = endpoint.replace('event-engine/', 'event-engine/admin/');
        }

        if (isAdminStream && !finalUrl.includes('token=')) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + `token=${token}`;
        }

        console.log(`[useSSE] Connecting to `);

        // Proxy handles /api domain
        const url = finalUrl.startsWith('http') ? finalUrl : `/api${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;

        const evtSource = new EventSource(url);
        eventSourceRef.current = evtSource;

        console.log(`[useSSE] Connecting to ...`);

        evtSource.onopen = () => {
            console.log(`[useSSE] ✅ Connection OPEN`);
        };

        evtSource.onerror = (e) => {
            // Check readyState: 0=CONNECTING, 1=OPEN, 2=CLOSED
            const state = evtSource.readyState;
            console.error(`[useSSE] ❌ Connection ERROR: ${url}`, { readyState: state, event: e });
            if (state === 2) {
                console.log("[useSSE] Connection closed by server or network error.");
            }
        };

        evtSource.onmessage = (e) => {
            if (e.data === ':heartbeat') return; // Ignore heartbeats

            try {
                if (e.data.startsWith('{')) { // Simple check for JSON
                    const parsed = JSON.parse(e.data);
                    // Special initial connection message
                    if (parsed.message && parsed.message.includes('Connected')) {
                        console.log("[useSSE] Handshake:", parsed);
                        return;
                    }
                }
            } catch (err) { /* ignore parse error on non-json */ }
        };

        // Attach listeners
        Object.entries(handlersRef.current).forEach(([event, handler]) => {
            evtSource.addEventListener(event, (e) => {
                try {
                    console.log(`[useSSE] 📩 Received event: ${event}`, e.data);
                    const parsed = JSON.parse(e.data);
                    // Unwrap our standard envelope ({ type, data, timestamp })
                    // If it has a 'data' property and matches the event type, use that.
                    const content = (parsed.data && parsed.type === event) ? parsed.data : parsed;
                    handler(content);
                } catch (err) {
                    console.error(`[useSSE] Error parsing event ${event}:`, err);
                }
            });
        });

        // Cleanup
        return () => {
            console.log(`[useSSE] Tearing down connection`);
            evtSource.close();
            eventSourceRef.current = null;
        };
    }, [endpoint]); // Only reconnect if endpoint changes
}
