// static/js/simon.js — Versión mejorada con puntaje escalado y UI renovada

(function () {
    'use strict';

    const contenedor = document.getElementById('simon-game-container');
    if (!contenedor) { console.error('No se encontró #simon-game-container'); return; }
    contenedor.innerHTML = '';

    /* ── Usuario ────────────────────────────────────────── */
    const userEl = document.getElementById('display-user');
    const USER   = (userEl ? userEl.innerText : 'Jugador').replace('Jugador: ', '').trim();

    /* ── Estado ─────────────────────────────────────────── */
    let puntuacion   = 0;   // puntos acumulados (cada acierto = 20 pts + bonus)
    let racha        = 0;   // respuestas correctas seguidas
    let mejorRacha   = 0;
    let preguntaActual = null;
    let juegoActivo  = false;
    let estadoMensaje = 'Presiona INICIAR para comenzar.';
    let feedbackMsg  = '';
    let feedbackColor = '';
    let audioCtx     = null;
    let bgPulse      = 0;

    /* ── Dimensiones del Canvas ──────────────────────────── */
    const ANCHO = 480, ALTO = 400;

    /* ── Personaje ───────────────────────────────────────── */
    const jugador = { x: ANCHO / 2, y: ALTO / 2 + 30, radio: 13, velocidad: 4.5, color: '#4f7cff' };

    /* ── Zonas de respuesta (4 esquinas) ─────────────────── */
    const ZONAS = [
        { id: 0, x: 0,          y: 75,        w: 140, h: 95, color: '#e8445a', glow: 'rgba(232,68,90,0.4)',   note: 329.63, label: '' },
        { id: 1, x: ANCHO-140,  y: 75,        w: 140, h: 95, color: '#4f7cff', glow: 'rgba(79,124,255,0.4)',  note: 261.63, label: '' },
        { id: 2, x: 0,          y: ALTO-100,  w: 140, h: 95, color: '#34c77b', glow: 'rgba(52,199,123,0.4)',  note: 220.00, label: '' },
        { id: 3, x: ANCHO-140,  y: ALTO-100,  w: 140, h: 95, color: '#e8c97a', glow: 'rgba(232,201,122,0.4)', note: 164.81, label: '' },
    ];

    /* ── Teclas ─────────────────────────────────────────── */
    const teclas = {};
    window.addEventListener('keydown', e => {
        teclas[e.key]  = true;
        teclas[e.code] = true;
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    });
    window.addEventListener('keyup', e => {
        teclas[e.key]  = false;
        teclas[e.code] = false;
    });

    /* ── Audio ───────────────────────────────────────────── */
    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    function beep(freq, dur = 0.25, type = 'triangle') {
        try {
            initAudio();
            const osc  = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + dur);
        } catch (e) {}
    }

    /* ── Estilos CSS ──────────────────────────────────────── */
    const style = document.createElement('style');
    style.textContent = `
        .simon-wrapper {
            display: flex; flex-direction: column; align-items: center;
            gap: 10px; width: 100%; max-width: 500px; margin: 0 auto;
            box-sizing: border-box; font-family: 'DM Sans', sans-serif;
        }
        .simon-hud {
            display: flex; justify-content: space-between; align-items: center;
            width: 100%; padding: 0 4px;
        }
        .simon-hud-item {
            display: flex; flex-direction: column; align-items: center; gap: 1px;
        }
        .simon-hud-val {
            font-family: 'DM Mono', monospace; font-size: 1.3rem;
            font-weight: 700; color: #eeeef5; line-height: 1;
        }
        .simon-hud-label {
            font-size: 0.65rem; letter-spacing: 0.08em;
            text-transform: uppercase; color: #5a5a78;
        }
        .simon-canvas {
            display: block; width: 100%; height: auto;
            border-radius: 12px;
            background: #080810;
        }
        .simon-controls {
            display: flex; gap: 10px; width: 100%; justify-content: center;
        }
        .simon-btn {
            flex: 1; max-width: 200px;
            padding: 10px 16px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px; cursor: pointer;
            color: #eeeef5; font-weight: 600; font-size: 0.875rem;
            font-family: 'DM Sans', sans-serif;
            transition: all 0.15s;
        }
        .simon-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.18); }
        .simon-btn.primary { background: #4f7cff; border-color: #4f7cff; color: white; }
        .simon-btn.primary:hover { background: #3a63e0; }

        /* Joystick virtual para móvil */
        .simon-dpad {
            display: grid; grid-template-columns: repeat(3, 52px);
            grid-template-rows: repeat(2, 52px); gap: 6px;
            justify-content: center; width: 100%;
        }
        .dpad-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px; color: #eeeef5;
            font-size: 1.2rem; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            user-select: none; -webkit-user-select: none;
            height: 52px; transition: background 0.1s;
        }
        .dpad-btn:active { background: #4f7cff; border-color: #4f7cff; }

        @media (min-width: 769px) { .simon-dpad { display: none; } }
    `;
    document.head.appendChild(style);

    /* ── Estructura HTML ──────────────────────────────────── */
    const wrapper = document.createElement('div');
    wrapper.className = 'simon-wrapper';
    wrapper.innerHTML = `
        <div class="simon-hud">
            <div class="simon-hud-item">
                <div class="simon-hud-val" id="s-pts">0</div>
                <div class="simon-hud-label">Puntos</div>
            </div>
            <div class="simon-hud-item">
                <div class="simon-hud-val" id="s-racha" style="color:#e8c97a;">0</div>
                <div class="simon-hud-label">Racha</div>
            </div>
            <div class="simon-hud-item">
                <div class="simon-hud-val" id="s-qnum" style="color:#5a5a78;">—</div>
                <div class="simon-hud-label">Resp.</div>
            </div>
        </div>

        <canvas id="simon-canvas" width="${ANCHO}" height="${ALTO}" class="simon-canvas"></canvas>

        <div class="simon-controls">
            <button class="simon-btn primary" id="s-start">▶ INICIAR</button>
            <button class="simon-btn" id="s-fs">⛶ Pantalla</button>
        </div>

        <div class="simon-dpad">
            <div></div>
            <button class="dpad-btn" data-dir="up">▲</button>
            <div></div>
            <button class="dpad-btn" data-dir="left">◀</button>
            <button class="dpad-btn" data-dir="down">▼</button>
            <button class="dpad-btn" data-dir="right">▶</button>
        </div>
    `;
    contenedor.appendChild(wrapper);

    const canvas = wrapper.querySelector('#simon-canvas');
    const ctx    = canvas.getContext('2d');
    const elPts  = wrapper.querySelector('#s-pts');
    const elRacha= wrapper.querySelector('#s-racha');
    const elQNum = wrapper.querySelector('#s-qnum');
    const btnStart = wrapper.querySelector('#s-start');
    const btnFS    = wrapper.querySelector('#s-fs');

    /* ── D-Pad táctil ─────────────────────────────────────── */
    wrapper.querySelectorAll('.dpad-btn').forEach(btn => {
        const dir = btn.getAttribute('data-dir');
        const press = e => { e.preventDefault(); initAudio(); setDir(dir, true); };
        const release = e => { e.preventDefault(); setDir(dir, false); };
        btn.addEventListener('touchstart',  press,   { passive: false });
        btn.addEventListener('touchend',    release, { passive: false });
        btn.addEventListener('touchcancel', release, { passive: false });
        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup',   release);
        btn.addEventListener('mouseleave', release);
    });

    function setDir(dir, val) {
        if (dir === 'up')    { teclas.ArrowUp    = val; teclas.w = val; }
        if (dir === 'down')  { teclas.ArrowDown  = val; teclas.s = val; }
        if (dir === 'left')  { teclas.ArrowLeft  = val; teclas.a = val; }
        if (dir === 'right') { teclas.ArrowRight = val; teclas.d = val; }
    }

    /* ── Botones ──────────────────────────────────────────── */
    btnStart.addEventListener('click', () => {
        initAudio();
        puntuacion  = 0;
        racha       = 0;
        mejorRacha  = 0;
        feedbackMsg = '';
        elPts.textContent   = '0';
        elRacha.textContent = '0';
        elQNum.textContent  = '0';
        cargarPregunta();
        btnStart.textContent = '↺ Reiniciar';
    });

    btnFS.addEventListener('click', () => {
        const target = document.getElementById('game-screen') || canvas;
        if (!document.fullscreenElement) {
            target.requestFullscreen?.() || target.webkitRequestFullscreen?.();
        } else {
            document.exitFullscreen?.() || document.webkitExitFullscreen?.();
        }
    });

    /* ── Lógica del juego ─────────────────────────────────── */
    let respuestasCorrectas = 0;

    function cargarPregunta() {
        if (typeof window.obtenerPreguntaArcadeSimon !== 'function') {
            console.error('preguntas.js no cargado');
            estadoMensaje = 'Error: preguntas no cargadas.';
            return;
        }
        preguntaActual = window.obtenerPreguntaArcadeSimon();

        // Asignar opciones a las 4 zonas (las mezcla cada vez)
        const opciones = [...preguntaActual.opciones];
        ZONAS.forEach((z, i) => { z.label = Object.values(opciones)[i] || ''; });

        estadoMensaje = preguntaActual.pregunta;
        feedbackMsg   = '';
        feedbackColor = '';

        // Centrar personaje
        jugador.x = ANCHO / 2;
        jugador.y = ALTO / 2 + 30;
        juegoActivo = true;
    }

    function procesarColision(zonaId) {
        juegoActivo = false;
        Object.keys(teclas).forEach(k => teclas[k] = false);

        const zona     = ZONAS[zonaId];
        const elegida  = zona.label;
        const correcta = preguntaActual.correcta;

        if (elegida === correcta) {
            // CORRECTO — escalado de puntos: 20 base + bonus de racha
            racha++;
            mejorRacha = Math.max(mejorRacha, racha);
            const bonus  = Math.min(racha * 5, 30); // bonus máximo 30 pts
            const ganado = 20 + bonus;
            puntuacion  += ganado;
            respuestasCorrectas++;

            feedbackMsg   = `+${ganado} pts ✓ ${racha >= 3 ? '🔥 Racha x' + racha : ''}`;
            feedbackColor = '#34c77b';

            elPts.textContent   = puntuacion;
            elRacha.textContent = racha;
            elQNum.textContent  = respuestasCorrectas;
            elRacha.style.color = racha >= 3 ? '#e8c97a' : '#eeeef5';

            beep(zona.note, 0.18);
            setTimeout(() => beep(523.25, 0.22, 'sine'), 90);
            setTimeout(cargarPregunta, 1100);
        } else {
            // INCORRECTO — fin de partida
            racha = 0;
            feedbackMsg   = `✗ Era: "${correcta}"`;
            feedbackColor = '#e8445a';
            beep(110, 0.55, 'sawtooth');
            setTimeout(finalizarPartida, 2000);
        }
    }

    function verificarColisiones() {
        for (const z of ZONAS) {
            if (jugador.x + jugador.radio > z.x &&
                jugador.x - jugador.radio < z.x + z.w &&
                jugador.y + jugador.radio > z.y &&
                jugador.y - jugador.radio < z.y + z.h) {
                procesarColision(z.id);
                break;
            }
        }
    }

    /* ── Fin de partida ───────────────────────────────────── */
    function finalizarPartida() {
        juegoActivo = false;

        // Guardar puntaje — usa la sesión del servidor
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ juego: 'simon', puntos: puntuacion })
        })
        .then(() => {
            if (typeof window.cargarRanking  === 'function') window.cargarRanking();
            if (typeof window.cargarRankings === 'function') window.cargarRankings();
        })
        .catch(err => console.error('Error guardando Simon:', err));

        // Pantalla de game over del HTML
        const gos = document.getElementById('game-over-screen');
        const msg = document.getElementById('final-score-msg');
        if (msg) msg.innerText = `${puntuacion} pts · ${respuestasCorrectas} respuestas · Mejor racha: ${mejorRacha}`;
        if (contenedor) contenedor.style.display = 'none';
        if (gos) {
            gos.style.display = 'flex';
            const btn = gos.querySelector('.btn-play');
            if (btn) btn.onclick = (e) => {
                e.preventDefault();
                gos.style.display = 'none';
                contenedor.style.display = 'block';
                puntuacion = 0; racha = 0; mejorRacha = 0;
                respuestasCorrectas = 0;
                elPts.textContent = '0';
                elRacha.textContent = '0';
                elQNum.textContent = '0';
                btnStart.textContent = '▶ INICIAR';
            };
        }
    }

    /* ── Dibujado multi-línea ─────────────────────────────── */
    function fillTextWrap(text, x, y, maxW, lineH) {
        const words = String(text).split(' ');
        let line = '';
        for (let i = 0; i < words.length; i++) {
            const test = line + words[i] + ' ';
            if (ctx.measureText(test).width > maxW && i > 0) {
                ctx.fillText(line.trim(), x, y);
                line = words[i] + ' ';
                y += lineH;
            } else { line = test; }
        }
        ctx.fillText(line.trim(), x, y);
    }

    /* ── Game loop ────────────────────────────────────────── */
    function loop() {
        bgPulse += 0.04;

        // Mover personaje
        if (juegoActivo) {
            if (teclas.ArrowUp    || teclas.w || teclas.KeyW)    jugador.y -= jugador.velocidad;
            if (teclas.ArrowDown  || teclas.s || teclas.KeyS)    jugador.y += jugador.velocidad;
            if (teclas.ArrowLeft  || teclas.a || teclas.KeyA)    jugador.x -= jugador.velocidad;
            if (teclas.ArrowRight || teclas.d || teclas.KeyD)    jugador.x += jugador.velocidad;

            // Límites del canvas
            jugador.x = Math.max(jugador.radio, Math.min(ANCHO - jugador.radio, jugador.x));
            jugador.y = Math.max(75 + jugador.radio, Math.min(ALTO - jugador.radio, jugador.y));

            verificarColisiones();
        }

        /* ── DRAW ── */
        // Fondo
        ctx.fillStyle = '#080810';
        ctx.fillRect(0, 0, ANCHO, ALTO);

        // Cuadrícula sutil
        ctx.strokeStyle = 'rgba(255,255,255,0.025)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < ANCHO; x += 40) { ctx.beginPath(); ctx.moveTo(x,75); ctx.lineTo(x,ALTO); ctx.stroke(); }
        for (let y = 75; y < ALTO; y += 40)  { ctx.beginPath(); ctx.moveTo(0,y);  ctx.lineTo(ANCHO,y); ctx.stroke(); }

        // Panel de pregunta superior
        ctx.fillStyle = 'rgba(8,8,16,0.92)';
        ctx.fillRect(0, 0, ANCHO, 72);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(0, 70, ANCHO, 2);

        // Texto de la pregunta
        ctx.fillStyle = '#eeeef5';
        ctx.font      = '13px "DM Sans", sans-serif';
        ctx.textAlign = 'center';
        fillTextWrap(estadoMensaje, ANCHO / 2, 20, ANCHO - 24, 17);

        // Feedback (correcto/incorrecto)
        if (feedbackMsg) {
            ctx.fillStyle = feedbackColor;
            ctx.font      = 'bold 12px "DM Mono", monospace';
            ctx.fillText(feedbackMsg, ANCHO / 2, 58);
        }

        // Zonas de respuesta
        ZONAS.forEach(z => {
            const cerca = (jugador.x > z.x && jugador.x < z.x + z.w &&
                           jugador.y > z.y && jugador.y < z.y + z.h);

            // Fondo de zona con glow si está cerca
            ctx.save();
            ctx.shadowBlur  = cerca ? 20 : 8;
            ctx.shadowColor = z.color;
            ctx.fillStyle   = cerca ? z.color : z.color + 'cc';
            ctx.beginPath();
            ctx.roundRect(z.x, z.y, z.w, z.h, 8);
            ctx.fill();
            ctx.shadowBlur  = 0;

            // Texto de la opción dentro de la zona
            if (preguntaActual && z.label) {
                ctx.fillStyle = '#0a0a10';
                ctx.font      = 'bold 11px "DM Sans", sans-serif';
                ctx.textAlign = 'center';
                fillTextWrap(z.label, z.x + z.w / 2, z.y + z.h / 2 - 6, z.w - 12, 14);
            }
            ctx.restore();
        });

        // Personaje
        const pulse = Math.sin(bgPulse * 2) * 2;
        ctx.save();
        ctx.shadowBlur  = 18 + pulse;
        ctx.shadowColor = jugador.color;
        ctx.fillStyle   = jugador.color;
        ctx.beginPath();
        ctx.arc(jugador.x, jugador.y, jugador.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Centro blanco
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(jugador.x, jugador.y, jugador.radio * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.textAlign = 'left'; // reset
        requestAnimationFrame(loop);
    }

    // Ocultar game-over del HTML al arrancar
    const gos = document.getElementById('game-over-screen');
    if (gos) gos.style.display = 'none';

    requestAnimationFrame(loop);
})();
