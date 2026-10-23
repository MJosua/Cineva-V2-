---
app: @hots/service-form-runtime
purpose: Shared runtime (@hots/service-form-runtime) that runs service request forms on top of @hots/dynamic-form
domain: Shared Platform
owner: iod.it
status: active
base: -
port: -
api_prefix: -
owns_tables: []
reads_tables: []
writes_tables: []  # shared tables this app also writes
emits: []
listens: []
depends_on: ["@hots/dynamic-form"]
must_not: ["write:*"]
---

# service-form-runtime

> Shared runtime (@hots/service-form-runtime) that runs service request forms on top of @hots/dynamic-form

The YAML block above is this app's **card** (STANDARDS S7). The brain compares it with the code: run `node "3.Knowledge/brain_check_app.js" 1.Frontend/service-form-runtime` before calling a change done.

Card generated on 2026-10-12 from observed code (`brain_check_app.js --draft`). Review `purpose`, `domain`, `owns_tables` and `must_not` when you next work on this app.
