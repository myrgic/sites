# Myrgic Sites

Monorepo for all five myrgic.* domain deployments. Sites are declared via per-app `site.yaml` specs and reconciled by the cogos kernel `SiteProvider`.

## Structure

- `apps/<name>/` — per-domain app source + `site.yaml` + `build.sh`
- `packages/<name>/` — shared packages (`brand-tokens`, `eigen-form`)
- `.cog/config/sites/` — reconciliation state (`.state.json` lives here)

## Deploy

```bash
cog reconcile sites
```

See `cog://mem/semantic/projects/myrgic-labs-public-presence-plan` for the broader plan.
