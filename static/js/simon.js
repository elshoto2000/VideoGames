// static/js/simon.js — Retro Space Defender con Sistema de Tienda

(function () {
    'use strict';

    const contenedor = document.getElementById('simon-game-container');
    if (!contenedor) { console.error('No se encontró #simon-game-container'); return; }
    contenedor.innerHTML = '';

    /* ── Usuario ── */
    const userEl = document.getElementById('display-user');
    const USER = (userEl ? userEl.innerText : 'Jugador').replace('Jugador: ', '').trim();

    /* ── Canvas ── */
    const ANCHO = 480, ALTO = 520;

    /* ── Audio ── */
    let audioCtx = null;
    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    function beep(freq, dur = 0.15, type = 'square', vol = 0.12) {
        try {
            initAudio();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(vol, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + dur);
        } catch (e) {}
    }
    function shootSound() { beep(880, 0.08, 'square', 0.08); }
    function explosionSound() {
        beep(120, 0.3, 'sawtooth', 0.15);
        setTimeout(() => beep(80, 0.2, 'sawtooth', 0.1), 80);
    }
    function coinSound() { beep(660, 0.1, 'sine', 0.1); setTimeout(() => beep(880, 0.1, 'sine', 0.1), 80); }
    function buySound() { beep(440, 0.1, 'sine', 0.12); setTimeout(() => beep(660, 0.15, 'sine', 0.12), 100); }
    function waveSound() { beep(220, 0.4, 'triangle', 0.1); }
    function bossAppearSound() {
        beep(80, 0.6, 'sawtooth', 0.2);
        setTimeout(() => beep(60, 0.8, 'sawtooth', 0.25), 300);
        setTimeout(() => beep(100, 0.5, 'square', 0.2), 700);
    }
    function bossLaserSound() { beep(1200, 0.12, 'sawtooth', 0.15); setTimeout(() => beep(400, 0.2, 'sawtooth', 0.1), 60); }
    function bossChatarraSound() { beep(300, 0.08, 'square', 0.08); }
    function bossDeathSound() {
        beep(200, 0.3, 'sawtooth', 0.2); setTimeout(() => beep(150, 0.3, 'sawtooth', 0.2), 150);
        setTimeout(() => beep(100, 0.4, 'sawtooth', 0.25), 300); setTimeout(() => beep(60, 0.6, 'sawtooth', 0.3), 500);
    }
    function victorySound() {
        [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.3, 'sine', 0.15), i * 150));
    }

    /* ── Estado global ── */
    const ESTADOS = { MENU: 'menu', JUGANDO: 'jugando', TIENDA: 'tienda', GAMEOVER: 'gameover', VICTORIA: 'victoria' };
    let estado = ESTADOS.MENU;
    let puntuacion = 0;
    let chatarra = 0;       // moneda del juego
    let oleada = 0;
    let animFrame = null;
    let bgPulse = 0;

    /* ── Jefe final ── */
    let jefe = null;
    let balasJefe = [];   // proyectiles del jefe hacia el jugador
    let bossIntroTimer = 0;  // frames de animación de entrada del jefe
    const MAX_OLEADAS = 100;

    /* ── Mejoras del jugador ── */
    const mejoras = {
        velocidadDisparo: 1,   // nivel 1-3
        escudo: false,         // escudo temporal (un uso)
        rafagaDoble: false,    // nivel booleano
    };

    /* ── Jugador ── */
    const jugador = {
        x: ANCHO / 2, y: ALTO - 55,
        ancho: 36, alto: 30,
        velocidad: 4,
        vidas: 3,
        invulnerable: 0,   // frames de invulnerabilidad tras golpe
        color: '#4f7cff',
    };

    /* ── Balas, enemigos, explosiones ── */
    let balas = [];
    let enemigos = [];
    let explosiones = [];
    let particulas = [];

    /* ── Teclas ── */
    const teclas = {};
    window.addEventListener('keydown', e => {
        teclas[e.key] = true; teclas[e.code] = true;
        if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { teclas[e.key] = false; teclas[e.code] = false; });

    /* ── Disparo automático con cooldown ── */
    const COOLDOWN_BASE = [0, 18, 12, 7];  // frames entre disparos por nivel
    let cooldownActual = 0;

    /* ── Estrellas de fondo ── */
    const estrellas = Array.from({ length: 80 }, () => ({
        x: Math.random() * ANCHO,
        y: Math.random() * ALTO,
        r: Math.random() * 1.5 + 0.3,
        vel: Math.random() * 0.5 + 0.2,
        br: Math.random()
    }));

    /* ── CSS ── */
    const style = document.createElement('style');
    style.textContent = `
        .rsd-wrapper {
            display: flex; flex-direction: column; align-items: center;
            gap: 8px; width: 100%; max-width: 500px; margin: 0 auto;
            font-family: 'DM Mono', monospace;
            box-sizing: border-box;
        }
        .rsd-hud {
            display: flex; justify-content: space-between; align-items: center;
            width: 100%; padding: 0 2px;
        }
        .rsd-hud-item { display: flex; flex-direction: column; align-items: center; gap: 1px; }
        .rsd-hud-val { font-size: 1.2rem; font-weight: 700; color: #eeeef5; line-height: 1; }
        .rsd-hud-label { font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; color: #454560; }
        .rsd-canvas {
            display: block; width: 100%; height: auto;
            border-radius: 10px; background: #04040e;
            image-rendering: pixelated;
        }
        .rsd-controls {
            display: flex; gap: 8px; width: 100%; justify-content: center;
        }
        .rsd-btn {
            flex: 1; max-width: 200px; padding: 10px 14px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px; cursor: pointer;
            color: #eeeef5; font-weight: 600; font-size: 0.85rem;
            font-family: 'DM Mono', monospace; transition: all 0.15s;
        }
        .rsd-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.2); }
        .rsd-btn.primary { background: #4f7cff; border-color: #4f7cff; color: #fff; }
        .rsd-btn.primary:hover { background: #3a63e0; }
        /* D-Pad móvil */
        .rsd-dpad {
            display: grid; grid-template-columns: repeat(3, 52px);
            grid-template-rows: repeat(2, 48px); gap: 5px;
            justify-content: center; width: 100%;
        }
        .rsd-dpad-fire {
            display: grid; grid-template-columns: 52px;
            grid-template-rows: 48px; justify-content: center;
        }
        .rsd-mobile-row { display: flex; gap: 16px; justify-content: center; width: 100%; }
        .dpad-btn {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px; color: #eeeef5; font-size: 1.1rem; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            user-select: none; -webkit-user-select: none; transition: background 0.1s;
        }
        .dpad-btn:active, .dpad-btn.pressed { background: #4f7cff; border-color: #4f7cff; }
        .fire-btn {
            background: rgba(232,68,90,0.2); border: 1px solid #e8445a;
            border-radius: 10px; color: #e8445a; font-size: 1.1rem; cursor: pointer;
            display: flex; align-items: center; justify-content: center; width: 52px; height: 48px;
            user-select: none; -webkit-user-select: none;
        }
        .fire-btn:active { background: #e8445a; color: #fff; }
        @media (min-width: 769px) { .rsd-mobile-row { display: none; } }
    `;
    document.head.appendChild(style);

    /* ── HTML ── */
    const wrapper = document.createElement('div');
    wrapper.className = 'rsd-wrapper';
    wrapper.innerHTML = `
        <div class="rsd-hud">
            <div class="rsd-hud-item">
                <div class="rsd-hud-val" id="rsd-pts">0</div>
                <div class="rsd-hud-label">Puntos</div>
            </div>
            <div class="rsd-hud-item">
                <div class="rsd-hud-val" id="rsd-oleada" style="color:#e8c97a;">1</div>
                <div class="rsd-hud-label">Oleada</div>
            </div>
            <div class="rsd-hud-item">
                <div class="rsd-hud-val" id="rsd-chatarra" style="color:#34c77b;">0</div>
                <div class="rsd-hud-label">⚙ Chatarra</div>
            </div>
            <div class="rsd-hud-item">
                <div class="rsd-hud-val" id="rsd-vidas">❤❤❤</div>
                <div class="rsd-hud-label">Vidas</div>
            </div>
        </div>
        <canvas id="rsd-canvas" width="${ANCHO}" height="${ALTO}" class="rsd-canvas"></canvas>
        <div class="rsd-controls">
            <button class="rsd-btn primary" id="rsd-start">▶ INICIAR</button>
            <button class="rsd-btn" id="rsd-fs">⛶ Pantalla</button>
        </div>
        <div class="rsd-mobile-row">
            <div class="rsd-dpad">
                <div></div>
                <button class="dpad-btn" data-dir="up">▲</button>
                <div></div>
                <button class="dpad-btn" data-dir="left">◀</button>
                <button class="dpad-btn" data-dir="down">▼</button>
                <button class="dpad-btn" data-dir="right">▶</button>
            </div>
            <div style="display:flex;align-items:center;">
                <button class="fire-btn" id="rsd-fire-btn">🔥</button>
            </div>
        </div>
    `;
    contenedor.appendChild(wrapper);

    const canvas = wrapper.querySelector('#rsd-canvas');
    const ctx = canvas.getContext('2d');
    const elPts = wrapper.querySelector('#rsd-pts');
    const elOleada = wrapper.querySelector('#rsd-oleada');
    const elChatarra = wrapper.querySelector('#rsd-chatarra');
    const elVidas = wrapper.querySelector('#rsd-vidas');
    const btnStart = wrapper.querySelector('#rsd-start');
    const btnFS = wrapper.querySelector('#rsd-fs');

    /* ── Disparo móvil ── */
    let disparandoMovil = false;
    const btnFire = wrapper.querySelector('#rsd-fire-btn');
    btnFire.addEventListener('touchstart', e => { e.preventDefault(); initAudio(); disparandoMovil = true; }, { passive: false });
    btnFire.addEventListener('touchend', e => { e.preventDefault(); disparandoMovil = false; }, { passive: false });
    btnFire.addEventListener('mousedown', () => { initAudio(); disparandoMovil = true; });
    btnFire.addEventListener('mouseup', () => { disparandoMovil = false; });

    /* ── D-Pad ── */
    wrapper.querySelectorAll('.dpad-btn').forEach(btn => {
        const dir = btn.getAttribute('data-dir');
        const press = e => { e.preventDefault(); initAudio(); setDir(dir, true); };
        const release = e => { e.preventDefault(); setDir(dir, false); };
        btn.addEventListener('touchstart', press, { passive: false });
        btn.addEventListener('touchend', release, { passive: false });
        btn.addEventListener('touchcancel', release, { passive: false });
        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
    });

    function setDir(dir, val) {
        if (dir === 'up') { teclas.ArrowUp = val; }
        if (dir === 'down') { teclas.ArrowDown = val; }
        if (dir === 'left') { teclas.ArrowLeft = val; }
        if (dir === 'right') { teclas.ArrowRight = val; }
    }

    /* ── Fullscreen ── */
    btnFS.addEventListener('click', () => {
        const target = document.getElementById('game-screen') || canvas;
        if (!document.fullscreenElement) target.requestFullscreen?.() || target.webkitRequestFullscreen?.();
        else document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    });

    /* ── INICIO ── */
    btnStart.addEventListener('click', () => {
        initAudio();
        iniciarJuego();
    });

    function iniciarJuego() {
        puntuacion = 0; chatarra = 0; oleada = 0;
        mejoras.velocidadDisparo = 1; mejoras.escudo = false; mejoras.rafagaDoble = false;
        jugador.x = ANCHO / 2; jugador.y = ALTO - 55;
        jugador.vidas = 3; jugador.invulnerable = 0;
        balas = []; enemigos = []; explosiones = []; particulas = [];
        jefe = null; balasJefe = []; bossIntroTimer = 0;
        actualizarHUD();
        iniciarOleada();
        estado = ESTADOS.JUGANDO;
        btnStart.textContent = '↺ Reiniciar';
    }

    /* ── OLEADAS ── */
    function iniciarOleada() {
        oleada++;
        elOleada.textContent = oleada;
        balas = []; balasJefe = [];
        if (oleada % 5 === 0) {
            // OLEADA DE JEFE
            enemigos = [];
            bossIntroTimer = 120;
            bossAppearSound();
            crearJefe();
        } else {
            waveSound();
            jefe = null;
            generarEnemigos();
        }
    }

    /* ── CREAR JEFE ── */
    function crearJefe() {
        const tier = Math.floor(oleada / 5);          // 1,2,3... sube cada 5 oleadas
        const vidasBase = 15 + tier * 10;             // más vida cada jefe
        // Tipos de ataque que desbloquea por tier
        const ataques = tier >= 4
            ? ['laser', 'chatarra', 'rafaga', 'laser']
            : tier >= 2
                ? ['laser', 'chatarra', 'laser']
                : ['laser', 'chatarra'];

        jefe = {
            x: ANCHO / 2,
            y: -80,                 // empieza fuera de pantalla (entra desde arriba)
            yTarget: 90,            // posición final
            ancho: 70,
            alto: 55,
            vidasMax: vidasBase,
            vidas: vidasBase,
            velocidadX: 1.2 + tier * 0.3,
            dir: 1,
            tier,
            ataques,
            ataqueTimer: 180,       // frames hasta primer ataque
            ataqueFase: 0,
            color: ['#ff4488','#ff2200','#aa00ff','#ff8800','#00ffcc'][Math.min(tier-1,4)],
            colorSecundario: ['#ff88bb','#ff7755','#dd66ff','#ffcc44','#66ffee'][Math.min(tier-1,4)],
            nombre: ['DEVORADOR','DESTRUCTOR','APOCALIPSIS','NÉMESIS','ABISMO','EXTERMINADOR',
                     'CATACLISMO','ANIQUILADOR','OMEGA','INFINITO','CAOS','ARMAGEDÓN',
                     'VOID','TITAN','BEHEMOTH','LEVIATAN','MOLOCH','BAALZEBUL',
                     'MALPHAS','PURSON'][Math.min(tier-1, 19)],
            chatarraVal: 200 + tier * 100,
            rotorAng: 0,
            entraAnimacion: true,
        };
    }

    function generarEnemigos() {
        enemigos = [];
        const cantidad = 5 + (oleada - 1) * 3;
        const filas = Math.ceil(cantidad / 8);
        let idx = 0;
        for (let f = 0; f < filas && idx < cantidad; f++) {
            const en_fila = Math.min(8, cantidad - idx);
            for (let c = 0; c < en_fila; c++) {
                const tipo = oleada >= 3 && Math.random() < 0.25 ? 'asteroid' : (Math.random() < 0.3 ? 'nave' : 'asteroid');
                const velocidadBase = 0.5 + oleada * 0.15;
                enemigos.push({
                    x: 40 + c * (ANCHO - 80) / Math.max(en_fila - 1, 1),
                    y: 40 + f * 50,
                    ancho: tipo === 'nave' ? 28 : 24,
                    alto: tipo === 'nave' ? 22 : 24,
                    tipo,
                    vidas: tipo === 'nave' ? 2 : 1,
                    velocidadX: (Math.random() - 0.5) * velocidadBase * 2,
                    velocidadY: velocidadBase * (0.3 + Math.random() * 0.4),
                    rotacion: 0,
                    rotVel: (Math.random() - 0.5) * 0.06,
                    chatarraVal: tipo === 'nave' ? 15 : 8,
                    color: tipo === 'nave' ? '#e8445a' : '#a07040',
                    id: idx++
                });
            }
        }
    }

    /* ── HUD ── */
    function actualizarHUD() {
        elPts.textContent = puntuacion;
        elChatarra.textContent = chatarra;
        const c = Math.min(jugador.vidas, 3);
        elVidas.textContent = '❤'.repeat(c) + '🖤'.repeat(3 - c);
    }

    /* ── DISPARO ── */
    function disparar() {
        if (mejoras.rafagaDoble) {
            balas.push({ x: jugador.x - 10, y: jugador.y - 10, vel: 9, ancho: 3, alto: 10, color: '#4f7cff' });
            balas.push({ x: jugador.x + 10, y: jugador.y - 10, vel: 9, ancho: 3, alto: 10, color: '#4f7cff' });
        } else {
            balas.push({ x: jugador.x, y: jugador.y - 14, vel: 9, ancho: 3, alto: 10, color: '#80aaff' });
        }
        shootSound();
    }

    /* ── EXPLOSIÓN ── */
    function crearExplosion(x, y, color = '#e8c97a') {
        explosiones.push({ x, y, r: 4, maxR: 28, color, alpha: 1 });
        for (let i = 0; i < 10; i++) {
            const ang = Math.random() * Math.PI * 2;
            const vel = 1.5 + Math.random() * 3;
            particulas.push({
                x, y,
                vx: Math.cos(ang) * vel,
                vy: Math.sin(ang) * vel,
                r: 1.5 + Math.random() * 2,
                alpha: 1,
                color
            });
        }
        explosionSound();
    }

    /* ── UPDATE ── */
    function update() {
        bgPulse += 0.02;

        // Estrellas
        estrellas.forEach(s => {
            s.y += s.vel;
            if (s.y > ALTO) { s.y = 0; s.x = Math.random() * ANCHO; }
            s.br = (Math.sin(bgPulse * 2 + s.x) + 1) / 2;
        });

        if (estado !== ESTADOS.JUGANDO) return;

        // Mover jugador
        if (teclas.ArrowLeft || teclas.a || teclas.KeyA) jugador.x -= jugador.velocidad;
        if (teclas.ArrowRight || teclas.d || teclas.KeyD) jugador.x += jugador.velocidad;
        if (teclas.ArrowUp || teclas.w || teclas.KeyW) jugador.y -= jugador.velocidad * 0.7;
        if (teclas.ArrowDown || teclas.s || teclas.KeyS) jugador.y += jugador.velocidad * 0.7;
        jugador.x = Math.max(jugador.ancho / 2, Math.min(ANCHO - jugador.ancho / 2, jugador.x));
        jugador.y = Math.max(ALTO / 2, Math.min(ALTO - 30, jugador.y));

        if (jugador.invulnerable > 0) jugador.invulnerable--;

        // Disparo automático por tecla o botón
        cooldownActual--;
        const disparar_input = teclas[' '] || teclas.Space || teclas.z || teclas.KeyZ || disparandoMovil;
        if (disparar_input && cooldownActual <= 0) {
            disparar();
            cooldownActual = COOLDOWN_BASE[mejoras.velocidadDisparo];
        }

        // Mover balas
        balas = balas.filter(b => b.y > -20);
        balas.forEach(b => b.y -= b.vel);

        // Mover enemigos
        enemigos.forEach(e => {
            e.x += e.velocidadX;
            e.y += e.velocidadY;
            e.rotacion += e.rotVel;
            if (e.x < e.ancho / 2 || e.x > ANCHO - e.ancho / 2) e.velocidadX *= -1;
        });

        // Colisión balas-enemigos
        balas.forEach(b => {
            enemigos.forEach(e => {
                if (!b.eliminada &&
                    Math.abs(b.x - e.x) < (e.ancho / 2 + 4) &&
                    Math.abs(b.y - e.y) < (e.alto / 2 + 6)) {
                    b.eliminada = true;
                    e.vidas--;
                    if (e.vidas <= 0) {
                        e.eliminado = true;
                        crearExplosion(e.x, e.y, e.color);
                        const ganado = e.chatarraVal + (oleada - 1) * 3;
                        chatarra += ganado;
                        puntuacion += ganado * 5;
                        coinSound();
                        actualizarHUD();
                    }
                }
            });
        });
        balas = balas.filter(b => !b.eliminada);
        enemigos = enemigos.filter(e => !e.eliminado);

        // Enemigos llegan al fondo o colisionan con jugador
        enemigos.forEach(e => {
            if (e.y > ALTO - 40) {
                crearExplosion(e.x, e.y, '#e8445a');
                e.eliminado = true;
                dañarJugador();
            }
            // Colisión directa con nave
            if (jugador.invulnerable <= 0 &&
                Math.abs(e.x - jugador.x) < (e.ancho / 2 + jugador.ancho / 2 - 4) &&
                Math.abs(e.y - jugador.y) < (e.alto / 2 + jugador.alto / 2 - 4)) {
                crearExplosion(e.x, e.y, '#e8445a');
                e.eliminado = true;
                dañarJugador();
            }
        });
        enemigos = enemigos.filter(e => !e.eliminado);

        // Explosiones
        explosiones.forEach(ex => { ex.r += 2; ex.alpha -= 0.07; });
        explosiones = explosiones.filter(ex => ex.alpha > 0);

        // Partículas
        particulas.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.alpha -= 0.04; });
        particulas = particulas.filter(p => p.alpha > 0);

        // ¿Oleada completa? (sin jefe)
        if (!jefe && enemigos.length === 0 && estado === ESTADOS.JUGANDO) {
            terminarOleada();
        }

        // ── JEFE ──
        if (jefe) {
            updateJefe();
        }
    }

    function terminarOleada() {
        estado = ESTADOS.TIENDA;
        const bonus = oleada * 50;
        puntuacion += bonus;
        chatarra += Math.floor(bonus / 5);
        actualizarHUD();
    }

    /* ── UPDATE JEFE ── */
    function updateJefe() {
        jefe.rotorAng += 0.03;

        // Entrada animada
        if (jefe.y < jefe.yTarget) {
            jefe.y += 2.5;
            return;  // no ataca mientras entra
        }
        jefe.entraAnimacion = false;

        // Movimiento lateral
        jefe.x += jefe.velocidadX * jefe.dir;
        if (jefe.x > ANCHO - jefe.ancho / 2 - 10) jefe.dir = -1;
        if (jefe.x < jefe.ancho / 2 + 10) jefe.dir = 1;

        // Timers de ataque
        jefe.ataqueTimer--;
        if (jefe.ataqueTimer <= 0) {
            const tipoAtaque = jefe.ataques[jefe.ataqueFase % jefe.ataques.length];
            ejecutarAtaqueJefe(tipoAtaque);
            jefe.ataqueFase++;
            // Cooldown se reduce con el tier (más agresivo en niveles altos)
            jefe.ataqueTimer = Math.max(60, 160 - jefe.tier * 12);
        }

        // Mover balas del jefe
        balasJefe = balasJefe.filter(b => b.y < ALTO + 20 && b.x > -20 && b.x < ANCHO + 20);
        balasJefe.forEach(b => {
            b.x += b.vx;
            b.y += b.vy;
            b.rotacion = (b.rotacion || 0) + (b.rotVel || 0);
        });

        // Colisión balas jugador → jefe
        balas.forEach(b => {
            if (!b.eliminada && jefe &&
                Math.abs(b.x - jefe.x) < jefe.ancho / 2 + 4 &&
                Math.abs(b.y - jefe.y) < jefe.alto / 2 + 6) {
                b.eliminada = true;
                jefe.vidas--;
                // Flash de daño
                jefe.dañoFlash = 8;
                if (jefe.vidas <= 0) matarJefe();
            }
        });
        balas = balas.filter(b => !b.eliminada);
        if (jefe) jefe.dañoFlash = Math.max(0, (jefe.dañoFlash || 0) - 1);

        // Colisión balas jefe → jugador
        balasJefe.forEach(b => {
            if (!b.eliminada &&
                Math.abs(b.x - jugador.x) < jugador.ancho / 2 + (b.radio || 6) &&
                Math.abs(b.y - jugador.y) < jugador.alto / 2 + (b.radio || 6)) {
                b.eliminada = true;
                dañarJugador();
            }
        });
        balasJefe = balasJefe.filter(b => !b.eliminada);
    }

    function ejecutarAtaqueJefe(tipo) {
        if (!jefe) return;
        if (tipo === 'laser') {
            // Láser apuntado al jugador
            const dx = jugador.x - jefe.x;
            const dy = jugador.y - jefe.y;
            const dist = Math.hypot(dx, dy);
            const spd = 5 + jefe.tier * 0.5;
            balasJefe.push({
                x: jefe.x, y: jefe.y + jefe.alto / 2,
                vx: (dx / dist) * spd,
                vy: (dy / dist) * spd,
                radio: 5, tipo: 'laser',
                color: jefe.color, eliminada: false
            });
            bossLaserSound();
        } else if (tipo === 'chatarra') {
            // Dispersión de chatarra en abanico
            const cantidad = 5 + jefe.tier;
            for (let i = 0; i < cantidad; i++) {
                const ang = (Math.PI / (cantidad + 1)) * (i + 1);  // abanico hacia abajo
                const spd = 2.5 + Math.random() * 1.5;
                balasJefe.push({
                    x: jefe.x + (Math.random() - 0.5) * 30,
                    y: jefe.y + jefe.alto / 2,
                    vx: Math.cos(ang - Math.PI / 2) * spd + (Math.random() - 0.5),
                    vy: Math.sin(ang) * spd,
                    radio: 7, tipo: 'chatarra',
                    rotacion: Math.random() * Math.PI * 2,
                    rotVel: (Math.random() - 0.5) * 0.15,
                    color: '#e8c97a', eliminada: false
                });
                bossChatarraSound();
            }
        } else if (tipo === 'rafaga') {
            // Ráfaga rápida de 3 láseres seguidos
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (!jefe) return;
                    const dx = jugador.x - jefe.x + (i - 1) * 30;
                    const dy = jugador.y - jefe.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    const spd = 6;
                    balasJefe.push({
                        x: jefe.x, y: jefe.y + jefe.alto / 2,
                        vx: (dx / dist) * spd, vy: (dy / dist) * spd,
                        radio: 4, tipo: 'laser',
                        color: jefe.colorSecundario, eliminada: false
                    });
                    bossLaserSound();
                }, i * 120);
            }
        }
    }

    function matarJefe() {
        if (!jefe) return;
        crearExplosion(jefe.x, jefe.y, jefe.color);
        crearExplosion(jefe.x - 20, jefe.y - 10, jefe.colorSecundario);
        crearExplosion(jefe.x + 20, jefe.y + 10, jefe.color);
        bossDeathSound();
        const ganado = jefe.chatarraVal;
        chatarra += ganado;
        puntuacion += ganado * 10;
        actualizarHUD();
        jefe = null;
        balasJefe = [];
        // Comprobar victoria (oleada 100)
        if (oleada >= MAX_OLEADAS) {
            setTimeout(() => { estado = ESTADOS.VICTORIA; victorySound(); }, 800);
        } else {
            setTimeout(() => terminarOleada(), 800);
        }
    }

    /* ── DAÑO AL JUGADOR ── */
    function dañarJugador() {
        if (jugador.invulnerable > 0) return;
        if (mejoras.escudo) {
            mejoras.escudo = false;
            jugador.invulnerable = 90;
            beep(440, 0.3, 'triangle', 0.15);
            return;
        }
        jugador.vidas--;
        jugador.invulnerable = 90;
        beep(100, 0.4, 'sawtooth', 0.2);
        actualizarHUD();
        if (jugador.vidas <= 0) finalizarPartida();
    }

    /* ── FIN ── */
    function finalizarPartida() {
        estado = ESTADOS.GAMEOVER;
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ juego: 'simon', puntos: puntuacion })
        }).then(() => {
            if (typeof window.cargarRanking === 'function') window.cargarRanking();
            if (typeof window.cargarRankings === 'function') window.cargarRankings();
        }).catch(err => console.error('Error guardando puntaje:', err));

        const gos = document.getElementById('game-over-screen');
        const msg = document.getElementById('final-score-msg');
        if (msg) msg.innerText = `${puntuacion} pts · Oleada ${oleada} · ⚙ ${chatarra} chatarra`;
        if (contenedor) contenedor.style.display = 'none';
        if (gos) {
            gos.style.display = 'flex';
            const btn = gos.querySelector('.btn-play');
            if (btn) btn.onclick = e => {
                e.preventDefault();
                gos.style.display = 'none';
                contenedor.style.display = 'block';
                iniciarJuego();
            };
        }
    }

    /* ══════════════════════════════════════════
       DRAW
    ══════════════════════════════════════════ */

    function draw() {
        // Fondo
        ctx.fillStyle = '#04040e';
        ctx.fillRect(0, 0, ANCHO, ALTO);

        // Estrellas
        estrellas.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200,200,255,${0.2 + s.br * 0.6})`;
            ctx.fill();
        });

        if (estado === ESTADOS.MENU) { drawMenu(); return; }
        if (estado === ESTADOS.TIENDA) { drawTienda(); return; }
        if (estado === ESTADOS.GAMEOVER) { drawGameOver(); return; }
        if (estado === ESTADOS.VICTORIA) { drawVictoria(); return; }

        // Explosiones
        explosiones.forEach(ex => {
            ctx.save();
            ctx.globalAlpha = ex.alpha;
            ctx.beginPath();
            ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
            ctx.strokeStyle = ex.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        });

        // Partículas
        particulas.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        });

        // Enemigos
        enemigos.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.rotacion);
            if (e.tipo === 'nave') drawNaveEnemiga(e);
            else drawAsteroide(e);
            ctx.restore();
        });

        // Jefe
        if (jefe) drawJefe();

        // Balas del jefe
        balasJefe.forEach(b => {
            ctx.save();
            ctx.globalAlpha = 0.95;
            ctx.shadowBlur = 10;
            ctx.shadowColor = b.color;
            if (b.tipo === 'laser') {
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radio, 0, Math.PI * 2);
                ctx.fillStyle = b.color;
                ctx.fill();
                // núcleo blanco
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radio * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
            } else {
                // chatarra: pequeño hexágono rotado
                ctx.translate(b.x, b.y);
                ctx.rotate(b.rotacion || 0);
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2;
                    i === 0 ? ctx.moveTo(Math.cos(a)*b.radio, Math.sin(a)*b.radio)
                            : ctx.lineTo(Math.cos(a)*b.radio, Math.sin(a)*b.radio);
                }
                ctx.closePath();
                ctx.strokeStyle = b.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.fillStyle = b.color + '44';
                ctx.fill();
            }
            ctx.restore();
        });

        // Balas jugador
        balas.forEach(b => {
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = b.color;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.roundRect(b.x - b.ancho / 2, b.y - b.alto / 2, b.ancho, b.alto, 2);
            ctx.fill();
            ctx.restore();
        });

        // Jugador
        drawJugador();

        // Escudo visual
        if (mejoras.escudo) {
            ctx.save();
            ctx.globalAlpha = 0.4 + Math.sin(bgPulse * 4) * 0.15;
            ctx.beginPath();
            ctx.arc(jugador.x, jugador.y, 26, 0, Math.PI * 2);
            ctx.strokeStyle = '#34c77b';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#34c77b';
            ctx.stroke();
            ctx.restore();
        }

        // HUD en canvas
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, ANCHO, jefe ? 58 : 28);
        ctx.fillStyle = '#454560';
        ctx.font = '11px "DM Mono", monospace';
        ctx.textAlign = 'left';
        const esBoss = oleada % 5 === 0;
        const oleadaLabel = esBoss ? `⚠ JEFE — OLEADA ${oleada}` : `OLEADA ${oleada}/100`;
        ctx.fillStyle = esBoss ? '#ff4488' : '#454560';
        ctx.fillText(oleadaLabel, 10, 18);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#34c77b';
        ctx.fillText(`⚙ ${chatarra}`, ANCHO - 10, 18);
        ctx.textAlign = 'center';
        // Barra de progreso hacia próximo jefe (solo si no hay jefe activo)
        if (!jefe) {
            const hasta = 5 - (oleada % 5);
            const pct = hasta === 5 ? 1 : (5 - hasta) / 5;
            ctx.fillStyle = 'rgba(255,68,136,0.15)';
            ctx.fillRect(0, 22, ANCHO * pct, 4);
            ctx.fillStyle = '#303040';
            ctx.font = '8px "DM Mono", monospace';
            ctx.fillText(hasta === 5 ? '¡JEFE VENCIDO!' : `Próximo jefe en ${hasta} oleada${hasta > 1 ? 's' : ''}`, ANCHO / 2, 27);
        }
    }

    /* ── Dibujar nave jugador ── */
    function drawJugador() {
        const x = jugador.x, y = jugador.y;
        const parpadeo = jugador.invulnerable > 0 && Math.floor(jugador.invulnerable / 5) % 2 === 0;
        if (parpadeo) return;

        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#4f7cff';

        // Cuerpo principal
        ctx.fillStyle = '#4f7cff';
        ctx.beginPath();
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x - 13, y + 12);
        ctx.lineTo(x, y + 6);
        ctx.lineTo(x + 13, y + 12);
        ctx.closePath();
        ctx.fill();

        // Alas
        ctx.fillStyle = '#2a4fa8';
        ctx.beginPath();
        ctx.moveTo(x - 13, y + 12);
        ctx.lineTo(x - 20, y + 16);
        ctx.lineTo(x - 8, y + 6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 13, y + 12);
        ctx.lineTo(x + 20, y + 16);
        ctx.lineTo(x + 8, y + 6);
        ctx.closePath();
        ctx.fill();

        // Cabina
        ctx.fillStyle = '#a0c8ff';
        ctx.beginPath();
        ctx.ellipse(x, y - 2, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Motor (llama)
        if (Math.random() > 0.3) {
            ctx.fillStyle = `rgba(255,${120 + Math.random() * 80 | 0},0,0.8)`;
            ctx.beginPath();
            ctx.moveTo(x - 5, y + 8);
            ctx.lineTo(x, y + 18 + Math.random() * 6);
            ctx.lineTo(x + 5, y + 8);
            ctx.closePath();
            ctx.fill();
        }

        // Si tiene doble ráfaga: indicador
        if (mejoras.rafagaDoble) {
            ctx.fillStyle = '#e8c97a';
            ctx.fillRect(x - 14, y - 4, 3, 10);
            ctx.fillRect(x + 11, y - 4, 3, 10);
        }

        ctx.restore();
    }

    /* ── Dibujar nave enemiga ── */
    function drawNaveEnemiga(e) {
        ctx.save();
        ctx.shadowBlur = 8; ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, e.alto / 2);
        ctx.lineTo(-e.ancho / 2, -e.alto / 2);
        ctx.lineTo(0, -e.alto / 4);
        ctx.lineTo(e.ancho / 2, -e.alto / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff9999';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /* ── Dibujar asteroide ── */
    function drawAsteroide(e) {
        ctx.save();
        ctx.shadowBlur = 5; ctx.shadowColor = '#806030';
        ctx.fillStyle = '#8a6030';
        ctx.beginPath();
        const r = e.ancho / 2;
        ctx.moveTo(r * 0.9, 0);
        ctx.lineTo(r * 0.5, -r * 0.8);
        ctx.lineTo(-r * 0.3, -r * 0.95);
        ctx.lineTo(-r * 0.9, -r * 0.4);
        ctx.lineTo(-r * 0.8, r * 0.5);
        ctx.lineTo(-r * 0.1, r * 0.9);
        ctx.lineTo(r * 0.6, r * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#6a4820';
        ctx.beginPath();
        ctx.arc(-r * 0.2, -r * 0.2, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /* ── Dibujar jefe ── */
    function drawJefe() {
        if (!jefe) return;
        const x = jefe.x, y = jefe.y;
        const flash = jefe.dañoFlash > 0;

        ctx.save();
        ctx.shadowBlur = 20 + Math.sin(bgPulse * 3) * 8;
        ctx.shadowColor = jefe.color;

        // Cuerpo central (hexágono)
        ctx.fillStyle = flash ? '#ffffff' : jefe.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + jefe.rotorAng * 0.3;
            const rx = jefe.ancho / 2, ry = jefe.alto / 2;
            const px = Math.cos(a) * rx, py = Math.sin(a) * ry;
            i === 0 ? ctx.moveTo(x + px, y + py) : ctx.lineTo(x + px, y + py);
        }
        ctx.closePath();
        ctx.fill();

        // Anillo exterior giratorio
        ctx.strokeStyle = flash ? '#ffffff' : jefe.colorSecundario;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + jefe.rotorAng;
            const r = jefe.ancho / 2 + 14;
            const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Núcleo brillante
        ctx.fillStyle = flash ? jefe.color : '#ffffff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 10 + Math.sin(bgPulse * 5) * 2, 0, Math.PI * 2);
        ctx.fill();

        // Cañones laterales
        [-1, 1].forEach(lado => {
            ctx.fillStyle = flash ? '#fff' : jefe.colorSecundario;
            ctx.beginPath();
            ctx.roundRect(x + lado * (jefe.ancho / 2 - 4), y + 8, lado * 14, 8, 2);
            ctx.fill();
        });

        ctx.restore();

        // Nombre del jefe (encima)
        ctx.save();
        ctx.fillStyle = jefe.color;
        ctx.font = `bold 11px "DM Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 8; ctx.shadowColor = jefe.color;
        ctx.fillText(`⚠ ${jefe.nombre} ⚠`, x, y - jefe.alto / 2 - 20);
        ctx.restore();

        // Barra de vida del jefe (en la parte superior del canvas)
        const bw = ANCHO - 60, bh = 10, bx = 30, by = 32;
        const pct = jefe.vidas / jefe.vidasMax;
        // Fondo
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
        // Barra
        const barColor = pct > 0.5 ? jefe.color : pct > 0.25 ? '#e8c97a' : '#e8445a';
        ctx.save();
        ctx.shadowBlur = 8; ctx.shadowColor = barColor;
        ctx.fillStyle = barColor;
        ctx.beginPath(); ctx.roundRect(bx, by, bw * pct, bh, 4); ctx.fill();
        ctx.restore();
        // Texto
        ctx.fillStyle = '#eeeef5';
        ctx.font = '9px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${jefe.nombre}  ${jefe.vidas}/${jefe.vidasMax}`, ANCHO / 2, by + bh + 12);

        // Intro flash text
        if (jefe.entraAnimacion) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, (120 - (jefe.yTarget - jefe.y) / 2) / 60);
            ctx.fillStyle = jefe.color;
            ctx.font = `bold 20px "DM Mono", monospace`;
            ctx.shadowBlur = 20; ctx.shadowColor = jefe.color;
            ctx.textAlign = 'center';
            ctx.fillText(`⚠ JEFE OLEADA ${oleada} ⚠`, ANCHO / 2, ALTO / 2 - 20);
            ctx.restore();
        }
    }

    /* ── Victoria ── */
    function drawVictoria() {
        ctx.fillStyle = 'rgba(4,4,14,0.88)';
        ctx.fillRect(0, 0, ANCHO, ALTO);
        ctx.save();
        const g = ctx.createLinearGradient(0, ALTO / 2 - 60, 0, ALTO / 2);
        g.addColorStop(0, '#e8c97a'); g.addColorStop(1, '#34c77b');
        ctx.fillStyle = g;
        ctx.shadowBlur = 30; ctx.shadowColor = '#e8c97a';
        ctx.font = 'bold 30px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('¡VICTORIA!', ANCHO / 2, ALTO / 2 - 50);
        ctx.restore();
        ctx.fillStyle = '#eeeef5';
        ctx.font = '15px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('100 OLEADAS COMPLETADAS', ANCHO / 2, ALTO / 2 - 14);
        ctx.fillStyle = '#e8c97a';
        ctx.font = 'bold 22px "DM Mono", monospace';
        ctx.fillText(`${puntuacion} pts`, ANCHO / 2, ALTO / 2 + 20);
        ctx.fillStyle = '#454580';
        ctx.font = '11px "DM Mono", monospace';
        ctx.fillText('Eres el Defensor Supremo del Espacio', ANCHO / 2, ALTO / 2 + 48);
        // Estrellas celebración
        estrellas.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r + 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${(s.x + bgPulse * 50) % 360}, 80%, 70%)`;
            ctx.globalAlpha = 0.5 + s.br * 0.5;
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    /* ══════════════════════════════════════════
       TIENDA
    ══════════════════════════════════════════ */

    /* Items de la tienda */
    const TIENDA_ITEMS = [
        {
            id: 'vel',
            icono: '⚡',
            nombre: 'Velocidad Disparo',
            desc: () => mejoras.velocidadDisparo >= 3 ? 'MÁXIMO' : `Nivel ${mejoras.velocidadDisparo} → ${mejoras.velocidadDisparo + 1}`,
            costo: () => [0, 40, 80, 999][mejoras.velocidadDisparo],
            activo: () => mejoras.velocidadDisparo < 3,
            accion: () => { mejoras.velocidadDisparo++; },
            color: '#e8c97a'
        },
        {
            id: 'escudo',
            icono: '🛡',
            nombre: 'Escudo Temporal',
            desc: () => mejoras.escudo ? 'YA ACTIVO' : 'Absorbe 1 impacto',
            costo: () => 60,
            activo: () => !mejoras.escudo,
            accion: () => { mejoras.escudo = true; },
            color: '#34c77b'
        },
        {
            id: 'doble',
            icono: '🔫',
            nombre: 'Ráfaga Doble',
            desc: () => mejoras.rafagaDoble ? 'YA ACTIVA' : 'Dispara 2 balas',
            costo: () => 70,
            activo: () => !mejoras.rafagaDoble,
            accion: () => { mejoras.rafagaDoble = true; },
            color: '#4f7cff'
        },
        {
            id: 'vida',
            icono: '❤',
            nombre: 'Vida Extra',
            desc: () => jugador.vidas >= 3 ? 'MÁXIMO' : `${jugador.vidas} → ${jugador.vidas + 1}`,
            costo: () => 100,
            activo: () => jugador.vidas < 3,
            accion: () => { jugador.vidas = Math.min(3, jugador.vidas + 1); actualizarHUD(); },
            color: '#e8445a'
        }
    ];

    // Selección del cursor en tienda
    let shopCursor = 0;

    // Navegación teclado en tienda
    function handleTiendaKey(e) {
        if (estado !== ESTADOS.TIENDA) return;
        if (e.key === 'ArrowDown' || e.key === 's') shopCursor = (shopCursor + 1) % TIENDA_ITEMS.length;
        if (e.key === 'ArrowUp' || e.key === 'w') shopCursor = (shopCursor - 1 + TIENDA_ITEMS.length) % TIENDA_ITEMS.length;
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'z') comprarItem(shopCursor);
        if (e.key === 'Escape' || e.key === 'q') continuarDestienda();
        e.preventDefault();
    }
    window.addEventListener('keydown', handleTiendaKey);

    // Click en canvas para tienda
    canvas.addEventListener('click', e => {
        if (estado === ESTADOS.VICTORIA) { iniciarJuego(); return; }
        if (estado !== ESTADOS.TIENDA) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = ANCHO / rect.width;
        const scaleY = ALTO / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        // Botón continuar
        if (mx > ANCHO / 2 - 80 && mx < ANCHO / 2 + 80 && my > ALTO - 72 && my < ALTO - 44) {
            continuarDestienda(); return;
        }

        // Items
        TIENDA_ITEMS.forEach((item, i) => {
            const iy = 130 + i * 78;
            if (mx > 20 && mx < ANCHO - 20 && my > iy && my < iy + 65) {
                shopCursor = i;
                comprarItem(i);
            }
        });
    });

    function comprarItem(idx) {
        const item = TIENDA_ITEMS[idx];
        if (!item.activo()) return;
        const costo = item.costo();
        if (chatarra >= costo) {
            chatarra -= costo;
            item.accion();
            buySound();
            actualizarHUD();
        } else {
            beep(110, 0.2, 'sawtooth', 0.1);
        }
    }

    function continuarDestienda() {
        estado = ESTADOS.JUGANDO;
        iniciarOleada();
        shopCursor = 0;
    }

    function drawTienda() {
        // Fondo semitransparente
        ctx.fillStyle = 'rgba(4,4,14,0.92)';
        ctx.fillRect(0, 0, ANCHO, ALTO);

        // Título
        ctx.save();
        const proxBoss = (oleada + 1) % 5 === 0;
        ctx.shadowBlur = 20; ctx.shadowColor = proxBoss ? '#ff4488' : '#e8c97a';
        ctx.fillStyle = proxBoss ? '#ff4488' : '#e8c97a';
        ctx.font = 'bold 22px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(proxBoss ? '⚠  JEFE SE APROXIMA' : '⚙  TALLER ESPACIAL', ANCHO / 2, 44);
        ctx.restore();

        ctx.fillStyle = '#454560';
        ctx.font = '11px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Oleada ${oleada} completada  ·  Chatarra disponible: ⚙ ${chatarra}`, ANCHO / 2, 66);

        ctx.fillStyle = '#303050';
        ctx.fillRect(30, 76, ANCHO - 60, 1);

        // Items
        TIENDA_ITEMS.forEach((item, i) => {
            const iy = 90 + i * 78;
            const activo = item.activo();
            const costo = item.costo();
            const puedePagar = chatarra >= costo && activo;
            const seleccionado = shopCursor === i;

            // Fondo item
            ctx.save();
            ctx.globalAlpha = activo ? 1 : 0.45;
            ctx.fillStyle = seleccionado ? `${item.color}22` : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = seleccionado ? item.color : 'rgba(255,255,255,0.08)';
            ctx.lineWidth = seleccionado ? 1.5 : 1;
            ctx.beginPath();
            ctx.roundRect(20, iy, ANCHO - 40, 65, 8);
            ctx.fill(); ctx.stroke();

            // Icono
            ctx.font = '22px serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.icono, 36, iy + 26);

            // Nombre
            ctx.fillStyle = item.color;
            ctx.font = 'bold 13px "DM Mono", monospace';
            ctx.fillText(item.nombre, 68, iy + 22);

            // Descripción
            ctx.fillStyle = '#7070a0';
            ctx.font = '11px "DM Mono", monospace';
            ctx.fillText(item.desc(), 68, iy + 38);

            // Precio
            ctx.textAlign = 'right';
            ctx.fillStyle = puedePagar ? '#34c77b' : (activo ? '#e8445a' : '#454560');
            ctx.font = 'bold 13px "DM Mono", monospace';
            ctx.fillText(activo ? `⚙ ${costo}` : '──', ANCHO - 32, iy + 30);

            ctx.restore();
        });

        // Botón continuar
        const bx = ANCHO / 2 - 80, by = ALTO - 74;
        ctx.save();
        ctx.fillStyle = '#4f7cff';
        ctx.beginPath();
        ctx.roundRect(bx, by, 160, 30, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('▶  SIGUIENTE OLEADA', ANCHO / 2, by + 20);
        ctx.restore();

        ctx.fillStyle = '#303050';
        ctx.font = '10px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('↑↓ Seleccionar · Z/Enter Comprar · ESC Continuar', ANCHO / 2, ALTO - 14);
    }

    /* ── MENU ── */
    function drawMenu() {
        ctx.save();
        ctx.shadowBlur = 30; ctx.shadowColor = '#4f7cff';
        ctx.fillStyle = '#4f7cff';
        ctx.font = 'bold 28px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RETRO SPACE', ANCHO / 2, ALTO / 2 - 60);
        ctx.fillStyle = '#e8445a';
        ctx.shadowColor = '#e8445a';
        ctx.fillText('DEFENDER', ANCHO / 2, ALTO / 2 - 28);
        ctx.restore();

        ctx.fillStyle = '#454580';
        ctx.font = '12px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Destruye asteroides y naves enemigas', ANCHO / 2, ALTO / 2 + 10);
        ctx.fillText('Gana chatarra ⚙ para mejorar tu nave', ANCHO / 2, ALTO / 2 + 28);

        ctx.fillStyle = '#303058';
        ctx.font = '11px "DM Mono", monospace';
        ctx.fillText('← → Mover · ESPACIO Disparar', ANCHO / 2, ALTO / 2 + 58);

        // Nave decorativa animada
        ctx.save();
        ctx.translate(ANCHO / 2, ALTO / 2 + 120 + Math.sin(bgPulse * 2) * 6);
        ctx.shadowBlur = 18; ctx.shadowColor = '#4f7cff';
        ctx.fillStyle = '#4f7cff';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(-14, 14);
        ctx.lineTo(0, 7);
        ctx.lineTo(14, 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#a0c8ff';
        ctx.beginPath();
        ctx.ellipse(0, -2, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /* ── GAME OVER en canvas ── */
    function drawGameOver() {
        ctx.fillStyle = 'rgba(4,4,14,0.85)';
        ctx.fillRect(0, 0, ANCHO, ALTO);
        ctx.save();
        ctx.shadowBlur = 25; ctx.shadowColor = '#e8445a';
        ctx.fillStyle = '#e8445a';
        ctx.font = 'bold 32px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', ANCHO / 2, ALTO / 2 - 40);
        ctx.restore();
        ctx.fillStyle = '#eeeef5';
        ctx.font = '16px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${puntuacion} pts`, ANCHO / 2, ALTO / 2);
        ctx.fillStyle = '#454580';
        ctx.font = '12px "DM Mono", monospace';
        ctx.fillText(`Oleada ${oleada}  ·  ⚙ ${chatarra} chatarra`, ANCHO / 2, ALTO / 2 + 24);
    }

    /* ── LOOP ── */
    function loop() {
        update();
        draw();
        animFrame = requestAnimationFrame(loop);
    }

    // Ocultar game-over del HTML al arrancar
    const gos = document.getElementById('game-over-screen');
    if (gos) gos.style.display = 'none';

    loop();
})();
