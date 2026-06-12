/* ═══════════════════════════════════════════════════════
   main-effects.js — Fondo animado de partículas orgánicas
   Reacciona al mouse con líneas elásticas y curvas suaves
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── Canvas setup ─────────────────────────────── */
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = window.innerWidth;
    let H = window.innerHeight;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    /* ── Mouse tracking ───────────────────────────── */
    const mouse = { x: W / 2, y: H / 2 };
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('touchmove', e => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    /* ── Nodos / partículas ───────────────────────── */
    const ACCENT  = { r: 79,  g: 124, b: 255 };   // --accent
    const ACCENT2 = { r: 124, g: 106, b: 255 };   // acento secundario
    const COUNT   = Math.min(80, Math.floor((W * H) / 16000));

    class Nodo {
        constructor() { this.reset(true); }
        reset(inicial = false) {
            this.x  = Math.random() * W;
            this.y  = inicial ? Math.random() * H : (Math.random() < 0.5 ? -10 : H + 10);
            this.vx = (Math.random() - 0.5) * 0.45;
            this.vy = (Math.random() - 0.5) * 0.45;
            this.r  = Math.random() * 1.8 + 0.6;
            this.base = Math.random() * 0.5 + 0.3;  // opacidad base
            this.pulse = Math.random() * Math.PI * 2;
            this.c  = Math.random() < 0.6 ? ACCENT : ACCENT2;
        }

        update() {
            this.pulse += 0.018;

            // Deriva suave hacia el mouse (muy débil, apenas elástica)
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.hypot(dx, dy);
            const force = Math.max(0, 1 - dist / 380);
            this.vx += dx / dist * force * 0.012;
            this.vy += dy / dist * force * 0.012;

            // Fricción
            this.vx *= 0.985;
            this.vy *= 0.985;

            this.x += this.vx;
            this.y += this.vy;

            // Rebote suave en bordes
            if (this.x < 0)  { this.x = 0;  this.vx *= -1; }
            if (this.x > W)  { this.x = W;  this.vx *= -1; }
            if (this.y < 0)  { this.y = 0;  this.vy *= -1; }
            if (this.y > H)  { this.y = H;  this.vy *= -1; }
        }

        draw() {
            const alpha = this.base * (0.7 + Math.sin(this.pulse) * 0.3);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.c.r},${this.c.g},${this.c.b},${alpha})`;
            ctx.fill();
        }
    }

    const nodos = Array.from({ length: COUNT }, () => new Nodo());

    /* ── Dibujar conexiones con curvas suaves ─────── */
    const DIST_MAX = 155;
    const DIST_MOUSE = 190;

    function drawConexiones() {
        for (let i = 0; i < nodos.length; i++) {
            const a = nodos[i];

            // Conexión nodo ↔ mouse
            const dm = Math.hypot(mouse.x - a.x, mouse.y - a.y);
            if (dm < DIST_MOUSE) {
                const t = 1 - dm / DIST_MOUSE;
                const alpha = t * 0.25;
                ctx.beginPath();
                // Curva cuadrática suave hacia el mouse
                const cx = (a.x + mouse.x) / 2 + (a.y - mouse.y) * 0.12;
                const cy = (a.y + mouse.y) / 2 + (mouse.x - a.x) * 0.12;
                ctx.moveTo(a.x, a.y);
                ctx.quadraticCurveTo(cx, cy, mouse.x, mouse.y);
                ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${alpha})`;
                ctx.lineWidth = t * 1.2;
                ctx.stroke();
            }

            // Conexión nodo ↔ nodo
            for (let j = i + 1; j < nodos.length; j++) {
                const b = nodos[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < DIST_MAX) {
                    const t = 1 - d / DIST_MAX;
                    const alpha = t * 0.18;
                    const c = Math.random() < 0.5 ? ACCENT : ACCENT2;
                    ctx.beginPath();
                    // Punto de control suave (curva cuadrática leve)
                    const mx = (a.x + b.x) / 2;
                    const my = (a.y + b.y) / 2;
                    ctx.moveTo(a.x, a.y);
                    ctx.quadraticCurveTo(mx, my, b.x, b.y);
                    ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
                    ctx.lineWidth = t * 0.8;
                    ctx.stroke();
                }
            }
        }
    }

    /* ── Punto brillante en el cursor ────────────── */
    function drawMouseGlow() {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 90);
        grad.addColorStop(0, `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},0.07)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    /* ── Loop principal ───────────────────────────── */
    function loop() {
        ctx.clearRect(0, 0, W, H);

        drawMouseGlow();

        nodos.forEach(n => n.update());
        drawConexiones();
        nodos.forEach(n => n.draw());

        requestAnimationFrame(loop);
    }

    loop();
})();
