# Warped Hacker News, engaged

A different lens on the same curious community. A fast, text-first Hacker News
reader with Modern (light/dark/system), LCARS, Matrix, and Neon Noir themes.

- **Live:** https://warped-hacker-news.fini-alring.workers.dev
- **Source:** https://github.com/fini/warped-hacker-news
- **Stack:** SvelteKit 3, Svelte 5, TypeScript 6, Cloudflare Workers.

## Develop

Use Node 24 or newer and npm. The public HN API requires no key.

```sh
npm ci
npm run dev
```

The development server binds to loopback. To exercise the production Worker:

```sh
npm run build
npm run preview
```

## Verify

```sh
npm run lint
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Browser tests use live HN data and therefore need internet access and a healthy
upstream API. Tests cover desktop/mobile reading, pagination, profiles, theme
persistence, viewport sizing and error routes. Unit tests use mocked upstream
responses for deterministic data-boundary and failure checks.

## Deployment

Cloudflare Workers Builds pulls directly from GitHub and deploys `main`.
GitHub Actions runs validation only and needs no Cloudflare secrets.

The existing Worker is connected to `fini/warped-hacker-news`. Manage its Git
integration under **Workers & Pages → warped-hacker-news → Settings → Builds**.
The configured settings are:

| Setting           | Value                          |
| ----------------- | ------------------------------ |
| Production branch | `main`                         |
| Root directory    | `/`                            |
| Build command     | `npm run ci:build`             |
| Deploy command    | `npx wrangler deploy`          |
| Preview command   | `npx wrangler preview`         |
| Node version      | `24` (also pinned in `.nvmrc`) |

Cloudflare uses its existing managed build credential. No `CLOUDFLARE_API_TOKEN`
or account variable is needed in GitHub. Preview Builds are enabled for
development branches; preview URLs are public. Cloudflare manages those
previews rather than GitHub Actions.

The build command checks formatting, types and unit tests before producing the
Worker bundle. GitHub Actions additionally runs browser tests in parallel;
Cloudflare does not wait for the GitHub job. Use pull requests and require the
`verify` check before merging when a browser-test gate is needed.

Push a commit to `main` to trigger production deployment. Check its commit and
deployment status in the Cloudflare Builds view; the site footer identifies
the loaded release.
Manual fallback: run the checks and `npm run deploy` using local Wrangler OAuth.

### Troubleshooting and rollback

Use GitHub Actions logs for validation failures and the Cloudflare Builds view
for build/deployment failures. Check repository access, branch and build settings
there if pushes do not deploy. Inspect runtime failures with
`npx wrangler tail warped-hacker-news`. Logs and sampled traces are enabled.
The footer shows the commit and UTC build date for the loaded release.

Inspect deployment history with `npx wrangler deployments list`. Restore a known
good version with `npx wrangler rollback <version-id>`, or revert the offending
commit and push the revert to `main`. Reconcile any emergency rollback with Git
so the next deployment does not restore the bug. There is no application database.

## Themes and project guidance

See [architecture](docs/architecture.md), [milestones](docs/milestones.md), and
[agent conventions](AGENTS.md). The theme architecture, LCARS palette and Matrix
visual language were adapted from `fini/warpz-playlists`; the Matrix workbench in
`fini/warped-sys1-lab` provided an additional reference. No runtime dependency on
those projects is introduced.

Content comes from the [official Hacker News API](https://github.com/HackerNews/API).
This is an independent reader, unaffiliated with Y Combinator. Story titles link
to their original destinations; discussions and profiles render public HN data.
Voting, posting and replying happen on Hacker News. Search, saved stories,
accounts, device sync and custom domains are future work.
