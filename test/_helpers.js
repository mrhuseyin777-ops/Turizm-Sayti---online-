// Test köməkçiləri (test faylı deyil — node --test onu boş fayl kimi keçir).
// App port açmadan test olunur: app.listen(0) → müvəqqəti port, fetch ilə sorğu.
const { getStore } = require('../src/auth');
const { hashPassword } = require('../src/auth/password');

async function startServer(app) {
  const srv = app.listen(0, '127.0.0.1');
  await new Promise((r) => srv.once('listening', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  return { srv, base, close: () => new Promise((r) => srv.close(r)) };
}

// Yaddaşda (fayla yazmadan) agentlik + istifadəçi yarat
async function createAccount({ agency, username, password = 'Test-Parol-Uzun-2026', displayName = 'Menecer', role = 'admin' }) {
  const store = getStore();
  const ag = (await store.findAgencyByName(agency)) || (await store.createAgency(agency, { persist: false }));
  const user = await store.createUser({ agencyId: ag.id, username, displayName, role, passwordHash: await hashPassword(password) }, { persist: false });
  return { agency: ag, user, password };
}

// Login → { cookie, csrf, res, body }
async function login(base, username, password, headers = {}) {
  const res = await fetch(`${base}/api/b2b/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ username, password }) });
  const body = await res.json();
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
  const cookie = (setCookie.find((c) => c && c.includes('etour_sid=')) || '').split(';')[0];
  return { res, body, cookie, csrf: body.csrfToken, setCookie };
}

function client(base, { cookie, csrf } = {}) {
  const h = (extra = {}) => ({ ...(cookie ? { Cookie: cookie } : {}), ...extra });
  return {
    get: (p, extra) => fetch(base + p, { headers: h(extra) }),
    post: (p, body, extra = {}) => fetch(base + p, {
      method: 'POST',
      headers: h({ 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...extra }),
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  };
}

const future = (days) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };

module.exports = { startServer, createAccount, login, client, future };
