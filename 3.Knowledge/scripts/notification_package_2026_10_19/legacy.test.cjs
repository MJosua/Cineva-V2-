const { test } = require('node:test'); const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm'); const { EventEmitter } = require('node:events');
const root = path.resolve(__dirname, '../../..');
function manager() {
  const writes = [], sandbox = { module: { exports: {} }, console: { log() {}, error() {} }, Date, Map, Set, JSON,
    require(name) {
      if (name.includes('notificationController')) return { createNotification: async row => { writes.push(row); return 10; }, updateNotification: async (id, updates) => ({ id, ...updates }) };
      if (name === '../../packages/notification-kit') return require(path.join(root, '2.Backend/packages/notification-kit'));
      throw new Error('Unexpected dependency: ' + name);
    } };
  vm.runInNewContext(fs.readFileSync(path.join(root, '2.Backend/Integrated-API/core/sse-manager.js'), 'utf8'), sandbox);
  return { instance: sandbox.module.exports, writes };
}
class Res extends EventEmitter { constructor() { super(); this.frames = []; } write(frame) { this.frames.push(frame); return true; } }
test('Legacy singleton retains persistence options and existing envelope fields', async () => {
  const { instance, writes } = manager(), res = new Res(); instance.addConnection(7, res);
  const receipt = await instance.emitToUser(7, 'approval_needed', { ticket_id: 42 }, { title: 'Dummy title', message: 'Dummy message' });
  assert.equal(receipt.notificationId, 10); assert.equal(writes.length, 1); assert.equal(writes[0].user_id, 7);
  const envelope = JSON.parse(res.frames[0].split('data: ')[1]); assert.equal(envelope.type, 'approval_needed'); assert.equal(envelope.data.title, 'Dummy title'); assert.equal(envelope.notificationId, 10);
  instance.removeConnection(7, res); assert.equal(instance.getStats().totalConnections, 0);
});
test('Legacy broadcast and filtered admin logs use package writer and retain counts', () => {
  const { instance } = manager(), a = new Res(), admin = new Res(); instance.addConnection('u', a); instance.addAdminConnection(admin, 'hots');
  assert.equal(instance.broadcast('broadcast', 'Dummy'), 1); instance.broadcastLog('Hidden', 'other'); assert.equal(admin.frames.length, 0);
  instance.broadcastLog('Visible', 'hots'); assert.match(admin.frames[0], /event: new_log/); instance.removeAdminConnection(admin); assert.equal(admin.listenerCount('drain'), 0);
});
