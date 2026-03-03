# Conversation History & Project Context

> **Purpose**: This file tracks our conversation history and key decisions for this project.
> **Last Updated**: 2024-12-14

---

## Project Overview

**Project Name**: IOD E-Order Express.js API  
**Type**: Node.js/Express.js Backend API  
**Database**: MySQL (mysql2)

### Main Modules
| Module | Description |
|--------|-------------|
| **E-Order** | Order management, cart, products |
| **HOTS** | Ticketing system with SRF, TPS, dashboard |
| **Project Manager** | Tasks, teams, projects, Kanban, Gantt |
| **Meeting Book** | Room booking, timeslots, scheduling |
| **Engine** | Workflow engine, tickets, assignments, modules |
| **CMS** | Content management system |
| **Trademark** | Trademark management |
| **Searates** | Shipping rates integration |

### Tech Stack
- Express.js (v4.18.1)
- MySQL/MySQL2
- Socket.io (v4.8.0)
- JWT authentication
- Nodemailer
- Puppeteer (PDF generation)
- Swagger (API docs)

---

## Conversation Log

### 2024-12-14 - Initial Session
**Topic**: Project Discovery & Memory Setup

**Summary**:
- User opened the API project workspace
- I don't have previous memory of this specific API project (previous conversations were about Moodle/SIAKAD plugin)
- Explored the existing `knowledge/` folder structure
- Created this conversation history file

**Key Discoveries**:
- Project has comprehensive documentation in `knowledge/backend/backend_analysis.md`
- SQL schema documented in `knowledge/sql/tables.json` and `relations.json`
- Frontend is a separate React/Vite app in `knowledge/frontend/`

---

## Pending Items / TODOs

- [ ] (Add items as we work on the project)

---

## Important Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-12-14 | Created conversation-history.md | To maintain project context between sessions |

---

## Quick References

### Useful Commands
```bash
# Start the server
npm start

# Development with nodemon
npm run nodemon
```

### Key Files
- `index.js` - Main entry point
- `config/db.js` - Database configuration
- `config/env.js` - Environment variables
- `.env` - Environment file (not in git)

---

*Add notes below as we continue working together:*

