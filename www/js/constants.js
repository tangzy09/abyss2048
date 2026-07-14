// ════════════════════════════════════════
// constants.js — palettes, tile maps, numeric config.
// All player-facing text is injected from i18n by applyLocale().
// ════════════════════════════════════════
const C = {
  bg:'#e9f6ff', bg2:'#cfebff', surface:'#ffffff', surface2:'#eef8ff', border:'#c6e6f5',
  text:'#2f5a75', muted:'#6b96af', accent:'#ff5e93', accent2:'#2bb3a3',
  danger:'#ff5c83', success:'#2eb98a', purple:'#8f6fe0', cyan:'#3f9fc9',
};
// Cute macaron/candy tile palette — soft pastel bg + friendly mid-tone digits.
const CUTE_TILES = {
  0:{bg:'#eaf4fb',fg:'#c4dcea'},        2:{bg:'#eef7ff',fg:'#7aa6c2'},
  4:{bg:'#d4ecff',fg:'#4a90c8'},        8:{bg:'#ffe2cf',fg:'#ee8a44'},
  16:{bg:'#fff1bf',fg:'#d9a41e'},       32:{bg:'#e7dcff',fg:'#8f6ce0'},
  64:{bg:'#cef3e3',fg:'#33b183'},       128:{bg:'#ffd6e7',fg:'#ec619b'},
  256:{bg:'#ffd0d4',fg:'#e35663'},      512:{bg:'#c9e6ff',fg:'#3d84cf'},
  1024:{bg:'#ffe6a8',fg:'#e0a000'},     2048:{bg:'#ffd7a0',fg:'#f07a1e'},
  4096:{bg:'#bdeeff',fg:'#1fa8d8'},     8192:{bg:'#e3d4ff',fg:'#9a5cf0'},
  16384:{bg:'#c8f5d8',fg:'#2eb85f'},    32768:{bg:'#ffcede',fg:'#e84c86'},
  65536:{bg:'#c6f0f5',fg:'#1fb0c0'},    131072:{bg:'#ddd6ff',fg:'#7b6ce0'},
  262144:{bg:'#d4f5c8',fg:'#5aa832'},   524288:{bg:'#c3f0e8',fg:'#22a892'},
  1048576:{bg:'#ffe0b8',fg:'#e8901e'},  2097152:{bg:'#ffd2f0',fg:'#e055c0'},
  4194304:{bg:'#c8ecff',fg:'#2e90d8'},  8388608:{bg:'#fff0bf',fg:'#dbab1e'},
  16777216:{bg:'#fff8fc',fg:'#ff6fa8'},
};
const TILE_MAP = { ...CUTE_TILES };
const TILE_KEYS = [2,4,8,16,32,64,128,256,512,1024,2048,4096,8192,16384,
  32768,65536,131072,262144,524288,1048576,2097152,4194304,8388608,16777216];
function tileStyle(v) {
  if (v === -1) return { bg:'#f0e2ff', fg:'#b06be0' };
  if (!v) return TILE_MAP[0];
  for (let i = TILE_KEYS.length - 1; i >= 0; i--)
    if (v >= TILE_KEYS[i]) return TILE_MAP[TILE_KEYS[i]];
  return TILE_MAP[2];
}
// Board values stay powers of two internally, but the player only ever sees an evolution
// tier: 2 → Lv.1, 4 → Lv.2, 8 → Lv.3 … (1 = Lv.0, the debris tile storms spawn).
// Every user-facing number must go through tierDisp — never print a raw board value.
const tierOf = v => Math.round(Math.log2(v));
const tierDisp = v => `Lv.${tierOf(v)}`;
// LABELS is filled from the active skin's localized labels in applyLocale/applySkin.
let LABELS = {};
let activeSkinId = 'deep';

