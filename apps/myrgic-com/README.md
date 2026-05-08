# myrgic-com

The canonical myrgic.com site. React-based Hero + Page components rendering the Myrgic brand identity.

## Configuration

See `site.yaml` for the deployment spec (domain, strategy, target repo).

## Build

`build.sh` copies `src/` into `dist/`, then pulls `eigen-form.js` from `packages/eigen-form/src/` and `colors_and_type.css` from `packages/brand-tokens/`. The dist directory is what gets deployed to GitHub Pages.

Run from the repo root: `bash apps/myrgic-com/build.sh`

## Source

`src/index.html` — entry point, loads React + Babel CDN + eigen-form.js + colors_and_type.css
`src/Hero.jsx` — Hero component with Myrgic mark canvas
`src/Page.jsx` — Page layout component
