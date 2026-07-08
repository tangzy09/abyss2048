# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Deep Merge** — an ocean-themed 2048-style merge puzzle, plain HTML5 Canvas wrapped by **Capacitor** into native Android/iOS. No build step, no framework, no bundler.

## Commands

```bash
npm install
npm run serve          # http-server on :5173 — MUST use http (locales load via fetch; file:// fails)

npx cap add android    # generates /android (gitignored); ios needs macOS+Xcode
npx cap sync           # run after ANY change to www/ or after installing a plugin
npm run android        # cap run android  (also :ios, open:android, open:ios)
```
Requires Node 18+, JDK 17. There are no tests, no linter, no compile step — the game is the source in `www/`.

## Architecture

Everything lives in `www/`. Scripts are plain `<script>` tags sharing one global namespace — **no modules, no imports**. Load order in `index.html` is load-bearing: infra (`platform → i18n → iap → ads`) then game (`constants → logic → skin → render → main`). A file may reference globals defined in an earlier-loaded file only.

**Single mutable state object `G`** (defined in `logic.js`). Every logic function mutates `G` in place; there is no store/reducer. The whole UI is a pure function of `G`.

**Immediate-mode render loop.** There is no DOM for the game — one `<canvas>`. The flow is always:
```
input (main.js) → move()/dispatch() mutates G → flushPending() → renderAll()
```
`renderAll()` clears and repaints the entire screen from `G` each frame, rebuilding `hitAreas[]` (in `render.js`). Taps go through `hitTest(x,y)` → `{action,data}` → `dispatch()`. So **to make anything clickable you must both draw it and `addHit(...)` it**; to add an interaction, add a `case` in `dispatch()` (`main.js`). The one DOM overlay is the top control bar (`#controls`, lang/skin/buyout), rendered as HTML string by `renderControls()` in `skin.js`.

**Art assets (not emoji).** Tiles/items/talents/envs/scenes render as preloaded `.webp` images with an emoji fallback: `CreatureArt` (`www/assets/creatures/<skin>/tile-<v>.webp`) plus `ItemArt`/`TalentArt`/`EnvArt`/`SceneArt` (`www/assets/{items,talents,envs,scenes}/<id>.webp`, `id` = the game id, no `item-`/… prefix) in `render.js`. Drawn via `drawItemIcon`/`drawTalentIcon`/`drawEnvIcon` (image if loaded else emoji); `SceneArt` is the per-skin full-screen background. All loaders are kicked off in `renderAll()`. Source prompts + regeneration pipeline (local ComfyUI + Flux → BiRefNet cutout) are in `ART-PROMPTS.md`; a missing/failed image silently falls back to the config object's `.icon` emoji.

**Phase state machine.** `G.phase` (`HOME`, `TALENT_SELECT`, `LEVEL_INTRO`, `PLAYING`, `REWARD`, `WIN`, `LOSE`, …) gates input and selects which overlay `render.js` draws. `move()` is a no-op unless `phase==='PLAYING'` and no item/bomb mode is armed.

**Board & tile encoding** (`G.board`, size N×N): `0` = empty, positive power-of-two = tile value, `-1` = joker/ghost (merges with any tile). `G.specialTiles` is keyed by `r*size+c` with `{type:'fog'|'locked', stepsLeft?}`. The merge/slide core is `slideArr` → `slidePositions` → `move`; `canMove()` duplicates that logic in `trySlide*` helpers purely to test for game-over **(keep the two in sync when changing merge rules).**

**Environments & progression.** `LEVELS` (constants.js) drive size/target/endless. Every step `tickEnv()` may swap `G.env` to a random hazard/buff from `ENVS` (storm/fog/gravity/×2…) with `onStart/onStep/onEnd` hooks mutating the board. Talents (run modifiers), items (per-move powerups, `ITEMS_DEF` + `use*`/`activateMode` handlers), and rewards (energy bar / level-win / rewarded-ad) are all in `logic.js`.

## Two hard rules when editing

1. **No hardcoded user-facing text.** All strings come from `www/locales/<lang>.json` via `I18N.t('dotted.key', {params})`. `constants.js` config objects (`LEVELS`, `TALENTS`, `ITEMS_DEF`, `ENVS`, `ACHS`, `SKINS`) carry only numeric/structural fields; their `.name/.desc/.title/...` are injected at runtime by `applyLocale()`. When you add a level/item/env/talent, add its numeric entry **and** the matching keys in every locale file, then wire it into `applyLocale()`. Add a language by dropping `<lang>.json` and adding it to `SUPPORTED` in `i18n.js`.

2. **Platform calls go through the abstraction layers, never directly.** `Platform.storage.get/set` (sync facade over Capacitor Preferences / localStorage; keys must be pre-declared in `Platform.hydrate([...])` at boot in `main.js`). `IAP` (RevenueCat) and `Ads` (AdMob rewarded) both **degrade to web simulations** (`window.confirm`) when not native, so the full monetization flow is testable in the browser. Premium (`IAP.isPremium()`) unlocks premium skins and makes rewarded-gear instant (skips the ad).

## Before release (all in README.md §"上线前必须替换")

Placeholders that ship non-functional: `AD_UNITS` in `ads.js` (currently Google test ids, `initializeForTesting:true`), `REVENUECAT_API_KEY`/`PRODUCT_ID` in `iap.js` (empty keys → local-flag fallback), and `appId`/`appName` in `capacitor.config.json`.
