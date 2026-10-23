---
package: "@hots/workflow-policy-kit"
version: 0.2.0
purpose: Reusable approval timeout policy (wait / warn / auto_reject) - validation, per-step resolution, working-hours and holiday time math, and UI option lists for any workflow editor.
domain: shared-platform
status: consumed by HOTS (Vite alias)
owner: hots-platform
depends_on: []
must_not: import from an app, call an API, or hardcode API_URL or tokens
---

# @hots/workflow-policy-kit

Frontend home of the approval timeout policy that the HOTS backend stores in `m_service_workflow.definition`.

## Single source of truth
`src/approvalTimeoutPolicy.generated.js` is **generated** from the backend helper
`2.Backend/Integrated-API/programs/hots/core/workflowTimeout/approvalTimeoutPolicy.js` by
`node "3.Knowledge/sync_workflow_policy_kit.js"` (`--check` fails when stale). Change the backend file, then regenerate. Never edit the generated file.

## What is in it
| Export | Use |
|---|---|
| `validatePolicy`, `validateDefinitionPolicies` | Same rules the API applies on save (the API stays authoritative; `auto_reject` is admin-only). |
| `resolvePolicy`, `findStepForLevel`, `definitionHasPolicy` | Effective policy of a step (service policy overlaid by the step's own fields). |
| `evaluateTimeout`, `addWorkingHours`, `workingMinutesBetween` | Show "due at" and "overdue" in lists/diagnosis; holidays are passed in as a `Set('YYYY-MM-DD')`. |
| `describePolicy`, `MODE_OPTIONS`, `WEEKDAY_OPTIONS`, `POLICY_PRESETS` | Labels and starting values for an editor. |
| `@hots/workflow-policy-kit/react` → `TimeoutPolicyEditor` | Controlled form (service or step level, `allowAutoReject` hides the admin-only mode); plain Tailwind classes, `react` is an optional peer. Used by the HOTS visual workflow editor. |

## Policy shape
```json
{ "mode": "warn", "after_hours": 24, "repeat_hours": 24, "max_warnings": 3,
  "exclude_holidays": true,
  "working_hours": { "start": "08:00", "end": "17:00", "days": [1,2,3,4,5], "timezone": "Asia/Jakarta" } }
```
Service level: `definition.timeout_policy`. Step level: `steps[i].timeout_policy` overrides only the fields it sets; `{ "mode": "wait" }` switches it off for that step.
No `working_hours` = 24h calendar. No policy = wait indefinitely (current behaviour).

## Consuming it (HOTS example)
Vite aliases in `1.Frontend/HOTS/vite.config.ts` (`@hots/workflow-policy-kit` and the more specific `/react`, plus `resolve.dedupe` for react) and types in `src/types/hots-workflow-policy-kit.d.ts`.

Backend design and rollout: `3.Knowledge/domains/hots/approval_timeout_policy_2026_10_14.md`.
