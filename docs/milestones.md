# Milestones

1. **Foundation:** public repository, SvelteKit/Workers scaffold, live Top feed,
   reproducible checks, GitHub Actions deployment and loaded build identity.
2. **Reader:** all six feeds, pagination, story/comment reading, user profiles,
   editorial Modern light/dark appearance, responsive navigation and recovery.
3. **Themes:** independent LCARS and Matrix, persisted server-rendered preference,
   semantic shared styles, accessible controls and reduced motion.
4. **Launch:** browser and data-boundary checks, production smoke test, PR preview
   lifecycle, runtime logs, documentation and rollback instructions.

Implementation and local validation are recorded in Git history. Remote CI and
preview lifecycle are only complete after deployment credentials are configured
and their workflows have passed. README.md describes that setup; do not interpret
the presence of a workflow file as proof of a successful deployment.

Later: search (requires a separate search source), bookmarks/read history,
optional device sync, more themes and a custom domain. No estimates or dates are
promised for these follow-ups.
