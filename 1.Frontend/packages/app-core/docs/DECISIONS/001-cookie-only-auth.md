# 001 — Auth tokens only in httpOnly cookies

- **Date:** 2026-10-05 · **Status:** accepted

## Context
HOTS stores tokens in several localStorage keys and ~171 files build `Bearer` headers manually; SSE passes the token in the URL.

## Decision
Tokens live only in httpOnly cookies. The client sends `withCredentials` and never `Authorization`. CSRF = `SameSite=Lax` + Origin allowlist + double-submit `csrf_token`. SSE uses the cookie or a single-use short-lived ticket.

## Consequences
Backend must add CSRF middleware and `/sse/ticket`. All apps must live under `*.indofoodinternational.com` (same-site) or use the Vite dev proxy.
