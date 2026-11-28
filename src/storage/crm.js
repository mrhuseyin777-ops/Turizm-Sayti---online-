// B2B müştəri bazası (clients) və otel siyahıları (hotelLists) üçün repository-lər — yaddaş və PostgreSQL.
// Interfeys (hər iki implementasiya eyni, hamısı async, HƏR metod agencyId tələb edir — IDOR qorunması):
//   clients     insert(rec), list(agencyId, {q, limit}), count(agencyId), get(agencyId, id),
//               update(agencyId, id, patch) → rec|null, sameNameCount(agencyId, name),
//               history(agencyId, ref, limit) → { shortlist, selections, leads },
//               forget(agencyId, ref, anonLabel) → { client, shortlist, selections, leads } (anonimləşdirmə),
//               purgeInactiveBefore(date)
//               ref = { clientId, name|null, phoneDigits|null } — yeni qeydlər client_id ilə, köhnələri ad/telefonla
//   hotelLists  list(agencyId), count(agencyId), get(agencyId, id), insert(rec) (ad dublikatı → code 'DUPLICATE'),
//               update(agencyId, id, {name?, hotels?}) → rec|null, delete(agencyId, id) → bool
// PostgreSQL: bütün sorğular parametrləşdirilmişdir; dinamik sütun adları yalnız sabit ağ siyahıdan.
const ms = (d) => (d instanceof Date ? d.getTime() : Number(d));
const iso = (d) => (d == null ? null : new Date(d).toISOString());
const lc = (s) => String(s || '').trim().toLowerCase();
const digits = (s) => String(s || '').replace(/\D/g, '');
const UNIQUE_VIOLATION = '23505';
const dupErr = (cause) => { const e = new Error('duplicate', cause ? { cause } : undefined); e.code = 'DUPLICATE'; return e; };

const CLIENT_PATCH = ['name', 'phone', 'email', 'adults', 'childAges', 'budget', 'destinations', 'board', 'note', 'searches', 'updatedAt', 'lastActivityAt'];

// ref → qeyd bu müştəriyə aiddirmi (yaddaş implementasiyası üçün)
function matcher(ref, { nameField = 'client', phoneField = 'phone' } = {}) {
  const name = ref.name ? lc(ref.name) : null;
  // Telefon: son 9 rəqəm müqayisə olunur (+994 55 …, 055 …, 55 … eyni nömrədir)
  const ph = ref.phoneDigits && ref.phoneDigits.length >= 7 ? ref.phoneDigits.slice(-9) : null;
  return (x) => (ref.clientId && x.clientId === ref.clientId)
    || (name && lc(x[nameField]) === name)
    || (ph && phoneField && digits(x[phoneField]).slice(-9) === ph);
}

