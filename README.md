# Warped Hacker News

A different lens on the same curious community. A fast, text-first Hacker News
reader with Modern (light/dark/system), LCARS, and Matrix themes.

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

GitHub Actions validates pushes and pull requests. Successful `main` builds deploy
to the `warped-hacker-news` Worker. Same-repository PRs receive **public** named
previews; fork PRs run checks only. Closing a PR deletes its preview.

Configure these in GitHub repository **Settings → Secrets and variables → Actions**:

- Repository secret `CLOUDFLARE_API_TOKEN`: a dedicated Cloudflare token using the
  **Edit Cloudflare Workers** template scoped to the intended account. Never paste
  it in chat or commit it. Preview permissions may need additional scope according
  to the current Cloudflare Previews documentation.
- Repository variable `CLOUDFLARE_ACCOUNT_ID`: the intended account ID.

MCP authorization and local Wrangler OAuth do not supply GitHub Actions secrets.
After changing credentials, rerun the failed workflow or use **Run workflow**.
Deploy locally after checks with `npm run deploy`, using project-local Wrangler.

### Troubleshooting and rollback

Use the GitHub Actions step logs to distinguish validation failures from missing
credentials or Cloudflare authorization errors. Inspect runtime failures with
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
Warped is an independent reader, unaffiliated with Y Combinator. Story titles link
to their original destinations; discussions and profiles render public HN data.
Voting, posting and replying happen on Hacker News. Search, saved stories,
accounts, device sync and custom domains are future work.
