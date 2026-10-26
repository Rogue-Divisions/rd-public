# Client proposals

Client-facing proposals on `client.roguedivisions.com`, served by the dedicated `rd-client-proposals` Cloudflare Worker. This is independent of the main public-site Worker, Horizons and the intranet.

## Published route

- `/c3/london-accelerator-day-2026/`: C3 AI filming proposal, approved for public link access by Sage on 26 October 2026. No sign-in, navigation listing or analytics. Requests search non-indexing through HTML, response headers and robots.txt.

Only audience-facing HTML, styles, scripts, original logos, fonts and the font licence are included. Source transcripts, internal pricing research and task receipts stay outside the public asset directory.

## Deployment

After the exact branch has passed review and merged:

```sh
wrangler deploy --config client/wrangler.toml
```

The custom-domain binding provisions the subdomain and HTTPS through the existing Cloudflare account. Worker and version preview hostnames are disabled. The hostname root and unknown paths return 404; the proposal is accessed through its full route.
