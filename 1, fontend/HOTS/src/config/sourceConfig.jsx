// ============================================================
// sourceConfig.jsx — Dynamic API URL (Backward Compatible)
// ============================================================
// resolveApiBase() in index.js runs BEFORE React renders and sets
// window.__API_URL__ to the first healthy IP found.
//
// API_URL is a Proxy that coerces to a string on every concatenation.
// ALL existing patterns still work without modification:
//   API_URL + "/path"       ← works (toString coercion)
//   `${API_URL}/path`       ← works
//   Axios.get(API_URL + x)  ← works
//
// See: src/utils/apiResolver.ts
// ============================================================

import { getApiBase, isServerReady as _isServerReady } from '../utils/apiResolver';

const _handler = {
    get(_, prop) {
        const base = getApiBase();
        if (prop === Symbol.toPrimitive || prop === 'valueOf' || prop === 'toString') {
            return () => base;
        }
        return base[prop];
    },
    apply() {
        return getApiBase();
    },
};

function _noop() { }
export const API_URL = new Proxy(_noop, _handler);

export const isServerReady = _isServerReady;
