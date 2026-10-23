# Existing one-time repair scripts

Moved from workspace root on 2026-10-14 to keep deployment code separate from maintenance scripts. Relative imports and dotenv paths now refer to 2.Backend/Integrated-API.

These scripts were not executed during the folder restructure. They contain DDL/data mutations and retain existing behavior; relocation does not certify schema accuracy, idempotency or transaction handling. Read the latest physical schema and scope before using them. They are outside the app dependency tree, deployment package and retrieval corpus.
