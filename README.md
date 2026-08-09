# Bit24Galaxy

Interactive Bit24 crypto galaxy explorer — Phase 1.

## Phase 1 scope

A static, RTL experience that turns the first 50 assets in Bit24's public market-cap table into a navigable star atlas:

- Topic-based constellations: core assets, networks, AI, DeFi, memes, stablecoins, RWA / Stocks, exchange tokens, and privacy.
- A coin can belong to multiple constellations.
- Logarithmic market-cap scaling controls each planet's visual radius.
- Search, category navigation, coin inspection, and a link to the Bit24 asset page.
- Free canvas navigation: drag to orbit around the current view, mouse wheel to zoom, and pinch on touch devices.
- Procedural planet rendering: logo-anchored colors, distinct surface families, atmosphere rims, rings, axial tilt, and deterministic rotation.
- Galaxy centers are shared-texture suns: every constellation uses the same refined solar surface recipe with its own category accent color.
- v0.2 interaction layer: distant opening overview, denser night-sky starfield, progressive hero fade on zoom-in, and automatic return from a focused galaxy when zooming out.
- Snapshot data only; no live prices, accounts, trading, or API keys in the browser.
- Responsive layout with a reduced-motion preference.

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

## Refresh the snapshot

The snapshot script reads Bit24's public market table, stores 50 rows in `public/data/coins.json`, and downloads the corresponding icons into `public/coin-icons/`:

```bash
python3 scripts/snapshot_bit24.py
```

The generated file records its UTC timestamp and source URL. Category assignments are intentionally maintained in the script so the editorial classification remains reviewable.

## Deploy

The Vite base path is `/Bit24Galaxy/`, ready for GitHub Pages. A GitHub Actions workflow can be added in the next iteration when the visual direction is approved.

## Data provenance

Source: [Bit24 public coin table](https://bit24.cash/coins/). The snapshot is contextual and not a live market feed. Verify current values on Bit24 before making financial decisions.

## License

Internal Bit24 prototype. Add the organization's preferred license before public reuse.

---

## Implementation notes

- The WebGL scene uses React Three Fiber and Drei.
- Planet surfaces use a custom shader with seeded noise families (ocean, marble, gas, lava, ice, desert, storm, crystal, shadow, and neon), so the asset logo remains the color anchor without requiring 50 separate PNG textures.
- The background star field is a lightweight point cloud; coin nodes are ordinary meshes for the Phase 1 dataset size.
- UI is an HTML overlay above the canvas, keeping search, accessibility, RTL text, and links usable.
- Production hardening should add a source data review step, image caching policy, analytics consent, and mobile/device performance profiling.