// ---------------------------------------------------------------- Yaddaş
function createMemoryCrm({ shortlists, selections, leads, maxClients = 50000, maxLists = 20000 } = {}) {
  const map = new Map();
  const copy = (x) => (x ? structuredClone(x) : null);
  const clients = {
    map, // yalnız testlər üçün
    async insert(rec) {
      map.set(rec.id, copy(rec));
      while (map.size > maxClients) map.delete(map.keys().next().value);
      return copy(rec);
    },
    async list(agencyId, { q = '', limit = 500 } = {}) {
      if (typeof agencyId !== 'string' || !agencyId) return [];
      const needle = lc(q);
      const qd = digits(q);
      return [...map.values()]
        .filter((c) => c.agencyId === agencyId && (!needle || lc(c.name).includes(needle) || (qd.length >= 3 && digits(c.phone).includes(qd))))
        .sort((a, b) => String(b.lastActivityAt).localeCompare(String(a.lastActivityAt)) || a.id.localeCompare(b.id))
        .slice(0, limit).map(copy);
    },
    async count(agencyId) {
      let n = 0;
      for (const c of map.values()) if (c.agencyId === agencyId) n++;
      return n;
    },
    async get(agencyId, id) {
      const c = map.get(id);
      return c && c.agencyId === agencyId ? copy(c) : null;
    },
    async update(agencyId, id, patch) {
      const c = map.get(id);
      if (!c || c.agencyId !== agencyId) return null;
      for (const k of CLIENT_PATCH) if (k in patch) c[k] = structuredClone(patch[k]);
      return copy(c);
    },
    async sameNameCount(agencyId, name) {
      let n = 0;
      for (const c of map.values()) if (c.agencyId === agencyId && lc(c.name) === lc(name)) n++;
      return n;
    },
    async history(agencyId, ref, limit = 50) {
      const own = (x) => x.agencyId === agencyId;
      const slM = matcher(ref, { phoneField: null });
      const selM = matcher(ref);
      const leadM = matcher(ref);
      const sl = shortlists ? [...shortlists.map.values()].filter((x) => own(x) && slM(x)).reverse().slice(0, limit) : [];
      const sel = selections ? [...selections.map.values()].filter((x) => own(x) && selM(x)).reverse().slice(0, limit) : [];
      const ld = leads ? leads.list.filter((x) => x.type === 'selection' && own(x) && leadM(x)).slice().reverse().slice(0, limit) : [];
      return { shortlist: sl.map(copy), selections: sel.map(copy), leads: ld.map(copy) };
    },
    async forget(agencyId, ref, anonLabel) {
      const own = (x) => x.agencyId === agencyId;
      const out = { client: false, shortlist: 0, selections: 0, leads: 0 };
      if (shortlists) {
        const m = matcher(ref, { phoneField: null });
        const seen = new Set();
        for (const [k, x] of [...shortlists.map.entries()]) {
          if (!own(x) || !m(x)) continue;
          const key = `${x.offerId}\u0000${x.paxKey}`;
          if (seen.has(key)) shortlists.map.delete(k); // anonim qrupda eyni variant ikinci dəfə olmasın
          else { seen.add(key); x.client = anonLabel; x.clientId = null; }
          out.shortlist++;
        }
      }
      if (selections) {
        const m = matcher(ref);
        for (const x of selections.map.values()) {
          if (!own(x) || !m(x)) continue;
          x.client = ''; x.phone = ''; x.message = ''; x.clientId = null; out.selections++;
        }
      }
      if (leads) {
        const m = matcher(ref);
        for (const x of leads.list) {
          if (x.type !== 'selection' || !own(x) || !m(x)) continue;
          Object.assign(x, { name: 'Anonim', phone: '+000000', note: '', managerNote: '', client: '', clientId: null });
          out.leads++;
        }
      }
      const c = map.get(ref.clientId);
      if (c && c.agencyId === agencyId) { map.delete(ref.clientId); out.client = true; }
      return out;
    },
    async purgeInactiveBefore(date) {
      const cut = ms(date);
      let n = 0;
      for (const [k, c] of map) {
        if (Date.parse(c.lastActivityAt) < cut) {
          map.delete(k); n++;
          // ON DELETE SET NULL ekvivalenti
          for (const repo of [shortlists && shortlists.map, selections && selections.map]) if (repo) for (const x of repo.values()) if (x.clientId === k) x.clientId = null;
          if (leads) for (const x of leads.list) if (x.clientId === k) x.clientId = null;
        }
      }
      return n;
    },
  };

  const lists = new Map();
  const hotelLists = {
    map: lists,
    async list(agencyId) {
      if (typeof agencyId !== 'string' || !agencyId) return [];
      return [...lists.values()].filter((l) => l.agencyId === agencyId).sort((a, b) => a.name.localeCompare(b.name, 'az')).map(copy);
    },
    async count(agencyId) { let n = 0; for (const l of lists.values()) if (l.agencyId === agencyId) n++; return n; },
    async get(agencyId, id) { const l = lists.get(id); return l && l.agencyId === agencyId ? copy(l) : null; },
    async insert(rec) {
      if ([...lists.values()].some((l) => l.agencyId === rec.agencyId && lc(l.name) === lc(rec.name))) throw dupErr();
      lists.set(rec.id, copy(rec));
      while (lists.size > maxLists) lists.delete(lists.keys().next().value);
      return copy(rec);
    },
    async update(agencyId, id, patch) {
      const l = lists.get(id);
      if (!l || l.agencyId !== agencyId) return null;
      if ('name' in patch && [...lists.values()].some((x) => x.id !== id && x.agencyId === agencyId && lc(x.name) === lc(patch.name))) throw dupErr();
      if ('name' in patch) l.name = patch.name;
      if ('hotels' in patch) l.hotels = structuredClone(patch.hotels);
      l.updatedAt = new Date().toISOString();
      return copy(l);
    },
    async delete(agencyId, id) {
      const l = lists.get(id);
      if (!l || l.agencyId !== agencyId) return false;
      return lists.delete(id);
    },
  };
  return { clients, hotelLists };
}

