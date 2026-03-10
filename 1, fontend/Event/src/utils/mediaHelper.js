import { getApiBase } from './apiResolver';

/**
 * Resolves a media path from the backend into a full, usable URL.
 * Handles:
 * - Absolute URLs (starts with http/https)
 * - Relative paths starting with /
 * - Paths starting with public/ (strips strictly if needed)
 * 
 * @param {string} path 
 * @returns {string} Fully resolved URL
 */
export const resolveMediaUrl = (path) => {
    if (!path) return '';

    // If it's already an absolute URL, return as is
    if (path.startsWith('http')) return path;

    const apiBase = getApiBase(); // e.g. http://localhost:2468/api/event-engine
    const origin = apiBase.split('/api/')[0]; // Get the host origin

    // Ensure the path doesn't have leading/trailing slashes that double up
    let cleanPath = path.replace(/\\/g, '/');

    // In our system, the backend might serve public/ as the root or via a shortcut
    // If it starts with 'public/', we keep it if the backend is configured to use App.use('/public', ...)
    // Our backend (index.js) has: App.use('/public', express.static(...))
    // So /public/files/images.png is valid.

    if (!cleanPath.startsWith('/')) {
        cleanPath = '/' + cleanPath;
    }

    return origin + cleanPath;
};
