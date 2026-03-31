export const BREAKPOINTS = {
    desktop: "desktop",
    tablet: "tablet",
    mobile: "mobile"
};

export const LAYOUT_OVERRIDE_KEYS = [
    "top",
    "left",
    "right",
    "bottom",
    "width",
    "height",
    "maxWidth",
    "maxHeight",
    "margin",
    "padding",
    "display",
    "justifyContent",
    "alignItems",
    "zIndex",
    "opacity"
];

export function isLayoutOverrideKey(key) {
    return LAYOUT_OVERRIDE_KEYS.includes(key);
}

function pickLayoutOverrides(input = {}) {
    const out = {};
    for (const key of LAYOUT_OVERRIDE_KEYS) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
            out[key] = input[key];
        }
    }
    return out;
}

export function resolveResponsiveProps(blockType, props = {}, viewport = BREAKPOINTS.desktop) {
    const resolved = { ...props };
    const layoutByBreakpoint = props.layoutByBreakpoint || {};
    const hiddenByBreakpoint = props.hiddenByBreakpoint || {};

    Object.assign(resolved, pickLayoutOverrides(layoutByBreakpoint.desktop || {}));
    if (viewport === BREAKPOINTS.tablet || viewport === BREAKPOINTS.mobile) {
        Object.assign(resolved, pickLayoutOverrides(layoutByBreakpoint.tablet || {}));
    }
    if (viewport === BREAKPOINTS.mobile) {
        Object.assign(resolved, pickLayoutOverrides(layoutByBreakpoint.mobile || {}));
    }

    // Explicit per-viewport visibility toggle (non-cascading).
    if (hiddenByBreakpoint[viewport] === true) {
        resolved.display = "none";
    }

    return resolved;
}

export function applyResponsiveLayoutUpdates(props = {}, updates = {}, viewport = BREAKPOINTS.desktop) {
    if (!updates || typeof updates !== "object") return props;

    // Desktop remains backward-compatible: write to base props.
    if (viewport === BREAKPOINTS.desktop) {
        return { ...props, ...updates };
    }

    const layoutUpdates = {};
    const nonLayoutUpdates = {};

    Object.entries(updates).forEach(([key, value]) => {
        if (isLayoutOverrideKey(key)) {
            layoutUpdates[key] = value;
        } else {
            nonLayoutUpdates[key] = value;
        }
    });

    const next = { ...props, ...nonLayoutUpdates };
    if (Object.keys(layoutUpdates).length === 0) return next;

    next.layoutByBreakpoint = {
        ...(props.layoutByBreakpoint || {}),
        [viewport]: {
            ...((props.layoutByBreakpoint || {})[viewport] || {}),
            ...layoutUpdates
        }
    };

    return next;
}

export function getViewportFromWidth(width) {
    if (width < 768) return BREAKPOINTS.mobile;
    if (width < 1024) return BREAKPOINTS.tablet;
    return BREAKPOINTS.desktop;
}
