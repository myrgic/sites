# @myrgic/brand-tokens

Myrgic design system tokens: CSS custom properties for color, typography, spacing, and motion.

## Source of truth

Source: Myrgic Design System (internal).

Do not edit `colors_and_type.css` in this package directly. All changes must be made at the source and re-synced here.

## What's included

- Background and surface color scale (`--bg`, `--bg-card`, `--bg-elevated`)
- Text scale (`--fg` through `--fg-4`)
- Accent and spectrum variables
- Sub-brand hue bands (cogos, mod3, research, constellation)
- Type families (Fraunces display + JetBrains Mono body)
- Type sizes, spacing (4px base), radii, shadows, motion

## Usage

Link directly in HTML:
```html
<link rel="stylesheet" href="./colors_and_type.css">
```

Or copy into dist via `build.sh` (the standard pattern for apps in this monorepo).
