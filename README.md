# Bit24Galaxy

Interactive Bit24 crypto galaxy explorer — **v4.0.0**.

## v4 scope

A static, RTL WebGL atlas built from the supplied Bit24 category export:

- 16 ordered primary galaxies; the supplied `بدون دسته‌بندی` group is excluded.
- Up to 12 placements per supplied category, preserving the source counts: **162 planet placements** and **160 unique symbols** in this snapshot.
- CoinMarketCap market-cap metadata is preferred, with the source and fallback recorded per asset; no API key is shipped to the browser.
- Planet radius uses bounded logarithmic market-cap scaling so large assets remain visually dominant without overwhelming the composition.
- Repeated symbols reuse one canonical market-cap record and one deterministic planet profile, so their size, palette, surface family, seed, and decorations match in every galaxy.
- Deterministic 3D orbit bands, deep Z layers, expanded world bounds, and pairwise galaxy relaxation preserve negative space and avoid overlaps.
- Overview, category focus, search, free rotate, zoom, hover, and coin inspection remain available.
- Overview uses a lighter render budget for the expanded placement count; category focus restores high detail.
- Snapshot data only: no live prices, accounts, trading, or API keys in the browser.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/Bit24Galaxy/`.

## Verify

```bash
npm run test
npm run build
```

## Rebuild the v4 snapshot

The checked-in source file is `public/data/bit24_coins_by_category.json`. The v4 builder selects the first 12 entries from each primary group, excludes `بدون دسته‌بندی`, downloads local icons from Bit24's public catalog, and resolves market caps from CoinMarketCap's public listing payload with explicit fallbacks:

```bash
python3 scripts/build_v4_snapshot.py
```

The generated `public/data/coins.json` records the UTC timestamp, source endpoints, category order, placement/unique counts, and per-symbol market-cap provenance. Repeated placements intentionally remain repeated in the category scenes.

## Deploy

The Vite base path is `/Bit24Galaxy/`, ready for GitHub Pages. Deployment is handled by `.github/workflows/deploy.yml`.

## Data provenance

Selection source: the supplied Bit24 category export. Metadata sources: [CoinMarketCap public data](https://coinmarketcap.com/) and the [Bit24 public coin catalog](https://api.bit24.cash/api/v3/coins/). Values are a static snapshot, not a live market feed; verify current values before making financial decisions.

## License

Internal Bit24 prototype. Add the organization's preferred license before public reuse.

---

## Implementation notes

- The WebGL scene uses React Three Fiber and Drei.
- Planet surfaces use seeded procedural noise families with canonical symbol profiles; regular striping and harsh voxel-like noise remain excluded.
- The background star field is a lightweight deterministic point cloud; overview geometry and shader budgets are reduced for the expanded scene.
- UI is an HTML overlay above the canvas, keeping search, accessibility, RTL text, and links usable.
- Production hardening should add a source review step, image caching policy, analytics consent, and mobile/device performance profiling.
- The snapshot date and source values are contextual; the application does not claim to be a live market terminal.

---

## Version history

- `v4.0.0`: 16-category supplied taxonomy, 162 placements / 160 unique symbols, static market-cap metadata, canonical repeated-symbol profiles, and expanded collision-safe 3D composition.
- `v0.3.3`: scalable render budgets.
- `v0.3.2`: requested Bit24 dark logo.
- `v0.3.1`: redesigned top bar.
- `v0.2.9`: organic planet surfaces.
