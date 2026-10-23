/**
 * Ported from Event/src/components/Engine/responsiveLayout.js (2026-10-06) — same behavior, typed.
 * One block schema, three viewports: desktop values are the base, tablet/mobile override only
 * whitelisted layout keys, and visibility can be toggled per viewport (non-cascading).
 */

export const BREAKPOINTS = {
  desktop: 'desktop',
  tablet: 'tablet',
  mobile: 'mobile',
} as const;

export type Viewport = (typeof BREAKPOINTS)[keyof typeof BREAKPOINTS];

export const LAYOUT_OVERRIDE_KEYS = [
  'top',
  'left',
  'right',
  'bottom',
  'width',
  'height',
  'maxWidth',
  'maxHeight',
  'margin',
  'padding',
  'display',
  'justifyContent',
  'alignItems',
  'zIndex',
  'opacity',
] as const;

export type LayoutOverrideKey = (typeof LAYOUT_OVERRIDE_KEYS)[number];
export type LayoutOverrides = Partial<Record<LayoutOverrideKey, unknown>>;

export interface ResponsiveBlockProps extends Record<string, unknown> {
  layoutByBreakpoint?: Partial<Record<Viewport, LayoutOverrides>>;
  hiddenByBreakpoint?: Partial<Record<Viewport, boolean>>;
}

export function isLayoutOverrideKey(key: string): key is LayoutOverrideKey {
  return (LAYOUT_OVERRIDE_KEYS as readonly string[]).includes(key);
}

function pickLayoutOverrides(input: LayoutOverrides = {}): LayoutOverrides {
  const out: LayoutOverrides = {};
  for (const key of LAYOUT_OVERRIDE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(input, key)) out[key] = input[key];
  }
  return out;
}

/** Resolves the props a block should render with for a viewport (desktop → tablet → mobile cascade). */
export function resolveResponsiveProps<P extends ResponsiveBlockProps>(props: P, viewport: Viewport = BREAKPOINTS.desktop): P {
  const resolved: Record<string, unknown> = { ...props };
  const layout = props.layoutByBreakpoint ?? {};
  const hidden = props.hiddenByBreakpoint ?? {};

  Object.assign(resolved, pickLayoutOverrides(layout.desktop));
  if (viewport === BREAKPOINTS.tablet || viewport === BREAKPOINTS.mobile) {
    Object.assign(resolved, pickLayoutOverrides(layout.tablet));
  }
  if (viewport === BREAKPOINTS.mobile) {
    Object.assign(resolved, pickLayoutOverrides(layout.mobile));
  }
  if (hidden[viewport] === true) resolved.display = 'none';

  return resolved as P;
}

/** Applies editor updates: desktop writes base props; other viewports store layout keys as overrides. */
export function applyResponsiveLayoutUpdates<P extends ResponsiveBlockProps>(
  props: P,
  updates: Record<string, unknown>,
  viewport: Viewport = BREAKPOINTS.desktop,
): P {
  if (!updates || typeof updates !== 'object') return props;
  if (viewport === BREAKPOINTS.desktop) return { ...props, ...updates };

  const layoutUpdates: LayoutOverrides = {};
  const otherUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (isLayoutOverrideKey(key)) layoutUpdates[key] = value;
    else otherUpdates[key] = value;
  }

  const next: P = { ...props, ...otherUpdates };
  if (Object.keys(layoutUpdates).length === 0) return next;

  const current = props.layoutByBreakpoint ?? {};
  next.layoutByBreakpoint = { ...current, [viewport]: { ...(current[viewport] ?? {}), ...layoutUpdates } };
  return next;
}

export function getViewportFromWidth(width: number): Viewport {
  if (width < 768) return BREAKPOINTS.mobile;
  if (width < 1024) return BREAKPOINTS.tablet;
  return BREAKPOINTS.desktop;
}
