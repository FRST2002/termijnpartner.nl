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

// Melding per e-mail via Resend. Vraagt: RESEND_API_KEY en NOTIFY_EMAIL (optioneel RESEND_FROM). Zonder deze variabelen gebeurt er niets.
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>');
async function notify(d) {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL) return 'melding niet ingesteld';
  const row = (k, v) => `<tr><td style="padding:7px 14px 7px 0;width:170px;color:#6B6657;vertical-align:top;border-bottom:1px solid #E4DCC8;">${k}</td><td style="padding:7px 0;border-bottom:1px solid #E4DCC8;">${v ? esc(v) : '<span style="color:#999">-</span>'}</td></tr>`;
  const head = (t) => `<h3 style="margin:22px 0 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#A67D22;">${t}</h3>`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1C1B19;max-width:600px;">
<h2 style="margin:0 0 4px;font-size:20px;">Nieuwe demo-aanvraag</h2><p style="margin:0 0 6px;color:#6B6657;">Via termijnpartner.nl/aanvraag. Antwoord op deze mail om de aanvrager direct te mailen.</p>
${head('Contact')}<table style="width:100%;border-collapse:collapse;">${row('Naam', `${d.firstName} ${d.lastName}`)}${row('Telefoon', d.phone)}${row('E-mail', d.email)}</table>
${head('Bedrijf')}<table style="width:100%;border-collapse:collapse;">${row('Bedrijfsnaam', d.organization)}${row('Website', d.website)}${row('Jaren actief', d.jaren)}${row('Opdrachten per maand', d.opdrachten)}${row('Gem. opdrachtwaarde', d.waarde)}</table>
${head('Werkwijze')}<table style="width:100%;border-collapse:collapse;">${row('Termijnbetaling nu', d.termijnen)}${row('Opvolging aanvragen', d.opvolging)}${row('Marketing', d.marketing)}${row('Grootste uitdaging', d.uitdaging.join(', '))}${row('Branche', d.branche.join(', '))}</table>
${head('Extra informatie')}<p style="margin:0;">${d.extra ? esc(d.extra) : '<span style="color:#999">-</span>'}</p></div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'TermijnPartner <onboarding@resend.dev>',
      to: [process.env.NOTIFY_EMAIL], reply_to: d.email,
      subject: `Nieuwe demo-aanvraag: ${d.organization}`, html,
    }),
  }).catch((e) => ({ ok: false, status: String(e) }));
  if (!r.ok) console.error('aanvraag melding', r.status, await (r.text ? r.text() : '').catch(() => ''));
  return r.ok ? 'melding verstuurd' : 'melding mislukt ' + r.status;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Alleen POST' }); }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};

  console.log('aanvraag: ontvangen');

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
    // Bestaand contact: de tag staat er al, dus er komt geen "tag toegevoegd". Haal hem weg en zet hem terug zodat de workflow opnieuw start.
    if (cid && j.new !== true) {
      const h = { Authorization: `Bearer ${process.env.GHL_TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json', Accept: 'application/json' };
      const tags = JSON.stringify({ tags: ['demo-aanvraag'] });
      await fetch(`https://services.leadconnectorhq.com/contacts/${cid}/tags`, { method: 'DELETE', headers: h, body: tags }).catch(() => {});
      await fetch(`https://services.leadconnectorhq.com/contacts/${cid}/tags`, { method: 'POST', headers: h, body: tags }).catch(() => {});
    }
    // Zet het contact rechtstreeks in de workflow (onafhankelijk van de trigger). Vraagt: GHL_WORKFLOW_ID.
    let wf = 'geen workflow ingesteld';
    if (cid && process.env.GHL_WORKFLOW_ID) {
      const wr = await fetch(`https://services.leadconnectorhq.com/contacts/${cid}/workflow/${process.env.GHL_WORKFLOW_ID}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.GHL_TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({}),
      }).catch((e) => ({ ok: false, status: String(e) }));
      wf = wr.ok ? 'workflow gestart' : 'workflow mislukt ' + wr.status;
      if (!wr.ok) console.error('aanvraag workflow', wr.status, await (wr.text ? wr.text() : '').catch(() => ''));
    }
    const mail = await notify(d).catch((e) => { console.error('melding', e); return 'melding mislukt'; });
    console.log('aanvraag: contact', cid, j.new === true ? 'nieuw' : 'bijgewerkt');
    return res.status(200).json({ ok: true, contact: cid, nieuw: j.new === true, workflow: wf, melding: mail });
  } catch (e) {
    console.error('aanvraag', e);
    return res.status(502).json({ error: 'Versturen is niet gelukt.' });
  }
}
