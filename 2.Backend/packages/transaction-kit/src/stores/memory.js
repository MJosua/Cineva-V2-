/**
 * @hots/transaction-kit — in-memory database for tests and prototypes
 * Head: src/index.js
 * Emulates what the kit relies on in MySQL/InnoDB:
 *  - row locks held until commit/rollback (a second transaction WAITS, like SELECT … FOR UPDATE);
 *  - rollback undoes every write of the transaction;
 *  - unique keys (ER_DUP_ENTRY) for idempotency / outbox keys.
 * Not an SQL engine: stores and repos below call `conn.mem.*` instead of SQL.
 */

function createMemoryDb(seed = {}) {
  const tables = new Map(); // name → Map(key → row)
  const lockOwners = new Map(); // lockKey → connId
  const waiters = new Map(); // lockKey → [resolve]
  let nextConnId = 1;
  let autoId = 1000;

  for (const [name, rows] of Object.entries(seed)) {
    const t = table(name);
    for (const [k, v] of Object.entries(rows)) t.set(String(k), clone(v));
  }

  function table(name) {
    if (!tables.has(name)) tables.set(name, new Map());
    return tables.get(name);
  }

  async function acquireLock(key, connId) {
    while (lockOwners.has(key) && lockOwners.get(key) !== connId) {
      await new Promise((resolve) => {
        if (!waiters.has(key)) waiters.set(key, []);
        waiters.get(key).push(resolve);
      });
    }
    lockOwners.set(key, connId);
  }

  function releaseLocks(connId) {
    for (const [key, owner] of [...lockOwners]) {
      if (owner !== connId) continue;
      lockOwners.delete(key);
      const queue = waiters.get(key) || [];
      waiters.delete(key);
      queue.forEach((wake) => wake());
    }
  }

  const adapter = {
    kind: 'memory',
    async acquire() {
      const id = nextConnId++;
      let undo = [];
      const mem = {
        /** Lock a row (waits if another transaction holds it) and return a copy. */
        async lock(tableName, key) {
          await acquireLock(`${tableName}:${key}`, id);
          const row = table(tableName).get(String(key));
          return row ? clone(row) : null;
        },
        read(tableName, key) {
          const row = table(tableName).get(String(key));
          return row ? clone(row) : null;
        },
        rows(tableName) {
          return [...table(tableName).values()].map(clone);
        },
        async write(tableName, key, row) {
          const k = String(key);
          await acquireLock(`${tableName}:${k}`, id);
          const t = table(tableName);
          const before = t.has(k) ? clone(t.get(k)) : undefined;
          undo.push(() => (before === undefined ? t.delete(k) : t.set(k, before)));
          t.set(k, clone(row));
        },
        async insertUnique(tableName, key, row) {
          const k = String(key);
          await acquireLock(`${tableName}:${k}`, id);
          if (table(tableName).has(k)) {
            const err = new Error(`Duplicate entry '${k}' for ${tableName}`);
            err.code = 'ER_DUP_ENTRY';
            throw err;
          }
          await mem.write(tableName, k, row);
        },
        nextId: () => autoId++,
      };
      return {
        mem,
        query() {
          throw new Error('memory adapter has no SQL; use memory stores/repos');
        },
        async begin() {
          undo = [];
        },
        async commit() {
          undo = [];
          releaseLocks(id);
        },
        async rollback() {
          for (const fn of undo.reverse()) fn();
          undo = [];
          releaseLocks(id);
        },
        release() {
          releaseLocks(id);
        },
      };
    },
  };

  return { adapter, table: (n) => [...table(n).values()].map(clone), get: (n, k) => clone(table(n).get(String(k))) };
}

// ---- memory implementations of the kit's storage contracts

const memoryIdempotency = () => ({
  async find(conn, key) {
    const row = await conn.mem.lock('tx_idempotency', key);
    return row ? row.result : undefined;
  },
  async save(conn, key, txType, result) {
    await conn.mem.insertUnique('tx_idempotency', key, { tx_type: txType, result: result === undefined ? null : result });
  },
});

const memoryOutbox = () => ({
  async publish(conn, events) {
    const saved = [];
    for (const e of events) {
      const key = e.idempotency_key || `${e.event_type}_${e.ticket_id ?? e.ref_id}_v${e.version || 1}`;
      try {
        await conn.mem.insertUnique('outbox', key, { ...e, status: 'PENDING', idempotency_key: key });
        saved.push({ idempotency_key: key, duplicate: false });
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err;
        saved.push({ idempotency_key: key, duplicate: true });
      }
    }
    return saved;
  },
});

/** items table rows: { id, label, stocks: { [loc]: qty } } — movements appended to 'movements'. */
const memoryStockStore = () => ({
  async lockItems(conn, ids) {
    const map = new Map();
    for (const id of ids) {
      const row = await conn.mem.lock('items', id);
      if (row) map.set(String(id), { ...row, stocks: { ...(row.stocks || {}) } });
    }
    return map;
  },
  async saveItem(conn, item) {
    await conn.mem.write('items', item.id, { id: item.id, label: item.label, stocks: item.stocks });
  },
  async appendMovements(conn, rows) {
    for (const r of rows) await conn.mem.write('movements', conn.mem.nextId(), r);
  },
});

const memoryFormRepo = () => ({
  lockForm: (conn, slug) => conn.mem.lock('forms', slug),
  countResponses: async (conn, formId) => conn.mem.rows('responses').filter((r) => r.form_id === formId).length,
  hasUserResponse: async (conn, formId, userId) => conn.mem.rows('responses').some((r) => r.form_id === formId && r.respondent_user_id === userId),
  async insertResponse(conn, r) {
    const id = conn.mem.nextId();
    await conn.mem.insertUnique('responses', r.response_uuid, { ...r, response_id: id });
    return id;
  },
});

const memoryCouponRepo = () => ({
  lockCoupon: async (conn, field, code) => {
    const c = conn.mem.rows('coupons').find((row) => String(row[field]) === String(code));
    return c ? conn.mem.lock('coupons', c.id) : null;
  },
  async insertSubmission(conn, coupon, user) {
    const id = conn.mem.nextId();
    await conn.mem.write('submissions', id, { id, coupon_id: coupon.id, email: user.email || null });
    return id;
  },
  async insertAnswers(conn, submissionId, formId, answers) {
    await conn.mem.write('answers', submissionId, { submissionId, formId, answers });
  },
  async markRedeemed(conn, couponId, info) {
    const c = await conn.mem.lock('coupons', couponId);
    await conn.mem.write('coupons', couponId, { ...c, status: 1, redeemed_by: info.by });
  },
});

const memoryOrderRepo = ({ failOnLine = null } = {}) => ({
  async insertHeader(conn, h) {
    await conn.mem.insertUnique('orders', h.order_id, h);
  },
  async insertLines(conn, orderId, companyId, userId, lines) {
    for (const l of lines) {
      if (failOnLine && l.detail_id === failOnLine) throw new Error(`simulated DB failure on line ${l.detail_id}`);
      await conn.mem.write('order_lines', `${orderId}:${l.detail_id}`, { order_id: orderId, ...l });
    }
  },
});

const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

module.exports = { createMemoryDb, memoryIdempotency, memoryOutbox, memoryStockStore, memoryFormRepo, memoryCouponRepo, memoryOrderRepo };
