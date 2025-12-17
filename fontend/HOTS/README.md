CMS Frontend Patch
==================

Files to copy into your frontend project:

- src/api/cms.ts
- src/pages/cms/CmsPublicPage.tsx
- src/pages/cms/CmsAdminList.tsx
- src/pages/cms/CmsAdminEditor.tsx

Routes to add (in App.tsx):
- /page/:slug -> CmsPublicPage
- /admin/cms -> CmsAdminList
- /admin/cms/new -> CmsAdminEditor
- /admin/cms/edit/:id -> CmsAdminEditor

Sidebar:
Add admin menu link to /admin/cms as shown in instructions.

Notes:
- The frontend expects API at API_URL from your existing config.
- Admin endpoints require authentication cookie / token as used in your app.
