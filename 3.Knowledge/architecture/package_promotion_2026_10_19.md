# Promote domain and scheduling packages to HOTS — 19 October 2026

User explicitly authorized transferring the existing reusable packages into `D:/Kantor/1.Frontend/packages`. This extends the previous frontend app-core exception to the two new package directories. No Kantor app/backend/database/deployment/knowledge index is changed. Cineva copies remain because its frontend consumes local workspace snapshots rather than absolute external paths.

| Package | HOTS directory/version | Cineva fork |
|---|---|---|
| @hots/domain-kit | D:/Kantor/1.Frontend/packages/domain-kit — 0.1.0 | 0.1.0-cineva.2 |
| @hots/scheduling-kit | D:/Kantor/1.Frontend/packages/scheduling-kit — 0.1.0 | 0.1.0-cineva.2 |

Only source, package metadata, tests and package-local documentation are transferred. Generated Cineva APP_MAPs are not copied to Kantor. The new packages do not replace any old HOTS feature or alter any application dependency. Source and test bytes match between the two locations; versions and provenance docs distinguish upstream from the Cineva fork.

Portability adjustment: relative TypeScript imports explicitly use `.ts`; the event error class uses an explicit property assignment rather than a TypeScript constructor parameter property. This preserves the API/behavior while permitting Node 24 native TypeScript test execution without installing test dependencies. Runtime source remains TypeScript for a compatible bundler/TS host; there is no compiled CommonJS distribution. All code remains below 1,000 lines per file.

Acceptance: 16 domain plus 16 scheduling tests run from the actual Kantor package sources; strict ES2020 package typechecks; byte/hash comparison for every source/test file. Cineva package/consumer suite has 44 tests; existing offline and booking browser suites use synthetic data only. Evidence is in `3.Knowledge/reports/package_promotion_2026_10_19`. Commands: `npm.cmd run test:package-promotion`; `npm.cmd --prefix D:/Kantor/1.Frontend/packages/domain-kit test`; same for scheduling-kit. Native test execution requires Node 24+.

This is package availability in HOTS, not production adoption. The meeting-booking HOTS app is not rewired here. A full reusable calendar UI, recurrence/reminder policies, authoritative multi-tenant server storage/locking and durable delivery remain separate work. Database work remains deferred by the user.

Final verification passed: 32 tests in Kantor, 44 Cineva package/consumer tests, 10 offline and 9 workflow/booking browser scenarios, and Cineva production build. Package source/test SHA256 parity and zero strict package diagnostics are recorded in checks.json. Excel report: `3.Knowledge/reports/package_promotion_2026_10_19/HOTS_Package_Promotion_Report.xlsx`.