// ---------------------------------------------------------------- PostgreSQL
function createPgCrm(pool, { slRow, selRow, leadRow }) {
  const q = (text, params = []) => pool.query(text, params);
  const clientRow = (r) => (r ? {
    id: r.id, agencyId: r.agency_id, name: r.name, phone: r.phone, email: r.email, adults: Number(r.adults),
    childAges: r.child_ages || [], budget: r.budget == null ? null : Number(r.budget), destinations: r.destinations || [],
    board: r.board, note: r.note, searches: r.searches || [], createdBy: r.created_by, createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at), lastActivityAt: iso(r.last_activity_at),
  } : null);
  const COLS = {
    name: 'name', phone: 'phone', email: 'email', adults: 'adults', childAges: 'child_ages', budget: 'budget',
    destinations: 'destinations', board: 'board', note: 'note', searches: 'searches', updatedAt: 'updated_at', lastActivityAt: 'last_activity_at',
  };
  const JSON_COLS = new Set(['childAges', 'destinations', 'searches']);
  // ref → SQL şərti ($1 = agency_id, $2 = client_id, $3 = ad (lower) | null, $4 = telefon rəqəmləri | null)
  const refParams = (agencyId, ref) => [agencyId, ref.clientId || null, ref.name ? lc(ref.name) : null,
    ref.phoneDigits && ref.phoneDigits.length >= 7 ? ref.phoneDigits.slice(-9) : null];
  const SL_WHERE = 'agency_id = $1 AND (client_id = $2 OR ($3::text IS NOT NULL AND lower(trim(client)) = $3))';
  const SEL_WHERE = `agency_id = $1 AND (client_id = $2 OR ($3::text IS NOT NULL AND lower(trim(client)) = $3)
    OR ($4::text IS NOT NULL AND right(regexp_replace(phone, '\\D', '', 'g'), 9) = $4))`;
  const LEAD_WHERE = `type = 'selection' AND ${SEL_WHERE}`;

  const clients = {
    async insert(c) {
      const { rows } = await q(`INSERT INTO clients (id, agency_id, name, phone, email, adults, child_ages, budget, destinations, board, note,
          searches, created_by, created_at, updated_at, last_activity_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`, [
        c.id, c.agencyId, c.name, c.phone || '', c.email || '', c.adults, JSON.stringify(c.childAges || []), c.budget ?? null,
        JSON.stringify(c.destinations || []), c.board || '', c.note || '', JSON.stringify(c.searches || []), c.createdBy || null,
        new Date(c.createdAt), new Date(c.updatedAt), new Date(c.lastActivityAt),
      ]);
      return clientRow(rows[0]);
    },
    async list(agencyId, { q: needle = '', limit = 500 } = {}) {
      if (typeof agencyId !== 'string' || !agencyId) return [];
      const n = lc(needle);
      const d = digits(needle);
      const { rows } = await q(`SELECT * FROM clients WHERE agency_id = $1
          AND ($2 = '' OR position($2 in lower(name)) > 0 OR (char_length($3) >= 3 AND position($3 in regexp_replace(phone, '\\D', '', 'g')) > 0))
        ORDER BY last_activity_at DESC, id LIMIT $4`, [agencyId, n, d, limit]);
      return rows.map(clientRow);
    },
    async count(agencyId) { return (await q('SELECT count(*)::int AS n FROM clients WHERE agency_id = $1', [agencyId])).rows[0].n; },
    async get(agencyId, id) {
      if (typeof agencyId !== 'string' || typeof id !== 'string') return null;
      return clientRow((await q('SELECT * FROM clients WHERE agency_id = $1 AND id = $2', [agencyId, id])).rows[0]);
    },
    async update(agencyId, id, patch) {
      if (typeof agencyId !== 'string' || typeof id !== 'string') return null;
      const sets = [];
      const vals = [agencyId, id];
      for (const [k, col] of Object.entries(COLS)) {
        if (!(k in patch)) continue;
        let v = patch[k];
        if (JSON_COLS.has(k)) v = JSON.stringify(v);
        if (k === 'updatedAt' || k === 'lastActivityAt') v = new Date(v);
        vals.push(v);
        sets.push(`${col} = $${vals.length}`);
      }
      if (!sets.length) return clients.get(agencyId, id);
      const { rows } = await q(`UPDATE clients SET ${sets.join(', ')} WHERE agency_id = $1 AND id = $2 RETURNING *`, vals);
      return clientRow(rows[0]);
    },
    async sameNameCount(agencyId, name) {
      return (await q('SELECT count(*)::int AS n FROM clients WHERE agency_id = $1 AND lower(trim(name)) = $2', [agencyId, lc(name)])).rows[0].n;
    },
    async history(agencyId, ref, limit = 50) {
      const p = refParams(agencyId, ref);
      const [sl, sel, ld] = await Promise.all([
        q(`SELECT * FROM shortlist_items WHERE ${SL_WHERE} ORDER BY created_at DESC, id LIMIT $4`, [p[0], p[1], p[2], limit]),
        q(`SELECT * FROM selections WHERE ${SEL_WHERE} ORDER BY created_at DESC, id LIMIT $5`, [...p, limit]),
        q(`SELECT * FROM leads WHERE ${LEAD_WHERE} ORDER BY created_at DESC, id DESC LIMIT $5`, [...p, limit]),
      ]);
      return {
        shortlist: sl.rows.map((r) => ({ ...slRow(r), clientId: r.client_id })),
        selections: sel.rows.map((r) => ({ ...selRow(r), clientId: r.client_id })),
        leads: ld.rows.map((r) => ({ ...leadRow(r), clientId: r.client_id })),
      };
    },
    // Bir tranzaksiyada: seçilmişlər anonim qrupa köçür, link/müraciətlərdə şəxsi sahələr silinir, kart silinir
    async forget(agencyId, ref, anonLabel) {
      const p = refParams(agencyId, ref);
      const c = await pool.connect();
      const out = { client: false, shortlist: 0, selections: 0, leads: 0 };
      try {
        await c.query('BEGIN');
        const sl = (await c.query(`SELECT id, offer_id, pax_key FROM shortlist_items WHERE ${SL_WHERE} ORDER BY created_at, id FOR UPDATE`, p.slice(0, 3))).rows;
        const seen = new Set();
        const keep = [];
        const drop = [];
        for (const r of sl) {
          const k = `${r.offer_id}\u0000${r.pax_key}`;
          if (seen.has(k)) drop.push(r.id); else { seen.add(k); keep.push(r.id); }
        }
        if (drop.length) await c.query('DELETE FROM shortlist_items WHERE agency_id = $1 AND id = ANY($2::text[])', [agencyId, drop]);
        if (keep.length) await c.query('UPDATE shortlist_items SET client = $3, client_id = NULL WHERE agency_id = $1 AND id = ANY($2::text[])', [agencyId, keep, anonLabel]);
        out.shortlist = sl.length;
        out.selections = (await c.query(`UPDATE selections SET client = '', phone = '', message = '', client_id = NULL WHERE ${SEL_WHERE}`, p)).rowCount;
        out.leads = (await c.query(`UPDATE leads SET name = 'Anonim', phone = '+000000', note = '', manager_note = '', client = '', client_id = NULL
          WHERE ${LEAD_WHERE}`, p)).rowCount;
        if (ref.clientId) out.client = (await c.query('DELETE FROM clients WHERE agency_id = $1 AND id = $2', [agencyId, ref.clientId])).rowCount > 0;
        await c.query('COMMIT');
      } catch (e) {
        await c.query('ROLLBACK').catch(() => {});
        throw e;
      } finally { c.release(); }
      return out;
    },
    async purgeInactiveBefore(date) { return (await q('DELETE FROM clients WHERE last_activity_at < $1', [new Date(date)])).rowCount; },
  };

  const listRow = (r) => (r ? { id: r.id, agencyId: r.agency_id, name: r.name, hotels: r.hotels || [], createdBy: r.created_by, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at) } : null);
  const hotelLists = {
    async list(agencyId) {
      if (typeof agencyId !== 'string' || !agencyId) return [];
      return (await q('SELECT * FROM hotel_lists WHERE agency_id = $1 ORDER BY lower(name), id', [agencyId])).rows.map(listRow);
    },
    async count(agencyId) { return (await q('SELECT count(*)::int AS n FROM hotel_lists WHERE agency_id = $1', [agencyId])).rows[0].n; },
    async get(agencyId, id) {
      if (typeof agencyId !== 'string' || typeof id !== 'string') return null;
      return listRow((await q('SELECT * FROM hotel_lists WHERE agency_id = $1 AND id = $2', [agencyId, id])).rows[0]);
    },
    async insert(l) {
      try {
        const { rows } = await q(`INSERT INTO hotel_lists (id, agency_id, name, hotels, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`, [l.id, l.agencyId, l.name, JSON.stringify(l.hotels || []), l.createdBy || null, new Date(l.createdAt)]);
        return listRow(rows[0]);
      } catch (e) {
        if (e.code === UNIQUE_VIOLATION) throw dupErr(e);
        throw e;
      }
    },
    async update(agencyId, id, patch) {
      if (typeof agencyId !== 'string' || typeof id !== 'string') return null;
      try {
        const { rows } = await q(`UPDATE hotel_lists SET
            name = CASE WHEN $3 THEN $4 ELSE name END,
            hotels = CASE WHEN $5 THEN $6::jsonb ELSE hotels END,
            updated_at = now()
          WHERE agency_id = $1 AND id = $2 RETURNING *`, [agencyId, id, 'name' in patch, patch.name ?? null, 'hotels' in patch, JSON.stringify(patch.hotels ?? [])]);
        return listRow(rows[0]);
      } catch (e) {
        if (e.code === UNIQUE_VIOLATION) throw dupErr(e);
        throw e;
      }
    },
    async delete(agencyId, id) {
      if (typeof agencyId !== 'string' || typeof id !== 'string') return false;
      return (await q('DELETE FROM hotel_lists WHERE agency_id = $1 AND id = $2', [agencyId, id])).rowCount > 0;
    },
  };
  return { clients, hotelLists };
}

module.exports = { createMemoryCrm, createPgCrm, CLIENT_PATCH };
