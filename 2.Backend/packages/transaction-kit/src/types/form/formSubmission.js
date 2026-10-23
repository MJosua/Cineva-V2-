/**
 * @hots/transaction-kit — Form Engine response submission
 * Head: src/index.js
 * Tables (3.Knowledge/schema/hots.md): form_m_definition(form_id, service_id, slug, status, access_mode,
 * schema_version, settings_json) and form_t_response(response_uuid UQ, form_id, service_id, schema_version,
 * schema_snapshot, response_snapshot, respondent_user_id, submission_meta_json, submitted_at).
 *
 * Rules (all parameters / settings, none hard-coded):
 *  - form must be `published`; `authenticated` forms need a user;
 *  - settings_json.max_responses (quota) and settings_json.one_response_per_user are checked under a
 *    lock on the form row, so a quota of 100 can never accept 101;
 *  - the client's submission id = response_uuid = idempotency key (double click → same answer).
 * NOTE: settings keys `max_responses` / `one_response_per_user` are new kit conventions; the default
 * repo SQL must be verified against app/modules/form-engine before production use.
 *
 * input: { slug, submission_id (uuid), values, user_id?, schema_snapshot?, meta? }
 */
/* eslint-disable no-restricted-syntax -- SQL identifiers (table/column names) come from validated options or constants; every value is a ? parameter (standard 11 §4) */
const { validation, notFound, conflict, ruleViolation } = require('../../kernel/errors');
const { assertIdentifier } = require('../../kernel/idempotency');

function createFormSubmissionType({ repo = mysqlFormRepo(), name = 'form.submit', eventType = 'form_submitted' } = {}) {
  return {
    name,
    check(input) {
      if (!input.slug) throw validation('slug is required');
      if (!/^[0-9a-f-]{36}$/i.test(String(input.submission_id || ''))) throw validation('submission_id must be a UUID');
      if (!input.values || typeof input.values !== 'object') throw validation('values is required');
    },
    idempotencyKey: (input) => `${name}:${input.submission_id}`,
    async execute(conn, input) {
      const form = await repo.lockForm(conn, input.slug);
      if (!form) throw notFound(`Form ${input.slug} not found`);
      if (form.status !== 'published') throw ruleViolation(`Form ${input.slug} is ${form.status}`, { status: form.status });
      if (form.access_mode === 'authenticated' && !input.user_id) throw ruleViolation('Login required', { code: 'FORM_LOGIN_REQUIRED' });

      const settings = parseJson(form.settings_json);
      if (Number(settings.max_responses) > 0) {
        const count = await repo.countResponses(conn, form.form_id);
        if (count >= Number(settings.max_responses)) throw ruleViolation('This form has reached its response limit', { limit: Number(settings.max_responses) });
      }
      if (settings.one_response_per_user && input.user_id && (await repo.hasUserResponse(conn, form.form_id, input.user_id))) {
        throw conflict('You have already submitted this form');
      }

      const response = {
        response_uuid: input.submission_id,
        form_id: form.form_id,
        service_id: form.service_id,
        schema_version: form.schema_version,
        schema_snapshot: input.schema_snapshot ?? null,
        response_snapshot: input.values,
        respondent_user_id: input.user_id ?? null,
        submission_meta_json: input.meta ?? null,
      };
      const responseId = await repo.insertResponse(conn, response);
      return {
        result: { response_id: responseId, response_uuid: input.submission_id, form_id: form.form_id },
        events: [{ event_type: eventType, ref_id: input.submission_id, service_id: form.service_id, form_id: form.form_id, idempotency_key: `${eventType}_${input.submission_id}` }],
      };
    },
  };
}

function mysqlFormRepo({ formTable = 'hots.form_m_definition', responseTable = 'hots.form_t_response' } = {}) {
  [formTable, responseTable].forEach(assertIdentifier);
  return {
    async lockForm(conn, slug) {
      const [rows] = await conn.query(`SELECT form_id, service_id, status, access_mode, schema_version, settings_json FROM ${formTable} WHERE slug = ? FOR UPDATE`, [slug]);
      return rows[0] || null;
    },
    async countResponses(conn, formId) {
      const [rows] = await conn.query(`SELECT COUNT(*) AS n FROM ${responseTable} WHERE form_id = ?`, [formId]);
      return Number(rows[0].n);
    },
    async hasUserResponse(conn, formId, userId) {
      const [rows] = await conn.query(`SELECT 1 FROM ${responseTable} WHERE form_id = ? AND respondent_user_id = ? LIMIT 1`, [formId, userId]);
      return rows.length > 0;
    },
    async insertResponse(conn, r) {
      const [res] = await conn.query(
        `INSERT INTO ${responseTable} (response_uuid, form_id, service_id, schema_version, schema_snapshot, response_snapshot, respondent_user_id, submission_meta_json, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [r.response_uuid, r.form_id, r.service_id, r.schema_version, JSON.stringify(r.schema_snapshot ?? {}), JSON.stringify(r.response_snapshot), r.respondent_user_id, r.submission_meta_json ? JSON.stringify(r.submission_meta_json) : null],
      );
      return res.insertId;
    },
  };
}

const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v || '{}') : v || {});

module.exports = { createFormSubmissionType, mysqlFormRepo };
