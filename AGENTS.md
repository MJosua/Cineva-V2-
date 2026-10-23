# Cineva workspace instructions

Read `3.Knowledge/KNOWLEDGE_INDEX.md` first, then `3.Knowledge/FILE_MAP.md` and the relevant app `APP_MAP.md` before technical decisions.

HOTS in `D:/Kantor` is READ-ONLY reference for this project. Never edit its source, packages, knowledge, database, Git state, build/deploy outputs or run its index writers. All changes and future-HOTS notes belong in Cineva. Reusable packages are local snapshots; record upstream provenance and explicit Cineva fork versions.

Cineva is a vendor customization: brown/gold/white presentation belongs in the Cineva vendor theme adapter, not HOTS engine/default package edits. HOTS original remains the reusable foundation. Future upstream capabilities must be additive and backward-compatible (retain old features/defaults); record proposals here for the owning Kantor project to implement, never modify Kantor from this workspace.

- Frontend: `1.Frontend/HOTS`. Backend: `2.Backend/Integrated-API`. Knowledge: `3.Knowledge`.
- Root npm scripts delegate to each app. Run backend commands with backend working directory so environment, uploads and runtime paths remain correct.
- Frontend dependency installation uses the workspace at `1.Frontend` and its single lockfile: `npm.cmd --prefix 1.Frontend ci`. Do not recreate a standalone HOTS lockfile. Vite and TypeScript peer resolution follow the host config.
- Explain architectural impact before editing. New features follow a modular engine pattern and reuse shared HOTS packages before adding duplicate engines.
- Preserve ticket EAV `cstm_col`, `lbl_col`, `value` and existing profile/work-data contracts.
- Generate SQL only from the latest physical schema in knowledge; conceptual/draft documents are not authoritative DDL. Ask for the correct schema if missing.
- Every DB write requires transaction + commit + rollback. Folder/index work must never run DB repair scripts or cron implicitly.
- Keep one-time migration, audit and checking scripts inside `3.Knowledge/scripts`.
- Per-module runtime logs use the existing SSE logger/parser. Avoid direct runtime console logging.
- Keep superseded/unused code in `3.Knowledge/_old` or `_archive` with provenance and rollback context; archive only after a verified replacement.
- Update knowledge Markdown when new logic is discovered. Update/add the Excel report for audit/change work.
- Re-index source/docs changes with `npm.cmd run knowledge:index`. Retrieve with `npm.cmd run knowledge:search -- <words>`, then inspect the exact source.
- Index scope excludes secrets, keys, uploads, dependencies, generated output and archived code. Do not weaken those exclusions to improve search counts.
- Preserve historical report paths as evidence; use `3.Knowledge/architecture/folder_restructure_2026_10_14.md` for old-to-current mapping.

Stack: Node.js/Express, MySQL 8/mysql2, React/Vite, JSON-driven form/workflow/trigger/document engines; deployment environment follows HOTS VPS/Cloudflare/PM2 contracts but is not verified by a local build.
