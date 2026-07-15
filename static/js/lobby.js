/* ═══════════════════════════════════════════════════════
   lobby.js — Space Lobby
   Sala espacial tipo Among Us: personaje animado con
   caminata, parpadeo, brazos oscilantes. Multijugador
   visual simulado con bots que se mueven por la sala.
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

    /* ── Dibuja personaje Among Us pixel art ──
       cx, cy = centro inferior del personaje
       escala = PX por defecto
       frame = 0..3 para animación de caminata
       facing = 1 (derecha) | -1 (izquierda)
       blink = true/false
    ── */
    function drawAmongus(cx, cy, color, frame, facing, blink, label) {
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
        // Frame 0: neutro, 1: izq adelante, 2: neutro, 3: der adelante
        const legFrames = [
            [[0,0],[0,0]],      // neutro
            [[-2,-1],[2,1]],    // izq adelante
            [[0,0],[0,0]],      // neutro
            [[2,-1],[-2,1]],    // der adelante
        ];
        const legs = legFrames[frame % 4];
        // Pierna izquierda
        ctx.fillStyle = color.shadow;
        ctx.fillRect(-3*p + legs[0][0], -2*p + legs[0][1], 2*p, 3*p);
        // Pierna derecha
        ctx.fillRect( 1*p + legs[1][0], -2*p + legs[1][1], 2*p, 3*p);

        /* ── Cuerpo principal ── */
        ctx.fillStyle = color.body;
        // Torso
        ctx.fillRect(-3*p, -8*p, 6*p, 6*p);
        // Cabeza (redondeada con pixeles)
        ctx.fillRect(-3*p, -13*p, 6*p, 5*p);
        ctx.fillRect(-2*p, -14*p, 4*p, 1*p);

        /* ── Sombra lateral del cuerpo ── */
        ctx.fillStyle = color.shadow;
        ctx.fillRect( 2*p, -8*p, 1*p, 6*p);
        ctx.fillRect( 2*p, -13*p, 1*p, 5*p);

        /* ── Mochila (backpack) ── */
        ctx.fillStyle = color.shadow;
        ctx.fillRect(-4*p, -7*p, 1*p, 4*p);

        /* ── Brazo oscilante ── */
        const armSwing = Math.sin(frame * Math.PI / 2) * 2;
        ctx.fillStyle = color.body;
        ctx.fillRect(3*p, -7*p + armSwing, 1*p, 3*p);
        ctx.fillStyle = color.shadow;
        ctx.fillRect(3*p, -7*p + armSwing + 2*p, 1*p, 1*p);

        /* ── Visor ── */
        if (!blink) {
            ctx.fillStyle = color.visor;
            ctx.fillRect(-2*p, -13*p, 4*p, 3*p);
            ctx.fillRect(-1*p, -14*p, 2*p, 1*p);
            /* brillo del visor */
            ctx.fillStyle = color.visorshadow;
            ctx.fillRect( 1*p, -13*p, 1*p, 2*p);
        } else {
            /* Parpadeo: línea fina */
            ctx.fillStyle = color.visorshadow;
            ctx.fillRect(-2*p, -12*p, 4*p, 1*p);
        }

        ctx.restore();

        /* ── Etiqueta de nombre ── */
        if (label) {
            ctx.save();
            ctx.font = `bold ${p*3}px "DM Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(cx - ctx.measureText(label).width/2 - 4, cy - 15*p - p*3 - 2, ctx.measureText(label).width + 8, p*3 + 4);
            ctx.fillStyle = '#eeeef5';
            ctx.fillText(label, cx, cy - 15*p);
            ctx.restore();
        }
    }

    /* ── Dibuja la sala espacial ── */
    function drawRoom() {
        /* Fondo oscuro espacial */
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, W, H);

        /* Cuadrícula de suelo */
        ctx.strokeStyle = 'rgba(79,124,255,0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 32) {
            ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 32) {
            ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
        }

        /* Paredes laterales */
        ctx.fillStyle = '#0f0f2a';
        ctx.fillRect(0,   0, 28, H);
        ctx.fillRect(W-28,0, 28, H);

        /* Borde de paredes con luz */
        ctx.fillStyle = 'rgba(79,124,255,0.18)';
        ctx.fillRect(26,  0, 2, H);
        ctx.fillRect(W-28,0, 2, H);

        /* Techo */
        ctx.fillStyle = '#0d0d22';
        ctx.fillRect(0, 0, W, 28);
        ctx.fillStyle = 'rgba(79,124,255,0.18)';
        ctx.fillRect(0,26, W, 2);

        /* Suelo */
        ctx.fillStyle = '#0d0d22';
        ctx.fillRect(0, H-28, W, 28);
        ctx.fillStyle = 'rgba(79,124,255,0.18)';
        ctx.fillRect(0, H-30, W, 2);

        /* Luces de techo */
        const lights = [80, 200, 320, 420];
        lights.forEach(lx => {
            const grad = ctx.createRadialGradient(lx, 28, 0, lx, 28, 90);
            grad.addColorStop(0, 'rgba(160,200,255,0.07)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
            /* fixture */
            ctx.fillStyle = '#a0c8ff';
            ctx.fillRect(lx-8, 20, 16, 6);
        });

        /* Computadoras / consolas en las paredes */
        drawConsola(50,  H-28-40);
        drawConsola(160, H-28-40);
        drawConsola(W-50-36, H-28-40);

        /* Ventana espacial */
        drawVentana(W/2 - 36, 36, 72, 50);

        /* Cajas / objetos */
        drawCaja(380, H-28-30);
        drawCaja(405, H-28-30);
        drawCaja(393, H-28-55);

        /* Texto ambiental */
        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(79,124,255,0.35)';
        ctx.textAlign = 'center';
        ctx.fillText('SALA DE ESPERA — SECTOR 7', W/2, H-10);
    }

    function drawConsola(x, y) {
        /* Base */
        ctx.fillStyle = '#1a1a35';
        ctx.fillRect(x, y, 36, 30);
        ctx.fillStyle = '#0f0f25';
        ctx.fillRect(x, y+30, 36, 8);
        /* Pantalla */
        ctx.fillStyle = '#0a2040';
        ctx.fillRect(x+3, y+3, 30, 18);
        /* Líneas de pantalla */
        ctx.fillStyle = 'rgba(79,124,255,0.4)';
        for (let i = 0; i < 4; i++) ctx.fillRect(x+5, y+5+i*4, 15+Math.random()*10|0, 1);
        /* Luces */
        ctx.fillStyle = '#34c77b';
        ctx.beginPath(); ctx.arc(x+28, y+24, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#e8445a';
        ctx.beginPath(); ctx.arc(x+22, y+24, 2, 0, Math.PI*2); ctx.fill();
    }

    function drawVentana(x, y, w, h) {
        /* Marco */
        ctx.fillStyle = '#1a1a35';
        ctx.fillRect(x, y, w, h);
        /* Espacio exterior */
        ctx.fillStyle = '#030310';
        ctx.fillRect(x+3, y+3, w-6, h-6);
        /* Estrellas */
        ctx.fillStyle = '#ffffff';
        const stars = [[8,8],[20,15],[45,6],[60,20],[15,35],[50,40],[30,28]];
        stars.forEach(([sx,sy]) => {
            ctx.globalAlpha = 0.7 + Math.sin(Date.now()/800 + sx) * 0.3;
            ctx.fillRect(x+3+sx, y+3+sy, 1, 1);
        });
        ctx.globalAlpha = 1;
        /* Planeta lejano */
        ctx.fillStyle = 'rgba(100,60,200,0.5)';
        ctx.beginPath(); ctx.arc(x+55, y+12, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(80,40,160,0.4)';
        ctx.fillRect(x+50, y+12, 10, 3);
        /* Marco interior */
        ctx.strokeStyle = 'rgba(79,124,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x+3, y+3, w-6, h-6);
        /* Cruz de la ventana */
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

    /* ── Estado de jugadores ── */
    const FLOOR_Y  = H - 28 - 8;   // Y del suelo donde caminan
    const BOUND_L  = 38;
    const BOUND_R  = W - 38;

    /* Jugador controlado */
    const player = {
        x: W / 2, y: FLOOR_Y,
        vx: 0, speed: 2.2,
        frame: 0, frameTimer: 0, frameInterval: 8,
        facing: 1,
        blink: false, blinkTimer: 0, blinkInterval: 180,
        color: COLORES[Math.floor(Math.random() * COLORES.length)],
        name: USERNAME.slice(0, 10),
        moving: false,
    };

    /* Bots */
    function makeBot(idx) {
        return {
            x: BOUND_L + Math.random() * (BOUND_R - BOUND_L),
            y: FLOOR_Y,
            vx: (Math.random() < 0.5 ? 1 : -1) * (0.6 + Math.random() * 1.2),
            frame: 0, frameTimer: 0, frameInterval: 10 + (Math.random()*6|0),
            facing: 1,
            blink: false, blinkTimer: Math.random() * 200 | 0,
            blinkInterval: 160 + (Math.random() * 80 | 0),
            color: COLORES[(idx + 1) % COLORES.length],
            name: ['Cosmo','Pixel','Nova','Zeta','Orion','Luna'][idx % 6],
            pauseTimer: 0,
        };
    }
    const BOTS_COUNT = 4;
    const bots = Array.from({ length: BOTS_COUNT }, (_, i) => makeBot(i));

    /* ── Controles ── */
    const keys = {};
    function onKey(e, val) {
        if (['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)) {
            keys[e.key] = val;
            e.preventDefault();
        }
    }
    window.addEventListener('keydown', e => onKey(e, true));
    window.addEventListener('keyup',   e => onKey(e, false));

    /* Táctil: joystick virtual */
    let touchX0 = null;
    canvas.addEventListener('touchstart', e => {
        touchX0 = e.touches[0].clientX;
        e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
        if (touchX0 === null) return;
        const dx = e.touches[0].clientX - touchX0;
        player.vx = Math.max(-player.speed, Math.min(player.speed, dx * 0.05));
        e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', () => {
        touchX0 = null;
        player.vx = 0;
    });

    /* ── Chat de burbuja simple ── */
    const MENSAJES = [
        'gg!', 'listo', 'wp', 'hola', 'esperen', ':)', 'a jugar!', 'gg wp', 'nais'
    ];
    const bubbles = []; // {text, x, y, life, maxLife}

    function spawnBubble(x, y, text) {
        bubbles.push({ text, x, y: y - 20*PX, life: 160, maxLife: 160 });
    }

    /* ── Update bots ── */
    function updateBots() {
        bots.forEach((bot, i) => {
            /* Pausa aleatoria */
            if (bot.pauseTimer > 0) { bot.pauseTimer--; return; }

            bot.x += bot.vx;
            bot.facing = bot.vx > 0 ? 1 : -1;

            /* Rebotar en bordes */
            if (bot.x < BOUND_L + 10) { bot.vx = Math.abs(bot.vx); bot.pauseTimer = 30 + (Math.random()*60|0); }
            if (bot.x > BOUND_R - 10) { bot.vx = -Math.abs(bot.vx); bot.pauseTimer = 30 + (Math.random()*60|0); }

            /* Pausa aleatoria */
            if (Math.random() < 0.002) { bot.pauseTimer = 60 + (Math.random()*120|0); }

            /* Cambio de velocidad ocasional */
            if (Math.random() < 0.003) bot.vx = (bot.vx > 0 ? 1 : -1) * (0.6 + Math.random() * 1.2);

            /* Animación de caminata */
            bot.frameTimer++;
            if (bot.frameTimer >= bot.frameInterval) {
                bot.frameTimer = 0;
                bot.frame = (bot.frame + 1) % 4;
            }

            /* Parpadeo */
            bot.blinkTimer++;
            if (bot.blinkTimer >= bot.blinkInterval) {
                bot.blinkTimer = 0; bot.blink = true;
                setTimeout(() => { bot.blink = false; }, 120);
            }

            /* Chat ocasional */
            if (Math.random() < 0.0008) {
                const msg = MENSAJES[Math.random() * MENSAJES.length | 0];
                spawnBubble(bot.x, bot.y, msg);
            }
        });
    }

    /* ── Update jugador ── */
    function updatePlayer() {
        /* Teclado */
        if (keys['ArrowLeft'] || keys['a'] || keys['A'])  player.vx = -player.speed;
        else if (keys['ArrowRight'] || keys['d'] || keys['D']) player.vx =  player.speed;
        else if (touchX0 === null) player.vx *= 0.6;

        player.moving = Math.abs(player.vx) > 0.2;
        player.x = Math.max(BOUND_L + 10, Math.min(BOUND_R - 10, player.x + player.vx));
        if (player.moving) player.facing = player.vx > 0 ? 1 : -1;

        /* Animación caminata */
        if (player.moving) {
            player.frameTimer++;
            if (player.frameTimer >= player.frameInterval) {
                player.frameTimer = 0;
                player.frame = (player.frame + 1) % 4;
            }
        } else {
            player.frame = 0;
        }

        /* Parpadeo */
        player.blinkTimer++;
        if (player.blinkTimer >= player.blinkInterval) {
            player.blinkTimer = 0; player.blink = true;
            setTimeout(() => { player.blink = false; }, 100);
        }
    }

    /* ── Update burbujas ── */
    function updateBubbles() {
        for (let i = bubbles.length - 1; i >= 0; i--) {
            bubbles[i].life--;
            bubbles[i].y -= 0.3;
            if (bubbles[i].life <= 0) bubbles.splice(i, 1);
        }
    }

    /* ── Draw burbuja de chat ── */
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

    /* ── HUD ── */
    function drawHUD() {
        /* Panel de jugadores conectados */
        ctx.save();
        ctx.fillStyle = 'rgba(8,8,24,0.75)';
        ctx.beginPath();
        ctx.roundRect(W - 28 - 140, 36, 130, 100, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(79,124,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(79,124,255,0.6)';
        ctx.textAlign = 'left';
        ctx.fillText('JUGADORES EN SALA', W - 28 - 132, 52);

        const allPlayers = [player, ...bots];
        allPlayers.slice(0, 5).forEach((p, i) => {
            const dot_x = W - 28 - 128;
            const dot_y = 66 + i * 15;
            ctx.fillStyle = p.color.body;
            ctx.beginPath();
            ctx.arc(dot_x, dot_y, 4, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = i === 0 ? '#eeeef5' : '#a0a0c0';
            ctx.font = i === 0 ? 'bold 10px "DM Mono", monospace' : '10px "DM Mono", monospace';
            ctx.fillText((i === 0 ? '★ ' : '') + p.name.slice(0, 10), dot_x + 10, dot_y + 4);
        });

        /* Punto verde "online" */
        ctx.fillStyle = '#34c77b';
        ctx.beginPath();
        ctx.arc(W - 28 - 20, 42, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 400) * 0.3;
        ctx.beginPath();
        ctx.arc(W - 28 - 20, 42, 7, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.restore();

        /* Controles hint */
        ctx.save();
        ctx.fillStyle = 'rgba(8,8,24,0.65)';
        ctx.beginPath();
        ctx.roundRect(36, H - 28 - 28, 180, 20, 6);
        ctx.fill();
        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(79,124,255,0.5)';
        ctx.textAlign = 'left';
        ctx.fillText('← → / A D para mover · Toca la pantalla', 44, H - 28 - 14);
        ctx.restore();

        /* Título */
        ctx.save();
        ctx.font = 'bold 13px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(79,124,255,0.7)';
        ctx.textAlign = 'left';
        ctx.fillText('SPACE LOBBY', 38, 18);
        ctx.restore();
    }

    /* ── Orden de dibujo por Y (los de abajo tapan a los de arriba) ── */
    function drawAllCharacters() {
        const all = [
            { ...player, isPlayer: true },
            ...bots.map(b => ({ ...b, isPlayer: false }))
        ].sort((a, b) => a.y - b.y);

        all.forEach(c => {
            drawAmongus(
                c.x, c.y,
                c.color,
                c.moving !== false ? c.frame : 0,
                c.facing,
                c.blink,
                c.name
            );
        });
    }

    /* ── Loop principal ── */
    let running = true;
    function loop() {
        if (!running) return;

        updatePlayer();
        updateBots();
        updateBubbles();

        drawRoom();
        drawAllCharacters();
        bubbles.forEach(drawBubble);
        drawHUD();

        requestAnimationFrame(loop);
    }

    /* Limpiar listeners al salir */
    window.addEventListener('beforeunload', () => { running = false; });

    loop();

    /* ── Mensaje de bienvenida al entrar ── */
    setTimeout(() => {
        spawnBubble(player.x, player.y, 'hola!');
    }, 1200);

})();
