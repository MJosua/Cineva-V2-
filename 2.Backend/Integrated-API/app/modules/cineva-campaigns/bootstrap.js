'use strict';
/** @purpose Opt-in composition of the Cineva campaign runtime (service + principal resolver); off unless CINEVA_CAMPAIGNS_ENABLED=1. */
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');

/** No default identity, no migrations. The deployment supplies `createPrincipalResolver({pool, logger})` from backend config. */
async function loadCampaignRuntime({ pool, logger, env = process.env }) {
  if (env.CINEVA_CAMPAIGNS_ENABLED !== '1') return null;
  const directory = await fs.realpath(path.resolve(__dirname, '../../../config'));
  if (!/^[a-zA-Z0-9_-]+\.(cjs|mjs)$/.test(env.CINEVA_PRINCIPAL_FACTORY || '')) throw new Error('Explicit principal factory filename required');
  const file = await fs.realpath(path.join(directory, env.CINEVA_PRINCIPAL_FACTORY));
  if (path.dirname(file) !== directory) throw new Error('Principal factory must belong to backend config');
  const module = await import(pathToFileURL(file).href), factory = module.createPrincipalResolver || module.default?.createPrincipalResolver;
  if (typeof factory !== 'function') throw new Error('Factory must export createPrincipalResolver');
  const promisePool = typeof pool?.promise === 'function' ? pool.promise() : pool;
  const { createService } = await import('./service.mjs');
  const authorize = await factory({ pool: promisePool, logger });
  if (typeof authorize !== 'function') throw new Error('createPrincipalResolver must return an async (req) => principal function');
  return { service: createService({ pool: promisePool, events: { emit: (event, payload) => logger?.info?.(`[CINEVA_CAMPAIGNS] ${event} ${payload.kind}`) } }), authorize };
}
module.exports = { loadCampaignRuntime };
