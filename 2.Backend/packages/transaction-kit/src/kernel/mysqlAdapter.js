/**
 * @hots/transaction-kit — MySQL adapter (mysql2 promise pool → kit connection)
 * Head: src/index.js
 * Pattern from Integrated-API: `dbHots.promise().getConnection()` + beginTransaction/commit/rollback/release
 * (core/outbox.js, service/couponService.js). The kit owns the connection lifecycle so callers cannot forget it.
 *
 * Kit connection contract (also implemented by stores/memory.js for tests):
 *   query(sql, params) → [rows|result]   begin()   commit()   rollback()   release()
 */

function createMysqlAdapter(pool) {
  const promisePool = typeof pool.promise === 'function' ? pool.promise() : pool;
  return {
    kind: 'mysql',
    async acquire() {
      const conn = await promisePool.getConnection();
      return {
        raw: conn,
        query: (sql, params) => conn.query(sql, params),
        begin: () => conn.beginTransaction(),
        commit: () => conn.commit(),
        rollback: () => conn.rollback(),
        release: () => conn.release(),
      };
    },
  };
}

module.exports = { createMysqlAdapter };
