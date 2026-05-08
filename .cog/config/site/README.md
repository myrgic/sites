# `.cog/config/site/`

State and config home for the kernel's `SiteProvider` reconciler.

## What lives here

- **`.state.json`** *(gitignored)* — the kernel's last-known state of managed sites: per-app `address`, `external_id`, deployed `artifact_sha`, `cname_content`, `last_refreshed`. Written by `BuildState` after each `cogos reconcile site --apply`. Regenerable from live state via `--refresh`; not source-of-truth.

The declarative **source-of-truth** is one level up: each app's `apps/<name>/site.yaml` is the spec the SiteProvider reads via `LoadConfig`. Drift is the difference between those specs and what `.state.json` last recorded.

## State file shape

The kernel writes Terraform-style state with lineage tracking. Schema is `pkg/reconcile.State` in [`myrgic/cogos`](https://github.com/myrgic/cogos/blob/main/pkg/reconcile/types.go). Roughly:

```json
{
  "version": 1,
  "lineage": "<random hex; rotates on full re-init>",
  "serial": 17,
  "resource_type": "site",
  "generated_at": "2026-05-08T03:14:22Z",
  "resources": [
    {
      "address": "site.myrgic-com",
      "type": "site",
      "mode": "managed",
      "external_id": "<deploy-target main SHA>",
      "name": "myrgic-com",
      "attributes": {
        "artifact_sha": "<...>",
        "cname_content": "myrgic.com",
        "resolved_from_target": true
      },
      "last_refreshed": "2026-05-08T03:14:22Z"
    }
    // … one entry per app declared in apps/*/site.yaml
  ]
}
```

## Why gitignored

Live state drifts every reconcile (timestamps, serials, lineage UUIDs). Committing it would conflict on every `apply` and create noise. The reproducible artifact is the spec (`apps/*/site.yaml`); the state is a cache the kernel rebuilds on demand.

## Adjacent

- Meta-reconciler manifest at [`../manifest.yaml`](../manifest.yaml) — declares which providers `cogos reconcile` orchestrates and how (intervals, auto-apply, dependencies).
- Provider implementation: [`myrgic/cogos`](https://github.com/myrgic/cogos) (`site_provider.go`, `site_strategy_ghpages.go`).
