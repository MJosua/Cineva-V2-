# Production Deployment Protocol

## Production ZIP Contents
The `pack_for_prod.bat` script generates a deployment package containing the following essential components:

- **Logic & Configuration**: `config/`, `controller/`, `core/`, `routers/`, `service/`, `middleware/`
- **Engine Data**: `script/` (EAV module configurations)
- **Core Files**: `index.js`, `package.json`, `package-lock.json`, `ecosystem.config.js`, `views_def.txt`

### Excluded Directories
- **Documentation & Research**: `3. knowledge/` (Managed in Git only).
- `public/`: Assets and user-uploaded files (Too large, managed separately).
- `scripts/`: Development and one-time local scripts.
- `node_modules/`: Installed via `npm install` on the server.
- `1, frontend/`: Source React code (Build output managed separately).
- **Documentation & Research**: `3. knowledge/`

## Script Storage Protocol
All one-time scripts, SQL migrations, and maintenance tools MUST be stored in the following directory to ensure visibility and backup:

> **Designated Folder**: `3. knowledge/action/`

### Requirements:
1. **Naming**: Use descriptive names (e.g., `migrate_service_13_params.sql`).
2. **Persistence**: Never delete scripts after execution; move them to a `history/` subfolder if necessary, but keep them within the `knowledge` tree.
3. **Documentation**: Add a brief comment at the top of the file explaining its purpose and when it was run.
