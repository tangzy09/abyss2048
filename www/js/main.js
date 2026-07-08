// ════════════════════════════════════════
// main.js — boot, audio, input, dispatch
// ════════════════════════════════════════

// ── GameGlobal shim ──
const GameGlobal = { SW: 0, SH: 0, safeTop: 0, safeBottom: 0, sfxOn: true, bgmOn: false, bgmTrackName: '' };

// ── Web Audio helper ──
function createWebAudio(src) {
  const el = new Audio();
  el.src = src;
  return {
    get src(){return el.src;}, set src(v){el.src=v;}, set loop(v){el.loop=v;},
    get currentTime(){return el.currentTime;}, set currentTime(v){try{el.currentTime=v;}catch(e){}},
    play(){const p=el.play();if(p)p.catch(()=>{});}, pause(){el.pause();},
    stop(){el.pause();try{el.currentTime=0;}catch(e){}}, destroy(){el.pause();el.src='';},
  };
}

const BGM_TRACKS = ['audio/bgm.mp3', 'audio/bgm2.mp3'];
const TRACK_NAMES = ['Deep', '8-Bit'];
const Music = (() => {
  let sfxCtx=null,mergeCtx=null,bgmCtx=null,trackIdx=0;
  function getSfx(){if(!sfxCtx){sfxCtx=createWebAudio('audio/move.wav');}return sfxCtx;}
  function getMerge(){if(!mergeCtx){mergeCtx=createWebAudio('audio/merge.wav');}return mergeCtx;}
  function loadBgm(idx){if(bgmCtx){try{bgmCtx.stop();bgmCtx.destroy();}catch(e){}}bgmCtx=createWebAudio(BGM_TRACKS[idx]);bgmCtx.loop=true;if(GameGlobal.bgmOn)bgmCtx.play();}
  return {
    move(){if(!GameGlobal.sfxOn)return;try{const a=getSfx();a.currentTime=0;a.play();}catch(e){}},
    merge(){if(!GameGlobal.sfxOn)return;try{const a=getMerge();a.currentTime=0;a.play();}catch(e){}},
    toggleSfx(){GameGlobal.sfxOn=!GameGlobal.sfxOn;return GameGlobal.sfxOn;},
    toggleBgm(){GameGlobal.bgmOn=!GameGlobal.bgmOn;try{GameGlobal.bgmOn?bgmCtx.play():bgmCtx.pause();}catch(e){}return GameGlobal.bgmOn;},
    nextTrack(){trackIdx=(trackIdx+1)%BGM_TRACKS.length;GameGlobal.bgmTrackName=TRACK_NAMES[trackIdx];loadBgm(trackIdx);},
    start(){GameGlobal.bgmOn=true;GameGlobal.bgmTrackName=TRACK_NAMES[0];loadBgm(0);},
  };
})();

// ── Haptics: native Capacitor Haptics plugin, else Web Vibration API ──
// Gated on the sound toggle so the 🔊 button also silences vibration.
const Haptics = (() => {
  const plugin = () => Platform.Cap && Platform.Cap.Plugins && Platform.Cap.Plugins.Haptics;
  function impact(style, fallbackMs){
    const p = plugin();
    if (p && p.impact) { try { p.impact({ style }); return; } catch (e) {} }
    try { if (navigator.vibrate) navigator.vibrate(fallbackMs); } catch (e) {}
  }
  return {
    merge(){ if(GameGlobal.sfxOn) impact('LIGHT', 12); },
    lose(){ if(GameGlobal.sfxOn) impact('HEAVY', [40,30,60]); },
  };
})();

let floatTimer=null;
function showFloat(msg){G.floatMsg=msg;if(floatTimer)clearTimeout(floatTimer);floatTimer=setTimeout(()=>{G.floatMsg=null;floatTimer=null;renderAll();},1600);}
function showAch(a){G.ach=a;renderAll();setTimeout(()=>{G.ach=null;renderAll();},3000);}

function flushPending(){
  if(G.pendingFloat){showFloat(G.pendingFloat);G.pendingFloat=null;}
  if(G.pendingAch){showAch(G.pendingAch);G.pendingAch=null;}
}

// Interstitial fires only when advancing INTO level 3+ (levelIdx>=2):
//   过第一关(进第二关) 不弹；过第二关及以后(进第三关起) 才弹。
// 抽装备一开始已看激励视频，选完后不再弹插屏。
function maybeInterstitial(prevLevel){
  if (G.levelIdx > prevLevel && G.levelIdx >= 2) { try { Ads.showInterstitial(); } catch (e) {} }
}

