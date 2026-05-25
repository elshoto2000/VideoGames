// static/js/simon.js

(function() {
    console.log("¡Conectando Simón Dice con BancoPreguntasArcade de 150 preguntas!");

    const contenedor = document.getElementById('simon-game-container');
    if (!contenedor) {
        console.error("No se encontró el contenedor #simon-game-container");
        return;
    }

    contenedor.innerHTML = ''; // Limpieza de seguridad

    // --- ESTADOS DEL JUEGO ---
    let puntuacion = 0;
    let preguntaActual = null;
    let bloqueado = false;
    let audioCtx = null;

    // Paletas dinámicas de colores para mutar la interfaz en cada ronda
    const paletasDeColores = [
        [ {n: '#ff5555', h: '#ff8888'}, {n: '#55ff55', h: '#88ff88'}, {n: '#5555ff', h: '#8888ff'}, {n: '#ffff55', h: '#ffff88'} ], // Clásica
        [ {n: '#ff77aa', h: '#ffaacc'}, {n: '#00e5ff', h: '#80f2ff'}, {n: '#b241f3', h: '#d98eff'}, {n: '#ffaa00', h: '#ffd580'} ], // Cyberpunk
        [ {n: '#4caf50', h: '#81c784'}, {n: '#f44336', h: '#e57373'}, {n: '#ffeb3b', h: '#fff176'}, {n: '#2196f3', h: '#64b5f6'} ], // Pastel Retro
        [ {n: '#e67e22', h: '#f39c12'}, {n: '#2ecc71', h: '#27ae60'}, {n: '#3498db', h: '#2980b9'}, {n: '#9b59b6', h: '#8e44ad'} ]  // Flat UI
    ];
    let coloresActuales = paletasDeColores[0];
    const tonosFrecuencia = [329.63, 261.63, 220.00, 164.81]; // Sonidos del Simón Dice original

    // --- INYECCIÓN DE ESTILOS Y ESTRUCTURA ---
    const estiloCSS = document.createElement('style');
    estiloCSS.innerHTML = `
        .simon-wrapper { display: flex; flex-direction: column; align-items: center; gap: 15px; width: 100%; max-width: 500px; margin: 0 auto; padding: 10px; box-sizing: border-box; }
        .hud-simon { display: flex; justify-content: space-between; width: 100%; font-weight: bold; font-size: 1.1rem; color: #fff; }
        .bocadillo-monito { background: #222; border: 2px solid var(--accent, #00ffff); border-radius: 12px; padding: 15px; width: 100%; box-sizing: border-box; position: relative; text-align: center; font-size: 1.1rem; min-height: 70px; color: #fff; display: flex; align-items: center; justify-content: center; }
        .bocadillo-monito::after { content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); border-width: 10px 10px 0; border-style: solid; border-color: #222 transparent; display: block; width: 0; }
        .tablero-simon { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 330px; height: 330px; background: #111; padding: 12px; border-radius: 50%; box-shadow: 0 8px 24px rgba(0,0,0,0.6); position: relative; }
        .cuadrante { border: none; border-radius: 40px; cursor: pointer; transition: background 0.1s ease, transform 0.1s; display: flex; align-items: center; justify-content: center; padding: 12px; font-weight: bold; color: #000; font-size: 0.9rem; text-shadow: 0 1px 2px rgba(255,255,255,0.5); box-sizing: border-box; text-align: center; overflow: hidden; line-height: 1.2; }
        .cuadrante:active, .cuadrante.active { transform: scale(0.95); filter: brightness(1.35); box-shadow: 0 0 20px currentColor; }
        .cuadrante-0 { border-top-left-radius: 100% 100%; }
        .cuadrante-1 { border-top-right-radius: 100% 100%; }
        .cuadrante-2 { border-bottom-left-radius: 100% 100%; }
        .cuadrante-3 { border-bottom-right-radius: 100% 100%; }
        .controles-extra { display: flex; gap: 15px; width: 100%; justify-content: center; }
        .btn-simon-action { background: #333; color: #fff; border: 1px solid #555; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
        .btn-simon-action:hover { background: var(--accent, #00ffff); color: #000; }
        .teclado-virtual { display: grid; grid-template-columns: repeat(3, 50px); grid-template-rows: repeat(2, 50px); gap: 8px; justify-content: center; margin-top: 10px; }
        .btn-flecha { background: #222; border: 2px solid #555; border-radius: 8px; color: #fff; font-size: 1.2rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.1s; user-select: none; }
        .btn-flecha:active { background: var(--accent, #00ffff); color: #000; }
        @media (min-width: 769px) { .teclado-virtual { display: none; } }
    `;
    document.head.appendChild(estiloCSS);

    const wrapper = document.createElement('div');
    wrapper.className = 'simon-wrapper';
    wrapper.innerHTML = `
        <div class="hud-simon">
            <span>Puntos: <span id="simon-score" style="color: var(--accent, #00ffff)">0</span></span>
            <span>Controles: WASD / Flechas</span>
        </div>
        
        <div id="monito-bocadillo" class="bocadillo-monito">
            🐵 ¡Listo guerrero! Presiona EMPEZAR JUEGO para escuchar al monito.
        </div>

        <div class="tablero-simon" id="juego-tablero">
            <button class="cuadrante cuadrante-0" data-idx="0"></button>
            <button class="cuadrante cuadrante-1" data-idx="1"></button>
            <button class="cuadrante cuadrante-2" data-idx="2"></button>
            <button class="cuadrante cuadrante-3" data-idx="3"></button>
        </div>

        <div class="controles-extra">
            <button class="btn-simon-action" id="btn-iniciar-simon">EMPEZAR JUEGO</button>
            <button class="btn-simon-action" id="btn-fullscreen-simon">PANTALLA COMPLETA</button>
        </div>

        <div class="teclado-virtual">
            <div></div>
            <button class="btn-flecha" data-key="ArrowUp">▲</button>
            <div></div>
            <button class="btn-flecha" data-key="ArrowLeft">◀</button>
            <button class="btn-flecha" data-key="ArrowDown">▼</button>
            <button class="btn-flecha" data-key="ArrowRight">▶</button>
        </div>
    `;
    contenedor.appendChild(wrapper);

    // --- ASIGNACIONES DOM ---
    const botonesCuadrantes = wrapper.querySelectorAll('.cuadrante');
    const bocadillo = wrapper.querySelector('#monito-bocadillo');
    const txtScore = wrapper.querySelector('#simon-score');
    const btnIniciar = wrapper.querySelector('#btn-iniciar-simon');
    const btnFullscreen = wrapper.querySelector('#btn-fullscreen-simon');
    const contenedorPantallaCompleta = document.getElementById('game-screen');

    // --- GENERADOR DE SINTONÍAS DE AUDIO ---
    function iniciarAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function sonarFrecuencia(frecuencia, tiempo = 0.3) {
        try {
            iniciarAudioContext();
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + tiempo);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + tiempo);
        } catch(e) { console.log("Audio en espera de interacción humana", e); }
    }

    // --- CONTROL DE RONDAS INTEGRADO ---
    function aplicarCambioColores() {
        coloresActuales = paletasDeColores[Math.floor(Math.random() * paletasDeColores.length)];
        botonesCuadrantes.forEach((btn, idx) => {
            btn.style.backgroundColor = coloresActuales[idx].n;
        });
    }

    function montarSiguientePregunta() {
        bloqueado = true;
        aplicarCambioColores();

        // INTEGRACIÓN DIRECTA: Usamos el conector global de preguntas.js
        if (typeof window.obtenerPreguntaArcadeSimon !== 'function') {
            console.error("No se pudo cargar la función integradora en preguntas.js");
            return;
        }

        preguntaActual = window.obtenerPreguntaArcadeSimon();
        bocadillo.innerHTML = `🐵 <b>Simón dice:</b> ${preguntaActual.pregunta}`;

        // Inyectamos las respuestas mezcladas en los casilleros y hacemos el parpadeo inicial
        botonesCuadrantes.forEach((btn, idx) => {
            btn.innerText = preguntaActual.opciones[idx] || '';
            
            // Secuencia luminosa tradicional por cuadrante
            setTimeout(() => {
                btn.classList.add('active');
                sonarFrecuencia(tonosFrecuencia[idx], 0.2);
                setTimeout(() => btn.classList.remove('active'), 200);
            }, idx * 220);
        });

        setTimeout(() => { bloqueado = false; }, 1000);
    }

    function comprobarEleccionUsuario(indice) {
        if (bloqueado || !preguntaActual) return;
        bloqueado = true;

        const seleccion = preguntaActual.opciones[indice];

        // Efecto visual al presionar
        botonesCuadrantes[indice].classList.add('active');
        sonarFrecuencia(tonosFrecuencia[indice], 0.25);

        setTimeout(() => {
            botonesCuadrantes[indice].classList.remove('active');

            if (seleccion === preguntaActual.correcta) {
                // ¡Acierto!
                puntuacion++;
                txtScore.innerText = puntuacion;
                sonarFrecuencia(523.25, 0.15); // Nota Do alta de éxito
                setTimeout(() => sonarFrecuencia(659.25, 0.2), 100); // Nota Mi
                
                bocadillo.innerHTML = `🐵 ¡Eso es! El monito saltó de la emoción. Siguiente pregunta...`;
                setTimeout(montarSiguientePregunta, 1300);
            } else {
                // ¡Fallo!
                sonarFrecuencia(110, 0.6); // Zumbido de error grave
                bocadillo.innerHTML = `🐵 ¡Nooo! Te equivocaste. La respuesta real era: <br><b style="color:var(--accent)">${preguntaActual.correcta}</b>`;
                setTimeout(enviarPuntajeYTerminar, 1800);
            }
        }, 200);
    }

    function enviarPuntajeYTerminar() {
        if (typeof window.cargarRanking === 'function') {
            const guerrero = localStorage.getItem('arcade_user') || 'Jugador';
            fetch('/guardar_puntaje', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ juego: 'simon', nombre: guerrero, puntos: puntuacion })
            })
            .then(() => window.cargarRanking())
            .catch(err => console.error("Error al sincronizar ranking SQL:", err));
        }

        const gameOverPanel = document.getElementById('game-over-screen');
        if (gameOverPanel) {
            document.getElementById('final-score-msg').innerText = `Contestaste ${puntuacion} preguntas del banco de forma correcta.`;
            contenedor.style.display = 'none';
            gameOverPanel.style.display = 'block';
        }
    }

    // --- ACCIONES Y ACTIVADORES ---
    btnIniciar.addEventListener('click', () => {
        iniciarAudioContext();
        puntuacion = 0;
        txtScore.innerText = "0";
        montarSiguientePregunta();
    });

    botonesCuadrantes.forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-idx'));
            comprobarEleccionUsuario(idx);
        });
    });

    // --- MAPEO DE TECLAS (REDUCE ACCIDENTES AL ESCROLLAR) ---
    const mapeoFisico = {
        'KeyW': 0, 'ArrowUp': 0,
        'KeyA': 2, 'ArrowLeft': 2,
        'KeyS': 3, 'ArrowDown': 3,
        'KeyD': 1, 'ArrowRight': 1
    };

    window.addEventListener('keydown', (e) => {
        if (mapeoFisico[e.code] !== undefined) {
            e.preventDefault(); 
            comprobarEleccionUsuario(mapeoFisico[e.code]);
        }
    });

    // --- SOPORTE TÁCTIL MÓVIL (FLECHAS DISPONIBLES EN PANTALLA COMPLETA) ---
    wrapper.querySelectorAll('.btn-flecha').forEach(btn => {
        const simularEntrada = (e) => {
            e.preventDefault();
            const key = btn.getAttribute('data-key');
            if (key === 'ArrowUp') comprobarEleccionUsuario(0);
            if (key === 'ArrowLeft') comprobarEleccionUsuario(2);
            if (key === 'ArrowDown') comprobarEleccionUsuario(3);
            if (key === 'ArrowRight') comprobarEleccionUsuario(1);
        };
        btn.addEventListener('touchstart', simularEntrada);
        btn.addEventListener('mousedown', simularEntrada);
    });

    // --- FULLSCREEN SEGURO PARA EL TELÉFONO ---
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (contenedorPantallaCompleta.requestFullscreen) {
                contenedorPantallaCompleta.requestFullscreen();
            } else if (contenedorPantallaCompleta.webkitRequestFullscreen) {
                contenedorPantallaCompleta.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    });

    // Pintado estático de inicio
    aplicarCambioColores();
})();
