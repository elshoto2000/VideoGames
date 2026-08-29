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
  var SOLID = '#XB?MST=';           // caracteres que bloquean el paso
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

  function newGame(twoP) {
    G = {
      state: 'card', twoP: !!twoP, levelIdx: 0,
      grid: [], cols: 0, w: 0, h: ROWS * TILE,
      players: [], enemies: [], items: [], fires: [], parts: [], bumps: [], coins: [],
      boss: null, flag: null, cam: 0, shake: 0,
      time: 400, timeSub: 0, frame: 0, cardT: 150, msg: '', sub: '',
      sent: 0, bossDead: false
    };
    G.players.push(makePlayer(0));
    if (twoP) G.players.push(makePlayer(1));
    loadLevel(0);
  }

  function makePlayer(id) {
    return {
      id: id, x: 0, y: 0, w: 20, h: 26, vx: 0, vy: 0,
      onGround: false, face: 1, power: 0, invuln: 0, star: 0,
      lives: 3, score: 0, coins: 0, dead: false, deadT: 0, out: false,
      jumpHeld: false, coyote: 0, jumpBuf: 0, shootCd: 0, anim: 0,
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
    G.time = (lv.world === 3) ? 300 : 400; G.timeSub = 0;

    var spawn = [{ x: 2 * TILE, y: 11 * TILE }, { x: 4 * TILE, y: 11 * TILE }];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < G.cols; c++) {
        var ch = G.grid[r][c];
        var px = c * TILE, py = r * TILE;
        if (ch === '1') { spawn[0] = { x: px, y: py }; G.grid[r][c] = ' '; }
        else if (ch === '2') { spawn[1] = { x: px + 4, y: py }; G.grid[r][c] = ' '; }
        else if (ch === 'o') { G.coins.push({ x: px + 10, y: py + 8, w: 12, h: 16, t: 0, got: false }); G.grid[r][c] = ' '; }
        else if (ch === 'g' || ch === 'k' || ch === 'j') { G.enemies.push(makeEnemy(ch, px, py)); G.grid[r][c] = ' '; }
        else if (ch === 'f') { G.enemies.push(makeEnemy('f', px, py)); G.grid[r][c] = ' '; }
        else if (ch === 'b') { G.boss = makeBoss(px, py); G.grid[r][c] = ' '; }
        else if (ch === 'F') { G.flag = { x: px + 8, y: (r - 8) * TILE, w: 10, h: 9 * TILE, taken: false, t: 0 }; G.grid[r][c] = ' '; }
      }
    }
    G.players.forEach(function (p, i) {
      var s = spawn[i] || spawn[0];
      p.spawnX = s.x; p.spawnY = s.y;
      respawn(p, true);
      p.done = false; p.out = p.lives <= 0;
    });
    G.state = 'card';
    G.cardT = 130;
    G.msg = 'MUNDO ' + lv.name;
    G.sub = (lv.world === 3) ? '¡CUIDADO: JEFE FINAL!' : (G.twoP ? '2 JUGADORES' : '1 JUGADOR');
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
  function setTile(c, r, ch) { if (r >= 0 && r < ROWS && c >= 0 && c < G.cols) G.grid[r][c] = ch; }
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
  function makeEnemy(kind, px, py) {
    var e = { kind: kind, x: px + 5, y: py + 6, w: 22, h: 26, vx: -1.1, vy: 0, dead: 0, state: '', t: 0, anim: 0, baseY: py + 6 };
    if (kind === 'g') { e.h = 22; e.y = py + 10; e.vx = -1.05; }
    if (kind === 'k') { e.vx = -1.35; }
    if (kind === 'j') { e.h = 24; e.y = py + 8; e.vx = -1.6; e.jt = 40; }
    if (kind === 'f') { e.w = 26; e.h = 22; e.vx = -1.9; e.range = 90; }
    return e;
  }

  function updateEnemy(e) {
    e.t++; e.anim++;
    if (e.dead) { e.dead--; if (e.kind === 'flip') { e.vy += GRAV; e.y += e.vy; e.x += e.vx; } return; }
    if (e.kind === 'f') {                      // volador
      e.hitWall = 0; moveX(e);
      if (e.hitWall) e.vx *= -1;
      e.y = e.baseY + Math.sin(e.t / 26) * e.range * 0.35;
      return;
    }
    if (e.kind === 'j' && e.state !== 'shell') {  // saltarín con pinchos
      e.jt--;
      if (e.onGround && e.jt <= 0) { e.vy = -8.6; e.jt = 60 + Math.random() * 40; }
    }
    if (e.state === 'shell') {
      e.t2 = (e.t2 || 0) + 1;
      if (Math.abs(e.vx) < 0.2 && e.t2 > 420) { e.state = ''; e.vx = -1.35; e.t2 = 0; }  // revive
    }
    e.vy = Math.min(e.vy + GRAV, MAX_FALL);
    e.hitWall = 0;
    moveX(e);
    if (e.hitWall) e.vx *= -1;
    moveY(e, null);
    // no caer de las plataformas (excepto caparazón lanzado)
    if (e.onGround && !(e.state === 'shell' && Math.abs(e.vx) > 2)) {
      var ahead = Math.floor((e.x + (e.vx > 0 ? e.w + 4 : -4)) / TILE);
      var below = Math.floor((e.y + e.h + 6) / TILE);
      if (!solidAt(ahead, below)) e.vx *= -1;
    }
    if (e.y > VIEW_H + 200) e.remove = true;
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
    SFX.stomp();
    for (var i = 0; i < 6; i++) G.parts.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: rnd(-2, 2), vy: rnd(-3, -0.5), t: 24, col: '#ffffff', s: 3 });
  }

  // ─── Objetos (hongo, flor, estrella) ────────────────────────
  function makeItem(kind, x, y) {
    return { kind: kind, x: x, y: y, w: 22, h: 22, vx: kind === 'flower' ? 0 : 1.6, vy: -2, t: 0 };
  }
  function updateItem(it) {
    it.t++;
    if (it.kind === 'flower') { it.y += Math.sin(it.t / 14) * 0.25; return; }
    it.vy = Math.min(it.vy + GRAV, MAX_FALL);
    it.hitWall = 0; moveX(it); if (it.hitWall) it.vx *= -1;
    moveY(it, null);
    if (it.kind === 'star' && it.onGround) it.vy = -8.5;
    if (it.y > VIEW_H + 200) it.remove = true;
  }

  // ─── Bolas de fuego ─────────────────────────────────────────
  function shoot(p) {
    if (p.power < 2 || p.shootCd > 0) return;
    p.shootCd = 22;
    G.fires.push({ x: p.x + (p.face > 0 ? p.w : -10), y: p.y + p.h * 0.4, w: 12, h: 12, vx: 7 * p.face, vy: 1, t: 0, owner: p, enemy: false });
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
    b.hp -= n; b.inv = 40; b.hurtFlash = 20;
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

  // ─── Jugador ────────────────────────────────────────────────
  function ctrlOf(p) {
    if (p.id === 0) return { left: keys['a'], right: keys['d'], jump: keys['w'], down: keys['s'] };
    return { left: keys['arrowleft'], right: keys['arrowright'], jump: keys['arrowup'], down: keys['arrowdown'] };
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
      p.vy = JUMP_V; p.onGround = false; p.coyote = 0; p.jumpBuf = 0; SFX.jump();
    }
    p.jumpHeld = !!c.jump;

    // disparo
    if (c.down && p.power === 2) shoot(p);

    // gravedad: más suave si mantiene el salto (salto variable)
    var g = (p.vy < 0 && p.jumpHeld) ? GRAV_HOLD : GRAV;
    p.vy = Math.min(p.vy + g, MAX_FALL);

    moveX(p);
    p.x = clamp(p.x, 0, G.w - p.w);
    moveY(p, p);
    if (Math.abs(p.vx) > 0.3) p.anim += Math.abs(p.vx) * 0.35;

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
      p.invuln = 100; SFX.hurt();
    } else die(p);
  }
  function die(p) {
    if (p.dead) return;
    p.dead = true; p.deadT = 90; p.vy = -9; p.lives--; p.power = 0;
    p.w = 20; p.h = 26; SFX.die();
    if (G.players.every(function (q) { return q.out || (q.dead && q.lives <= 0); })) {
      setTimeout(gameOver, 900);
    }
  }

  // ─── Fin de nivel / partida ─────────────────────────────────
  function levelClear() {
    G.state = 'clear'; G.cardT = 170; SFX.clear();
    var lv = LEVELS[G.levelIdx];
    G.msg = '¡MUNDO ' + lv.name + ' COMPLETADO!';
    G.sub = 'Bonus de tiempo: ' + (G.time * 10);
    sendScore();
  }
  function gameOver() {
    if (G.state === 'over' || G.state === 'victory') return;
    G.state = 'over'; G.cardT = 99999;
    G.msg = 'FIN DEL JUEGO';
    G.sub = 'Enter para volver a empezar';
    sendScore();
  }
  function victory() {
    G.state = 'victory'; G.cardT = 99999;
    G.msg = '¡GANARON!';
    G.sub = 'Derrotaron al Rey Espina · Enter para el menú';
    SFX.win(); sendScore();
  }
  function nextLevel() {
    if (G.levelIdx + 1 >= LEVELS.length) { victory(); return; }
    G.players.forEach(function (p) { p.done = false; });
    loadLevel(G.levelIdx + 1);
  }
  function totalScore() {
    return G.players.reduce(function (s, p) { return s + p.score; }, 0);
  }
  function sendScore() {
    var pts = totalScore();
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

    // cámara: sigue al jugador que va delante
    var lead = 0, any = false;
    G.players.forEach(function (p) { if (!p.out && !p.dead) { lead = Math.max(lead, p.x); any = true; } });
    if (any) {
      var target = clamp(lead - VIEW_W * 0.42, 0, Math.max(0, G.w - VIEW_W));
      G.cam += (target - G.cam) * 0.12;
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

  function drawBackground(th) {
    var cam = G ? G.cam : 0;
    var g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, th.sky1); g.addColorStop(1, th.sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // nubes (parallax lento)
    var off = (cam * 0.25) % 400;
    for (var i = -1; i < 4; i++) {
      var cx = i * 400 - off + 60, cy = 60 + (i % 2) * 40;
      px(cx, cy, 60, 16, th.cloud); px(cx + 14, cy - 12, 34, 14, th.cloud); px(cx + 30, cy + 10, 44, 12, th.cloud);
    }
    // colinas (parallax medio)
    var off2 = (cam * 0.5) % 320;
    for (var j = -1; j < 5; j++) {
      var hx = j * 320 - off2;
      ctx.fillStyle = th.hill2;
      ctx.beginPath(); ctx.moveTo(hx, VIEW_H); ctx.lineTo(hx + 80, VIEW_H - 110); ctx.lineTo(hx + 170, VIEW_H); ctx.fill();
      ctx.fillStyle = th.hill;
      ctx.beginPath(); ctx.moveTo(hx + 120, VIEW_H); ctx.lineTo(hx + 200, VIEW_H - 70); ctx.lineTo(hx + 280, VIEW_H); ctx.fill();
    }
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
    px(x, f.y, 5, f.h, '#dee2e6');
    px(x - 2, f.y + f.h - 6, 10, 6, '#adb5bd');
    var locked = LEVELS[G.levelIdx].world === 3 && !G.bossDead;
    var col = locked ? '#868e96' : (f.taken ? '#51cf66' : '#ff6b6b');
    var wave = Math.sin(G.frame / 12) * 3;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x + 5, f.y + 6); ctx.lineTo(x + 40 + wave, f.y + 18); ctx.lineTo(x + 5, f.y + 30); ctx.fill();
    // castillo detrás
    px(x + 30, VIEW_H - 96, 74, 96, '#9c5c3c');
    px(x + 30, VIEW_H - 100, 74, 8, '#7a462c');
    px(x + 56, VIEW_H - 44, 22, 44, '#3b2a20');
    for (var i = 0; i < 4; i++) px(x + 32 + i * 20, VIEW_H - 112, 12, 14, '#9c5c3c');
  }

  // Personaje jugable, dibujado con bloques
  function drawPlayer(p) {
    if (p.out) return;
    var x = p.x - G.cam, y = p.y, w = p.w, h = p.h;
    if (p.invuln > 0 && Math.floor(G.frame / 4) % 2 === 0 && !p.dead) return;
    var main = p.id === 0 ? '#e03131' : '#2f9e44';
    var pants = p.id === 0 ? '#1971c2' : '#1098ad';
    if (p.star > 0) {
      var cyc = Math.floor(G.frame / 4) % 4;
      main = ['#ffd43b', '#ffffff', '#ff922b', '#69db7c'][cyc];
      pants = ['#fff3bf', '#ffd43b', '#ffffff', '#a9e34b'][cyc];
    }
    if (p.power === 2) { main = p.star > 0 ? main : '#f8f9fa'; }
    var skin = '#ffd0a1', hair = '#4a2c14', boot = '#5c3a21';
    var step = Math.floor(p.anim / 6) % 2;
    ctx.save();
    if (p.dead) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(Math.sin(G.frame / 6) * 0.4); ctx.translate(-w / 2, -h / 2); x = 0; y = 0; }

    var u = h / 26;              // escala vertical (pequeño = 1)
    // gorra
    px(x + 2, y, w - 4, 6 * u * 0.7, main);
    px(x + w - 6, y + 3 * u * 0.7, 7, 4 * u * 0.7, main);
    // cara
    px(x + 3, y + 5 * u * 0.7, w - 6, 8 * u, skin);
    px(x + (p.face > 0 ? w - 9 : 4), y + 7 * u * 0.7, 3, 3, '#20211f');            // ojo
    px(x + 3, y + 10 * u, w - 6, 3, hair);                                          // bigote
    px(x + (p.face > 0 ? 2 : w - 6), y + 6 * u * 0.7, 4, 5 * u * 0.7, hair);        // pelo
    // cuerpo / peto
    var by = y + 13 * u * 0.72;
    px(x + 2, by, w - 4, h - (by - y) - 5 * u, main);
    px(x + 4, by + 2, w - 8, h - (by - y) - 7 * u, pants);
    px(x + 5, by + 3, 4, 4, '#ffd43b'); px(x + w - 9, by + 3, 4, 4, '#ffd43b');    // botones
    // brazos
    px(x + (p.face > 0 ? w - 3 : 0), by + 1, 4, 8 * u * 0.8, skin);
    // botas (animadas)
    if (p.onGround) {
      px(x + (step ? 1 : 3), y + h - 5 * u, 8, 5 * u, boot);
      px(x + w - (step ? 11 : 9), y + h - 5 * u, 8, 5 * u, boot);
    } else {
      px(x + 1, y + h - 5 * u, 9, 5 * u, boot); px(x + w - 10, y + h - 6 * u, 9, 5 * u, boot);
    }
    ctx.restore();
    // etiqueta P1/P2
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText(p.id === 0 ? 'P1' : 'P2', p.x - G.cam + p.w / 2, p.y - 6);
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
    px(0, 0, VIEW_W, 34, 'rgba(0,0,0,0.42)');
    ctx.font = 'bold 13px monospace';
    G.players.forEach(function (p, i) {
      var x = 12 + i * 250;
      ctx.fillStyle = p.id === 0 ? '#ff8787' : '#8ce99a';
      ctx.fillText((p.id === 0 ? 'P1' : 'P2') + (p.out ? ' FUERA' : ''), x, 15);
      ctx.fillStyle = '#fff';
      ctx.fillText(('000000' + p.score).slice(-6) + '  ✖' + Math.max(0, p.lives) + '  ◉' + p.coins, x, 29);
      if (p.power === 2) { ctx.fillStyle = '#ffd43b'; ctx.fillText('FUEGO', x + 150, 15); }
      else if (p.power === 1) { ctx.fillStyle = '#ffa8a8'; ctx.fillText('GRANDE', x + 150, 15); }
      if (p.star > 0) { ctx.fillStyle = '#ffe066'; ctx.fillText('★' + Math.ceil(p.star / 60), x + 205, 15); }
    });
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
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
    ctx.fillStyle = sel === 0 ? '#51cf66' : '#868e96';
    ctx.fillText((sel === 0 ? '▶ ' : '   ') + '1 JUGADOR', VIEW_W / 2, 220);
    ctx.fillStyle = sel === 1 ? '#51cf66' : '#868e96';
    ctx.fillText((sel === 1 ? '▶ ' : '   ') + '2 JUGADORES', VIEW_W / 2, 252);
    ctx.fillStyle = '#dee2e6'; ctx.font = '12px monospace';
    ctx.fillText('W/S o ↑/↓ para elegir · ENTER para empezar', VIEW_W / 2, 296);
    ctx.fillStyle = '#ffd8a8';
    ctx.fillText('P1: A D mover · W saltar · S disparar', VIEW_W / 2, 330);
    ctx.fillStyle = '#b2f2bb';
    ctx.fillText('P2: ← → mover · ↑ saltar · ↓ disparar', VIEW_W / 2, 350);
    ctx.fillStyle = '#adb5bd';
    ctx.fillText('P pausa · R reiniciar nivel', VIEW_W / 2, 374);
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
    while (acc >= STEP && guard++ < 5) { acc -= STEP; if (G && G.state !== 'pause' && G.state !== 'title') update(); }
    render();
  }

  // ─── Entrada de teclado ─────────────────────────────────────
  var sel = 0;
  var BLOCK = { ' ': 1, 'arrowup': 1, 'arrowdown': 1, 'arrowleft': 1, 'arrowright': 1 };
  function onKey(e, down) {
    var k = (e.key || '').toLowerCase();
    if (BLOCK[k]) e.preventDefault();
    keys[k] = down;
    if (!down) return;
    if (!G || G.state === 'title') {
      if (k === 'w' || k === 'arrowup') { sel = 0; }
      if (k === 's' || k === 'arrowdown') { sel = 1; }
      if (k === 'enter') { ac(); newGame(sel === 1); }
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
    document.addEventListener('keydown', function (e) { onKey(e, true); });
    document.addEventListener('keyup', function (e) { onKey(e, false); });
    canvas.addEventListener('click', function () { ac(); canvas.focus(); });
    if (!raf) raf = requestAnimationFrame(frame);
  }

  window.BigoteBros = {
    init: init,
    // Para botones táctiles: BigoteBros.key('a', true) / ('a', false)
    key: function (name, down) {
      keys[String(name).toLowerCase()] = !!down;
      if (down && name === 'enter') onKey({ key: 'Enter', preventDefault: function () { } }, true);
    },
    start2P: function () { ac(); newGame(true); },
    start1P: function () { ac(); newGame(false); },
    toMenu: function () { G = null; },
    // solo para pruebas: BigoteBros._level(6) salta al nivel del jefe
    _level: function (i) { if (!G) newGame(false); loadLevel(i); },
    mute: function (v) { muted = !!v; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init('marioCanvas'); });
  } else { init('marioCanvas'); }
})();