function dispatch(action,data){
  switch(action){
    case 'START_GAME': showTalentSelect(); break;
    case 'OPEN_INFO': G.infoOpen=true;G.infoTab='talent'; break;
    case 'CLOSE_INFO': G.infoOpen=false; break;
    case 'PRIVACY_OPTIONS': {
      (async () => {
        const ok = await Ads.showPrivacyOptions();
        if (!ok) { G.pendingFloat = I18N.t('info.privacyNative'); flushPending(); renderAll(); }
      })();
      break;
    }
    case 'SET_INFO_TAB': G.infoTab=data.tab; break;
    case 'SELECT_TALENT': selectTalent(data.talent);if(!GameGlobal.bgmOn)try{Music.start();}catch(e){} break;
    case 'USE_ITEM':{const item=G.items[data.slotIdx];if(!item||G.gameOver)break;const handlers={bomb:()=>activateBomb(data.slotIdx),shuffle:()=>useShuffle(data.slotIdx),undo:()=>useUndo(data.slotIdx),double:()=>useDouble(data.slotIdx),freeze:()=>useFreeze(data.slotIdx),joker:()=>useJoker(data.slotIdx),amplify:()=>activateMode('amplify',data.slotIdx),gamble:()=>activateMode('gamble',data.slotIdx),yolo:()=>activateMode('yolo',data.slotIdx),swap:()=>activateMode('swap',data.slotIdx),halve:()=>activateMode('halve',data.slotIdx)};(handlers[item.id]||(()=>{}))();break;}
    case 'TILE_CLICK': handleTileClick(data.r,data.c);Music.move(); break;
    case 'WIN_NEXT': showRewardThenNext(); break;
    case 'LOSE_SHARE_CLEAR': {
      (async () => {
        const rewarded = await Ads.showRewarded();
        if (rewarded) clearSmallTiles();
        else G.pendingFloat = I18N.t('float.adNoReward');
        flushPending(); renderAll(); saveGame();
      })();
      break;
    }
    case 'SHARE_FOR_ITEMS': {
      (async () => {
        const rewarded = await Ads.showRewarded();
        if (rewarded) triggerShareReward();
        else G.pendingFloat = I18N.t('float.adNoReward');
        flushPending(); renderAll(); saveGame();
      })();
      break;
    }
    case 'CONFIRM_START': confirmStart(); break;
    case 'LOSE_RETRY': startLevel(); break;
    case 'NEW_GAME': initGame(0); break;
    case 'REWARD_PICK': { const lv0=G.levelIdx; pickRewardItem(data.item); maybeInterstitial(lv0); break; }
    case 'REWARD_SKIP': { const lv0=G.levelIdx; skipReward(); maybeInterstitial(lv0); break; }
    case 'TOGGLE_SFX': Music.toggleSfx(); try{Platform.storage.set('dm_sfx',GameGlobal.sfxOn?'1':'0');}catch(e){} break;
    case 'TOGGLE_BGM': Music.toggleBgm(); break;
    case 'NEXT_TRACK': Music.nextTrack(); break;
    default: break;
  }
  flushPending();
  renderAll();
  saveGame();
}

// ── keyboard (desktop) ──
document.addEventListener('keydown', e => {
  const dirs={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down',A:'left',D:'right',W:'up',S:'down'};
  const dir=dirs[e.key];
  if(dir&&G.phase==='PLAYING'&&!G.bombMode&&!G.itemMode){
    e.preventDefault();move(dir);Music.move();flushPending();if(G.anim)startAnimLoop();else renderAll();saveGame();
  }
});

// ── touch / mouse ──
function bindEvents(){
  const cv=document.getElementById('game-canvas');
  let sx=0,sy=0,st=0;
  function start(x,y){sx=x;sy=y;st=Date.now();}
  function end(x,y){
    const dx=x-sx,dy=y-sy,dist=Math.sqrt(dx*dx+dy*dy),dt=Date.now()-st;
    if(dist<10&&dt<500){const hit=hitTest(x,y);if(hit)dispatch(hit.action,hit.data);return;}
    if(G.phase!=='PLAYING'||G.bombMode||G.itemMode)return;if(dist<28)return;
    let dir;if(Math.abs(dx)>Math.abs(dy))dir=dx>0?'right':'left';else dir=dy>0?'down':'up';
    move(dir);Music.move();flushPending();if(G.anim)startAnimLoop();else renderAll();saveGame();
  }
  cv.addEventListener('touchstart',e=>{e.preventDefault();const t=e.touches[0];start(t.clientX,t.clientY);},{passive:false});
  cv.addEventListener('touchend',e=>{e.preventDefault();const t=e.changedTouches[0];end(t.clientX,t.clientY);},{passive:false});
  cv.addEventListener('mousedown',e=>start(e.clientX,e.clientY));
  cv.addEventListener('mouseup',e=>end(e.clientX,e.clientY));
}

window.addEventListener('resize', () => { initCanvas(); renderAll(); });

// ── boot ──
async function boot(){
  await Platform.hydrate(['dm_lang','dm_skin','dm_best','dm_rewards','dm_save','dm_sfx']);
  GameGlobal.sfxOn = Platform.storage.get('dm_sfx') !== '0'; // persisted sound toggle (default on)
  Portal.boot();   // load the game-portal ad SDK early (no-op on native / plain web)
  await Ads.init();

  // re-render whenever language changes
  I18N.onChange(() => { applyLocale(); renderControls(); renderAll(); });

  await I18N.setLang(I18N.detect()); // loads dict + fires onChange (applyLocale)

  initCanvas();
  initGame(0);

  // restore saved skin (all skins free)
  let skin = Platform.storage.get('dm_skin') || 'deep';
  if (!SKINS.find(s => s.id === skin)) skin = 'deep';
  applySkin(skin);

  // resume an in-progress run if one was saved (drops the player straight back into PLAYING)
  loadGame();

  bindEvents();
  renderControls();
  renderAll();

  // Capacitor: hide splash once ready
  try { Platform.Cap?.Plugins?.SplashScreen?.hide(); } catch (e) {}
}

boot();
