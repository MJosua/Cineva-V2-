//========================= DATABASE CONFIG =========================//
const mysql = require("mysql2");
const os = require("os");

// =============================================================== //
// 🔹 Server Mode Detection
function production() {
    function getLocalIp() {
        const nets = os.networkInterfaces();
        for (const name in nets) {
            for (const addr of nets[name]) {
                if (addr.family === "IPv4" && !addr.internal) return addr.address;
            }
        }
        return "127.0.0.1";
    }
    return getLocalIp() === "10.126.106.105";
}

// =============================================================== //
// 🔹 Dynamic Configuration
const host_config = production() ? process.env.DB_HOST : process.env.DEV_DB_HOST;
const user_config = production() ? process.env.DB_USER : process.env.DEV_DB_USER;
const password_config = production() ? process.env.DB_PASSWORD : process.env.DEV_DB_PASSWORD;

console.log("@db - host:", host_config);
console.log("@db - user:", user_config);

// =============================================================== //
// 🔹 Factory: Safe + Legacy-Compatible Pool
function createSafePool(dbName, connectionLimit = 20) {
    const pool = mysql.createPool({
        host: host_config,
        user: user_config,
        password: password_config,
        database: dbName,
        multipleStatements: true,
        connectionLimit,

        connectTimeout: 20000,
        
        waitForConnections: true,
        enableKeepAlive: true,
    });


    // Apply lower wait_timeout per connection
    pool.on("connection", (conn) => {
        conn.query("SET SESSION wait_timeout=30");
        conn.query("SET SESSION interactive_timeout=30");
    });

    // if a socket goes bad, remove it from the pool
    pool.on("error", (err) => {
        console.error(`⚠️ MySQL pool ${dbName} error:`, err.code);
        if (["PROTOCOL_SEQUENCE_TIMEOUT", "PROTOCOL_CONNECTION_LOST"].includes(err.code)) {
            try { pool.end(); } catch { }
        }
    });

    const promisePool = pool.promise();

    // ✅ Hybrid query function (safe, compatible with old util.promisify)
    async function query(sql, params = [], timeoutMs = 20000, retries = 1) {
        // timeoutMs = 0 → no inactivity timeout (safe for login, auth, etc.)
        const start = Date.now();

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const [rows] = await promisePool.query({
                    sql,
                    values: params,
                    // if timeoutMs = 0, don't include the timeout property at all
                    ...(timeoutMs ? { timeout: timeoutMs } : {})
                });

                const duration = Date.now() - start;
                if (duration > 3000)
                    console.warn(`⚠️ Slow query (${duration} ms) in ${dbName}`);

                return rows;
            } catch (err) {
                const transient = [
                    "PROTOCOL_CONNECTION_LOST",
                    "ECONNRESET",
                    "ER_LOCK_WAIT_TIMEOUT",
                    "PROTOCOL_SEQUENCE_TIMEOUT"
                ].includes(err.code);

                if (transient && attempt < retries) {
                    console.warn(`🔁 Retrying ${dbName} query (${attempt + 1}): ${err.code}`);
                    await new Promise(r => setTimeout(r, 500));
                    continue;
                }

                // drop the bad connection so the pool can create a new one
                try { promisePool.releaseConnection && promisePool.releaseConnection(); } catch { }
                console.error(`❌ Query error in ${dbName}:`, err.message);
                throw err;
            }
        }
    }

    return { pool, query };
}

// =============================================================== //
// 🔹 Database Pools
const { pool: dbConf, query: dbQuery } = createSafePool(process.env.DB_NAME);
const { pool: dbTM, query: dbTMQuery } = createSafePool(process.env.DB_NAME_TM);
const { pool: dbIndomieku, query: dbQueryIndomieku } = createSafePool(process.env.DB_NAME_INDOMIEKU);
const { pool: dbCardGenerator, query: dbQueryCardGenerator } = createSafePool(process.env.DB_NAME_CARD_GENERATOR);
const { pool: dbHots, query: dbQueryHots } = createSafePool(process.env.DB_NAME_HT);
const { pool: dbPMS, query: dbQueryPMS } = createSafePool(process.env.DB_NAME_PMS);
const { pool: dbClick, query: dbQueryClick } = createSafePool(process.env.DB_NAME_Click);
const { pool: dbSR, query: dbQuerySR } = createSafePool(process.env.DB_NAME_SR);

// MeetingBook (simple promise pool)
const dbmeetingbook = mysql.createPool({
    host: host_config,
    user: user_config,
    password: password_config,
    database: "meetingbook",
}).promise();

// =============================================================== //
// 🔹 SQL Logger
const addSqlLogger = async (user_id, sql_parameter, message, function_name) => {
    try {
        await dbQuery(
            `INSERT INTO action_logger (time_event,user_id,sql_code,message,function_name)
       VALUES (NOW(),?,?,?,?)`,
            [user_id, sql_parameter, message, function_name]
        );
    } catch (e) {
        console.error("❌ SQL Logger failed:", e.message);
    }
};

// =============================================================== //
// 🔹 Health Monitor / Debug Output
if (!production()) {
    setInterval(async () => {
        try {
            await Promise.all([dbQuery("SELECT 1"), dbQuerySR("SELECT 1")]);
            const active =
                (dbConf._allConnections?.length || 0) +
                (dbSR._allConnections?.length || 0);
            console.log("💚 DB pools healthy");
            console.log("IOD conns:", dbConf._allConnections?.length || 0);
            console.log("SR conns:", dbSR._allConnections?.length || 0);
            console.log("🔍 Active MySQL connections:", active);
        } catch (e) {
            console.error("💥 Health check failed:", e.message);
        }
    }, 30000);
}

// =============================================================== //
// 🔹 Graceful Shutdown
function gracefulShutdown() {
    console.log("\n🧹 Closing all MySQL pools...");
    const pools = [dbConf, dbTM, dbIndomieku, dbCardGenerator, dbHots, dbPMS, dbClick, dbSR];
    Promise.all(pools.map((p) => p.end()))
        .then(() => {
            console.log("✅ All MySQL connections closed cleanly.");
            process.exit(0);
        })
        .catch((err) => {
            console.error("⚠️ Error closing MySQL pools:", err);
            process.exit(1);
        });
}
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// =============================================================== //
// 🔹 Exports
module.exports = {
    dbConf, dbQuery,
    dbTM, dbTMQuery,
    dbIndomieku, dbQueryIndomieku,
    dbCardGenerator, dbQueryCardGenerator,
    dbHots, dbQueryHots,
    dbPMS, dbQueryPMS,
    dbClick, dbQueryClick,
    dbSR, dbQuerySR,
    dbmeetingbook,
    addSqlLogger,
};
