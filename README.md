# myrgic/sites

Monorepo for all five `myrgic.*` domain deployments. The flagship demonstration of [myrgic/cogos](https://github.com/myrgic/cogos)'s reconciler framework: a declarative `site.yaml` per app, reconciled to GitHub Pages via the kernel's `SiteProvider`.

## Live

| Domain | Behavior |
|---|---|
| **myrgic.com** | brand site (HTTPS enforced; canonical) |
| myrgic.dev / .ai / .net / .org | redirect to https://myrgic.com/ |

## Layout

```
sites/
├── apps/
│   ├── myrgic-com/      site.yaml + src/ + build.sh   (canonical brand site)
│   ├── myrgic-dev/      site.yaml + src/ + build.sh   (redirect to .com)
│   ├── myrgic-ai/       …                              (redirect)
│   ├── myrgic-net/      …                              (redirect)
│   └── myrgic-org/      …                              (redirect)
├── packages/
│   ├── brand-tokens/    canonical Myrgic CSS tokens (mirror)
│   └── eigen-form/      mathematical design library v0.0.1 (the trefoil mark engine)
├── .cog/
│   └── config/
│       ├── manifest.yaml   meta-reconciler declaration (which providers run, how)
│       └── site/
│           ├── README.md   what state lives here, schema reference
│           └── .state.json runtime state (gitignored — regenerable)
└── README.md
```

## How it works

1. Each `apps/<name>/site.yaml` declares a domain, its build, and its deploy strategy + target.
2. The kernel's `SiteProvider` walks `apps/*/site.yaml` via `LoadConfig`.
3. `FetchLive` queries each deploy-target repo (CNAME content, current `main` SHA) via `gh api`.
4. `ComputePlan` diffs declared vs live → `Action[]` (create / update / delete / skip).
5. `ApplyPlan` runs `apps/<name>/build.sh`, then dispatches to `GHPagesStrategy.Deploy` which force-pushes `dist/` + a generated `CNAME` to the deploy target.
6. State lands in `.cog/config/site/.state.json`.

Running:

```bash
# Plan only (no side effects):
cogos reconcile site --dry-run --json

# Plan + apply:
cogos reconcile site --apply
```

Requires the cogos kernel binary (≥ v0.5.0). See [myrgic/cogos](https://github.com/myrgic/cogos) for installation.

## What this repo demonstrates

- **Declarative deployment.** All five sites' specs live in version-controlled YAML; no imperative deploy scripts.
- **Pluggable strategies.** `GHPagesStrategy` is one implementation; the `DeployStrategy` interface contracts equally for gitlab-pages, k8s ingress, S3, self-hosted rsync as future drop-ins.
- **Self-demonstrative architecture.** The lab's public infrastructure runs through the framework the lab publishes. Same `Reconcilable` shape as ArgoCD, executed through the kernel CLI rather than a separate operator.

## License

MIT.