// Skins: all free (ad-only monetization; no buyout).
const SKINS = [
  { id:'deep', icon:'🌊', palette:{
      bg:'#e9f6ff', bg2:'#cfebff', surface:'#ffffff', surface2:'#eef8ff', border:'#c6e6f5',
      text:'#2f5a75', muted:'#6b96af', accent:'#ff5e93', accent2:'#2bb3a3',
      danger:'#ff5c83', success:'#2eb98a', purple:'#8f6fe0', cyan:'#3f9fc9' },
    tileMap:{ ...CUTE_TILES } },
  { id:'coral', icon:'☀️', palette:{
      bg:'#fff8f0', surface:'#fef0dc', surface2:'#fde8cc', border:'#f0c888',
      text:'#3a2010', muted:'#b08060', accent:'#ff6633', accent2:'#ffaa00',
      danger:'#cc2200', success:'#44aa66', purple:'#cc4488', cyan:'#0099cc' },
    tileMap:{
      0:{bg:'#f5e8d0',fg:'#c8a878'},2:{bg:'#ffe4b5',fg:'#cc6633'},4:{bg:'#ffd080',fg:'#aa4400'},8:{bg:'#ffaa55',fg:'#ffffff'},
      16:{bg:'#ff7744',fg:'#ffffff'},32:{bg:'#ff5566',fg:'#ffffff'},64:{bg:'#cc2255',fg:'#ffffff'},128:{bg:'#2288dd',fg:'#ffffff'},
      256:{bg:'#0066bb',fg:'#ffdd88'},512:{bg:'#004499',fg:'#ffee66'},1024:{bg:'#ffaa00',fg:'#ffffff'},2048:{bg:'#ff5500',fg:'#ffffff'},
      4096:{bg:'#cc0044',fg:'#ffffff'},8192:{bg:'#880088',fg:'#ffaaff'},16384:{bg:'#006633',fg:'#aaffcc'},32768:{bg:'#aa2200',fg:'#ffddaa'},
      65536:{bg:'#003366',fg:'#aaddff'},131072:{bg:'#4400aa',fg:'#ddbbff'},262144:{bg:'#006600',fg:'#aaffaa'},524288:{bg:'#005566',fg:'#aaffee'},
      1048576:{bg:'#883300',fg:'#ffccaa'},2097152:{bg:'#660044',fg:'#ffaacc'},4194304:{bg:'#003366',fg:'#aaddff'},8388608:{bg:'#664400',fg:'#ffd888'},
      16777216:{bg:'#ffffff',fg:'#ff4400'} } },
  { id:'polar', icon:'🌌', palette:{
      bg:'#050f1a', surface:'#081828', surface2:'#0a2038', border:'#1a4060',
      text:'#c0f0ff', muted:'#3a6888', accent:'#00ffcc', accent2:'#88ddff',
      danger:'#ff4466', success:'#00ffaa', purple:'#aa66ff', cyan:'#00ddff' },
    tileMap:{
      0:{bg:'#081828',fg:'#1a4060'},2:{bg:'#0d2a48',fg:'#6699cc'},4:{bg:'#0a2a58',fg:'#88bbee'},8:{bg:'#082060',fg:'#aaddff'},
      16:{bg:'#062058',fg:'#00bbff'},32:{bg:'#062050',fg:'#00eeff'},64:{bg:'#042040',fg:'#88ffee'},128:{bg:'#021a30',fg:'#00ffcc'},
      256:{bg:'#0e0030',fg:'#aa66ff'},512:{bg:'#180040',fg:'#cc88ff'},1024:{bg:'#1e0060',fg:'#ffaaff'},2048:{bg:'#002a00',fg:'#00ff88'},
      4096:{bg:'#001a00',fg:'#44ff88'},8192:{bg:'#001010',fg:'#00ffdd'},16384:{bg:'#100028',fg:'#cc88ff'},32768:{bg:'#1a0005',fg:'#ff6699'},
      65536:{bg:'#001a28',fg:'#00eeff'},131072:{bg:'#0a0020',fg:'#8866ff'},262144:{bg:'#001800',fg:'#44ff66'},524288:{bg:'#001820',fg:'#00ffee'},
      1048576:{bg:'#180800',fg:'#ffbb44'},2097152:{bg:'#150010',fg:'#ff66ff'},4194304:{bg:'#001020',fg:'#44ffff'},8388608:{bg:'#1a1000',fg:'#ffee44'},
      16777216:{bg:'#e8f8ff',fg:'#001833'} } },
  { id:'abyss', icon:'✨', palette:{
      bg:'#000000', surface:'#050505', surface2:'#0a0a0a', border:'#1a1a1a',
      text:'#ffffff', muted:'#444444', accent:'#39ff14', accent2:'#ff00aa',
      danger:'#ff0044', success:'#39ff14', purple:'#cc00ff', cyan:'#00ffff' },
    tileMap:{
      0:{bg:'#080808',fg:'#1a1a1a'},2:{bg:'#001400',fg:'#39ff14'},4:{bg:'#001414',fg:'#00ffff'},8:{bg:'#140000',fg:'#ff3399'},
      16:{bg:'#141400',fg:'#ffff00'},32:{bg:'#140a00',fg:'#ff6600'},64:{bg:'#100020',fg:'#cc44ff'},128:{bg:'#001414',fg:'#00ffee'},
      256:{bg:'#200010',fg:'#ff2266'},512:{bg:'#002000',fg:'#44ff44'},1024:{bg:'#201000',fg:'#ffaa00'},2048:{bg:'#100030',fg:'#ff44ff'},
      4096:{bg:'#001818',fg:'#00ffff'},8192:{bg:'#180020',fg:'#aa44ff'},16384:{bg:'#001800',fg:'#44ff88'},32768:{bg:'#180005',fg:'#ff2255'},
      65536:{bg:'#001820',fg:'#00eeff'},131072:{bg:'#0a0020',fg:'#8844ff'},262144:{bg:'#001500',fg:'#44ff44'},524288:{bg:'#001820',fg:'#00ffdd'},
      1048576:{bg:'#180800',fg:'#ffaa00'},2097152:{bg:'#150010',fg:'#ff44ff'},4194304:{bg:'#001020',fg:'#44ffff'},8388608:{bg:'#1a1000',fg:'#ffdd44'},
      16777216:{bg:'#ffffff',fg:'#000000'} } },
];

