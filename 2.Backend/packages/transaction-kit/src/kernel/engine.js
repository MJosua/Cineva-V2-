/**
 * @hots/transaction-kit — transaction engine (the service-level kernel)
 * Head: src/index.js
 * API inspired by Integrated-API core/transaction (registerType / begin / validate / execute / afterCommit /
 * rollback, types 'ticketing' | 'pos' | 'inventory'), keeping its type contract so HOTS types can be ported.
 *
 * What this kernel adds (gaps proven in the HOTS original, 2026-10-06):
 *  - it OWNS the DB transaction (HOTS relied on an optional `context.connection`; without it writes ran
 *    outside any transaction and `rollback()` only logged);
 *  - business validation that reads stock runs INSIDE the transaction after row locks (HOTS validated
 *    stock on the pool, without FOR UPDATE, before the write → two requests could both pass);
 *  - idempotency key → a repeat returns the stored result (no double order / double deduction);
 *  - events go to the outbox inside the same transaction (HOTS fired triggers before the outer commit);
 *  - deadlock / lock-wait retries.
 *
 * Type contract:
 *   {
 *     name,
 *     check?(input, ctx)                    pure validation, no DB (fast fail before a connection is taken)
 *     idempotencyKey?(input, ctx) → string  optional; opts.idempotencyKey wins
 *     execute(conn, input, ctx) → { result, events? }   locks + reads + writes (kit handles BEGIN/COMMIT)
 *     afterCommit?(result, input, ctx)      best effort (errors are logged, never undo the commit)
 *   }
 */
const { TxError, TX_ERRORS, validation, isRetryable, isDuplicate } = require('./errors');

function createTransactionEngine({ adapter, idempotency, outbox, logger = console, maxRetries = 2, now = () => new Date() } = {}) {
  if (!adapter || typeof adapter.acquire !== 'function') throw new Error('transaction-kit: adapter with acquire() is required');
  const types = new Map();

  function registerType(type) {
    if (!type || !type.name) throw new Error('transaction-kit: type.name is required');
    if (typeof type.execute !== 'function') throw new Error(`transaction-kit: type ${type.name} needs execute()`);
    types.set(type.name, type);
    return type;
  }

  async function run(typeName, input = {}, opts = {}) {
    const type = types.get(typeName);
    if (!type) throw new TxError(TX_ERRORS.UNKNOWN_TYPE, `Unknown transaction type: ${typeName}. Available: ${[...types.keys()].join(', ')}`);

    const ctx = { actor: opts.actor || null, now: now(), meta: opts.meta || {}, typeName };
    if (type.check) await type.check(input, ctx);

    const key = opts.idempotencyKey || (type.idempotencyKey ? type.idempotencyKey(input, ctx) : null);
    if (key && !idempotency) throw validation('Idempotency key given but no idempotency store configured');

    for (let attempt = 0; ; attempt += 1) {
      const conn = await adapter.acquire();
      let open = false;
      try {
        await conn.begin();
        open = true;

        if (key) {
          const stored = await idempotency.find(conn, key);
          if (stored !== undefined) {
            await conn.commit();
            open = false;
            return { ok: true, replayed: true, idempotencyKey: key, result: stored, events: [] };
          }
        }

        const out = (await type.execute(conn, input, ctx)) || {};
        const events = (out.events || []).map((e) => ({ ...e, tx_type: typeName }));
        const published = outbox && events.length ? await outbox.publish(conn, events) : [];
        if (key) await idempotency.save(conn, key, typeName, out.result);

        await conn.commit();
        open = false;

        if (type.afterCommit) {
          try {
            await type.afterCommit(out.result, input, ctx);
          } catch (err) {
            logger.warn && logger.warn(`[transaction-kit] afterCommit(${typeName}) failed: ${err.message}`);
          }
        }
        return { ok: true, replayed: false, idempotencyKey: key, result: out.result, events: published };
      } catch (err) {
        if (open) await safeRollback(conn, logger);
        open = false;

        // Same key committed by a concurrent request → return that result.
        if (key && isDuplicate(err)) {
          const stored = await readStored(adapter, idempotency, key);
          if (stored !== undefined) return { ok: true, replayed: true, idempotencyKey: key, result: stored, events: [] };
        }
        if (isRetryable(err) && attempt < maxRetries) continue;
        throw err;
      } finally {
        try {
          conn.release();
        } catch (_) {
          /* ignore */
        }
      }
    }
  }

  return { registerType, run, listTypes: () => [...types.keys()], getType: (n) => types.get(n) };
}

async function safeRollback(conn, logger) {
  try {
    await conn.rollback();
  } catch (err) {
    logger.error && logger.error(`[transaction-kit] rollback failed: ${err.message}`);
  }
}

async function readStored(adapter, idempotency, key) {
  const conn = await adapter.acquire();
  try {
    await conn.begin();
    const stored = await idempotency.find(conn, key);
    await conn.commit();
    return stored;
  } catch (_) {
    await safeRollback(conn, {});
    return undefined;
  } finally {
    conn.release();
  }
}

module.exports = { createTransactionEngine };
