# Hacker News, engaged

Product name: Hacker News, engaged. The warped-hacker-news repository and Worker
names are technical identifiers, not the displayed brand.

Public, read-only Hacker News reader. SvelteKit 3 / Svelte 5 / TypeScript / npm,
Cloudflare Workers and project-local Wrangler. App lives at the repository root.
Read README.md and docs/architecture.md before changing behavior.

## Product and architecture

Keep reading fast, clear, mobile-friendly, and text-first. Modern is the default;
LCARS and Matrix adapt the visual language from fini/warpz-playlists. Use the
public Firebase API only. Voting, posting and replying link to Hacker News.
No database, accounts, paid infrastructure or additional providers without a
concrete requirement. Never add article scraping to the story link flow.

## Independent themes

Shared layout, controls and motion live in src/styles. Semantic tokens provide
a usable baseline. Each theme lives in src/themes and scopes every selector to
its root data-theme. Never stack themes or make one depend on another's geometry.
Components use semantic variables, not private theme colors, fonts or decoration.
Use the shared SVG icon component, rem spacing and responsive type. Preserve
keyboard access, visible focus, readable contrast and reduced motion.
Theme/appearance cookies are applied during server rendering, before paint.

## Async feedback and data

Guard duplicate loads before awaiting; show pending, success or failure at the
control; preserve loaded content on failure; release pending state in finally.
Fetch replies in bounded batches. Keep upstream HTML sanitized server-side and
links restricted to safe schemes. Never log credentials or user content.

## Checks and deployment

Run npm run lint, npm run check, npm test, npm run build and relevant browser
checks. npm run test:browser exercises the production Worker locally and requires
Playwright Chromium. Report verification gaps honestly.
GitHub Actions validates changes only; it has no Cloudflare credentials.
Cloudflare Workers Builds owns Git integration, production deployments and
optional public previews. Configure its build command as npm run ci:build and
its deploy command as npx wrangler deploy. Use Node 24. Browser tests run in
GitHub independently; require the verify check before merging if that gate is
needed. Do not use pull_request_target to execute PR code. Use project-local
Wrangler and preserve wrangler.jsonc. Never claim Git integration is configured
without verifying a successful Cloudflare build triggered by a Git push.
Stage only task files and never commit local secrets, caches or test artifacts.
