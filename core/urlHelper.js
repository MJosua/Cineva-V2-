/**
 * core/urlHelper.js
 * Centralized utility for absolute URL generation
 */

const getBaseUrl = (req) => {
    // Priority 1: Environment variable
    if (process.env.URL_API) {
        let url = process.env.URL_API;
        if (url.endsWith('/')) url = url.slice(0, -1);
        return url;
    }

    // Priority 2: Request host
    if (req) {
        const protocol = req.protocol || 'http';
        const host = req.get('host');
        return `${protocol}://${host}`;
    }

    // Fallback? (Usually shouldn't happen if req is provided)
    return '';
};

const getAbsoluteUrl = (req, relativePath) => {
    if (!relativePath) return '';

    // If already absolute, return as is
    if (relativePath.startsWith('http')) return relativePath;

    const baseUrl = getBaseUrl(req);

    // Ensure relativePath starts with exactly one slash
    let cleanPath = relativePath.trim().replace(/\\/g, '/');
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

    return baseUrl + cleanPath;
};

module.exports = {
    getBaseUrl,
    getAbsoluteUrl
};
