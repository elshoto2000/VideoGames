/* ═══════════════════════════════════════════════════════
   lobby.js — Space Lobby (multijugador real)
   Sala espacial tipo Among Us: personaje animado con
   caminata, parpadeo, brazos oscilantes. Mapa expandido
   con varias salas conectadas por puertas, cámara que
   sigue al jugador, jugadores reales vía Socket.IO y
   chat en tiempo real.
   ═══════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const container = document.querySelector('.canvas-placeholder');
    if (!container) return;

    /* Ocultar game-over genérico */
    const gos = document.getElementById('game-over-screen');
    if (gos) gos.style.display = 'none';
    const sc = document.getElementById('simon-game-container');
    if (sc) sc.style.display = 'none';

    /* ── Usuario ── */
    const userEl = document.getElementById('display-user');
    const USERNAME = (userEl ? userEl.innerText : 'Jugador').replace('Jugador: ', '').trim();

    /* ── Canvas ── */
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;border-radius:12px;image-rendering:pixelated;cursor:none;';
    container.innerHTML = '';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const W = 480, H = 380;
    canvas.width  = W;
    canvas.height = H;

    /* ── Escala de píxel para personajes ── */
    const PX = 3; // cada "píxel" del sprite = 3px reales

    /* ── Colores de traje (Among Us style) ── */
    const COLORES = [
        { body:'#e8445a', shadow:'#9e2030', visor:'#a8d8ff', visorshadow:'#6ab0e0' },
        { body:'#4f7cff', shadow:'#2a4bb0', visor:'#a8d8ff', visorshadow:'#6ab0e0' },
        { body:'#34c77b', shadow:'#1a7a45', visor:'#a8d8ff', visorshadow:'#6ab0e0' },
        { body:'#e8c97a', shadow:'#9e7d30', visor:'#a8d8ff', visorshadow:'#6ab0e0' },
        { body:'#c56aff', shadow:'#7a30b0', visor:'#a8d8ff', visorshadow:'#6ab0e0' },
        { body:'#ff8c42', shadow:'#b05010', visor:'#a8d8ff', visorshadow:'#6ab0e0' },
    ];

    /* ═══════════════════════════════════════════════════
       MAPA — 4 salas conectadas por puertas, en coords
       de "mundo" (mucho más grande que el canvas).
       ═══════════════════════════════════════════════════ */
    const T = 28; // grosor de pared

    const ROOMS = {
        central:      { x: 0,    y: 0,    w: 480, h: 380, label: 'SALA CENTRAL — SECTOR 7' },
        consolas:     { x: 480,  y: 0,    w: 480, h: 380, label: 'SALA DE CONTROL' },
        observatorio: { x: -480, y: 0,    w: 480, h: 380, label: 'OBSERVATORIO' },
        almacen:      { x: 0,    y: -380, w: 480, h: 380, label: 'ALMACÉN' },
    };

    const WORLD_MIN_X = -480, WORLD_MAX_X = 960;
    const WORLD_MIN_Y = -380, WORLD_MAX_Y = 380;

    /* Puertas: rango libre (gap) sobre la pared compartida */
    const DOOR_EW_Y = [150, 230];  // gap vertical en paredes este/oeste de central
    const DOOR_NS_X = [200, 280];  // gap horizontal en pared norte de central

    /* Paredes (rects de colisión + dibujo). x,y,w,h en coords de mundo. */
    const WALLS = [
        /* Central */
        { x: 0,   y: 352, w: 480, h: T },                 // sur (exterior)
        { x: 0,   y: 0,   w: 200, h: T },                 // norte-izq (junto a puerta a almacén)
        { x: 280, y: 0,   w: 200, h: T },                 // norte-der
        { x: 0,   y: 0,   w: T,   h: 150 },               // oeste-arriba (junto a puerta a observatorio)
        { x: 0,   y: 230, w: T,   h: 150 },               // oeste-abajo
        { x: 452, y: 0,   w: T,   h: 150 },               // este-arriba (junto a puerta a consolas)
        { x: 452, y: 230, w: T,   h: 150 },               // este-abajo

        /* Consolas (este) */
        { x: 480, y: 0,   w: 480, h: T },                 // norte (exterior)
        { x: 480, y: 352, w: 480, h: T },                 // sur (exterior)
        { x: 932, y: 0,   w: T,   h: 380 },               // este (exterior)

        /* Observatorio (oeste) */
        { x: -480, y: 0,   w: 480, h: T },                // norte (exterior)
        { x: -480, y: 352, w: 480, h: T },                // sur (exterior)
        { x: -480, y: 0,   w: T,   h: 380 },              // oeste (exterior)

        /* Almacén (norte) */
        { x: 0,   y: -380, w: 480, h: T },                // norte (exterior)
        { x: 0,   y: -380, w: T,   h: 380 },              // oeste (exterior)
        { x: 452, y: -380, w: T,   h: 380 },              // este (exterior)
        { x: 0,   y: -28,  w: 200, h: T },                // sur-izq (junto a puerta a central)
        { x: 280, y: -28,  w: 200, h: T },                // sur-der
    ];

    function roomAt(x, y) {
        for (const key in ROOMS) {
            const r = ROOMS[key];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return key;
        }
        return 'central';
    }

    function collides(x, y, r) {
        for (const wl of WALLS) {
            if (x + r > wl.x && x - r < wl.x + wl.w && y + r > wl.y && y - r < wl.y + wl.h) return true;
        }
        return false;
    }

    /* ── Dibuja personaje Among Us pixel art ──
       cx, cy = centro inferior del personaje (coords de MUNDO)
    ── */
    function drawAmongus(cx, cy, color, frame, facing, blink, label, isPlayer) {
        const p = PX;
        ctx.save();
        ctx.translate(cx, cy);
        if (facing < 0) ctx.scale(-1, 1);

        /* ── Sombra suave en el suelo ── */
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(0, 2, 10*p/3, 3, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        /* ── Piernas (animadas) ── */
        const legFrames = [
            [[0,0],[0,0]],
            [[-2,-1],[2,1]],
            [[0,0],[0,0]],
            [[2,-1],[-2,1]],
        ];
        const legs = legFrames[frame % 4];
        ctx.fillStyle = color.shadow;
        ctx.fillRect(-3*p + legs[0][0], -2*p + legs[0][1], 2*p, 3*p);
        ctx.fillRect( 1*p + legs[1][0], -2*p + legs[1][1], 2*p, 3*p);

        /* ── Cuerpo principal ── */
        ctx.fillStyle = color.body;
        ctx.fillRect(-3*p, -8*p, 6*p, 6*p);
        ctx.fillRect(-3*p, -13*p, 6*p, 5*p);
        ctx.fillRect(-2*p, -14*p, 4*p, 1*p);

        ctx.fillStyle = color.shadow;
        ctx.fillRect( 2*p, -8*p, 1*p, 6*p);
        ctx.fillRect( 2*p, -13*p, 1*p, 5*p);

        ctx.fillStyle = color.shadow;
        ctx.fillRect(-4*p, -7*p, 1*p, 4*p);

        const armSwing = Math.sin(frame * Math.PI / 2) * 2;
        ctx.fillStyle = color.body;
        ctx.fillRect(3*p, -7*p + armSwing, 1*p, 3*p);
        ctx.fillStyle = color.shadow;
        ctx.fillRect(3*p, -7*p + armSwing + 2*p, 1*p, 1*p);

        if (!blink) {
            ctx.fillStyle = color.visor;
            ctx.fillRect(-2*p, -13*p, 4*p, 3*p);
            ctx.fillRect(-1*p, -14*p, 2*p, 1*p);
            ctx.fillStyle = color.visorshadow;
            ctx.fillRect( 1*p, -13*p, 1*p, 2*p);
        } else {
            ctx.fillStyle = color.visorshadow;
            ctx.fillRect(-2*p, -12*p, 4*p, 1*p);
        }

        ctx.restore();

        /* ── Etiqueta de nombre ── */
        if (label) {
            ctx.save();
            ctx.font = `bold ${p*3}px "DM Mono", monospace`;
            ctx.textAlign = 'center';
            const tw = ctx.measureText(label).width;
            ctx.fillStyle = isPlayer ? 'rgba(79,124,255,0.7)' : 'rgba(0,0,0,0.55)';
            ctx.fillRect(cx - tw/2 - 4, cy - 15*p - p*3 - 2, tw + 8, p*3 + 4);
            ctx.fillStyle = '#eeeef5';
            ctx.fillText(label, cx, cy - 15*p);
            ctx.restore();
        }
    }

    /* ── Dibuja una sala (fondo + decoración), en coords de mundo ── */
    function drawRoomBg(r) {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(r.x, r.y, r.w, r.h);

        ctx.strokeStyle = 'rgba(79,124,255,0.08)';
        ctx.lineWidth = 1;
        for (let x = r.x; x < r.x + r.w; x += 32) {
            ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke();
        }
        for (let y = r.y; y < r.y + r.h; y += 32) {
            ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke();
        }

        /* Luces de techo ambientales */
        const lights = [r.x + 80, r.x + 240, r.x + 400];
        lights.forEach(lx => {
            const grad = ctx.createRadialGradient(lx, r.y + 28, 0, lx, r.y + 28, 110);
            grad.addColorStop(0, 'rgba(160,200,255,0.06)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(r.x, r.y, r.w, r.h);
        });
    }

    function drawWalls() {
        WALLS.forEach(wl => {
            ctx.fillStyle = '#0f0f2a';
            ctx.fillRect(wl.x, wl.y, wl.w, wl.h);
            ctx.fillStyle = 'rgba(79,124,255,0.18)';
            /* pequeño borde de luz según orientación */
            if (wl.h > wl.w) { // pared vertical
                const edgeX = wl.x + wl.w/2 < (wl.x+wl.w) ? wl.x + wl.w - 2 : wl.x;
                ctx.fillRect(wl.x + wl.w - 2, wl.y, 2, wl.h);
            } else { // pared horizontal
                ctx.fillRect(wl.x, wl.y + wl.h - 2, wl.w, 2);
            }
        });
    }

    /* Marco luminoso de puerta */
    function drawDoorGlow(x, y, w, h) {
        const t = Date.now() / 500;
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(t) * 0.12;
        ctx.fillStyle = '#34c77b';
        ctx.fillRect(x, y, w, h);
        ctx.restore();
    }

    function drawConsola(x, y) {
        ctx.fillStyle = '#1a1a35';
        ctx.fillRect(x, y, 36, 30);
        ctx.fillStyle = '#0f0f25';
        ctx.fillRect(x, y+30, 36, 8);
        ctx.fillStyle = '#0a2040';
        ctx.fillRect(x+3, y+3, 30, 18);
        ctx.fillStyle = 'rgba(79,124,255,0.4)';
        for (let i = 0; i < 4; i++) ctx.fillRect(x+5, y+5+i*4, 15+Math.random()*10|0, 1);
        ctx.fillStyle = '#34c77b';
        ctx.beginPath(); ctx.arc(x+28, y+24, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#e8445a';
        ctx.beginPath(); ctx.arc(x+22, y+24, 2, 0, Math.PI*2); ctx.fill();
    }

    function drawVentana(x, y, w, h) {
        ctx.fillStyle = '#1a1a35';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#030310';
        ctx.fillRect(x+3, y+3, w-6, h-6);
        ctx.fillStyle = '#ffffff';
        const stars = [[8,8],[20,15],[45,6],[60,20],[15,35],[50,40],[30,28]];
        stars.forEach(([sx,sy]) => {
            ctx.globalAlpha = 0.7 + Math.sin(Date.now()/800 + sx) * 0.3;
            ctx.fillRect(x+3+sx, y+3+sy, 1, 1);
        });
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(100,60,200,0.5)';
        ctx.beginPath(); ctx.arc(x+55, y+12, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(80,40,160,0.4)';
        ctx.fillRect(x+50, y+12, 10, 3);
        ctx.strokeStyle = 'rgba(79,124,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x+3, y+3, w-6, h-6);
        ctx.fillStyle = '#1a1a35';
        ctx.fillRect(x+w/2-2, y, 4, h);
        ctx.fillRect(x, y+h/2-2, w, 4);
    }

    function drawCaja(x, y) {
        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(x, y, 22, 22);
        ctx.strokeStyle = 'rgba(52,199,123,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 22, 22);
        ctx.fillStyle = 'rgba(52,199,123,0.2)';
        ctx.fillRect(x+4, y+4, 14, 2);
        ctx.fillRect(x+4, y+10, 14, 1);
    }

    function drawDoorSign(x, y, text) {
        ctx.save();
        ctx.font = '8px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(52,199,123,0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    /* ── Dibuja el mundo completo (llamado dentro del translate de cámara) ── */
    function drawWorld() {
        drawRoomBg(ROOMS.central);
        drawRoomBg(ROOMS.consolas);
        drawRoomBg(ROOMS.observatorio);
        drawRoomBg(ROOMS.almacen);

        drawWalls();

        /* Brillos de puertas */
        drawDoorGlow(452, DOOR_EW_Y[0], 2*T, DOOR_EW_Y[1]-DOOR_EW_Y[0]); // central->consolas
        drawDoorGlow(0,   DOOR_EW_Y[0], -2, DOOR_EW_Y[1]-DOOR_EW_Y[0]);
        drawDoorGlow(200, -T, 80, 2*T); // central->almacen

        /* Decoración — Sala central */
        drawConsola(50,  330);
        drawCaja(210, 330);
        drawCaja(235, 330);
        drawDoorSign(240, 20, '↑ ALMACÉN');
        drawDoorSign(20,  190, '← OBSERVATORIO');
        drawDoorSign(460, 190, 'SALA DE CONTROL →');

        /* Decoración — Sala de control (este) */
        drawConsola(530, 40);
        drawConsola(620, 40);
        drawConsola(710, 40);
        drawConsola(800, 40);
        ctx.save();
        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(79,124,255,0.35)';
        ctx.textAlign = 'center';
        ctx.fillText(ROOMS.consolas.label, 480 + 240, 380 - 10);
        ctx.restore();

        /* Decoración — Observatorio (oeste) */
        drawVentana(-480 + 60, 60, 140, 90);
        drawVentana(-480 + 260, 60, 140, 90);
        ctx.save();
        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(79,124,255,0.35)';
        ctx.textAlign = 'center';
        ctx.fillText(ROOMS.observatorio.label, -480 + 240, 380 - 10);
        ctx.restore();

        /* Decoración — Almacén (norte) */
        for (let i = 0; i < 6; i++) {
            drawCaja(60 + (i % 3) * 60, -380 + 60 + Math.floor(i/3) * 40);
            drawCaja(300 + (i % 3) * 40, -380 + 200 + Math.floor(i/3) * 30);
        }
        ctx.save();
        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(79,124,255,0.35)';
        ctx.textAlign = 'center';
        ctx.fillText(ROOMS.almacen.label, 240, -380 + 20);
        ctx.restore();

        ctx.save();
        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(79,124,255,0.35)';
        ctx.textAlign = 'center';
        ctx.fillText(ROOMS.central.label, 240, 380 - 10);
        ctx.restore();
    }

    /* ── Estado del jugador local ── */
    const PLAYER_R = 11;
    const player = {
        x: 240, y: 190,
        vx: 0, vy: 0, speed: 2.4,
        frame: 0, frameTimer: 0, frameInterval: 8,
        facing: 1,
        blink: false, blinkTimer: 0, blinkInterval: 180,
        color: COLORES[Math.floor(Math.random() * COLORES.length)],
        name: USERNAME.slice(0, 10),
        moving: false,
        room: 'central',
    };

    /* ── Jugadores remotos (reales, vía Socket.IO) ── */
    const remotePlayers = {}; // sid -> {x,y,tx,ty,facing,moving,frame,frameTimer,blink,color,name,room}

    function remoteFromServer(p) {
        return {
            x: p.x, y: p.y, tx: p.x, ty: p.y,
            facing: p.facing || 1,
            moving: !!p.moving,
            frame: 0, frameTimer: 0,
            blink: false, blinkTimer: Math.random() * 200 | 0,
            color: COLORES[(p.colorIdx || 0) % COLORES.length],
            name: (p.username || 'Jugador').slice(0, 10),
            room: p.room || 'central',
        };
    }

    /* ── Controles (4 direcciones) ── */
    const keys = {};
    const MOVE_KEYS = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s','A','D','W','S'];
    function onKey(e, val) {
        if (MOVE_KEYS.includes(e.key)) {
            keys[e.key] = val;
            e.preventDefault();
        }
    }
    window.addEventListener('keydown', e => {
        onKey(e, true);
        /* Enter enfoca el chat si no está enfocado */
        if (e.key === 'Enter' && document.activeElement !== chatInput) {
            chatInput && chatInput.focus();
        }
    });
    window.addEventListener('keyup',   e => onKey(e, false));

    /* Táctil: joystick virtual simple (4 direcciones) */
    let touchStart = null;
    canvas.addEventListener('touchstart', e => {
        const t = e.touches[0];
        touchStart = { x: t.clientX, y: t.clientY };
        e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
        if (!touchStart) return;
        const t = e.touches[0];
        const dx = t.clientX - touchStart.x;
        const dy = t.clientY - touchStart.y;
        player.vx = Math.max(-player.speed, Math.min(player.speed, dx * 0.05));
        player.vy = Math.max(-player.speed, Math.min(player.speed, dy * 0.05));
        e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', () => {
        touchStart = null;
        player.vx = 0; player.vy = 0;
    });

    /* ── Burbujas de chat flotantes ── */
    const bubbles = []; // {text, x, y, life}
    function spawnBubble(x, y, text) {
        bubbles.push({ text, x, y: y - 20*PX, life: 200 });
    }

    /* ── Update jugador local ── */
    function updatePlayer() {
        let ix = 0, iy = 0;
        if (keys['ArrowLeft'] || keys['a'] || keys['A'])  ix -= 1;
        if (keys['ArrowRight']|| keys['d'] || keys['D'])  ix += 1;
        if (keys['ArrowUp']   || keys['w'] || keys['W'])  iy -= 1;
        if (keys['ArrowDown'] || keys['s'] || keys['S'])  iy += 1;

        if (ix !== 0 || iy !== 0) {
            const len = Math.hypot(ix, iy) || 1;
            player.vx = (ix / len) * player.speed;
            player.vy = (iy / len) * player.speed;
        } else if (touchStart === null) {
            player.vx *= 0.6;
            player.vy *= 0.6;
        }

        player.moving = Math.abs(player.vx) > 0.15 || Math.abs(player.vy) > 0.15;

        /* Movimiento con colisión por eje */
        const nx = player.x + player.vx;
        if (!collides(nx, player.y, PLAYER_R) &&
            nx > WORLD_MIN_X + 4 && nx < WORLD_MAX_X - 4) player.x = nx;

        const ny = player.y + player.vy;
        if (!collides(player.x, ny, PLAYER_R) &&
            ny > WORLD_MIN_Y + 4 && ny < WORLD_MAX_Y - 4) player.y = ny;

        if (Math.abs(player.vx) > 0.15) player.facing = player.vx > 0 ? 1 : -1;

        player.room = roomAt(player.x, player.y);

        if (player.moving) {
            player.frameTimer++;
            if (player.frameTimer >= player.frameInterval) {
                player.frameTimer = 0;
                player.frame = (player.frame + 1) % 4;
            }
        } else {
            player.frame = 0;
        }

        player.blinkTimer++;
        if (player.blinkTimer >= player.blinkInterval) {
            player.blinkTimer = 0; player.blink = true;
            setTimeout(() => { player.blink = false; }, 100);
        }
    }

    /* ── Update jugadores remotos (interpolación suave) ── */
    function updateRemotePlayers() {
        for (const sid in remotePlayers) {
            const rp = remotePlayers[sid];
            rp.x += (rp.tx - rp.x) * 0.25;
            rp.y += (rp.ty - rp.y) * 0.25;

            if (rp.moving) {
                rp.frameTimer = (rp.frameTimer || 0) + 1;
                if (rp.frameTimer >= 9) {
                    rp.frameTimer = 0;
                    rp.frame = (rp.frame + 1) % 4;
                }
            } else {
                rp.frame = 0;
            }

            rp.blinkTimer = (rp.blinkTimer || 0) + 1;
            if (rp.blinkTimer >= 170) {
                rp.blinkTimer = 0; rp.blink = true;
                setTimeout(() => { rp.blink = false; }, 100);
            }
        }
    }

    function updateBubbles() {
        for (let i = bubbles.length - 1; i >= 0; i--) {
            bubbles[i].life--;
            bubbles[i].y -= 0.3;
            if (bubbles[i].life <= 0) bubbles.splice(i, 1);
        }
    }

    function drawBubble(b) {
        const alpha = Math.min(1, b.life / 30);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 11px "DM Mono", monospace';
        ctx.textAlign = 'center';
        const tw = ctx.measureText(b.text).width;
        const bw = tw + 12, bh = 18;
        const bx = b.x - bw/2, by = b.y - bh;
        ctx.fillStyle = 'rgba(20,20,40,0.85)';
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(79,124,255,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#eeeef5';
        ctx.fillText(b.text, b.x, by + 13);
        ctx.restore();
    }

    /* ── Cámara ── */
    let camX = 0, camY = 0;
    function updateCamera() {
        const targetX = Math.max(WORLD_MIN_X, Math.min(WORLD_MAX_X - W, player.x - W/2));
        const targetY = Math.max(WORLD_MIN_Y, Math.min(WORLD_MAX_Y - H, player.y - H/2));
        camX += (targetX - camX) * 0.15;
        camY += (targetY - camY) * 0.15;
    }

    /* ── HUD (pantalla fija, se dibuja fuera del translate) ── */
    function drawHUD() {
        ctx.save();
        ctx.fillStyle = 'rgba(8,8,24,0.75)';
        ctx.beginPath();
        ctx.roundRect(W - 28 - 150, 10, 140, 108, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(79,124,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(79,124,255,0.6)';
        ctx.textAlign = 'left';
        ctx.fillText('JUGADORES CONECTADOS', W - 28 - 142, 26);

        const remoteList = Object.values(remotePlayers);
        const allPlayers = [{ name: player.name, color: player.color, isPlayer: true }]
            .concat(remoteList.map(p => ({ name: p.name, color: p.color, isPlayer: false })));

        allPlayers.slice(0, 5).forEach((p, i) => {
            const dot_x = W - 28 - 138;
            const dot_y = 40 + i * 15;
            ctx.fillStyle = p.color.body;
            ctx.beginPath();
            ctx.arc(dot_x, dot_y, 4, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = p.isPlayer ? '#eeeef5' : '#a0a0c0';
            ctx.font = p.isPlayer ? 'bold 10px "DM Mono", monospace' : '10px "DM Mono", monospace';
            ctx.fillText((p.isPlayer ? '★ ' : '') + p.name, dot_x + 10, dot_y + 4);
        });
        if (allPlayers.length > 5) {
            ctx.fillStyle = 'rgba(160,160,200,0.6)';
            ctx.font = '9px "DM Mono", monospace';
            ctx.fillText(`+${allPlayers.length - 5} más…`, W - 28 - 138, 40 + 5*15);
        }

        ctx.fillStyle = '#34c77b';
        ctx.beginPath();
        ctx.arc(W - 28 - 20, 20, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 400) * 0.3;
        ctx.beginPath();
        ctx.arc(W - 28 - 20, 20, 7, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();

        ctx.save();
        ctx.fillStyle = 'rgba(8,8,24,0.65)';
        ctx.beginPath();
        ctx.roundRect(10, H - 28, 240, 20, 6);
        ctx.fill();
        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(79,124,255,0.5)';
        ctx.textAlign = 'left';
        ctx.fillText('← ↑ → ↓ / WASD para mover · Chat a la derecha', 18, H - 14);
        ctx.restore();

        ctx.save();
        ctx.font = 'bold 13px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(79,124,255,0.7)';
        ctx.textAlign = 'left';
        ctx.fillText('SPACE LOBBY', 10, 18);
        ctx.restore();
    }

    /* ── Orden de dibujo por Y ── */
    function drawAllCharacters() {
        const all = [
            { x: player.x, y: player.y, color: player.color, frame: player.frame, facing: player.facing, blink: player.blink, name: player.name, isPlayer: true },
            ...Object.values(remotePlayers).map(p => ({
                x: p.x, y: p.y, color: p.color, frame: p.frame, facing: p.facing, blink: p.blink, name: p.name, isPlayer: false
            }))
        ].sort((a, b) => a.y - b.y);

        all.forEach(c => {
            drawAmongus(c.x, c.y, c.color, c.frame, c.facing, c.blink, c.name, c.isPlayer);
        });
    }

    /* ═══════════════════════════════════════════════════
       CHAT — UI lateral + Socket.IO
       ═══════════════════════════════════════════════════ */
    const chatMessages = document.getElementById('lobby-chat-messages');
    const chatForm     = document.getElementById('lobby-chat-form');
    const chatInput    = document.getElementById('lobby-chat-input');

    function addChatLine(html, cls) {
        if (!chatMessages) return;
        const div = document.createElement('div');
        div.className = 'lobby-chat-msg' + (cls ? ' ' + cls : '');
        div.innerHTML = html;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    let socket = null;
    if (typeof io === 'function') {
        socket = io({ transports: ['websocket', 'polling'] });

        socket.on('connect', () => {
            addChatLine('Conectado a la sala.', 'system');
            socket.emit('lobby_join', { x: player.x, y: player.y, room: player.room, facing: player.facing });
        });

        socket.on('connect_error', () => {
            addChatLine('No se pudo conectar al chat en tiempo real.', 'system');
        });

        socket.on('lobby_state', (data) => {
            const players = data.players || {};
            for (const sid in players) {
                remotePlayers[sid] = remoteFromServer(players[sid]);
            }
        });

        socket.on('lobby_player_joined', (data) => {
            remotePlayers[data.sid] = remoteFromServer(data.player);
            addChatLine(`${data.player.username} entró a la sala.`, 'system');
        });

        socket.on('lobby_player_moved', (data) => {
            const rp = remotePlayers[data.sid];
            if (!rp) return;
            rp.tx = data.x; rp.ty = data.y;
            rp.facing = data.facing;
            rp.moving = data.moving;
            rp.room = data.room;
        });

        socket.on('lobby_player_left', (data) => {
            const rp = remotePlayers[data.sid];
            if (rp) addChatLine(`${rp.name} salió de la sala.`, 'system');
            delete remotePlayers[data.sid];
        });

        socket.on('lobby_chat', (data) => {
            const isSelf = data.username === player.name || data.username === USERNAME;
            addChatLine(`<b>${escapeHtml(data.username)}:</b> ${escapeHtml(data.text)}`, isSelf ? 'self' : '');

            /* Burbuja flotante sobre el emisor */
            if (isSelf) {
                spawnBubble(player.x, player.y, data.text);
            } else {
                const rp = Object.values(remotePlayers).find(p => p.name === data.username.slice(0,10));
                if (rp) spawnBubble(rp.x, rp.y, data.text);
            }
        });

        socket.on('disconnect', () => {
            addChatLine('Desconectado del servidor. Reconectando…', 'system');
        });
    } else {
        addChatLine('Chat no disponible (falta socket.io-client).', 'system');
    }

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.innerText = str;
        return d.innerHTML;
    }

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = (chatInput.value || '').trim();
            if (!text || !socket) return;
            socket.emit('lobby_chat', { text });
            chatInput.value = '';
        });
    }

    /* Enviar posición periódicamente (throttle) */
    let lastSent = { x: null, y: null, moving: null, facing: null };
    let lastSentTime = 0;
    function maybeSendMove() {
        if (!socket || !socket.connected) return;
        const now = Date.now();
        const moved = Math.abs((lastSent.x ?? 0) - player.x) > 1 || Math.abs((lastSent.y ?? 0) - player.y) > 1;
        const changed = lastSent.moving !== player.moving || lastSent.facing !== player.facing;
        if ((moved || changed) && now - lastSentTime > 60) {
            socket.emit('lobby_move', { x: player.x, y: player.y, room: player.room, facing: player.facing, moving: player.moving });
            lastSent = { x: player.x, y: player.y, moving: player.moving, facing: player.facing };
            lastSentTime = now;
        }
    }

    /* ── Loop principal ── */
    let running = true;
    function loop() {
        if (!running) return;

        updatePlayer();
        updateRemotePlayers();
        updateBubbles();
        updateCamera();
        maybeSendMove();

        ctx.clearRect(0, 0, W, H);
        ctx.save();
        ctx.translate(-camX, -camY);
        drawWorld();
        drawAllCharacters();
        bubbles.forEach(drawBubble);
        ctx.restore();

        drawHUD();

        requestAnimationFrame(loop);
    }

    window.addEventListener('beforeunload', () => {
        running = false;
        if (socket) socket.disconnect();
    });

    loop();

    setTimeout(() => {
        spawnBubble(player.x, player.y, 'hola!');
    }, 1200);

})();
