# SSE vs Socket.io Scalability & Audit

## 1. Overview
This document analyzes the current implementation of Server-Sent Events (SSE) and Socket.io in the HOTS application, focusing on scalability for thousands of concurrent users.

## 2. Current Implementation Analysis

### 2.1 Server-Sent Events (SSE)
- **Location**: `core/sse-manager.js`, `routers/sse.js`
- **Mechanism**: Native HTTP streaming (`Content-Type: text/event-stream`).
- **State Storage**: In-memory `Map<UserId, Set<Response>>`.
- **Usage**:
    - Badge updates (notifications).
    - Ticket status updates.
    - Assignment updates.
    - Comments.
- **Pros**:
    - Lightweight (uses standard HTTP).
    - Auto-reconnection built-in on client.
    - Unidirectional (Server -> Client) is perfect for notifications.
- **Cons (Current Code)**:
    - **Single Node Only**: Since connections are stored in memory, this **does not support clustering**. If you run `pm2 start app.js -i 4`, users connected to Instance 1 will NOT receive events triggered on Instance 2.
    - **Event Loop Blocking**: The `broadcast` method iterates synchronously. For 1000+ users, this might block the event loop for a few milliseconds, increasing latency for other requests.

### 2.2 Socket.io
- **Location**: `index.js`, `fontend/HOTS/src/lib/socket.ts`
- **Mechanism**: WebSocket (with polling fallback).
- **Usage**:
    - **Console Log Broadcasting**: `io.emit("new_log", msg)`
    - Chat/Messaging (basic relay).
- **Critical Finding**:
    - The application overrides `console.log` to broadcast **EVERY** log message to **ALL** connected clients via `io.emit("new_log", msg)`.
    - **Performance Risk**: High. If 1000 users are connected, a single `console.log('test')` on the server results in 1000 network packets sent immediately. This creates massive outbound bandwidth usage and CPU load (serialization).

## 3. Scalability to 1000+ Users

### "Lagging" Causes
1.  **File Descriptors**: Each connection (SSE or Socket) consumes a file descriptor (FD). Linux default is often 1024.
    -   *Mitigation*: Increase `ulimit -n 65535` on the OS level.
2.  **Ephemeral Ports**: If not using a load balancer, running out of TCP ports.
3.  **Memory**:
    -   SSE: Very low. Keeps a `res` object open.
    -   Socket.io: Higher. Maintains heartbeat state, buffers, etc.
4.  **Broadcast Storms**:
    -   The current specific usage of Socket.io (broadcasting logs) creates a generic broadcast storm. 1 log * 1000 users = 1000 sends. 10 logs/sec = 10,000 sends/sec. This will crash the network or CPU.

## 4. Recommendations

### Immediate Actions
1.  **Disable Global Log Broadcasting**: Remove `io.emit("new_log")` or restrict it to authenticated "Admin" rooms only. Do not broadcast server logs to thousands of public users.
2.  **OS Tuning**: Ensure the server has high file descriptor limits (`ulimit`).

### Future Improvements
1.  **Redis Adapter for Scaling**:
    -   If scaling to multiple server instances (Node cluster), you **must** use an external store for messages.
    -   **Socket.io**: Use `@socket.io/redis-adapter`.
    -   **SSE**: Use Redis Pub/Sub. When Server A wants to emit to User X, it publishes to Redis. All servers subscribe; if Server B holds User X's connection, Server B sends the SSE.

## 5. Decision Matrix

| Feature | SSE | Socket.io |
| :--- | :--- | :--- |
| **Direction** | Server -> Client | Bidirectional |
| **Connection Setup** | HTTP (Simple) | Handshake (Complex) |
| **Firewall Friendliness** | Excellent (Port 80/443) | Good (but sometimes blocked) |
| **Reconnection** | Native (Browser handles it) | Client Library handles it |
| **Binary Data** | No (Text only/Base64) | Yes |
| **Resource Usage** | Low | Medium |
| **Best For** | Notifications, Stats, News Ticker | Chat, Gaming, Collaborative Editing |

**Verdict**: For the stated goal (preventing lagging for thousands of users viewing dashboards), **SSE is superior** provided the server is tuned. Socket.io should be reserved for interactive features (like Chat) and **must not** broadcast debug logs globally.
