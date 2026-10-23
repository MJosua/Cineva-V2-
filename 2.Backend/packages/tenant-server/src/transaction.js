'use strict';
const {createTransactionEngine} = require('../../transaction-kit');
/** Reuse transaction-kit; no implicit DB pool or new idempotency schema. */
function createUnitOfWork({adapter, logger}) {
  if (!logger || typeof logger.warn !== 'function') throw new Error('SSE-compatible logger required');
  const engine = createTransactionEngine({adapter, logger, maxRetries: 0});
  engine.registerType({name: 'tenant.operation', async execute(connection, input) { return {result: await input.execute(connection.raw || connection)}; }});
  return {async run(execute) { return (await engine.run('tenant.operation', {execute})).result; }};
}
module.exports = {createUnitOfWork};
