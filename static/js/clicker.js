(function () {
    'use strict';

    const container = document.querySelector('.canvas-placeholder');
    if (!container) return;

    const userEl = document.getElementById('display-user');
    const USER   = (userEl ? userEl.innerText : 'Jugador').replace('Jugador: ', '').trim();

    /* ── Estado ─────────────────────────────────────────── */
    let clicks = 0, timeLeft = 10, gameActive = false;
    let timerId = null, particles = [], animId = null;
    let combo = 0, lastClickTime = 0, comboText = [];
    let bestScore = +(localStorage.getItem('clicker_hs') || 0);

    /* ── Canvas para partículas ──────────────────────────── */
    let canvas, ctx;

    /* ── Colores por racha ───────────────────────────────── */
    function getColor() {
        if (clicks < 20) return '#4f7cff';
        if (clicks < 40) return '#34c77b';
        if (clicks < 60) return '#e8c97a';
        return '#e8445a';
    }

    /* ── Render de pantalla de juego ─────────────────────── */
    function buildGame() {
        container.innerHTML = `
            <div id="clk-wrap" style="
                position:relative; display:flex; flex-direction:column;
                align-items:center; justify-content:center;
                height:100%; width:100%; overflow:hidden;
                font-family:'DM Sans',sans-serif; color:#eeeef5;
                background:#080810;
            ">
                <!-- Canvas de partículas -->
                <canvas id="clk-canvas" style="position:absolute;inset:0;pointer-events:none;width:100%;height:100%;"></canvas>

                <!-- HUD superior -->
                <div style="position:absolute; top:0; left:0; right:0; padding:14px 18px;
                    display:flex; justify-content:space-between; align-items:center;
                    background:rgba(8,8,16,0.8); border-bottom:1px solid rgba(255,255,255,0.06);">
                    <span style="font-family:'DM Mono',monospace; font-size:0.75rem; color:#5a5a78;">CLICKER HERO</span>
                    <span id="clk-timer" style="font-size:1.1rem; font-weight:700; font-family:'DM Mono',monospace; color:#4f7cff;">10s</span>
                    <span style="font-family:'DM Mono',monospace; font-size:0.75rem; color:#5a5a78;">MÁX ${bestScore}</span>
                </div>

                <!-- Barra de tiempo -->
                <div style="position:absolute; top:50px; left:0; right:0; height:3px; background:rgba(255,255,255,0.06);">
                    <div id="clk-bar" style="height:100%; width:100%; background:#4f7cff; transition:width 1s linear; border-radius:0 2px 2px 0;"></div>
                </div>

                <!-- Contador de clicks -->
                <div id="clk-count" style="
                    font-family:'Syne',sans-serif; font-size:4rem; font-weight:800;
                    line-height:1; margin-bottom:4px; color:#eeeef5;
                    text-shadow: 0 0 30px rgba(79,124,255,0.4);
                    transition: transform 0.05s;
                ">0</div>

                <!-- Label de combo -->
                <div id="clk-combo" style="
                    font-family:'DM Mono',monospace; font-size:0.8rem;
                    color:#5a5a78; margin-bottom:24px; min-height:18px;
                "></div>

                <!-- Botón principal -->
                <div id="clk-btn" style="
                    width: min(150px, 38vw); height: min(150px, 38vw);
                    background: radial-gradient(circle at 35% 35%, #6a94ff, #4f7cff);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; user-select: none;
                    box-shadow: 0 0 0 0 rgba(79,124,255,0.4), 0 8px 32px rgba(79,124,255,0.3);
                    transition: transform 0.06s, box-shadow 0.15s;
                    position: relative;
                    -webkit-tap-highlight-color: transparent;
                ">
                    <span style="font-size:2rem; pointer-events:none;">👆</span>
                    <!-- Brillo interior -->
                    <div style="position:absolute; width:40%; height:40%; border-radius:50%;
                        background:rgba(255,255,255,0.15); top:15%; left:20%; pointer-events:none;"></div>
                </div>

                <div style="margin-top:18px; font-size:0.75rem; color:#3a3a58; font-family:'DM Mono',monospace;">
                    TOCA LO MÁS RÁPIDO QUE PUEDAS
                </div>
            </div>
        `;

        // Canvas de partículas
        canvas = container.querySelector('#clk-canvas');
        ctx    = canvas.getContext('2d');
        resizeCanvas();

        const btn    = container.querySelector('#clk-btn');
        const countEl= container.querySelector('#clk-count');
        const timerEl= container.querySelector('#clk-timer');
        const barEl  = container.querySelector('#clk-bar');
        const comboEl= container.querySelector('#clk-combo');

        function doClick(e) {
            if (!gameActive) return;
            const now = Date.now();
            const dt  = now - lastClickTime;
            lastClickTime = now;

            clicks++;
            combo = dt < 250 ? combo + 1 : 1;

            // Feedback visual en el contador
            countEl.textContent = clicks;
            const color = getColor();
            countEl.style.color = color;
            countEl.style.textShadow = `0 0 40px ${color}66`;
            countEl.style.transform = 'scale(1.12)';
            setTimeout(() => { countEl.style.transform = 'scale(1)'; }, 55);

            // Combo label
            if (combo >= 5) {
                comboEl.textContent = `⚡ x${combo} COMBO`;
                comboEl.style.color = color;
            } else {
                comboEl.textContent = '';
            }

            // Botón press
            btn.style.transform = 'scale(0.88)';
            btn.style.boxShadow = `0 0 0 12px ${color}22, 0 4px 16px ${color}44`;
            btn.style.background = `radial-gradient(circle at 35% 35%, ${color}cc, ${color})`;
            setTimeout(() => {
                btn.style.transform  = 'scale(1)';
                btn.style.boxShadow  = `0 0 0 0 ${color}44, 0 8px 32px ${color}44`;
                btn.style.background = 'radial-gradient(circle at 35% 35%, #6a94ff, #4f7cff)';
            }, 80);

            // Partículas
            const rect = btn.getBoundingClientRect();
            const cr   = canvas.getBoundingClientRect();
            const px   = rect.left + rect.width / 2 - cr.left;
            const py   = rect.top  + rect.height / 2 - cr.top;
            spawnParticles(px, py, color, combo >= 5 ? 8 : 4);

            // Número flotante
            const cx = canvas.width / 2 + (Math.random() - 0.5) * 60;
            const cy = canvas.height * 0.48 - 30;
            comboText.push({ x: cx, y: cy, vy: -2, life: 1, text: '+1', color });
        }

        btn.addEventListener('click', doClick);
        btn.addEventListener('touchstart', e => { e.preventDefault(); doClick(e); }, { passive: false });

        // Iniciar juego
        gameActive   = true;
        clicks       = 0;
        combo        = 0;
        lastClickTime = Date.now();
        timerId      = setInterval(() => {
            timeLeft--;
            if (timerEl) timerEl.textContent = `${timeLeft}s`;
            if (barEl)   barEl.style.width   = `${(timeLeft / 10) * 100}%`;
            if (timeLeft <= 3) {
                if (timerEl) timerEl.style.color = '#e8445a';
                if (barEl)   barEl.style.background = '#e8445a';
            }
            if (timeLeft <= 0) endGame();
        }, 1000);

        animLoop();
    }

    /* ── Partículas ─────────────────────────────────────── */
    function spawnParticles(x, y, color, n = 4) {
        for (let i = 0; i < n; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 1.5 + Math.random() * 3;
            particles.push({
                x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 1,
                life: 1, color, r: 3 + Math.random() * 4
            });
        }
    }

    function resizeCanvas() {
        if (!canvas || !container) return;
        canvas.width  = container.clientWidth;
        canvas.height = container.clientHeight;
    }

    function animLoop() {
        animId = requestAnimationFrame(animLoop);
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Partículas
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle   = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
            ctx.fill();
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.04;
        });

        // Números flotantes
        comboText = comboText.filter(t => t.life > 0);
        comboText.forEach(t => {
            ctx.globalAlpha = t.life;
            ctx.fillStyle   = t.color;
            ctx.font        = 'bold 16px "DM Mono", monospace';
            ctx.textAlign   = 'center';
            ctx.fillText(t.text, t.x, t.y);
            t.y  += t.vy;
            t.life -= 0.025;
        });

        ctx.globalAlpha = 1;
        ctx.textAlign   = 'left';
    }

    /* ── Fin ─────────────────────────────────────────────── */
    function endGame() {
        gameActive = false;
        clearInterval(timerId);
        timeLeft = 10;
        cancelAnimationFrame(animId);

        if (clicks > bestScore) {
            bestScore = clicks;
            localStorage.setItem('clicker_hs', bestScore);
        }

        const medal = clicks >= 80 ? '🥇' : clicks >= 50 ? '🥈' : '🥉';
        const cps   = (clicks / 10).toFixed(1);
        const color = getColor();

        container.innerHTML = `
            <div style="
                display:flex; flex-direction:column; align-items:center; justify-content:center;
                height:100%; width:100%; text-align:center; padding:24px; box-sizing:border-box;
                font-family:'DM Sans',sans-serif; color:#eeeef5; gap:12px;
                background:#080810;
            ">
                <div style="font-size:3rem;">${medal}</div>
                <div style="font-family:'Syne',sans-serif; font-size:1.4rem; font-weight:800; color:${color};">
                    ¡Tiempo!
                </div>
                <div style="font-family:'DM Mono',monospace; font-size:3rem; font-weight:700; color:#eeeef5; line-height:1;">
                    ${clicks}
                </div>
                <div style="font-size:0.82rem; color:#5a5a78;">clicks · ${cps}/seg</div>
                <div style="font-size:0.78rem; color:#3a3a58;">Récord personal: ${bestScore}</div>
                <div style="display:flex; gap:10px; margin-top:12px; width:100%; max-width:260px; flex-direction:column;">
                    <button id="btn-retry-clk" style="
                        padding:12px; background:${color}; color:#080810;
                        border:none; border-radius:10px; font-weight:700;
                        cursor:pointer; font-size:0.9rem; font-family:'DM Sans',sans-serif;
                    ">REINTENTAR</button>
                    <button onclick="window.location.href='/'" style="
                        padding:12px; background:rgba(255,255,255,0.04); color:#5a5a78;
                        border:1px solid rgba(255,255,255,0.07); border-radius:10px;
                        cursor:pointer; font-size:0.85rem; font-family:'DM Sans',sans-serif;
                    ">Salir al menú</button>
                </div>
            </div>
        `;
        document.getElementById('btn-retry-clk').onclick = startGame;

        // Guardar puntaje
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: USER, puntos: clicks, juego: 'clicker' })
        }).then(() => {
            if (typeof window.cargarRanking === 'function') window.cargarRanking();
        });
    }

    /* ── Start ───────────────────────────────────────────── */
    function startGame() {
        timeLeft  = 10;
        particles = [];
        comboText = [];
        buildGame();
    }

    window.addEventListener('resize', resizeCanvas);
    setTimeout(startGame, 150);
})();
