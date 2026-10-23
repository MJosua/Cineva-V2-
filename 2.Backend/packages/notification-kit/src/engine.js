'use strict';
const { scopeKey, eventFrame } = require('./scope');
/** Repository commands must commit/rollback atomically. Transport runs only after commit resolves. */
function createNotificationEngine({ repository, transport, authorize, id, clock, format, clone = structuredClone }) {
  if (![authorize, id, clock, format, clone].every(fn => typeof fn === 'function') || !repository || typeof repository.transaction !== 'function' || !transport || typeof transport.send !== 'function')
    throw new TypeError('Explicit policy, identity, clock, repository and transport adapters are required.');
  async function permit(context, scope, action) {
    scopeKey(scope);
    if (await authorize(clone(context), clone(scope), action) !== true) throw new Error('Notification access denied.');
  }
  return {
    async publish(context, scope, input) {
      scope = clone(scope); input = clone(input);
      await permit(context, scope, 'publish');
      const text = await format(clone(input), clone(scope));
      if (!text || typeof text.title !== 'string' || typeof text.message !== 'string' || typeof input.type !== 'string' || !/^[A-Za-z0-9_.:-]+$/.test(input.type)) throw new TypeError('Invalid notification content.');
      const notification = { id: id(), scope, type: input.type, title: text.title, message: text.message, data: input.data ?? null, createdAt: clock(), isRead: false };
      if (typeof notification.id !== 'string' || !notification.id.trim() || !Number.isFinite(notification.createdAt)) throw new TypeError('Invalid notification ID or clock.');
      eventFrame(input.type, notification); // Reject unserializable payloads before committing.
      await repository.transaction(tx => tx.insert(clone(notification)));
      let delivery;
      try { delivery = await transport.send(clone(scope), input.type, clone(notification)); }
      catch (error) { return { notification: clone(notification), delivery: { failed: true, error: error.message } }; }
      return { notification: clone(notification), delivery };
    },
    async list(context, scope, { limit = 50, offset = 0 } = {}) {
      scope = clone(scope); await permit(context, scope, 'list');
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200 || !Number.isSafeInteger(offset) || offset < 0) throw new TypeError('Invalid notification page.');
      return clone(await repository.list(scope, { limit, offset }));
    },
    async unreadCount(context, scope) {
      scope = clone(scope); await permit(context, scope, 'list');
      return repository.unreadCount(scope);
    },
    async markRead(context, scope, notificationId) {
      scope = clone(scope); await permit(context, scope, 'read');
      if (typeof notificationId !== 'string' || !notificationId.trim()) throw new TypeError('Invalid notification ID.');
      return repository.transaction(tx => tx.markRead(scope, notificationId));
    },
    async markAllRead(context, scope) {
      scope = clone(scope); await permit(context, scope, 'read');
      return repository.transaction(tx => tx.markAllRead(scope));
    },
  };
}
module.exports = { createNotificationEngine };
