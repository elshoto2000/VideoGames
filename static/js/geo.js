// geo.js — Geometry Dash style, 3 niveles
(function () {
    const container = document.querySelector('.canvas-placeholder');
    if (!container) return;

    // ── Canvas ──────────────────────────────────────────────────
    let canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        container.prepend(canvas);
    }
    const ctx = canvas.getContext('2d');

    const W = 480, H = 320;
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = '100%';
    canvas.style.height = 'auto';

    // ── Usuario ─────────────────────────────────────────────────
    const userEl = document.getElementById('display-user');
    const USER   = (userEl ? userEl.innerText : 'Player').trim();

    // ── Constantes físicas ──────────────────────────────────────
    const SUELO    = H - 60;
    const GRAVEDAD = 0.7;
    const SALTO_V  = -13;
    const CUBE_SZ  = 36;

    // ── Niveles: definición de obstáculos y colores ─────────────
    // Cada nivel tiene: bgColor, groundColor, cubeColor, accentColor,
    // velocidad, lista de segmentos [{tipo, x, ancho, alto, color?}]
    // tipo: 'spike' | 'block' | 'gap' | 'double'
    const NIVELES = [
        {
            nombre:      'Nivel 1 — Stereo Madness',
            bgTop:       '#0a0a1a',
            bgBot:       '#0d0d2b',
            groundColor: '#1a1a4a',
            lineColor:   '#2a2a6a',
            cubeColor:   '#4fc3f7',
            trailColor:  '#00e5ff',
            velocidad:   4.5,
            longitud:    4000,
            obstaculos: generarNivel1()
        },
        {
            nombre:      'Nivel 2 — Back On Track',
            bgTop:       '#0a1a0a',
            bgBot:       '#0d2b0d',
            groundColor: '#1a3a1a',
            lineColor:   '#2a5a2a',
            cubeColor:   '#a5d6a7',
            trailColor:  '#69f0ae',
            velocidad:   5.5,
            longitud:    5000,
            obstaculos: generarNivel2()
        },
        {
            nombre:      'Nivel 3 — Polargeist',
            bgTop:       '#1a0a0a',
            bgBot:       '#2b0d0d',
            groundColor: '#3a1a1a',
            lineColor:   '#5a2a2a',
            cubeColor:   '#ef9a9a',
            trailColor:  '#ff5252',
            velocidad:   6.5,
            longitud:    6000,
            obstaculos: generarNivel3()
        }
    ];

    function generarNivel1() {
        // Progresión suave: spikes simples y bloques bajos
        return [
            {tipo:'spike', x:700,  h:40},
            {tipo:'spike', x:900,  h:40},
            {tipo:'spike', x:950,  h:40},
            {tipo:'block', x:1200, h:60, ancho:60},
            {tipo:'spike', x:1400, h:40},
            {tipo:'spike', x:1450, h:40},
            {tipo:'spike', x:1500, h:40},
            {tipo:'block', x:1700, h:80, ancho:80},
            {tipo:'spike', x:2000, h:40},
            {tipo:'spike', x:2100, h:40},
            {tipo:'block', x:2300, h:60, ancho:60},
            {tipo:'double',x:2600, h:40},
            {tipo:'spike', x:2900, h:40},
            {tipo:'block', x:3100, h:80, ancho:100},
            {tipo:'spike', x:3400, h:40},
            {tipo:'spike', x:3450, h:40},
            {tipo:'spike', x:3500, h:40},
            {tipo:'spike', x:3550, h:40},
        ];
    }
    function generarNivel2() {
        return [
            {tipo:'spike', x:600,  h:40},
            {tipo:'double',x:800,  h:40},
            {tipo:'block', x:1000, h:80, ancho:80},
            {tipo:'spike', x:1200, h:50},
            {tipo:'spike', x:1250, h:50},
            {tipo:'spike', x:1300, h:50},
            {tipo:'block', x:1500, h:100, ancho:60},
            {tipo:'double',x:1800, h:50},
            {tipo:'double',x:1860, h:50},
            {tipo:'spike', x:2100, h:50},
            {tipo:'block', x:2300, h:80,  ancho:120},
            {tipo:'spike', x:2600, h:50},
            {tipo:'spike', x:2650, h:50},
            {tipo:'double',x:2900, h:50},
            {tipo:'spike', x:3100, h:50},
            {tipo:'spike', x:3150, h:50},
            {tipo:'spike', x:3200, h:50},
            {tipo:'block', x:3500, h:100, ancho:80},
            {tipo:'double',x:3800, h:50},
            {tipo:'spike', x:4100, h:50},
            {tipo:'spike', x:4150, h:50},
            {tipo:'spike', x:4200, h:50},
            {tipo:'spike', x:4250, h:50},
        ];
    }
    function generarNivel3() {
        return [
            {tipo:'spike', x:500,  h:50},
            {tipo:'spike', x:550,  h:50},
            {tipo:'double',x:700,  h:50},
            {tipo:'double',x:760,  h:50},
            {tipo:'block', x:900,  h:100, ancho:80},
            {tipo:'spike', x:1100, h:55},
            {tipo:'spike', x:1150, h:55},
            {tipo:'spike', x:1200, h:55},
            {tipo:'double',x:1400, h:55},
            {tipo:'double',x:1460, h:55},
            {tipo:'double',x:1520, h:55},
            {tipo:'block', x:1700, h:110, ancho:100},
            {tipo:'spike', x:2000, h:55},
            {tipo:'spike', x:2055, h:55},
            {tipo:'spike', x:2110, h:55},
            {tipo:'spike', x:2165, h:55},
            {tipo:'block', x:2400, h:100, ancho:60},
            {tipo:'double',x:2600, h:55},
            {tipo:'double',x:2660, h:55},
            {tipo:'spike', x:2900, h:55},
            {tipo:'spike', x:2955, h:55},
            {tipo:'spike', x:3010, h:55},
            {tipo:'block', x:3200, h:120, ancho:80},
            {tipo:'double',x:3500, h:55},
            {tipo:'double',x:3560, h:55},
            {tipo:'double',x:3620, h:55},
            {tipo:'spike', x:3900, h:55},
            {tipo:'spike', x:3955, h:55},
            {tipo:'spike', x:4010, h:55},
            {tipo:'spike', x:4065, h:55},
            {tipo:'spike', x:4120, h:55},
            {tipo:'block', x:4400, h:120, ancho:120},
            {tipo:'double',x:4700, h:55},
            {tipo:'double',x:4760, h:55},
            {tipo:'spike', x:5000, h:55},
            {tipo:'spike', x:5055, h:55},
            {tipo:'spike', x:5110, h:55},
            {tipo:'spike', x:5165, h:55},
            {tipo:'spike', x:5220, h:55},
        ];
    }

    // ── Estado ──────────────────────────────────────────────────
    let nivelIdx = 0, gameState = 'select'; // select | playing | dead | win | complete
    let cubeY, cubeVY, enSuelo, camX, intentos, tiempoInicio;
    let trail = [];
    let particulas = [];
    let bgPulse = 0;
    let rafId = null;
    let nivelCompletado = [false, false, false];

    // ── Input ───────────────────────────────────────────────────
    let saltar = false;
    function doJump() {
        if (!enSuelo) return;
        cubeVY  = SALTO_V;
        enSuelo = false;
        spawnParticulasSalto();
    }

    document.addEventListener('keydown', e => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (gameState === 'playing') doJump();
            else if (gameState === 'dead')    resetNivel();
            else if (gameState === 'select')  iniciarNivel();
        }
    });
    canvas.addEventListener('click', () => {
        if (gameState === 'playing')     doJump();
        else if (gameState === 'dead')   resetNivel();
        else if (gameState === 'select') iniciarNivel();
    });
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        if (gameState === 'playing')     doJump();
        else if (gameState === 'dead')   resetNivel();
        else if (gameState === 'select') iniciarNivel();
    }, {passive: false});

    // ── Partículas ──────────────────────────────────────────────
    function spawnParticulasSalto() {
        const nv = NIVELES[nivelIdx];
        for (let i = 0; i < 8; i++) {
            particulas.push({
                x: 60 + CUBE_SZ / 2, y: SUELO,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4 - 1,
                vida: 1,
                color: nv.trailColor
            });
        }
    }
    function spawnParticulasMuerte(cx, cy) {
        const nv = NIVELES[nivelIdx];
        for (let i = 0; i < 20; i++) {
            const ang = (Math.PI * 2 * i) / 20;
            particulas.push({
                x: cx, y: cy,
                vx: Math.cos(ang) * (2 + Math.random() * 4),
                vy: Math.sin(ang) * (2 + Math.random() * 4),
                vida: 1,
                color: nv.trailColor
            });
        }
    }

    // ── Inicializar nivel ───────────────────────────────────────
    function iniciarNivel() {
        cubeY    = SUELO - CUBE_SZ;
        cubeVY   = 0;
        enSuelo  = true;
        camX     = 0;
        intentos = (intentos || 0);
        trail    = [];
        particulas = [];
        bgPulse  = 0;
        tiempoInicio = Date.now();
        gameState = 'playing';
    }
    function resetNivel() {
        intentos++;
        iniciarNivel();
    }

    // ── Obtener obstáculos del nivel actual ─────────────────────
    function getObstaculos() {
        return NIVELES[nivelIdx].obstaculos;
    }

    // ── Colisión ────────────────────────────────────────────────
    function checkColision() {
        const cx = 60, cy = cubeY;
        const obs = getObstaculos();
        for (const o of obs) {
            const ox = o.x - camX;
            if (ox + (o.ancho || 50) < 0 || ox > cx + CUBE_SZ + 20) continue;

            if (o.tipo === 'spike') {
                // Triángulo: AABB simplificado en el centro del spike
                const sx = ox + 4, sw = (o.ancho || 44) - 8;
                if (cx + CUBE_SZ - 4 > sx && cx + 4 < sx + sw) {
                    if (cy + CUBE_SZ > SUELO - o.h + 8) return true;
                }
            } else if (o.tipo === 'block') {
                const bx = ox, bw = o.ancho || 60, bh = o.h || 60;
                if (cx + CUBE_SZ - 2 > bx && cx + 2 < bx + bw) {
                    if (cy + CUBE_SZ > SUELO - bh && cy < SUELO) return true;
                }
            } else if (o.tipo === 'double') {
                // Dos spikes juntos
                for (let d = 0; d < 2; d++) {
                    const dox = ox + d * 46;
                    if (cx + CUBE_SZ - 4 > dox + 4 && cx + 4 < dox + 42) {
                        if (cy + CUBE_SZ > SUELO - o.h + 8) return true;
                    }
                }
            }
        }
        return false;
    }

    // ── Progreso del nivel ──────────────────────────────────────
    function getProgreso() {
        return Math.min(1, camX / NIVELES[nivelIdx].longitud);
    }

    // ── Update ──────────────────────────────────────────────────
    function update() {
        if (gameState !== 'playing') return;
        const nv  = NIVELES[nivelIdx];
        bgPulse  += 0.04;

        camX     += nv.velocidad;
        cubeVY   += GRAVEDAD;
        cubeY    += cubeVY;

        if (cubeY >= SUELO - CUBE_SZ) {
            cubeY   = SUELO - CUBE_SZ;
            cubeVY  = 0;
            enSuelo = true;
        } else {
            enSuelo = false;
        }

        // Trail
        trail.push({ x: 60 + CUBE_SZ / 2, y: cubeY + CUBE_SZ / 2, alfa: 1 });
        if (trail.length > 18) trail.shift();
        trail.forEach(t => t.alfa -= 0.055);

        // Partículas
        particulas.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.2;
            p.vida -= 0.04;
        });
        particulas = particulas.filter(p => p.vida > 0);

        // Colisión
        if (checkColision()) {
            spawnParticulasMuerte(60 + CUBE_SZ / 2, cubeY + CUBE_SZ / 2);
            gameState = 'dead';
            return;
        }

        // Fin del nivel
        if (camX >= nv.longitud) {
            gameState = 'win';
            nivelCompletado[nivelIdx] = true;
            const puntaje = (nivelIdx + 1) * 100 + Math.max(0, 300 - intentos * 10);
            guardarPuntaje(puntaje);
        }
    }

    // ── Guardar puntaje ─────────────────────────────────────────
    function guardarPuntaje(pts) {
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre: USER, puntos: pts, juego: 'geo' })
        }).then(() => {
            if (typeof window.cargarRanking === 'function') window.cargarRanking();
        });
    }

    // ── Draw ────────────────────────────────────────────────────
    function draw() {
        const nv = NIVELES[nivelIdx];

        // Fondo degradado animado
        const pulse = Math.sin(bgPulse) * 0.03 + 0.12;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, nv.bgTop);
        grad.addColorStop(1, nv.bgBot);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Líneas de fondo (paralaje)
        ctx.strokeStyle = nv.lineColor;
        ctx.lineWidth   = 1;
        ctx.globalAlpha = 0.4;
        const lineOffset = (camX * 0.3) % 80;
        for (let x = -lineOffset; x < W; x += 80) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SUELO); ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Barra de progreso
        const prog = getProgreso();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(0, 0, W, 6);
        const gp = ctx.createLinearGradient(0, 0, W * prog, 0);
        gp.addColorStop(0, nv.trailColor);
        gp.addColorStop(1, nv.cubeColor);
        ctx.fillStyle = gp;
        ctx.fillRect(0, 0, W * prog, 6);

        // Suelo
        ctx.fillStyle = nv.groundColor;
        ctx.fillRect(0, SUELO, W, H - SUELO);
        ctx.fillStyle = nv.lineColor;
        ctx.fillRect(0, SUELO, W, 2);

        // Obstáculos
        drawObstaculos(nv);

        // Trail del cubo
        trail.forEach((t, i) => {
            const s = (i / trail.length) * CUBE_SZ * 0.6;
            ctx.globalAlpha = t.alfa * 0.5;
            ctx.fillStyle   = nv.trailColor;
            ctx.fillRect(t.x - s / 2, t.y - s / 2, s, s);
        });
        ctx.globalAlpha = 1;

        // Partículas
        particulas.forEach(p => {
            ctx.globalAlpha = p.vida;
            ctx.fillStyle   = p.color;
            ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        ctx.globalAlpha = 1;

        // Cubo
        if (gameState !== 'dead') {
            drawCubo(nv);
        }

        // UI: intentos y %
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px "Syne Mono", monospace';
        ctx.fillText(`Intentos: ${intentos || 0}`, 10, 22);
        ctx.fillText(`${Math.round(prog * 100)}%`, W - 40, 22);

        // Overlay de estados
        if (gameState === 'dead') drawOverlayMuerte(nv);
        if (gameState === 'win')  drawOverlayWin(nv);
        if (gameState === 'complete') drawOverlayComplete(nv);
    }

    function drawCubo(nv) {
        const x = 60, y = cubeY;
        const rot = (camX / 30) % (Math.PI * 2);

        ctx.save();
        ctx.translate(x + CUBE_SZ / 2, y + CUBE_SZ / 2);
        ctx.rotate(rot);

        // Sombra
        ctx.shadowBlur  = 20;
        ctx.shadowColor = nv.trailColor;

        // Cuerpo
        ctx.fillStyle = nv.cubeColor;
        ctx.fillRect(-CUBE_SZ / 2, -CUBE_SZ / 2, CUBE_SZ, CUBE_SZ);

        // Borde interior
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth   = 2;
        ctx.strokeRect(-CUBE_SZ / 2 + 4, -CUBE_SZ / 2 + 4, CUBE_SZ - 8, CUBE_SZ - 8);

        // Cruz interior
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(-CUBE_SZ / 2 + 4, 0); ctx.lineTo(CUBE_SZ / 2 - 4, 0);
        ctx.moveTo(0, -CUBE_SZ / 2 + 4); ctx.lineTo(0, CUBE_SZ / 2 - 4);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    function drawObstaculos(nv) {
        const obs = getObstaculos();
        for (const o of obs) {
            const ox = o.x - camX;
            if (ox > W + 60 || ox + (o.ancho || 50) < -60) continue;

            if (o.tipo === 'spike') {
                drawSpike(ox, o.h, nv);
            } else if (o.tipo === 'block') {
                drawBlock(ox, o.h, o.ancho || 60, nv);
            } else if (o.tipo === 'double') {
                drawSpike(ox, o.h, nv);
                drawSpike(ox + 46, o.h, nv);
            }
        }
    }

    function drawSpike(ox, h, nv) {
        ctx.beginPath();
        ctx.moveTo(ox + 2, SUELO);
        ctx.lineTo(ox + 44, SUELO);
        ctx.lineTo(ox + 23, SUELO - h);
        ctx.closePath();
        const sg = ctx.createLinearGradient(ox, SUELO - h, ox, SUELO);
        sg.addColorStop(0, nv.cubeColor);
        sg.addColorStop(1, nv.groundColor);
        ctx.fillStyle   = sg;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = nv.trailColor;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function drawBlock(ox, h, ancho, nv) {
        const bg = ctx.createLinearGradient(ox, SUELO - h, ox, SUELO);
        bg.addColorStop(0, nv.cubeColor);
        bg.addColorStop(1, nv.groundColor);
        ctx.fillStyle   = bg;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = nv.trailColor;
        ctx.fillRect(ox, SUELO - h, ancho, h);
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth   = 1;
        ctx.strokeRect(ox, SUELO - h, ancho, h);
    }

    function drawOverlayMuerte(nv) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = nv.trailColor;
        ctx.font = 'bold 28px "Syne", sans-serif';
        ctx.fillText('¡MORISTE!', W / 2, H / 2 - 30);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '13px "DM Sans", sans-serif';
        ctx.fillText('Click o Espacio para reintentar', W / 2, H / 2 + 5);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '11px "Syne Mono", monospace';
        ctx.fillText(`Intentos: ${intentos + 1}`, W / 2, H / 2 + 28);
        ctx.textAlign = 'left';
    }

    function drawOverlayWin(nv) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = nv.trailColor;
        ctx.font = 'bold 26px "Syne", sans-serif';
        ctx.fillText('¡NIVEL COMPLETADO!', W / 2, H / 2 - 45);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '13px "DM Sans", sans-serif';
        ctx.fillText(`${nv.nombre}`, W / 2, H / 2 - 18);

        if (nivelIdx < 2) {
            // Botón siguiente nivel
            const bx = W / 2 - 90, by = H / 2 + 10, bw = 180, bh = 40;
            ctx.fillStyle   = nv.trailColor;
            ctx.shadowBlur  = 15;
            ctx.shadowColor = nv.trailColor;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 8);
            ctx.fill();
            ctx.shadowBlur  = 0;
            ctx.fillStyle   = '#0a0a14';
            ctx.font        = 'bold 14px "Syne", sans-serif';
            ctx.fillText('Siguiente nivel →', W / 2, by + 25);
        } else {
            ctx.fillStyle = '#ffd54f';
            ctx.font = 'bold 16px "Syne", sans-serif';
            ctx.fillText('🏆 ¡COMPLETASTE TODOS LOS NIVELES!', W / 2, H / 2 + 20);
        }
        ctx.textAlign = 'left';

        // Click handler para avanzar
        canvas.onclick = (e) => {
            if (gameState !== 'win') return;
            const r = canvas.getBoundingClientRect();
            const mx = (e.clientX - r.left) * (W / r.width);
            const my = (e.clientY - r.top)  * (H / r.height);
            const bx = W / 2 - 90, by = H / 2 + 10, bw = 180, bh = 40;
            if (nivelIdx < 2 && mx > bx && mx < bx + bw && my > by && my < by + bh) {
                nivelIdx++;
                intentos = 0;
                canvas.onclick = clickHandler;
                iniciarNivel();
            } else if (nivelIdx >= 2) {
                gameState = 'complete';
            }
        };
    }

    function drawOverlayComplete() {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign  = 'center';
        ctx.fillStyle  = '#ffd54f';
        ctx.font       = 'bold 28px "Syne", sans-serif';
        ctx.fillText('🏆 MAESTRO DEL CUBO', W / 2, H / 2 - 30);
        ctx.fillStyle  = 'rgba(255,255,255,0.65)';
        ctx.font       = '13px "DM Sans", sans-serif';
        ctx.fillText('Completaste los 3 niveles', W / 2, H / 2 + 5);
        ctx.fillStyle  = 'rgba(255,255,255,0.35)';
        ctx.font       = '11px "Syne Mono", monospace';
        ctx.fillText('Recarga para jugar de nuevo', W / 2, H / 2 + 28);
        ctx.textAlign  = 'left';
    }

    // ── Pantalla de selección de nivel ──────────────────────────
    function drawSelect() {
        // Fondo
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#080810');
        grad.addColorStop(1, '#0d0d1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font      = 'bold 22px "Syne", sans-serif';
        ctx.fillText('GEO DASH', W / 2, 55);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font      = '12px "DM Sans", sans-serif';
        ctx.fillText('Selecciona un nivel', W / 2, 78);

        NIVELES.forEach((nv, i) => {
            const bx = W / 2 - 130, by = 105 + i * 68, bw = 260, bh = 54;
            const completado = nivelCompletado[i];

            // Fondo del botón
            ctx.fillStyle   = completado ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = nv.trailColor + (completado ? 'cc' : '55');
            ctx.lineWidth   = completado ? 1.5 : 1;
            ctx.shadowBlur  = completado ? 12 : 0;
            ctx.shadowColor = nv.trailColor;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 10);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Cuadrito de color del nivel
            ctx.fillStyle = nv.cubeColor;
            ctx.fillRect(bx + 14, by + 14, 26, 26);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx + 14, by + 14, 26, 26);

            // Nombre
            ctx.textAlign = 'left';
            ctx.fillStyle  = 'rgba(255,255,255,0.9)';
            ctx.font       = 'bold 13px "Syne", sans-serif';
            ctx.fillText(nv.nombre, bx + 52, by + 24);
            ctx.fillStyle  = 'rgba(255,255,255,0.4)';
            ctx.font       = '11px "DM Sans", sans-serif';
            ctx.fillText(`Vel: ${nv.velocidad}  |  ${completado ? '✓ Completado' : 'Bloqueado hasta que lo intentes'}`, bx + 52, by + 40);

            if (completado) {
                ctx.textAlign  = 'right';
                ctx.fillStyle  = nv.trailColor;
                ctx.font       = '13px "Syne Mono", monospace';
                ctx.fillText('✓', bx + bw - 14, by + 30);
            }
        });

        ctx.textAlign  = 'center';
        ctx.fillStyle  = 'rgba(255,255,255,0.25)';
        ctx.font       = '11px "DM Sans", sans-serif';
        ctx.fillText('Click en el nivel para jugar', W / 2, H - 20);
    }

    // ── Click handler principal ─────────────────────────────────
    const clickHandler = (e) => {
        const r  = canvas.getBoundingClientRect();
        const mx = (e.clientX - r.left) * (W / r.width);
        const my = (e.clientY - r.top)  * (H / r.height);

        if (gameState === 'select') {
            NIVELES.forEach((nv, i) => {
                const bx = W / 2 - 130, by = 105 + i * 68, bw = 260, bh = 54;
                if (mx > bx && mx < bx + bw && my > by && my < by + bh) {
                    nivelIdx = i;
                    intentos = 0;
                    iniciarNivel();
                }
            });
        } else if (gameState === 'playing') {
            doJump();
        } else if (gameState === 'dead') {
            resetNivel();
        } else if (gameState === 'complete') {
            gameState = 'select';
        }
    };
    canvas.onclick = clickHandler;

    // Touch en pantalla de selección
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const t = e.changedTouches[0];
        const r  = canvas.getBoundingClientRect();
        const mx = (t.clientX - r.left) * (W / r.width);
        const my = (t.clientY - r.top)  * (H / r.height);

        if (gameState === 'select') {
            NIVELES.forEach((nv, i) => {
                const bx = W / 2 - 130, by = 105 + i * 68, bw = 260, bh = 54;
                if (mx > bx && mx < bx + bw && my > by && my < by + bh) {
                    nivelIdx = i;
                    intentos = 0;
                    iniciarNivel();
                }
            });
        } else if (gameState === 'playing') {
            doJump();
        } else if (gameState === 'dead') {
            resetNivel();
        }
    }, {passive: false});

    // ── Game loop ───────────────────────────────────────────────
    function loop() {
        update();
        if (gameState === 'select') {
            drawSelect();
        } else {
            draw();
        }
        rafId = requestAnimationFrame(loop);
    }

    // Limpiar loop si se recarga el juego
    const scriptEl = document.getElementById('script-del-juego');
    if (scriptEl) scriptEl.addEventListener('remove', () => cancelAnimationFrame(rafId));

    // Ocultar game-over screen del HTML (geo lo maneja internamente)
    const govScr = document.getElementById('game-over-screen');
    if (govScr) govScr.style.display = 'none';

    loop();
})();
