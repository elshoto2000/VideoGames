// static/js/simon.js

(function() {
    console.log("¡Cargando el motor definitivo del minijuego de caminata por esquinas!");

    const contenedor = document.getElementById('simon-game-container');
    if (!contenedor) {
        console.error("No se encontró el contenedor #simon-game-container");
        return;
    }

    contenedor.innerHTML = ''; // Limpieza total de seguridad

    // --- ESTADOS Y VARIABLES DEL JUEGO ---
    let puntuacion = 0;
    let preguntaActual = null;
    let juegoActivo = false;
    let estadoMensaje = "Presiona EMPEZAR JUEGO para iniciar la ronda.";
    let mostrarRespuestaCorrecta = "";

    // Dimensiones fijas del Canvas
    const ANCHO = 480;
    const ALTO = 400;

    // Propiedades del Personaje
    const jugador = {
        x: ANCHO / 2,
        y: ALTO / 2 + 40, 
        radio: 12,
        velocidad: 4,
        color: '#00ffff'
    };

    // Definición de las 4 Esquinas (Zonas de Respuesta)
    const esquinas = [
        { id: 0, nombre: 'Arriba Izquierda', x: 0, y: 70, w: 130, h: 90, color: '#e74c3c', colorHover: '#ff6b6b' },
        { id: 1, nombre: 'Arriba Derecha',   x: ANCHO - 130, y: 70, w: 130, h: 90, color: '#3498db', colorHover: '#5dade2' },
        { id: 2, nombre: 'Abajo Izquierda',  x: 0, y: ALTO - 90, w: 130, h: 90, color: '#2ecc71', colorHover: '#58d68d' },
        { id: 3, nombre: 'Abajo Derecha',    x: ANCHO - 130, y: ALTO - 90, w: 130, h: 90, color: '#f1c40f', colorHover: '#f5b041' }
    ];

    // Control de Teclado Activo
    const teclas = {
        w: false, a: false, s: false, d: false,
        KeyW: false, KeyA: false, KeyS: false, KeyD: false,
        ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
    };

    // --- INYECCIÓN DE ESTILOS CSS ---
    const estiloCSS = document.createElement('style');
    estiloCSS.innerHTML = `
        .arcade-canvas-wrapper { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; max-width: 500px; margin: 0 auto; box-sizing: border-box; }
        .hud-arcade { display: flex; justify-content: space-between; width: 100%; font-weight: bold; font-size: 1.1rem; color: #fff; padding: 0 5px; }
        .canvas-game-board { background: #1a1a24; border: 3px solid #333; border-radius: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.7); display: block; max-width: 100%; height: auto; }
        .area-botones { display: flex; gap: 15px; width: 100%; justify-content: center; margin-top: 5px; }
        .btn-arcade-control { background: #222; color: #fff; border: 2px solid #444; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
        .btn-arcade-control:hover { background: #00ffff; color: #000; border-color: #00ffff; }
    `;
    document.head.appendChild(estiloCSS);

    // --- MAQUETACIÓN ESTRUCTURAL ---
    const wrapper = document.createElement('div');
    wrapper.className = 'arcade-canvas-wrapper';
    wrapper.innerHTML = `
        <div class="hud-arcade">
            <span>Puntos: <span id="arcade-score" style="color: #00ffff">0</span></span>
            <span>Mover: WASD / Flechas</span>
        </div>
        
        <canvas id="arcade-canvas" width="${ANCHO}" height="${ALTO}" class="canvas-game-board"></canvas>

        <div class="area-botones">
            <button class="btn-arcade-control" id="btn-start-arcade">EMPEZAR JUEGO</button>
            <button class="btn-arcade-control" id="btn-fs-arcade">PANTALLA COMPLETA</button>
        </div>
    `;
    contenedor.appendChild(wrapper);

    // --- CAPTURA DE COMPONENTES TRAS LA INYECCIÓN ---
    const canvas = wrapper.querySelector('#arcade-canvas');
    const ctx = canvas.getContext('2d');
    const txtScore = wrapper.querySelector('#arcade-score');
    const btnStart = wrapper.querySelector('#btn-start-arcade');
    const btnFS = wrapper.querySelector('#btn-fs-arcade');
    const contenedorPantallaCompleta = document.getElementById('game-screen');

    // --- ESCUCHAS DE TECLADO ---
    window.addEventListener('keydown', (e) => {
        if (teclas[e.key] !== undefined) teclas[e.key] = true;
        if (teclas[e.code] !== undefined) teclas[e.code] = true;

        // Previene scroll molesto del navegador al usar flechas
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].indexOf(e.key) > -1) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (teclas[e.key] !== undefined) teclas[e.key] = false;
        if (teclas[e.code] !== undefined) teclas[e.code] = false;
    });

    // --- GESTIÓN DE PREGUNTAS ---
    function cargarSiguientePregunta() {
        if (typeof window.obtenerPreguntaArcadeSimon !== 'function') {
            console.error("No se detectó el conector en preguntas.js");
            return;
        }

        preguntaActual = window.obtenerPreguntaArcadeSimon();
        estadoMensaje = preguntaActual.pregunta;
        mostrarRespuestaCorrecta = "";

        // Reiniciar al personaje en la zona central baja
        jugador.x = ANCHO / 2;
        jugador.y = ALTO / 2 + 40;
        juegoActivo = true;
    }

    // --- DETECCIÓN DE COLISIONES ---
    function verificarColisionEsquinas() {
        for (let i = 0; i < esquinas.length; i++) {
            const e = esquinas[i];
            
            if (jugador.x + jugador.radio > e.x && 
                jugador.x - jugador.radio < e.x + e.w &&
                jugador.y + jugador.radio > e.y && 
                jugador.y - jugador.radio < e.y + e.h) {
                
                procesarEleccionRespuesta(i);
                break;
            }
        }
    }

    function procesarEleccionRespuesta(indiceEsquina) {
        juegoActivo = false; 
        const respuestaSeleccionada = preguntaActual.opciones[indiceEsquina];

        if (respuestaSeleccionada === preguntaActual.correcta) {
            puntuacion++;
            txtScore.innerText = puntuacion;
            estadoMensaje = "¡Correcto! Volviendo al centro...";
            
            setTimeout(() => {
                cargarSiguientePregunta();
            }, 1200);
        } else {
            estadoMensaje = "Incorrecto.";
            mostrarRespuestaCorrecta = `La respuesta era: ${preguntaActual.correcta}`;
            
            setTimeout(() => {
                finalizarPartidaArcade();
            }, 2500);
        }
    }

    function finalizarPartidaArcade() {
        if (typeof window.cargarRanking === 'function') {
            const nick = localStorage.getItem('arcade_user') || 'Jugador';
            fetch('/guardar_puntaje', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ juego: 'simon', nombre: nick, puntos: puntuacion })
            })
            .then(() => window.cargarRanking())
            .catch(err => console.error("Error al guardar puntos:", err));
        }

        const gameOverPanel = document.getElementById('game-over-screen');
        if (gameOverPanel) {
            document.getElementById('final-score-msg').innerText = `Lograste caminar correctamente hacia ${puntuacion} respuestas del banco.`;
            contenedor.style.display = 'none';
            gameOverPanel.style.display = 'block';
        }
    }

    // --- FORMATEADOR DE TEXTO MULTILÍNEA ---
    function dibujarTextoMultilinea(texto, x, y, anchoMax, altoLinea) {
        const palabras = texto.split(' ');
        let linea = '';

        for (let n = 0; n < palabras.length; n++) {
            let pruebaLinea = linea + palabras[n] + ' ';
            let metricas = ctx.measureText(pruebaLinea);
            if (metricas.width > anchoMax && n > 0) {
                ctx.fillText(linea, x, y);
                linea = palabras[n] + ' ';
                y += altoLinea;
            } else {
                linea = pruebaLinea;
            }
        }
        ctx.fillText(linea, x, y);
    }

    // --- BUCLE DE RENDERIZADO PRINCIPAL ---
    function actualizarJuego() {
        // Movimiento físico
        if (juegoActivo) {
            if (teclas.w || teclas.KeyW || teclas.ArrowUp)    jugador.y -= jugador.velocidad;
            if (teclas.s || teclas.KeyS || teclas.ArrowDown)  jugador.y += jugador.velocidad;
            if (teclas.a || teclas.KeyA || teclas.ArrowLeft)  jugador.x -= jugador.velocidad;
            if (teclas.d || teclas.KeyD || teclas.ArrowRight) jugador.x += jugador.velocidad;

            // Límites del escenario
            if (jugador.x - jugador.radio < 0) jugador.x = jugador.radio;
            if (jugador.x + jugador.radio > ANCHO) jugador.x = ANCHO - jugador.radio;
            if (jugador.y - jugador.radio < 70) jugador.y = 70 + jugador.radio; 
            if (jugador.y + jugador.radio > ALTO) jugador.y = ALTO - jugador.radio;

            verificarColisionEsquinas();
        }

        // Limpieza de pantalla
        ctx.clearRect(0, 0, ANCHO, ALTO);

        // Cuadro superior de información y preguntas
        ctx.fillStyle = '#111119';
        ctx.fillRect(0, 0, ANCHO, 65);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 65);
        ctx.lineTo(ANCHO, 65);
        ctx.stroke();

        // Dibujar el texto de la pregunta
        ctx.fillStyle = '#ffffff';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        dibujarTextoMultilinea(estadoMensaje, ANCHO / 2, 22, ANCHO - 30, 16);

        if (mostrarRespuestaCorrecta) {
            ctx.fillStyle = '#ffaa00';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(mostrarRespuestaCorrecta, ANCHO / 2, 55);
        }

        // Dibujar Bloques en las esquinas
        esquinas.forEach((e, idx) => {
            let estaCerca = (jugador.x > e.x && jugador.x < e.x + e.w && jugador.y > e.y && jugador.y < e.y + e.h);
            ctx.fillStyle = estaCerca ? e.colorHover : e.color;
            ctx.fillRect(e.x, e.y, e.w, e.h);

            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.strokeRect(e.x, e.y, e.w, e.h);

            if (preguntaActual && preguntaActual.opciones[idx]) {
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                dibujarTextoMultilinea(preguntaActual.opciones[idx], e.x + (e.w / 2), e.y + (e.h / 2) - 5, e.w - 10, 14);
            }
        });

        // Dibujar el Personaje (Avatar esférico limpio)
        ctx.fillStyle = jugador.color;
        ctx.beginPath();
        ctx.arc(jugador.x, jugador.y, jugador.radio, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(jugador.x, jugador.y, jugador.radio / 2, 0, Math.PI * 2);
        ctx.fill();

        requestAnimationFrame(actualizarJuego);
    }

    // --- INTERRUPTORES DE EVENTO ---
    btnStart.addEventListener('click', () => {
        puntuacion = 0;
        txtScore.innerText = "0";
        cargarSiguientePregunta();
    });

    btnFS.addEventListener('click', () => {
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

    // --- ARRANQUE SEGURO ---
    // Nos aseguramos de que el motor gráfico empiece a ejecutarse solo cuando el canvas ya está estable en el DOM
    setTimeout(() => {
        requestAnimationFrame(actualizarJuego);
    }, 50);

})();
