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

export default function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
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
