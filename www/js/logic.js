// ════════════════════════════════════════
// logic.js — pure game state machine.
// Player-facing strings go through I18N.t(); persistence via Platform.storage.
// ════════════════════════════════════════
const G = {};
function tf(key, params){ return I18N.t(key, params); }

function initGame(levelIdx=0){
  let best=0;
  try{best=parseInt(Platform.storage.get('dm_best')||'0')||0;}catch(e){}
  Object.assign(G,{
    levelIdx,board:[],size:3,target:32,score:0,best,talents:[],
    items:Array(7).fill(null),itemSlots:4,carryItems:null,specialTiles:{},
    env:ENVS[0],envStartStep:0,nextEnvStep:30,prevBoard:null,freezeGen:0,
    energyScore:0,_lastScore:0,swapState:null,stepCount:0,scoreMulti:1,
    nextMergeDouble:false,mergeCount:0,gameOver:false,unlocked:new Set(),
    startTime:Date.now(),bombMode:false,bombSlot:0,itemMode:null,
    phase:'HOME',pendingFloat:null,pendingAch:null,floatMsg:null,ach:null,
    taunt:TAUNTS[0],rewardItems:[],rewardCtx:null,
    shareRewarded:false,sharePicksLeft:0,infoOpen:false,infoTab:'talent',rankOpen:false,anim:null,
  });
}
// ── save / resume the in-progress run (dm_save) ──
// Only a live PLAYING snapshot is persisted; talents/items/env are stored by id and
// rebuilt on load, so no functions or injected locale text get serialized.
function saveGame(){
  try{
    if(G.phase==='PLAYING'){
      const d={
        levelIdx:G.levelIdx, board:G.board, score:G.score, stepCount:G.stepCount,
        talents:G.talents.map(t=>t.id), itemSlots:G.itemSlots,
        items:G.items.map(x=>x?x.id:null), specialTiles:G.specialTiles,
        energyScore:G.energyScore, mergeCount:G.mergeCount, unlocked:[...(G.unlocked||[])],
        envId:G.env&&G.env.id, envStartStep:G.envStartStep, nextEnvStep:G.nextEnvStep,
        scoreMulti:G.scoreMulti, freezeGen:G.freezeGen, nextMergeDouble:G.nextMergeDouble,
      };
      Platform.storage.set('dm_save', JSON.stringify(d));
    } else if(G.phase==='HOME'||G.phase==='WIN'||G.phase==='LOSE'){
      Platform.storage.set('dm_save',''); // finished/menu → drop the save
    }
    // transient overlays (REWARD/LEVEL_INTRO/TALENT_SELECT): leave the last save untouched
  }catch(e){}
}
function loadGame(){
  let raw; try{raw=Platform.storage.get('dm_save');}catch(e){return false;}
  if(!raw)return false;
  let d; try{d=JSON.parse(raw);}catch(e){return false;}
  if(!d||!Array.isArray(d.board)||typeof d.levelIdx!=='number')return false;
  const lv=LEVELS[d.levelIdx]; if(!lv||d.board.length!==lv.size)return false;
  Object.assign(G,{
    levelIdx:d.levelIdx, size:lv.size, target:lv.target,
    board:d.board, score:d.score||0, stepCount:d.stepCount||0,
    talents:(d.talents||[]).map(id=>TALENTS.find(t=>t.id===id)).filter(Boolean),
    itemSlots:d.itemSlots||4,
    items:(d.items||[]).map(id=>id&&ITEMS_DEF[id]?{...ITEMS_DEF[id]}:null),
    specialTiles:d.specialTiles||{},
    energyScore:d.energyScore||0, mergeCount:d.mergeCount||0, unlocked:new Set(d.unlocked||[]),
    env:ENVS.find(e=>e.id===d.envId)||ENVS[0], envStartStep:d.envStartStep||0, nextEnvStep:d.nextEnvStep||30,
    scoreMulti:d.scoreMulti||1, freezeGen:d.freezeGen||0, nextMergeDouble:!!d.nextMergeDouble,
    _lastScore:d.score||0, phase:'PLAYING', gameOver:false, anim:null,
  });
  return true;
}
function showTalentSelect(){G.phase='TALENT_SELECT';}
function selectTalent(t){
  G.talents=t?[t]:[];
  const ex=G.talents.find(x=>x.extraSlots);
  G.itemSlots=ex?4+ex.extraSlots:4;
  if(G.carryItems){G.items=Array(7).fill(null);G.carryItems.forEach((item,i)=>{if(item&&i<G.itemSlots)G.items[i]=item;});G.carryItems=null;}
  else{G.items=Array(7).fill(null);}
  startLevel();G.phase='LEVEL_INTRO';
}
function confirmStart(){G.phase='PLAYING';}
function startLevel(){
  const lv=LEVELS[G.levelIdx];
  G.size=lv.size;G.target=lv.target;
  G.board=Array(lv.size).fill(null).map(()=>Array(lv.size).fill(0));
  G.score=0;G.stepCount=0;G.gameOver=false;G.specialTiles={};G.scoreMulti=1;
  G.nextMergeDouble=false;G.mergeCount=0;G.bombMode=false;G.itemMode=null;
  G.swapState=null;G.prevBoard=null;G.energyScore=0;G._lastScore=0;G.freezeGen=0;G.startTime=Date.now();
  G.env=ENVS[0];G.envStartStep=0;G.phase='PLAYING';G.shareRewarded=false;
  addTile();addTile();
  if(lv.initTile){const e=[];for(let r=0;r<lv.size;r++)for(let c=0;c<lv.size;c++)if(!G.board[r][c])e.push([r,c]);if(e.length){const[r,c]=e[Math.floor(Math.random()*e.length)];G.board[r][c]=lv.initTile;}}
  startEnvCycle();rotateTaunt();
}
function nextLevel(){
  if(G.levelIdx+1<LEVELS.length){
    G.levelIdx++;
    // 天赋只在开局选一次，后续关卡沿用当前天赋，带着道具直接进下一关
    if(G.carryItems){G.items=Array(7).fill(null);G.carryItems.forEach((item,i)=>{if(item&&i<G.itemSlots)G.items[i]=item;});G.carryItems=null;}
    startLevel();
    G.phase='LEVEL_INTRO';
  }
}
function addTile(board){
  const b=board||G.board;const empty=[];
  for(let r=0;r<G.size;r++)for(let c=0;c<G.size;c++)if(!b[r][c])empty.push([r,c]);
  if(!empty.length)return null;
  const[r,c]=empty[Math.floor(Math.random()*empty.length)];
  b[r][c]=(G.levelIdx>=1&&Math.random()<0.2)?4:2;return[r,c];
}
function isLocked(r,c){return G.specialTiles[r*G.size+c]?.type==='locked';}
function slideArr(arr){
  const out=[];let i=0;
  while(i<arr.length){
    const v=arr[i];if(!v){i++;continue;}
    const ni=arr.findIndex((x,j)=>j>i&&(x>0||x===-1));
    const nv=ni>=0?arr[ni]:null;
    const isJoker=ni>=0&&((v===-1&&nv>0&&nv<=2048)||(v>0&&v<=2048&&nv===-1));
    const canMerge=ni>=0&&((arr[ni]===v&&v!==-1)||isJoker);
    if(canMerge){
      const base=v===-1?nv:(nv===-1?v:v);let val=base*2;
      G.mergeCount++;
      const dT=G.talents.find(t=>t.mergeBonus);
      if(dT&&G.mergeCount%dT.mergeBonus.every===0){val*=dT.mergeBonus.multi;G.pendingFloat=tf('float.crit',{val});}
      if(G.nextMergeDouble){val*=2;G.nextMergeDouble=false;G.pendingFloat=tf('float.doubleItem',{val});}
      const gT=G.talents.find(t=>t.goldenChance);
      if(gT&&Math.random()<gT.goldenChance){val*=2;G.pendingFloat=tf('float.golden',{val});}
      if(G.env?.valueMult)val*=G.env.valueMult;
      G.score+=Math.round(val*G.scoreMulti);checkAch(val);out.push(val);i=ni+1;
    }else{out.push(v);i++;}
  }
  while(out.length<arr.length)out.push(0);return out;
}
function slidePositions(positions){
  const result=Array(positions.length).fill(0);const segments=[];let segStart=null;
  positions.forEach((p,i)=>{
    if(isLocked(p.r,p.c)){result[i]=G.board[p.r][p.c];if(segStart!==null){segments.push({start:segStart,end:i-1});segStart=null;}}
    else{if(segStart===null)segStart=i;if(i===positions.length-1)segments.push({start:segStart,end:i});}
  });
  segments.forEach(({start,end})=>{const vals=positions.slice(start,end+1).map(p=>G.board[p.r][p.c]);slideArr(vals).forEach((v,fi)=>result[start+fi]=v);});
  return result;
}
// Position-only trace for the slide animation — mirrors slideArr's merge rules but
// touches no game state. Returns [{from,to,merge,value}] as indices into positions[].
function tracePositions(positions){
  const moves=[];const segs=[];let ss=null;
  positions.forEach((p,i)=>{
    if(isLocked(p.r,p.c)){if(ss!==null){segs.push({start:ss,end:i-1});ss=null;}}
    else{if(ss===null)ss=i;if(i===positions.length-1)segs.push({start:ss,end:i});}
  });
  segs.forEach(({start,end})=>{
    const vals=positions.slice(start,end+1).map(p=>G.board[p.r][p.c]);
    let out=0,i=0;
    while(i<vals.length){
      const v=vals[i];if(!v){i++;continue;}
      const ni=vals.findIndex((x,j)=>j>i&&(x>0||x===-1));
      const nv=ni>=0?vals[ni]:null;
      const isJoker=ni>=0&&((v===-1&&nv>0&&nv<=2048)||(v>0&&v<=2048&&nv===-1));
      const canMerge=ni>=0&&((vals[ni]===v&&v!==-1)||isJoker);
      if(canMerge){moves.push({from:start+i,to:start+out,merge:false,value:v});moves.push({from:start+ni,to:start+out,merge:true,value:nv});out++;i=ni+1;}
      else{moves.push({from:start+i,to:start+out,merge:false,value:v});out++;i++;}
    }
  });
  return moves;
}
function move(dir){
  if(G.gameOver||G.phase!=='PLAYING')return;if(G.bombMode||G.itemMode)return;
  let realDir=dir;if(G.env?.reverseGravity){const flip={up:'down',down:'up',left:'left',right:'right'};realDir=flip[dir];}
  const s=G.size;const prev=JSON.parse(JSON.stringify(G.board));
  const prevScore=G.score,prevMerge=G.mergeCount;const prevST=JSON.parse(JSON.stringify(G.specialTiles));
  const newBoard=Array.from({length:s},(_,r)=>Array.from({length:s},(_,c)=>G.board[r][c]));
  const animSlides=[],mergedCells=new Set();
  const applySlide=(getPos,setVal)=>{for(let i=0;i<s;i++){const pos=getPos(i);const res=slidePositions(pos);res.forEach((v,j)=>setVal(i,j,v));
    tracePositions(pos).forEach(mv=>{const f=pos[mv.from],t=pos[mv.to];animSlides.push({value:mv.value,fromR:f.r,fromC:f.c,toR:t.r,toC:t.c});if(mv.merge)mergedCells.add(t.r+','+t.c);});
  }};
  if(realDir==='left')applySlide(r=>Array.from({length:s},(_,c)=>({r,c})),(r,c,v)=>newBoard[r][c]=v);
  else if(realDir==='right')applySlide(r=>Array.from({length:s},(_,c)=>({r,c:s-1-c})),(r,c,v)=>newBoard[r][s-1-c]=v);
  else if(realDir==='up')applySlide(c=>Array.from({length:s},(_,r)=>({r,c})),(c,r,v)=>newBoard[r][c]=v);
  else applySlide(c=>Array.from({length:s},(_,r)=>({r:s-1-r,c})),(c,r,v)=>newBoard[s-1-r][c]=v);
  let moved=false;
  for(let r=0;r<s;r++)for(let c=0;c<s;c++)if(newBoard[r][c]!==G.board[r][c])moved=true;
  if(!moved)return;
  G.prevBoard={board:prev,score:prevScore,mergeCount:prevMerge,specialTiles:prevST};G.board=newBoard;
  Object.keys(G.specialTiles).forEach(k=>{if(G.specialTiles[k].type==='fog'){const idx=parseInt(k),r2=Math.floor(idx/G.size),c2=idx%G.size;if(!G.board[r2][c2])delete G.specialTiles[k];}});
  G.stepCount++;tickEnv();
  const hoarder=G.talents.find(t=>t.autoItemEvery);
  if(hoarder&&G.stepCount>0&&G.stepCount%hoarder.autoItemEvery===0){G.rewardCtx='hoarder';G.phase='REWARD';buildRewardPool();return;}
  let spawn=null;
  if(G.freezeGen>0){G.freezeGen--;if(G.freezeGen===0)G.pendingFloat=tf('float.freezeEnd');}else{spawn=addTile();}
  if(animSlides.length)G.anim={slides:animSlides,mergedCells,spawn,total:170,start:null,t:0};
  updateEnergy();rotateTaunt();if(checkWin())return;if(!canMove()){G.phase='LOSE';G.gameOver=true;try{Haptics.lose();}catch(e){}}
}
function canMove(){
  const s=G.size;const chkLk=(r,c)=>G.specialTiles[r*s+c]?.type==='locked';
  function trySlideArr(arr){const out=[];let i=0;while(i<arr.length){const v=arr[i];if(!v){i++;continue;}const ni=arr.findIndex((x,j)=>j>i&&(x>0||x===-1));if(ni>=0&&((arr[ni]===v&&v!==-1)||(v===-1&&arr[ni]>0)||(v>0&&arr[ni]===-1))){out.push(v*2);i=ni+1;}else{out.push(v);i++;}}while(out.length<arr.length)out.push(0);return out;}
  function trySlide(positions){const result=Array(positions.length).fill(0);const segs=[];let ss=null;positions.forEach((p,i)=>{if(chkLk(p.r,p.c)){result[i]=G.board[p.r][p.c];if(ss!==null){segs.push({start:ss,end:i-1});ss=null;}}else{if(ss===null)ss=i;if(i===positions.length-1)segs.push({start:ss,end:i});}});segs.forEach(({start,end})=>{const vals=positions.slice(start,end+1).map(p=>G.board[p.r][p.c]);trySlideArr(vals).forEach((v,fi)=>result[start+fi]=v);});return result;}
  for(const dir of['left','right','up','down']){let changed=false;if(dir==='left'){for(let r=0;r<s&&!changed;r++){const pos=Array.from({length:s},(_,c)=>({r,c}));if(trySlide(pos).some((v,i)=>v!==G.board[r][i]))changed=true;}}else if(dir==='right'){for(let r=0;r<s&&!changed;r++){const pos=Array.from({length:s},(_,c)=>({r,c:s-1-c}));if(trySlide(pos).some((v,i)=>v!==G.board[r][s-1-i]))changed=true;}}else if(dir==='up'){for(let c=0;c<s&&!changed;c++){const pos=Array.from({length:s},(_,r)=>({r,c}));if(trySlide(pos).some((v,i)=>v!==G.board[i][c]))changed=true;}}else{for(let c=0;c<s&&!changed;c++){const pos=Array.from({length:s},(_,r)=>({r:s-1-r,c}));if(trySlide(pos).some((v,i)=>v!==G.board[s-1-i][c]))changed=true;}}if(changed)return true;}return false;
}
function checkWin(){const lv=LEVELS[G.levelIdx];if(lv.endless||!lv.target)return false;for(let r=0;r<G.size;r++)for(let c=0;c<G.size;c++)if(G.board[r][c]>=lv.target){G.phase='WIN';G.gameOver=true;return true;}return false;}
function checkAch(val){const a=ACHS.find(a=>a.val===val);if(a&&!G.unlocked.has(val)){G.unlocked.add(val);G.pendingAch=a;}}
function updateEnergy(){
  const prev=G._lastScore||0;const delta=G.score-prev;
  if(delta>0){try{Music.merge();Haptics.merge();}catch(e){}G.energyScore=(G.energyScore||0)+delta;if(G.energyScore>=1000){G.energyScore=0;G.rewardCtx='energy';G.phase='REWARD';buildRewardPool();}}
  G._lastScore=G.score;
  try{if(G.score>G.best){G.best=G.score;Platform.storage.set('dm_best',G.best);}}catch(e){}
}
function rotateTaunt(){G.taunt=TAUNTS[Math.floor(Math.random()*TAUNTS.length)];}
function startEnvCycle(){const lv=LEVELS[G.levelIdx];const[base,rand]=lv.envInterval||[30,20];G.nextEnvStep=G.stepCount+base+Math.floor(Math.random()*rand);}
function tickEnv(){
  const s=G.stepCount;const env=G.env;
  if(env.id!=='normal'&&env.onStep)env.onStep(G,s-G.envStartStep);
  Object.keys(G.specialTiles).forEach(idx=>{const st=G.specialTiles[idx];if(typeof st.stepsLeft==='number'){st.stepsLeft--;if(st.stepsLeft<=0)delete G.specialTiles[idx];}});
  if(env.id!=='normal'&&env.steps>0&&s-G.envStartStep>=env.steps)endEnv(env);
  if(G.env.id==='normal'&&s>=G.nextEnvStep)triggerRandomEnv();
}
function triggerRandomEnv(){const pool=ENVS.filter(e=>e.id!=='normal');setEnv(pool[Math.floor(Math.random()*pool.length)]);}
function setEnv(env){G.env=env;G.envStartStep=G.stepCount;G.scoreMulti=env.scoreMulti||1;if(env.onStart)env.onStart(G);G.pendingFloat=tf('float.envStart',{icon:env.icon,name:env.name});}
function endEnv(env){if(env.onEnd)env.onEnd(G);G.scoreMulti=1;G.env=ENVS[0];G.itemMode=null;G.swapState=null;G.bombMode=false;G.pendingFloat=tf('float.envEnd',{icon:env.icon,name:env.name});const lv2=LEVELS[G.levelIdx];const[b2,r2]=lv2.envInterval||[20,20];G.nextEnvStep=G.stepCount+b2+Math.floor(Math.random()*r2);}
function addItem(g,itemDef,silent=false){if(g.items.some(x=>x?.id===itemDef.id)){if(!silent)g.pendingFloat=tf('float.haveItem',{icon:itemDef.icon,name:itemDef.name});return false;}const slots=g.itemSlots||4;for(let i=0;i<slots;i++){if(!g.items[i]){g.items[i]={...itemDef};return true;}}if(!silent)g.pendingFloat=tf('float.bagFull');return false;}
function activateBomb(slotIdx){if(G.bombMode&&G.bombSlot===slotIdx){G.bombMode=false;G.pendingFloat=tf('float.bombCancel');return;}G.bombMode=true;G.bombSlot=slotIdx;G.pendingFloat=tf('float.bombArm');}
function activateMode(type,slotIdx){if(G.itemMode?.type===type){G.itemMode=null;G.swapState=null;G.pendingFloat=tf('float.cancel');return;}G.itemMode={type,slotIdx};if(type==='swap')G.swapState={slotIdx,first:null};const tips={amplify:tf('float.tipAmplify'),gamble:tf('float.tipGamble'),yolo:tf('float.tipYolo'),halve:tf('float.tipHalve'),swap:tf('float.tipSwap')};G.pendingFloat=tips[type]||'';}
function useShuffle(slotIdx){const vals=G.board.flat().filter(v=>v!==0);vals.sort(()=>Math.random()-0.5);let vi=0;for(let r=0;r<G.size;r++)for(let c=0;c<G.size;c++)G.board[r][c]=vi<vals.length?vals[vi++]:0;G.specialTiles={};consumeItem(slotIdx);G.pendingFloat=tf('float.shuffle');}
function useUndo(slotIdx){if(!G.prevBoard){G.pendingFloat=tf('float.noUndo');return;}G.board=G.prevBoard.board;G.score=G.prevBoard.score;G.mergeCount=G.prevBoard.mergeCount;G.specialTiles=G.prevBoard.specialTiles||{};G.prevBoard=null;consumeItem(slotIdx);G.pendingFloat=tf('float.undo');}
function useDouble(slotIdx){G.nextMergeDouble=true;consumeItem(slotIdx);G.pendingFloat=tf('float.double');}
function useFreeze(slotIdx){G.freezeGen=5;consumeItem(slotIdx);G.pendingFloat=tf('float.freeze');}
function useJoker(slotIdx){const empty=[];for(let r=0;r<G.size;r++)for(let c=0;c<G.size;c++)if(!G.board[r][c])empty.push([r,c]);if(!empty.length){G.pendingFloat=tf('float.noJokerSpace');return;}const[r,c]=empty[Math.floor(Math.random()*empty.length)];G.board[r][c]=-1;consumeItem(slotIdx);G.pendingFloat=tf('float.joker');}
function consumeItem(slotIdx){G.items[slotIdx]=null;G.bombMode=false;G.itemMode=null;G.swapState=null;}
function handleTileClick(r,c){
  const v=G.board[r][c];
  if(G.bombMode){if(!v||v===0)return;if(G.specialTiles[r*G.size+c]?.type==='fog'){G.pendingFloat=tf('float.fogNoBomb');return;}G.board[r][c]=0;delete G.specialTiles[r*G.size+c];const slot=G.bombSlot;G.items[slot]=null;G.bombMode=false;G.pendingFloat=tf('float.bombHit');return;}
  if(!G.itemMode)return;
  const{type,slotIdx}=G.itemMode;
  if(type==='amplify'){if(!v||v===-1||v<=0||v>256)return;G.board[r][c]=v*2;G.score+=v;checkAch(v*2);G.itemMode=null;consumeItem(slotIdx);G.pendingFloat=tf('float.amplifyDone',{from:v,to:v*2});}
  else if(type==='gamble'){if(!v||v===-1||v<=0||v>1024)return;G.itemMode=null;if(Math.random()<0.5){G.board[r][c]=v*2;G.score+=v;checkAch(v*2);consumeItem(slotIdx);G.pendingFloat=tf('float.gambleWin',{from:v,to:v*2});}else{G.board[r][c]=0;consumeItem(slotIdx);G.pendingFloat=tf('float.gambleLose',{val:v});}}
  else if(type==='yolo'){if(!v||v===0||v===-1)return;G.itemMode=null;if(Math.random()<0.25){G.board[r][c]=v*2;G.score+=v;checkAch(v*2);consumeItem(slotIdx);G.pendingFloat=tf('float.yoloWin',{from:v,to:v*2});}else{G.board[r][c]=0;consumeItem(slotIdx);G.pendingFloat=tf('float.yoloLose',{val:v});}}
  else if(type==='halve'){if(!v||v===-1||v<4)return;const nv=Math.max(2,Math.floor(v/2));G.board[r][c]=nv;G.itemMode=null;consumeItem(slotIdx);G.pendingFloat=tf('float.halveDone',{from:v,to:nv});}
  else if(type==='swap'){if(!v||v===0)return;if(!G.swapState.first){G.swapState.first={r,c};G.pendingFloat=tf('float.swapSecond');}else{const{r:r1,c:c1}=G.swapState.first;if(r1===r&&c1===c){G.swapState.first=null;G.pendingFloat=tf('float.swapCancel');return;}const tmp=G.board[r1][c1];G.board[r1][c1]=G.board[r][c];G.board[r][c]=tmp;G.swapState=null;G.itemMode=null;consumeItem(slotIdx);G.pendingFloat=tf('float.swapDone');}}
  updateEnergy();if(checkWin())return;if(!canMove()){G.phase='LOSE';G.gameOver=true;try{Haptics.lose();}catch(e){}}
}
function buildRewardPool(){const ownedIds=new Set(G.items.filter(x=>x).map(x=>x.id));const avail=Object.values(ITEMS_DEF).filter(x=>!ownedIds.has(x.id));const byR={common:avail.filter(x=>x.rarity==='common'),rare:avail.filter(x=>x.rarity==='rare'),epic:avail.filter(x=>x.rarity==='epic')};const picked=[];const usedIds=new Set();for(let i=0;i<3&&picked.length<avail.length;i++){let item=null;for(let t=0;t<30&&!item;t++){const r=RARITY_POOL[Math.floor(Math.random()*RARITY_POOL.length)];const cands=byR[r].filter(x=>!usedIds.has(x.id));if(cands.length)item=cands[Math.floor(Math.random()*cands.length)];}if(!item){const rem=avail.filter(x=>!usedIds.has(x.id));if(rem.length)item=rem[Math.floor(Math.random()*rem.length)];}if(item){picked.push(item);usedIds.add(item.id);}}G.rewardItems=picked;}
function pickRewardItem(item){const added=addItem(G,item,true);G.pendingFloat=added?tf('float.rewardGot',{icon:item.icon,rarity:item.rarityLabel,name:item.name}):tf('float.rewardBagFull',{name:item.name});if(G.rewardCtx==='energy'||G.rewardCtx==='hoarder'){G.phase='PLAYING';G.gameOver=false;}else if(G.rewardCtx==='share'){G.sharePicksLeft--;if(G.sharePicksLeft>0){buildRewardPool();}else{G.phase='PLAYING';}}else{G.carryItems=[...G.items];nextLevel();}}
function skipReward(){if(G.rewardCtx==='energy'||G.rewardCtx==='hoarder'){G.phase='PLAYING';G.gameOver=false;}else if(G.rewardCtx==='share'){G.sharePicksLeft=0;G.phase='PLAYING';}else{G.carryItems=[...G.items];nextLevel();}}
// Triggered after a rewarded video completes.
function triggerShareReward(){G.sharePicksLeft=1;G.rewardCtx='share';G.phase='REWARD';buildRewardPool();}
function showRewardThenNext(){const lv=LEVELS[G.levelIdx];if(lv.endless||G.levelIdx>=LEVELS.length-1){if(!lv.endless){nextLevel();}return;}G.carryItems=[...G.items];G.rewardCtx='win';G.phase='REWARD';buildRewardPool();}
function clearSmallTiles(){for(let r=0;r<G.size;r++)for(let c=0;c<G.size;c++)if(G.board[r][c]>0&&G.board[r][c]<=4)G.board[r][c]=0;G.specialTiles={};G.gameOver=false;G.phase='PLAYING';G.pendingFloat=tf('float.clearSmall');}
