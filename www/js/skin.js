// ════════════════════════════════════════
// skin.js — skin switching (all skins free) + top control bar (lang / skins)
// ════════════════════════════════════════
function applySkin(id) {
  const s = SKINS.find(x => x.id === id);
  if (!s) return;
  activeSkinId = id;
  Object.assign(C, s.palette);
  Object.assign(TILE_MAP, s.tileMap);
  LABELS = s.labels || {};
  Platform.storage.set('dm_skin', id);
  renderControls();
  if (typeof renderAll === 'function') renderAll();
}

// Top-right controls: language toggle + skin dots (all unlocked).
function renderControls() {
  const bar = document.getElementById('controls');
  if (!bar) return;

  const cur = I18N.lang;
  const curName = I18N.NATIVE[cur] || I18N.t('lang.name');
  const langBtn = `<div class="ctl-btn lang" id="lang-btn" title="${I18N.t('lang.toggle')}">${curName} <span class="caret">▾</span></div>`;
  const langMenu = `<div id="lang-menu" class="lang-menu" hidden>` + I18N.SUPPORTED.map(l =>
    `<div class="lang-item${l===cur?' sel':''}" data-lang="${l}">${I18N.NATIVE[l] || l}</div>`
  ).join('') + `</div>`;

  const dots = SKINS.map(s => {
    const sel = activeSkinId === s.id;
    return `<div class="skin-dot${sel?' sel':''}" data-skin="${s.id}" title="${s.name}"
      style="background:${s.palette.accent}"></div>`;
  }).join('');

  bar.innerHTML = langBtn + langMenu + `<span class="skin-dots">${dots}</span>`;

  const lb = document.getElementById('lang-btn');
  const menu = document.getElementById('lang-menu');
  if (lb && menu) {
    lb.onclick = (e) => { e.stopPropagation(); toggleLangMenu(); };
    menu.querySelectorAll('.lang-item').forEach(it => {
      it.onclick = async (e) => {
        e.stopPropagation();
        closeLangMenu();
        await I18N.setLang(it.getAttribute('data-lang')); // onChange → applyLocale + re-render
      };
    });
  }
  bar.querySelectorAll('.skin-dot').forEach(d => {
    d.onclick = () => applySkin(d.getAttribute('data-skin'));
  });
}

function toggleLangMenu() {
  const menu = document.getElementById('lang-menu');
  if (!menu) return;
  if (menu.hidden) openLangMenu(); else closeLangMenu();
}
function openLangMenu() {
  const menu = document.getElementById('lang-menu');
  if (!menu) return;
  menu.hidden = false;
  // close when tapping anywhere outside the menu
  setTimeout(() => document.addEventListener('pointerdown', onOutsideLang), 0);
}
function closeLangMenu() {
  const menu = document.getElementById('lang-menu');
  if (menu) menu.hidden = true;
  document.removeEventListener('pointerdown', onOutsideLang);
}
function onOutsideLang(e) {
  if (!e.target.closest('#lang-menu, #lang-btn')) closeLangMenu();
}
