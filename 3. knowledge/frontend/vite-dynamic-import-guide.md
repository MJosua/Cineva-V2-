# Vite Dynamic Import Guide (Production Build Issue)

## ⚠️ CRITICAL: This is a Recurring Problem

This issue has occurred multiple times in the HOTS project. Any time you see **"Component X not found"** errors **after build** but not in development, this guide applies.

---

## The Problem

**Dynamic imports with variables DO NOT work in Vite/Rollup production builds.**

### ❌ THIS DOES NOT WORK IN PRODUCTION:
```typescript
// Dynamic path with variable - FAILS in production build
const loadComponent = (componentKey: string) => {
    return React.lazy(() => import(`./widgets/${componentKey}`));
};
```

### Why?
- **Development**: Vite resolves imports at runtime, so dynamic paths work
- **Production**: Rollup cannot statically analyze which files to bundle when the import path contains a variable, so those files are **excluded from the bundle**

---

## The Solution: Explicit Component Registry

### ✅ THIS WORKS IN PRODUCTION:
```typescript
// Explicit registry with static imports - WORKS in production
const COMPONENT_REGISTRY: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
    'WidgetA': React.lazy(() => import('./widgets/WidgetA')),
    'WidgetB': React.lazy(() => import('./widgets/WidgetB')),
    'WidgetC': React.lazy(() => import('./widgets/WidgetC')),
};

const loadComponent = (componentKey: string) => {
    const Component = COMPONENT_REGISTRY[componentKey];
    if (Component) {
        return Component;
    }
    // Fallback for missing components
    console.error(`Component not found in registry: ${componentKey}`);
    return React.lazy(() => Promise.resolve({ 
        default: () => <div>Component "{componentKey}" not found. Add it to COMPONENT_REGISTRY.</div> 
    }));
};
```

---

## Affected Files in HOTS

When adding new dynamically-loaded components, update these registries:

| File | Registry Name | Purpose |
|------|---------------|---------|
| `fontend/HOTS/src/pages/dashboard/PanelContent.tsx` | `CUSTOM_COMPONENT_REGISTRY` | Dashboard custom panels (report pages) |

---

## Checklist When Adding New Dynamic Components

1. [ ] Create the component file with **default export**
2. [ ] Add the component to the appropriate **COMPONENT_REGISTRY**
3. [ ] Rebuild and test: `npm run build && npm run preview`

---

## Common Symptoms

- ✅ Works in `npm run dev` (development)
- ❌ Shows "Component X not found" after `npm run build` (production)
- ❌ Console shows: `Custom panel component not found: ./report/X`

---

## Related Files

- `fontend/HOTS/src/pages/dashboard/PanelContent.tsx` - Main panel loader
- `fontend/HOTS/src/pages/dashboard/report/` - Custom report components

---

## History

| Date | Issue | Resolution |
|------|-------|------------|
| 2025-12-16 | SRFReportPage, EOrderReporting not found after build | Added CUSTOM_COMPONENT_REGISTRY |
| 2026-01-02 | srf_report not found after build | Re-added CUSTOM_COMPONENT_REGISTRY (fix was in different worktree) |

---

## Important Notes

1. **Every lazy-loaded component MUST have a `export default`** - Named exports won't work with `React.lazy()`
2. **This applies to ALL dynamically loaded content** - widgets, forms, panels, etc.
3. **When cloning or switching worktrees** - Verify the registry exists, fixes may not have been merged
