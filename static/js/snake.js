(function () {
    'use strict';

    const container = document.querySelector('.canvas-placeholder');
    if (!container) return;

    /* ── Canvas ─────────────────────────────────────────── */
    let canvas = container.querySelector('canvas');
    if (!canvas) { canvas = document.createElement('canvas'); container.prepend(canvas); }
    const ctx = canvas.getContext('2d');

    /* ── Usuario ────────────────────────────────────────── */
    const userEl = document.getElementById('display-user');
    const USER   = (userEl ? userEl.innerText : 'Jugador').replace('Jugador: ', '').trim();

    /* ── Constantes ─────────────────────────────────────── */
    const COLS = 20, ROWS = 20;
    let CELL = 20; // se recalcula en resize

    /* ── Paleta de colores por skin ─────────────────────── */
    const SKINS = [
        { head: '#4f7cff', body: 'rgba(79,124,255,0.45)', glow: '#4f7cff', name: 'Azul' },
        { head: '#34c77b', body: 'rgba(52,199,123,0.45)', glow: '#34c77b', name: 'Verde' },
        { head: '#ff6b6b', body: 'rgba(255,107,107,0.45)', glow: '#ff6b6b', name: 'Rojo' },
        { head: '#ffd93d', body: 'rgba(255,217,61,0.45)',  glow: '#ffd93d', name: 'Oro' },
        { head: '#c56aff', body: 'rgba(197,106,255,0.45)', glow: '#c56aff', name: 'Púrpura' },
    ];
    let skinIdx = 0;

    /* ── Estado ─────────────────────────────────────────── */
    let snake, foods, dx, dy, score, highScore, speed, running, lockInput;
    let applesEaten, particles, flashTimer;
    let gameState = 'menu'; // menu | playing | over

    /* ── Resize ──────────────────────────────────────────── */
    function resize() {
        const size = Math.min(container.clientWidth, container.clientHeight, 480);
        canvas.width  = size;
        canvas.height = size;
        CELL = size / COLS;
    }

    /* ── Partículas ─────────────────────────────────────── */
    function spawnParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            particles.push({
                x, y,
                vx: Math.cos(ang) * (1.5 + Math.random() * 2.5),
                vy: Math.sin(ang) * (1.5 + Math.random() * 2.5),
                life: 1,
                color,
                r: 3 + Math.random() * 3
            });
        }
    }

    /* ── Iniciar ─────────────────────────────────────────── */
    function init() {
        resize();
        snake = [
            { x: 10, y: 10 },
            { x: 9,  y: 10 },
            { x: 8,  y: 10 },
        ];
        foods      = [];
        dx = 1; dy = 0;
        score      = 0;
        speed      = 140;
        running    = true;
        lockInput  = false;
        applesEaten = 0;
        particles  = [];
        flashTimer = 0;
        gameState  = 'playing';

        const gos = document.getElementById('game-over-screen');
        if (gos) gos.style.display = 'none';

        for (let i = 0; i < 4; i++) spawnFood();
        highScore = +(localStorage.getItem('snake_hs') || 0);
        loop();
    }

    /* ── Comida ─────────────────────────────────────────── */
    function spawnFood() {
        let f, tries = 0;
        do {
            f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
            tries++;
        } while (
            tries < 200 &&
            (snake.some(s => s.x === f.x && s.y === f.y) ||
             foods.some(e => e.x === f.x && e.y === f.y))
        );
        f.pulse = 0; // animación de pulsación
        foods.push(f);
    }

    /* ── Loop principal ─────────────────────────────────── */
    let lastTick = 0;
    function loop(ts = 0) {
        if (!running) return;
        if (ts - lastTick >= speed) {
            lastTick = ts;
            update();
        }
        draw(ts);
        requestAnimationFrame(loop);
    }

    function update() {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // Colisión con paredes o cuerpo
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
            snake.some(s => s.x === head.x && s.y === head.y)) {
            return die();
        }

        snake.unshift(head);
        const fi = foods.findIndex(f => f.x === head.x && f.y === head.y);

        if (fi !== -1) {
            score      += 10 + Math.floor(applesEaten / 5) * 2; // bonus progresivo
            applesEaten++;
            speed       = Math.max(60, speed - 2);
            flashTimer  = 6;
            if (applesEaten % 5 === 0) skinIdx = (skinIdx + 1) % SKINS.length; // cambiar skin cada 5 manzanas

            const px = (head.x + 0.5) * CELL;
            const py = (head.y + 0.5) * CELL;
            spawnParticles(px, py, SKINS[skinIdx].glow, 10);

            foods.splice(fi, 1);
            spawnFood();
        } else {
            snake.pop();
        }
        lockInput = false;
    }

    /* ── Die ─────────────────────────────────────────────── */
    function die() {
        running   = false;
        gameState = 'over';

        // Guardar highscore local
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snake_hs', highScore);
        }

        // Partículas de muerte
        const hx = (snake[0].x + 0.5) * CELL;
        const hy = (snake[0].y + 0.5) * CELL;
        spawnParticles(hx, hy, '#e8445a', 20);

        // Guardar en servidor
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: USER, puntos: score, juego: 'snake' })
        }).then(() => {
            if (typeof window.cargarRanking === 'function') window.cargarRanking();
        });

        // Mostrar game-over
        const gos = document.getElementById('game-over-screen');
        const msg = document.getElementById('final-score-msg');
        if (msg) msg.innerText = `Puntaje: ${score}  ·  Récord: ${highScore}`;

        const retry = gos?.querySelector('.btn-play');
        if (retry) retry.onclick = (e) => { e.preventDefault(); init(); };

        // Renderizar una última vez las partículas y mostrar pantalla
        setTimeout(() => {
            if (gos) gos.style.display = 'flex';
        }, 300);
    }

    /* ── Draw ─────────────────────────────────────────────── */
    function draw(ts) {
        const W = canvas.width, H = canvas.height;
        const skin = SKINS[skinIdx];

        /* Fondo */
        ctx.fillStyle = '#080810';
        ctx.fillRect(0, 0, W, H);

        /* Cuadrícula sutil */
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let c = 0; c <= COLS; c++) {
            ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke();
        }
        for (let r = 0; r <= ROWS; r++) {
            ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke();
        }

        /* Flash al comer */
        if (flashTimer > 0) {
            ctx.fillStyle = `rgba(${hexToRgb(skin.glow)},${flashTimer / 30})`;
            ctx.fillRect(0, 0, W, H);
            flashTimer--;
        }

        /* Partículas */
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle   = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
            ctx.fill();
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.12;
            p.life -= 0.045;
        });
        ctx.globalAlpha = 1;

        /* Comida */
        foods.forEach(f => {
            f.pulse = (f.pulse || 0) + 0.08;
            const fp = (Math.sin(f.pulse) * 0.12 + 0.88);
            const fx = (f.x + 0.5) * CELL;
            const fy = (f.y + 0.5) * CELL;
            const fr = (CELL * 0.36) * fp;

            ctx.save();
            ctx.shadowBlur  = 14;
            ctx.shadowColor = '#e8445a';
            ctx.fillStyle   = '#e8445a';
            ctx.beginPath();
            ctx.arc(fx, fy, fr, 0, Math.PI * 2);
            ctx.fill();
            // Brillo interior
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.beginPath();
            ctx.arc(fx - fr * 0.25, fy - fr * 0.25, fr * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        });

        /* Cuerpo de la serpiente */
        snake.forEach((seg, i) => {
            const px = seg.x * CELL + 1;
            const py = seg.y * CELL + 1;
            const sz = CELL - 2;

            if (i === 0) {
                /* Cabeza con glow */
                ctx.save();
                ctx.shadowBlur  = 18;
                ctx.shadowColor = skin.glow;
                ctx.fillStyle   = skin.head;
                ctx.beginPath();
                ctx.roundRect(px, py, sz, sz, 4);
                ctx.fill();
                ctx.shadowBlur = 0;

                /* Ojos */
                const eyeSize = Math.max(2, sz * 0.14);
                const eyeOff  = sz * 0.25;
                ctx.fillStyle = 'rgba(0,0,0,0.8)';
                if (dx === 1)  { ctx.beginPath(); ctx.arc(px+sz-eyeOff, py+eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(px+sz-eyeOff, py+sz-eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); }
                if (dx === -1) { ctx.beginPath(); ctx.arc(px+eyeOff,    py+eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(px+eyeOff,    py+sz-eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); }
                if (dy === 1)  { ctx.beginPath(); ctx.arc(px+eyeOff,    py+sz-eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(px+sz-eyeOff, py+sz-eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); }
                if (dy === -1) { ctx.beginPath(); ctx.arc(px+eyeOff,    py+eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(px+sz-eyeOff, py+eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); }
                ctx.restore();
            } else {
                /* Cuerpo con opacidad degradada */
                const alpha = Math.max(0.12, 1 - (i / snake.length) * 0.85);
                ctx.globalAlpha = alpha;
                ctx.fillStyle   = skin.body;
                ctx.beginPath();
                ctx.roundRect(px + 1, py + 1, sz - 2, sz - 2, 3);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });

        /* HUD */
        drawHUD(W);
    }

    function drawHUD(W) {
        // Barra superior semi-transparente
        ctx.fillStyle = 'rgba(8,8,16,0.75)';
        ctx.fillRect(0, 0, W, 34);

        ctx.font      = `bold ${Math.round(CELL * 0.75)}px "DM Mono", monospace`;
        ctx.fillStyle = '#eeeef5';
        ctx.textAlign = 'left';
        ctx.fillText(`${score}`, 12, 22);

        ctx.fillStyle = '#5a5a78';
        ctx.textAlign = 'center';
        ctx.fillText(`RÉC ${highScore}`, W / 2, 22);

        ctx.fillStyle = '#eeeef5';
        ctx.textAlign = 'right';
        ctx.fillText(USER.slice(0, 12), W - 12, 22);

        ctx.textAlign = 'left'; // reset
    }

    /* ── Controles teclado ───────────────────────────────── */
    window.addEventListener('keydown', e => {
        if (gameState !== 'playing' || lockInput) return;
        if (e.key === 'ArrowUp'    && dy === 0)  { dx = 0;  dy = -1; lockInput = true; }
        if (e.key === 'ArrowDown'  && dy === 0)  { dx = 0;  dy =  1; lockInput = true; }
        if (e.key === 'ArrowLeft'  && dx === 0)  { dx = -1; dy =  0; lockInput = true; }
        if (e.key === 'ArrowRight' && dx === 0)  { dx =  1; dy =  0; lockInput = true; }
    });

    /* ── Controles táctiles ──────────────────────────────── */
    let tx0 = 0, ty0 = 0;
    canvas.addEventListener('touchstart', e => {
        tx0 = e.changedTouches[0].clientX;
        ty0 = e.changedTouches[0].clientY;
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
        if (gameState !== 'playing' || lockInput) return;
        const dtx = e.changedTouches[0].clientX - tx0;
        const dty = e.changedTouches[0].clientY - ty0;
        if (Math.abs(dtx) > Math.abs(dty)) {
            if (dtx > 20 && dx === 0)  { dx =  1; dy = 0; lockInput = true; }
            if (dtx < -20 && dx === 0) { dx = -1; dy = 0; lockInput = true; }
        } else {
            if (dty > 20 && dy === 0)  { dx = 0; dy =  1; lockInput = true; }
            if (dty < -20 && dy === 0) { dx = 0; dy = -1; lockInput = true; }
        }
    }, { passive: false });

    /* ── Resize ─────────────────────────────────────────── */
    window.addEventListener('resize', resize);

    /* ── Helpers ─────────────────────────────────────────── */
    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r},${g},${b}`;
    }

    /* ── Arrancar ────────────────────────────────────────── */
    init();
})();
