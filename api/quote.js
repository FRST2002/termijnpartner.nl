// Offertes voor de dakkapel-configurator.
// Opslag: Upstash Redis (REST). Koppeling: GoHighLevel (contact + notitie + tags).
// Benodigde omgevingsvariabelen (Vercel): zie README-offerte.md in de map van de configurator.
import { randomBytes, timingSafeEqual } from 'node:crypto';

const REDIS_URL = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SITE = (req) => process.env.SITE_URL || `https://${req.headers.host}`;

async function redis(...cmd) {
  const r = await fetch(REDIS_URL(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const load = async (id) => { const v = await redis('GET', `q:${id}`); return v ? JSON.parse(v) : null; };
const save = (q) => redis('SET', `q:${q.id}`, JSON.stringify(q));

function isAdmin(req) {
  const given = String(req.headers['x-admin-key'] || '');
  const real = String(process.env.ADMIN_PASSWORD || '');
  if (!real || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}

const eur = (n) => '€ ' + Math.round(n).toLocaleString('nl-NL');
const STATUS_TAG = { aanvraag: 'offerte-aangevraagd', concept: 'offerte-concept', verstuurd: 'offerte-verstuurd', goedgekeurd: 'offerte-goedgekeurd', afgekeurd: 'offerte-afgekeurd' };

/* ---------------- GoHighLevel ---------------- */
async function ghl(path, method, body) {
  const r = await fetch('https://services.leadconnectorhq.com' + path, {
    method,
    headers: { Authorization: `Bearer ${process.env.GHL_TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`GHL ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}

async function syncGhl(q, req, noteTitle) {
  if (!process.env.GHL_TOKEN || !process.env.GHL_LOCATION_ID) return;
  try {
    const c = q.customer || {};
    const [firstName, ...rest] = String(c.name || '').trim().split(/\s+/);
    const body = {
      locationId: process.env.GHL_LOCATION_ID,
      firstName, lastName: rest.join(' ') || undefined,
      name: c.name, email: c.email, phone: c.phone || undefined,
      source: 'Dakkapel-configurator',
      tags: ['dakkapel-configurator', STATUS_TAG[q.status] || 'offerte'],
    };
    if (c.address && c.address.straat) {
      body.address1 = `${c.address.straat} ${c.address.huisnummer}${c.address.toevoeging ? ' ' + c.address.toevoeging : ''}`;
      body.postalCode = c.address.postcode; body.city = c.address.plaats; body.country = 'NL';
    }
    if (c.birthdate) body.dateOfBirth = c.birthdate;
    if (c.gender) body.gender = c.gender === 'man' ? 'male' : 'female';
    if (process.env.GHL_PRICE_FIELD_ID) body.customFields = [{ id: process.env.GHL_PRICE_FIELD_ID, field_value: String(Math.round(q.total)) }];
    const up = await ghl('/contacts/upsert', 'POST', body);
    const contactId = (up.contact && up.contact.id) || q.ghlContactId;
    if (!contactId) return;
    q.ghlContactId = contactId;
    // oude status-tags weghalen zodat er maar één actief is
    const old = Object.values(STATUS_TAG).filter((t) => t !== STATUS_TAG[q.status]);
    await ghl(`/contacts/${contactId}/tags`, 'DELETE', { tags: old }).catch(() => {});
    const cfg = q.config || {};
    const sides = (cfg.sides || []).map((x) => `${x.side === 'back' ? 'Achterkant' : 'Voorkant'}: ${String(x.w).replace('.', ',')} m breed, ${x.h} m hoog, ${x.wins} ramen, ${x.material || ''}`);
    const note = [
      `${noteTitle} (versie ${q.version})`,
      `Status: ${q.status}`,
      `Totaal: ${eur(q.total)} incl. btw, vanaf ${eur(q.total / 180)} p/m`,
      ...sides,
      q.timingLabel ? `Plaatsing gewenst: ${q.timingLabel}` : '',
      q.paymentLabel ? `Betaling: ${q.paymentLabel}` : '',
      (c.incomeLabels || []).length ? `Inkomen: ${c.incomeLabels.join(', ')}` : '',
      c.woonsituatie ? `Woonsituatie: ${c.woonsituatie === 'koop' ? 'koopwoning' : 'huurwoning'}` : '',
      c.afval ? `Afval opruimen: ${c.afval === 'zelf' ? 'klant zelf' : 'bouwbedrijf'}` : '',
      c.opmerking ? `Opmerking klant: ${c.opmerking}` : '',
      q.photoCount ? `Foto's: ${q.photoCount} bijgevoegd (zichtbaar bij beheer in de configurator)` : '',
      c.voorwaardenAt ? `Akkoord algemene voorwaarden: ${c.voorwaardenAt.slice(0, 10)}` : '',
      '',
      `Offerte (klantlink): ${SITE(req)}/offerte?id=${q.id}`,
      `Aanpassen (intern): ${SITE(req)}/dakkapel-config?edit=${q.id}`,
    ].filter((l) => l !== '').join('\n');
    await ghl(`/contacts/${contactId}/notes`, 'POST', { body: note });
  } catch (e) {
    q.ghlError = String(e.message || e);
    console.error('GHL', q.ghlError);
  }
}

/* ---------------- helpers ---------------- */
const newId = () => randomBytes(9).toString('base64url');
const nowIso = () => new Date().toISOString();
const clean = (s, n = 200) => String(s ?? '').slice(0, n);

function publicView(q) {
  const { id, status, version, config, lines, total, adjust, note, customer, shots, createdAt, sentAt, decision, payment } = q;
  return {
    id, status, version, config, lines, total, adjust, note, shots, createdAt, sentAt, decision, payment,
    customer: { name: customer?.name, email: customer?.email, address: customer?.address, woonsituatie: customer?.woonsituatie, afval: customer?.afval },
    nummer: q.nummer,
  };
}

function applyFields(q, b) {
  if (b.config) q.config = b.config;
  if (b.lines) q.lines = b.lines;
  if (typeof b.total === 'number') q.total = b.total;
  if (b.adjust !== undefined) q.adjust = b.adjust;
  if (b.note !== undefined) q.note = clean(b.note, 2000);
  if (b.shots) q.shots = b.shots;
  if (b.customer) q.customer = { ...q.customer, ...b.customer };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  try {
    if (!REDIS_URL() || !REDIS_TOKEN()) return res.status(500).json({ error: 'Opslag niet ingesteld' });
    const url = new URL(req.url, 'http://x');
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');
    const admin = isAdmin(req);
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    /* lijst (admin) */
    if (req.method === 'GET' && url.searchParams.get('list')) {
      if (!admin) return res.status(401).json({ error: 'Geen toegang' });
      const ids = (await redis('SMEMBERS', 'qidx')) || [];
      const rows = ids.length ? await redis('MGET', ...ids.map((i) => `q:${i}`)) : [];
      const list = rows.filter(Boolean).map((r) => JSON.parse(r)).map((q) => ({
        id: q.id, nummer: q.nummer, status: q.status, version: q.version, total: q.total, name: q.customer?.name, email: q.customer?.email,
        createdAt: q.createdAt, updatedAt: q.updatedAt, ghl: !!q.ghlContactId, ghlError: q.ghlError,
      })).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      return res.json({ list });
    }

    /* één offerte lezen */
    if (req.method === 'GET') {
      if (!id) return res.status(400).json({ error: 'id ontbreekt' });
      const q = await load(id);
      if (!q) return res.status(404).json({ error: 'Offerte niet gevonden' });
      if (url.searchParams.get('photos')) {
        if (!admin) return res.status(401).json({ error: 'Geen toegang' });
        const p = await redis('GET', `p:${id}`);
        return res.json({ photos: p ? JSON.parse(p) : [] });
      }
      if (url.searchParams.get('admin')) {
        if (!admin) return res.status(401).json({ error: 'Geen toegang' });
        return res.json(q);
      }
      return res.json(publicView(q));
    }

    /* klant: goedkeuren / afkeuren */
    if (req.method === 'POST' && id && (action === 'accept' || action === 'reject')) {
      const q = await load(id);
      if (!q) return res.status(404).json({ error: 'Offerte niet gevonden' });
      if (q.status !== 'verstuurd') return res.status(409).json({ error: 'Deze offerte kan nu niet beoordeeld worden', status: q.status });
      const accept = action === 'accept';
      const by = clean(body.name, 120);
      if (accept && !by) return res.status(400).json({ error: 'Vul je naam in om akkoord te geven' });
      q.status = accept ? 'goedgekeurd' : 'afgekeurd';
      q.decision = { at: nowIso(), by, reason: clean(body.reason, 1000), version: q.version, accept };
      q.updatedAt = nowIso();
      q.history.push({ t: nowIso(), e: accept ? `Goedgekeurd door klant (v${q.version})` : `Afgekeurd door klant (v${q.version})`, note: q.decision.reason });
      await syncGhl(q, req, accept ? 'OFFERTE GOEDGEKEURD door klant' : `OFFERTE AFGEKEURD door klant${q.decision.reason ? ': ' + q.decision.reason : ''}`);
      await save(q);
      return res.json(publicView(q));
    }

    /* nieuwe aanvraag / offerte */
    if (req.method === 'POST') {
      const c = body.customer || {};
      if (!clean(c.name) || !/^\S+@\S+\.\S+$/.test(clean(c.email))) return res.status(400).json({ error: 'Naam en geldig e-mailadres zijn verplicht' });
      if (!body.config || !Array.isArray(body.lines) || typeof body.total !== 'number') return res.status(400).json({ error: 'Configuratie ontbreekt' });
      const n = await redis('INCR', 'qseq');
      const q = {
        id: newId(), nummer: `TP-${new Date().getFullYear()}-${String(1000 + n)}`,
        status: admin ? clean(body.status, 20) === 'verstuurd' ? 'verstuurd' : 'concept' : 'aanvraag',
        version: 1, createdAt: nowIso(), updatedAt: nowIso(), sentAt: null, decision: null, history: [], adjust: null, note: '',
        customer: {}, source: admin ? 'intern' : 'configurator',
        timing: body.timing, timingLabel: clean(body.timingLabel), payment: body.payment, paymentLabel: clean(body.paymentLabel),
      };
      applyFields(q, body);
      q.customer = {
        name: clean(c.name, 120), email: clean(c.email, 160), phone: clean(c.phone, 40),
        ...(admin ? {} : {
          birthdate: clean(c.birthdate, 10), gender: clean(c.gender, 10), income: (c.income || []).slice(0, 4), incomeLabels: (c.incomeLabels || []).slice(0, 4).map((x) => clean(x, 40)),
          address: { postcode: clean(c.address?.postcode, 8), huisnummer: clean(c.address?.huisnummer, 10), toevoeging: clean(c.address?.toevoeging, 10), straat: clean(c.address?.straat, 80), plaats: clean(c.address?.plaats, 60) },
          woonsituatie: c.woonsituatie === 'huur' ? 'huur' : 'koop', afval: c.afval === 'zelf' ? 'zelf' : 'bouwbedrijf', opmerking: clean(c.opmerking, 1500),
          voorwaardenAt: c.voorwaarden ? nowIso() : null,
        }),
      };
      const photos = (Array.isArray(body.photos) ? body.photos : []).filter((p) => typeof p === 'string' && p.startsWith('data:image/') && p.length < 300000).slice(0, 4);
      q.photoCount = photos.length;
      if (photos.length) await redis('SET', `p:${q.id}`, JSON.stringify(photos));
      if (q.status === 'verstuurd') q.sentAt = nowIso();
      q.history.push({ t: nowIso(), e: q.source === 'intern' ? `Aangemaakt door TermijnPartner (${q.status})` : 'Aanvraag via configurator' });
      await syncGhl(q, req, q.source === 'intern' ? 'Offerte aangemaakt' : 'NIEUWE AANVRAAG via dakkapel-configurator');
      await save(q); await redis('SADD', 'qidx', q.id);
      return res.status(201).json({ id: q.id, nummer: q.nummer, status: q.status });
    }

    /* TermijnPartner: aanpassen / vrijgeven (opnieuw openen) */
    if (req.method === 'PUT') {
      if (!admin) return res.status(401).json({ error: 'Geen toegang' });
      const q = id && (await load(id));
      if (!q) return res.status(404).json({ error: 'Offerte niet gevonden' });
      applyFields(q, body);
      const to = clean(body.status, 20);
      let title = 'Offerte aangepast';
      if (to === 'verstuurd') {
        if (q.sentAt) q.version += 1; q.status = 'verstuurd'; q.sentAt = nowIso(); q.decision = null;
        q.history.push({ t: nowIso(), e: `Vrijgegeven aan klant (v${q.version})` });
        title = 'OFFERTE VERSTUURD naar klant';
      } else if (to === 'concept' || to === 'aanvraag') {
        q.status = to; q.history.push({ t: nowIso(), e: `Terug naar ${to}` });
      } else q.history.push({ t: nowIso(), e: 'Gegevens aangepast' });
      q.updatedAt = nowIso();
      await syncGhl(q, req, title);
      await save(q);
      return res.json({ id: q.id, status: q.status, version: q.version, ghlError: q.ghlError });
    }

    if (req.method === 'DELETE') {
      if (!admin) return res.status(401).json({ error: 'Geen toegang' });
      if (!id) return res.status(400).json({ error: 'id ontbreekt' });
      await redis('DEL', `q:${id}`); await redis('DEL', `p:${id}`); await redis('SREM', 'qidx', id);
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'Methode niet toegestaan' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Er ging iets mis' });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };
