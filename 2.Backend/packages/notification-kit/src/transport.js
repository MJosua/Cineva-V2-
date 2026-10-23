'use strict';
const { scopeKey, eventFrame } = require('./scope');
/** Node writable semantics: false means accepted but backpressured, never resend that frame. */
function createSSEWriter({ maxQueuedFrames = 128, onError = () => {} } = {}) {
  if (!Number.isSafeInteger(maxQueuedFrames) || maxQueuedFrames < 1) throw new TypeError('Invalid SSE queue bound.');
  const states = new WeakMap(), failed = new WeakSet();
  const report = error => { try { onError(error); } catch { /* Logging must not break transport cleanup. */ } };
  function dispose(res) {
    const state = states.get(res);
    if (!state) return;
    state.closed = true; state.queue.length = 0;
    res.removeListener('drain', state.drain); res.removeListener('close', state.close); res.removeListener('error', state.error);
    states.delete(res);
  }
  function stateFor(res) {
    let state = states.get(res);
    if (state) return state;
    if (!res || typeof res.write !== 'function' || typeof res.on !== 'function' || typeof res.removeListener !== 'function') throw new TypeError('A Node writable response is required.');
    state = { blocked: false, closed: false, queue: [] };
    state.close = () => dispose(res);
    state.error = error => { failed.add(res); dispose(res); report(error); };
    state.drain = () => {
      if (state.closed) return;
      state.blocked = false;
      while (!state.blocked && state.queue.length) {
        try { state.blocked = res.write(state.queue.shift()) === false; }
        catch (error) { failed.add(res); dispose(res); report(error); return; }
      }
    };
    states.set(res, state); res.on('drain', state.drain); res.on('close', state.close); res.on('error', state.error);
    return state;
  }
  function write(res, event, payload) {
    const frame = eventFrame(event, payload);
    if (failed.has(res) || res.destroyed || res.writableEnded) { dispose(res); return false; }
    const state = stateFor(res);
    if (state.blocked) {
      if (state.queue.length >= maxQueuedFrames) {
        failed.add(res); dispose(res); report(new Error('SSE queue limit exceeded; reconnect required.'));
        if (typeof res.destroy === 'function') res.destroy();
        return false;
      }
      state.queue.push(frame); return true;
    }
    try { state.blocked = res.write(frame) === false; return true; }
    catch (error) { failed.add(res); dispose(res); report(error); return false; }
  }
  return { write, dispose };
}
function createSSEHub(options = {}) {
  const writer = createSSEWriter(options), scopes = new Map(), connections = new WeakMap();
  function connect(scope, res) {
    const key = scopeKey(scope), set = scopes.get(key) || new Set();
    if (connections.has(res)) throw new Error('Response already registered; disconnect before reusing it.');
    set.add(res); scopes.set(key, set);
    let closed = false;
    const disconnect = () => {
      if (closed) return; closed = true;
      set.delete(res); if (!set.size) scopes.delete(key);
      connections.delete(res); res.removeListener('close', disconnect); res.removeListener('error', disconnect); writer.dispose(res);
    };
    connections.set(res, disconnect); res.on('close', disconnect); res.on('error', disconnect);
    return disconnect;
  }
  function send(scope, event, payload) {
    eventFrame(event, payload); // Validate even when everyone is offline.
    let accepted = 0, failed = 0;
    for (const res of scopes.get(scopeKey(scope)) || []) {
      if (writer.write(res, event, payload)) accepted++; else { failed++; connections.get(res)?.(); }
    }
    return { accepted, failed };
  }
  return { connect, send, stats: () => ({ scopes: scopes.size, connections: [...scopes.values()].reduce((n, set) => n + set.size, 0) }) };
}
module.exports = { createSSEWriter, createSSEHub };
