// static/js/geo.js  — Geometry Dash mejorado
(function() {
    const container = document.querySelector('.canvas-placeholder') || document.getElementById('simon-game-container');
    if (!container) return;
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
 
    const goScreen = document.getElementById('game-over-screen');
    if (goScreen) goScreen.style.display = 'none';
 
    // ── Canvas ──────────────────────────────────────
    let canvas = container.querySelector('canvas#geo-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'geo-canvas';
        canvas.style.cssText = 'display:block;width:100%;height:auto;border-radius:12px;cursor:pointer;';
        container.innerHTML = '';
        container.appendChild(canvas);
    }
 
    const W = 500, H = 320;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
 
    // ── Estilos ──────────────────────────────────────
    const st = document.createElement('style');
    st.textContent = `
        #geo-hud { display:flex; justify-content:space-between; align-items:center; padding:8px 2px 6px; color:#fff; font-family:var(--font-mono,monospace); font-size:0.82rem; gap:8px; flex-wrap:wrap; }
        #geo-hud .g-pts { color:var(--accent,#7c6aff); font-weight:800; font-size:1rem; }
        #geo-hud .g-lv  { background:rgba(124,106,255,0.15); border:1px solid rgba(124,106,255,0.3); padding:2px 10px; border-radius:20px; font-size:0.78rem; }
        #geo-controls { display:flex; gap:10px; justify-content:center; margin-top:8px; flex-wrap:wrap; }
        .geo-btn { background:var(--bg-raised,#1e1e2e); color:#fff; border:1px solid var(--border-md,#333); padding:9px 24px; border-radius:8px; cursor:pointer; font-weight:700; font-size:0.85rem; transition:all 0.15s; font-family:var(--font-body,sans-serif); }
        .geo-btn:hover { background:var(--accent,#7c6aff); border-color:var(--accent,#7c6aff); transform:translateY(-1px); }
        #geo-jump-btn { background:var(--accent,#7c6aff); border-color:var(--accent,#7c6aff); padding:10px 30px; font-size:0.9rem; }
        #geo-jump-btn:active { transform:scale(0.95); }
        #geo-main-menu { position:absolute; inset:0; z-index:20; display:flex; align-items:center; justify-content:center; box-sizing:border-box; padding:14px; background:rgba(5,6,18,.72); backdrop-filter:blur(4px); border-radius:12px; }
        .geo-menu-panel { width:min(100%,440px); padding:clamp(14px,4vw,24px); box-sizing:border-box; text-align:center; border:1px solid rgba(255,255,255,.15); border-radius:18px; background:linear-gradient(145deg,rgba(21,18,44,.96),rgba(9,13,28,.96)); box-shadow:0 18px 60px rgba(0,0,0,.48),0 0 35px rgba(124,106,255,.16); }
        .geo-menu-title { margin:0; color:#fff; font:800 clamp(24px,6vw,34px)/1.1 var(--font-display,sans-serif); letter-spacing:.06em; text-shadow:0 0 24px rgba(124,106,255,.55); }
        .geo-menu-subtitle { margin:8px 0 18px; color:rgba(255,255,255,.62); font:500 12px/1.4 var(--font-body,sans-serif); letter-spacing:.08em; text-transform:uppercase; }
        .geo-menu-options { display:grid; grid-template-columns:1fr 1.08fr 1fr; align-items:stretch; gap:8px; }
        .geo-menu-option { min-width:0; min-height:78px; padding:10px 5px; border:1px solid rgba(255,255,255,.14); border-radius:12px; color:#e9e8ff; background:rgba(255,255,255,.055); font:700 clamp(10px,2.8vw,13px)/1.25 var(--font-body,sans-serif); }
        .geo-menu-option small { display:block; margin-top:6px; color:rgba(255,255,255,.46); font:500 9px/1.2 var(--font-body,sans-serif); }
        .geo-menu-option:disabled { opacity:.48; cursor:not-allowed; filter:saturate(.55); }
        .geo-menu-option.geo-play { cursor:pointer; border-color:#8d7cff; color:#fff; background:linear-gradient(145deg,#806bff,#5945d6); box-shadow:0 7px 22px rgba(112,89,255,.32); font-size:clamp(12px,3vw,15px); }
        .geo-menu-option.geo-play:hover { transform:translateY(-2px); filter:brightness(1.12); }
        .geo-menu-option.geo-play:active { transform:scale(.97); }
        #fs-btn { z-index:25; }
        @media(max-width:380px){ #geo-main-menu{padding:8px}.geo-menu-panel{padding:14px 10px}.geo-menu-options{gap:5px}.geo-menu-option{min-height:72px;padding:8px 3px} }
        @media(min-width:769px){ #geo-jump-btn{ display:none; } }
    `;
    document.head.appendChild(st);
 
    // ── HUD ──────────────────────────────────────────
    const hud = document.createElement('div');
    hud.id = 'geo-hud';
    hud.innerHTML = `
        <span>🟦 GEO DASH</span>
        <span>Puntos: <span class="g-pts" id="geo-score">0</span></span>
        <span class="g-lv" id="geo-level-label">Nivel 1</span>
    `;
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
    const menuOverlay = document.createElement('div');
    menuOverlay.id = 'geo-main-menu';
    menuOverlay.innerHTML = `
        <div class="geo-menu-panel" role="dialog" aria-label="Menú principal de Geo Dash">
            <h1 class="geo-menu-title">GEO DASH</h1>
            <p class="geo-menu-subtitle">Salta · esquiva · supera tu récord</p>
            <div class="geo-menu-options">
                <button class="geo-menu-option" type="button" disabled aria-disabled="true" title="Disponible próximamente">
                    🎨 PERSONAJE<small>Bloqueado por ahora</small>
                </button>
                <button class="geo-menu-option geo-play" id="geo-menu-play" type="button">
                    ▶ JUGAR<small>Empezar partida</small>
                </button>
                <button class="geo-menu-option" type="button" disabled aria-disabled="true" title="Disponible próximamente">
                    🧱 CREAR MAPAS<small>Bloqueado por ahora</small>
                </button>
            </div>
        </div>`;
    container.appendChild(menuOverlay);
    const menuPlayBtn = menuOverlay.querySelector('#geo-menu-play');
 
    // ── Constantes ───────────────────────────────────
    const GROUND      = H - 55;
    const P_SIZE      = 28;
    const GRAVITY     = 0.6;
    const JUMP_FORCE  = -12;
    const JUMP2_FORCE = -10;  // doble salto
 
    // Paletas de color por nivel
    const LEVEL_PALETTES = [
        { sky: '#0d0221', ground: '#1a1230', line: '#7c6aff', player: '#7c6aff', glow: '#7c6affaa' },
        { sky: '#02100d', ground: '#0f2018', line: '#00ff88', player: '#00ff88', glow: '#00ff88aa' },
        { sky: '#1a0808', ground: '#2a1010', line: '#ff4466', player: '#ff4466', glow: '#ff4466aa' },
        { sky: '#08101a', ground: '#101828', line: '#00ccff', player: '#00ccff', glow: '#00ccffaa' },
    ];
 
    // ── Estado ───────────────────────────────────────
    let gameRunning = false, animId = null, menuOpen = true;
    let player, obstacles, bgStars, bgPlatforms, particles;
    let score, speed, frameCount, nivel, palette, jumpsLeft;
 
    function initState() {
        palette = LEVEL_PALETTES[0];
        player = {
            x: 70, y: GROUND - P_SIZE,
            vy: 0, onGround: true,
            angle: 0
        };
        obstacles    = [];
        particles    = [];
        bgStars      = Array.from({length: 50}, () => ({
            x: Math.random() * W,
            y: Math.random() * (GROUND - 30),
            r: Math.random() * 1.8 + 0.3,
            sp: Math.random() * 0.4 + 0.15,
            alpha: Math.random() * 0.5 + 0.3
        }));
        bgPlatforms  = Array.from({length: 5}, (_, i) => ({
            x: i * 130 + 80,
            y: 55 + Math.random() * 60,
            w: 60 + Math.random() * 40,
            sp: 0.6 + Math.random() * 0.3,
            alpha: 0.06 + Math.random() * 0.06
        }));
        score = 0; speed = 5; frameCount = 0; nivel = 1; jumpsLeft = 2;
        scoreEl.textContent = '0';
        levelLabel.textContent = 'Nivel 1';
    }
 
    // ── Partículas ───────────────────────────────────
    function spawnParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            particles.push({
                x, y,
                vx: Math.cos(angle) * (2 + Math.random() * 3),
                vy: Math.sin(angle) * (2 + Math.random() * 3) - 1,
                life: 1, color,
                r: 3 + Math.random() * 4
            });
        }
    }
 
    // ── Spawn obstáculos ─────────────────────────────
    function spawnObstacle() {
        const r = Math.random();
        if (r < 0.22) {
            // Spike simple
            obstacles.push({ x: W + 10, y: GROUND - 30, w: 30, h: 30, type: 'spike' });
        } else if (r < 0.39) {
            // Dos pinchos juntos
            for (let i = 0; i < 2; i++) obstacles.push({ x: W + 10 + i * 38, y: GROUND - 30, w: 30, h: 30, type: 'spike' });
        } else if (r < 0.53) {
            // Bloque bajo: cambia el ritmo y exige saltar con precisión
            const h = 27 + Math.random() * 10;
            obstacles.push({ x: W + 10, y: GROUND - h, w: 34, h, type: 'block' });
        } else if (r < 0.66) {
            // Bloque alto
            const h = 42 + Math.random() * 20;
            obstacles.push({ x: W + 10, y: GROUND - h, w: 34, h, type: 'block' });
        } else if (r < 0.78) {
            // Bloque + spike encima
            const bh = 28 + Math.random() * 6;
            obstacles.push({ x: W + 10, y: GROUND - bh, w: 34, h: bh, type: 'block' });
            obstacles.push({ x: W + 13, y: GROUND - bh - 28, w: 28, h: 28, type: 'spike' });
        } else if (r < 0.92) {
            // Sierra giratoria elevada: añade un peligro distinto a los pinchos
            const size = 30 + Math.random() * 6;
            obstacles.push({ x: W + 10, y: GROUND - 54 - Math.random() * 12, w: size, h: size, type: 'saw', angle: 0 });
        } else {
            // Ráfaga de pinchos en niveles avanzados; antes, doble pincho
            if (nivel >= 3) {
                for (let i = 0; i < 3; i++) obstacles.push({ x: W + 10 + i * 35, y: GROUND - 30, w: 30, h: 30, type: 'spike' });
            } else {
                for (let i = 0; i < 2; i++) obstacles.push({ x: W + 10 + i * 38, y: GROUND - 30, w: 30, h: 30, type: 'spike' });
            }
        }
    }
 
    // ── Salto ────────────────────────────────────────
    function jump() {
        if (!gameRunning) return;
        if (jumpsLeft > 0) {
            player.vy = jumpsLeft === 2 ? JUMP_FORCE : JUMP2_FORCE;
            player.onGround = false;
            jumpsLeft--;
            // Partículas al saltar
            spawnParticles(player.x + P_SIZE/2, player.y + P_SIZE, palette.player, 6);
        }
    }
 
    // ── Colisión ─────────────────────────────────────
    function collides(p, o) {
        const m = 5;
        return (
            p.x + m           < o.x + o.w &&
            p.x + P_SIZE - m  > o.x &&
            p.y + m           < o.y + o.h &&
            p.y + P_SIZE - m  > o.y
        );
    }
 
    // ── Dibujo ───────────────────────────────────────
    function draw() {
        // Fondo con gradiente
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, palette.sky);
        grad.addColorStop(1, palette.ground);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
 
        // Estrellas
        bgStars.forEach(s => {
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
 
        // Plataformas BG decorativas
        bgPlatforms.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = palette.line;
            ctx.fillRect(p.x, p.y, p.w, 3);
        });
        ctx.globalAlpha = 1;
 
        // Líneas de velocidad (blur de movimiento)
        if (gameRunning) {
            ctx.globalAlpha = 0.06;
            ctx.fillStyle = palette.line;
            for (let i = 0; i < 5; i++) {
                const lx = (frameCount * speed * 0.8 + i * 120) % W;
                ctx.fillRect(lx, GROUND - 10 - i * 8, 60 + i*10, 1.5);
            }
            ctx.globalAlpha = 1;
        }
 
        // Suelo
        ctx.fillStyle = palette.ground;
        ctx.fillRect(0, GROUND, W, H - GROUND);
        // Línea brillante del suelo
        const groundGrad = ctx.createLinearGradient(0, GROUND, W, GROUND);
        groundGrad.addColorStop(0, 'transparent');
        groundGrad.addColorStop(0.5, palette.line);
        groundGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, GROUND, W, 2);
 
        // Grid del suelo
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < W; gx += 40) {
            ctx.beginPath();
            ctx.moveTo((gx - frameCount * speed * 0.5) % W, GROUND);
            ctx.lineTo((gx - frameCount * speed * 0.5) % W, H);
            ctx.stroke();
        }
 
        // Obstáculos
        obstacles.forEach(o => {
            ctx.save();
            if (o.type === 'saw') {
                const cx = o.x + o.w / 2, cy = o.y + o.h / 2, radius = o.w * 0.43;
                ctx.translate(cx, cy);
                ctx.rotate(o.angle || 0);
                ctx.shadowBlur = 10; ctx.shadowColor = '#ff4466';
                ctx.fillStyle = '#ff4466';
                ctx.beginPath();
                for (let tooth = 0; tooth < 24; tooth++) {
                    const a = tooth * Math.PI / 12;
                    const r = tooth % 2 === 0 ? radius : radius * 0.78;
                    if (tooth === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                ctx.closePath(); ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#22243a'; ctx.beginPath(); ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2;
                for (let spoke = 0; spoke < 4; spoke++) {
                    ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(radius * 0.46, 0); ctx.stroke();
                }
                ctx.fillStyle = '#ffb2bd'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
            } else if (o.type === 'spike') {
                ctx.shadowBlur = 8; ctx.shadowColor = '#ff4466';
                ctx.fillStyle = '#ff4466';
                ctx.beginPath();
                ctx.moveTo(o.x, o.y + o.h);
                ctx.lineTo(o.x + o.w / 2, o.y);
                ctx.lineTo(o.x + o.w, o.y + o.h);
                ctx.closePath();
                ctx.fill();
                // brillo interno
                ctx.fillStyle = 'rgba(255,200,200,0.3)';
                ctx.beginPath();
                ctx.moveTo(o.x + 5, o.y + o.h);
                ctx.lineTo(o.x + o.w / 2, o.y + 6);
                ctx.lineTo(o.x + o.w - 5, o.y + o.h);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.shadowBlur = 8; ctx.shadowColor = '#f5a623';
                ctx.fillStyle = '#f5a623';
                ctx.fillRect(o.x, o.y, o.w, o.h);
                // detalle bloque
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(o.x, o.y, o.w, 4);
                ctx.fillRect(o.x, o.y, 4, o.h);
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.fillRect(o.x + o.w - 4, o.y, 4, o.h);
                ctx.fillRect(o.x, o.y + o.h - 4, o.w, 4);
            }
            ctx.restore();
        });
 
        // Jugador (cubo)
        ctx.save();
        ctx.translate(player.x + P_SIZE/2, player.y + P_SIZE/2);
        ctx.rotate(player.angle);
        // Sombra glow
        ctx.shadowBlur = 20; ctx.shadowColor = palette.glow;
        ctx.fillStyle = palette.player;
        ctx.fillRect(-P_SIZE/2, -P_SIZE/2, P_SIZE, P_SIZE);
        ctx.shadowBlur = 0;
        // detalle: borde interior
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-P_SIZE/2 + 3, -P_SIZE/2 + 3, P_SIZE - 6, P_SIZE - 6);
        // x en el cubo
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-P_SIZE/2 + 6, -P_SIZE/2 + 6);
        ctx.lineTo(P_SIZE/2 - 6, P_SIZE/2 - 6);
        ctx.moveTo(P_SIZE/2 - 6, -P_SIZE/2 + 6);
        ctx.lineTo(-P_SIZE/2 + 6, P_SIZE/2 - 6);
        ctx.stroke();
        ctx.restore();
 
        // Partículas
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
 
        // Pantalla de inicio
        if (!gameRunning && score === 0 && !menuOpen) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = palette.player;
            ctx.shadowBlur = 20; ctx.shadowColor = palette.glow;
            ctx.font = 'bold 26px var(--font-display, sans-serif)';
            ctx.textAlign = 'center';
            ctx.fillText('GEO DASH', W/2, H/2 - 22);
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '14px sans-serif';
            ctx.fillText('Espacio / ↑ / Clic para saltar', W/2, H/2 + 8);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '12px sans-serif';
            ctx.fillText('Doble salto disponible en el aire', W/2, H/2 + 28);
        }
    }
 
    // ── Game loop ────────────────────────────────────
    function loop() {
        if (!gameRunning) return;
 
        frameCount++;
        score++;
        scoreEl.textContent = score;
 
        // Nivel y paleta
        const newNivel = Math.floor(score / 500) + 1;
        if (newNivel !== nivel) {
            nivel = newNivel;
            speed = Math.min(5 + nivel * 1.2, 14);
            palette = LEVEL_PALETTES[(nivel - 1) % LEVEL_PALETTES.length];
            levelLabel.textContent = `Nivel ${nivel}`;
        }
 
        // Fondo BG
        bgStars.forEach(s => {
            s.x -= s.sp;
            if (s.x < 0) { s.x = W; s.y = Math.random() * (GROUND - 30); s.alpha = Math.random()*0.5+0.3; }
        });
        bgPlatforms.forEach(p => {
            p.x -= p.sp;
            if (p.x + p.w < 0) { p.x = W + 20; p.y = 40 + Math.random() * 70; }
        });
 
        // Física
        player.vy += GRAVITY;
        player.y  += player.vy;
 
        if (player.y >= GROUND - P_SIZE) {
            player.y = GROUND - P_SIZE;
            player.vy = 0;
            player.onGround = true;
            jumpsLeft = 2;
        }
 
        // Rotación
        if (!player.onGround) {
            player.angle += 0.1 + speed * 0.005;
        } else {
            player.angle = Math.round(player.angle / (Math.PI/2)) * (Math.PI/2);
        }
 
        // Spawn
        const gap = Math.max(42, 78 - nivel * 6);
        if (frameCount % gap === 0) spawnObstacle();

        // Mover y limpiar obstáculos
        obstacles.forEach(o => { o.x -= speed; if (o.type === 'saw') o.angle += 0.16; });
        obstacles = obstacles.filter(o => o.x + o.w > -10);
 
        // Partículas trail
        if (frameCount % 3 === 0) {
            particles.push({
                x: player.x + 2, y: player.y + P_SIZE/2 + (Math.random()-0.5)*8,
                vx: -speed * 0.5, vy: (Math.random()-0.5) * 1.5,
                life: 0.7, color: palette.player, r: 3
            });
        }
 
        // Actualizar partículas
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.04; p.r *= 0.96; });
        particles = particles.filter(p => p.life > 0);
 
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
 
    // ── Game over ────────────────────────────────────
    // ── Game over ────────────────────────────────────
    function endGame() {
        gameRunning = false;
        cancelAnimationFrame(animId);
 
        // Explosión de partículas
        spawnParticles(player.x + P_SIZE/2, player.y + P_SIZE/2, palette.player, 20);
        spawnParticles(player.x + P_SIZE/2, player.y + P_SIZE/2, '#ff4466', 10);
        draw(); // un último frame con partículas
 
        startBtn.textContent = '↺ REINTENTAR';
 
        // ENVIAR PUNTAJE ULTRA-SEGURO A FLASK
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                juego: 'geo', 
                puntos: parseInt(score) 
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log('Puntaje de Geo Dash guardado en el servidor:', data);
            // Si la función global existe en la página de rankings, la refresca
            if (typeof window.cargarRankings === 'function') {
                window.cargarRankings();
            }
        })
        .catch(e => console.error('Error guardando puntaje geo:', e));
 
        const goPanel = document.getElementById('game-over-screen');
        const goMsg   = document.getElementById('final-score-msg');
        if (goPanel) {
            if (goMsg) goMsg.textContent = `Lograste ${score} puntos · Nivel ${nivel}`;
            goPanel.style.display = 'flex';
        }
    }
    // ── Inicio ───────────────────────────────────────
    function startGame() {
        if (goScreen) goScreen.style.display = 'none';
        cancelAnimationFrame(animId);
        initState();
        menuOpen = false;
        menuOverlay.style.display = 'none';
        gameRunning = true;
        startBtn.textContent = '↺ REINICIAR';
        animId = requestAnimationFrame(loop);
    }

    // ── Controles ────────────────────────────────────
    menuPlayBtn.addEventListener('click', startGame);
    startBtn.addEventListener('click', startGame);
    jumpBtn.addEventListener('click', jump);
    jumpBtn.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });
 
    window.addEventListener('keydown', e => {
        if ([' ','ArrowUp','w','W'].includes(e.key)) {
            e.preventDefault();
            if (!gameRunning) startGame();
            else jump();
        }
    });
 
    canvas.addEventListener('click', () => { if (!gameRunning) startGame(); else jump(); });
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        if (!gameRunning) startGame(); else jump();
    }, { passive: false });
 
    // Pantalla inicial
    initState();
    draw();
})();
 
