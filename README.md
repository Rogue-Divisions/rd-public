# rd-public

Cloudflare Worker that serves long-form public-facing pages on the canonical `roguedivisions.com` domain. Squarespace runs the rest of the site; this Worker only intercepts the paths bound in `wrangler.toml`.

## Live pages

| URL | File |
| --- | --- |
| `roguedivisions.com/thesis/capital-raising` | `public/thesis/capital-raising.html` |
| `roguedivisions.com/methodology/distribution` | `public/methodology/distribution.html` |

Each page is self-contained: HTML with inlined CSS, fonts and assets under its own subtree (`/thesis/fonts/`, `/thesis/assets/`, etc.). All paths are absolute under the route prefix so a page never depends on anything outside its own subtree.

## Adding a new page

1. Create `public/<section>/<slug>.html` (or `public/<section>/<slug>/index.html`).
2. Put fonts/images alongside it under `public/<section>/...` and reference them with absolute paths beginning `/<section>/...`.
3. Add the route in `wrangler.toml`:
   ```toml
   { pattern = "roguedivisions.com/<section>/*", zone_name = "roguedivisions.com" },
   ```
4. `wrangler deploy`.

## Deploy

```bash
npx wrangler deploy
```

First-time setup — once the routes in `wrangler.toml` are pushed, the bindings appear in the Cloudflare dashboard under **Workers & Pages → rd-public → Triggers → Routes**. Verify they target the correct zone.

## Why this Worker exists

Squarespace cannot host bespoke long-form HTML pages without compromising the marketing site's templating. Cloudflare Workers Static Assets serves the page from the same canonical domain (no subdomain split), with full control over markup, fonts, and animation, while everything else on `roguedivisions.com/*` continues to be served by Squarespace.
