# Marketing skills (vendored)

Vendored copy of [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) — 50 marketing skills covering CRO, copywriting, SEO/AI-SEO, paid ads, ad creative, email, pricing, launch, and revops.

- **Version:** 2.11.1
- **Commit:** `5b2c0007766c6a1cf1d53fd8fc73e979e0821022`
- **Vendored:** 2026-09-06
- **License:** MIT (see `skills/` upstream)

## Layout

```
.claude/
  skills/<name>/SKILL.md          # the 50 skills
  skills/<name>/references/*.md   # deep-dive references
  tools/REGISTRY.md               # 65 vendor CLIs + integration notes
  tools/clis/*.js                 # per-vendor API scripts (need that vendor's API key)
```

`skills/` and `tools/` must stay siblings — skills link to tools via
`../../tools/` (from `SKILL.md`) and `../../../tools/` (from `references/`).

## Using them

Claude Code picks the skills up automatically from `.claude/skills/`; just describe
the marketing task ("write copy for the pricing page", "audit this signup flow").

The `product-marketing` skill generates a `.claude/product-marketing-context.md`
file that most other skills read first for product/audience/positioning context —
worth running once before the rest.

The `tools/clis/*.js` scripts are optional. Each reads its own vendor's API key from
an env var (`AHREFS_API_KEY`, `GA4_ACCESS_TOKEN`, …) and calls only that vendor's
API; most support `--dry-run`. Nothing runs unless you invoke it.

## Updating

```bash
git clone --depth 1 https://github.com/coreyhaines31/marketingskills /tmp/ms
rm -rf .claude/skills .claude/tools
cp -r /tmp/ms/skills /tmp/ms/tools .claude/
```

Then update the version and commit recorded above.

## Known upstream issues

Two dead cross-references exist in upstream at this commit and are kept as-is so the
vendored tree stays byte-identical to upstream (re-check after any update):

- `skills/ad-creative/SKILL.md` → `../../ads/references/meta-decision-system.md`
  (one `../` too many; the file is at `skills/ads/references/meta-decision-system.md`)
- `skills/ads/references/creative-research-automation.md` → `../../positioning/SKILL.md`
  (the `positioning` skill was renamed to `product-marketing` in v2.0)

Cosmetic only — the surrounding skill still works.
