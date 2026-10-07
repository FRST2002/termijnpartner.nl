# TermijnPartner — website

Static marketing site for [termijnpartner.nl](https://termijnpartner.nl). Plain HTML/CSS/JS, no build step, no backend.

## Files

- `index.html` — the page
- `style.css` — styling
- `main.js` — mobile menu, FAQ accordion, pricing configurator, branches carousel, scroll reveal
- images — logos, branch photos, favicon

## Local preview

Any static file server works, e.g.:

```bash
python -m http.server 8090
```

Then open http://localhost:8090.

## Deploying

Deployed via Vercel, connected to this repo. Pushing to `main` redeploys automatically.
