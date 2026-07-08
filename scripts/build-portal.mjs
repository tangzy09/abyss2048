// Build a portal-ready package from www/.
//   node scripts/build-portal.mjs gd    <GD_GAME_ID>
//   node scripts/build-portal.mjs crazy
//   node scripts/build-portal.mjs poki
// Produces dist/<portal>/ (injected copy of www/) and dist/<portal>.zip
// (GD wants root=index.html; the zip is renamed .html5 for GD).
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [portal, gameId] = process.argv.slice(2);
const PORTALS = {
  gd:    { sdk: null, needsId: true },
  crazy: { sdk: '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>', needsId: false },
  poki:  { sdk: '<script src="//game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',      needsId: false },
};
if (!PORTALS[portal]) { console.error(`usage: build-portal.mjs <gd|crazy|poki> [gameId]`); process.exit(2); }
if (portal === 'gd' && !gameId) { console.error('GD needs a gameId: build-portal.mjs gd <GD_GAME_ID>'); process.exit(2); }

const src = path.join(ROOT, 'www');
const outDir = path.join(ROOT, 'dist', portal);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(outDir), { recursive: true });
fs.cpSync(src, outDir, { recursive: true });

// inject config <script> (+ portal SDK) right before portal.js loads
const idxPath = path.join(outDir, 'index.html');
let html = fs.readFileSync(idxPath, 'utf8');
const cfg = `window.__PORTAL__='${portal}';` + (gameId ? `window.__GD_GAME_ID__='${gameId}';` : '');
const inject = `  <script>${cfg}</script>\n` + (PORTALS[portal].sdk ? `  ${PORTALS[portal].sdk}\n` : '');
html = html.replace('  <script src="js/portal.js"></script>', inject + '  <script src="js/portal.js"></script>');
fs.writeFileSync(idxPath, html);

// zip the folder CONTENTS (root = index.html) via PowerShell Compress-Archive (Windows)
const zipPath = path.join(ROOT, 'dist', `${portal}.zip`);
fs.rmSync(zipPath, { force: true });
execFileSync('powershell', ['-NoProfile', '-Command',
  `Compress-Archive -Path '${outDir}/*' -DestinationPath '${zipPath}' -Force`], { stdio: 'inherit' });

let finalZip = zipPath;
if (portal === 'gd') { finalZip = zipPath.replace(/\.zip$/, '.html5'); fs.rmSync(finalZip, { force: true }); fs.renameSync(zipPath, finalZip); }

const kb = Math.round(fs.statSync(finalZip).size / 1024);
console.log(`✅ ${portal}: ${path.relative(ROOT, outDir)}/  →  ${path.relative(ROOT, finalZip)}  (${kb} KB)`);
console.log(portal === 'gd'
  ? `   upload ${path.basename(finalZip)} in GD dashboard → Upload tab → view an ad in the iframe → Request Activation`
  : `   ${portal}: wire ${portal==='crazy'?'CrazyGames.SDK.init()':'PokiSDK.init()'} in portal.js, then submit ${path.basename(finalZip)}`);
