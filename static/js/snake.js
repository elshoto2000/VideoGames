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
            overflow: auto;
            padding: 12px;
        }
        .snk-overlay.snk-overlay-full {
            position: fixed; inset: 0;
            width: 100vw; height: 100vh;
            z-index: 99999;
            background: rgba(4,4,10,0.92);
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
        .snk-panel.snk-panel-lg {
            width: min(94%, 720px);
            max-height: 90vh;
            overflow-y: auto;
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
        }
        @media (min-width: 640px) {
            .snk-panel.snk-panel-lg { grid-template-columns: 220px 1fr; }
        }
        .snk-title {
            font-size: 15px; letter-spacing: 1px; text-transform: uppercase;
            color: #8888a8; margin: 0 0 14px; text-align: center;
        }
        .snk-subtitle {
            font-size: 12px; letter-spacing: .5px; text-transform: uppercase;
            color: #6a6a88; margin: 18px 0 8px;
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
        .snk-btn.small { padding: 8px 10px; font-size: 12.5px; margin-bottom: 0; }
        .snk-btn.danger { background: #2a1418; }
        .snk-btn.danger:hover { background: #3a1a20; }
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
        .snk-tabs { display: flex; gap: 8px; margin-bottom: 14px; }
        .snk-tab {
            flex: 1; text-align: center; padding: 10px; border-radius: 10px; cursor: pointer;
            background: #1b1b28; color: #8888a8; font-size: 13px; border: 1px solid rgba(255,255,255,0.08);
        }
        .snk-tab.active { background: #4f7cff; color: #fff; border-color: #4f7cff; }
        .snk-preview-box {
            background: #06060e; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);
            padding: 10px; display: flex; align-items: center; justify-content: center;
            margin-bottom: 14px;
        }
        .snk-preview-box canvas { display: block; max-width: 100%; }
        .snk-slot-row { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
        .snk-slot {
            width: 40px; height: 40px; border-radius: 10px; position: relative; cursor: pointer;
            border: 2px solid rgba(255,255,255,0.15);
        }
        .snk-slot input[type=color] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .snk-count-row { display: flex; gap: 6px; margin-bottom: 14px; }
        .snk-count-btn {
            flex: 1; padding: 8px; text-align: center; border-radius: 8px; cursor: pointer;
            background: #1b1b28; color: #8888a8; font-size: 13px; border: 1px solid rgba(255,255,255,0.08);
        }
        .snk-count-btn.active { background: #4f7cff; color: #fff; border-color: #4f7cff; }
        .snk-acc-item {
            display: flex; align-items: center; gap: 10px; padding: 10px;
            background: #1b1b28; border-radius: 10px; margin-bottom: 8px;
            border: 1px solid rgba(255,255,255,0.08);
        }
        .snk-acc-item.equipped { border-color: #4f7cff; box-shadow: inset 0 0 0 1.5px #4f7cff; }
        .snk-acc-dot { width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0; }
        .snk-acc-name { flex: 1; font-size: 13px; }
        .snk-input-text {
            width: 100%; padding: 10px; margin-bottom: 12px; border-radius: 10px;
            background: #1b1b28; border: 1px solid rgba(255,255,255,0.08); color: #eeeef5;
            font-family: inherit; font-size: 13px; box-sizing: border-box;
        }
        .snk-empty { color: #6a6a88; font-size: 12.5px; text-align: center; padding: 10px 0 4px; }
        .snk-hint { color: #6a6a88; font-size: 11.5px; margin: -4px 0 12px; text-align: center; }
        .snk-gear {
            position: fixed; top: 14px; right: 14px; z-index: 100000;
            width: 40px; height: 40px; border-radius: 50%;
            background: rgba(16,16,24,0.85); border: 1px solid rgba(255,255,255,0.12);
            color: #eeeef5; font-size: 18px; cursor: pointer;
            display: none; align-items: center; justify-content: center;
            box-shadow: 0 6px 18px rgba(0,0,0,0.4);
            font-family: "DM Mono", monospace;
            transition: transform .12s, background .15s;
        }
        .snk-gear:hover { background: rgba(30,30,44,0.95); transform: rotate(25deg); }
        .snk-gear:active { transform: scale(0.92) rotate(25deg); }
        `;
        document.head.appendChild(style);
    }

    /* ── Canvas ─────────────────────────────────────────── */
    let canvas = container.querySelector('canvas');
    if (!canvas) { canvas = document.createElement('canvas'); container.prepend(canvas); }
    const ctx = canvas.getContext('2d');

    /* ── Ícono ⚙ flotante: acceso rápido a Personalizar ───
       Visible mientras juegas y en la pantalla de derrota.
       Al tocarlo durante la partida, esta termina (como si
       hubieras perdido) y se abre directo el panel de
       personalización para preparar la siguiente partida.  */
    let gearBtn = document.getElementById('snk-gear-btn');
    if (!gearBtn) {
        gearBtn = document.createElement('button');
        gearBtn.id = 'snk-gear-btn';
        gearBtn.className = 'snk-gear';
        gearBtn.type = 'button';
        gearBtn.title = 'Personalizar serpiente';
        gearBtn.innerHTML = '⚙';
        document.body.appendChild(gearBtn);
    }
    function showGear() { gearBtn.style.display = 'flex'; }
    function hideGear() { gearBtn.style.display = 'none'; }
    gearBtn.onclick = () => {
        if (gameState === 'playing') {
            die(true); // termina la partida actual y va directo a personalizar
        } else if (gameState === 'over') {
            renderCustomize('colores');
        }
    };

    /* ── Usuario ────────────────────────────────────────── */
    const userEl = document.getElementById('display-user');
    const USER   = (userEl ? userEl.innerText : 'Jugador').replace('Jugador: ', '').trim();

    /* ── Constantes ─────────────────────────────────────── */
    const COLS = 20, ROWS = 20;
    let CELL = 20;

    /* ── Paleta / presets de patrones de color (hasta 5 colores) ── */
    const PRESETS = [
        { name: 'Azul',     colores: ['#4f7cff'] },
        { name: 'Verde',    colores: ['#34c77b'] },
        { name: 'Rojo',     colores: ['#ff6b6b'] },
        { name: 'Oro',      colores: ['#ffd93d'] },
        { name: 'Púrpura',  colores: ['#c56aff'] },
        { name: 'Arcoíris', colores: ['#ff6b6b', '#ffd93d', '#34c77b', '#4f7cff', '#c56aff'] },
    ];
    const DEFAULT_COLORES = ['#4f7cff'];

    /* ── Ajustes / modalidades ──────────────────────────────
       speedMode:    normal | rapido | extremo
       movingFood:   la comida se desplaza sola por el tablero
       colores:      array de 1 a 5 colores hex, se repite el patrón por cubo
       accesorios:   [{id, tipo:'sombrero', nombre, color}]
       equipadoId:   id del accesorio actualmente puesto, o null
    ───────────────────────────────────────────────────────── */
    const DEFAULTS = { speedMode: 'normal', movingFood: false, colores: DEFAULT_COLORES.slice(), accesorios: [], equipadoId: null };
    let settings = loadSettingsLocal();
    let configReady = false;

    function loadSettingsLocal() {
        try {
            const raw = localStorage.getItem('snake_settings_v2');
            if (raw) return Object.assign({}, DEFAULTS, JSON.parse(raw));
        } catch (e) {}
        return Object.assign({}, DEFAULTS);
    }
    function saveSettingsLocal() {
        try { localStorage.setItem('snake_settings_v2', JSON.stringify(settings)); } catch (e) {}
    }

    /* ── Sincronización con el backend (MongoDB) ─────────── */
    function fetchConfig() {
        fetch('/api/snake_config')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return;
                if (Array.isArray(data.colores) && data.colores.length) settings.colores = data.colores.slice(0, 5);
                if (Array.isArray(data.accesorios)) settings.accesorios = data.accesorios;
                settings.equipadoId = data.equipado || null;
                configReady = true;
                saveSettingsLocal();
                if (gameState === 'menu' || gameState === 'customize') {
                    if (gameState === 'customize') renderCustomize(customizeTab);
                    else renderMenu();
                }
            })
            .catch(() => {});
    }

    function guardarColoresRemoto(colores) {
        return fetch('/api/snake_config/colores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ colores })
        }).then(r => r.json()).catch(() => ({ status: 'error' }));
    }
    function guardarAccesorioRemoto(nombre, color) {
        return fetch('/api/snake_config/accesorio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, color })
        }).then(r => r.json()).catch(() => ({ status: 'error' }));
    }
    function equiparRemoto(id) {
        return fetch('/api/snake_config/equipar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        }).then(r => r.json()).catch(() => ({ status: 'error' }));
    }
    function eliminarAccesorioRemoto(id) {
        return fetch('/api/snake_config/eliminar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        }).then(r => r.json()).catch(() => ({ status: 'error' }));
    }

    function colorAt(i) {
        const c = settings.colores && settings.colores.length ? settings.colores : DEFAULT_COLORES;
        return c[i % c.length];
    }
    function equippedAccessory() {
        if (!settings.equipadoId) return null;
        return (settings.accesorios || []).find(a => a.id === settings.equipadoId) || null;
    }

    /* ── Estado ─────────────────────────────────────────── */
    let snake, foods, dx, dy, score, highScore, speed, running, lockInput;
    let applesEaten, particles, flashTimer, speedPreset;
    let gameState = 'menu'; // menu | config | customize | playing | over
    let customizeTab = 'colores'; // colores | accesorios
    let draftColores = DEFAULT_COLORES.slice();
    let draftCount = 1;

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
        hideGear();
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
        overlayEl.querySelector('[data-act="customize"]').onclick = () => renderCustomize('colores');
    }

    function renderConfig() {
        clearOverlay();
        gameState = 'config';
        hideGear();
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
                saveSettingsLocal();
                renderConfig();
            };
        });
        overlayEl.querySelector('[data-act="toggle-food"]').onclick = () => {
            settings.movingFood = !settings.movingFood;
            saveSettingsLocal();
            renderConfig();
        };
        overlayEl.querySelector('[data-act="back"]').onclick = () => renderMenu();
        overlayEl.querySelector('[data-act="play"]').onclick = () => startGame();
    }

    /* ── Personalizar: pantalla grande (colores + accesorios) ── */
    function renderCustomize(tab) {
        clearOverlay();
        gameState = 'customize';
        hideGear();
        customizeTab = tab || 'colores';
        if (customizeTab === 'colores') {
            draftColores = (settings.colores && settings.colores.length ? settings.colores : DEFAULT_COLORES).slice();
            draftCount = draftColores.length;
        }

        overlayEl = document.createElement('div');
        overlayEl.className = 'snk-overlay snk-overlay-full';
        overlayEl.innerHTML = `
            <div class="snk-panel snk-panel-lg">
                <div>
                    <div class="snk-back" data-act="back">← Volver al menú</div>
                    <p class="snk-title">Personalizar serpiente</p>
                    <div class="snk-preview-box"><canvas id="snk-preview" width="220" height="100"></canvas></div>
                    <div class="snk-tabs">
                        <div class="snk-tab ${customizeTab === 'colores' ? 'active' : ''}" data-tab="colores">Colores</div>
                        <div class="snk-tab ${customizeTab === 'accesorios' ? 'active' : ''}" data-tab="accesorios">Accesorios</div>
                    </div>
                    <button class="snk-btn primary" data-act="play">▶ Jugar</button>
                </div>
                <div id="snk-tab-content"></div>
            </div>
        `;
        container.appendChild(overlayEl);

        overlayEl.querySelector('[data-act="back"]').onclick = () => renderMenu();
        overlayEl.querySelector('[data-act="play"]').onclick = () => startGame();
        overlayEl.querySelectorAll('[data-tab]').forEach(el => {
            el.onclick = () => renderCustomize(el.getAttribute('data-tab'));
        });

        if (customizeTab === 'colores') renderTabColores();
        else renderTabAccesorios();

        drawPreview();
    }

    function renderTabColores() {
        const host = overlayEl.querySelector('#snk-tab-content');

        const presetBtns = PRESETS.map(p => `
            <button class="snk-btn small" data-preset="${p.name}" style="flex:1; min-width:88px">${p.name}</button>
        `).join('');

        const countBtns = [1, 2, 3, 4, 5].map(n => `
            <div class="snk-count-btn ${draftCount === n ? 'active' : ''}" data-count="${n}">${n}</div>
        `).join('');

        const slots = Array.from({ length: draftCount }).map((_, i) => `
            <div class="snk-slot" style="background:${draftColores[i] || '#4f7cff'}">
                <input type="color" data-slot="${i}" value="${draftColores[i] || '#4f7cff'}">
            </div>
        `).join('');

        host.innerHTML = `
            <p class="snk-subtitle">Presets rápidos</p>
            <div class="snk-row" style="flex-wrap:wrap">${presetBtns}</div>
            <p class="snk-subtitle">Cantidad de colores (máx. 5)</p>
            <div class="snk-count-row">${countBtns}</div>
            <p class="snk-subtitle">Colores del patrón</p>
            <div class="snk-slot-row">${slots}</div>
            <p class="snk-hint">El patrón se repite a lo largo de todo el cuerpo, cubo por cubo.</p>
            <button class="snk-btn primary" data-act="save-colors">💾 Guardar colores</button>
        `;

        host.querySelectorAll('[data-preset]').forEach(btn => {
            btn.onclick = () => {
                const p = PRESETS.find(x => x.name === btn.getAttribute('data-preset'));
                draftColores = p.colores.slice();
                draftCount = draftColores.length;
                renderTabColores();
                drawPreview();
            };
        });
        host.querySelectorAll('[data-count]').forEach(el => {
            el.onclick = () => {
                draftCount = +el.getAttribute('data-count');
                while (draftColores.length < draftCount) draftColores.push('#4f7cff');
                draftColores = draftColores.slice(0, draftCount);
                renderTabColores();
                drawPreview();
            };
        });
        host.querySelectorAll('[data-slot]').forEach(input => {
            input.oninput = () => {
                draftColores[+input.getAttribute('data-slot')] = input.value;
                input.closest('.snk-slot').style.background = input.value;
                drawPreview();
            };
        });
        host.querySelector('[data-act="save-colors"]').onclick = () => {
            settings.colores = draftColores.slice(0, draftCount);
            saveSettingsLocal();
            const btn = host.querySelector('[data-act="save-colors"]');
            btn.textContent = 'Guardando...';
            guardarColoresRemoto(settings.colores).then(res => {
                btn.textContent = res && res.status === 'success' ? '✅ Guardado' : '⚠ Error, reintenta';
                setTimeout(() => { btn.textContent = '💾 Guardar colores'; }, 1600);
            });
        };
    }

    function renderTabAccesorios() {
        const host = overlayEl.querySelector('#snk-tab-content');
        const accesorios = settings.accesorios || [];

        const items = accesorios.length ? accesorios.map(a => `
            <div class="snk-acc-item ${settings.equipadoId === a.id ? 'equipped' : ''}" data-acc="${a.id}">
                <div class="snk-acc-dot" style="background:${a.color}"></div>
                <div class="snk-acc-name">${escapeHtml(a.nombre)}</div>
                <button class="snk-btn small" data-equip="${a.id}" style="width:auto; margin:0">
                    ${settings.equipadoId === a.id ? 'Puesto ✓' : 'Poner'}
                </button>
                <button class="snk-btn small danger" data-del="${a.id}" style="width:auto; margin:0">🗑</button>
            </div>
        `).join('') : `<div class="snk-empty">Todavía no tienes gorros guardados.</div>`;

        host.innerHTML = `
            <p class="snk-subtitle">Tus gorros guardados</p>
            <button class="snk-btn small" data-equip="none" style="margin-bottom:10px">
                ${settings.equipadoId ? 'Quitar accesorio' : 'Sin accesorio (actual) ✓'}
            </button>
            ${items}
            <p class="snk-subtitle">Crear nuevo gorro</p>
            <div class="snk-slot-row">
                <div class="snk-slot" id="snk-new-acc-swatch" style="background:${newAccColor}">
                    <input type="color" id="snk-new-acc-color" value="${newAccColor}">
                </div>
            </div>
            <input type="text" id="snk-new-acc-name" class="snk-input-text" maxlength="24" placeholder="Nombre del gorro" value="${escapeHtml(newAccName)}">
            <button class="snk-btn primary" data-act="save-acc">💾 Guardar nuevo gorro</button>
        `;

        host.querySelectorAll('[data-equip]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-equip') === 'none' ? null : btn.getAttribute('data-equip');
                settings.equipadoId = id;
                saveSettingsLocal();
                equiparRemoto(id);
                renderTabAccesorios();
                drawPreview();
            };
        });
        host.querySelectorAll('[data-del]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-del');
                settings.accesorios = (settings.accesorios || []).filter(a => a.id !== id);
                if (settings.equipadoId === id) settings.equipadoId = null;
                saveSettingsLocal();
                eliminarAccesorioRemoto(id);
                renderTabAccesorios();
                drawPreview();
            };
        });
        const colorInput = host.querySelector('#snk-new-acc-color');
        colorInput.oninput = () => {
            newAccColor = colorInput.value;
            host.querySelector('#snk-new-acc-swatch').style.background = newAccColor;
            drawPreview(true);
        };
        const nameInput = host.querySelector('#snk-new-acc-name');
        nameInput.oninput = () => { newAccName = nameInput.value; };

        host.querySelector('[data-act="save-acc"]').onclick = () => {
            const nombre = (nameInput.value || 'Gorro').trim() || 'Gorro';
            const btn = host.querySelector('[data-act="save-acc"]');
            btn.textContent = 'Guardando...';
            guardarAccesorioRemoto(nombre, newAccColor).then(res => {
                if (res && res.status === 'success' && res.accesorio) {
                    settings.accesorios = settings.accesorios || [];
                    settings.accesorios.push(res.accesorio);
                    saveSettingsLocal();
                    newAccName = '';
                    newAccColor = '#222222';
                    renderTabAccesorios();
                    drawPreview();
                } else {
                    btn.textContent = '⚠ Error, reintenta';
                    setTimeout(() => { btn.textContent = '💾 Guardar nuevo gorro'; }, 1600);
                }
            });
        };
    }
    let newAccColor = '#222222';
    let newAccName = '';

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }

    /* ── Vista previa en vivo de la serpiente ─────────────── */
    function drawPreview(useDraftAcc) {
        if (!overlayEl) return;
        const pc = overlayEl.querySelector('#snk-preview');
        if (!pc) return;
        const pctx = pc.getContext('2d');
        const W = pc.width, H = pc.height;
        pctx.clearRect(0, 0, W, H);
        pctx.fillStyle = '#06060e';
        pctx.fillRect(0, 0, W, H);

        const segs = 6;
        const cell = 30;
        const startX = 12, y = H / 2 - cell / 2;
        const colores = customizeTab === 'colores' ? draftColores : (settings.colores || DEFAULT_COLORES);

        for (let i = segs - 1; i >= 0; i--) {
            const px = startX + (segs - 1 - i) * (cell + 4);
            const color = colores[i % colores.length] || '#4f7cff';
            pctx.save();
            if (i === 0) {
                pctx.shadowBlur = 12;
                pctx.shadowColor = color;
                pctx.fillStyle = color;
            } else {
                pctx.globalAlpha = Math.max(0.35, 1 - i * 0.13);
                pctx.fillStyle = color;
            }
            pctx.beginPath();
            pctx.roundRect(px, y, cell, cell, 6);
            pctx.fill();
            pctx.restore();
        }

        // ojos en la cabeza (última dibujada = i=0, situada al final a la derecha)
        const headPx = startX + (segs - 1) * (cell + 4);
        pctx.fillStyle = 'rgba(0,0,0,0.8)';
        pctx.beginPath(); pctx.arc(headPx + cell * 0.72, y + cell * 0.28, 2.6, 0, Math.PI * 2); pctx.fill();
        pctx.beginPath(); pctx.arc(headPx + cell * 0.72, y + cell * 0.72, 2.6, 0, Math.PI * 2); pctx.fill();

        // accesorio (gorro) sobre la cabeza
        let acc = null;
        if (customizeTab === 'accesorios') {
            acc = useDraftAcc ? { color: newAccColor } : equippedAccessory();
        } else {
            acc = equippedAccessory();
        }
        if (acc) drawHat(pctx, headPx, y, cell, acc.color);
    }

    function drawHat(c, px, py, sz, color) {
        c.save();
        const cx = px + sz / 2;
        const brimY = py - sz * 0.06;
        // brim
        c.fillStyle = color;
        c.beginPath();
        c.ellipse(cx, brimY, sz * 0.62, sz * 0.16, 0, 0, Math.PI * 2);
        c.fill();
        // cap
        c.beginPath();
        c.roundRect(cx - sz * 0.3, py - sz * 0.62, sz * 0.6, sz * 0.58, 4);
        c.fill();
        // band
        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.fillRect(cx - sz * 0.3, py - sz * 0.22, sz * 0.6, sz * 0.1);
        c.restore();
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
    const SPEED_PRESETS = {
        normal:  { label: 'Normal',  start: 140, min: 60, dec: 2 },
        rapido:  { label: 'Rápido',  start: 105, min: 45, dec: 3 },
        extremo: { label: 'Extremo', start: 80,  min: 32, dec: 4 },
    };

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
        gameState = 'playing';
        showGear();

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

            const px = (head.x + 0.5) * CELL;
            const py = (head.y + 0.5) * CELL;
            spawnParticles(px, py, colorAt(0), 10);

            foods.splice(fi, 1);
            spawnFood();
        } else {
            snake.pop();
        }

        foods.forEach(maybeMoveFood);
        lockInput = false;
    }

    /* ── Die ─────────────────────────────────────────────── */
    function die(gotoCustomize) {
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

        if (gotoCustomize) {
            renderCustomize('colores'); // el usuario tocó el ⚙ para editar antes de la próxima partida
        } else {
            setTimeout(renderGameOver, 300);
        }
    }

    /* ── Draw ─────────────────────────────────────────────── */
    function draw(ts) {
        const W = canvas.width, H = canvas.height;

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
            ctx.fillStyle = `rgba(${hexToRgb(colorAt(0))},${flashTimer / 30})`;
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

        const acc = equippedAccessory();

        snake.forEach((seg, i) => {
            const px = seg.x * CELL + 1;
            const py = seg.y * CELL + 1;
            const sz = CELL - 2;
            const segColor = colorAt(i);

            if (i === 0) {
                ctx.save();
                ctx.shadowBlur = 18;
                ctx.shadowColor = segColor;
                ctx.fillStyle = segColor;
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

                if (acc) drawHat(ctx, px, py, sz, acc.color);
                ctx.restore();
            } else {
                const alpha = Math.max(0.35, 1 - (i / snake.length) * 0.6);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = segColor;
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
    fetchConfig();
})();
