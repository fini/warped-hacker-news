# Architecture

## Rendering and data

SvelteKit 3 config lives in vite.config.ts. The Cloudflare adapter produces a
Worker and Static Assets; wrangler.jsonc is the deployment source of truth.
Node 24 is used for local tooling and CI, while production runs on workerd.

The root route is Top; /new, /best, /ask, /show and /jobs share one feed renderer.
?page= selects a 30-ID slice in upstream order. /item/[id] renders stories or
comments; /user/[username] renders a public profile. Invalid routes use proper
404 responses. Upstream item/profile failures use 503; feeds retain their shell
and provide a retry action.

The server-only HN client uses the official Firebase v0 endpoints. Item fetches
have an eight-second timeout and six-request concurrency limit. Cloudflare fetch
cache options cache public upstream data for 45 seconds. Full pages stay private
because theme cookies affect HTML. Upstream failures are not cached by the app.
Null, dead and deleted feed items are omitted. HTML is sanitized with a small tag
and attribute allowlist. Only HTTP(S) story links are rendered. Comment HTML links
also permit mailto. No source article HTML is fetched.

Story pages initially load at most 15 direct comments. A reply button calls
/api/comments/[parentId]?offset=0, which loads the next 15 direct children in
upstream order. Each batch uses at most 16 upstream requests. Replies load on
explicit demand; they do not recursively fetch a whole discussion. Partial batch
failures retain loaded results and retry the same offset with deduplication.
Deep nesting is capped visually at eight levels, then links to the thread root.
Pagination is a live view: changing upstream ranks can move stories between pages.

## Presentation

src/styles/tokens.css defines the usable baseline, base.css defines shared
layout and controls, and motion.css defines transitions and reduced motion.
Each file under src/themes scopes all selectors to its own root data-theme.
Modern also uses data-appearance to honor system/light/dark preference. LCARS and
Matrix are intentionally dark palettes. No shared component requires LCARS.

The theme registry is src/lib/themes.ts. To add a theme: register its ID/display
name, add an independently scoped stylesheet, import it in src/app.css, extend
contract tests, then verify page types, mobile, reload, focus and reduced motion.
Never build a theme by importing another theme. Use semantic tokens for colors,
fonts and shapes; use Icon.svelte for shared SVG geometry.

A native POST to /appearance saves allowlisted preferences in one-year,
SameSite=Lax HttpOnly cookies, then redirects to a validated local return path.
Server hooks apply root attributes before the HTML is painted. Core content and links are server-rendered. Theme settings use a native form;
the settings toggle, mobile menu, collapsing and progressive replies need client
JavaScript. Build identity is frozen into client/server bundles during build.

## Delivery

GitHub Actions runs formatting, type checks, focused unit tests, production build,
and Playwright browser tests before deployment. Production is the main branch.
PR previews share no application data because this application has no database,
secrets or storage bindings. Preview URLs are public. Secrets are available only
to deployment jobs for trusted same-repository changes. They are not present in
validation jobs or external fork workflows.
