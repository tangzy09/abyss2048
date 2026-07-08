// ════════════════════════════════════════
// render.js — canvas renderer. Layout identical to the original;
// all literal text now flows through I18N.t().
// ════════════════════════════════════════
let canvas, ctx;
let hitAreas = [];
const T = (k, p) => I18N.t(k, p);

function initCanvas() {
  canvas = document.getElementById('game-canvas');
  const dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  GameGlobal.SW = W; GameGlobal.SH = H;
  GameGlobal.safeTop = 44; GameGlobal.safeBottom = 0;
}
function hitTest(tx, ty) {
  for (let i = hitAreas.length - 1; i >= 0; i--) {
    const h = hitAreas[i];
    if (tx >= h.x && tx <= h.x + h.w && ty >= h.y && ty <= h.y + h.h) return h;
  }
  return null;
}
function addHit(x,y,w,h,action,data){hitAreas.push({x,y,w,h,action,data:data||{}});}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();}
function fillRR(x,y,w,h,r,color){ctx.fillStyle=color;roundRect(x,y,w,h,r);ctx.fill();}
function strokeRR(x,y,w,h,r,color,lw=1){ctx.strokeStyle=color;ctx.lineWidth=lw;roundRect(x,y,w,h,r);ctx.stroke();}
function clean(s){return s?String(s).replace(/️/g,''):'';}
function txt(text,x,y,color,font){ctx.fillStyle=color;ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(clean(text),x,y);}
function txtL(text,x,y,color,font){ctx.fillStyle=color;ctx.font=font;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(clean(text),x,y);}
function txtR(text,x,y,color,font){ctx.fillStyle=color;ctx.font=font;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(clean(text),x,y);}
// wrap text into ≤maxLines lines fitting maxW (px); breaks at spaces when possible,
// else char-by-char (CJK); ellipsizes the last line if it still overflows. Set ctx.font first.
function wrapLines(text,maxW,maxLines){const s=clean(String(text));const lines=[];let cur='';
  for(let i=0;i<s.length;i++){const ch=s[i];
    if(ctx.measureText(cur+ch).width<=maxW){cur+=ch;continue;}
    if(lines.length>=maxLines-1){let rest=cur;while(rest.length>1&&ctx.measureText(rest+'…').width>maxW)rest=rest.slice(0,-1);lines.push(rest+'…');return lines;}
    const br=cur.lastIndexOf(' ');
    if(br>0){lines.push(cur.slice(0,br));cur=cur.slice(br+1)+ch;}else{lines.push(cur);cur=ch;}}
  if(cur)lines.push(cur);return lines;}
