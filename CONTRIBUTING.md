# Contributing

Thanks for the interest! oh-my-sdd is deliberately small; contributions
should keep it that way.

## Ground rules

- **Zero dependencies is a feature** ([ADR 0003](specs/adr/0003-zero-dependency-tooling.md)).
  PRs that add a `package.json` dependency, a build step, or a CDN reference
  to the tooling will be declined, however nice the library.
- **This repo eats its own dog food.** Any change to the method or the
  tooling ships with its spec (or ADR) in the same PR, statuses flipped,
  index regenerated. `node specs/generate-index.mjs --check` must pass —
  CI enforces it.
- **The contract stays small.** New frontmatter keys, statuses, or tiers
  need a strong story about what breaks without them. "It might be useful"
  isn't one; a written trigger from a real adopting repo is.

## Good contributions

- Bug fixes in the generator/explorer with a minimal repro.
- Portability fixes (Windows paths, older Node within ≥ 18, locale issues).
- Clarity fixes in the docs and templates — shorter and sharper always wins.
- Experience reports: what broke when you adopted this at scale? Open an
  issue; the fix may be a spec here.

## Dev loop

```bash
node specs/generate-index.mjs --check   # must pass
node specs/explorer.mjs                 # eyeball the UI when touching it
```
