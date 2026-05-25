// js/simon.js
(function () {
   const contenedor = document.querySelector('.canvas-placeholder');
if (!contenedor) return;

Array.from(contenedor.children).forEach(child => {
    if (child.id !== 'game-over-screen') child.remove();
});
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    // AJUSTE: Pantalla un poco más ancha para mejorar el espacio general
    canvas.width = 480; 
    canvas.height = 510; 
    contenedor.insertBefore(canvas, contenedor.firstChild);

    const ctx = canvas.getContext('2d');
    const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);

    // Sistema de Audio integrado para pitidos retro
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let ultimoSonidoPaso = 0;

    function reproducirSonido(frecuencia, tipo, duracion, volumen = 0.1) {
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = tipo;
            osc.frequency.value = frecuencia;
            gain.gain.setValueAtTime(volumen, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duracion);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duracion);
        } catch(e) { console.log("Audio en espera"); }
    }

    // VARIABLES PRINCIPALES
    let score = 0;
    let juegoActivo = true;
    let tiempoRestante = 12.0; // 12 segundos iniciales para dar más margen
    let ultimaActualizacion = Date.now();

    let contadorPasos = 0;
    let estaMoviendose = false;
    let direccionMirada = 'ABAJO';

    // Personaje (Centrado dinámicamente según el nuevo ancho)
    const personaje = {
        x: 240,
        y: 255,
        size: 20,
        speed: 160, // Un toque más rápido para compensar el ancho
        color: '#ffffff'
    };

    const colores = {
        bg: '#1a0b3d', rojo: '#ff4757', azul: '#00f0ff', verde: '#2ecc71', amarillo: '#ffd23f',
        personaje: '#ffffff', pantalon: '#ff6b81', neonCian: '#00f0ff'
    };

    // AJUSTE: Bloques reubicados proporcionalmente al nuevo ancho de 480
    const bloques = {
        'A': { x: 35,  y: 110, w: 140, h: 110, color: colores.rojo },
        'B': { x: 305, y: 110, w: 140, h: 110, color: colores.azul },
        'C': { x: 35,  y: 300, w: 140, h: 110, color: colores.verde },
        'D': { x: 305, y: 300, w: 140, h: 110, color: colores.amarillo }
    };

    // AJUSTE CRÍTICO: Flechas notablemente más grandes (70x36) y mejor distribuidas para los dedos
    const botonesMovil = {
        'ARRIBA':    { x: 240 - 35, y: 432, w: 70, h: 34 },
        'ABAJO':     { x: 240 - 35, y: 470, w: 70, h: 34 },
        'IZQUIERDA': { x: 155 - 35, y: 451, w: 70, h: 36 },
        'DERECHA':   { x: 325 - 35, y: 451, w: 70, h: 36 }
    };

    const btnFullscreen = { x: 410, y: 15, w: 55, h: 25 };

    // CARGA DE PREGUNTAS DESDE EL ARCHIVO EXTERNO
    let listaActual = [];
    let preguntaIndex = 0;
    let triviaActual = {};
    let bloqueCorrecto = '';

    function inicializarCategoriaAleatoria() {
        const categorias = window.BancoPreguntasArcade || [[]];
        const indiceLista = Math.floor(Math.random() * categorias.length);
        listaActual = [...categorias[indiceLista]];
        listaActual.sort(() => Math.random() - 0.5);
        preguntaIndex = 0;
    }

    function generarNuevaOrden() {
        if (!listaActual || listaActual.length === 0 || preguntaIndex >= listaActual.length) {
            inicializarCategoriaAleatoria();
        }

        triviaActual = listaActual[preguntaIndex];
        preguntaIndex++;
        
        for (let letra in triviaActual.opciones) {
            if (triviaActual.opciones[letra] === triviaActual.a) {
                bloqueCorrecto = letra;
                break;
            }
        }

        tiempoRestante = Math.max(4.0, 12.0 - (score * 0.3)); 
        personaje.x = 240 - personaje.size / 2;
        personaje.y = 255 - personaje.size / 2;
        direccionMirada = 'ABAJO';
    }

    function comprobarColision(p, b) {
        return p.x < b.x + b.w && p.x + p.size > b.x && p.y < b.y + b.h && p.y + p.size > b.y;
    }

    function actualizar() {
        if (!juegoActivo) return;

        const ahora = Date.now();
        const dt = (ahora - ultimaActualizacion) / 1000; 
        ultimaActualizacion = ahora;

        tiempoRestante -= dt;
        if (tiempoRestante <= 0) {
            reproducirSonido(120, 'sawtooth', 0.6); 
            finalizarJuego("¡Te quedaste sin tiempo!");
            return;
        }

        let dx = 0; let dy = 0;

        if (teclas['ArrowUp'] || teclas['w'] || teclas['W'] || teclas['ARRIBA']) { dy = -1; direccionMirada = 'ARRIBA'; }
        if (teclas['ArrowDown'] || teclas['s'] || teclas['S'] || teclas['ABAJO']) { dy = 1; direccionMirada = 'ABAJO'; }
        if (teclas['ArrowLeft'] || teclas['a'] || teclas['A'] || teclas['IZQUIERDA']) { dx = -1; direccionMirada = 'IZQUIERDA'; }
        if (teclas['ArrowRight'] || teclas['d'] || teclas['D'] || teclas['DERECHA']) { dx = 1; direccionMirada = 'DERECHA'; }

        if (dx !== 0 || dy !== 0) {
            estaMoviendose = true;
            contadorPasos += dt * 12;
            personaje.x += dx * personaje.speed * dt;
            personaje.y += dy * personaje.speed * dt;

            if (ahora - ultimoSonidoPaso > 280) { 
                reproducirSonido(180, 'triangle', 0.04, 0.03); 
                ultimoSonidoPaso = ahora;
            }
        } else {
            estaMoviendose = false;
            contadorPasos = 0;
        }

        if (personaje.x < 0) personaje.x = 0;
        if (personaje.x + personaje.size > canvas.width) personaje.x = canvas.width - personaje.size;
        if (personaje.y < 95) personaje.y = 95; 
        if (personaje.y + personaje.size > 430) personaje.y = 430 - personaje.size;

        for (const letra in bloques) {
            if (comprobarColision(personaje, bloques[letra])) {
                if (letra === bloqueCorrecto) {
                    reproducirSonido(587.33, 'triangle', 0.15); 
                    score++;
                    generarNuevaOrden();
                } else {
                    reproducirSonido(147.14, 'sawtooth', 0.5); 
                    finalizarJuego(`¡Incorrecto! Era: ${triviaActual.a}`);
                }
                break;
            }
        }
    }

    function renderizar() {
        ctx.fillStyle = '#0d0221';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = colores.bg;
        ctx.fillRect(0, 0, canvas.width, 95);

        ctx.fillStyle = colores.neonCian;
        ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(triviaActual.q || "Cargando...", 240, 35);

        ctx.fillStyle = tiempoRestante > 3.0 ? colores.verde : colores.rojo;
        const tiempoMaximoFase = Math.max(4.0, 12.0 - (score * 0.3));
        const anchoBarra = (tiempoRestante / tiempoMaximoFase) * canvas.width;
        ctx.fillRect(0, 89, anchoBarra, 6);

        ctx.fillStyle = '#9a8fb8';
        ctx.font = '13px "Trebuchet MS", sans-serif';
        ctx.fillText(`Puntos: ${score}`, 240, 62);

        // BOTÓN FULLSCREEN
        ctx.strokeStyle = colores.neonCian; ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.beginPath(); ctx.roundRect(btnFullscreen.x, btnFullscreen.y, btnFullscreen.w, btnFullscreen.h, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText("FULL ⛶", btnFullscreen.x + btnFullscreen.w / 2, btnFullscreen.y + 16);

        // Dibujar bloques con sus respuestas
        for (const letra in bloques) {
            const b = bloques[letra];
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
            if (triviaActual.opciones) {
                ctx.fillText(triviaActual.opciones[letra], b.x + b.w / 2, b.y + b.h / 2 + 5);
            }
        }

        // Dibujar Personaje
        const px = personaje.x; const py = personaje.y; const size = personaje.size;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px + 2, py + size - 3, size - 4, 3);
        ctx.fillStyle = personaje.color; ctx.fillRect(px + 4, py, size - 8, size - 5); 
        ctx.fillStyle = colores.pantalon; ctx.fillRect(px + 4, py + size - 10, size - 8, 5);
        ctx.fillStyle = '#ffffff';
        let offsetPies = estaMoviendose ? Math.sin(contadorPasos) * 3 : 0;
        ctx.fillRect(px + 5, py + size - 5 + (offsetPies > 0 ? -2 : 0), 5, 5);
        ctx.fillRect(px + size - 10, py + size - 5 + (offsetPies < 0 ? -2 : 0), 5, 5);
        ctx.fillStyle = '#000000'; let ojoY = py + 6;
        if (direccionMirada === 'ABAJO') {
            ctx.fillRect(px + 7, ojoY, 3, 4); ctx.fillRect(px + size - 10, ojoY, 3, 4);
        } else if (direccionMirada === 'IZQUIERDA') {
            ctx.fillRect(px + 4, ojoY, 3, 4); ctx.fillRect(px + 10, ojoY, 3, 4);
        } else if (direccionMirada === 'DERECHA') {
            ctx.fillRect(px + size - 13, ojoY, 3, 4); ctx.fillRect(px + size - 7, ojoY, 3, 4);
        }
        ctx.restore();

        // Mandos móviles virtuales (Flechas dibujadas con vectores del mismo estilo)
        if (esMovil) {
            ctx.fillStyle = 'rgba(26, 11, 61, 0.6)';
            ctx.fillRect(0, 430, canvas.width, 80); 

            for (const dir in botonesMovil) {
                const btn = botonesMovil[dir];
                ctx.fillStyle = teclas[dir] ? colores.neonCian : 'rgba(0, 240, 255, 0.1)';
                ctx.strokeStyle = colores.neonCian; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 6); ctx.fill(); ctx.stroke();
                
                // DIBUJO VECTORIAL DE FLECHAS (Idénticas en cualquier dispositivo)
                ctx.fillStyle = teclas[dir] ? '#0d0221' : '#ffffff';
                ctx.beginPath();
                const cx = btn.x + btn.w / 2;
                const cy = btn.y + btn.h / 2;
                
                if (dir === 'ARRIBA') {
                    ctx.moveTo(cx, cy - 7); ctx.lineTo(cx + 8, cy + 5); ctx.lineTo(cx - 8, cy + 5);
                } else if (dir === 'ABAJO') {
                    ctx.moveTo(cx, cy + 7); ctx.lineTo(cx + 8, cy - 5); ctx.lineTo(cx - 8, cy - 5);
                } else if (dir === 'IZQUIERDA') {
                    ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 5, cy + 8); ctx.lineTo(cx + 5, cy - 8);
                } else if (dir === 'DERECHA') {
                    ctx.moveTo(cx + 7, cy); ctx.lineTo(cx - 5, cy + 8); ctx.lineTo(cx - 5, cy - 8);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    function buclePrincipal() {
        actualizar(); renderizar();
        if (juegoActivo) requestAnimationFrame(buclePrincipal);
    }

    function activarFullscreen() {
        if (canvas.requestFullscreen) { canvas.requestFullscreen(); }
        else if (canvas.webkitRequestFullscreen) { canvas.webkitRequestFullscreen(); }
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(e => console.log(e));
        }
    }

    function finalizarJuego(mensaje) {
        juegoActivo = false; 

        // Forzar la salida de pantalla completa para que no se oculte el div de HTML
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(e => console.log(e));
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }

        const gos = document.getElementById('game-over-screen');
        const msg = document.getElementById('final-score-msg');
        if (gos && msg) {
            msg.innerText = `${mensaje}\nPuntuación final: ${score} aciertos`;
            gos.style.display = 'flex';
        }

        const usuarioActual = localStorage.getItem('arcade_user') || 'Anónimo';

        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                juego: 'simon', 
                puntos: score,
                nombre: usuarioActual
            })
        }).catch(err => console.error(err));
    }

    const teclas = {};
    window.addEventListener('keydown', e => { teclas[e.key] = true; });
    window.addEventListener('keyup', e => { teclas[e.key] = false; });

    function manejarEntrada(clientX, clientY, estaPresionando) {
        const rect = canvas.getBoundingClientRect();
        const tX = ((clientX - rect.left) / rect.width) * canvas.width;
        const tY = ((clientY - rect.top) / rect.height) * canvas.height;

        if (estaPresionando && tX >= btnFullscreen.x && tX <= btnFullscreen.x + btnFullscreen.w && tY >= btnFullscreen.y && tY <= btnFullscreen.y + btnFullscreen.h) {
            activarFullscreen();
            return;
        }

        if (!juegoActivo) return;

        if (esMovil && tY >= 430) {
            for (const dir in botonesMovil) {
                const btn = botonesMovil[dir];
                if (tX >= btn.x && tX <= btn.x + btn.w && tY >= btn.y && tY <= btn.y + btn.h) {
                    teclas[dir] = estaPresionando;
                } else if (!estaPresionando) {
                    teclas[dir] = false;
                }
            }
        }
    }

    canvas.addEventListener('mousedown', e => manejarEntrada(e.clientX, e.clientY, true));
    canvas.addEventListener('mouseup', e => {
        manejarEntrada(e.clientX, e.clientY, false);
        for(let d in botonesMovil) teclas[d] = false;
    });

    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        Array.from(e.touches).forEach(t => manejarEntrada(t.clientX, t.clientY, true));
    }, {passive: false});

    canvas.addEventListener('touchend', e => {
        e.preventDefault();
        for(let d in botonesMovil) teclas[d] = false;
    }, {passive: false});

    inicializarCategoriaAleatoria();
    generarNuevaOrden();
    ultimaActualizacion = Date.now();
    buclePrincipal();
})();
