# 2048 Abyss — 美术生成提示词汇总

用法:每条 `id` 就是**输出文件名**;把 `prompt` 整段复制给 Gemini 生成,保存成 `<id>.png`(或 .webp)。
生成后按下表放到对应目录,我再接进渲染管线(现在这些还是 emoji)。

| 类别 | id 前缀 | 存放目录 | 规格 |
|---|---|---|---|
| 道具 | `item-*` | `www/assets/items/` | 512×512,**纯洋红底 #FF00FF**,无文字 |
| 天赋 | `talent-*` | `www/assets/talents/` | 512×512,**纯洋红底 #FF00FF**,无文字 |
| 海况 | `env-*` | `www/assets/envs/` | 512×512,**纯洋红底 #FF00FF**,无文字 |
| 场景 | `scene-*` | `www/assets/scenes/` | 竖屏 9:16(建议 1290×2796),不透明 |

> ⚠ **图标类用纯洋红 `#FF00FF` 底,不要用"透明"**(Gemini 的透明是假的,会画成棋盘实底)。纯洋红我按颜色精确扣除,干净且保留全部细节(气泡/辉光都在)。交给我时我会:抠洋红 → 裁水印 → 缩放 → 转 webp。
> 生物(tile 立绘)已从 fishId 库导入,**不用生成**。
> 图标类务必**透明底 + 无文字 + 主体大而居中**(游戏里显示很小);场景类务必**中间安静、明暗贴合皮肤**(deep/coral 亮、polar/abyss 暗),否则 UI 文字看不清。

---

## 道具 Gear(11)

### id: item-bomb
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a round naval depth-charge sea mine with spikes and a glowing lit fuse, rising bubbles. --ar 1:1

### id: item-shuffle
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: two intertwined swirling water currents forming a circular shuffle-arrow loop. --ar 1:1

### id: item-undo
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a glowing backward-flowing water current shaped into a rewind / undo arrow. --ar 1:1

### id: item-double
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a glowing round pressure gauge bursting with energy and an electric bubble with a lightning spark (power boost). --ar 1:1

### id: item-amplify
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a glowing bioluminescent serum potion vial with an upward growth arrow and sparkles. --ar 1:1

### id: item-gamble
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a glowing translucent dice cube underwater surrounded by bubbles. --ar 1:1

### id: item-joker
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a cute translucent glowing ghost-fish spirit with a mischievous smile and ethereal wisps. --ar 1:1

### id: item-yolo
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a deep-sea slot machine with spinning reels showing pearls, a swirling dark abyss vortex behind, risky purple glow. --ar 1:1

### id: item-swap
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: two curved water-current arrows swapping positions in a circular loop. --ar 1:1

### id: item-halve
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a pair of glowing clam-shell blade scissors cutting a water droplet in half. --ar 1:1

### id: item-freeze
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a glowing frozen ice crystal snowflake encasing a bubble, cold frost glow. --ar 1:1

---

## 天赋 Talents(3)

### id: talent-double
Cute glossy mobile-game emblem icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a glowing lightning bolt striking through a water pressure crystal, critical-hit spark (Pressure Crit). --ar 1:1

### id: talent-golden
Cute glossy mobile-game emblem icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a divine glowing golden trident with a radiant sparkle blessing and sea-god aura (Sea God's Touch). --ar 1:1

### id: talent-hoarder
Cute glossy mobile-game emblem icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a cute diver's waterproof backpack / treasure satchel overflowing with pearls and gear (Deep Backpacker). --ar 1:1

---

## 海况 Environments(9)

### id: env-normal
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a single gentle calm ocean wave, serene and soft (Calm Seas). --ar 1:1

### id: env-storm
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a swirling underwater whirlpool vortex, turbulent churning current (Seabed Vortex). --ar 1:1

### id: env-fog
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a cute squid releasing a dark cloud of ink (Squid Patrol). --ar 1:1

### id: env-overtime
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a tangled fishing net wrapped with chains and a lock, trapping (Net Lock). --ar 1:1

### id: env-bonus
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: an open treasure chest overflowing with glowing pearls and gold underwater (Treasure Surge). --ar 1:1

### id: env-gravity
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a spiraling reversed tidal current with up-and-down flip arrows (Tidal Reverse). --ar 1:1

### id: env-fogenv
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a dark murky deep-sea fog cloud, dim and heavy (Deep Fog). --ar 1:1

### id: env-valx2
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a bursting energy explosion of merging bubbles, an evolution surge (Evolution Frenzy). --ar 1:1

### id: env-scorex2
Cute glossy mobile-game icon, deep-sea theme, single centered object, soft bioluminescent cyan-teal glow, smooth rounded shapes, thick clean outline, subtle rim light, vibrant kawaii sticker style, on a solid flat pure magenta chroma background #FF00FF (uniform flat fill, no gradient, no vignette, no shadow on background), no text, 512x512, high detail. Subject: a cluster of glowing golden coin-bubbles, treasure sparkle (Double Bubbles). --ar 1:1

---

## 场景 Scenes / 皮肤背景(4)

### id: scene-deep
Soft dreamy underwater game background, vertical portrait composition, painterly anime style matching a cute ocean game, atmospheric depth with gentle gradient, CALM and uncluttered in the center to leave room for UI, more detail only near the top and bottom edges, no characters, no creatures, no text, no UI, subtle. Scene: bright soft upper ocean, pale aqua and light blue water, gentle god-rays streaming down from the surface, drifting bubbles and tiny plankton specks, airy and serene, LIGHT palette. --ar 9:16

### id: scene-coral
Soft dreamy underwater game background, vertical portrait composition, painterly anime style matching a cute ocean game, atmospheric depth with gentle gradient, CALM and uncluttered in the center to leave room for UI, more detail only near the top and bottom edges, no characters, no creatures, no text, no UI, subtle. Scene: warm sunlit shallow coral reef, soft blurred pastel corals in the far background, cream and peach water, warm sun rays, gentle and bright, LIGHT WARM palette. --ar 9:16

### id: scene-polar
Soft dreamy underwater game background, vertical portrait composition, painterly anime style matching a cute ocean game, atmospheric depth with gentle gradient, CALM and uncluttered in the center to leave room for UI, more detail only near the top and bottom edges, no characters, no creatures, no text, no UI, subtle. Scene: dark deep arctic water beneath thick ice, faint teal-and-purple aurora glow filtering from far above, drifting ice particles, cold and quiet, DARK navy palette. --ar 9:16

### id: scene-abyss
Soft dreamy underwater game background, vertical portrait composition, painterly anime style matching a cute ocean game, atmospheric depth with gentle gradient, CALM and uncluttered in the center to leave room for UI, more detail only near the top and bottom edges, no characters, no creatures, no text, no UI, subtle. Scene: pitch-black deep-sea abyss, scattered faint bioluminescent particles in cyan magenta and green, heavy volumetric darkness, a distant faint glow far below, mysterious, NEAR-BLACK palette. --ar 9:16
