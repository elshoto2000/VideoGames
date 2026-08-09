// static/js/tamagochi.js — Tamagotchi para Arcade
// Un solo archivo. El estado real vive en MongoDB (ver endpoints /api/tama/* en app.py).
// El servidor recalcula todo por tiempo transcurrido ("lazy tick"), así la mascota
// sigue viviendo aunque Render free duerma el servicio.

(function () {
    'use strict';

    const contenedor = document.getElementById('simon-game-container');
    if (!contenedor) { console.error('No se encontró #simon-game-container'); return; }
    contenedor.innerHTML = '';

    const goScreen = document.getElementById('game-over-screen');
    if (goScreen) goScreen.style.display = 'none';

    /* ═══════════════════════════════════════════════════════
       CONFIG VISUAL
    ═══════════════════════════════════════════════════════ */
    const ANCHO = 480, ALTO = 380;

    // Catálogo de la tienda: debe coincidir con TIENDA en app.py
    const TIENDA = {
        manzana:   { nombre: 'Manzana',      icono: '🍎', precio: 5,  tipo: 'comida', desc: '+25 hambre' },
        pan:       { nombre: 'Pan',          icono: '🍞', precio: 9,  tipo: 'comida', desc: '+40 hambre' },
        pizza:     { nombre: 'Pizza',        icono: '🍕', precio: 16, tipo: 'comida', desc: '+60 hambre, +8 feliz' },
        pastel:    { nombre: 'Pastel',       icono: '🍰', precio: 24, tipo: 'comida', desc: '+45 hambre, +22 feliz' },
        medicina:  { nombre: 'Medicina',     icono: '💉', precio: 30, tipo: 'medicina', desc: 'Cura la enfermedad' },
        pelota:    { nombre: 'Pelota',       icono: '⚽', precio: 40, tipo: 'juguete', desc: 'Jugar da +50% felicidad' },
        peluche:   { nombre: 'Peluche',      icono: '🧸', precio: 70, tipo: 'juguete', desc: 'Pierde felicidad más lento' },
        gorro:     { nombre: 'Gorro',        icono: '🎩', precio: 55, tipo: 'cosmetico', desc: 'Se lo pone tu mascota' },
        lazo:      { nombre: 'Lazo',         icono: '🎀', precio: 55, tipo: 'cosmetico', desc: 'Se lo pone tu mascota' },
        lampara:   { nombre: 'Lámpara',      icono: '🛋️', precio: 90, tipo: 'cosmetico', desc: 'Decora la habitación' }
    };

    const ETAPA_LABEL = { huevo: 'Huevo', bebe: 'Bebé', nino: 'Niño', adulto: 'Adulto' };

    /* ═══════════════════════════════════════════════════════
       ESTADO LOCAL (espejo del servidor + interpolación suave)
    ═══════════════════════════════════════════════════════ */
    let S = null;              // último estado del servidor
    let sincronizadoEn = 0;    // performance.now() del último sync
    let ocupado = false;       // evita clics dobles
    let anim = 0;              // frame de animación
    let rafId = null;
    let pollId = null;
    let particulas = [];       // corazones, migas, burbujas
    let mensajeFlash = null;
    let vistaTienda = false;

    /* ═══════════════════════════════════════════════════════
       CSS + MARCADO
    ═══════════════════════════════════════════════════════ */
    // El .canvas-placeholder de style.css fuerza aspect-ratio 1/1 + overflow:hidden,
    // que recortaría la tienda y el inventario. Lo neutralizamos solo aquí.
    const marco = contenedor.closest('.canvas-placeholder');
    if (marco) marco.classList.add('tama-host');

    const css = document.createElement('style');
    css.textContent = `
    .canvas-placeholder.tama-host{aspect-ratio:auto !important;max-width:560px !important;
        height:auto !important;overflow:visible !important;background:transparent !important;
        border:none !important;padding:0 !important;display:block !important;}
    .canvas-placeholder.tama-host > div:not(#game-over-screen){height:auto !important;}
    .canvas-placeholder.tama-host canvas{height:auto !important;object-fit:unset !important;}
    .canvas-placeholder.tama-host .fullscreen-btn{display:none !important;}
    .tama-wrap{width:100%;display:flex;flex-direction:column;gap:12px;font-family:var(--font-body),sans-serif;}
    .tama-shell{position:relative;width:100%;max-width:${ANCHO}px;margin:0 auto;
        background:linear-gradient(160deg,#1c1c2c,#101018);border:1px solid var(--border-md,rgba(255,255,255,.1));
        border-radius:20px;padding:10px;box-shadow:0 10px 40px rgba(0,0,0,.5);}
    .tama-canvas{display:block;width:100%;height:auto;border-radius:14px;background:#0b0b14;}
    .tama-hud{display:flex;justify-content:space-between;align-items:center;gap:8px;
        padding:2px 4px 8px;font-family:var(--font-mono),monospace;font-size:.76rem;color:var(--text-2,#a8a8be);}
    .tama-hud b{color:var(--text,#eee);font-family:var(--font-display),sans-serif;font-size:.9rem;}
    .tama-coins{color:var(--gold,#e8b94a);font-weight:600;}
    .tama-badge{padding:2px 8px;border-radius:20px;border:1px solid var(--border-md,rgba(255,255,255,.1));
        background:rgba(255,255,255,.04);font-size:.68rem;}
    .tama-badge.sick{color:#8ce0a0;border-color:rgba(140,224,160,.4);background:rgba(140,224,160,.08);}
    .tama-badge.sleep{color:#8fa8ff;border-color:rgba(143,168,255,.4);background:rgba(143,168,255,.08);}

    .tama-bars{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;}
    @media(max-width:520px){.tama-bars{grid-template-columns:1fr;}}
    .tama-bar{display:flex;align-items:center;gap:8px;}
    .tama-bar span.ic{font-size:.95rem;width:18px;text-align:center;}
    .tama-bar span.lb{font-size:.68rem;color:var(--muted,#5a5a78);font-family:var(--font-mono),monospace;
        width:58px;text-transform:uppercase;letter-spacing:.04em;}
    .tama-bar .track{flex:1;height:9px;border-radius:20px;background:rgba(255,255,255,.07);overflow:hidden;}
    .tama-bar .fill{height:100%;border-radius:20px;transition:width .35s ease,background .35s ease;}
    .tama-bar span.vl{font-size:.68rem;font-family:var(--font-mono),monospace;color:var(--text-2,#a8a8be);width:30px;text-align:right;}

    .tama-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:8px;}
    .tama-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 6px;cursor:pointer;
        background:var(--bg-raised,#14141f);border:1px solid var(--border-md,rgba(255,255,255,.1));
        border-radius:12px;color:var(--text,#eee);font-family:var(--font-body),sans-serif;font-size:.7rem;
        transition:transform .12s,border-color .18s,background .18s;}
    .tama-btn:hover:not(:disabled){transform:translateY(-2px);border-color:var(--accent,#4f7cff);background:var(--bg-hover,#1a1a28);}
    .tama-btn:active:not(:disabled){transform:scale(.95);}
    .tama-btn:disabled{opacity:.35;cursor:not-allowed;}
    .tama-btn i{font-style:normal;font-size:1.15rem;line-height:1;}
    .tama-btn small{font-size:.58rem;color:var(--muted,#5a5a78);font-family:var(--font-mono),monospace;}
    .tama-btn.primary{background:var(--accent,#4f7cff);border-color:var(--accent,#4f7cff);}
    .tama-btn.primary small{color:rgba(255,255,255,.7);}

    .tama-panel{background:var(--bg-card,#0f0f1a);border:1px solid var(--border,rgba(255,255,255,.06));
        border-radius:14px;padding:12px 14px;}
    .tama-panel h4{margin:0 0 10px;font-family:var(--font-display),sans-serif;font-size:.82rem;
        color:var(--text,#eee);display:flex;justify-content:space-between;align-items:center;}
    .tama-panel h4 em{font-style:normal;font-size:.68rem;color:var(--muted,#5a5a78);font-family:var(--font-mono),monospace;}
    .tama-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:8px;}
    .tama-item{display:flex;align-items:center;gap:8px;padding:8px 9px;border-radius:10px;cursor:pointer;
        background:var(--bg-raised,#14141f);border:1px solid var(--border,rgba(255,255,255,.06));
        transition:border-color .18s,transform .12s;}
    .tama-item:hover:not(.off){border-color:var(--accent,#4f7cff);transform:translateY(-1px);}
    .tama-item.off{opacity:.4;cursor:not-allowed;}
    .tama-item i{font-style:normal;font-size:1.2rem;}
    .tama-item .txt{display:flex;flex-direction:column;line-height:1.25;min-width:0;}
    .tama-item .txt b{font-size:.72rem;font-weight:600;color:var(--text,#eee);}
    .tama-item .txt small{font-size:.6rem;color:var(--muted,#5a5a78);font-family:var(--font-mono),monospace;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .tama-item .txt small.price{color:var(--gold,#e8b94a);}
    .tama-item.eq{border-color:var(--success,#34c77b);}

    .tama-toggle{display:flex;gap:6px;justify-content:center;}
    .tama-toggle button{padding:6px 16px;border-radius:20px;cursor:pointer;font-size:.72rem;
        background:transparent;border:1px solid var(--border-md,rgba(255,255,255,.1));color:var(--text-2,#a8a8be);
        font-family:var(--font-body),sans-serif;transition:all .18s;}
    .tama-toggle button.on{background:var(--accent,#4f7cff);border-color:var(--accent,#4f7cff);color:#fff;}

    .tama-modal{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
        background:rgba(8,8,16,.9);border-radius:20px;z-index:20;padding:20px;backdrop-filter:blur(4px);}
    .tama-modal .box{text-align:center;max-width:300px;}
    .tama-modal h3{font-family:var(--font-display),sans-serif;font-size:1.25rem;margin:0 0 8px;color:var(--text,#eee);}
    .tama-modal p{font-size:.8rem;color:var(--text-2,#a8a8be);margin:0 0 16px;line-height:1.5;}
    .tama-modal input{width:100%;padding:10px 12px;margin-bottom:12px;border-radius:10px;
        background:var(--bg-raised,#14141f);border:1px solid var(--border-md,rgba(255,255,255,.1));
        color:var(--text,#eee);font-family:var(--font-body),sans-serif;font-size:.85rem;text-align:center;}
    .tama-modal input:focus{outline:none;border-color:var(--accent,#4f7cff);}
    .tama-modal button{padding:10px 24px;border-radius:10px;cursor:pointer;border:none;
        background:var(--accent,#4f7cff);color:#fff;font-family:var(--font-display),sans-serif;
        font-size:.85rem;font-weight:600;transition:transform .12s;}
    .tama-modal button:hover{transform:translateY(-2px);}
    .tama-modal .big{font-size:3rem;margin-bottom:6px;}
    .tama-hint{text-align:center;font-size:.66rem;color:var(--muted,#5a5a78);
        font-family:var(--font-mono),monospace;line-height:1.6;}
    `;
    contenedor.appendChild(css);

    const wrap = document.createElement('div');
    wrap.className = 'tama-wrap';
    wrap.innerHTML = `
      <div class="tama-shell">
        <div class="tama-hud">
          <div><b id="tm-nombre">…</b> <span class="tama-badge" id="tm-etapa">—</span></div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span class="tama-badge sick" id="tm-est-sick" style="display:none;">🤒 enfermo</span>
            <span class="tama-badge sleep" id="tm-est-sleep" style="display:none;">💤 durmiendo</span>
            <span class="tama-coins" id="tm-monedas">◎ 0</span>
          </div>
        </div>
        <canvas class="tama-canvas" id="tm-canvas" width="${ANCHO}" height="${ALTO}"></canvas>
        <div id="tm-modal-host"></div>
      </div>

      <div class="tama-panel">
        <div class="tama-bars" id="tm-bars"></div>
      </div>

      <div class="tama-actions" id="tm-actions"></div>

      <div class="tama-toggle">
        <button id="tm-tab-inv" class="on">🎒 Inventario</button>
        <button id="tm-tab-shop">🛒 Tienda</button>
      </div>

      <div class="tama-panel">
        <h4><span id="tm-panel-t">Inventario</span><em id="tm-panel-s"></em></h4>
        <div class="tama-grid" id="tm-panel-g"></div>
      </div>

      <p class="tama-hint">
        Tu mascota sigue viviendo aunque cierres la página — el estado se calcula por tiempo real.<br>
        Si la descuidas se enferma, y si no la curas… muere. Cuídala bien para ganar monedas.
      </p>
    `;
    contenedor.appendChild(wrap);

    const cv = wrap.querySelector('#tm-canvas');
    const cx = cv.getContext('2d');

    /* ═══════════════════════════════════════════════════════
       AUDIO (WebAudio, sin archivos)
    ═══════════════════════════════════════════════════════ */
    let actx = null;
    function beep(freq, dur = .12, type = 'square', vol = .07) {
        try {
            if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
            const o = actx.createOscillator(), g = actx.createGain();
            o.type = type; o.frequency.setValueAtTime(freq, actx.currentTime);
            g.gain.setValueAtTime(vol, actx.currentTime);
            g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + dur);
            o.connect(g); g.connect(actx.destination);
            o.start(); o.stop(actx.currentTime + dur);
        } catch (e) { }
    }
    const sfxHappy = () => { beep(660, .1, 'sine', .08); setTimeout(() => beep(880, .12, 'sine', .08), 90); };
    const sfxEat = () => { beep(320, .07, 'triangle', .09); setTimeout(() => beep(260, .09, 'triangle', .07), 80); };
    const sfxCoin = () => { beep(880, .08, 'square', .06); setTimeout(() => beep(1180, .1, 'square', .06), 70); };
    const sfxBad = () => { beep(180, .25, 'sawtooth', .1); };
    const sfxBorn = () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .14, 'sine', .09), i * 110)); };
    const sfxDeath = () => { [400, 300, 220, 140].forEach((f, i) => setTimeout(() => beep(f, .4, 'sawtooth', .11), i * 220)); };

    /* ═══════════════════════════════════════════════════════
       API
    ═══════════════════════════════════════════════════════ */
    async function api(url, body) {
        const opt = body
            ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
            : {};
        const r = await fetch(url, opt);
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.message || 'Error de red');
        return d;
    }

    function aplicar(d, opts = {}) {
        const antes = S;
        if (d.estado) S = d.estado;
        sincronizadoEn = performance.now();

        if (antes && S) {
            if (!antes.muerto && S.muerto) { sfxDeath(); }
            if (antes.etapa === 'huevo' && S.etapa !== 'huevo') { sfxBorn(); flash('¡Ha nacido! 🐣'); }
            if (S.monedas > antes.monedas && !opts.silencio) sfxCoin();
        }
        if (d.logros && d.logros.length) {
            flash('🏅 Logro: ' + d.logros.join(', '));
            sfxHappy();
        }
        if (d.mensaje) flash(d.mensaje);
        render();
        guardarPuntaje();
    }

    function flash(txt) {
        mensajeFlash = { txt, t: performance.now() };
    }

    /* Envía la puntuación al ranking global existente (/guardar_puntaje) */
    let ultimoPuntajeEnviado = -1;
    function guardarPuntaje() {
        if (!S) return;
        const pts = S.puntos || 0;
        if (pts <= ultimoPuntajeEnviado) return;
        ultimoPuntajeEnviado = pts;
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ juego: 'tamagochi', puntos: pts })
        }).then(() => {
            if (typeof window.cargarRanking === 'function') window.cargarRanking();
            if (typeof window.cargarRankings === 'function') window.cargarRankings();
        }).catch(() => { });
    }

    /* ═══════════════════════════════════════════════════════
       INTERPOLACIÓN: muestra el desgaste en vivo entre polls
    ═══════════════════════════════════════════════════════ */
    function stat(clave) {
        if (!S) return 0;
        const base = S[clave] ?? 0;
        if (S.muerto || !S.nacido) return Math.round(base);
        const horas = (performance.now() - sincronizadoEn) / 3600000;
        const tasa = (S.tasas || {})[clave] || 0;
        return Math.max(0, Math.min(100, Math.round(base + tasa * horas)));
    }
    function edadSeg() {
        if (!S) return 0;
        if (S.muerto) return S.edad_seg;
        return S.edad_seg + (performance.now() - sincronizadoEn) / 1000;
    }
    function cooldown(a) {
        if (!S) return 0;
        const c = (S.cooldowns || {})[a] || 0;
        return Math.max(0, c - (performance.now() - sincronizadoEn) / 1000);
    }
    function fmtEdad(s) {
        s = Math.floor(s);
        const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
        if (d > 0) return `${d}d ${h}h`;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }
    function humor() {
        if (!S || !S.nacido) return 'huevo';
        if (S.muerto) return 'muerto';
        if (S.durmiendo) return 'durmiendo';
        if (S.enfermo) return 'enfermo';
        const f = stat('felicidad'), h = stat('hambre'), l = stat('limpieza');
        if (f < 25 || h < 20 || l < 20) return 'triste';
        if (f > 70 && h > 50) return 'feliz';
        return 'normal';
    }

    /* ═══════════════════════════════════════════════════════
       DIBUJO
    ═══════════════════════════════════════════════════════ */
    function tieneDeco() {
        return S && (S.cosmeticos || []).includes('lampara');
    }
    function accesorio() {
        if (!S) return null;
        const eq = S.equipado || {};
        return eq.accesorio || null;
    }

    function dibujarHabitacion() {
        const hum = humor();
        // Pared: cambia con el estado de ánimo
        let c1 = '#232344', c2 = '#14142a';
        if (hum === 'durmiendo') { c1 = '#12122c'; c2 = '#0a0a18'; }
        else if (hum === 'feliz') { c1 = '#2b2a52'; c2 = '#181832'; }
        else if (hum === 'triste' || hum === 'enfermo') { c1 = '#262032'; c2 = '#15111c'; }
        else if (hum === 'muerto') { c1 = '#1a1a1a'; c2 = '#0c0c0c'; }

        const g = cx.createLinearGradient(0, 0, 0, ALTO);
        g.addColorStop(0, c1); g.addColorStop(1, c2);
        cx.fillStyle = g; cx.fillRect(0, 0, ANCHO, ALTO);

        // Suelo
        const sueloY = ALTO - 78;
        cx.fillStyle = 'rgba(255,255,255,.045)';
        cx.fillRect(0, sueloY, ANCHO, 78);
        cx.strokeStyle = 'rgba(255,255,255,.07)'; cx.lineWidth = 1;
        cx.beginPath(); cx.moveTo(0, sueloY + .5); cx.lineTo(ANCHO, sueloY + .5); cx.stroke();
        // Baldosas
        for (let i = 0; i <= ANCHO; i += 48) {
            cx.beginPath(); cx.moveTo(i, sueloY); cx.lineTo(i, ALTO); cx.stroke();
        }

        // Ventana con luna o sol
        cx.save();
        cx.fillStyle = 'rgba(0,0,0,.35)';
        cx.fillRect(34, 42, 78, 74);
        cx.strokeStyle = 'rgba(255,255,255,.14)'; cx.lineWidth = 2;
        cx.strokeRect(34, 42, 78, 74);
        cx.beginPath(); cx.moveTo(73, 42); cx.lineTo(73, 116);
        cx.moveTo(34, 79); cx.lineTo(112, 79); cx.stroke();
        if (S && S.durmiendo) {
            cx.fillStyle = '#dfe4ff'; cx.beginPath(); cx.arc(90, 62, 9, 0, 7); cx.fill();
            cx.fillStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.arc(95, 58, 8, 0, 7); cx.fill();
            cx.fillStyle = 'rgba(255,255,255,.75)';
            [[50, 95], [62, 60], [98, 100]].forEach(p => { cx.fillRect(p[0], p[1], 2, 2); });
        } else {
            cx.fillStyle = 'rgba(232,185,74,.75)'; cx.beginPath(); cx.arc(90, 62, 10, 0, 7); cx.fill();
        }
        cx.restore();

        // Decoración comprada
        if (tieneDeco()) {
            const bx = ANCHO - 74, by = sueloY;
            cx.fillStyle = '#3a3a52'; cx.fillRect(bx + 12, by - 62, 6, 62);
            cx.fillStyle = 'rgba(232,185,74,.85)';
            cx.beginPath(); cx.moveTo(bx - 4, by - 62); cx.lineTo(bx + 34, by - 62); cx.lineTo(bx + 26, by - 92); cx.lineTo(bx + 4, by - 92); cx.closePath(); cx.fill();
            const gl = cx.createRadialGradient(bx + 15, by - 70, 4, bx + 15, by - 70, 78);
            gl.addColorStop(0, 'rgba(232,185,74,.20)'); gl.addColorStop(1, 'rgba(232,185,74,0)');
            cx.fillStyle = gl; cx.beginPath(); cx.arc(bx + 15, by - 70, 78, 0, 7); cx.fill();
        }
        return sueloY;
    }

    function dibujarHuevo(sueloY) {
        const t = anim / 26;
        const tilt = Math.sin(t) * .1;
        const cxx = ANCHO / 2, cyy = sueloY - 46;
        cx.save();
        cx.translate(cxx, cyy); cx.rotate(tilt);
        // sombra
        cx.restore();
        cx.fillStyle = 'rgba(0,0,0,.3)';
        cx.beginPath(); cx.ellipse(cxx, sueloY + 6, 40, 9, 0, 0, 7); cx.fill();

        cx.save();
        cx.translate(cxx, cyy); cx.rotate(tilt);
        const gg = cx.createLinearGradient(-40, -56, 40, 56);
        gg.addColorStop(0, '#fdf6e3'); gg.addColorStop(1, '#d8cdb0');
        cx.fillStyle = gg;
        cx.beginPath(); cx.ellipse(0, 0, 40, 52, 0, 0, 7); cx.fill();
        cx.fillStyle = 'rgba(79,124,255,.18)';
        [[-16, -14, 7], [12, 4, 9], [-6, 24, 6], [20, -24, 5]].forEach(p => {
            cx.beginPath(); cx.arc(p[0], p[1], p[2], 0, 7); cx.fill();
        });
        // grieta que crece con el progreso
        const p = Math.min(1, (S ? S.progreso_huevo || 0 : 0));
        if (p > .25) {
            cx.strokeStyle = '#5a4a32'; cx.lineWidth = 2.5; cx.beginPath();
            const pasos = Math.floor(2 + p * 6);
            cx.moveTo(-30, -6);
            for (let i = 1; i <= pasos; i++) cx.lineTo(-30 + i * 8, -6 + (i % 2 ? 9 : -9));
            cx.stroke();
        }
        cx.restore();

        cx.fillStyle = 'rgba(255,255,255,.6)';
        cx.font = '600 13px ' + (getCss('--font-mono') || 'monospace');
        cx.textAlign = 'center';
        cx.fillText(`Eclosiona en ${fmtEdad(Math.max(0, (S ? S.eclosiona_en : 0)))}…`, ANCHO / 2, sueloY + 34);
        cx.fillText('Toca el huevo para acelerar', ANCHO / 2, sueloY + 54);
    }

    function colorCuerpo() {
        const h = humor();
        if (h === 'muerto') return ['#6a6a72', '#43434a'];
        if (h === 'enfermo') return ['#9fd6a8', '#6ba377'];
        if (h === 'triste') return ['#8f95c9', '#5f66a0'];
        if (h === 'durmiendo') return ['#8fa8ff', '#5f74c8'];
        if (h === 'feliz') return ['#ffd166', '#f0a93c'];
        return ['#79b8ff', '#4f7cff'];
    }

    function dibujarMascota(sueloY) {
        const et = S.etapa;
        const R = et === 'bebe' ? 30 : et === 'nino' ? 42 : 54;
        const t = anim / 30;
        const muerto = S.muerto;
        const durmiendo = S.durmiendo;

        // respiración / rebote
        let bob = 0, squash = 1;
        if (!muerto) {
            if (durmiendo) { squash = 1 + Math.sin(t * .8) * .03; }
            else { bob = Math.abs(Math.sin(t * 1.6)) * (humor() === 'feliz' ? 10 : 4); squash = 1 - bob / 140; }
        }
        const px = ANCHO / 2, py = sueloY - R - bob;

        // sombra
        cx.fillStyle = 'rgba(0,0,0,.32)';
        cx.beginPath(); cx.ellipse(px, sueloY + 5, R * .85 * squash, R * .2, 0, 0, 7); cx.fill();

        cx.save();
        cx.translate(px, py);

        // cuerpo
        const [cA, cB] = colorCuerpo();
        const bg = cx.createRadialGradient(-R * .3, -R * .35, R * .1, 0, 0, R * 1.15);
        bg.addColorStop(0, cA); bg.addColorStop(1, cB);
        cx.fillStyle = bg;
        cx.beginPath(); cx.ellipse(0, 0, R * squash, R / squash, 0, 0, 7); cx.fill();

        // orejitas / antena según etapa
        cx.fillStyle = cB;
        if (et === 'bebe') {
            cx.beginPath(); cx.moveTo(0, -R); cx.lineTo(2, -R - 14); cx.lineTo(-2, -R - 14); cx.closePath(); cx.fill();
            cx.beginPath(); cx.arc(0, -R - 16, 4, 0, 7); cx.fill();
        } else {
            cx.beginPath(); cx.ellipse(-R * .58, -R * .78, 9, 15, -.4, 0, 7); cx.fill();
            cx.beginPath(); cx.ellipse(R * .58, -R * .78, 9, 15, .4, 0, 7); cx.fill();
        }
        // patitas
        cx.fillStyle = cB;
        cx.beginPath(); cx.ellipse(-R * .42, R * .88, 11, 6, 0, 0, 7); cx.fill();
        cx.beginPath(); cx.ellipse(R * .42, R * .88, 11, 6, 0, 0, 7); cx.fill();

        // brillo
        cx.fillStyle = 'rgba(255,255,255,.22)';
        cx.beginPath(); cx.ellipse(-R * .32, -R * .38, R * .26, R * .18, -.5, 0, 7); cx.fill();

        // ojos
        const ex = R * .32, ey = -R * .12, er = et === 'bebe' ? 6 : 7.5;
        if (muerto) {
            cx.strokeStyle = '#2a2a30'; cx.lineWidth = 3;
            [-ex, ex].forEach(x => {
                cx.beginPath();
                cx.moveTo(x - 5, ey - 5); cx.lineTo(x + 5, ey + 5);
                cx.moveTo(x + 5, ey - 5); cx.lineTo(x - 5, ey + 5); cx.stroke();
            });
        } else if (durmiendo) {
            cx.strokeStyle = '#22223a'; cx.lineWidth = 2.5;
            [-ex, ex].forEach(x => { cx.beginPath(); cx.arc(x, ey, er, .25, Math.PI - .25); cx.stroke(); });
        } else {
            const parpadeo = (anim % 190) < 7;
            [-ex, ex].forEach(x => {
                if (parpadeo) {
                    cx.strokeStyle = '#22223a'; cx.lineWidth = 2.5;
                    cx.beginPath(); cx.moveTo(x - er, ey); cx.lineTo(x + er, ey); cx.stroke();
                } else {
                    cx.fillStyle = '#fff';
                    cx.beginPath(); cx.arc(x, ey, er, 0, 7); cx.fill();
                    cx.fillStyle = '#1a1a2e';
                    const look = Math.sin(t * .5) * 2;
                    cx.beginPath(); cx.arc(x + look, ey + 1, er * .5, 0, 7); cx.fill();
                    cx.fillStyle = 'rgba(255,255,255,.9)';
                    cx.beginPath(); cx.arc(x + look - 1.5, ey - 1.5, er * .18, 0, 7); cx.fill();
                }
            });
        }

        // boca
        const hum = humor();
        cx.strokeStyle = muerto ? '#2a2a30' : '#22223a';
        cx.lineWidth = 2.5; cx.lineCap = 'round';
        const my = R * .34;
        cx.beginPath();
        if (hum === 'feliz') cx.arc(0, my - 6, 9, .25, Math.PI - .25);
        else if (hum === 'triste' || hum === 'enfermo' || muerto) cx.arc(0, my + 8, 9, Math.PI + .3, -.3);
        else if (durmiendo) { cx.arc(0, my - 2, 5, 0, Math.PI); }
        else { cx.moveTo(-6, my); cx.lineTo(6, my); }
        cx.stroke();

        // mejillas cuando está feliz
        if (hum === 'feliz') {
            cx.fillStyle = 'rgba(232,68,90,.28)';
            [-R * .68, R * .68].forEach(x => { cx.beginPath(); cx.arc(x, my - 6, 7, 0, 7); cx.fill(); });
        }
        // enfermo: gotita
        if (hum === 'enfermo') {
            cx.fillStyle = 'rgba(143,168,255,.85)';
            cx.beginPath(); cx.ellipse(R * .72, -R * .3 + Math.sin(t * 2) * 3, 4, 6, 0, 0, 7); cx.fill();
        }
        // sucio: manchitas
        if (!muerto && stat('limpieza') < 40) {
            cx.fillStyle = 'rgba(90,70,40,.5)';
            [[-R * .5, R * .3, 5], [R * .3, R * .55, 4], [R * .1, -R * .6, 3.5]].forEach(p => {
                cx.beginPath(); cx.arc(p[0], p[1], p[2], 0, 7); cx.fill();
            });
        }

        // accesorio equipado
        const acc = accesorio();
        if (acc === 'gorro') {
            cx.fillStyle = '#1e1e2c';
            cx.fillRect(-R * .62, -R - 6, R * 1.24, 5);
            cx.fillRect(-R * .34, -R - 30, R * .68, 26);
            cx.fillStyle = '#e8445a'; cx.fillRect(-R * .34, -R - 12, R * .68, 5);
        } else if (acc === 'lazo') {
            cx.fillStyle = '#e8445a';
            cx.beginPath(); cx.ellipse(-11, -R - 4, 10, 7, -.4, 0, 7); cx.fill();
            cx.beginPath(); cx.ellipse(11, -R - 4, 10, 7, .4, 0, 7); cx.fill();
            cx.fillStyle = '#b8324a'; cx.beginPath(); cx.arc(0, -R - 4, 4.5, 0, 7); cx.fill();
        }
        cx.restore();

        // zZz durmiendo
        if (durmiendo && !muerto) {
            cx.fillStyle = 'rgba(255,255,255,.55)';
            cx.textAlign = 'left';
            for (let i = 0; i < 3; i++) {
                const f = (anim / 40 + i * .8) % 3;
                cx.font = `600 ${11 + i * 4}px ${getCss('--font-display') || 'sans-serif'}`;
                cx.globalAlpha = Math.max(0, .7 - f / 3);
                cx.fillText('z', px + R * .7 + f * 14, py - R * .7 - f * 20);
            }
            cx.globalAlpha = 1;
        }
        // aura fantasma si murió
        if (muerto) {
            cx.strokeStyle = 'rgba(255,255,255,.25)'; cx.lineWidth = 3;
            cx.beginPath(); cx.ellipse(px, py - R - 22, 20, 7, 0, 0, 7); cx.stroke();
        }
        return { px, py, R };
    }

    function dibujarParticulas() {
        const ahora = performance.now();
        particulas = particulas.filter(p => ahora - p.n < p.vida);
        particulas.forEach(p => {
            const k = (ahora - p.n) / p.vida;
            cx.globalAlpha = 1 - k;
            cx.font = `${p.sz}px sans-serif`; cx.textAlign = 'center';
            cx.fillText(p.txt, p.x + Math.sin(k * 6 + p.f) * 14, p.y - k * 78);
        });
        cx.globalAlpha = 1;
    }
    function emitir(txt, n = 5, sz = 20) {
        const py = ALTO - 78 - 60;
        for (let i = 0; i < n; i++) {
            particulas.push({
                txt, x: ANCHO / 2 + (Math.random() - .5) * 90, y: py,
                n: performance.now() + i * 90, vida: 1300, sz, f: Math.random() * 6
            });
        }
    }

    function dibujarFlash() {
        if (!mensajeFlash) return;
        const k = (performance.now() - mensajeFlash.t) / 2600;
        if (k > 1) { mensajeFlash = null; return; }
        cx.save();
        cx.globalAlpha = k > .8 ? (1 - k) / .2 : 1;
        cx.font = `600 13px ${getCss('--font-body') || 'sans-serif'}`;
        cx.textAlign = 'center';
        const w = cx.measureText(mensajeFlash.txt).width + 26;
        cx.fillStyle = 'rgba(8,8,18,.88)';
        redondeado(ANCHO / 2 - w / 2, 12, w, 30, 15); cx.fill();
        cx.strokeStyle = 'rgba(79,124,255,.5)'; cx.lineWidth = 1;
        redondeado(ANCHO / 2 - w / 2, 12, w, 30, 15); cx.stroke();
        cx.fillStyle = '#eeeef5';
        cx.fillText(mensajeFlash.txt, ANCHO / 2, 32);
        cx.restore();
    }
    function redondeado(x, y, w, h, r) {
        cx.beginPath();
        cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r);
        cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r);
        cx.arcTo(x, y, x + w, y, r); cx.closePath();
    }
    function getCss(v) {
        return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    }

    function loop() {
        anim++;
        const sueloY = dibujarHabitacion();
        if (S) {
            if (!S.nacido) dibujarHuevo(sueloY);
            else dibujarMascota(sueloY);
            // edad
            cx.fillStyle = 'rgba(255,255,255,.4)';
            cx.font = `500 11px ${getCss('--font-mono') || 'monospace'}`;
            cx.textAlign = 'right';
            cx.fillText(`edad ${fmtEdad(edadSeg())}`, ANCHO - 12, ALTO - 12);
            if (S.muerto) {
                cx.textAlign = 'center';
                cx.fillStyle = 'rgba(232,68,90,.9)';
                cx.font = `700 15px ${getCss('--font-display') || 'sans-serif'}`;
                cx.fillText('💀 Descansa en paz', ANCHO / 2, ALTO - 30);
            }
        }
        dibujarParticulas();
        dibujarFlash();
        rafId = requestAnimationFrame(loop);
    }

    /* ═══════════════════════════════════════════════════════
       UI: barras, botones, inventario/tienda
    ═══════════════════════════════════════════════════════ */
    const BARRAS = [
        { k: 'hambre', ic: '🍗', lb: 'Hambre' },
        { k: 'energia', ic: '⚡', lb: 'Energía' },
        { k: 'felicidad', ic: '💛', lb: 'Feliz' },
        { k: 'limpieza', ic: '🧼', lb: 'Limpio' },
        { k: 'salud', ic: '❤️', lb: 'Salud' }
    ];
    function colorBarra(v) {
        if (v >= 60) return 'linear-gradient(90deg,#34c77b,#5fe0a0)';
        if (v >= 30) return 'linear-gradient(90deg,#e8b94a,#f0d070)';
        return 'linear-gradient(90deg,#e8445a,#ff7080)';
    }

    const barsHost = wrap.querySelector('#tm-bars');
    barsHost.innerHTML = BARRAS.map(b => `
      <div class="tama-bar">
        <span class="ic">${b.ic}</span><span class="lb">${b.lb}</span>
        <div class="track"><div class="fill" id="bar-${b.k}" style="width:0%"></div></div>
        <span class="vl" id="val-${b.k}">0</span>
      </div>`).join('');

    const ACCIONES = [
        { id: 'comer', ic: '🍽️', lb: 'Alimentar' },
        { id: 'jugar', ic: '🎾', lb: 'Jugar' },
        { id: 'limpiar', ic: '🚿', lb: 'Bañar' },
        { id: 'dormir', ic: '💤', lb: 'Dormir' },
        { id: 'medicina', ic: '💉', lb: 'Curar' },
        { id: 'acariciar', ic: '🤲', lb: 'Mimar' }
    ];
    const actHost = wrap.querySelector('#tm-actions');
    actHost.innerHTML = ACCIONES.map(a =>
        `<button class="tama-btn" data-acc="${a.id}"><i>${a.ic}</i>${a.lb}<small id="cd-${a.id}"></small></button>`
    ).join('');

    actHost.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => manejarAccion(b.dataset.acc));
    });

    // Pestañas inventario / tienda
    const tabInv = wrap.querySelector('#tm-tab-inv');
    const tabShop = wrap.querySelector('#tm-tab-shop');
    tabInv.addEventListener('click', () => { vistaTienda = false; tabInv.classList.add('on'); tabShop.classList.remove('on'); render(); });
    tabShop.addEventListener('click', () => { vistaTienda = true; tabShop.classList.add('on'); tabInv.classList.remove('on'); render(); });

    function render() {
        if (!S) return;
        wrap.querySelector('#tm-nombre').textContent = S.nombre || 'Sin nombre';
        wrap.querySelector('#tm-etapa').textContent = S.muerto ? '💀 Fallecido' : (ETAPA_LABEL[S.etapa] || '—');
        wrap.querySelector('#tm-monedas').textContent = '◎ ' + (S.monedas || 0);
        wrap.querySelector('#tm-est-sick').style.display = (S.enfermo && !S.muerto) ? '' : 'none';
        wrap.querySelector('#tm-est-sleep').style.display = (S.durmiendo && !S.muerto) ? '' : 'none';

        BARRAS.forEach(b => {
            const v = S.nacido ? stat(b.k) : 100;
            const f = wrap.querySelector('#bar-' + b.k);
            f.style.width = v + '%';
            f.style.background = colorBarra(v);
            wrap.querySelector('#val-' + b.k).textContent = v;
        });

        // Botones
        const vivo = !S.muerto && S.nacido;
        actHost.querySelectorAll('button').forEach(btn => {
            const a = btn.dataset.acc;
            let off = !vivo || ocupado;
            let nota = '';
            if (a === 'dormir') {
                btn.querySelector('i').textContent = S.durmiendo ? '☀️' : '💤';
                btn.childNodes[1].textContent = S.durmiendo ? 'Despertar' : 'Dormir';
            } else if (S.durmiendo) {
                off = true; nota = 'durmiendo';
            }
            if (a === 'medicina') {
                const n = (S.inventario || {}).medicina || 0;
                if (!S.enfermo) { off = true; nota = 'sano'; } else if (!n) { off = true; nota = 'sin medicina'; }
                else nota = 'x' + n;
            }
            if (a === 'comer') {
                const total = Object.entries(S.inventario || {})
                    .filter(([k]) => TIENDA[k] && TIENDA[k].tipo === 'comida')
                    .reduce((s, [, v]) => s + v, 0);
                if (!total) { off = true; nota = 'sin comida'; } else nota = 'x' + total;
            }
            const cd = cooldown(a);
            if (cd > 0 && vivo) { off = true; nota = Math.ceil(cd) + 's'; }
            btn.disabled = off;
            wrap.querySelector('#cd-' + a).textContent = nota;
        });

        renderPanel();
        renderModal();
    }

    function renderPanel() {
        const t = wrap.querySelector('#tm-panel-t');
        const sub = wrap.querySelector('#tm-panel-s');
        const g = wrap.querySelector('#tm-panel-g');

        if (vistaTienda) {
            t.textContent = 'Tienda';
            sub.textContent = '◎ ' + (S.monedas || 0) + ' disponibles';
            g.innerHTML = Object.entries(TIENDA).map(([k, it]) => {
                const yaTiene = it.tipo === 'cosmetico' && (S.cosmeticos || []).includes(k);
                const off = yaTiene || (S.monedas || 0) < it.precio || S.muerto;
                return `<div class="tama-item ${off ? 'off' : ''}" data-buy="${k}">
                    <i>${it.icono}</i>
                    <div class="txt"><b>${it.nombre}</b>
                    <small class="price">${yaTiene ? 'comprado' : '◎ ' + it.precio}</small></div>
                </div>`;
            }).join('');
            g.querySelectorAll('[data-buy]').forEach(el => {
                if (el.classList.contains('off')) return;
                el.addEventListener('click', () => comprar(el.dataset.buy));
            });
        } else {
            t.textContent = 'Inventario';
            const inv = Object.entries(S.inventario || {}).filter(([, v]) => v > 0);
            const cos = (S.cosmeticos || []);
            sub.textContent = `${inv.reduce((s, [, v]) => s + v, 0)} objetos · ${cos.length} cosméticos`;
            let html = inv.map(([k, v]) => {
                const it = TIENDA[k]; if (!it) return '';
                return `<div class="tama-item" data-use="${k}">
                    <i>${it.icono}</i>
                    <div class="txt"><b>${it.nombre} ×${v}</b><small>${it.desc}</small></div>
                </div>`;
            }).join('');
            html += cos.map(k => {
                const it = TIENDA[k]; if (!it) return '';
                const eqAcc = (S.equipado || {}).accesorio === k;
                const esDeco = it.nombre === 'Lámpara';
                return `<div class="tama-item ${eqAcc ? 'eq' : ''}" ${esDeco ? '' : `data-eq="${k}"`}>
                    <i>${it.icono}</i>
                    <div class="txt"><b>${it.nombre}</b>
                    <small>${esDeco ? 'en la habitación' : (eqAcc ? '✓ puesto' : 'toca para poner')}</small></div>
                </div>`;
            }).join('');
            g.innerHTML = html || '<div style="grid-column:1/-1;text-align:center;padding:14px;color:var(--muted,#5a5a78);font-size:.75rem;">Vacío. Compra comida en la tienda 🛒</div>';
            g.querySelectorAll('[data-use]').forEach(el => el.addEventListener('click', () => usar(el.dataset.use)));
            g.querySelectorAll('[data-eq]').forEach(el => el.addEventListener('click', () => equipar(el.dataset.eq)));
        }
    }

    /* ═══════════════════════════════════════════════════════
       MODALES (crear mascota / muerte)
    ═══════════════════════════════════════════════════════ */
    const modalHost = wrap.querySelector('#tm-modal-host');
    let modalActual = null;

    function renderModal() {
        const necesita = !S ? null : (S.existe === false ? 'crear' : (S.muerto ? 'muerto' : null));
        if (necesita === modalActual) return;
        modalActual = necesita;
        modalHost.innerHTML = '';
        if (!necesita) return;

        const m = document.createElement('div');
        m.className = 'tama-modal';
        if (necesita === 'crear') {
            m.innerHTML = `<div class="box">
                <div class="big">🥚</div>
                <h3>Adopta tu mascota</h3>
                <p>Ponle un nombre. Cuídala: come, duerme, juega y se enferma de verdad — el tiempo corre incluso si cierras la página.</p>
                <input id="tm-in-nombre" maxlength="16" placeholder="Nombre de tu mascota">
                <button id="tm-crear">Incubar huevo</button>
            </div>`;
            modalHost.appendChild(m);
            const inp = m.querySelector('#tm-in-nombre');
            inp.focus();
            const go = async () => {
                const nombre = inp.value.trim();
                if (nombre.length < 2) { inp.style.borderColor = '#e8445a'; return; }
                await accionar('/api/tama/nuevo', { nombre });
            };
            m.querySelector('#tm-crear').addEventListener('click', go);
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        } else {
            m.innerHTML = `<div class="box">
                <div class="big">💀</div>
                <h3>${S.nombre} ha muerto</h3>
                <p>Vivió <b>${fmtEdad(S.edad_seg)}</b> y llegó a la etapa <b>${ETAPA_LABEL[S.etapa] || '—'}</b>.<br>
                Tu récord: <b>${fmtEdad(S.mejor_edad_seg || S.edad_seg)}</b> · ${S.puntos} puntos en el ranking.<br>
                Conservas tus monedas y cosméticos.</p>
                <input id="tm-in-nombre" maxlength="16" placeholder="Nombre de la nueva mascota">
                <button id="tm-crear">Empezar de nuevo</button>
            </div>`;
            modalHost.appendChild(m);
            const inp = m.querySelector('#tm-in-nombre');
            const go = async () => {
                const nombre = inp.value.trim();
                if (nombre.length < 2) { inp.style.borderColor = '#e8445a'; return; }
                await accionar('/api/tama/nuevo', { nombre });
                modalActual = 'reset';
            };
            m.querySelector('#tm-crear').addEventListener('click', go);
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        }
    }

    /* ═══════════════════════════════════════════════════════
       ACCIONES
    ═══════════════════════════════════════════════════════ */
    async function accionar(url, body, fx) {
        if (ocupado) return;
        ocupado = true; render();
        try {
            const d = await api(url, body);
            if (fx) fx();
            aplicar(d);
        } catch (e) {
            flash('⚠️ ' + e.message); sfxBad();
        } finally {
            ocupado = false; render();
        }
    }

    function manejarAccion(a) {
        if (a === 'comer') {
            // usa la comida más barata disponible
            const comidas = Object.entries(S.inventario || {})
                .filter(([k, v]) => v > 0 && TIENDA[k] && TIENDA[k].tipo === 'comida')
                .sort((x, y) => TIENDA[x[0]].precio - TIENDA[y[0]].precio);
            if (!comidas.length) { vistaTienda = true; tabShop.click(); flash('Compra comida primero 🛒'); return; }
            usar(comidas[0][0]);
            return;
        }
        if (a === 'medicina') { usar('medicina'); return; }
        const fx = {
            jugar: () => { emitir('💛', 6); sfxHappy(); },
            limpiar: () => { emitir('🫧', 7); beep(520, .18, 'sine', .07); },
            acariciar: () => { emitir('💗', 4, 16); beep(760, .1, 'sine', .07); },
            dormir: () => { beep(300, .3, 'sine', .07); }
        }[a];
        accionar('/api/tama/accion', { accion: a }, fx);
    }

    function usar(item) {
        const it = TIENDA[item];
        const fx = it && it.tipo === 'medicina'
            ? () => { emitir('✨', 6); sfxHappy(); }
            : () => { emitir(it ? it.icono : '🍎', 5); sfxEat(); };
        accionar('/api/tama/usar', { item }, fx);
    }
    function comprar(item) {
        accionar('/api/tama/comprar', { item }, () => sfxCoin());
    }
    function equipar(item) {
        const yaEq = (S.equipado || {}).accesorio === item;
        accionar('/api/tama/equipar', { item: yaEq ? null : item });
    }

    // Tocar el huevo lo acelera
    cv.addEventListener('click', () => {
        if (!S) return;
        if (!S.nacido && !S.muerto) {
            emitir('✨', 2, 14); beep(600 + Math.random() * 200, .06, 'square', .05);
            accionar('/api/tama/accion', { accion: 'tocar_huevo' });
        } else if (S.nacido && !S.muerto && !S.durmiendo) {
            manejarAccion('acariciar');
        }
    });

    /* ═══════════════════════════════════════════════════════
       ARRANQUE Y POLLING
    ═══════════════════════════════════════════════════════ */
    async function sincronizar(silencio) {
        try {
            const d = await api('/api/tama/estado');
            aplicar(d, { silencio });
        } catch (e) {
            flash('⚠️ Sin conexión con el servidor');
        }
    }

    function limpiar() {
        if (marco) marco.classList.remove('tama-host');
        if (rafId) cancelAnimationFrame(rafId);
        if (pollId) clearInterval(pollId);
        document.removeEventListener('visibilitychange', onVis);
    }
    function onVis() { if (!document.hidden) sincronizar(true); }

    // Si juego.html recarga el script, matamos la instancia anterior
    if (window.__tamaLimpiar) window.__tamaLimpiar();
    window.__tamaLimpiar = limpiar;

    document.addEventListener('visibilitychange', onVis);
    pollId = setInterval(() => { if (!document.hidden) sincronizar(true); }, 20000);
    // refresca los contadores de cooldown / barras en vivo
    setInterval(() => { if (S && !document.hidden) render(); }, 1000);

    loop();
    sincronizar(true);
})();
