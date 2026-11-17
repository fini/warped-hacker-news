# Milestones

1. **Foundation:** public repository, SvelteKit/Workers scaffold, live Top feed,
   reproducible checks, Cloudflare Git deployment and loaded build identity.
2. **Reader:** all six feeds, pagination, story/comment reading, user profiles,
   editorial Modern light/dark appearance, responsive navigation and recovery.
3. **Themes:** independent LCARS and Matrix, persisted server-rendered preference,
   semantic shared styles, accessible controls and reduced motion.
4. **Launch:** browser and data-boundary checks, production smoke test, PR preview
   lifecycle, runtime logs, documentation and rollback instructions.

Implementation and local validation are recorded in Git history. GitHub Actions
is validation-only. Automatic deployment is complete only after the Worker is
connected to the repository in Cloudflare Builds and a Git push produces a
successful deployment. Optional Preview Builds must also be verified separately.
README.md records the exact connection and build settings. No GitHub Cloudflare
secret is required.

Later: search (requires a separate search source), bookmarks/read history,
optional device sync, more themes and a custom domain. No estimates or dates are
promised for these follow-ups.
