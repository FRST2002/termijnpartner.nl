// Demo-aanvraag (meerstappenformulier op /aanvraag) -> GoHighLevel.
// Maakt of werkt een contact bij (upsert) met tags en de antwoorden in de aangepaste velden.
// Benodigde Vercel-variabelen: GHL_TOKEN, GHL_LOCATION_ID (dezelfde als bij api/quote.js).
// Let op: een contact dat via de API wordt aangemaakt start GEEN "Form Submitted"-workflow.
// Laat de workflow starten op "Contact Tag" = demo-aanvraag (zie README-aanvraag.md).

const FIELD = {
  website: 'rNhiPgWIMBbbhvUnD1kD',
  jaren: 'inXpiFH9CRirtTXfVXp9',
  opdrachten: 'mQcp2RQVFg2xc64zhz2a',
  waarde: 'G4nGuRgB3ZB41heoq8eo',
  termijnen: 'GgaRkKWlZKc7q72CHcwS',
  opvolging: 'kiM0Y0UznLhYAB3uj9Ko',
  marketing: 'SNGOzt95VseqChdMIBEP',
  uitdaging: 'FmOB8mBs6tvdmUquANo8',
  branche: 'rlg5Ev2RY95tJnwIjAcp',
  extra: '6FKqldQSHRKAQwS0U9Pu',
};

const clean = (s, n = 200) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const list = (a) => (Array.isArray(a) ? a.map((x) => clean(x, 120)).filter(Boolean).slice(0, 10) : []);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

function phone(p) {
  let s = clean(p, 30).replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  else if (s.startsWith('0')) s = '+31' + s.slice(1);
  return s;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Alleen POST' }); }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};

  // Spamval: bots vullen het verborgen veld in. Doe alsof het gelukt is.
  if (clean(b.hp_x7)) { console.warn('aanvraag: spamveld ingevuld, overgeslagen'); return res.status(200).json({ ok: true }); }

  const d = {
    firstName: clean(b.first_name, 80), lastName: clean(b.last_name, 80), phone: phone(b.phone), email: clean(b.email, 120).toLowerCase(),
    organization: clean(b.organization, 120), website: clean(b.website, 200), jaren: clean(b.jaren, 6),
    opdrachten: clean(b.opdrachten), waarde: clean(b.waarde), termijnen: clean(b.termijnen), opvolging: clean(b.opvolging), marketing: clean(b.marketing),
    uitdaging: list(b.uitdaging), branche: list(b.branche), extra: clean(b.extra, 2000),
  };
  const fout = [];
  if (!d.firstName) fout.push('voornaam');
  if (!d.lastName) fout.push('achternaam');
  if (d.phone.replace(/\D/g, '').length < 9) fout.push('telefoon');
  if (!emailOk(d.email)) fout.push('email');
  if (!d.organization) fout.push('bedrijfsnaam');
  if (!d.website) fout.push('website');
  if (!d.jaren || isNaN(Number(d.jaren))) fout.push('jaren');
  if (!d.opdrachten) fout.push('opdrachten');
  if (!d.waarde) fout.push('opdrachtwaarde');
  if (!d.termijnen) fout.push('termijnbetaling');
  if (!d.opvolging) fout.push('opvolging');
  if (!d.marketing) fout.push('marketing');
  if (!d.uitdaging.length) fout.push('uitdaging');
  if (!d.branche.length) fout.push('branche');
  if (fout.length) return res.status(400).json({ error: 'Controleer: ' + fout.join(', ') });

  if (!process.env.GHL_TOKEN || !process.env.GHL_LOCATION_ID) {
    console.error('aanvraag: GHL_TOKEN of GHL_LOCATION_ID ontbreekt');
    return res.status(500).json({ error: 'Versturen is nog niet ingesteld.' });
  }

  const cf = (id, v) => (v && (!Array.isArray(v) || v.length) ? { id, field_value: v } : null);
  const body = {
    locationId: process.env.GHL_LOCATION_ID,
    firstName: d.firstName, lastName: d.lastName, name: `${d.firstName} ${d.lastName}`,
    email: d.email, phone: d.phone, companyName: d.organization,
    website: /^https?:\/\//i.test(d.website) ? d.website : 'https://' + d.website,
    source: 'Website aanvraagformulier',
    tags: ['demo-aanvraag', 'website-aanvraag'],
    customFields: [
      cf(FIELD.website, d.website), cf(FIELD.jaren, d.jaren), cf(FIELD.opdrachten, d.opdrachten), cf(FIELD.waarde, d.waarde),
      cf(FIELD.termijnen, d.termijnen), cf(FIELD.opvolging, d.opvolging), cf(FIELD.marketing, d.marketing),
      cf(FIELD.uitdaging, d.uitdaging), cf(FIELD.branche, d.branche), cf(FIELD.extra, d.extra),
    ].filter(Boolean),
  };

  try {
    const r = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GHL_TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { console.error('aanvraag GHL', r.status, JSON.stringify(j).slice(0, 300)); return res.status(502).json({ error: 'Versturen is niet gelukt.' }); }
    const cid = (j.contact && j.contact.id) || null;
    console.log('aanvraag: contact', cid, j.new === true ? 'nieuw' : 'bijgewerkt');
    return res.status(200).json({ ok: true, contact: cid, nieuw: j.new === true });
  } catch (e) {
    console.error('aanvraag', e);
    return res.status(502).json({ error: 'Versturen is niet gelukt.' });
  }
}