// draw ≤2 lines left-aligned, vertically centered around cy
function txtLWrap(text,x,cy,maxW,color,font,lh){ctx.font=font;const ls=wrapLines(text,maxW,2);const y0=cy-(ls.length-1)*lh/2;ls.forEach((ln,i)=>txtL(ln,x,y0+i*lh,color,font));}
// ── creature tile art: preload assets/creatures/<skin>/tile-<v>.webp, keyed by value ──
const CreatureArt = (() => {
  const imgs = {};                 // value -> loaded Image
  let loadedSkin = null;
  const VALUES = [1,2,4,8,16,32,64,128,256,512,1024,2048,4096,8192,16384,32768,65536,131072,262144];
  function load(skinId) {
    if (loadedSkin === skinId) return;
    loadedSkin = skinId;
    for (const k in imgs) delete imgs[k];
    VALUES.forEach(v => {
      const im = new Image();
      im.onload = () => { if (loadedSkin === skinId) { imgs[v] = im; if (typeof renderAll === 'function') { try { renderAll(); } catch (e) {} } } };
      im.onerror = () => {};        // no art for this skin/value → number fallback
      im.src = `assets/creatures/${skinId}/tile-${v}.webp`;
    });
  }
  return { load, get(v){ return imgs[v]; } };
})();
// Draw creature image filling the tile + a small value badge (top-left). Returns false if no art.
function drawCreatureTile(tx,ty,ts,v,style){
  const im = CreatureArt.get(v);
  if (!im) return false;
  const pad = ts*0.04, size = ts - pad*2;
  ctx.drawImage(im, tx+pad, ty+pad, size, size);
  const disp = v>=10000 ? `${(v/1000).toFixed(1).replace(/\.0$/,'')}k` : String(v);
  const fs = Math.max(9, Math.round(ts*0.17));
  ctx.font = `bold ${fs}px sans-serif`;
  const bw = ctx.measureText(disp).width + 8, bh = fs + 5, bx = tx+4, by = ty+4;
  fillRR(bx,by,bw,bh,bh/2,style.fg);
  txt(disp, bx+bw/2, by+bh/2+0.5, style.bg, `bold ${fs}px sans-serif`);
  return true;
}
// ── item gear icons: preload assets/items/<id>.webp; falls back to emoji ──
const ItemArt = (() => {
  const imgs = {}; let started = false;
  const IDS = ['bomb','shuffle','undo','double','amplify','gamble','joker','yolo','swap','halve','freeze'];
  function load() { if (started) return; started = true;
    IDS.forEach(id => { const im = new Image();
      im.onload  = () => { imgs[id] = im; if (typeof renderAll==='function') { try { renderAll(); } catch(e){} } };
      im.onerror = () => {};
      im.src = `assets/items/${id}.webp`; }); }
  return { load, get(id){ return imgs[id]; } };
})();
// draw an item icon centered on (cx,cy): image if loaded, else emoji fallback.
function drawItemIcon(id, emoji, cx, cy, size, emojiColor, emojiFont) {
  const im = ItemArt.get(id);
  if (im) ctx.drawImage(im, cx - size/2, cy - size/2, size, size);
  else txt(emoji, cx, cy, emojiColor, emojiFont);
}
// ── generic art loader for talents / envs / scenes (mirror of ItemArt) ──
function makeArt(dir, ids){
  const imgs = {}; let started = false;
  return { load(){ if (started) return; started = true;
    ids.forEach(id => { const im = new Image();
      im.onload  = () => { imgs[id] = im; if (typeof renderAll==='function') { try { renderAll(); } catch(e){} } };
      im.onerror = () => {};
      im.src = `assets/${dir}/${id}.webp`; }); },
    get(id){ return imgs[id]; } };
}
const TalentArt = makeArt('talents', ['double','golden','hoarder']);
const EnvArt    = makeArt('envs', ['normal','storm','fog','overtime','gravity','fogenv','bonus','valx2','scorex2']);
const SceneArt  = makeArt('scenes', ['deep','coral','polar','abyss']);
function drawTalentIcon(id, emoji, cx, cy, size, emojiColor, emojiFont){
  const im = TalentArt.get(id);
  if (im) ctx.drawImage(im, cx - size/2, cy - size/2, size, size);
  else txt(emoji, cx, cy, emojiColor, emojiFont);
}
function drawEnvIcon(id, emoji, cx, cy, size, emojiColor, emojiFont){
  const im = EnvArt.get(id);
  if (im) ctx.drawImage(im, cx - size/2, cy - size/2, size, size);
  else txt(emoji, cx, cy, emojiColor, emojiFont);
}
function layout(){
  const SW=GameGlobal.SW,SH=GameGlobal.SH,PAD=10;
  const topSafe=(GameGlobal.safeTop||0)+PAD,botSafe=(GameGlobal.safeBottom||0)+PAD;
  const headerH=58,energyH=22,envH=48;
  const hasTalent=G.phase==='PLAYING'&&G.talents.length>0;
  const talentH=hasTalent?30:0;
  const itemH=56,tauntH=32,btnH=44;
  const topH=topSafe+headerH+4+energyH+4+envH+4+talentH+(hasTalent?4:0)+itemH+6;
  const botH=tauntH+4+btnH+botSafe;
  const boardAvail=Math.min(SW-PAD*2,SH-topH-botH);
  const boardSize=Math.max(boardAvail,160);
  const boardX=PAD+((SW-PAD*2)-boardSize)/2;
  return{PAD,SW,SH,headerY:topSafe,headerH,energyY:topSafe+headerH+4,energyH,envY:topSafe+headerH+4+energyH+4,envH,talentY:topSafe+headerH+4+energyH+4+envH+4,talentH,itemY:topSafe+headerH+4+energyH+4+envH+4+talentH+(hasTalent?4:0),itemH,boardX,boardY:topH,boardSize,tauntY:SH-botSafe-btnH-4-tauntH,tauntH,btnY:SH-botSafe-btnH,btnH};
}
function drawHeader(L){const{PAD,SW,headerY:y,headerH:h}=L;fillRR(PAD,y,SW-PAD*2,h,16,C.surface);strokeRR(PAD,y,SW-PAD*2,h,16,C.border);const boxes=[{label:T('ui.score'),val:G.score,color:C.accent},{label:T('ui.steps'),val:G.stepCount,color:C.cyan},{label:T('ui.best'),val:G.best,color:C.accent2}];const bw=(SW-PAD*2-20)/3;boxes.forEach((b,i)=>{const bx=PAD+8+i*(bw+2);const cy=y+h/2;txt(b.label,bx+bw/2,cy-10,C.muted,'10px sans-serif');txt(String(b.val),bx+bw/2,cy+10,b.color,'bold 20px sans-serif');});}
function drawEnergyRow(L){const{PAD,SW,energyY:y,energyH:h}=L;const pct=Math.min(1,(G.energyScore||0)/1000);
  // lay out label + bar + count dynamically so long-language labels (Energie/Энергия) don't get covered by the bar
  const lbl=T('ui.energy');ctx.font='11px sans-serif';const lblW=ctx.measureText(clean(lbl)).width;
  const rt=`${Math.floor(G.energyScore||0)}/1000`;ctx.font='10px sans-serif';const rW=ctx.measureText(rt).width;
  const trackX=PAD+lblW+10,trackW=Math.max(20,(SW-PAD-rW-8)-trackX);
  txtL(lbl,PAD,y+h/2,C.muted,'11px sans-serif');fillRR(trackX,y+h/2-3,trackW,6,3,C.border);if(pct>0)fillRR(trackX,y+h/2-3,trackW*pct,6,3,C.accent);txtR(rt,SW-PAD,y+h/2,C.muted,'10px sans-serif');}
