// static/js/geo.js
// Geometry Dash style — runner con salto y obstáculos

(function() {
    const container = document.querySelector('.canvas-placeholder') || document.getElementById('simon-game-container');
    if (!container) return;

    // Ocultar game-over previo
    const goScreen = document.getElementById('game-over-screen');
    if (goScreen) goScreen.style.display = 'none';

    // ── Canvas ──────────────────────────────────────
    let canvas = container.querySelector('canvas#geo-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'geo-canvas';
        canvas.style.cssText = 'display:block; width:100%; height:auto; border-radius:10px;';
        container.innerHTML = '';
        container.appendChild(canvas);
    }

    const W = 480, H = 300;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // ── Estilos inject ───────────────────────────────
    const st = document.createElement('style');
    st.innerHTML = `
        #geo-hud { display:flex; justify-content:space-between; align-items:center; padding:6px 4px; color:#fff; font-family:var(--font-mono,monospace); font-size:0.85rem; }
        #geo-hud .geo-pts { color:var(--accent,#7c6aff); font-weight:700; font-size:1rem; }
        #geo-controls { display:flex; gap:10px; justify-content:center; margin-top:8px; flex-wrap:wrap; }
        .geo-btn { background:var(--bg-raised,#222); color:#fff; border:1px solid var(--border-md,#444); padding:8px 22px; border-radius:8px; cursor:pointer; font-family:var(--font-body,sans-serif); font-size:0.85rem; font-weight:600; transition:all 0.15s; }
        .geo-btn:hover { background:var(--accent,#7c6aff); border-color:var(--accent,#7c6aff); }
        #geo-jump-btn { background:var(--accent,#7c6aff); border-color:var(--accent,#7c6aff); font-size:1.1rem; padding:10px 28px; }
        #geo-jump-btn:active { transform:scale(0.95); }
        @media(min-width:769px){ #geo-jump-btn{ display:none; } }
    `;
    document.head.appendChild(st);

    // ── HUD + controles ──────────────────────────────
    const hud = document.createElement('div');
    hud.id = 'geo-hud';
    hud.innerHTML = `<span>GEO DASH</span><span>Puntos: <span class="geo-pts" id="geo-score">0</span></span><span id="geo-level-label">Nivel 1</span>`;

    const controls = document.createElement('div');
    controls.id = 'geo-controls';
    controls.innerHTML = `
        <button class="geo-btn" id="geo-start-btn">▶ INICIAR</button>
        <button class="geo-btn" id="geo-jump-btn">⬆ SALTAR</button>
    `;

    container.insertBefore(hud, canvas);
    container.appendChild(controls);

    const scoreEl    = document.getElementById('geo-score');
    const levelLabel = document.getElementById('geo-level-label');
    const startBtn   = document.getElementById('geo-start-btn');
    const jumpBtn    = document.getElementById('geo-jump-btn');

    // ── Estado del juego ────────────────────────────
    const GROUND = H - 50;
    const PLAYER_SIZE = 30;
    const GRAVITY = 0.55;
    const JUMP_FORCE = -11;

    let gameRunning = false;
    let animId = null;

    let player, obstacles, bgStars, score, speed, frameCount, nivel;

    function initState() {
        player = {
            x: 60, y: GROUND - PLAYER_SIZE,
            vy: 0, onGround: true,
            angle: 0, color: '#7c6aff'
        };
        obstacles   = [];
        bgStars     = Array.from({length: 40}, () => ({
            x: Math.random() * W,
            y: Math.random() * (GROUND - 20),
            r: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.5 + 0.3
        }));
        score      = 0;
        speed      = 4.5;
        frameCount = 0;
        nivel      = 1;
        scoreEl.textContent = '0';
        levelLabel.textContent = 'Nivel 1';
    }

    // ── Spawn obstáculos ─────────────────────────────
    const OBSTACLE_TYPES = ['spike', 'block', 'double'];

    function spawnObstacle() {
        const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
        if (type === 'spike') {
            obstacles.push({ x: W + 20, y: GROUND - 28, w: 28, h: 28, type: 'spike' });
        } else if (type === 'block') {
            const h = 34 + Math.random() * 20;
            obstacles.push({ x: W + 20, y: GROUND - h, w: 32, h, type: 'block' });
        } else {
            // doble spike separado
            obstacles.push({ x: W + 20,  y: GROUND - 28, w: 28, h: 28, type: 'spike' });
            obstacles.push({ x: W + 60,  y: GROUND - 28, w: 28, h: 28, type: 'spike' });
        }
    }

    // ── Salto ────────────────────────────────────────
    function jump() {
        if (!gameRunning) return;
        if (player.onGround) {
            player.vy = JUMP_FORCE;
            player.onGround = false;
        }
    }

    // ── Colisión AABB ────────────────────────────────
    function collides(p, o) {
        const margin = 4;
        return (
            p.x + margin        < o.x + o.w &&
            p.x + PLAYER_SIZE - margin > o.x &&
            p.y + margin        < o.y + o.h &&
            p.y + PLAYER_SIZE - margin > o.y
        );
    }

    // ── Dibujo ───────────────────────────────────────
    const COLORS = { spike: '#e84058', block: '#f5a623', sky: '#0d0221' };

    function draw() {
        // Fondo
        ctx.fillStyle = COLORS.sky;
        ctx.fillRect(0, 0, W, H);

        // Estrellas
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        bgStars.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Suelo
        ctx.fillStyle = '#1a1230';
        ctx.fillRect(0, GROUND, W, H - GROUND);
        ctx.fillStyle = 'rgba(124,106,255,0.4)';
        ctx.fillRect(0, GROUND, W, 3);

        // Jugador (cubo rotante)
        ctx.save();
        ctx.translate(player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2);
        ctx.rotate(player.angle);
        ctx.fillStyle = player.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = player.color;
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.shadowBlur = 0;
        // detalle interior
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(-PLAYER_SIZE/2 + 5, -PLAYER_SIZE/2 + 5, PLAYER_SIZE - 10, PLAYER_SIZE - 10);
        ctx.restore();

        // Obstáculos
        obstacles.forEach(o => {
            if (o.type === 'spike') {
                ctx.fillStyle = COLORS.spike;
                ctx.shadowBlur = 6;
                ctx.shadowColor = COLORS.spike;
                ctx.beginPath();
                ctx.moveTo(o.x, o.y + o.h);
                ctx.lineTo(o.x + o.w / 2, o.y);
                ctx.lineTo(o.x + o.w, o.y + o.h);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = COLORS.block;
                ctx.shadowBlur = 6;
                ctx.shadowColor = COLORS.block;
                ctx.fillRect(o.x, o.y, o.w, o.h);
                ctx.shadowBlur = 0;
                // grid
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.strokeRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
            }
        });

        // HUD canvas: puntos
        if (!gameRunning && score === 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('¡Presiona INICIAR!', W/2, H/2 - 12);
            ctx.font = '14px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText('Tecla ESPACIO / ↑ / clic para saltar', W/2, H/2 + 18);
        }
    }

    // ── Loop ─────────────────────────────────────────
    function loop() {
        if (!gameRunning) return;

        frameCount++;
        score++;
        scoreEl.textContent = score;

        // Aumentar velocidad y nivel
        if (score % 400 === 0) {
            speed = Math.min(speed + 0.6, 12);
            nivel = Math.floor(score / 400) + 1;
            levelLabel.textContent = `Nivel ${nivel}`;
        }

        // Mover estrellas
        bgStars.forEach(s => {
            s.x -= s.speed;
            if (s.x < 0) { s.x = W; s.y = Math.random() * (GROUND - 20); }
        });

        // Física jugador
        player.vy += GRAVITY;
        player.y  += player.vy;

        if (player.y >= GROUND - PLAYER_SIZE) {
            player.y = GROUND - PLAYER_SIZE;
            player.vy = 0;
            player.onGround = true;
        }

        // Rotación cubo en el aire
        if (!player.onGround) {
            player.angle += 0.1;
        } else {
            player.angle = Math.round(player.angle / (Math.PI/2)) * (Math.PI/2);
        }

        // Spawn obstáculos
        const gap = Math.max(55, 90 - nivel * 6);
        if (frameCount % gap === 0) spawnObstacle();

        // Mover obstáculos
        obstacles.forEach(o => { o.x -= speed; });
        obstacles = obstacles.filter(o => o.x + o.w > -10);

        // Colisiones
        for (const o of obstacles) {
            if (collides(player, o)) {
                endGame();
                return;
            }
        }

        draw();
        animId = requestAnimationFrame(loop);
    }

    // ── Fin de partida ───────────────────────────────
    function endGame() {
        gameRunning = false;
        cancelAnimationFrame(animId);
        startBtn.textContent = '▶ REINTENTAR';

        // Guardar puntaje
        const user = window.ARCADE_USER || 'Jugador';
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ juego: 'geo', nombre: user, puntos: score })
        })
        .then(() => { if (typeof window.cargarRanking === 'function') window.cargarRanking(); })
        .catch(err => console.error('Error guardando puntaje geo:', err));

        // Pantalla de game over
        const goPanel = document.getElementById('game-over-screen');
        const goMsg   = document.getElementById('final-score-msg');
        if (goPanel) {
            if (goMsg) goMsg.textContent = `Lograste ${score} puntos en Nivel ${nivel}`;
            goPanel.style.display = 'flex';
        } else {
            // Fallback en canvas
            draw();
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#e84058';
            ctx.font = 'bold 26px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 12; ctx.shadowColor = '#e84058';
            ctx.fillText('¡GAME OVER!', W/2, H/2 - 20);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.fillText(`Puntos: ${score}`, W/2, H/2 + 14);
        }
    }

    // ── Inicio ───────────────────────────────────────
    function startGame() {
        if (goScreen) goScreen.style.display = 'none';
        cancelAnimationFrame(animId);
        initState();
        gameRunning = true;
        startBtn.textContent = '↺ REINICIAR';
        animId = requestAnimationFrame(loop);
    }

    // ── Controles ────────────────────────────────────
    startBtn.addEventListener('click', startGame);
    jumpBtn.addEventListener('click', jump);
    jumpBtn.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });

    window.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            if (!gameRunning) startGame();
            else jump();
        }
    });

    canvas.addEventListener('click', () => {
        if (!gameRunning) startGame();
        else jump();
    });
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        if (!gameRunning) startGame();
        else jump();
    }, { passive: false });

    // Pantalla inicial
    initState();
    draw();

})();
