/** @purpose Runs Cineva campaign SQL on a pooled connection with UTC session time; every write goes through beginTransaction/commit/rollback. */

/** `pool` is a mysql2 promise pool (use `dbHots.promise()` for the legacy callback pool). */
async function acquire(pool) {
  const conn = await pool.getConnection();
  try { await conn.query("SET time_zone = '+00:00'"); } catch (error) { conn.release(); throw error; }
  return conn;
}

/** Read-only work. */
export async function withConnection(pool, work) {
  const conn = await acquire(pool);
  try { return await work(conn); } finally { conn.release(); }
}

/** Atomic write: commit on success, rollback on any error, always release. */
export async function withTransaction(pool, work) {
  const conn = await acquire(pool);
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (error) {
    try { await conn.rollback(); } catch { /* keep the original error */ }
    throw error;
  } finally { conn.release(); }
}