// Numeric/structural config — text fields (.name/.desc/.title/.badge) are filled by applyLocale().
const ACHS = [
  { val:32,  icon:'🤿' }, { val:128, icon:'🐋' }, { val:256, icon:'🦈' },
  { val:1024,icon:'🔦' }, { val:2048,icon:'🏆' },
];
let TAUNTS = [''];

const LEVELS = [
  { id:1, size:3, target:32,   hard:false, initTile:null, envInterval:[30,20] },
  { id:2, size:4, target:512,  hard:false, initTile:32,   envInterval:[25,15] },
  { id:3, size:4, target:2048, hard:true,  initTile:512,  envInterval:[15,10] },
  { id:4, size:5, target:null, hard:true,  initTile:2048, envInterval:[10,8], endless:true },
];

const TALENTS = [
  { id:'double',  icon:'⚡',  mergeBonus:{every:5,multi:2} },
  { id:'golden',  icon:'✨',  goldenChance:0.20 },
  { id:'hoarder', icon:'🎒',  extraSlots:3, autoItemEvery:100 },
];

function _addSpecialTile(g,val){const e=[];for(let r=0;r<g.size;r++)for(let c=0;c<g.size;c++)if(!g.board[r][c])e.push([r,c]);if(!e.length)return;const[r,c]=e[Math.floor(Math.random()*e.length)];g.board[r][c]=val;}
function _applyFog(g,cnt){const p=[];for(let r=0;r<g.size;r++)for(let c=0;c<g.size;c++)if(g.board[r][c])p.push(r*g.size+c);p.sort(()=>Math.random()-0.5).slice(0,cnt).forEach(idx=>{g.specialTiles[idx]={type:'fog'};});}
function _clearFog(g){Object.keys(g.specialTiles).forEach(k=>{if(g.specialTiles[k].type==='fog')delete g.specialTiles[k];});}
function _lockRandom(g,steps){const f=[];for(let r=0;r<g.size;r++)for(let c=0;c<g.size;c++)if(g.board[r][c])f.push([r,c]);if(!f.length)return;const[r,c]=f[Math.floor(Math.random()*f.length)];g.specialTiles[r*g.size+c]={type:'locked',stepsLeft:steps};}

