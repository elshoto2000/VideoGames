(function () {
    'use strict';

    const container = document.querySelector('.canvas-placeholder');
    if (!container) return;
    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }

    /* ── Estilos del menú (inyectados una sola vez) ───────── */
    if (!document.getElementById('snk-styles')) {
        const style = document.createElement('style');
        style.id = 'snk-styles';
        style.textContent = `
        .snk-overlay {
            position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            background: rgba(6,6,14,0.82);
            backdrop-filter: blur(3px);
            z-index: 20;
            font-family: "DM Mono", monospace;
        }
        .snk-panel {
            width: min(92%, 340px);
            background: #101018;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 14px;
            padding: 18px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.5);
            color: #eeeef5;
        }
        .snk-title {
            font-size: 15px; letter-spacing: 1px; text-transform: uppercase;
            color: #8888a8; margin: 0 0 14px; text-align: center;
        }
        .snk-btn {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%; padding: 12px; margin-bottom: 10px;
            background: #1b1b28; border: 1px solid rgba(255,255,255,0.08);
            border-radius: 10px; color: #eeeef5; font-family: inherit; font-size: 14px;
            cursor: pointer; transition: background .15s, transform .1s;
        }
        .snk-btn:hover { background: #23233a; }
        .snk-btn:active { transform: scale(0.97); }
        .snk-btn.primary { background: #4f7cff; border-color: #4f7cff; font-weight: 700; }
        .snk-btn.primary:hover { background: #3f6ce8; }
        .snk-btn.selected { border-color: #4f7cff; box-shadow: inset 0 0 0 1.5px #4f7cff; }
        .snk-row { display: flex; gap: 8px; margin-bottom: 10px; }
        .snk-row .snk-btn { margin-bottom: 0; }
        .snk-toggle {
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 12px; background: #1b1b28; border-radius: 10px; margin-bottom: 14px;
            border: 1px solid rgba(255,255,255,0.08);
        }
        .snk-switch {
            width: 40px; height: 22px; border-radius: 999px; background: #33334a;
            position: relative; cursor: pointer; transition: background .15s; flex-shrink: 0;
        }
        .snk-switch.on { background: #4f7cff; }
        .snk-switch::after {
            content: ''; position: absolute; top: 2px; left: 2px;
            width: 18px; height: 18px; border-radius: 50%; background: #fff;
            transition: transform .15s;
        }
        .snk-switch.on::after { transform: translateX(18px); }
        .snk-swatches {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;
        }
        .snk-swatch {
            aspect-ratio: 1; border-radius: 10px; cursor: pointer;
            border: 2px solid transparent; position: relative;
        }
        .snk-swatch.selected { border-color: #fff; }
        .snk-swatch input[type=color] {
            position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
        }
        .snk-custom-swatch {
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 18px;
        }
        .snk-back {
            display: flex; align-items: center; gap: 6px; color: #8888a8;
            cursor: pointer; font-size: 13px; margin-bottom: 12px; user-select: none;
        }
        .snk-back:hover { color: #eeeef5; }
        .snk-score-line { text-align: center; color: #8888a8; font-size: 13px; margin-bottom: 14px; }
        `;
        document.head.appendChild(style);
    }

    /* ── Canvas ─────────────────────────────────────────── */
    let canvas = container.querySelector('canvas');
    if (!canvas) { canvas = document.createElement('canvas'); container.prepend(canvas); }
    const ctx = canvas.getContext('2d');

    /* ── Usuario ────────────────────────────────────────── */
    const userEl = document.getElementById('display-user');
    const USER   = (userEl ? userEl.innerText : 'Jugador').replace('Jugador: ', '').trim();

    /* ── Constantes ─────────────────────────────────────── */
    const COLS = 20, ROWS = 20;
    let CELL = 20;

    /* ── Paleta de colores por skin ─────────────────────── */
    const SKINS = [
        { head: '#4f7cff', body: 'rgba(79,124,255,0.45)', glow: '#4f7cff', name: 'Azul' },
        { head: '#34c77b', body: 'rgba(52,199,123,0.45)', glow: '#34c77b', name: 'Verde' },
        { head: '#ff6b6b', body: 'rgba(255,107,107,0.45)', glow: '#ff6b6b', name: 'Rojo' },
        { head: '#ffd93d', body: 'rgba(255,217,61,0.45)',  glow: '#ffd93d', name: 'Oro' },
        { head: '#c56aff', body: 'rgba(197,106,255,0.45)', glow: '#c56aff', name: 'Púrpura' },
    ];
    let skinIdx = 0;

    /* ── Ajustes / modalidades ──────────────────────────────
       speedMode:    normal | rapido | extremo
       movingFood:   la comida se desplaza sola por el tablero
       customColor:  hex elegido por el usuario, o null (usa el ciclo automático de skins)
    ───────────────────────────────────────────────────────── */
    const SPEED_PRESETS = {
        normal:  { label: 'Normal',  start: 140, min: 60, dec: 2 },
        rapido:  { label: 'Rápido',  start: 105, min: 45, dec: 3 },
        extremo: { label: 'Extremo', start: 80,  min: 32, dec: 4 },
    };

    const DEFAULTS = { speedMode: 'normal', movingFood: false, customColor: null };
    let settings = loadSettings();

    function loadSettings() {
        try {
            const raw = localStorage.getItem('snake_settings');
            if (raw) return Object.assign({}, DEFAULTS, JSON.parse(raw));
        } catch (e) {}
        return Object.assign({}, DEFAULTS);
    }
    function saveSettings() {
        try { localStorage.setItem('snake_settings', JSON.stringify(settings)); } catch (e) {}
    }
    function activeSkin() {
        return settings.customColor ? skinFromHex(settings.customColor) : SKINS[skinIdx];
    }
    function skinFromHex(hex) {
        return { head: hex, body: hexToRgba(hex, 0.45), glow: hex, name: 'Personalizado' };
    }
    function hexToRgba(hex, a) {
        return `rgba(${hexToRgb(hex)},${a})`;
    }

    /* ── Estado ─────────────────────────────────────────── */
    let snake, foods, dx, dy, score, highScore, speed, running, lockInput;
    let applesEaten, particles, flashTimer, speedPreset;
    let gameState = 'menu'; // menu | config | customize | playing | over

    highScore = +(localStorage.getItem('snake_hs') || 0);

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

    /* ═══════════════════════════════════════════════════════
       MENÚ / PANELES
    ═══════════════════════════════════════════════════════ */
    let overlayEl = null;

    function clearOverlay() {
        if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    }

    function renderMenu() {
        clearOverlay();
        gameState = 'menu';
        draw(0);
        overlayEl = document.createElement('div');
        overlayEl.className = 'snk-overlay';
        overlayEl.innerHTML = `
            <div class="snk-panel">
                <p class="snk-title">Snake</p>
                <div class="snk-score-line">Récord: ${highScore}</div>
                <button class="snk-btn primary" data-act="play">▶ Jugar</button>
                <button class="snk-btn" data-act="config">⚙ Configuración</button>
                <button class="snk-btn" data-act="customize">🎨 Personalizar serpiente</button>
            </div>
        `;
        container.appendChild(overlayEl);
        overlayEl.querySelector('[data-act="play"]').onclick = () => startGame();
        overlayEl.querySelector('[data-act="config"]').onclick = () => renderConfig();
        overlayEl.querySelector('[data-act="customize"]').onclick = () => renderCustomize();
    }

    function renderConfig() {
        clearOverlay();
        gameState = 'config';
        overlayEl = document.createElement('div');
        overlayEl.className = 'snk-overlay';

        const speedButtons = Object.entries(SPEED_PRESETS).map(([key, p]) => `
            <button class="snk-btn ${settings.speedMode === key ? 'selected' : ''}" data-speed="${key}" style="flex:1">
                ${p.label}
            </button>
        `).join('');

        overlayEl.innerHTML = `
            <div class="snk-panel">
                <div class="snk-back" data-act="back">← Volver</div>
                <p class="snk-title">Modalidad de juego</p>
                <div class="snk-row">${speedButtons}</div>
                <div class="snk-toggle">
                    <span>Comida en movimiento</span>
                    <div class="snk-switch ${settings.movingFood ? 'on' : ''}" data-act="toggle-food"></div>
                </div>
                <button class="snk-btn primary" data-act="play">▶ Jugar</button>
            </div>
        `;
        container.appendChild(overlayEl);

        overlayEl.querySelectorAll('[data-speed]').forEach(btn => {
            btn.onclick = () => {
                settings.speedMode = btn.getAttribute('data-speed');
                saveSettings();
                renderConfig();
            };
        });
        overlayEl.querySelector('[data-act="toggle-food"]').onclick = () => {
            settings.movingFood = !settings.movingFood;
            saveSettings();
            renderConfig();
        };
        overlayEl.querySelector('[data-act="back"]').onclick = () => renderMenu();
        overlayEl.querySelector('[data-act="play"]').onclick = () => startGame();
    }

    function renderCustomize() {
        clearOverlay();
        gameState = 'customize';
        overlayEl = document.createElement('div');
        overlayEl.className = 'snk-overlay';

        const swatches = SKINS.map((s, i) => `
            <div class="snk-swatch ${!settings.customColor && skinIdx === i ? 'selected' : ''}"
                 data-skin="${i}" style="background:${s.head}"></div>
        `).join('');

        overlayEl.innerHTML = `
            <div class="snk-panel">
                <div class="snk-back" data-act="back">← Volver</div>
                <p class="snk-title">Color de la serpiente</p>
                <div class="snk-swatches">
                    ${swatches}
                    <div class="snk-swatch snk-custom-swatch ${settings.customColor ? 'selected' : ''}"
                         style="background:${settings.customColor || '#33334a'}">
                        🎨
                        <input type="color" id="snk-color-input" value="${settings.customColor || '#4f7cff'}">
                    </div>
                </div>
                <button class="snk-btn primary" data-act="play">▶ Jugar</button>
            </div>
        `;
        container.appendChild(overlayEl);

        overlayEl.querySelectorAll('[data-skin]').forEach(el => {
            el.onclick = () => {
                skinIdx = +el.getAttribute('data-skin');
                settings.customColor = null;
                saveSettings();
                renderCustomize();
            };
        });
        const colorInput = overlayEl.querySelector('#snk-color-input');
        colorInput.oninput = () => {
            settings.customColor = colorInput.value;
            saveSettings();
            renderCustomize();
        };
        overlayEl.querySelector('[data-act="back"]').onclick = () => renderMenu();
        overlayEl.querySelector('[data-act="play"]').onclick = () => startGame();
    }

    function renderGameOver() {
        // Compatibilidad con #game-over-screen si ya existe en la plantilla Flask
        const gos = document.getElementById('game-over-screen');
        const msg = document.getElementById('final-score-msg');
        if (gos) {
            if (msg) msg.innerText = `Puntaje: ${score}  ·  Récord: ${highScore}`;
            const retry = gos.querySelector('.btn-play');
            if (retry) retry.onclick = (e) => { e.preventDefault(); startGame(); };
            setTimeout(() => { gos.style.display = 'flex'; }, 300);
            return;
        }
        // Overlay propio si la plantilla no trae uno
        clearOverlay();
        overlayEl = document.createElement('div');
        overlayEl.className = 'snk-overlay';
        overlayEl.innerHTML = `
            <div class="snk-panel">
                <p class="snk-title">Fin del juego</p>
                <div class="snk-score-line">Puntaje: ${score} · Récord: ${highScore}</div>
                <button class="snk-btn primary" data-act="retry">↻ Reintentar</button>
                <button class="snk-btn" data-act="menu">☰ Menú</button>
            </div>
        `;
        container.appendChild(overlayEl);
        overlayEl.querySelector('[data-act="retry"]').onclick = () => startGame();
        overlayEl.querySelector('[data-act="menu"]').onclick = () => renderMenu();
    }

    /* ═══════════════════════════════════════════════════════
       CICLO DEL JUEGO
    ═══════════════════════════════════════════════════════ */
    function startGame() {
        clearOverlay();
        const gos = document.getElementById('game-over-screen');
        if (gos) gos.style.display = 'none';

        resize();
        speedPreset = SPEED_PRESETS[settings.speedMode] || SPEED_PRESETS.normal;

        snake = [
            { x: 10, y: 10 },
            { x: 9,  y: 10 },
            { x: 8,  y: 10 },
        ];
        foods = [];
        dx = 1; dy = 0;
        score = 0;
        speed = speedPreset.start;
        running = true;
        lockInput = false;
        applesEaten = 0;
        particles = [];
        flashTimer = 0;
        if (!settings.customColor) skinIdx = 0;
        gameState = 'playing';

        for (let i = 0; i < 4; i++) spawnFood();
        lastTick = 0;
        requestAnimationFrame(loop);
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
        f.pulse = 0;
        f.moveIn = 3 + Math.floor(Math.random() * 3); // ticks hasta el próximo movimiento
        foods.push(f);
    }

    function maybeMoveFood(f) {
        if (!settings.movingFood) return;
        f.moveIn--;
        if (f.moveIn > 0) return;
        f.moveIn = 3 + Math.floor(Math.random() * 3);

        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }
        for (const [mx, my] of dirs) {
            const nx = f.x + mx, ny = f.y + my;
            if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
            if (snake.some(s => s.x === nx && s.y === ny)) continue;
            if (foods.some(e => e !== f && e.x === nx && e.y === ny)) continue;
            f.x = nx; f.y = ny;
            break;
        }
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

        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
            snake.some(s => s.x === head.x && s.y === head.y)) {
            return die();
        }

        snake.unshift(head);
        const fi = foods.findIndex(f => f.x === head.x && f.y === head.y);

        if (fi !== -1) {
            score += 10 + Math.floor(applesEaten / 5) * 2;
            applesEaten++;
            speed = Math.max(speedPreset.min, speed - speedPreset.dec);
            flashTimer = 6;
            if (!settings.customColor && applesEaten % 5 === 0) {
                skinIdx = (skinIdx + 1) % SKINS.length;
            }

            const px = (head.x + 0.5) * CELL;
            const py = (head.y + 0.5) * CELL;
            spawnParticles(px, py, activeSkin().glow, 10);

            foods.splice(fi, 1);
            spawnFood();
        } else {
            snake.pop();
        }

        foods.forEach(maybeMoveFood);
        lockInput = false;
    }

    /* ── Die ─────────────────────────────────────────────── */
    function die() {
        running = false;
        gameState = 'over';

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snake_hs', highScore);
        }

        const hx = (snake[0].x + 0.5) * CELL;
        const hy = (snake[0].y + 0.5) * CELL;
        spawnParticles(hx, hy, '#e8445a', 20);

        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: USER, puntos: score, juego: 'snake' })
        }).then(() => {
            if (typeof window.cargarRanking === 'function') window.cargarRanking();
        }).catch(() => {});

        setTimeout(renderGameOver, 300);
    }

    /* ── Draw ─────────────────────────────────────────────── */
    function draw(ts) {
        const W = canvas.width, H = canvas.height;
        const skin = activeSkin();

        ctx.fillStyle = '#080810';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let c = 0; c <= COLS; c++) {
            ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke();
        }
        for (let r = 0; r <= ROWS; r++) {
            ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke();
        }

        if (gameState === 'menu' || gameState === 'config' || gameState === 'customize') {
            drawHUD(W);
            return; // el panel HTML cubre el resto del tablero
        }

        if (flashTimer > 0) {
            ctx.fillStyle = `rgba(${hexToRgb(skin.glow)},${flashTimer / 30})`;
            ctx.fillRect(0, 0, W, H);
            flashTimer--;
        }

        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
            ctx.fill();
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.12;
            p.life -= 0.045;
        });
        ctx.globalAlpha = 1;

        foods.forEach(f => {
            f.pulse = (f.pulse || 0) + 0.08;
            const fp = (Math.sin(f.pulse) * 0.12 + 0.88);
            const fx = (f.x + 0.5) * CELL;
            const fy = (f.y + 0.5) * CELL;
            const fr = (CELL * 0.36) * fp;

            ctx.save();
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#e8445a';
            ctx.fillStyle = '#e8445a';
            ctx.beginPath();
            ctx.arc(fx, fy, fr, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.beginPath();
            ctx.arc(fx - fr * 0.25, fy - fr * 0.25, fr * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        });

        snake.forEach((seg, i) => {
            const px = seg.x * CELL + 1;
            const py = seg.y * CELL + 1;
            const sz = CELL - 2;

            if (i === 0) {
                ctx.save();
                ctx.shadowBlur = 18;
                ctx.shadowColor = skin.glow;
                ctx.fillStyle = skin.head;
                ctx.beginPath();
                ctx.roundRect(px, py, sz, sz, 4);
                ctx.fill();
                ctx.shadowBlur = 0;

                const eyeSize = Math.max(2, sz * 0.14);
                const eyeOff = sz * 0.25;
                ctx.fillStyle = 'rgba(0,0,0,0.8)';
                if (dx === 1)  { ctx.beginPath(); ctx.arc(px+sz-eyeOff, py+eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(px+sz-eyeOff, py+sz-eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); }
                if (dx === -1) { ctx.beginPath(); ctx.arc(px+eyeOff,    py+eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(px+eyeOff,    py+sz-eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); }
                if (dy === 1)  { ctx.beginPath(); ctx.arc(px+eyeOff,    py+sz-eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(px+sz-eyeOff, py+sz-eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); }
                if (dy === -1) { ctx.beginPath(); ctx.arc(px+eyeOff,    py+eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(px+sz-eyeOff, py+eyeOff, eyeSize, 0, Math.PI*2); ctx.fill(); }
                ctx.restore();
            } else {
                const alpha = Math.max(0.12, 1 - (i / snake.length) * 0.85);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = skin.body;
                ctx.beginPath();
                ctx.roundRect(px + 1, py + 1, sz - 2, sz - 2, 3);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });

        drawHUD(W);
    }

    function drawHUD(W) {
        ctx.fillStyle = 'rgba(8,8,16,0.75)';
        ctx.fillRect(0, 0, W, 34);

        ctx.font = `bold ${Math.round(CELL * 0.75)}px "DM Mono", monospace`;
        ctx.fillStyle = '#eeeef5';
        ctx.textAlign = 'left';
        ctx.fillText(`${score || 0}`, 12, 22);

        ctx.fillStyle = '#5a5a78';
        ctx.textAlign = 'center';
        ctx.fillText(`RÉC ${highScore}`, W / 2, 22);

        ctx.fillStyle = '#eeeef5';
        ctx.textAlign = 'right';
        ctx.fillText(USER.slice(0, 12), W - 12, 22);

        ctx.textAlign = 'left';
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
    window.addEventListener('resize', () => {
        resize();
        if (gameState !== 'playing') draw(0);
    });

    /* ── Helpers ─────────────────────────────────────────── */
    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r},${g},${b}`;
    }

    /* ── Arrancar ────────────────────────────────────────── */
    resize();
    renderMenu();
})();
