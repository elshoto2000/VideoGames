/* ============================================================
   BIGOTE BROS — plataformero 2D, JavaScript puro (Canvas 2D)
   Arcade de PixelHub · 1 o 2 jugadores en el mismo teclado
   Sin librerías, sin imágenes: todo el arte es dibujado por código.

   Controles
     Jugador 1 (Rojo) : A / D mover · W saltar · S disparar
     Jugador 2 (Verde): ← / → mover · ↑ saltar · ↓ disparar
     P pausa · Enter confirmar · R reiniciar nivel

   Mundos: 1-1, 1-2, 1-3 · 2-1, 2-2, 2-3 · 3-1 (JEFE FINAL)
   ============================================================ */
(function () {
  'use strict';

  // ─── Constantes del motor ───────────────────────────────────
  var TILE = 32;
  var VIEW_W = 800, VIEW_H = 448;   // 25 x 14 tiles
  var ROWS = 14;
  var SOLID = '#XB?MST=V';           // caracteres que bloquean el paso
  var STEP = 1000 / 60;             // paso fijo de física (60 fps)

  var GRAV = 0.62, GRAV_HOLD = 0.34, MAX_FALL = 13;
  var ACC = 0.55, MAX_SPD = 4.3, FRIC = 0.80, AIR_FRIC = 0.94;
  var JUMP_V = -11.6;
var LEVELS = [
  { name: '1-1', world: 1, rows: [
    '                                                                                                                ',
    '                                                                                                                ',
    '                                                                                                                ',
    '                                                                                                                ',
    '                                                                                                                ',
    '                                                                                                                ',
    '                                                                            oooo                                ',
    '           ooo                      BB?B             ooo                                                #       ',
    '          BBB?B     M      ooo                      ====      BBSB                   ooo        ?      ##       ',
    '                          ====                                        XX            ====              ###       ',
    '                                            T                                                        ####       ',
    '  1 2             g     g         g     k   T   g           k     g     g     k             g       #####  F    ',
    '##########################    ######################    ############################    ########################',
    '##########################    ######################    ############################    ########################',
  ] },
  { name: '1-2', world: 1, rows: [
    '                                                                                                                      ',
    '                                                                                                                      ',
    '                                                                                                                      ',
    '                                                                                                                      ',
    '                                                                                                                      ',
    '                                                 ooo                                                                  ',
    '                                                XXXXX                                                                 ',
    '                ooo       BBBB?BB   oo                f           BBSBB                 f                             ',
    '        BBMB                        ==        f                               ==    ooooo        ==       ?    #      ',
    '                      ==                                      ==          T                  XX               ##      ',
    '                                                                          T                                  ###      ',
    '  1 2   g     k             g               k     g     g           j     T         g     k             g   ####  F   ',
    '####################     #########     #####################     ###########    ################    ##################',
    '####################~~~~~#########~~~~~#####################~~~~~###########    ################~~~~##################',
  ] },
  { name: '1-3', world: 1, rows: [
    '                                                                                                                            ',
    '                                                                                                                            ',
    '                                                                                                                            ',
    '                                                                                                                            ',
    '                                    oooooo                     S                      oooooo                                ',
    '                                                              ===                         f                                 ',
    '                              BB?BB   f                     f                         f                               #     ',
    '                                f                      ooo                    BBBMBB                      BB?BB      ##     ',
    '      BBMB          ==     #                          XXXXX             ==                                          ###     ',
    '                          ##                  ==                                                  ==               ####     ',
    '                XX       ###                                                                                      #####     ',
    '  1 2    g   j          ####  k   g     k           j     g     k             g   j     k   g           k     g  ###### F   ',
    '##################    ######################     #####################    ######################     #######################',
    '##################~~~~######################~~~~~#####################~~~~######################~~~~~#######################',
  ] },
  { name: '2-1', world: 2, rows: [
    '                                                                                                                      ',
    '                                                                                                                      ',
    '                                                                                                                      ',
    '                                                                                M                                     ',
    '                                                                                ==                                    ',
    '                       oooo                   f                                   f                                   ',
    '                      XXXXXX              f               BBBBBB                                                      ',
    '                          f           BBBSBB                               oooo                                 #     ',
    '      BBMBB                     ==                            f     ==    XXXXXX                   ?    ==     ##     ',
    '                  ==                                  ==                                  ==                  ###     ',
    '                                                                                                             ####     ',
    '  1 2   j   g           k             j     g   k           j             g   j     k           k           #####  F  ',
    '################     #########     #################     #########     #################     #########    ############',
    '################~~~~~#########~~~~~#################~~~~~#########~~~~~#################~~~~~#########~~~~############',
  ] },
  { name: '2-2', world: 2, rows: [
    '                                                                                                                          ',
    '                                                                                                                          ',
    '                                                                                                                          ',
    '                                                  S                                                                       ',
    '                                                  ==                                 f                                    ',
    '                                                                      f                          ooooo                    ',
    '                    XXXXX       BBB?BBB          oooo                                           XXXXXXX                   ',
    '                     f               f          XXXXXX              f           BBBMBBB             f                #    ',
    '     BBMBB                  ==                              ==  BBBBBBB                     ==                ?     ##    ',
    '                ==                        ==                              ==                              ==       ###    ',
    '                                                                                                                  ####    ',
    '  1 2   g  j          k           j             g   k  j          j             k   g  j          j             k##### F  ',
    '##############     #######     #########     #############     #########     #############     #########     #############',
    '##############~~~~~#######~~~~~#########~~~~~#############~~~~~#########~~~~~#############~~~~~#########~~~~~#############',
  ] },
  { name: '2-3', world: 2, rows: [
    '                                                                                                                                  ',
    '                                                                                                                                  ',
    '                                            S                                                                                     ',
    '                                            ==                             f                                                      ',
    '                                                            f          f                                                          ',
    '                                             f                                                      f                             ',
    '                   ooo            f                      f                           f                                       #    ',
    '          f       XXXXX                   XXXXXXX                   BBBBMBBBB        ooo        BBBB?BBBB                   ##    ',
    '     BBMBB                ==  BB?BB                 ==  BBBBB                   ==  XXXXX                   ==      M      ###    ',
    '              ==                      ==                        ==                          ==                            ####    ',
    '                                                                                                                         #####    ',
    '  1 2   j           k           j           g  j          k           j   g k         j           k   j           j   g ###### F  ',
    '############     #######     #######     #########     #######     ###########     #######     ###########     ###################',
    '############~~~~~#######~~~~~#######~~~~~#########~~~~~#######~~~~~###########~~~~~#######~~~~~###########~~~~~###################',
  ] },
  { name: '3-1', world: 3, rows: [
    '                                                                        ',
    '                                                                        ',
    '                                                                        ',
    '                                                                        ',
    '                                                                        ',
    '                                                                        ',
    '                                 f                          ?           ',
    '            f                 oooooo                                    ',
    '      BBMBSB                XXXXXXXXXX    M           ===       ===     ',
    '                      ==                        ==                      ',
    '                                                                        ',
    '  1 2    j    k               j     j                         b      F  ',
    '####################     #####################    ######################',
    '####################~~~~~#####################~~~~######################',
  ] },
];

  // ═══════════════ EDITOR DE PERSONAJE (skins 16x16) ═══════════════
  // Cada skin es una matriz de 16x16 símbolos + una paleta de 9 colores.
  // Símbolos: . vacío · c principal · o peto · s piel · h pelo/bigote
  //           e ojo · b botas · w blanco · y detalle · k acento oscuro
  var SKIN_PRESETS = [
    { id: 'rojo', name: 'Bigotón Rojo',
      pal: { c: '#e03131', o: '#1971c2', s: '#ffc9a0', h: '#4a2c14', e: '#20211f', b: '#5c3a21', w: '#ffffff', y: '#ffd43b', k: '#20211f' },
      rows: [
        '....cccccccc....',
        '...cccccccccc...',
        '..cchhhhhhhhcc..',
        '..hssssssssssh..',
        '..hsseesseessh..',
        '..hssssssssssh..',
        '...hssssssssh...',
        '...hhhhhhhhhh...',
        '...sccccccccs...',
        '..scoooooooocs..',
        '..scooyooyoocs..',
        '...cooooooooc...',
        '....oooooooo....',
        '....ooo..ooo....',
        '...bbbb..bbbb...',
        '..bbbbb..bbbbb..'
      ] },
    { id: 'verde', name: 'Bigotón Verde',
      pal: { c: '#2f9e44', o: '#1098ad', s: '#ffc9a0', h: '#3b2a14', e: '#20211f', b: '#5c3a21', w: '#ffffff', y: '#ffd43b', k: '#20211f' },
      rows: [
        '....cccccccc....',
        '...cccccccccc...',
        '..cchhhhhhhhcc..',
        '..hssssssssssh..',
        '..hsseesseessh..',
        '..hssssssssssh..',
        '...hssssssssh...',
        '...hhhhhhhhhh...',
        '...sccccccccs...',
        '..scoooooooocs..',
        '..scooyooyoocs..',
        '...cooooooooc...',
        '....oooooooo....',
        '....ooo..ooo....',
        '...bbbb..bbbb...',
        '..bbbbb..bbbbb..'
      ] },
    { id: 'robot', name: 'Robot',
      pal: { c: '#adb5bd', o: '#495057', s: '#ced4da', h: '#868e96', e: '#4dd2ff', b: '#343a40', w: '#4dd2ff', y: '#ffd43b', k: '#212529' },
      rows: [
        '.......kk.......',
        '.......yy.......',
        '...cccccccccc...',
        '...ckkkkkkkkc...',
        '...ckeekkeekc...',
        '...ckkkkkkkkc...',
        '...cccccccccc...',
        '....kkkkkkkk....',
        '..ccoooooooocc..',
        '..ccooowwooocc..',
        '..ccoooooooocc..',
        '...oooooooooo...',
        '....oooooooo....',
        '....ooo..ooo....',
        '...bbbb..bbbb...',
        '..bbbbb..bbbbb..'
      ] },
    { id: 'ninja', name: 'Ninja',
      pal: { c: '#343a40', o: '#212529', s: '#ffc9a0', h: '#111111', e: '#20211f', b: '#495057', w: '#f8f9fa', y: '#e03131', k: '#1a1d20' },
      rows: [
        '....kkkkkkkk....',
        '...kkkkkkkkkk...',
        '..kkkkkkkkkkkk..',
        '..kkkkkkkkkkkk..',
        '..kkwewkkwewkk..',
        '..kkkkkkkkkkkk..',
        '...kkkkkkkkkk...',
        '...cccccccccc...',
        '..sccccccccccs..',
        '..sccooooooccs..',
        '..scoooyyooocs..',
        '...cooooooooc...',
        '....oooooooo....',
        '....ooo..ooo....',
        '...bbbb..bbbb...',
        '..bbbbb..bbbbb..'
      ] },
    { id: 'gatito', name: 'Gatito',
      pal: { c: '#ff922b', o: '#f08c00', s: '#ffd8a8', h: '#7a4a00', e: '#20211f', b: '#5c3a21', w: '#fff4e6', y: '#ff6b9d', k: '#3b2a20' },
      rows: [
        '..cc........cc..',
        '..ccc......ccc..',
        '..cccccccccccc..',
        '..cccccccccccc..',
        '..cceecccceecc..',
        '..cccccccccccc..',
        '..ccccwyywcccc..',
        '...cwwwwwwwwc...',
        '...cccccccccc...',
        '..ccoooooooocc..',
        '..ccoowwwwoocc..',
        '...cooooooooc...',
        '....oooooooo....',
        '....ooo..ooo....',
        '...bbbb..bbbb...',
        '..bbbbb..bbbbb..'
      ] },
    { id: 'esqueleto', name: 'Esqueleto',
      pal: { c: '#dee2e6', o: '#495057', s: '#f8f9fa', h: '#adb5bd', e: '#20211f', b: '#343a40', w: '#f1f3f5', y: '#ffd43b', k: '#212529' },
      rows: [
        '....wwwwwwww....',
        '...wwwwwwwwww...',
        '..wwwwwwwwwwww..',
        '..wwwwwwwwwwww..',
        '..wwkkkwwkkkww..',
        '..wwkkkwwkkkww..',
        '...wwwwkkwwww...',
        '...wkwkwkwkw....',
        '...wwwwwwwwww...',
        '..wcoooooooocw..',
        '..wcoowwwwoocw..',
        '...cooooooooc...',
        '....oooooooo....',
        '....www..www....',
        '...wwww..wwww...',
        '..bbbbb..bbbbb..'
      ] }
  ];

  var SKIN_SYMS = ['.', 'c', 'o', 's', 'h', 'e', 'b', 'w', 'y', 'k'];
  var PAL_KEYS  = ['c', 'o', 's', 'h', 'e', 'b', 'w', 'y', 'k'];

  function isHex(v) { return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v); }

  // Deja cualquier skin en un formato seguro: 16 filas de 16 símbolos válidos.
  function normalizeSkin(raw, fallback) {
    var base = fallback || SKIN_PRESETS[0];
    var out = { id: 'custom', name: 'Personalizado', pal: {}, rows: [] };
    raw = raw || {};
    if (typeof raw.name === 'string' && raw.name.trim()) out.name = raw.name.trim().slice(0, 24);
    if (typeof raw.id === 'string') out.id = raw.id.slice(0, 24);
    PAL_KEYS.forEach(function (k) {
      out.pal[k] = isHex(raw.pal && raw.pal[k]) ? raw.pal[k].toLowerCase() : base.pal[k];
    });
    for (var r = 0; r < 16; r++) {
      var src = (raw.rows && typeof raw.rows[r] === 'string') ? raw.rows[r] : base.rows[r];
      var row = '';
      for (var c = 0; c < 16; c++) {
        var ch = src.charAt(c);
        row += (SKIN_SYMS.indexOf(ch) >= 0) ? ch : '.';
      }
      out.rows.push(row);
    }
    return out;
  }
  function cloneSkin(s) { return normalizeSkin(JSON.parse(JSON.stringify(s)), s); }
  // Índice de skin válido 0..3 (acepta true/false por compatibilidad con el editor viejo)
  function skinIdx(i) {
    if (i === true) return 1;
    if (i === false || i === undefined || i === null) return 0;
    i = i | 0;
    return i < 0 ? 0 : (i > 3 ? 3 : i);
  }

  // ─── Código para compartir skins (base64 compacto) ──────────
  function encodeSkin(skin) {
    var s = normalizeSkin(skin), bytes = [];
    var name = s.name.slice(0, 24);
    bytes.push(name.length);
    for (var i = 0; i < name.length; i++) bytes.push(name.charCodeAt(i) & 0xff);
    PAL_KEYS.forEach(function (k) {
      var h = s.pal[k];
      bytes.push(parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16));
    });
    for (var r = 0; r < 16; r++) {
      for (var c = 0; c < 16; c += 2) {
        var hi = SKIN_SYMS.indexOf(s.rows[r].charAt(c));
        var lo = SKIN_SYMS.indexOf(s.rows[r].charAt(c + 1));
        bytes.push(((hi < 0 ? 0 : hi) << 4) | (lo < 0 ? 0 : lo));
      }
    }
    var str = '';
    for (var b = 0; b < bytes.length; b++) str += String.fromCharCode(bytes[b]);
    try { return btoa(str); } catch (e) { return ''; }
  }
  function decodeSkin(code) {
    try {
      var str = atob(String(code).replace(/\s+/g, ''));
      var p = 0, nl = str.charCodeAt(p++), name = '';
      for (var i = 0; i < nl; i++) name += str.charAt(p++);
      var pal = {};
      PAL_KEYS.forEach(function (k) {
        function hx(n) { return ('0' + (n & 0xff).toString(16)).slice(-2); }
        pal[k] = '#' + hx(str.charCodeAt(p)) + hx(str.charCodeAt(p + 1)) + hx(str.charCodeAt(p + 2));
        p += 3;
      });
      var rows = [];
      for (var r = 0; r < 16; r++) {
        var row = '';
        for (var c = 0; c < 8; c++) {
          var byte = str.charCodeAt(p++) & 0xff;
          row += SKIN_SYMS[(byte >> 4) & 0x0f] || '.';
          row += SKIN_SYMS[byte & 0x0f] || '.';
        }
        rows.push(row);
      }
      return normalizeSkin({ id: 'custom', name: name || 'Personalizado', pal: pal, rows: rows });
    } catch (e) { return null; }
  }

  // Skins activas (P1..P4). Por defecto: rojo, verde, robot, ninja.
  var MAX_PLAYERS = 4;
  var PCOL = ['#ff8787', '#8ce99a', '#74c0fc', '#ffd43b'];
  var SKINS = [];
  for (var _i = 0; _i < MAX_PLAYERS; _i++) SKINS.push(cloneSkin(SKIN_PRESETS[_i] || SKIN_PRESETS[0]));

  function loadSkins() {
    var i, k, done = false;
    try {
      var w = window.MARIO_SKINS;
      if (w) {
        for (i = 0; i < MAX_PLAYERS; i++) {
          k = 'p' + (i + 1);
          if (w[k]) { SKINS[i] = normalizeSkin(w[k], SKIN_PRESETS[i] || SKIN_PRESETS[0]); done = true; }
        }
      }
    } catch (e) { }
    if (done) return;
    try {
      var raw = localStorage.getItem('bb_skins');
      if (raw) {
        var o = JSON.parse(raw);
        for (i = 0; i < MAX_PLAYERS; i++) {
          k = 'p' + (i + 1);
          if (o[k]) SKINS[i] = normalizeSkin(o[k], SKIN_PRESETS[i] || SKIN_PRESETS[0]);
        }
      }
    } catch (e) { }
  }
  function saveSkinsLocal() {
    try {
      var o = {};
      for (var i = 0; i < MAX_PLAYERS; i++) o['p' + (i + 1)] = SKINS[i];
      localStorage.setItem('bb_skins', JSON.stringify(o));
    } catch (e) { }
  }

  // ═══════════════ CUARTO SECRETO DE MONEDAS ═══════════════
  // Se entra pulsando "abajo" sobre una tubería marcada (V) y se sale igual.
  var BONUS_ROOM = [
    '#########################',
    '#                       #',
    '#  ooooooooooooooooooo  #',
    '#                       #',
    '#  ooooooooooooooooooo  #',
    '#       BBBBBBBBB       #',
    '#  ooooooooooooooooooo  #',
    '#                       #',
    '#  ooooooooooooooooooo  #',
    '#           ?           #',
    '#                       #',
    '#                 V     #',
    '#########################',
    '#########################'
  ];

  // ═══════════════ SIEMBRA DE CHECKPOINTS Y TUBERÍAS ═══════════════
  // Se hace por código sobre LEVELS para no descuadrar los mapas a mano.
  function seedLevelExtras() {
    LEVELS.forEach(function (lv) {
      var g = lv.rows.map(function (r) { return r.split(''); });
      var cols = 0;
      g.forEach(function (r) { cols = Math.max(cols, r.length); });
      g.forEach(function (r) { while (r.length < cols) r.push(' '); });

      function free(c, r) { return r >= 0 && r < g.length && g[r][c] === ' '; }
      function solid(c, r) { return r >= 0 && r < g.length && '#=XB'.indexOf(g[r][c]) >= 0; }
      function spot(startCol, needAbove) {
        for (var d = 0; d < 26; d++) {
          for (var s = -1; s <= 1; s += 2) {
            var c = startCol + d * s;
            if (c < 6 || c > cols - 8) continue;
            for (var r = g.length - 1; r >= 3; r--) {
              if (!solid(c, r)) continue;
              var ok = true;
              for (var k = 1; k <= needAbove; k++) if (!free(c, r - k)) { ok = false; break; }
              if (ok) return { c: c, r: r };
              break;
            }
          }
        }
        return null;
      }

      // 1) checkpoint a mitad de nivel
      var cp = spot(Math.floor(cols / 2), 3);
      if (cp) g[cp.r - 1][cp.c] = 'C';

      // 2) tubería secreta: reaprovecha una tubería existente si la hay
      var used = false;
      for (var c2 = 0; c2 < cols && !used; c2++) {
        for (var r2 = 1; r2 < g.length; r2++) {
          if (g[r2][c2] === 'T' && g[r2 - 1][c2] !== 'T') { g[r2][c2] = 'V'; used = true; break; }
        }
      }
      if (!used) {
        var pp = spot(Math.floor(cols * 0.62), 4);
        if (pp && (!cp || Math.abs(pp.c - cp.c) > 2)) g[pp.r - 1][pp.c] = 'V';
      }

      lv.rows = g.map(function (r) { return r.join(''); });
    });
  }
  seedLevelExtras();

  // ─── Utilidades ─────────────────────────────────────────────
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ─── Sonido (WebAudio, sin archivos) ────────────────────────
  var AC = null, muted = false;
  function ac() {
    if (!AC) {
      try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
    }
    return AC;
  }
  function beep(freq, dur, type, vol, slideTo) {
    var c = ac(); if (!c || muted) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.06, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }
  var SFX = {
    jump:    function () { beep(420, 0.14, 'square', 0.05, 720); },
    coin:    function () { beep(988, 0.07, 'square', 0.05); setTimeout(function () { beep(1319, 0.12, 'square', 0.05); }, 70); },
    stomp:   function () { beep(180, 0.09, 'square', 0.06, 90); },
    brick:   function () { beep(140, 0.08, 'sawtooth', 0.05, 60); },
    power:   function () { beep(523, 0.08, 'square', 0.05); setTimeout(function () { beep(784, 0.08, 'square', 0.05); }, 80); setTimeout(function () { beep(1046, 0.14, 'square', 0.05); }, 160); },
    hurt:    function () { beep(300, 0.3, 'sawtooth', 0.07, 70); },
    die:     function () { beep(500, 0.5, 'triangle', 0.07, 60); },
    fire:    function () { beep(760, 0.08, 'sawtooth', 0.04, 300); },
    bossHit: function () { beep(120, 0.25, 'sawtooth', 0.09, 40); },
    clear:   function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { beep(f, 0.16, 'square', 0.06); }, i * 130); }); },
    win:     function () { [523, 659, 784, 1046, 784, 1046, 1318].forEach(function (f, i) { setTimeout(function () { beep(f, 0.2, 'square', 0.06); }, i * 160); }); },
    boss:    function () { beep(90, 0.4, 'sawtooth', 0.08, 55); }
  };

  // ─── Estado global del juego ─────────────────────────────────
  var G = null, canvas = null, ctx = null, raf = 0, acc = 0, last = 0;
  var keys = {};

  function newGame(n, net) {
    var count = (n === true) ? 2 : (n === false || n === undefined || n === null) ? 1 : Math.max(1, Math.min(MAX_PLAYERS, n | 0));
    G = {
      state: 'card', twoP: count > 1, nPlayers: count, net: net || null, levelIdx: 0,
      grid: [], cols: 0, w: 0, h: ROWS * TILE,
      players: [], enemies: [], items: [], fires: [], parts: [], bumps: [], coins: [],
      boss: null, flag: null, cam: 0, shake: 0,
      freeze: 0, inBonus: false, saved: null, pipeCd: 0, camY: 0,
      time: 400, timeSub: 0, frame: 0, cardT: 150, msg: '', sub: '',
      sent: 0, bossDead: false, nidSeq: 1
    };
    for (var i = 0; i < count; i++) G.players.push(makePlayer(i));
    loadLevel(0);
  }

  function makePlayer(id) {
    return {
      id: id, x: 0, y: 0, w: 20, h: 26, vx: 0, vy: 0,
      onGround: false, face: 1, power: 0, invuln: 0, star: 0,
      lives: 3, score: 0, coins: 0, dead: false, deadT: 0, out: false,
      jumpHeld: false, coyote: 0, jumpBuf: 0, shootCd: 0, anim: 0,
      sq: 1, vyPrev: 0, skid: 0,
      spawnX: 0, spawnY: 0, done: false, crouch: false
    };
  }

  // ─── Carga de nivel ─────────────────────────────────────────
  function loadLevel(idx) {
    var lv = LEVELS[idx];
    G.levelIdx = idx;
    G.grid = lv.rows.map(function (r) { return r.split(''); });
    G.cols = G.grid[0].length;
    G.w = G.cols * TILE;
    G.enemies = []; G.items = []; G.fires = []; G.parts = []; G.bumps = []; G.coins = [];
    G.boss = null; G.flag = null; G.cam = 0; G.shake = 0; G.bossDead = false;
    G.freeze = 0; G.inBonus = false; G.saved = null; G.pipeCd = 0;
    G.time = (lv.world === 3) ? 300 : 400; G.timeSub = 0;

    var spawn = [{ x: 2 * TILE, y: 11 * TILE }, { x: 4 * TILE, y: 11 * TILE },
                 { x: 3 * TILE, y: 11 * TILE }, { x: 5 * TILE, y: 11 * TILE }];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < G.cols; c++) {
        var ch = G.grid[r][c];
        var px = c * TILE, py = r * TILE;
        if (ch === '1') { spawn[0] = { x: px, y: py }; G.grid[r][c] = ' '; }
        else if (ch === '2') {
          spawn[1] = { x: px + 4, y: py };
          spawn[2] = { x: px - 22, y: py };
          spawn[3] = { x: px + 30, y: py };
          G.grid[r][c] = ' ';
        }
        else if (ch === 'o') { G.coins.push({ x: px + 10, y: py + 8, w: 12, h: 16, t: 0, got: false }); G.grid[r][c] = ' '; }
        else if (ch === 'g' || ch === 'k' || ch === 'j') { G.enemies.push(makeEnemy(ch, px, py, lv.world)); G.grid[r][c] = ' '; }
        else if (ch === 'f') { G.enemies.push(makeEnemy('f', px, py, lv.world)); G.grid[r][c] = ' '; }
        else if (ch === 'b') { G.boss = makeBoss(px, py); G.grid[r][c] = ' '; }
        else if (ch === 'F') { G.flag = { x: px + 8, y: (r - 8) * TILE, w: 10, h: 9 * TILE, taken: false, t: 0 }; G.grid[r][c] = ' '; }
      }
    }
    G.players.forEach(function (p, i) {
      var s = spawn[i] || spawn[i % 2] || spawn[0];
      p.spawnX = s.x; p.spawnY = s.y;
      respawn(p, true);
      p.done = false; p.out = p.lives <= 0;
    });
    G.enemies.forEach(function (e) { e.nid = G.nidSeq++; });
    G.coins.forEach(function (q, i) { q.nid = i; });
    if (G.net) G.net.tiles = [];
    G.state = 'card';
    G.cardT = 130;
    G.msg = 'MUNDO ' + lv.name;
    G.sub = (lv.world === 3) ? '¡CUIDADO: JEFE FINAL!'
          : (G.nPlayers > 1 ? G.nPlayers + ' JUGADORES' : '1 JUGADOR');
  }

  function respawn(p, hard) {
    p.w = p.power > 0 ? 22 : 20;
    p.h = p.power > 0 ? 40 : 26;
    if (hard) {
      p.x = p.spawnX; p.y = p.spawnY - (p.h - 26);
    } else {
      // reaparece en el borde izquierdo de la cámara (estilo cooperativo)
      p.x = G.cam + 60; p.y = 40;
    }
    p.vx = 0; p.vy = 0; p.dead = false; p.deadT = 0; p.invuln = 90; p.star = 0;
  }

  // ─── Mapa ───────────────────────────────────────────────────
  function tile(c, r) {
    if (r < 0) return ' ';
    if (r >= ROWS) return ' ';
    if (c < 0 || c >= G.cols) return '#';   // paredes invisibles a los lados
    return G.grid[r][c];
  }
  function solidAt(c, r) { return SOLID.indexOf(tile(c, r)) >= 0; }
  function setTile(c, r, ch) {
    if (r >= 0 && r < ROWS && c >= 0 && c < G.cols) {
      G.grid[r][c] = ch;
      // en online el host apunta el cambio para mandarlo en el próximo snapshot
      if (G.net && G.net.host && !G.inBonus) G.net.tiles.push([c, r, ch]);
    }
  }
  function hazardAt(c, r) { return tile(c, r) === '~' || tile(c, r) === '^'; }

  // Colisión AABB contra tiles, resolviendo ejes por separado
  function moveX(e) {
    e.x += e.vx;
    var r0 = Math.floor(e.y / TILE), r1 = Math.floor((e.y + e.h - 1) / TILE);
    if (e.vx > 0) {
      var c = Math.floor((e.x + e.w - 1) / TILE);
      for (var r = r0; r <= r1; r++) if (solidAt(c, r)) { e.x = c * TILE - e.w - 0.01; e.vx = 0; e.hitWall = 1; return; }
    } else if (e.vx < 0) {
      var c2 = Math.floor(e.x / TILE);
      for (var r2 = r0; r2 <= r1; r2++) if (solidAt(c2, r2)) { e.x = (c2 + 1) * TILE + 0.01; e.vx = 0; e.hitWall = -1; return; }
    }
  }
  function moveY(e, player) {
    e.y += e.vy;
    var c0 = Math.floor(e.x / TILE), c1 = Math.floor((e.x + e.w - 1) / TILE);
    e.onGround = false;
    if (e.vy > 0) {
      var r = Math.floor((e.y + e.h - 1) / TILE);
      for (var c = c0; c <= c1; c++) if (solidAt(c, r)) { e.y = r * TILE - e.h - 0.01; e.vy = 0; e.onGround = true; return; }
    } else if (e.vy < 0) {
      var r2 = Math.floor(e.y / TILE);
      for (var c2 = c0; c2 <= c1; c2++) {
        if (solidAt(c2, r2)) {
          e.y = (r2 + 1) * TILE + 0.01; e.vy = 0;
          if (player) blockHit(c2, r2, player);
          return;
        }
      }
    }
  }

  function blockHit(c, r, p) {
    var ch = tile(c, r);
    G.bumps.push({ c: c, r: r, t: 10 });
    if (ch === '?') {
      setTile(c, r, 'X'); coinPop(c, r); p.score += 200; p.coins++; checkExtraLife(p); SFX.coin();
    } else if (ch === 'M') {
      setTile(c, r, 'X');
      G.items.push(makeItem(p.power === 0 ? 'mush' : 'flower', c * TILE + 5, r * TILE - 24));
      SFX.power();
    } else if (ch === 'S') {
      setTile(c, r, 'X');
      G.items.push(makeItem('star', c * TILE + 5, r * TILE - 24));
      SFX.power();
    } else if (ch === 'B') {
      if (p.power > 0) {
        setTile(c, r, ' '); p.score += 50; SFX.brick();
        for (var i = 0; i < 8; i++) G.parts.push({ x: c * TILE + 16, y: r * TILE + 16, vx: rnd(-3, 3), vy: rnd(-5, -1), t: 40, col: '#c1663a', s: 5 });
      } else { SFX.brick(); }
    }
  }
  function coinPop(c, r) {
    G.parts.push({ x: c * TILE + 12, y: r * TILE - 8, vx: 0, vy: -7, t: 34, col: '#ffd93d', s: 10, coin: true });
  }
  function checkExtraLife(p) {
    if (p.coins >= 100) { p.coins -= 100; p.lives++; SFX.power(); }
  }

  // ─── Enemigos ───────────────────────────────────────────────
  function nextNid() { return G ? G.nidSeq++ : 0; }

  function makeEnemy(kind, px, py, world) {
    var wm = 1 + ((world || 1) - 1) * 0.16;      // mundos 2 y 3: más rápidos
    var e = {
      kind: kind, x: px + 5, y: py + 6, w: 22, h: 26, vx: 0, vy: 0,
      dead: 0, state: '', t: 0, anim: 0, baseY: py + 6, baseX: px + 5,
      dir: -1, spd: 1.1 * wm, turnCd: 0, awake: false, agro: 0, alert: 0
    };
    if (kind === 'g') { e.h = 22; e.y = py + 10; e.baseY = e.y; e.spd = 1.05 * wm; }
    if (kind === 'k') { e.spd = 1.3 * wm; }
    if (kind === 'j') { e.h = 24; e.y = py + 8; e.baseY = e.y; e.spd = 1.45 * wm; e.jt = 20 + Math.random() * 50; }
    if (kind === 'f') { e.w = 26; e.h = 22; e.spd = 1.8 * wm; e.range = 90; }
    e.vx = e.dir * e.spd;
    return e;
  }

  // Gira al enemigo conservando la velocidad (antes se multiplicaba por 0
  // después de un choque y el enemigo se quedaba clavado para siempre).
  function turnEnemy(e, keepSpd, cd) {
    e.dir = -e.dir;
    var mag = Math.abs(keepSpd === undefined ? e.vx : keepSpd);
    if (mag < 0.2) mag = e.spd;
    e.vx = e.dir * mag;
    e.turnCd = cd || 10;
  }

  function updateEnemy(e) {
    e.t++; e.anim++;
    if (e.dead) { e.dead--; if (e.kind === 'flip') { e.vy += GRAV; e.y += e.vy; e.x += e.vx; } return; }

    // Solo despiertan cerca de la cámara, y una vez despiertos no se duermen.
    if (!e.awake) {
      if (e.x > G.cam - 160 && e.x < G.cam + VIEW_W + 240) e.awake = true;
      else return;
    }
    if (e.turnCd > 0) e.turnCd--;
    if (e.alert > 0) e.alert--;

    var tgt = nearestPlayer(e.x + e.w / 2);
    var dx = tgt ? (tgt.x + tgt.w / 2) - (e.x + e.w / 2) : 1e9;
    var adx = Math.abs(dx);
    var dy = tgt ? (tgt.y + tgt.h) - (e.y + e.h) : 1e9;

    // ── Volador: patrulla en el aire y se lanza en picado ──
    if (e.kind === 'f') {
      if (e.state === 'dive') {
        e.vy = Math.min(e.vy + 0.4, 9);
        e.y += e.vy; e.x += e.vx;
        var floorR = Math.floor((e.y + e.h + 2) / TILE);
        var floorC = Math.floor((e.x + e.w / 2) / TILE);
        if (solidAt(floorC, floorR) || e.y > e.baseY + 190 || (tgt && e.y > tgt.y + 70)) {
          e.state = 'back'; e.vy = 0;
        }
        return;
      }
      if (e.state === 'back') {
        e.y -= 2.4; e.x += e.vx * 0.5;
        if (e.y <= e.baseY) { e.y = e.baseY; e.state = ''; e.vy = 0; e.alert = 90; }
        return;
      }
      var pvxf = e.vx;
      e.hitWall = 0; moveX(e);
      if (e.hitWall) turnEnemy(e, pvxf, 12);
      e.y = e.baseY + Math.sin(e.t / 26) * e.range * 0.35;
      if (tgt && adx < 120 && dy > 20 && e.alert <= 0 && Math.random() < 0.05) {
        e.state = 'dive'; e.vy = 2; e.vx = (dx > 0 ? 1 : -1) * e.spd * 1.15;
      }
      return;
    }

    // ── Saltarín con pinchos: temporiza el salto según el jugador ──
    if (e.kind === 'j') {
      e.jt--;
      var cerca = tgt && adx < 210;
      if (cerca && e.turnCd <= 0 && (dx > 0) !== (e.dir > 0)) { e.dir = dx > 0 ? 1 : -1; e.turnCd = 20; }
      if (e.onGround && (e.jt <= 0 || (cerca && adx < 110 && Math.random() < 0.08))) {
        e.vy = (tgt && dy < -40) ? -11.2 : -8.8;      // salta más alto si el jugador está arriba
        e.jt = 45 + Math.random() * 45;
      }
    }

    // ── Caminantes: persiguen cuando el jugador está cerca y a su altura ──
    if (e.kind === 'g' || e.kind === 'k') {
      var mismaAltura = tgt && Math.abs(dy) < 46;
      if (e.state !== 'shell' && tgt && mismaAltura && adx < 180) {
        e.agro = 70;
        if (e.turnCd <= 0 && (dx > 0) !== (e.dir > 0)) { e.dir = dx > 0 ? 1 : -1; e.turnCd = 26; }
      } else if (e.agro > 0) e.agro--;
    }

    if (e.state === 'shell') {
      e.t2 = (e.t2 || 0) + 1;
      if (Math.abs(e.vx) < 0.2 && e.t2 > 420) { e.state = ''; e.dir = -1; e.vx = -e.spd; e.t2 = 0; }
    } else if (e.kind !== 'j' || e.onGround) {
      e.vx = e.dir * e.spd * (e.agro > 0 ? 1.7 : 1);
    }

    e.vy = Math.min(e.vy + GRAV, MAX_FALL);
    var pvx = e.vx;
    e.hitWall = 0;
    moveX(e);
    if (e.hitWall) turnEnemy(e, pvx, 8);
    moveY(e, null);

    // No caerse de las plataformas (con enfriamiento para que no vibre en los bordes)
    if (e.onGround && e.turnCd <= 0 && e.kind !== 'j' && !(e.state === 'shell' && Math.abs(e.vx) > 2)) {
      var ahead = Math.floor((e.x + (e.dir > 0 ? e.w + 3 : -3)) / TILE);
      var below = Math.floor((e.y + e.h + 6) / TILE);
      if (!solidAt(ahead, below) && !solidAt(ahead, below + 1)) turnEnemy(e, e.spd, 22);
    }

    if (e.y > ROWS * TILE + 200) e.remove = true;

    // caparazón lanzado mata a otros enemigos
    if (e.state === 'shell' && Math.abs(e.vx) > 2) {
      G.enemies.forEach(function (o) {
        if (o !== e && !o.dead && overlap(e, o)) { killEnemy(o, null, true); }
      });
      if (G.boss && !G.boss.dead && overlap(e, G.boss)) damageBoss(1, null);
    }
  }

  function killEnemy(e, p, flip) {
    e.dead = flip ? 60 : 22;
    if (flip) { e.kind = 'flip'; e.vy = -7; e.vx = rnd(-2, 2); }
    if (p) { p.score += (e.kind === 'j' ? 300 : e.kind === 'f' ? 200 : 100); }
    G.freeze = Math.max(G.freeze, 4);
    SFX.stomp();
    for (var i = 0; i < 6; i++) G.parts.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: rnd(-2, 2), vy: rnd(-3, -0.5), t: 24, col: '#ffffff', s: 3 });
  }

  // ─── Objetos (hongo, flor, estrella) ────────────────────────
  function makeItem(kind, x, y) {
    return { nid: nextNid(), kind: kind, x: x, y: y, w: 22, h: 22, vx: kind === 'flower' ? 0 : 1.6, vy: -2, t: 0 };
  }
  function updateItem(it) {
    it.t++;
    if (it.kind === 'flower') { it.y += Math.sin(it.t / 14) * 0.25; return; }
    it.vy = Math.min(it.vy + GRAV, MAX_FALL);
    var pvx = it.vx;
    it.hitWall = 0; moveX(it);
    if (it.hitWall) it.vx = -(Math.abs(pvx) < 0.2 ? 1.6 : pvx);
    moveY(it, null);
    if (it.kind === 'star' && it.onGround) it.vy = -8.5;
    if (it.y > VIEW_H + 200) it.remove = true;
  }

  // ─── Bolas de fuego ─────────────────────────────────────────
  function shoot(p) {
    if (p.power < 2 || p.shootCd > 0) return;
    p.shootCd = 22;
    G.fires.push({ nid: nextNid(), x: p.x + (p.face > 0 ? p.w : -10), y: p.y + p.h * 0.4, w: 12, h: 12, vx: 7 * p.face, vy: 1, t: 0, owner: p, enemy: false });
    SFX.fire();
  }
  function updateFire(f) {
    f.t++;
    f.vy = Math.min(f.vy + 0.35, 8);
    f.hitWall = 0; moveX(f); if (f.hitWall) f.remove = true;
    moveY(f, null);
    if (f.onGround) f.vy = -5.4;
    if (f.t > 200 || f.y > VIEW_H + 100) f.remove = true;
    if (f.enemy) {
      G.players.forEach(function (p) { if (!p.dead && !p.out && overlap(f, p)) { hurt(p); f.remove = true; } });
    } else {
      G.enemies.forEach(function (e) {
        if (!e.dead && overlap(f, e)) { killEnemy(e, f.owner, true); f.remove = true; }
      });
      if (G.boss && !G.boss.dead && overlap(f, G.boss)) { damageBoss(1, f.owner); f.remove = true; }
    }
  }

  // ─── JEFE FINAL ─────────────────────────────────────────────
  function makeBoss(px, py) {
    return {
      x: px, y: py * 1 - 40, w: 62, h: 70, vx: 0, vy: 0, hp: 12, maxHp: 12,
      inv: 0, t: 0, act: 0, phase: 1, dead: 0, mouth: 0, onGround: false, hurtFlash: 0
    };
  }
  function damageBoss(n, p) {
    var b = G.boss;
    if (!b || b.inv > 0 || b.dead) return;
    b.hp -= n; b.inv = 40; b.hurtFlash = 20; G.freeze = Math.max(G.freeze, 8); G.shake = Math.max(G.shake, 8);
    if (p) p.score += 500;
    SFX.bossHit();
    if (b.hp <= 5 && b.phase === 1) { b.phase = 2; SFX.boss(); }
    if (b.hp <= 0) {
      b.dead = 1; G.bossDead = true; G.shake = 30; SFX.win();
      for (var i = 0; i < 40; i++) G.parts.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vx: rnd(-7, 7), vy: rnd(-9, 2), t: 70, col: i % 2 ? '#ffd93d' : '#ff5a3c', s: 7 });
    }
  }
  function updateBoss() {
    var b = G.boss; if (!b) return;
    b.t++; if (b.inv > 0) b.inv--; if (b.hurtFlash > 0) b.hurtFlash--;
    if (b.dead) { b.dead++; return; }

    var target = nearestPlayer(b.x + b.w / 2);
    var speed = b.phase === 2 ? 2.9 : 2.1;
    b.act--;
    if (b.onGround && b.act <= 0) {
      var dir = target ? (target.x > b.x ? 1 : -1) : 1;
      var mode = Math.random();
      if (mode < 0.45) {                    // salto de aplastamiento
        b.vy = -13; b.vx = dir * speed; b.act = 70;
      } else if (mode < 0.8) {              // escupe fuego
        b.mouth = 24; b.act = b.phase === 2 ? 60 : 80;
        var n = b.phase === 2 ? 4 : 3;
        for (var i = 0; i < n; i++) {
          G.fires.push({
            nid: nextNid(),
            x: b.x + (dir > 0 ? b.w : -12), y: b.y + 22, w: 14, h: 14,
            vx: dir * (4 + i * 0.7), vy: -3 - i * 0.8, t: 0, enemy: true
          });
        }
        SFX.boss();
      } else {                              // embestida
        b.vx = dir * speed * 1.6; b.act = 55;
      }
    }
    b.vy = Math.min(b.vy + GRAV * 0.95, MAX_FALL);
    var wasAir = !b.onGround;
    b.hitWall = 0; moveX(b); if (b.hitWall) b.vx *= -1;
    moveY(b, null);
    if (b.onGround) {
      if (wasAir) {   // onda de choque al caer
        G.shake = 12; SFX.stomp();
        for (var k = 0; k < 12; k++) G.parts.push({ x: b.x + b.w / 2, y: b.y + b.h, vx: rnd(-6, 6), vy: rnd(-4, -1), t: 26, col: '#c9a227', s: 5 });
      }
      b.vx *= 0.86;
    }
    if (b.mouth > 0) b.mouth--;

    // contacto con los jugadores
    G.players.forEach(function (p) {
      if (p.dead || p.out || !overlap(p, b)) return;
      var fromTop = p.vy > 1.5 && (p.y + p.h) - b.y < 26;
      if (fromTop) { p.vy = -10.5; damageBoss(1, p); }
      else if (p.star > 0) { damageBoss(2, p); }
      else hurt(p);
    });
  }
  function nearestPlayer(x) {
    var best = null, bd = 1e9;
    G.players.forEach(function (p) {
      if (p.dead || p.out) return;
      var d = Math.abs(p.x - x);
      if (d < bd) { bd = d; best = p; }
    });
    return best;
  }

  // ─── Efectos (game feel) ────────────────────────────────────
  function dust(x, y, n, col) {
    for (var i = 0; i < n; i++) {
      G.parts.push({
        x: x + rnd(-6, 6), y: y - rnd(0, 4), vx: rnd(-1.8, 1.8), vy: rnd(-2.2, -0.4),
        t: 18 + Math.random() * 10, col: col || 'rgba(240,232,210,0.9)', s: 2 + Math.random() * 3
      });
    }
  }

  // ─── Checkpoint a mitad de nivel ────────────────────────────
  function activateCheckpoint(c, r) {
    setTile(c, r, 'c');
    G.checkpoint = { c: c, r: r };
    G.players.forEach(function (q) { q.spawnX = c * TILE; q.spawnY = r * TILE; });
    G.freeze = Math.max(G.freeze, 4);
    for (var i = 0; i < 18; i++) {
      G.parts.push({
        x: c * TILE + 16, y: r * TILE + 20, vx: rnd(-3, 3), vy: rnd(-5, -1),
        t: 34, col: i % 2 ? '#51cf66' : '#ffd43b', s: 4
      });
    }
    SFX.coin(); setTimeout(function () { SFX.power(); }, 90);
  }

  // ─── Tuberías secretas y cuarto de monedas ──────────────────
  function enterBonus(force) {
    if (G.inBonus || (!force && G.pipeCd > 0)) return;
    G.saved = {
      grid: G.grid, cols: G.cols, w: G.w, enemies: G.enemies, coins: G.coins,
      items: G.items, fires: G.fires, boss: G.boss, flag: G.flag, cam: G.cam,
      pos: G.players.map(function (q) { return { x: q.x, y: q.y }; })
    };
    G.inBonus = true; G.pipeCd = 45;
    G.grid = BONUS_ROOM.map(function (r) { return r.split(''); });
    G.cols = G.grid[0].length; G.w = G.cols * TILE;
    G.enemies = []; G.items = []; G.fires = []; G.coins = []; G.boss = null; G.flag = null; G.cam = 0;
    for (var r = 0; r < G.grid.length; r++) {
      for (var c = 0; c < G.cols; c++) {
        if (G.grid[r][c] === 'o') {
          G.coins.push({ x: c * TILE + 10, y: r * TILE + 8, w: 12, h: 16, t: 0, got: false });
          G.grid[r][c] = ' ';
        }
      }
    }
    G.players.forEach(function (q, i) {
      q.x = (2 + i * 1.2) * TILE; q.y = 10 * TILE - (q.h - 26); q.vx = 0; q.vy = 0;
    });
    SFX.power();
  }
  function exitBonus(force) {
    if (!G.inBonus || !G.saved || (!force && G.pipeCd > 0)) return;
    var sv = G.saved;
    G.grid = sv.grid; G.cols = sv.cols; G.w = sv.w;
    G.enemies = sv.enemies; G.coins = sv.coins; G.items = sv.items;
    G.fires = sv.fires; G.boss = sv.boss; G.flag = sv.flag; G.cam = sv.cam;
    G.players.forEach(function (q, i) {
      var pos = sv.pos[i] || sv.pos[0];
      q.x = pos.x; q.y = pos.y - 4; q.vx = 0; q.vy = 0;
    });
    G.inBonus = false; G.saved = null; G.pipeCd = 45;
    SFX.power();
  }

  // ─── Jugador ────────────────────────────────────────────────
  var LOCAL_CTRL = [
    { left: 'a', right: 'd', jump: 'w', down: 's' },
    { left: 'arrowleft', right: 'arrowright', jump: 'arrowup', down: 'arrowdown' }
  ];
  function readCtrl(m) {
    return { left: !!keys[m.left], right: !!keys[m.right], jump: !!keys[m.jump], down: !!keys[m.down] };
  }
  // En online cada persona juega con SU teclado completo: sirven WASD y las flechas.
  function readAnyCtrl() {
    return {
      left: !!(keys['a'] || keys['arrowleft']),
      right: !!(keys['d'] || keys['arrowright']),
      jump: !!(keys['w'] || keys['arrowup'] || keys[' ']),
      down: !!(keys['s'] || keys['arrowdown'])
    };
  }
  function ctrlOf(p) {
    if (G.net) {
      if (p.id === G.net.myId) return readAnyCtrl();
      var r = G.net.inputs[p.id];
      return r ? { left: !!r.l, right: !!r.r, jump: !!r.j, down: !!r.d }
               : { left: false, right: false, jump: false, down: false };
    }
    // En local con 3-4 jugadores, P3 comparte teclas con P1 y P4 con P2.
    return readCtrl(LOCAL_CTRL[p.id % LOCAL_CTRL.length]);
  }

  function updatePlayer(p) {
    if (p.out) return;
    if (p.dead) {
      p.deadT--;
      p.vy = Math.min(p.vy + GRAV * 0.7, MAX_FALL); p.y += p.vy;
      if (p.deadT <= 0) {
        if (p.lives <= 0) { p.out = true; return; }
        var other = G.players.filter(function (o) { return o !== p && !o.out && !o.dead; })[0];
        p.power = 0;
        respawn(p, !other);
      }
      return;
    }
    var c = ctrlOf(p);
    if (p.invuln > 0) p.invuln--;
    if (p.star > 0) p.star--;
    if (p.shootCd > 0) p.shootCd--;

    // movimiento horizontal
    if (c.left && !c.right) { p.vx -= ACC; p.face = -1; }
    else if (c.right && !c.left) { p.vx += ACC; p.face = 1; }
    else { p.vx *= p.onGround ? FRIC : AIR_FRIC; if (Math.abs(p.vx) < 0.08) p.vx = 0; }
    p.vx = clamp(p.vx, -MAX_SPD, MAX_SPD);

    // salto con coyote time y buffer
    if (p.onGround) p.coyote = 6; else if (p.coyote > 0) p.coyote--;
    if (c.jump && !p.jumpHeld) p.jumpBuf = 8;
    if (p.jumpBuf > 0) p.jumpBuf--;
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = JUMP_V; p.onGround = false; p.coyote = 0; p.jumpBuf = 0; p.sq = 1.24;
      dust(p.x + p.w / 2, p.y + p.h, 4); SFX.jump();
    }
    p.jumpHeld = !!c.jump;

    // disparo
    if (c.down && p.power === 2) shoot(p);

    // gravedad: más suave si mantiene el salto (salto variable)
    var g = (p.vy < 0 && p.jumpHeld) ? GRAV_HOLD : GRAV;
    p.vy = Math.min(p.vy + g, MAX_FALL);

    moveX(p);
    p.x = clamp(p.x, 0, G.w - p.w);
    var eraAire = !p.onGround, vyAntes = p.vy;
    moveY(p, p);
    if (Math.abs(p.vx) > 0.3) p.anim += Math.abs(p.vx) * 0.35;

    // aterrizaje: squash + polvo
    if (p.onGround && eraAire && vyAntes > 3.2) {
      p.sq = clamp(0.98 - vyAntes * 0.035, 0.66, 0.94);
      dust(p.x + p.w / 2, p.y + p.h, vyAntes > 9 ? 8 : 5);
      if (vyAntes > 10) G.shake = Math.max(G.shake, 3);
    }
    // derrape: polvo cuando frena en seco
    var frena = p.onGround && Math.abs(p.vx) > 2.2 &&
      ((c.left && p.vx > 0) || (c.right && p.vx < 0));
    if (frena && G.frame % 4 === 0) dust(p.x + p.w / 2, p.y + p.h, 2);
    p.sq += (1 - p.sq) * 0.16;
    if (!p.onGround) p.sq += ((p.vy < -2 ? 1.12 : 1) - p.sq) * 0.12;
    p.vyPrev = p.vy;

    // checkpoint / tubería secreta bajo los pies
    var tc = Math.floor((p.x + p.w / 2) / TILE);
    var tr = Math.floor((p.y + p.h / 2) / TILE);
    if (tile(tc, tr) === 'C') activateCheckpoint(tc, tr);
    if (G.pipeCd > 0) G.pipeCd--;
    if (p.onGround && c.down && G.pipeCd <= 0) {
      var pr = Math.floor((p.y + p.h + 4) / TILE);
      if (tile(tc, pr) === 'V') { if (G.inBonus) exitBonus(); else enterBonus(); return; }
    }

    // no dejar que se quede detrás de la cámara
    if (p.x < G.cam + 4) { p.x = G.cam + 4; if (p.vx < 0) p.vx = 0; }

    // pinchos / lava / caída al vacío
    var cx = Math.floor((p.x + p.w / 2) / TILE);
    if (hazardAt(cx, Math.floor((p.y + p.h - 2) / TILE))) die(p);
    if (p.y > ROWS * TILE + 60) die(p);

    // monedas
    G.coins.forEach(function (co) {
      if (!co.got && overlap(p, co)) { co.got = true; p.coins++; p.score += 200; checkExtraLife(p); SFX.coin(); }
    });
    // objetos
    G.items.forEach(function (it) {
      if (it.remove || !overlap(p, it)) return;
      it.remove = true;
      if (it.kind === 'mush') { if (p.power < 1) grow(p, 1); else p.score += 1000; }
      else if (it.kind === 'flower') { grow(p, 2); }
      else { p.star = 600; p.score += 1000; }
      p.score += 1000; SFX.power();
    });
    // enemigos
    G.enemies.forEach(function (e) {
      if (e.dead || !overlap(p, e)) return;
      if (p.star > 0) { killEnemy(e, p, true); return; }
      var fromTop = p.vy > 1 && (p.y + p.h) - e.y < 20;
      if (e.kind === 'j' && e.state !== 'shell') {          // pinchos: no se pisa
        hurt(p); return;
      }
      if (fromTop) {
        p.vy = p.jumpHeld ? -11 : -7.5;
        if (e.kind === 'k') {
          if (e.state !== 'shell') { e.state = 'shell'; e.vx = 0; e.t2 = 0; p.score += 100; SFX.stomp(); }
          else if (Math.abs(e.vx) > 2) { e.vx = 0; }
          else { e.vx = (p.x + p.w / 2 < e.x + e.w / 2 ? 5.6 : -5.6); e.t2 = 0; SFX.stomp(); }
        } else killEnemy(e, p, false);
      } else if (e.state === 'shell' && Math.abs(e.vx) < 0.2) {
        e.vx = (p.x + p.w / 2 < e.x + e.w / 2 ? 5.6 : -5.6); e.t2 = 0; SFX.stomp();
      } else hurt(p);
    });
    // meta
    if (G.flag && !G.flag.taken && !p.done && p.x + p.w > G.flag.x - 6 && p.y + p.h > G.flag.y) {
      if (LEVELS[G.levelIdx].world === 3 && !G.bossDead) { /* la meta se abre al vencer al jefe */ }
      else { G.flag.taken = true; p.done = true; p.score += 1000 + G.time * 10; levelClear(); }
    }
  }

  function grow(p, lvl) {
    var wasSmall = p.power === 0;
    p.power = lvl;
    p.w = 22; p.h = 40;
    if (wasSmall) p.y -= 14;
  }
  function hurt(p) {
    if (p.invuln > 0 || p.star > 0 || p.dead) return;
    if (p.power > 0) {
      p.power = p.power === 2 ? 1 : 0;
      if (p.power === 0) { p.w = 20; p.h = 26; p.y += 14; }
      p.invuln = 100; G.freeze = Math.max(G.freeze, 6); SFX.hurt();
    } else die(p);
  }
  function die(p) {
    if (p.dead) return;
    p.dead = true; p.deadT = 90; p.vy = -9; p.lives--; p.power = 0; G.freeze = Math.max(G.freeze, 8);
    p.w = 20; p.h = 26; SFX.die();
    if (G.players.every(function (q) { return q.out || (q.dead && q.lives <= 0); })) {
      setTimeout(gameOver, 900);
    }
  }

  // ─── Fin de nivel / partida ─────────────────────────────────
  function levelClear() {
    if (G && G.net && !G.net.host) return;
    G.state = 'clear'; G.cardT = 170; SFX.clear();
    var lv = LEVELS[G.levelIdx];
    G.msg = '¡MUNDO ' + lv.name + ' COMPLETADO!';
    G.sub = 'Bonus de tiempo: ' + (G.time * 10);
    sendScore();
  }
  function gameOver() {
    if (G && G.net && !G.net.host) return;
    if (G.state === 'over' || G.state === 'victory') return;
    G.state = 'over'; G.cardT = 99999;
    G.msg = 'FIN DEL JUEGO';
    G.sub = 'Enter para volver a empezar';
    sendScore();
  }
  function victory() {
    if (G && G.net && !G.net.host) return;
    G.state = 'victory'; G.cardT = 99999;
    G.msg = '¡GANARON!';
    G.sub = 'Derrotaron al Rey Espina · Enter para el menú';
    SFX.win(); sendScore();
  }
  function nextLevel() {
    if (G && G.net && !G.net.host) return;
    if (G.levelIdx + 1 >= LEVELS.length) { victory(); return; }
    G.players.forEach(function (p) { p.done = false; });
    loadLevel(G.levelIdx + 1);
  }
  function totalScore() {
    return G.players.reduce(function (s, p) { return s + p.score; }, 0);
  }
  function myScore() {
    if (G.net) { var me = G.players[G.net.myId]; return me ? me.score : 0; }
    return totalScore();
  }
  function sendScore() {
    var pts = myScore();
    if (pts <= G.sent) return;
    G.sent = pts;
    try {
      fetch('/guardar_puntaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ juego: 'mario', puntos: pts })
      }).catch(function () { });
    } catch (e) { }
  }

  // ─── Actualización general ──────────────────────────────────
  function update() {
    G.frame++;
    if (G.shake > 0) G.shake--;
    if (G.freeze > 0) { G.freeze--; return; }   // hit-stop: congela un instante el impacto

    if (G.state === 'card' || G.state === 'clear') {
      G.cardT--;
      if (G.cardT <= 0) {
        if (G.state === 'clear') nextLevel();
        else G.state = 'play';
      }
      return;
    }
    if (G.state !== 'play') return;

    // tiempo
    G.timeSub++;
    if (G.timeSub >= 26) {
      G.timeSub = 0; G.time--;
      if (G.time <= 0) { G.time = 0; G.players.forEach(function (p) { if (!p.out) die(p); }); }
    }

    G.players.forEach(updatePlayer);
    G.enemies.forEach(updateEnemy);
    G.items.forEach(updateItem);
    G.fires.forEach(updateFire);
    if (G.boss) updateBoss();

    // partículas
    G.parts.forEach(function (q) {
      q.t--; q.x += q.vx; q.y += q.vy; q.vy += q.coin ? 0.42 : 0.3;
    });
    G.bumps.forEach(function (b) { b.t--; });

    G.enemies = G.enemies.filter(function (e) { return !e.remove && !(e.dead === 1 && e.kind !== 'flip') && e.dead !== -1; });
    G.enemies = G.enemies.filter(function (e) { return !(e.dead > 0 && e.dead <= 1); });
    G.items = G.items.filter(function (i) { return !i.remove; });
    G.fires = G.fires.filter(function (f) { return !f.remove; });
    G.parts = G.parts.filter(function (q) { return q.t > 0; });
    G.bumps = G.bumps.filter(function (b) { return b.t > 0; });

    // jefe derrotado: la meta se abre
    if (G.boss && G.bossDead && G.boss.dead > 90 && G.state === 'play') {
      var alive = G.players.filter(function (p) { return !p.out; });
      if (alive.length) { G.boss = null; }
    }

    // cámara: zona muerta + anticipación según la velocidad del que va delante
    var lead = -1e9, leadVx = 0, any = false;
    G.players.forEach(function (p) {
      if (p.out || p.dead) return;
      any = true;
      if (p.x > lead) { lead = p.x; leadVx = p.vx; }
    });
    if (any) {
      var look = clamp(leadVx * 16, -70, 70);
      var target = clamp(lead - VIEW_W * 0.42 + look, 0, Math.max(0, G.w - VIEW_W));
      var d = target - G.cam;
      if (Math.abs(d) > 6) G.cam += d * (G.inBonus ? 0.2 : 0.09);
      if (G.cam < 0) G.cam = 0;
    }
    if (G.players.every(function (p) { return p.out; })) gameOver();
  }

  // ═══════════════ RENDER (pixel art por código) ═══════════════
  function px(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, Math.ceil(w), Math.ceil(h)); }

  var THEME = [
    null,
    { sky1: '#6cc6ff', sky2: '#bfeaff', hill: '#3aa74a', hill2: '#2d8a3c', dirt: '#8b5a2b', dirtTop: '#4caf50', brick: '#c1663a', cloud: '#ffffff' },
    { sky1: '#2b1b4d', sky2: '#6d2f6b', hill: '#4a2b6b', hill2: '#38215a', dirt: '#5b3a6b', dirtTop: '#8e5bb5', brick: '#7a4b8f', cloud: '#d8c8f0' },
    { sky1: '#2a0d10', sky2: '#7a1f1f', hill: '#4a1414', hill2: '#360f0f', dirt: '#4a2626', dirtTop: '#a33', brick: '#8a3030', cloud: '#ffb3a0' }
  ];

  // ruido determinista (para que los fondos no parpadeen)
  function hash(n) { var x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }

  function drawBackground(th) {
    var cam = G ? G.cam : 0;
    var world = (G && LEVELS[G.levelIdx]) ? LEVELS[G.levelIdx].world : 1;
    if (G && G.inBonus) { drawBgBonus(); return; }
    if (world === 2) drawBgCaverna(th, cam);
    else if (world === 3) drawBgCastillo(th, cam);
    else drawBgPradera(th, cam);
  }

  function sky(c1, c2) {
    var g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // ── MUNDO 1: pradera con sol, montañas, arbustos y pájaros ──
  function drawBgPradera(th, cam) {
    sky('#4aa8e0', '#cdf0ff');
    // sol con brillo
    var sx = 96, sy = 78;
    ctx.fillStyle = 'rgba(255,236,150,0.20)';
    ctx.beginPath(); ctx.arc(sx, sy, 56, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,170,0.35)';
    ctx.beginPath(); ctx.arc(sx, sy, 38, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.arc(sx, sy, 24, 0, 7); ctx.fill();

    // montañas lejanas
    var o1 = (cam * 0.12) % 300;
    for (var i = -1; i < 5; i++) {
      var mx = i * 300 - o1;
      ctx.fillStyle = '#7fb8d8';
      ctx.beginPath(); ctx.moveTo(mx, 300); ctx.lineTo(mx + 110, 150); ctx.lineTo(mx + 230, 300); ctx.fill();
      ctx.fillStyle = '#eaf6ff';
      ctx.beginPath(); ctx.moveTo(mx + 90, 178); ctx.lineTo(mx + 110, 150); ctx.lineTo(mx + 132, 180);
      ctx.lineTo(mx + 118, 172); ctx.lineTo(mx + 104, 184); ctx.fill();
    }
    // nubes
    var o2 = (cam * 0.28) % 380;
    for (var n = -1; n < 4; n++) {
      var cx = n * 380 - o2 + 40, cy = 52 + (n % 2) * 46;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      px(cx, cy, 70, 16, 'rgba(255,255,255,0.92)');
      px(cx + 16, cy - 13, 40, 15, 'rgba(255,255,255,0.92)');
      px(cx + 36, cy + 11, 50, 12, 'rgba(255,255,255,0.85)');
    }
    // pájaros
    for (var b = 0; b < 3; b++) {
      var bx = (VIEW_W + 120 - ((G ? G.frame : 0) * (0.5 + b * 0.16) + b * 260) % (VIEW_W + 240)) - 60;
      var by = 108 + b * 26 + Math.sin((G ? G.frame : 0) / 40 + b) * 8;
      var flap = Math.sin((G ? G.frame : 0) / 6 + b) * 4;
      ctx.strokeStyle = 'rgba(40,60,80,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + flap); ctx.lineTo(bx, by); ctx.lineTo(bx + 6, by + flap);
      ctx.stroke();
    }
    // colinas verdes en dos capas
    var o3 = (cam * 0.45) % 340;
    for (var j = -1; j < 5; j++) {
      var hx = j * 340 - o3;
      ctx.fillStyle = '#2f8f42';
      ctx.beginPath(); ctx.moveTo(hx, VIEW_H); ctx.lineTo(hx + 95, VIEW_H - 128); ctx.lineTo(hx + 200, VIEW_H); ctx.fill();
      ctx.fillStyle = '#3faa53';
      ctx.beginPath(); ctx.moveTo(hx + 140, VIEW_H); ctx.lineTo(hx + 232, VIEW_H - 82); ctx.lineTo(hx + 330, VIEW_H); ctx.fill();
    }
    // arbustos y vallas cercanas
    var o4 = (cam * 0.72) % 200;
    for (var k = -1; k < 6; k++) {
      var ax = k * 200 - o4 + 30;
      ctx.fillStyle = '#2b7f3c';
      ctx.beginPath(); ctx.arc(ax, VIEW_H - 76, 22, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(ax + 26, VIEW_H - 76, 15, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#3d9a4e';
      ctx.beginPath(); ctx.arc(ax - 4, VIEW_H - 80, 13, Math.PI, 0); ctx.fill();
    }
  }

  // ── MUNDO 2: caverna con estalactitas, cristales y niebla ──
  function drawBgCaverna(th, cam) {
    sky('#160f2e', '#3a1d4d');
    // cristales al fondo
    var o1 = (cam * 0.2) % 260;
    for (var i = -1; i < 5; i++) {
      var cx = i * 260 - o1 + 60;
      var pulse = 0.35 + 0.25 * Math.sin(((G ? G.frame : 0) / 30) + i);
      ctx.fillStyle = 'rgba(150,110,240,' + pulse.toFixed(2) + ')';
      ctx.beginPath();
      ctx.moveTo(cx, VIEW_H - 60); ctx.lineTo(cx + 18, VIEW_H - 190); ctx.lineTo(cx + 40, VIEW_H - 60); ctx.fill();
      ctx.fillStyle = 'rgba(200,170,255,' + (pulse * 0.7).toFixed(2) + ')';
      ctx.beginPath();
      ctx.moveTo(cx + 44, VIEW_H - 60); ctx.lineTo(cx + 58, VIEW_H - 132); ctx.lineTo(cx + 74, VIEW_H - 60); ctx.fill();
    }
    // paredes de roca
    var o2 = (cam * 0.4) % 180;
    ctx.fillStyle = '#2a1740';
    for (var j = -1; j < 7; j++) {
      var rx = j * 180 - o2;
      ctx.beginPath();
      ctx.moveTo(rx, VIEW_H); ctx.lineTo(rx + 40, VIEW_H - 96 - hash(j) * 40);
      ctx.lineTo(rx + 96, VIEW_H - 40); ctx.lineTo(rx + 180, VIEW_H); ctx.fill();
    }
    // estalactitas del techo
    var o3 = (cam * 0.6) % 90;
    for (var k = -1; k < 11; k++) {
      var tx = k * 90 - o3, hgt = 40 + hash(k * 3.7) * 70;
      ctx.fillStyle = '#3d2258';
      ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx + 22, hgt); ctx.lineTo(tx + 44, 0); ctx.fill();
      ctx.fillStyle = 'rgba(190,160,255,0.25)';
      ctx.beginPath(); ctx.moveTo(tx + 4, 0); ctx.lineTo(tx + 20, hgt * 0.7); ctx.lineTo(tx + 14, 0); ctx.fill();
    }
    // gotas
    for (var d = 0; d < 5; d++) {
      var dx = ((d * 173) % VIEW_W);
      var dy = (((G ? G.frame : 0) * (1.6 + d * 0.3) + d * 90) % (VIEW_H + 60)) - 30;
      px(dx, dy, 2, 7, 'rgba(190,170,255,0.5)');
    }
    // niebla
    var fog = ctx.createLinearGradient(0, VIEW_H - 120, 0, VIEW_H);
    fog.addColorStop(0, 'rgba(120,80,180,0)');
    fog.addColorStop(1, 'rgba(140,100,200,0.35)');
    ctx.fillStyle = fog; ctx.fillRect(0, VIEW_H - 120, VIEW_W, 120);
  }

  // ── MUNDO 3: castillo con torres, lava pulsante y brasas ──
  function drawBgCastillo(th, cam) {
    sky('#1b0708', '#5c1414');
    var pulse = 0.5 + 0.5 * Math.sin((G ? G.frame : 0) / 22);
    // resplandor de lava desde abajo
    var gl = ctx.createLinearGradient(0, VIEW_H - 210, 0, VIEW_H);
    gl.addColorStop(0, 'rgba(255,90,40,0)');
    gl.addColorStop(1, 'rgba(255,' + (110 + 60 * pulse | 0) + ',40,' + (0.34 + 0.16 * pulse).toFixed(2) + ')');
    ctx.fillStyle = gl; ctx.fillRect(0, VIEW_H - 210, VIEW_W, 210);

    // torres lejanas con ventanas encendidas
    var o1 = (cam * 0.22) % 300;
    for (var i = -1; i < 5; i++) {
      var tx = i * 300 - o1 + 30;
      ctx.fillStyle = '#2b0d0d';
      px(tx, VIEW_H - 250, 56, 250, '#2b0d0d');
      px(tx + 76, VIEW_H - 190, 44, 190, '#240b0b');
      // almenas
      for (var m = 0; m < 4; m++) px(tx + m * 15, VIEW_H - 262, 9, 14, '#2b0d0d');
      for (var m2 = 0; m2 < 3; m2++) px(tx + 78 + m2 * 15, VIEW_H - 202, 9, 14, '#240b0b');
      // ventanas
      for (var v = 0; v < 3; v++) {
        var lit = 0.35 + 0.45 * Math.abs(Math.sin((G ? G.frame : 0) / 26 + v + i));
        px(tx + 12, VIEW_H - 220 + v * 46, 10, 16, 'rgba(255,190,80,' + lit.toFixed(2) + ')');
        px(tx + 34, VIEW_H - 220 + v * 46, 10, 16, 'rgba(255,150,60,' + (lit * 0.8).toFixed(2) + ')');
      }
    }
    // cadenas / arcos cercanos
    var o2 = (cam * 0.5) % 220;
    for (var j = -1; j < 6; j++) {
      var ax = j * 220 - o2;
      ctx.fillStyle = 'rgba(30,10,10,0.85)';
      px(ax, 0, 26, 120, 'rgba(30,10,10,0.85)');
      ctx.beginPath(); ctx.arc(ax + 13, 120, 13, 0, Math.PI); ctx.fill();
    }
    // brasas subiendo
    for (var e = 0; e < 14; e++) {
      var ex = (e * 97 + Math.sin(((G ? G.frame : 0) / 30) + e) * 26) % VIEW_W;
      var ey = VIEW_H - (((G ? G.frame : 0) * (0.7 + hash(e) * 0.9) + e * 60) % (VIEW_H + 80));
      var sz = 2 + hash(e * 5.3) * 3;
      px(ex, ey, sz, sz, e % 3 ? 'rgba(255,170,60,0.75)' : 'rgba(255,90,40,0.7)');
    }
  }

  // ── Cuarto secreto de monedas ──
  function drawBgBonus() {
    sky('#04121f', '#0b2b45');
    for (var i = 0; i < 40; i++) {
      var sx = (i * 197) % VIEW_W, sy = (i * 91) % VIEW_H;
      var tw = 0.3 + 0.7 * Math.abs(Math.sin(((G ? G.frame : 0) / 20) + i));
      px(sx, sy, 2, 2, 'rgba(255,255,255,' + tw.toFixed(2) + ')');
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,212,59,0.75)'; ctx.font = 'bold 15px monospace';
    ctx.fillText('CUARTO SECRETO', VIEW_W / 2, 60);
  }

  function drawTiles(th) {
    var c0 = Math.floor(G.cam / TILE) - 1, c1 = c0 + 28;
    for (var c = c0; c <= c1; c++) {
      for (var r = 0; r < ROWS; r++) {
        var ch = tile(c, r); if (ch === ' ' || c < 0 || c >= G.cols) continue;
        var x = c * TILE - G.cam, y = r * TILE;
        var bump = 0;
        for (var i = 0; i < G.bumps.length; i++) if (G.bumps[i].c === c && G.bumps[i].r === r) bump = -Math.sin(G.bumps[i].t / 10 * Math.PI) * 8;
        y += bump;
        if (ch === '#') {
          var top = !solidAt(c, r - 1);
          px(x, y, TILE, TILE, th.dirt);
          if (top) px(x, y, TILE, 8, th.dirtTop);
          px(x, y + TILE - 3, TILE, 3, 'rgba(0,0,0,0.22)');
          px(x, y + 10, 6, 6, 'rgba(0,0,0,0.10)'); px(x + 18, y + 20, 7, 5, 'rgba(0,0,0,0.10)');
        } else if (ch === '=') {
          px(x, y, TILE, TILE - 10, '#c98f3a'); px(x, y, TILE, 5, '#f0c674');
          px(x, y + TILE - 14, TILE, 4, 'rgba(0,0,0,0.25)');
        } else if (ch === 'X') {
          px(x, y, TILE, TILE, '#9a9a9a'); px(x + 2, y + 2, TILE - 4, TILE - 4, '#c4c4c4');
          px(x + 4, y + 4, TILE - 8, TILE - 8, '#a8a8a8');
        } else if (ch === 'B') {
          px(x, y, TILE, TILE, th.brick);
          px(x, y, TILE, 2, 'rgba(255,255,255,0.25)');
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.fillRect(x, y + 15, TILE, 2); ctx.fillRect(x + 15, y, 2, 15); ctx.fillRect(x + 7, y + 17, 2, 15); ctx.fillRect(x + 23, y + 17, 2, 15);
        } else if (ch === '?' || ch === 'M' || ch === 'S') {
          var pulse = 0.5 + 0.5 * Math.sin(G.frame / 9);
          px(x, y, TILE, TILE, '#d99a1a');
          px(x + 3, y + 3, TILE - 6, TILE - 6, 'rgb(' + (230 + 25 * pulse | 0) + ',' + (170 + 40 * pulse | 0) + ',40)');
          px(x + 2, y + 2, 4, 4, '#fff8d0'); px(x + TILE - 6, y + 2, 4, 4, '#fff8d0');
          px(x + 2, y + TILE - 6, 4, 4, '#fff8d0'); px(x + TILE - 6, y + TILE - 6, 4, 4, '#fff8d0');
          ctx.fillStyle = '#7a4a00'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
          ctx.fillText(ch === '?' ? '?' : (ch === 'S' ? '★' : '!'), x + TILE / 2, y + TILE / 2 + 7);
        } else if (ch === 'T') {
          var topPipe = tile(c, r - 1) !== 'T';
          px(x, y, TILE, TILE, '#2f9e44');
          px(x + 3, y, 6, TILE, '#69db7c'); px(x + TILE - 8, y, 5, TILE, '#1b6b2c');
          if (topPipe) { px(x - 3, y, TILE + 6, 10, '#37b24d'); px(x - 3, y, TILE + 6, 3, '#8ce99a'); }
        } else if (ch === 'V') {
          // tubería secreta: se entra pulsando abajo encima
          px(x, y, TILE, TILE, '#1f7a34');
          px(x + 3, y, 6, TILE, '#4ec36a'); px(x + TILE - 8, y, 5, TILE, '#12551f');
          px(x - 3, y, TILE + 6, 10, '#2f9e44'); px(x - 3, y, TILE + 6, 3, '#8ce99a');
          var bob = Math.sin(G.frame / 14) * 3;
          ctx.fillStyle = 'rgba(255,236,153,0.95)';
          ctx.beginPath();
          ctx.moveTo(x + 10, y - 16 + bob); ctx.lineTo(x + 22, y - 16 + bob); ctx.lineTo(x + 16, y - 6 + bob);
          ctx.fill();
        } else if (ch === 'C' || ch === 'c') {
          // checkpoint: gris/rojo apagado, verde al activarse
          var on = ch === 'c';
          px(x + 13, y - TILE + 4, 5, TILE * 2 - 4, '#adb5bd');
          px(x + 9, y + TILE - 6, 14, 5, '#6c757d');
          var wv = Math.sin(G.frame / (on ? 8 : 22)) * (on ? 4 : 1.5);
          ctx.fillStyle = on ? '#51cf66' : '#868e96';
          ctx.beginPath();
          ctx.moveTo(x + 18, y - TILE + 8);
          ctx.lineTo(x + 44 + wv, y - TILE + 18);
          ctx.lineTo(x + 18, y - TILE + 28);
          ctx.fill();
          if (on) {
            ctx.fillStyle = 'rgba(81,207,102,0.22)';
            ctx.beginPath(); ctx.arc(x + 16, y + 8, 22 + Math.sin(G.frame / 12) * 3, 0, 7); ctx.fill();
          }
        } else if (ch === '~') {
          var wob = Math.sin((G.frame + c * 8) / 12) * 3;
          px(x, y + 6 + wob, TILE, TILE, '#ff5a3c');
          px(x, y + 6 + wob, TILE, 5, '#ffd93d');
        } else if (ch === '^') {
          ctx.fillStyle = '#cfd4da';
          for (var k = 0; k < 4; k++) {
            ctx.beginPath(); ctx.moveTo(x + k * 8, y + TILE); ctx.lineTo(x + k * 8 + 4, y + 14); ctx.lineTo(x + k * 8 + 8, y + TILE); ctx.fill();
          }
        }
      }
    }
  }

  function drawFlag() {
    if (!G.flag) return;
    var f = G.flag, x = f.x - G.cam;
    // fila de suelo real en la columna de la meta (para no enterrar el castillo)
    var fc = Math.floor((f.x + 40) / TILE), groundR = ROWS;
    for (var rr = 0; rr < ROWS; rr++) { if (solidAt(fc, rr)) { groundR = rr; break; } }
    var gy = groundR * TILE;

    // ── castillo (detrás del mástil, base sobre el suelo) ──
    var cw = 96, chh = 116, cx = x + 26, cy = gy - chh;
    px(cx, cy, cw, chh, '#8f5335');
    px(cx, cy, cw, 10, '#6f3f28');
    px(cx + 4, cy + 14, cw - 8, chh - 18, '#9c5c3c');
    // almenas
    for (var i = 0; i < 5; i++) px(cx + 2 + i * 19, cy - 14, 13, 16, '#8f5335');
    // torres laterales
    px(cx - 14, gy - 86, 20, 86, '#7f4a2f');
    px(cx + cw - 6, gy - 86, 20, 86, '#7f4a2f');
    for (var t = 0; t < 2; t++) {
      var tx2 = t === 0 ? cx - 14 : cx + cw - 6;
      px(tx2, gy - 100, 20, 16, '#7f4a2f');
      px(tx2 + 2, gy - 114, 16, 14, '#c92a2a');
      px(tx2 + 6, gy - 74, 8, 12, '#2b1c14');
    }
    // ventanas y puerta
    px(cx + 16, cy + 30, 14, 18, '#2b1c14');
    px(cx + cw - 30, cy + 30, 14, 18, '#2b1c14');
    px(cx + 16, cy + 34, 14, 6, 'rgba(255,196,86,0.8)');
    px(cx + cw - 30, cy + 34, 14, 6, 'rgba(255,196,86,0.8)');
    var dw = 30, dx = cx + cw / 2 - dw / 2, dh = 42;
    px(dx, gy - dh, dw, dh, '#3b2a20');
    ctx.fillStyle = '#3b2a20';
    ctx.beginPath(); ctx.arc(dx + dw / 2, gy - dh, dw / 2, Math.PI, 0); ctx.fill();
    px(dx + 4, gy - dh + 6, dw - 8, dh - 6, '#241812');
    // banderín del castillo
    var cwv = Math.sin(G.frame / 14) * 3;
    px(cx + cw / 2 - 1, cy - 40, 3, 28, '#dee2e6');
    ctx.fillStyle = '#ffd43b';
    ctx.beginPath();
    ctx.moveTo(cx + cw / 2 + 2, cy - 38);
    ctx.lineTo(cx + cw / 2 + 22 + cwv, cy - 31);
    ctx.lineTo(cx + cw / 2 + 2, cy - 24);
    ctx.fill();

    // ── mástil de la meta ──
    var poleTop = f.y, poleH = Math.max(60, gy - poleTop);
    px(x, poleTop, 5, poleH, '#dee2e6');
    px(x - 2, gy - 6, 10, 6, '#adb5bd');
    var locked = LEVELS[G.levelIdx].world === 3 && !G.bossDead;
    var col = locked ? '#868e96' : (f.taken ? '#51cf66' : '#ff6b6b');
    var wave = Math.sin(G.frame / 12) * 3;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x + 5, poleTop + 6); ctx.lineTo(x + 40 + wave, poleTop + 18); ctx.lineTo(x + 5, poleTop + 30);
    ctx.fill();
    if (locked) {
      ctx.fillStyle = '#ffd43b'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText('VENCE AL JEFE', x + 30, poleTop - 6);
    }
  }

  // Personaje jugable: se dibuja con la skin 16x16 del editor
  function skinFor(p) {
    var sk = SKINS[skinIdx(p.id)] || SKIN_PRESETS[skinIdx(p.id)] || SKIN_PRESETS[0];
    var pal = {};
    for (var k in sk.pal) pal[k] = sk.pal[k];
    if (p.power === 2) { pal.c = '#f8f9fa'; pal.o = '#e03131'; }   // forma fuego
    if (p.star > 0) {                                             // estrella: ciclado de paleta
      var cyc = Math.floor(G.frame / 4) % 4;
      pal.c = ['#ffd43b', '#ffffff', '#ff922b', '#69db7c'][cyc];
      pal.o = ['#fff3bf', '#ffd43b', '#ffffff', '#a9e34b'][cyc];
      pal.y = ['#ffffff', '#ffd43b', '#fff3bf', '#ffffff'][cyc];
    }
    return { sk: sk, pal: pal };
  }

  function drawPlayer(p) {
    if (p.out) return;
    // Un snapshot incompleto/corrupto no debe contaminar el contexto de dibujo.
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) ||
        !Number.isFinite(p.w) || !Number.isFinite(p.h) || p.w < 1 || p.h < 1) return;
    if (p.invuln > 0 && !p.dead && Math.floor(G.frame / 4) % 2 === 0) return;
    var info = skinFor(p), sk = info.sk, pal = info.pal;
    var sq = clamp(p.sq || 1, 0.6, 1.3);
    var h = p.h * sq, w = p.w * (2 - sq);
    var x = p.x - G.cam - (w - p.w) / 2, y = p.y + p.h - h;

    ctx.save();
    if (p.dead) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(Math.sin(G.frame / 6) * 0.5);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }
    if (p.face < 0) {
      ctx.translate(x + w / 2, 0); ctx.scale(-1, 1); ctx.translate(-(x + w / 2), 0);
    }
    var cw = w / 16, chh = h / 16;
    var walking = p.onGround && Math.abs(p.vx) > 0.4;
    var step = Math.floor(p.anim / 6) % 2;
    for (var r = 0; r < 16; r++) {
      var row = sk.rows[r], shift = 0;
      if (r >= 13) {
        if (!p.onGround) shift = (r >= 14 ? 1 : 0);          // piernas recogidas en el aire
        else if (walking) shift = (step ? 1 : -1);           // ciclo de caminata
      }
      for (var c = 0; c < 16; c++) {
        var symb = row.charAt(c);
        if (symb === '.' || symb === ' ') continue;
        var col = pal[symb];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x + c * cw) + shift, Math.round(y + r * chh), Math.ceil(cw), Math.ceil(chh));
      }
    }
    ctx.restore();

    // etiqueta P1/P2
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('P' + (p.id + 1), p.x - G.cam + p.w / 2, p.y - 6);
  }

  function drawEnemy(e) {
    var x = e.x - G.cam, y = e.y, w = e.w, h = e.h;
    if (e.kind === 'flip') { ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(1, -1); ctx.translate(-w / 2, -h / 2); x = 0; y = 0; }
    if (e.dead && e.kind !== 'flip') { px(x, y + h - 8, w, 8, '#8a5a2b'); return; }
    var wig = Math.sin(e.anim / 7) * 2;
    if (e.kind === 'g') {                       // "Champiñón enojado"
      px(x + 1, y + 4, w - 2, h - 8, '#a0522d');
      px(x + 3, y + 2, w - 6, 8, '#c1663a');
      px(x + 4, y + 9, 5, 5, '#fff'); px(x + w - 9, y + 9, 5, 5, '#fff');
      px(x + 5, y + 11, 3, 3, '#000'); px(x + w - 8, y + 11, 3, 3, '#000');
      px(x + 4, y + 17, w - 8, 2, '#3b2a20');
      px(x + 1 + wig, y + h - 5, 7, 5, '#5c3a21'); px(x + w - 8 - wig, y + h - 5, 7, 5, '#5c3a21');
    } else if (e.kind === 'k') {                // "Tortuga caparazón"
      if (e.state === 'shell') {
        var spin = Math.abs(e.vx) > 2 ? G.frame / 3 : 0;
        ctx.save(); ctx.translate(x + w / 2, y + h - 11); ctx.rotate(spin);
        px(-11, -11, 22, 22, '#2f9e44'); px(-7, -7, 14, 14, '#8ce99a'); px(-3, -3, 6, 6, '#2f9e44');
        ctx.restore();
      } else {
        px(x + 2, y + 8, w - 4, h - 10, '#2f9e44');
        px(x + 5, y + 11, w - 10, h - 16, '#8ce99a');
        px(x + (e.vx > 0 ? w - 8 : 2), y + 1, 8, 9, '#ffe066');
        px(x + (e.vx > 0 ? w - 5 : 4), y + 4, 3, 3, '#000');
        px(x + 3 + wig, y + h - 4, 6, 4, '#ffe066'); px(x + w - 9 - wig, y + h - 4, 6, 4, '#ffe066');
      }
    } else if (e.kind === 'j') {                // "Erizo" (no se puede pisar)
      px(x + 2, y + 6, w - 4, h - 8, '#495057');
      px(x + 5, y + 9, w - 10, h - 14, '#868e96');
      ctx.fillStyle = '#f1f3f5';
      for (var i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(x + 2 + i * 4.5, y + 6); ctx.lineTo(x + 4 + i * 4.5, y - 3); ctx.lineTo(x + 7 + i * 4.5, y + 6); ctx.fill();
      }
      px(x + 5, y + 11, 4, 4, '#ff6b6b'); px(x + w - 9, y + 11, 4, 4, '#ff6b6b');
    } else if (e.kind === 'f') {                // "Murciélago volador"
      var flap = Math.sin(e.anim / 4) * 6;
      px(x + 7, y + 5, w - 14, h - 8, '#845ef7');
      px(x + 9, y + 8, 4, 4, '#fff'); px(x + w - 13, y + 8, 4, 4, '#fff');
      ctx.fillStyle = '#5f3dc4';
      ctx.beginPath(); ctx.moveTo(x + 7, y + 8); ctx.lineTo(x - 5, y + 4 + flap); ctx.lineTo(x + 7, y + 18); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + w - 7, y + 8); ctx.lineTo(x + w + 5, y + 4 + flap); ctx.lineTo(x + w - 7, y + 18); ctx.fill();
    }
    if (e.kind === 'flip') ctx.restore();
  }

  function drawItem(it) {
    var x = it.x - G.cam, y = it.y;
    if (it.kind === 'mush') {
      px(x + 1, y + 10, it.w - 2, 12, '#f8f0e3');
      px(x, y + 2, it.w, 10, '#e03131');
      px(x + 4, y + 4, 5, 5, '#fff'); px(x + it.w - 9, y + 4, 5, 5, '#fff');
      px(x + 5, y + 14, 3, 3, '#000'); px(x + it.w - 8, y + 14, 3, 3, '#000');
    } else if (it.kind === 'flower') {
      var s = Math.sin(it.t / 10) * 2;
      px(x + 9, y + 10, 4, 12, '#2f9e44');
      px(x + 3, y + 4 + s, 16, 8, '#ff922b');
      px(x + 7, y + 1 + s, 8, 6, '#ffd43b');
      px(x + 7, y + 6 + s, 8, 4, '#fff');
    } else {
      var r = 11, cx = x + 11, cy = y + 11, rot = G.frame / 14;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      ctx.fillStyle = Math.floor(G.frame / 5) % 2 ? '#ffd43b' : '#fff3bf';
      ctx.beginPath();
      for (var i = 0; i < 10; i++) {
        var ang = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
        ctx[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * rr, Math.sin(ang) * rr);
      }
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }

  function drawCoin(co) {
    if (co.got) return;
    co.t++;
    var wob = Math.abs(Math.sin(co.t / 12));
    var x = co.x - G.cam, w = 4 + 8 * wob;
    px(x + (12 - w) / 2, co.y, w, 16, '#ffd43b');
    px(x + (12 - w) / 2 + 1, co.y + 3, Math.max(1, w - 2), 10, '#ffec99');
  }

  function drawFire(f) {
    var x = f.x - G.cam, r = 6 + Math.sin(G.frame / 3) * 1.5;
    ctx.fillStyle = f.enemy ? '#845ef7' : '#ff922b';
    ctx.beginPath(); ctx.arc(x + 6, f.y + 6, r, 0, 7); ctx.fill();
    ctx.fillStyle = f.enemy ? '#e599f7' : '#ffe066';
    ctx.beginPath(); ctx.arc(x + 6, f.y + 6, r * 0.5, 0, 7); ctx.fill();
  }

  function drawBoss() {
    var b = G.boss; if (!b) return;
    var x = b.x - G.cam, y = b.y, w = b.w, h = b.h;
    if (b.dead) {
      var t = b.dead;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t / 90);
      ctx.translate(x + w / 2, y + h / 2); ctx.rotate(t / 20); ctx.translate(-w / 2, -h / 2);
      px(0, 0, w, h, '#c92a2a'); ctx.restore(); return;
    }
    var flash = b.hurtFlash > 0 && Math.floor(G.frame / 3) % 2 === 0;
    var shell = b.phase === 2 ? '#c92a2a' : '#2b8a3e';
    var body = flash ? '#ffffff' : (b.phase === 2 ? '#e8590c' : '#40c057');
    // caparazón con pinchos
    px(x + 4, y + 20, w - 8, h - 24, shell);
    px(x + 10, y + 26, w - 20, h - 36, b.phase === 2 ? '#f08c00' : '#94d82d');
    ctx.fillStyle = '#f1f3f5';
    for (var i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(x + 6 + i * 11, y + 20); ctx.lineTo(x + 11 + i * 11, y + 6); ctx.lineTo(x + 16 + i * 11, y + 20); ctx.fill();
    }
    // cabeza
    var dir = b.vx >= 0 ? 1 : -1;
    var hx = x + (dir > 0 ? w - 26 : 2);
    px(hx, y + 2, 26, 24, body);
    px(hx + (dir > 0 ? 16 : 4), y + 8, 6, 6, flash ? '#000' : '#ffffff');
    px(hx + (dir > 0 ? 18 : 6), y + 10, 3, 3, '#000');
    // cuernos
    px(hx + 2, y - 4, 5, 8, '#f8f9fa'); px(hx + 18, y - 4, 5, 8, '#f8f9fa');
    // boca / fuego
    if (b.mouth > 0) {
      px(hx + (dir > 0 ? 22 : -8), y + 16, 10, 8, '#ff922b');
      px(hx + (dir > 0 ? 28 : -14), y + 17, 8, 6, '#ffd43b');
    } else {
      px(hx + (dir > 0 ? 20 : 2), y + 18, 6, 3, '#3b2a20');
    }
    // patas
    px(x + 6, y + h - 8, 14, 8, body); px(x + w - 20, y + h - 8, 14, 8, body);
    // barra de vida
    var bw = 90, bx = x + w / 2 - bw / 2, by = y - 18;
    px(bx - 2, by - 2, bw + 4, 12, 'rgba(0,0,0,0.6)');
    px(bx, by, bw * Math.max(0, b.hp) / b.maxHp, 8, b.phase === 2 ? '#ff6b6b' : '#51cf66');
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('REY ESPINA', x + w / 2, by - 5);
  }

  function drawHUD() {
    ctx.textAlign = 'left';
    var n = G.players.length;
    var tall = n > 2;
    px(0, 0, VIEW_W, tall ? 46 : 34, 'rgba(0,0,0,0.42)');
    ctx.font = 'bold ' + (tall ? 11 : 13) + 'px monospace';
    var colW = tall ? 176 : 250;
    G.players.forEach(function (p, i) {
      var x = 12 + (i % 2) * colW * (tall ? 1 : 1);
      var y0 = 0;
      if (tall) { x = 12 + i * colW; y0 = 0; }
      ctx.fillStyle = PCOL[p.id] || '#fff';
      var tag = 'P' + (p.id + 1);
      if (G.net && p.id === G.net.myId) tag += '(tú)';
      ctx.fillText(tag + (p.out ? ' FUERA' : ''), x, tall ? 14 : 15);
      ctx.fillStyle = '#fff';
      ctx.fillText(('000000' + p.score).slice(-6) + ' ✖' + Math.max(0, p.lives) + ' ◉' + p.coins, x, tall ? 27 : 29);
      var extra = '';
      if (p.power === 2) extra = 'FUEGO';
      else if (p.power === 1) extra = 'GRANDE';
      if (p.star > 0) extra += (extra ? ' ' : '') + '★' + Math.ceil(p.star / 60);
      if (extra) {
        ctx.fillStyle = p.star > 0 ? '#ffe066' : (p.power === 2 ? '#ffd43b' : '#ffa8a8');
        if (tall) ctx.fillText(extra, x, 39);
        else ctx.fillText(extra, x + 150, 15);
      }
      if (G.net && G.net.names && G.net.names[p.id]) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(String(G.net.names[p.id]).substring(0, 10), x + (tall ? 0 : 78), tall ? 14 : 15 - 0);
      }
    });
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('MUNDO ' + LEVELS[G.levelIdx].name, VIEW_W - 12, 15);
    ctx.fillStyle = G.time < 60 ? '#ff6b6b' : '#fff';
    ctx.fillText('TIEMPO ' + G.time, VIEW_W - 12, 29);
  }

  function card(title, sub, hint) {
    px(0, 0, VIEW_W, VIEW_H, 'rgba(8,10,20,0.82)');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd43b'; ctx.font = 'bold 34px monospace';
    ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 20);
    ctx.fillStyle = '#f1f3f5'; ctx.font = 'bold 16px monospace';
    ctx.fillText(sub, VIEW_W / 2, VIEW_H / 2 + 14);
    if (hint) {
      ctx.fillStyle = '#adb5bd'; ctx.font = '12px monospace';
      ctx.fillText(hint, VIEW_W / 2, VIEW_H / 2 + 44);
    }
  }

  function drawTitle() {
    var th = THEME[1];
    drawBackground(th);
    px(0, VIEW_H - 64, VIEW_W, 64, th.dirt); px(0, VIEW_H - 64, VIEW_W, 8, th.dirtTop);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.font = 'bold 52px monospace';
    ctx.fillText('BIGOTE BROS', VIEW_W / 2 + 3, 123);
    ctx.fillStyle = '#ffd43b';
    ctx.fillText('BIGOTE BROS', VIEW_W / 2, 120);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px monospace';
    ctx.fillText('3 mundos · 7 niveles · jefe final', VIEW_W / 2, 152);
    ctx.font = 'bold 18px monospace';
    for (var mi = 0; mi < 4; mi++) {
      ctx.fillStyle = sel === mi ? '#51cf66' : '#868e96';
      ctx.fillText((sel === mi ? '▶ ' : '   ') + (mi === 0 ? '1 JUGADOR' : (mi + 1) + ' JUGADORES'),
        VIEW_W / 2, 208 + mi * 26);
    }
    ctx.fillStyle = '#dee2e6'; ctx.font = '12px monospace';
    ctx.fillText('W/S o ↑/↓ para elegir · ENTER para empezar', VIEW_W / 2, 322);
    ctx.fillStyle = '#ffd8a8';
    ctx.fillText('P1/P3: A D mover · W saltar · S disparar', VIEW_W / 2, 344);
    ctx.fillStyle = '#b2f2bb';
    ctx.fillText('P2/P4: ← → mover · ↑ saltar · ↓ disparar', VIEW_W / 2, 362);
    ctx.fillStyle = '#adb5bd';
    ctx.fillText('P pausa · R reiniciar nivel · 🌐 Online arriba', VIEW_W / 2, 382);
  }

  function render() {
    if (!G || G.state === 'title') { drawTitle(); return; }
    var th = THEME[LEVELS[G.levelIdx].world] || THEME[1];
    ctx.save();
    if (G.shake > 0) ctx.translate(rnd(-4, 4), rnd(-4, 4));
    drawBackground(th);
    drawTiles(th);
    drawFlag();
    G.coins.forEach(drawCoin);
    G.items.forEach(drawItem);
    G.enemies.forEach(drawEnemy);
    if (G.boss) drawBoss();
    G.fires.forEach(drawFire);
    G.parts.forEach(function (q) {
      if (q.coin) { px(q.x - G.cam, q.y, 10, 14, '#ffd43b'); }
      else px(q.x - G.cam, q.y, q.s, q.s, q.col);
    });
    G.players.forEach(drawPlayer);
    ctx.restore();
    drawHUD();

    if (G.state === 'card') card(G.msg, G.sub, '');
    else if (G.state === 'clear') card(G.msg, G.sub, 'Puntaje total: ' + totalScore());
    else if (G.state === 'over') card('FIN DEL JUEGO', 'Puntaje total: ' + totalScore(), 'ENTER para volver al menú');
    else if (G.state === 'victory') card('¡GANARON!', 'Rey Espina derrotado · ' + totalScore() + ' pts', 'ENTER para volver al menú');
    else if (G.state === 'pause') card('PAUSA', 'P para continuar', 'R reinicia el nivel');
  }

  // ─── Bucle principal con paso fijo ──────────────────────────
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    if (!last) last = ts;
    var dt = Math.min(ts - last, 200); last = ts;
    acc += dt;
    var guard = 0;
    while (acc >= STEP && guard++ < 5) {
      acc -= STEP;
      if (G && G.state !== 'pause' && G.state !== 'title') { update(); netTick(); }
    }
    render();
  }

  // ─── Entrada de teclado ─────────────────────────────────────
  var sel = 0;
  var BLOCK = { ' ': 1, 'arrowup': 1, 'arrowdown': 1, 'arrowleft': 1, 'arrowright': 1 };
  function onKey(e, down) {
    // Ignorar el teclado cuando se escribe en un campo o el editor esta abierto
    var tg = e.target || {};
    var tag = (tg.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (document.querySelector && document.querySelector('.sk-overlay.open')) {
      keys = {};
      return;
    }
    var k = (e.key || '').toLowerCase();
    if (BLOCK[k]) e.preventDefault();
    keys[k] = down;
    if (!down) return;
    if (!G || G.state === 'title') {
      if (k === 'w' || k === 'arrowup') { sel = (sel + 3) % 4; }
      if (k === 's' || k === 'arrowdown') { sel = (sel + 1) % 4; }
      if (k === 'enter') { ac(); newGame(sel + 1); }
      return;
    }
    if (k === 'p') { G.state = G.state === 'pause' ? 'play' : (G.state === 'play' ? 'pause' : G.state); }
    if (k === 'r' && (G.state === 'play' || G.state === 'pause')) loadLevel(G.levelIdx);
    if (k === 'm') { muted = !muted; }
    if (k === 'enter' && (G.state === 'over' || G.state === 'victory')) { G = null; sel = 0; }
  }

  // ─── API pública ────────────────────────────────────────────
  function init(canvasId) {
    canvas = document.getElementById(canvasId || 'marioCanvas');
    if (!canvas) { console.error('[BigoteBros] falta el <canvas>'); return; }
    canvas.width = VIEW_W; canvas.height = VIEW_H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    loadSkins();
    document.addEventListener('keydown', function (e) { onKey(e, true); });
    document.addEventListener('keyup', function (e) { onKey(e, false); });
    canvas.addEventListener('click', function () { ac(); canvas.focus(); });
    if (!raf) raf = requestAnimationFrame(frame);
  }


  // ═══════════════ RED: modo online (host autoritativo) ═══════════════
  // El host simula y manda snapshots ~15/s; todos simulan con los mismos
  // inputs (el host retransmite los de todos) y el invitado se corrige
  // suavemente con el snapshot. Así no hay input lag.
  var NET_SNAP_EVERY = 4;   // ticks entre snapshots (60/4 = 15 por segundo)

  function netStart(cfg) {
    cfg = cfg || {};
    var n = Math.max(1, Math.min(MAX_PLAYERS, cfg.nPlayers | 0 || 1));
    ac();
    newGame(n, {
      on: true,
      host: !!cfg.host,
      myId: Math.max(0, Math.min(n - 1, cfg.myId | 0)),
      inputs: {},
      names: cfg.names || {},
      tiles: [],
      tick: 0
    });
  }
  function netStop() { G = null; sel = 0; }
  var netCb = null;                       // lo pone la capa de red (mario_net.js)
  function onNet(fn) { netCb = fn; }
  // Cada tick: manda el input local y, si soy host, el snapshot cada N ticks.
  function netTick() {
    if (!G || !G.net || !netCb) return;
    G.net.tick++;
    netCb('input', localInput());
    if (G.net.host && G.net.tick % NET_SNAP_EVERY === 0) netCb('state', serializeState());
  }
  // Se corta la conexión de alguien: se acaba la partida y se guarda el puntaje.
  function netAbort(msg) {
    if (!G) return;
    G.state = 'over'; G.cardT = 99999;
    G.msg = 'PARTIDA TERMINADA';
    G.sub = msg || 'Se desconectó un jugador · puntaje guardado';
    sendScore();
    G.net = null;
  }
  function setRemoteInput(id, r) {
    if (!G || !G.net) return;
    G.net.inputs[id | 0] = { l: !!(r && r.l), r: !!(r && r.r), j: !!(r && r.j), d: !!(r && r.d) };
  }
  function localInput() {
    var c = readAnyCtrl();
    return { l: c.left, r: c.right, j: c.jump, d: c.down };
  }

  function packPlayer(p) {
    return {
      i: p.id, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10,
      vx: Math.round(p.vx * 100) / 100, vy: Math.round(p.vy * 100) / 100,
      w: p.w, h: p.h, pw: p.power, lv: p.lives, sc: p.score, cn: p.coins,
      dd: p.dead ? 1 : 0, ou: p.out ? 1 : 0, dt: p.deadT, iv: p.invuln,
      st: p.star, fc: p.face, og: p.onGround ? 1 : 0, dn: p.done ? 1 : 0
    };
  }
  function packEnemy(e) {
    return {
      n: e.nid, k: e.kind, x: Math.round(e.x * 10) / 10, y: Math.round(e.y * 10) / 10,
      vx: Math.round(e.vx * 100) / 100, vy: Math.round(e.vy * 100) / 100,
      d: e.dir, dd: e.dead, s: e.state || '', t: e.t, aw: e.awake ? 1 : 0,
      w: e.w, h: e.h
    };
  }
  function packMover(o) {
    return {
      n: o.nid, k: o.kind || '', x: Math.round(o.x), y: Math.round(o.y),
      vx: Math.round(o.vx * 100) / 100, vy: Math.round(o.vy * 100) / 100,
      e: o.enemy ? 1 : 0
    };
  }
  function inWindow(o, pad) {
    return o.x > G.cam - pad && o.x < G.cam + VIEW_W + pad;
  }

  function serializeState() {
    if (!G) return null;
    var snap = {
      f: G.frame, st: G.state, lv: G.levelIdx, cam: Math.round(G.cam * 10) / 10,
      tm: G.time, cd: G.cardT, fz: G.freeze, bn: G.inBonus ? 1 : 0, bd: G.bossDead ? 1 : 0,
      pl: G.players.map(packPlayer),
      en: [], it: [], fi: [], co: [], td: G.net ? G.net.tiles : [],
      bo: null, fl: G.flag ? (G.flag.taken ? 1 : 0) : 0
    };
    if (G.net) G.net.tiles = [];
    var i;
    for (i = 0; i < G.enemies.length; i++) if (inWindow(G.enemies[i], 260)) snap.en.push(packEnemy(G.enemies[i]));
    for (i = 0; i < G.items.length; i++) snap.it.push(packMover(G.items[i]));
    for (i = 0; i < G.fires.length; i++) snap.fi.push(packMover(G.fires[i]));
    for (i = 0; i < G.coins.length; i++) if (G.coins[i].got) snap.co.push(i);
    if (G.boss) {
      var b = G.boss;
      snap.bo = { x: Math.round(b.x), y: Math.round(b.y), hp: b.hp, ph: b.phase, dd: b.dead, t: b.t, ac: b.act, iv: b.inv };
    }
    return snap;
  }

  function lerpTo(o, x, y, hard) {
    var dx = x - o.x, dy = y - o.y;
    if (hard || Math.abs(dx) > 60 || Math.abs(dy) > 60) { o.x = x; o.y = y; return; }
    o.x += dx * 0.35; o.y += dy * 0.35;
  }

  function applyState(snap) {
    if (!G || !snap || typeof snap !== 'object' || !G.net || G.net.host) return;
    if (!Array.isArray(snap.pl) || !Array.isArray(snap.en) ||
        !Array.isArray(snap.it) || !Array.isArray(snap.fi)) return;
    if (snap.lv !== undefined && (!Number.isInteger(snap.lv) || snap.lv < 0 || snap.lv >= LEVELS.length)) return;
    var hard = false, i, j;

    if (snap.lv !== G.levelIdx) { G.players.forEach(function (p) { p.done = false; }); loadLevel(snap.lv); hard = true; }
    if (!!snap.bn !== !!G.inBonus) {
      // La bandera por sí sola no basta: el invitado debe cargar/restaurar
      // también el mapa, los objetos, la cámara y las posiciones guardadas.
      if (snap.bn) enterBonus(true);
      else exitBonus(true);
      hard = true;
    }

    // estado de la partida (lo decide el host)
    if (snap.st !== G.state) {
      G.state = snap.st;
      if (snap.st === 'clear') {
        G.msg = '¡MUNDO ' + LEVELS[G.levelIdx].name + ' COMPLETADO!';
        G.sub = 'Bonus de tiempo: ' + (G.time * 10); SFX.clear(); sendScore();
      } else if (snap.st === 'over') {
        G.msg = 'FIN DEL JUEGO'; G.sub = 'Enter para volver a empezar'; sendScore();
      } else if (snap.st === 'victory') {
        G.msg = '¡GANARON!'; G.sub = 'Derrotaron al Rey Espina · Enter para el menú';
        SFX.win(); sendScore();
      }
    }
    G.time = snap.tm; G.cardT = snap.cd; G.bossDead = !!snap.bd;
    G.cam += (snap.cam - G.cam) * (hard ? 1 : 0.4);

    // tiles rotos / bloques usados
    if (!snap.bn && snap.td && snap.td.length) {
      for (i = 0; i < snap.td.length; i++) {
        var t = snap.td[i];
        if (t[1] >= 0 && t[1] < ROWS && t[0] >= 0 && t[0] < G.cols) G.grid[t[1]][t[0]] = t[2];
      }
    }

    // jugadores
    for (i = 0; i < snap.pl.length; i++) {
      var sp = snap.pl[i];
      if (!sp || !Number.isInteger(sp.i) || sp.i < 0 || sp.i >= G.players.length) continue;
      var p = G.players[sp.i];
      if (!p || !Number.isFinite(sp.x) || !Number.isFinite(sp.y)) continue;
      var isDead = !!sp.dd, isOut = !!sp.ou;
      // La muerte y el respawn son discontinuidades: interpolarlas mezcla dos
      // tamaños/posiciones y genera el efecto de sprite aplastado.
      var lifeTransition = p.dead !== isDead || p.out !== isOut;
      lerpTo(p, sp.x, sp.y, hard || lifeTransition || sp.i !== G.net.myId);
      p.vx = Number.isFinite(sp.vx) ? sp.vx : 0;
      p.vy = Number.isFinite(sp.vy) ? sp.vy : 0;
      p.w = Number.isFinite(sp.w) ? clamp(sp.w, 12, 32) : 20;
      p.h = Number.isFinite(sp.h) ? clamp(sp.h, 20, 48) : 26;
      p.power = Number.isFinite(sp.pw) ? clamp(sp.pw | 0, 0, 2) : 0;
      p.lives = Number.isFinite(sp.lv) ? Math.max(0, sp.lv | 0) : p.lives;
      p.score = Number.isFinite(sp.sc) ? Math.max(0, sp.sc | 0) : p.score;
      p.coins = Number.isFinite(sp.cn) ? Math.max(0, sp.cn | 0) : p.coins;
      p.dead = isDead; p.out = isOut;
      p.deadT = Number.isFinite(sp.dt) ? Math.max(0, sp.dt | 0) : 0;
      p.invuln = Number.isFinite(sp.iv) ? Math.max(0, sp.iv | 0) : 0;
      p.star = Number.isFinite(sp.st) ? Math.max(0, sp.st | 0) : 0;
      p.face = sp.fc < 0 ? -1 : 1; p.onGround = !!sp.og; p.done = !!sp.dn;
      if (p.dead || p.out) { p.sq = 1; p.jumpHeld = false; p.jumpBuf = 0; }
    }

    // enemigos: se casan por nid; los que ya no vienen y están a la vista, murieron
    var byNid = {};
    for (i = 0; i < snap.en.length; i++) byNid[snap.en[i].n] = snap.en[i];
    var keep = [];
    for (i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i], se = byNid[e.nid];
      if (se) {
        lerpTo(e, se.x, se.y, hard);
        e.vx = se.vx; e.vy = se.vy; e.dir = se.d; e.dead = se.dd;
        e.state = se.s; e.t = se.t; e.awake = !!se.aw; e.w = se.w; e.h = se.h;
        delete byNid[e.nid];
        keep.push(e);
      } else if (!inWindow(e, 200)) {
        keep.push(e);            // fuera de la ventana del host: lo dejamos simulando
      }
    }
    G.enemies = keep;

    // items y bolas de fuego: se reconstruyen tal cual (son pocos)
    G.items = snap.it.map(function (o) {
      var old = null;
      for (var k = 0; k < G.items.length; k++) if (G.items[k].nid === o.n) { old = G.items[k]; break; }
      if (old) { lerpTo(old, o.x, o.y, hard); old.vx = o.vx; old.vy = o.vy; return old; }
      return { nid: o.n, kind: o.k, x: o.x, y: o.y, w: 22, h: 22, vx: o.vx, vy: o.vy, t: 0 };
    });
    G.fires = snap.fi.map(function (o) {
      return { nid: o.n, x: o.x, y: o.y, w: 12, h: 12, vx: o.vx, vy: o.vy, t: 0, owner: null, enemy: !!o.e };
    });

    // monedas recogidas
    if (snap.co) {
      var got = {};
      for (i = 0; i < snap.co.length; i++) got[snap.co[i]] = 1;
      for (i = 0; i < G.coins.length; i++) if (got[i] && !G.coins[i].got) G.coins[i].got = true;
    }

    if (G.boss && snap.bo) {
      var b = G.boss, sb = snap.bo;
      lerpTo(b, sb.x, sb.y, hard);
      b.hp = sb.hp; b.phase = sb.ph; b.dead = sb.dd; b.t = sb.t; b.act = sb.ac; b.inv = sb.iv;
    }
    if (G.flag) G.flag.taken = !!snap.fl;
  }

  window.BigoteBros = {
    init: init,
    // Para botones táctiles: BigoteBros.key('a', true) / ('a', false)
    key: function (name, down) {
      keys[String(name).toLowerCase()] = !!down;
      if (down && name === 'enter') onKey({ key: 'Enter', preventDefault: function () { } }, true);
    },
    start2P: function () { ac(); newGame(2); },
    start1P: function () { ac(); newGame(1); },
    startN: function (n) { ac(); newGame(n); },

    // ── Online ──
    netStart: netStart,
    onNet: onNet,
    netStop: netStop,
    netAbort: netAbort,
    netInput: localInput,
    netRemoteInput: setRemoteInput,
    netSnapshot: serializeState,
    netApply: applyState,
    netIsHost: function () { return !!(G && G.net && G.net.host); },
    netOn: function () { return !!(G && G.net); },
    netTickEvery: NET_SNAP_EVERY,
    frameNo: function () { return G ? G.frame : 0; },
    state: function () { return G ? G.state : 'menu'; },
    scores: function () { return G ? G.players.map(function (p) { return { id: p.id, score: p.score, lives: p.lives, out: p.out }; }) : []; },
    toMenu: function () { G = null; },
    // solo para pruebas: BigoteBros._level(6) salta al nivel del jefe
    _level: function (i) { if (!G) newGame(false); loadLevel(i); },
    mute: function (v) { muted = !!v; },

    // ── Editor de personaje ──
    presets: function () { return SKIN_PRESETS.map(cloneSkin); },
    getSkin: function (i) { return cloneSkin(SKINS[skinIdx(i)]); },
    setSkin: function (i, skin) {
      var idx = skinIdx(i);
      SKINS[idx] = normalizeSkin(skin, SKIN_PRESETS[idx] || SKIN_PRESETS[0]);
      saveSkinsLocal();
      return cloneSkin(SKINS[idx]);
    },
    encodeSkin: function (skin) { return encodeSkin(skin); },
    decodeSkin: function (code) { return decodeSkin(code); },
    reloadSkins: function () { loadSkins(); },
    symbols: function () { return SKIN_SYMS.slice(); },
    palKeys: function () { return PAL_KEYS.slice(); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init('marioCanvas'); });
  } else { init('marioCanvas'); }
})();
