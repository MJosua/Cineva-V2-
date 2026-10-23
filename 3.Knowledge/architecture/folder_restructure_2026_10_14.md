# Cineva folder separation and retrieval index

Date: 2026-10-14 (Asia/Jakarta). Status: folder move, static path validation and frontend production build completed. [Excel report](../reports/folder_restructure_2026_10_14/Cineva_Folder_Restructure.xlsx).

## Architectural impact

Workspace now follows the HOTS Kantor top-level convention. Backend moved as a complete app, preserving its internal relative paths. This is preparation for shared packages and modular platform upgrades; it does not convert business controllers into the new HOTS programs/module.json layout yet. No API route, marketplace logic, EAV contract or DB mutation was changed.

```text
Cineva-V2-/
  1.Frontend/HOTS/                existing frontend
  2.Backend/Integrated-API/       existing backend + .env + public
  3.Knowledge/
    architecture/                current structural decisions
    tools/                       config-driven indexing engine and search CLI
    scripts/legacy/              original one-time DB repair scripts
    scripts/restructure_2026_10_14/  move evidence and report builder
    reports/                     audit and restructure workbooks
  4. Refrence/                   existing references, unchanged
  package.json                   workspace commands, no app dependencies
  README.md
```

## Old to current path mapping

| Before | Current | Reason |
|---|---|---|
| `1, fontend/HOTS` | `1.Frontend/HOTS` | Match Kantor naming and fix spelling |
| `3. knowledge` | `3.Knowledge` | Match knowledge entry convention |
| `app`, `bootstrap`, `config`, `controller`, `core`, `jobs`, `middleware`, `public`, `routers`, `script`, `server`, `service` | `2.Backend/Integrated-API/<same folder>` | App remains one relative-import unit |
| `.env`, `index.js`, `ecosystem.config.js`, backend package/lock, pack script, original README | `2.Backend/Integrated-API/<same file>` | App runtime ownership |
| `fix_schema.js`, `tmp-repair-dash.js` | `3.Knowledge/scripts/legacy/<same file>` | One-time maintenance stays outside deploy app |

Git stays at workspace root. References and `.continue` stay at their existing locations. No deletion of original source files; moves are recorded in `scripts/restructure_2026_10_14/before.json` with old/new path, size and SHA256. Earlier audit files keep pre-restructure paths as historical evidence. The audit builder now resolves current paths when rerun.

## Launch and packaging contracts

- Root `npm start` and `dev:backend` delegate to `npm --prefix 2.Backend/Integrated-API`, so the backend working directory remains its app root.
- `.env` moved byte-for-byte with backend. The backend still loads `.env.local` from its own root if provided.
- PM2 config now sets `cwd: __dirname`. Existing name/instance/process settings remain unchanged.
- Both pack BATs enter their own folder through `cd /d "%~dp0"` before building/packing.
- Frontend directly imports `uuid` in UnifiedFormStructureEditor and StudioPage but originally omitted it from its package. After separation, clean frontend build failed to resolve it. The frontend now declares `uuid` 8.3.2 explicitly, matching the existing backend lockfile version, so its dependency does not rely on a parent/backend install. No editor behavior changed.
- Existing backend `build` still refers to missing `build.js` in its original package. This pre-existing limitation was not repaired by a folder move; source pack BAT remains the existing packaging mechanism.
- Repair scripts have updated backend imports and explicit backend dotenv path. They were not executed, and DDL/data mutation behavior has not been audited for safe execution.

## Index and retrieval architecture

`tools/index.config.json` owns app scopes, directory exclusions and chunk line limits. `index-engine.mjs` owns file scanning and static extraction. `index-workspace.mjs` writes knowledge/code manifests and app maps; `search-index.mjs` queries those outputs. They do not import runtime controllers or connect to a database.

Outputs:

- `FILE_MAP.md`: app roots and knowledge pointers.
- `code_manifest.json`: exact source paths, SHA256, line counts, literal imports and literal route definitions.
- `knowledge_manifest.json`: documentation paths, titles, headings and SHA256.
- `knowledge_chunks.jsonl`: document text with source hash and citation line ranges.
- `APP_MAP.md` per app: file-level navigation.

Exclusions include `.env`, key material, upload/public, generated/build, dependencies, archive, one-time legacy scripts and index outputs. Retrieval uses case-insensitive all-term matching on file/import/route metadata and document chunks. This is a local retrieval foundation, not a semantic/vector RAG system. Regex extraction may include comments and misses computed/dynamic route strings; read exact source after locating candidates. Draft schema remains draft; a database table mention is not authoritative DDL.

```powershell
npm.cmd run knowledge:index
npm.cmd run knowledge:search -- jobmarketplace
rg -n "approveApplicant" 2.Backend/Integrated-API
rg -n "JobMarketplace" 1.Frontend/HOTS/src
```

## Verification and rollback

Initial move check: 1,651 captured files; 1,646 byte-identical after move; five intentional support edits (PM2 cwd, two BAT cwd changes and two repair-script imports). The subsequent frontend dependency repair additionally changes its package and lockfile; final counts are in after.json and Excel. No missing files. All 586 static relative-require checks retain their before/after resolution status. The 56 unresolved baseline references are existing source/legacy/comment matches; the restructure adds no unresolved references in this check. Full runtime module resolution is not implied by regex checks.

Final move check: 1,644 byte-identical and seven intentional support/dependency changes. Index contains 687 source files (474 frontend including MJS/CJS scope; 213 backend), eight knowledge documents and 105 chunks. All indexed source/doc paths exist; forbidden path check finds zero. Search for `approveApplicant` and `takeJob` returns frontend and backend owners plus related knowledge. Counts follow configured active-source exclusions and differ from the earlier broader frontend byte-comparison scope.

Frontend clean dependency install passed. Production build passes after declaring uuid explicitly: Vite 5.4.10, 4,816 transformed modules, 33.24 seconds. Warnings remain for old Browserslist data, pdfjs eval, mixed static/dynamic imports and large bundle chunks. These are not repaired as part of folder separation. Browser behavior remains untested.

Syntax checks for edited JS/MJS and PM2 cwd evaluation pass. Backend server, cron, DB, PM2 restart, SQL repair and deployment were not run. Frontend build status is in the generated workbook/check evidence. Index path existence, exclusion and retrieval checks are recorded there too.

Rollback layout using the old/new map in `before.json`, only after checking destination conflicts and stopping relevant app processes. Restore support/config edits from Git/source history as appropriate; preserve local changes and environment files. Do not automatically rerun any SQL repair script. Git recognizes tracked moves once reviewed/staged; no commit or branch reset was performed.
