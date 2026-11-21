const test = require('node:test');
const assert = require('node:assert');
const auth = require('../src/auth');

test('bootstrap admin: zəif parol rədd edilir, güclü parolla hesab yaradılır və təkrar yaradılmır', async () => {
  const store = auth.getStore();
  const weak = await auth.seedBootstrapAdmin({ agency: 'BootTest', username: 'boot_weak', password: 'short', displayName: 'X' });
  assert.strictEqual(weak, null);
  assert.ok(!(await store.findUserByUsername('boot_weak')));
  const badName = await auth.seedBootstrapAdmin({ agency: 'BootTest', username: 'bad name!', password: 'Gx7!kq2#Lm9vTz', displayName: 'X' });
  assert.strictEqual(badName, null);
  const u = await auth.seedBootstrapAdmin({ agency: 'BootTest', username: 'boot_admin', password: 'Gx7!kq2#Lm9vTz', displayName: 'Admin' });
  assert.ok(u && u.username === 'boot_admin' && u.role === 'admin');
  const again = await auth.seedBootstrapAdmin({ agency: 'BootTest', username: 'boot_admin', password: 'Gx7!kq2#Lm9vTz', displayName: 'Admin' });
  assert.strictEqual(again, null);
});
