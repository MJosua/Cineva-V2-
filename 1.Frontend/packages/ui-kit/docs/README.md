---
app: @hots/ui-kit
purpose: Shared package @hots/ui-kit: shadcn components, Tailwind preset, tokens and media viewers
domain: Shared Platform
owner: iod.it
status: active
base: -
port: -
api_prefix: -
owns_tables: []
reads_tables: []
writes_tables: []  # shared tables this app also writes
emits: []
listens: []
depends_on: []
must_not: ["write:*"]
---

# @hots/ui-kit

shadcn/Radix component library + Tailwind preset + design tokens. Standard styling for new programs is **Tailwind** (decision 2026-10-05).

- **Version:** 0.2.0 · **Source:** copied from `HOTS/src/components/ui` on 2026-10-05 (HOTS unchanged); `media/` from E-Order 2026-10-06

## Setup
```js
// tailwind.config
presets: [require('@hots/ui-kit/tailwind-preset')],
content: ['./src/**/*.{ts,tsx}', '../packages/ui-kit/src/**/*.{ts,tsx}'],
```
```css
/* main.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
@import '@hots/ui-kit/styles.css';
```
```tsx
import { Button, Dialog, Table, cn } from '@hots/ui-kit';
```

## What was copied / left out
- Copied: 57 generic components (`button` … `tooltip`, `sidebar`, `chart`, `RichTextEditor`, `hots-suggestion-select`, `UserStatusBadge`, `TicketPagination`, `CardCollapsible`, skeletons), `cn`, `useIsMobile`.
- Left in HOTS (coupled to HOTS store/API): `FilePreview`, `ProgressionBar`, `RatingWidget`, `TaskApprovalActionssimple`, `TaskListBadge`.
- Left out: Radix `toast` / `toaster` / `use-toast` — the standard toast is **sonner** (`Toaster` from `sonner.tsx`).
- Heavy libs are optional peers: tiptap (RichTextEditor), recharts (chart), framer-motion (CardCollapsible), react-hook-form (form), next-themes (sonner).

## Re-syncing from HOTS
Imports were rewritten: `@/lib/utils` → `../lib/utils`, `@/components/ui/x` → `./x`, `@/hooks/use-mobile` → `../hooks/use-mobile`. When HOTS fixes a component, copy it again with the same rewrite and record it in CHANGELOG.

## Media subpath (`@hots/ui-kit/media`, 0.2.0)
Kept out of the main entry so apps without these libraries are unaffected.
| Export | Source | Peer |
|---|---|---|
| `PdfViewer` | `E-Order/src/components/media/PDFViewer/PdfViewer.jsx` | `react-pdf` |
| `XlsxPreview`, `parseFirstSheet` | `E-Order/src/components/media/ExcelViewer/ExcelViewer.jsx` (without html2canvas image step) | `xlsx` |