function drawEnvBar(L){const{PAD,SW,envY:y,envH:h}=L;const env=G.env||ENVS[0];const envColors={normal:'#f2faff',storm:'#e2edf7',fog:'#e9eef7',overtime:'#f9e8ee',gravity:'#e7eff8',fogenv:'#ecf1f9',bonus:'#e6f7ee',valx2:'#fff0e2',scorex2:'#fff4d8'};fillRR(PAD,y,SW-PAD*2,h,16,envColors[env.id]||C.surface);strokeRR(PAD,y,SW-PAD*2,h,16,C.border);drawEnvIcon(env.id,env.icon||'🌊',PAD+20,y+h/2,Math.min(h-6,30),C.text,'22px sans-serif');txtL(env.name,PAD+38,y+14,C.text,'bold 13px sans-serif');txtL(env.desc,PAD+38,y+30,C.muted,'10px sans-serif');if(env.steps>0&&G.phase==='PLAYING'){const left=Math.max(0,env.steps-(G.stepCount-G.envStartStep));const isGood=['bonus','valx2','scorex2'].includes(env.id);txt(T('ui.stepsLeft',{n:left}),SW-PAD-16,y+h/2,isGood?C.success:C.danger,'bold 16px sans-serif');}}
function drawTalentBar(L){if(!L.talentH)return;const{PAD,talentY:y,talentH:h}=L;let x=PAD;G.talents.forEach(t=>{const lbl=`${t.icon} ${t.name}`;ctx.font='11px sans-serif';const tw=ctx.measureText(lbl).width+20;fillRR(x,y,tw,h,14,'rgba(102,85,255,0.1)');strokeRR(x,y,tw,h,14,C.purple);txt(lbl,x+tw/2,y+h/2,C.purple,'11px sans-serif');x+=tw+6;});}
function drawItemBar(L){const{PAD,SW,itemY:y,itemH:h}=L;txtL(T('ui.equip'),PAD,y+h/2,C.muted,'10px sans-serif');const slots=G.itemSlots||4;const slotW=52,gap=6;const startX=PAD+32;const rarityColors={common:C.success,rare:C.purple,epic:C.accent};for(let i=0;i<slots;i++){const sx=startX+i*(slotW+gap);const item=G.items[i];const isActive=(G.bombMode&&G.bombSlot===i)||G.itemMode?.slotIdx===i;const border=isActive?C.accent:(item?(rarityColors[item.rarity]||C.border):C.border);fillRR(sx,y+2,slotW,h-4,14,C.surface);strokeRR(sx,y+2,slotW,h-4,14,border,isActive?2:1);if(item){drawItemIcon(item.id,item.icon,sx+slotW/2,y+18,34,C.text,'22px sans-serif');txt(item.name,sx+slotW/2,y+h-12,C.muted,'7px sans-serif');}else{txt(T('ui.empty'),sx+slotW/2,y+h/2,C.border,'16px sans-serif');}addHit(sx,y+2,slotW,h-4,'USE_ITEM',{slotIdx:i});}}
function drawBoard(L){CreatureArt.load(typeof activeSkinId!=='undefined'?activeSkinId:'deep');const{boardX:bx,boardY:by,boardSize:bs}=L;const s=G.size,PAD2=8,GAP=6;const ts=(bs-PAD2*2-GAP*(s-1))/s;const tr=Math.min(18,ts*0.28);fillRR(bx,by,bs,bs,20,C.surface);strokeRR(bx,by,bs,bs,20,C.border);for(let r=0;r<s;r++){for(let c=0;c<s;c++){const tx=bx+PAD2+c*(ts+GAP);const ty=by+PAD2+r*(ts+GAP);const v=G.board[r][c];const idx=r*s+c;const st=G.specialTiles[idx];const isFog=st?.type==='fog'&&v!==0;const isLk=st?.type==='locked';let style=tileStyle(isFog?null:v);if(isFog)style={bg:'#dbe8f2',fg:'#9cc0d6'};fillRR(tx,ty,ts,ts,tr,style.bg);if(isLk)ctx.globalAlpha=0.4;let hlColor=null;if(G.bombMode&&v&&v!==0)hlColor=C.danger;if(G.itemMode?.type==='amplify'&&v>0&&v<=256)hlColor=C.success;if(G.itemMode?.type==='gamble'&&v>0&&v<=1024)hlColor=C.accent;if(G.itemMode?.type==='yolo'&&v&&v>0)hlColor=C.purple;if(G.itemMode?.type==='halve'&&v>=4)hlColor=C.accent;if(G.itemMode?.type==='swap'){const isFirst=G.swapState?.first?.r===r&&G.swapState?.first?.c===c;if(isFirst)hlColor=C.success;else if(v!==0)hlColor=C.purple;}if(hlColor){ctx.globalAlpha=0.9;strokeRR(tx,ty,ts,ts,tr,hlColor,2);ctx.globalAlpha=1;}if(v){if(isFog||v===-1||!drawCreatureTile(tx,ty,ts,v,style)){const disp=isFog?'？':(v===-1?T('ui.ghost'):(v>=10000?`${(v/1000).toFixed(1).replace(/\.0$/,'')}k`:String(v)));const digits=disp.length;const fs=digits<=2?ts*0.42:digits===3?ts*0.33:digits===4?ts*0.26:ts*0.2;txt(disp,tx+ts/2,ty+ts/2-(LABELS[v]?6:0),style.fg,`bold ${Math.round(fs)}px sans-serif`);if(!isFog&&LABELS[v])txt(LABELS[v],tx+ts/2,ty+ts-8,style.fg+'dd',`${Math.max(7,Math.round(ts*0.13))}px sans-serif`);}}ctx.globalAlpha=1;if(G.bombMode||G.itemMode)addHit(tx,ty,ts,ts,'TILE_CLICK',{r,c});}}}
// Draw a single tile (bg + value + label) centered, optionally scaled — used by the move animation.
function drawTileAt(tx,ty,ts,tr,v,scale,isFog){
  scale=scale||1;const style=isFog?{bg:'#dbe8f2',fg:'#9cc0d6'}:tileStyle(v);
  ctx.save();
  if(scale!==1){const cx=tx+ts/2,cy=ty+ts/2;ctx.translate(cx,cy);ctx.scale(scale,scale);ctx.translate(-cx,-cy);}
  fillRR(tx,ty,ts,ts,tr,style.bg);
  if(v){
    if(isFog||v===-1||!drawCreatureTile(tx,ty,ts,v,style)){
    const disp=isFog?'？':(v===-1?T('ui.ghost'):(v>=10000?`${(v/1000).toFixed(1).replace(/\.0$/,'')}k`:String(v)));
    const digits=disp.length;const fs=digits<=2?ts*0.42:digits===3?ts*0.33:digits===4?ts*0.26:ts*0.2;
    txt(disp,tx+ts/2,ty+ts/2-(!isFog&&LABELS[v]?6:0),style.fg,`bold ${Math.round(fs)}px sans-serif`);
    if(!isFog&&LABELS[v])txt(LABELS[v],tx+ts/2,ty+ts-8,style.fg+'dd',`${Math.max(7,Math.round(ts*0.13))}px sans-serif`);
    }
  }
  ctx.restore();
}
// Animated board: phase 1 slides tiles from→to; phase 2 pops merged tiles + scales in the new tile.
function drawBoardAnim(L,t){
  CreatureArt.load(typeof activeSkinId!=='undefined'?activeSkinId:'deep');
  const{boardX:bx,boardY:by,boardSize:bs}=L;const s=G.size,PAD2=8,GAP=6;
  const ts=(bs-PAD2*2-GAP*(s-1))/s;const tr=Math.min(18,ts*0.28);
  fillRR(bx,by,bs,bs,20,C.surface);strokeRR(bx,by,bs,bs,20,C.border);
  const cellXY=(r,c)=>[bx+PAD2+c*(ts+GAP),by+PAD2+r*(ts+GAP)];
  for(let r=0;r<s;r++)for(let c=0;c<s;c++){const[x,y]=cellXY(r,c);fillRR(x,y,ts,ts,tr,tileStyle(0).bg);}
  const A=G.anim,SLIDE=0.6;
  const fogAt=(r,c,val)=>G.specialTiles[r*s+c]?.type==='fog'&&val!==0;
  if(t<SLIDE){
    const p=t/SLIDE,e=1-Math.pow(1-p,3); // easeOutCubic
    Object.keys(G.specialTiles).forEach(k=>{if(G.specialTiles[k].type==='locked'){const idx=+k,r=Math.floor(idx/s),c=idx%s;if(G.board[r][c]){const[x,y]=cellXY(r,c);drawTileAt(x,y,ts,tr,G.board[r][c],1);}}});
    A.slides.forEach(sl=>{const[fx,fy]=cellXY(sl.fromR,sl.fromC),[gx,gy]=cellXY(sl.toR,sl.toC);drawTileAt(fx+(gx-fx)*e,fy+(gy-fy)*e,ts,tr,sl.value,1,fogAt(sl.toR,sl.toC,sl.value));});
  }else{
    const pop=(t-SLIDE)/(1-SLIDE);const bounce=1+0.14*Math.sin(Math.min(1,pop)*Math.PI);
    for(let r=0;r<s;r++)for(let c=0;c<s;c++){const v=G.board[r][c];if(!v)continue;const[x,y]=cellXY(r,c);
      let sc=1;if(A.mergedCells.has(r+','+c))sc=bounce;if(A.spawn&&A.spawn[0]===r&&A.spawn[1]===c)sc=Math.min(1,pop*1.3);
      drawTileAt(x,y,ts,tr,v,sc,fogAt(r,c,v));}
  }
}
function drawTaunt(L){const{PAD,SW,tauntY:y,tauntH:h}=L;fillRR(PAD,y,SW-PAD*2,h,8,C.surface);ctx.fillStyle=C.border;ctx.fillRect(PAD,y,3,h);txt(G.taunt||'',PAD+(SW-PAD*2)/2,y+h/2,C.text,'12px sans-serif');}
function drawButtons(L){
  const{PAD,SW,btnY:y,btnH:h}=L;
  const btns=[
    {label:T('ui.newGame'),action:'NEW_GAME',flex:2},
    {label:GameGlobal.sfxOn?'🔊':'🔇',action:'TOGGLE_SFX',flex:0.65},
    {label:GameGlobal.bgmOn?'🎵':'🔕',action:'TOGGLE_BGM',flex:0.65},
    {label:`⏭ ${GameGlobal.bgmTrackName||''}`,action:'NEXT_TRACK',flex:1.1},
    {label:T('ui.adGear'),action:'SHARE_FOR_ITEMS',flex:2.0,color:C.cyan},
  ];
  const totalFlex=btns.reduce((s,b)=>s+b.flex,0);const totalGap=6*(btns.length-1);const totalW=SW-PAD*2;let bx=PAD;
  btns.forEach(b=>{const bw=(totalW-totalGap)*(b.flex/totalFlex);const col=b.color||C.text;fillRR(bx,y,bw,h,14,C.surface);strokeRR(bx,y,bw,h,14,b.color?b.color:C.border);txt(b.label,bx+bw/2,y+h/2,col,'12px sans-serif');addHit(bx,y,bw,h,b.action,{});bx+=bw+6;});
}
function drawDim(){ctx.fillStyle=(typeof C!=='undefined'&&C.bg2)?'rgba(207,235,255,0.86)':'rgba(0,0,0,0.75)';ctx.fillRect(0,0,GameGlobal.SW,GameGlobal.SH);}
function drawTalentOverlay(L){drawDim();const SW=GameGlobal.SW,SH=GameGlobal.SH;const lv=LEVELS[G.levelIdx];txt(T('talentSelect.title'),SW/2,80,C.purple,'bold 18px sans-serif');txt(T('talentSelect.level',{name:lv.name}),SW/2,108,C.muted,'12px sans-serif');const cardW=SW-40,cardH=80;const startY=136;TALENTS.forEach((t,i)=>{const cy=startY+i*(cardH+10);fillRR(20,cy,cardW,cardH,12,C.surface2);strokeRR(20,cy,cardW,cardH,12,C.border);drawTalentIcon(t.id,t.icon,20+34,cy+cardH/2,52,C.text,'28px sans-serif');txtL(t.name,20+58,cy+22,C.text,'bold 14px sans-serif');txtLWrap(t.desc,20+58,cy+50,cardW-140,C.muted,'11px sans-serif',14);const badgeW=44;fillRR(20+cardW-badgeW-10,cy+cardH/2-10,badgeW,20,10,'rgba(102,85,255,0.2)');txt(t.badge,20+cardW-badgeW/2-10,cy+cardH/2,C.purple,'10px sans-serif');addHit(20,cy,cardW,cardH,'SELECT_TALENT',{talent:t});});const skipY=startY+TALENTS.length*(cardH+10);fillRR(20,skipY,cardW,42,10,C.surface);strokeRR(20,skipY,cardW,42,10,C.border);txt(T('talentSelect.skip'),SW/2,skipY+21,C.muted,'13px sans-serif');addHit(20,skipY,cardW,42,'SELECT_TALENT',{talent:null});}
function getFragRewardText(levelIdx){
  const FRAG_RARITY=['common','rare','epic'];
  const FRAG_LABELS={common:T('frag.common'),rare:T('frag.rare'),epic:T('frag.epic')};
  if(levelIdx>=FRAG_RARITY.length)return null;
  const rarity=FRAG_RARITY[levelIdx];
  try{
    const today=new Date().toISOString().slice(0,10);
    const saved=JSON.parse(Platform.storage.get('dm_rewards')||'{}');
    if(saved.date===today&&(saved.levels||[]).includes(levelIdx))
      return{text:T('frag.claimed'),color:C.muted,claimed:true};
  }catch(e){}
  return{text:T('frag.available',{label:FRAG_LABELS[rarity]}),color:C.success,claimed:false};
}
function drawWinOverlay(){drawDim();const SW=GameGlobal.SW,SH=GameGlobal.SH;const lv=LEVELS[G.levelIdx];txt('🏆',SW/2,SH/2-110,C.text,'44px sans-serif');txt(lv.winTitle||T('win.title'),SW/2,SH/2-62,C.success,'bold 22px sans-serif');txt(lv.winSub||'',SW/2,SH/2-34,C.muted,'12px sans-serif');const fragInfo=getFragRewardText(G.levelIdx);if(fragInfo){const bw=220,bh=32,bx=SW/2-bw/2,by=SH/2-16;fillRR(bx,by,bw,bh,8,fragInfo.claimed?'rgba(20,20,20,0.7)':'rgba(0,80,40,0.5)');if(!fragInfo.claimed)strokeRR(bx,by,bw,bh,8,C.success);txt(fragInfo.text,SW/2,by+bh/2,fragInfo.color,'bold 12px sans-serif');}const isLast=lv.endless||G.levelIdx>=LEVELS.length-1;fillRR(SW/2-90,SH/2+24,180,44,10,C.accent);txt(isLast?T('win.continue'):T('win.next'),SW/2,SH/2+46,'#000','bold 14px sans-serif');addHit(SW/2-90,SH/2+24,180,44,'WIN_NEXT',{});const btnW=180;fillRR(SW/2-90,SH/2+76,btnW,36,10,C.surface2);strokeRR(SW/2-90,SH/2+76,btnW,36,10,C.border);txt(T('win.restart'),SW/2,SH/2+94,C.text,'12px sans-serif');addHit(SW/2-90,SH/2+76,btnW,36,'NEW_GAME',{});}
function drawLoseOverlay(){drawDim();const SW=GameGlobal.SW,SH=GameGlobal.SH;const lv=LEVELS[G.levelIdx];txt('😭',SW/2,SH/2-130,C.text,'44px sans-serif');txt(lv.loseTitle||T('lose.title'),SW/2,SH/2-82,C.danger,'bold 22px sans-serif');txt(lv.loseSub||'',SW/2,SH/2-54,C.muted,'12px sans-serif');const clearCount=G.board.flat().filter(v=>v>0&&v<=4).length;fillRR(SW/2-90,SH/2-28,180,40,10,clearCount>0?C.purple:C.border);txt(clearCount>0?T('lose.clear',{n:clearCount}):T('lose.noClear'),SW/2,SH/2-8,C.text,'bold 13px sans-serif');if(clearCount>0)addHit(SW/2-90,SH/2-28,180,40,'LOSE_SHARE_CLEAR',{});fillRR(SW/2-90,SH/2+20,180,40,10,C.danger);txt(T('lose.retry'),SW/2,SH/2+40,C.text,'bold 13px sans-serif');addHit(SW/2-90,SH/2+20,180,40,'LOSE_RETRY',{});fillRR(SW/2-90,SH/2+68,180,36,10,C.surface2);strokeRR(SW/2-90,SH/2+68,180,36,10,C.border);txt(T('lose.restart'),SW/2,SH/2+86,C.text,'12px sans-serif');addHit(SW/2-90,SH/2+68,180,36,'NEW_GAME',{});}
function drawLevelIntro(){drawDim();const SW=GameGlobal.SW,SH=GameGlobal.SH;const lv=LEVELS[G.levelIdx];const isTutorial=G.levelIdx===0;if(isTutorial){txt(T('levelIntro.tutorialTitle'),SW/2,72,C.cyan,'bold 20px sans-serif');const steps=I18N.get('levelIntro.tutorial')||[];steps.forEach((s,i)=>{const y=108+i*54;fillRR(20,y,SW-40,44,10,C.surface);const icon=s.slice(0,2);const rest=s.slice(2).trim();txt(clean(icon),52,y+22,C.text,'18px sans-serif');txtL(rest,76,y+22,C.text,'13px sans-serif');});}else{txt(T('levelIntro.levelN',{n:lv.id}),SW/2,72,C.purple,'bold 13px sans-serif');txt(lv.name,SW/2,102,C.accent,'bold 22px sans-serif');fillRR(20,126,SW-40,1,0,C.border);const rows=[{label:T('levelIntro.targetLabel'),value:lv.target?T('levelIntro.targetVal',{val:lv.target,name:LABELS[lv.target]||lv.target}):T('levelIntro.targetEndless'),color:C.success},{label:T('levelIntro.sizeLabel'),value:`${lv.size} × ${lv.size}`,color:C.text}];if(lv.initTile)rows.push({label:T('levelIntro.initLabel'),value:T('levelIntro.initVal',{val:lv.initTile,name:LABELS[lv.initTile]||lv.initTile}),color:C.cyan});if(lv.hard)rows.push({label:T('levelIntro.diffLabel'),value:T('levelIntro.diffHard'),color:C.danger});rows.forEach((r,i)=>{const y=148+i*64;fillRR(20,y,SW-40,54,10,C.surface);txt(r.label,SW/2,y+16,C.muted,'11px sans-serif');txt(r.value,SW/2,y+38,r.color,'bold 13px sans-serif');});}const btnY=SH-100;fillRR(SW/2-90,btnY,180,46,12,isTutorial?C.cyan:C.success);txt(isTutorial?T('levelIntro.tutorialStart'):T('levelIntro.start'),SW/2,btnY+23,'#fff','bold 15px sans-serif');addHit(SW/2-90,btnY,180,46,'CONFIRM_START',{});}
function drawRewardOverlay(){drawDim();const SW=GameGlobal.SW,SH=GameGlobal.SH;const isEnergy=G.rewardCtx==='energy';const isHoarder=G.rewardCtx==='hoarder';const isShare=G.rewardCtx==='share';const titleY=100;const title=isEnergy?T('reward.titleEnergy'):isHoarder?T('reward.titleHoarder'):isShare?T('reward.titleShare'):T('reward.titleWin');const sub=isEnergy?T('reward.subEnergy'):isHoarder?T('reward.subHoarder'):isShare?T('reward.subShare',{n:G.sharePicksLeft}):T('reward.subWin');txt(title,SW/2,titleY,isShare?C.cyan:C.success,'bold 22px sans-serif');txt(sub,SW/2,titleY+26,C.muted,'12px sans-serif');const cardW=SW-40,cardH=76;const startY=titleY+56;const items=G.rewardItems||[];const rarityColors={common:C.success,rare:C.purple,epic:C.accent};items.forEach((item,i)=>{const cy=startY+i*(cardH+10);fillRR(20,cy,cardW,cardH,12,C.surface);strokeRR(20,cy,cardW,cardH,12,rarityColors[item.rarity]||C.border);drawItemIcon(item.id,item.icon,20+30,cy+cardH/2,40,C.text,'26px sans-serif');txtL(item.name,20+54,cy+20,C.text,'bold 13px sans-serif');const rc=rarityColors[item.rarity];txtR(item.rarityLabel,20+cardW-16,cy+20,rc,'bold 10px sans-serif');txtLWrap(item.desc,20+54,cy+50,cardW-74,C.muted,'10px sans-serif',12);addHit(20,cy,cardW,cardH,'REWARD_PICK',{item});});const skipY=startY+items.length*(cardH+10);txt(T('reward.skip'),SW/2,skipY+16,C.muted,'12px sans-serif');addHit(SW/2-80,skipY+2,160,28,'REWARD_SKIP',{});}
function drawFloat(){if(!G.floatMsg)return;const SW=GameGlobal.SW,SH=GameGlobal.SH;ctx.font='bold 13px sans-serif';const tw=ctx.measureText(G.floatMsg).width+32;const fw=Math.min(tw,SW-40);const fh=42,fx=(SW-fw)/2,fy=SH/2-60;fillRR(fx,fy,fw,fh,14,C.bg2?'rgba(255,255,255,0.96)':'rgba(0,0,0,0.88)');strokeRR(fx,fy,fw,fh,14,C.border);txt(G.floatMsg,SW/2,fy+fh/2,C.text,'bold 13px sans-serif');}
function drawAchievement(){if(!G.ach)return;const SW=GameGlobal.SW;const aw=SW-40,ah=60,ax=20,ay=20;fillRR(ax,ay,aw,ah,16,C.bg2?'#ffffff':'#001520');strokeRR(ax,ay,aw,ah,16,C.accent);txt(G.ach.icon,ax+28,ay+ah/2,C.text,'26px sans-serif');txtL(G.ach.title,ax+52,ay+18,C.accent,'bold 12px sans-serif');txtL(G.ach.desc,ax+52,ay+38,C.muted,'10px sans-serif');}
function drawHome(){
  const SW=GameGlobal.SW,SH=GameGlobal.SH;const cx=SW/2,my=SH/2;
  txt(T('home.title'),cx,my-140,C.accent,'bold 34px sans-serif');
  txt(T('home.subtitle'),cx,my-100,C.purple,'bold 16px sans-serif');
  if(G.best>0){fillRR(cx-80,my-72,160,34,12,C.surface);strokeRR(cx-80,my-72,160,34,12,C.border);txt(T('home.bestRecord',{best:G.best}),cx,my-55,C.accent,'bold 13px sans-serif');}
  const tiles=[2,4,8,16,32,64];const tileS=44,gap=8;const rowW=tiles.length*(tileS+gap)-gap;
  tiles.forEach((v,i)=>{const{bg,fg}=tileStyle(v);const tx=cx-rowW/2+i*(tileS+gap);const ty=my-10;fillRR(tx,ty,tileS,tileS,13,bg);strokeRR(tx,ty,tileS,tileS,13,C.border);txt(String(v),tx+tileS/2,ty+tileS/2-(LABELS[v]?6:0),fg,'bold 14px sans-serif');if(LABELS[v])txt(LABELS[v],tx+tileS/2,ty+tileS-7,fg+'dd','7px sans-serif');});
  fillRR(cx-100,my+56,200,52,20,C.accent);txt(T('home.dive'),cx,my+82,'#fff','bold 20px sans-serif');addHit(cx-100,my+56,200,52,'START_GAME',{});
  fillRR(cx-60,my+122,120,36,14,C.surface2);strokeRR(cx-60,my+122,120,36,14,C.border);txt(T('home.guide'),cx,my+140,C.muted,'12px sans-serif');addHit(cx-60,my+122,120,36,'OPEN_INFO',{});
  txt(T('home.tip'),cx,my+174,C.muted,'11px sans-serif');
  txt(T('home.keyHint'),cx,SH-20,C.muted,'10px sans-serif');
}
function drawInfoOverlay(){
  const SW=GameGlobal.SW,SH=GameGlobal.SH;ctx.fillStyle=C.bg2?'rgba(224,241,251,0.97)':'rgba(0,0,0,0.92)';ctx.fillRect(0,0,SW,SH);
  const titleY=14;txt(T('info.title'),SW/2,titleY+10,C.text,'bold 16px sans-serif');
  fillRR(10,titleY,34,34,8,C.surface2);txt('✕',27,titleY+17,C.muted,'14px sans-serif');addHit(10,titleY,34,34,'CLOSE_INFO',{});
  const tabs=[{key:'talent',label:T('info.tabs.talent')},{key:'item',label:T('info.tabs.item')},{key:'env',label:T('info.tabs.env')}];
  const tabY=titleY+44,tabH=34;const tabW=(SW-32)/3;
  tabs.forEach((t,i)=>{const tx=16+i*tabW;const active=G.infoTab===t.key;fillRR(tx,tabY,tabW-4,tabH,8,active?C.purple:C.surface);txt(t.label,tx+(tabW-4)/2,tabY+tabH/2,active?C.text:C.muted,`${active?'bold ':''}13px sans-serif`);addHit(tx,tabY,tabW-4,tabH,'SET_INFO_TAB',{tab:t.key});});
  const contentY=tabY+tabH+10;const cardW=SW-32;
  if(G.infoTab==='talent'){TALENTS.forEach((t,i)=>{const cy=contentY+i*86;fillRR(16,cy,cardW,80,10,C.surface);strokeRR(16,cy,cardW,80,10,C.border);drawTalentIcon(t.id,t.icon,16+28,cy+40,46,C.text,'26px sans-serif');txtL(t.name,16+52,cy+22,C.accent,'bold 13px sans-serif');txtL(t.badge,16+cardW-44,cy+22,C.purple,'bold 11px sans-serif');const words=t.desc,maxW=cardW-60;ctx.font='11px sans-serif';if(ctx.measureText(words).width<=maxW){txtL(words,16+52,cy+52,C.muted,'11px sans-serif');}else{const mid=Math.floor(words.length/2);txtL(words.slice(0,mid),16+52,cy+44,C.muted,'11px sans-serif');txtL(words.slice(mid),16+52,cy+60,C.muted,'11px sans-serif');}});}
  else if(G.infoTab==='item'){const items=Object.values(ITEMS_DEF);const cols=2,colW=(cardW-8)/2,rowH=70;const rarityColors={common:C.success,rare:C.purple,epic:C.accent};items.forEach((item,i)=>{const col=i%cols,row=Math.floor(i/cols);const cx2=16+col*(colW+8);const cy=contentY+row*(rowH+6);fillRR(cx2,cy,colW,rowH-2,8,C.surface);strokeRR(cx2,cy,colW,rowH-2,8,rarityColors[item.rarity]||C.border);drawItemIcon(item.id,item.icon,cx2+20,cy+22,30,C.text,'20px sans-serif');txtL(item.name,cx2+36,cy+16,C.text,'bold 12px sans-serif');txtL(item.rarityLabel,cx2+36,cy+32,rarityColors[item.rarity],'10px sans-serif');ctx.font='10px sans-serif';let desc=item.desc;while(desc.length>2&&ctx.measureText(desc).width>colW-12)desc=desc.slice(0,-1);txtL(desc,cx2+6,cy+54,C.muted,'10px sans-serif');});}
  else if(G.infoTab==='env'){const envList=ENVS.slice(1);envList.forEach((env,i)=>{const cy=contentY+i*56;fillRR(16,cy,cardW,50,8,C.surface);strokeRR(16,cy,cardW,50,8,C.border);drawEnvIcon(env.id,env.icon,16+22,cy+25,36,C.text,'20px sans-serif');txtL(env.name,16+42,cy+14,C.text,'bold 12px sans-serif');txtL(env.desc,16+42,cy+34,C.muted,'10px sans-serif');});}
  // Privacy options — GDPR consent management entry point (bottom of the page).
  const pH=38,pY=SH-pH-24,pW=200;fillRR(SW/2-pW/2,pY,pW,pH,14,C.surface);strokeRR(SW/2-pW/2,pY,pW,pH,14,C.border);txt(T('info.privacy'),SW/2,pY+pH/2,C.muted,'12px sans-serif');addHit(SW/2-pW/2,pY,pW,pH,'PRIVACY_OPTIONS',{});
}
// Drive the move animation with requestAnimationFrame; renderAll() picks drawBoardAnim while G.anim is set.
let _animRAF=null;
function startAnimLoop(){
  if(_animRAF)cancelAnimationFrame(_animRAF);
  const step=()=>{
    if(!G.anim){_animRAF=null;renderAll();return;}
    const now=performance.now();
    if(G.anim.start==null)G.anim.start=now;
    G.anim.t=Math.min(1,(now-G.anim.start)/G.anim.total);
    renderAll();
    if(G.anim.t<1){_animRAF=requestAnimationFrame(step);}
    else{G.anim=null;_animRAF=null;renderAll();}
  };
  _animRAF=requestAnimationFrame(step);
}
// Show the top-right controls only on HOME (no info) and PLAYING; hide them on
// full-screen overlays so they don't cover the page title.
function updateControlsVisibility(){
  const bar=document.getElementById('controls');if(!bar)return;
  const show=(G.phase==='HOME'&&!G.infoOpen)||G.phase==='PLAYING';
  bar.style.display=show?'flex':'none';
}
function renderAll(){
  if(!ctx)return;ItemArt.load();TalentArt.load();EnvArt.load();SceneArt.load();hitAreas=[];const L=layout();const SW=GameGlobal.SW,SH=GameGlobal.SH;
  updateControlsVisibility();
  if(C.bg2){const g=ctx.createLinearGradient(0,0,0,SH);g.addColorStop(0,C.bg2);g.addColorStop(1,C.bg);ctx.fillStyle=g;}else{ctx.fillStyle=C.bg;}
  ctx.fillRect(0,0,SW,SH);
  // scene background per skin (cover-fit); solid gradient above is the fallback until it loads
  const _sk=(typeof activeSkinId!=='undefined')?activeSkinId:'deep';const _scn=SceneArt.get(_sk);
  if(_scn){const sc=Math.max(SW/_scn.width,SH/_scn.height),dw=_scn.width*sc,dh=_scn.height*sc;ctx.drawImage(_scn,(SW-dw)/2,(SH-dh)/2,dw,dh);
    // subtle scrim so UI text keeps contrast (light skins→white veil, dark→black veil)
    ctx.fillStyle=C.bg2?'rgba(230,244,255,0.28)':'rgba(0,10,20,0.32)';ctx.fillRect(0,0,SW,SH);}
  if(G.phase==='HOME'){drawHome();if(G.infoOpen)drawInfoOverlay();drawFloat();return;}
  if(G.phase==='TALENT_SELECT'){drawTalentOverlay(L);drawFloat();return;}
  if(G.phase==='LEVEL_INTRO'){drawLevelIntro();drawFloat();return;}
  if(G.phase==='REWARD'){drawRewardOverlay();drawFloat();return;}
  drawHeader(L);drawEnergyRow(L);drawEnvBar(L);drawTalentBar(L);drawItemBar(L);(G.anim?drawBoardAnim(L,G.anim.t):drawBoard(L));drawTaunt(L);drawButtons(L);
  if(G.phase==='WIN')drawWinOverlay();if(G.phase==='LOSE')drawLoseOverlay();
  drawAchievement();drawFloat();
}
