# HOTS Frontend Development Guide

## Quick Reference for AI Assistants

> **IMPORTANT**: Always check this file when working on HOTS frontend code!

## API Configuration

### API_URL - ALWAYS USE THIS FOR API CALLS

```typescript
import { API_URL } from '@/config/sourceConfig';
// or
import { API_URL } from '../config/sourceConfig';

// Example usage:
const API_BASE = `${API_URL}/hots_settings`;
fetch(`${API_URL}/hots_ticket/get_ticket/${id}`)
```

**NEVER use relative paths like `/hots_settings/...` directly!**
The frontend runs on a dev server (Vite) which doesn't proxy to the backend.

### Authentication Token

HOTS uses a token stored in localStorage with key `'tokek'` (note the spelling):

```typescript
const token = localStorage.getItem('tokek');

// Use in fetch headers:
fetch(url, {
    headers: { 
        'Authorization': `Bearer ${localStorage.getItem('tokek')}` 
    }
})
```

### Admin Role Check

HOTS uses role_id `4` for admin users:

```typescript
// Frontend admin check
const isAdmin = (() => {
    try {
        const token = localStorage.getItem('tokek');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role_id === 4 || payload.role_id === '4';
        }
    } catch { }
    return false;
})();
```

## Backend Route Mounting

Routes are mounted in `index.js`:

| Frontend Calls | Backend Route Mount |
|----------------|---------------------|
| `/hots_settings/...` | `App.use("/hots_settings", hotsSettings)` |
| `/hots_ticket/...` | `App.use("/hots_ticket", hotsTicket)` |
| `/hots_auth/...` | `App.use("/hots_auth", hotsAuth)` |
| `/hots_admin/...` | `App.use("/hots_admin", hotsAdmin)` |
| `/hotsdashboard/...` | `App.use("/hotsdashboard", hotsdashboard)` |
| `/engine/...` | `App.use("/engine", engineRouter)` |

## Environment Variables

Frontend uses Vite env vars (`.env` or `.env.local`):

```bash
VITE_API_URL=http://localhost:3001
```

Accessed via:
```typescript
import.meta.env.VITE_API_URL
```

## Common Patterns

### Creating a New API Service

```typescript
import { API_URL } from '@/config/sourceConfig';

const API_BASE = `${API_URL}/your_route`;

export async function fetchSomething() {
    const response = await fetch(`${API_BASE}/endpoint`, {
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('tokek')}` 
        }
    });
    return response.json();
}
```

### Using React Query / Axios

If using axios with interceptors, the base URL should still be `API_URL`.

## Sidebar Menu (AppLayout.tsx)

Admin menu items are defined in `adminItems` array in `AppLayout.tsx`:

```typescript
const adminItems = [
    {
        title: "Menu Title",
        url: "/admin/your-page",
        icon: YourIcon,
        description: "Description",
    },
    // ...
];
```

## Adding New Routes

1. Add route in `App.tsx`:
```tsx
<Route path="/admin/your-page" element={<ProtectedRoute><AppLayout><YourComponent /></AppLayout></ProtectedRoute>} />
```

2. Add menu item in `AppLayout.tsx` (if admin):
```typescript
const adminItems = [
    // ...existing items
    {
        title: "Your Page",
        url: "/admin/your-page",
        icon: YourIcon,
    },
];
```
