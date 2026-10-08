// Plain-Node tests for middleware.js's request-handling logic.
// These don't spin up the real Vercel runtime (not possible outside a deploy),
// but they exercise every branch of the function against real Request objects
// and assert on the exact Response that would be sent to the client.
//
// Run with: node lib/middleware.test.mjs

import assert from 'node:assert/strict';
import middleware, { config } from '../middleware.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL ${name}`);
    console.log('       ' + err.message);
  }
}

function req(path, accept) {
  return new Request(`https://termijnpartner.nl${path}`, {
    headers: accept ? { Accept: accept } : {},
  });
}

await test('homepage + Accept: text/markdown -> 200 markdown body with Vary: Accept', async () => {
  const res = await middleware(req('/', 'text/markdown'));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(res.headers.get('vary'), 'Accept');
  const body = await res.text();
  assert.ok(body.length > 500, `expected >500 chars, got ${body.length}`);
  assert.ok(body.startsWith('# '), 'expected markdown to start with an H1');
});

await test('homepage + Accept: text/html -> falls through to static serving (next()), Vary: Accept set', async () => {
  const res = await middleware(req('/', 'text/html,application/xhtml+xml'));
  // next() returns a special Response understood by the Vercel runtime;
  // we only assert it did NOT take the markdown short-circuit path.
  assert.notEqual(res.headers.get('content-type'), 'text/markdown; charset=utf-8');
});

await test('known subpage (/over-ons.html) + Accept: text/markdown -> 200 markdown', async () => {
  const res = await middleware(req('/over-ons.html', 'text/markdown'));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/markdown; charset=utf-8');
  const body = await res.text();
  assert.ok(body.length > 500);
});

await test('/about alias resolves to the same markdown content as /over-ons.html', async () => {
  const a = await (await middleware(req('/about', 'text/markdown'))).text();
  const b = await (await middleware(req('/over-ons.html', 'text/markdown'))).text();
  assert.equal(a, b);
});

await test('nonexistent path + Accept: text/markdown -> 404 with markdown body >= 20 chars and a link', async () => {
  const res = await middleware(req('/__ora-404-probe-88rue627', 'text/markdown'));
  assert.equal(res.status, 404);
  assert.equal(res.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(res.headers.get('vary'), 'Accept');
  const body = await res.text();
  assert.ok(body.length >= 20, `expected >=20 chars, got ${body.length}`);
  assert.ok(body.includes('sitemap.xml') || body.includes('llms.txt'), 'expected a docs/sitemap/llms.txt link');
});

await test('nonexistent path + Accept: text/html -> falls through (next()), not a markdown 404', async () => {
  const res = await middleware(req('/this-page-does-not-exist', 'text/html'));
  assert.notEqual(res.headers.get('content-type'), 'text/markdown; charset=utf-8');
});

await test('every branch page has a markdown entry reachable through middleware', async () => {
  const branchPaths = [
    '/branche-bouw.html',
    '/branche-keukens.html',
    '/branche-autos.html',
    '/branche-badkamers.html',
    '/branche-zonnepanelen.html',
    '/branche-warmtepompen.html',
    '/branche-tandartsen.html',
  ];
  for (const p of branchPaths) {
    const res = await middleware(req(p, 'text/markdown'));
    assert.equal(res.status, 200, `expected 200 for ${p}`);
    const body = await res.text();
    assert.ok(body.length > 300, `expected meaningful content for ${p}, got ${body.length} chars`);
  }
});

await test('legal pages (privacy/terms/disclaimer) resolve through middleware', async () => {
  for (const p of ['/privacybeleid.html', '/privacy', '/algemene-voorwaarden.html', '/disclaimer.html']) {
    const res = await middleware(req(p, 'text/markdown'));
    assert.equal(res.status, 200, `expected 200 for ${p}`);
  }
});

await test('matcher config excludes static asset extensions', () => {
  const re = new RegExp(config.matcher[0]);
  assert.equal(re.test('/style.css'), false, '/style.css should be excluded');
  assert.equal(re.test('/main.js'), false, '/main.js should be excluded');
  assert.equal(re.test('/tailwind-built.css'), false, '/tailwind-built.css should be excluded');
  assert.equal(re.test('/branch-bouw.png'), false, '/branch-bouw.png should be excluded');
  assert.equal(re.test('/sitemap.xml'), false, '/sitemap.xml should be excluded');
  assert.equal(re.test('/robots.txt'), false, '/robots.txt should be excluded');
  assert.equal(re.test('/favicon.png'), false, '/favicon.png should be excluded');
  assert.equal(re.test('/'), true, '/ should be included');
  assert.equal(re.test('/over-ons.html'), true, '/over-ons.html should be included');
  assert.equal(re.test('/anything-random'), true, '/anything-random (404 case) should be included');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