const ENVS = [
  { id:'normal', icon:'🌊', steps:0 },
  { id:'storm', icon:'🌪️', steps:20, onStep:(g,s)=>{if(s>0&&s%5===0)_addSpecialTile(g,1);} },
  { id:'fog', icon:'🦑', steps:20, onStart:(g)=>_applyFog(g,3), onEnd:(g)=>_clearFog(g) },
  { id:'overtime', icon:'⛓️', steps:15, onStep:(g,s)=>{if(s>0)_lockRandom(g,3);} },
  { id:'bonus', icon:'🎁', steps:10, scoreMulti:1.5 },
  { id:'gravity', icon:'🌀', steps:15, reverseGravity:true },
  { id:'fogenv', icon:'🌫️', steps:15, onStart:(g)=>_applyFog(g,4), onEnd:(g)=>_clearFog(g) },
  { id:'valx2', icon:'💥', steps:10, valueMult:2 },
  { id:'scorex2', icon:'💰', steps:10, scoreMulti:2 },
];

const RARITY_POOL=[...Array(50).fill('common'),...Array(40).fill('rare'),...Array(10).fill('epic')];
const ITEMS_DEF = {
  bomb:   {id:'bomb',   icon:'💣', rarity:'common'},
  shuffle:{id:'shuffle',icon:'🔀', rarity:'common'},
  undo:   {id:'undo',   icon:'⏪', rarity:'common'},
  double: {id:'double', icon:'⚡', rarity:'rare'},
  amplify:{id:'amplify',icon:'🔆', rarity:'rare'},
  gamble: {id:'gamble', icon:'🎲', rarity:'epic'},
  joker:  {id:'joker',  icon:'🃏', rarity:'epic'},
  yolo:   {id:'yolo',   icon:'🎰', rarity:'epic'},
  swap:   {id:'swap',   icon:'🔁', rarity:'rare'},
  halve:  {id:'halve',  icon:'✂️', rarity:'rare'},
  freeze: {id:'freeze', icon:'⏸️', rarity:'rare'},
};

// ── inject localized text onto the config objects above ──
function applyLocale() {
  const t = I18N.t;
  // achievements
  ACHS.forEach(a => { a.title = t(`achievements.${a.val}.title`); a.desc = t(`achievements.${a.val}.desc`); });
  // taunts
  const tt = I18N.get('taunts'); TAUNTS = Array.isArray(tt) && tt.length ? tt : [''];
  if (typeof G !== 'undefined' && G.taunt !== undefined) G.taunt = TAUNTS[0];
  // levels
  const lv = I18N.get('levels') || [];
  LEVELS.forEach((l, i) => { const s = lv[i] || {}; l.name=s.name; l.winTitle=s.winTitle; l.winSub=s.winSub; l.loseTitle=s.loseTitle; l.loseSub=s.loseSub; });
  // talents
  TALENTS.forEach(t2 => { t2.name=t(`talents.${t2.id}.name`); t2.desc=t(`talents.${t2.id}.desc`); t2.badge=t(`talents.${t2.id}.badge`); });
  // items
  Object.values(ITEMS_DEF).forEach(it => { it.name=t(`items.${it.id}.name`); it.desc=t(`items.${it.id}.desc`); it.rarityLabel=t(`rarity.${it.rarity}`); });
  // envs
  ENVS.forEach(e => { e.name=t(`envs.${e.id}.name`); e.desc=t(`envs.${e.id}.desc`); });
  // skins
  SKINS.forEach(s => { s.name = t(`skins.${s.id}.name`); s.labels = I18N.get(`skins.${s.id}.labels`) || {}; });
  // active skin labels → LABELS
  const act = SKINS.find(s => s.id === activeSkinId) || SKINS[0];
  LABELS = act.labels || {};
}
