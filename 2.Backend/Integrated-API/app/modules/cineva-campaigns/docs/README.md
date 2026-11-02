---
app: cineva-campaigns
purpose: Backend for Cineva campaign operations (campaign, stage plan, assignment, draft/QC, posting, insight, payout, cancellation, late submission) over t_cineva_*.
domain: cineva
owner: cineva
status: trial (opt-in, not applied to hots)
base: /api/cineva/v1
owns_tables: t_cineva_campaign, t_cineva_campaign_milestone, t_cineva_campaign_batch, t_cineva_campaign_product, t_cineva_stage_holiday, t_cineva_stage_extension, t_cineva_assignment, t_cineva_social_profile, t_cineva_deliverable, t_cineva_delivery_draft, t_cineva_delivery_review, t_cineva_review_approval, t_cineva_delivery_posting, t_cineva_payout, t_cineva_insight_snapshot, t_cineva_cancellation, t_cineva_late_submission
reads_tables: m_company, m_company_program_list, user
emits: cineva_campaign_changed
depends_on: "@hots/domain-kit (evaluateGate, evaluateCancellation), @hots/scheduling-kit (evaluateExtension)"
must_not: touch the hots database before the DDL is approved; import env or the DB pool directly; delete financial or QC history
---

# cineva-campaigns

Layers: `routes.js` (HTTP envelope, fail-closed 503) → `service.mjs` (use cases and rules) → `repository.mjs` (SQL) → `db.mjs` (UTC session, `beginTransaction`/`commit`/`rollback`). Parameters live in `config.mjs`; shared rules are imported once in `policyPorts.mjs`.

## Enabling
Off by default. Set `CINEVA_CAMPAIGNS_ENABLED=1` and `CINEVA_PRINCIPAL_FACTORY=<file>.cjs|mjs` (a file in `config/` exporting `createPrincipalResolver({pool, logger})` that returns `async (req) => ({userId, programId, companyId, product: 'hq'|'creator'})`). No default identity exists.

## Rules implemented (client answers)
Two-layer QC approval (`client`+`owner`); payout request needs post live, insight and QC-approved Creator deliverables; extension once for 2 days; draft closes after the deliverable deadline and reopens only after HQ approves a late request; cancellation per `CLIENT-2026-11-03` (reasons, 15% penalty, refund); list queries capped at 100 rows with pagination metadata; every write is a transaction; optimistic `revision` on the stage plan.

## Trial
Tests: `npm run test:cineva` (needs the trial MySQL on `127.0.0.1:3307`; skipped with a reason if unreachable). Live API: `node 3.Knowledge/scripts/cineva_db_trial_2026_11_02/serve_trial.mjs`.

## Not done / open
Stage template keys are not validated server-side (templates live in the frontend); late-submission count and impact (L11) and the penalty payee (N6) are unanswered; the SSE event is only logged through the injected logger; the frontend still uses dummy local storage; DDL not applied to hots and not tested on MySQL 8.0.20; `@hots` kits are imported by relative path from `1.Frontend/packages` as TypeScript (needs Node 22.18+/24 type stripping when enabled).
