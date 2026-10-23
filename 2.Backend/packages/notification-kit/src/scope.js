'use strict';
function scopeKey(scope) {
  if (!scope || !['tenantId', 'userId'].every(key => typeof scope[key] === 'string' && scope[key].trim()))
    throw new TypeError('Explicit tenantId and userId strings are required.');
  return JSON.stringify([scope.tenantId, scope.userId]);
}
function eventFrame(event, payload) {
  if (typeof event !== 'string' || !/^[A-Za-z0-9_.:-]+$/.test(event)) throw new TypeError('Invalid SSE event name.');
  const json = JSON.stringify(payload);
  if (json === undefined) throw new TypeError('SSE payload must serialize as JSON.');
  return `event: ${event}\ndata: ${json}\n\n`;
}
module.exports = { scopeKey, eventFrame };
