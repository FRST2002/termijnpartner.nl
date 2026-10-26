import { createHash, timingSafeEqual } from 'node:crypto';
import { next } from '@vercel/functions';
import { pages } from './lib/markdown-content.mjs';

export const config = {
  runtime: 'nodejs',
  // Skip static assets entirely — only run for HTML-ish / unknown paths.
  matcher: ['/((?!.*\\.(?:css|js|mjs|png|jpg|jpeg|svg|ico|xml|txt|webmanifest|json)$).*)'],
};

const SITEMAP_URL = 'https://termijnpartner.nl/sitemap.xml';
const LLMS_URL = 'https://termijnpartner.nl/llms.txt';

function wantsMarkdown(request) {
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/markdown');
}

function notFoundMarkdown(pathname) {
  return [
    '# 404 — Page not found',
    '',
    `The path \`${pathname}\` does not exist on termijnpartner.nl.`,
    '',
    `- See the full list of pages: [sitemap.xml](${SITEMAP_URL})`,
    `- See a curated overview for agents: [llms.txt](${LLMS_URL})`,
    '- Homepage: [https://termijnpartner.nl/](https://termijnpartner.nl/)',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Wachtwoordbeveiliging voor de interne pagina's (/partners, /marketing, /intern).
// Server-side: zonder geldige cookie wordt de pagina zelf niet uitgeleverd.
// Het wachtwoord staat NIET in de code, alleen de SHA-256-hash ervan. Wil je een
// ander wachtwoord, zet dan in Vercel de omgevingsvariabele PARTNER_PASSWORD.
// ---------------------------------------------------------------------------
const PROTECTED_PATHS = new Set([
  '/partners', '/partners.html',
  '/marketing', '/marketing.html',
  '/intern', '/intern.html',
]);
const DEFAULT_PASSWORD_HASH = 'a6006e38a3ea45ba052049c9d562eda6e91a8556b0775c716cc53967e65ef9df';
const AUTH_COOKIE = 'tp_auth';
const AUTH_MAX_AGE = 60 * 60 * 24; // 24 uur

const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const passwordHash = () =>
  process.env.PARTNER_PASSWORD ? sha256(process.env.PARTNER_PASSWORD) : DEFAULT_PASSWORD_HASH;
const sessionToken = () => sha256(`${passwordHash()}:tp-session-v1`);

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return '';
}

function loginPage(action, wrongPassword) {
  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Beveiligde pagina | TermijnPartner</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:#f6f2ea;color:#141414;font-family:Manrope,system-ui,-apple-system,"Segoe UI",sans-serif}
.box{width:100%;max-width:380px;background:#fbf8f2;border:1px solid #e6dece;border-radius:24px;padding:32px;box-shadow:0 14px 40px rgba(20,20,20,.08)}
.logo{font-weight:800;font-size:24px;letter-spacing:-.03em;margin:0 0 6px}.logo span{color:#c99a2e}
p{margin:0 0 20px;color:#6b665f;font-size:15px;line-height:1.5}
label{display:block;font-weight:700;font-size:14px;margin-bottom:8px}
input{width:100%;font:inherit;font-size:18px;padding:13px 14px;border:2px solid #e6dece;border-radius:12px;background:#fff;color:#141414}
input:focus{outline:none;border-color:#c99a2e}
button{width:100%;margin-top:14px;padding:14px;border:0;border-radius:12px;background:#c99a2e;color:#fff;font:inherit;font-weight:700;font-size:16px;cursor:pointer}
button:hover{background:#b6871f}
.err{margin:0 0 14px;padding:10px 12px;border-radius:10px;background:#fdecea;border:1px solid #f3c1bb;color:#8a2a1f;font-size:14px;font-weight:600}
</style>
</head>
<body>
<form class="box" method="post" action="${action}">
<div class="logo">Termijn<span>Partner</span></div>
<p>Deze pagina is beveiligd. Vul het wachtwoord in om verder te gaan.</p>
${wrongPassword ? '<div class="err" role="alert">Onjuist wachtwoord. Probeer het opnieuw.</div>' : ''}
<label for="pw">Wachtwoord</label>
<input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
<button type="submit">Openen</button>
</form>
</body>
</html>`;
  return new Response(html, {
    status: wrongPassword ? 401 : 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

async function handleProtected(request, pathname) {
  try {
    if (safeEqual(readCookie(request, AUTH_COOKIE), sessionToken())) {
      return next();
    }
    if (request.method === 'POST') {
      let given = '';
      try {
        const form = await request.formData();
        given = String(form.get('password') || '');
      } catch {
        given = '';
      }
      if (safeEqual(sha256(given), passwordHash())) {
        return new Response(null, {
          status: 303,
          headers: {
            Location: pathname,
            'Set-Cookie': `${AUTH_COOKIE}=${sessionToken()}; Path=/; Max-Age=${AUTH_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
            'Cache-Control': 'no-store',
          },
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // remt gokken af
      return loginPage(pathname, true);
    }
    return loginPage(pathname, false);
  } catch {
    // Bij een fout nooit de pagina laten zien.
    return loginPage(pathname, false);
  }
}

export default function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Normaliseer het pad zodat varianten (dubbele slashes, %-codering, hoofdletters,
  // slash aan het eind) de beveiliging niet kunnen omzeilen.
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    decoded = pathname;
  }
  let normalizedPath = decoded.replace(/\/{2,}/g, '/').toLowerCase();
  if (normalizedPath.length > 1) normalizedPath = normalizedPath.replace(/\/+$/, '');
  if (PROTECTED_PATHS.has(normalizedPath)) {
    return handleProtected(request, normalizedPath);
  }

  const markdownRequested = wantsMarkdown(request);

  const page = pages[pathname];

  if (page) {
    if (markdownRequested) {
      return new Response(page.markdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          Vary: 'Accept',
        },
      });
    }
    // Known HTML page, browser/default request: continue to static serving,
    // but advertise that this URL also has a Markdown representation.
    return next({ headers: { Vary: 'Accept' } });
  }

  // Unknown path.
  if (markdownRequested) {
    return new Response(notFoundMarkdown(pathname), {
      status: 404,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        Vary: 'Accept',
      },
    });
  }

  // Let Vercel's normal static 404 handling take over.
  return next();
}
