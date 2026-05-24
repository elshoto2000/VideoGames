(function () {
    const contenedor = document.querySelector('.canvas-placeholder');
    if (!contenedor) return;

    // 1. LIMPIEZA Y CONFIGURACIÓN DEL CANVAS
    Array.from(contenedor.children).forEach(child => {
        if (child.id !== 'game-over-screen') child.remove();
    });

    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.width = 450;
    canvas.height = 510; 
    contenedor.insertBefore(canvas, contenedor.firstChild);

    const ctx = canvas.getContext('2d');
    const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);

    // Contexto de Audio para efectos retro sin archivos externos
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function reproducirSonido(frecuencia, tipo, duracion) {
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = tipo;
            osc.frequency.value = frecuencia;
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duracion);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duracion);
        } catch(e) { console.log("Audio no iniciado aún"); }
    }

    // 2. VARIABLES DEL JUEGO y BANCO DE PREGUNTAS (Estilo Dinámico)
    let score = 0;
    let juegoActivo = true;
    let tiempoRestante = 5.0; 
    let ultimaActualizacion = Date.now();

    let contadorPasos = 0;
    let estaMoviendose = false;
    let direccionMirada = 'ABAJO';

    const colores = {
        bg: '#1a0b3d', rojo: '#ff4757', azul: '#00f0ff', verde: '#2ecc71', amarillo: '#ffd23f',
        personaje: '#ffffff', pantalon: '#ff6b81', neonCian: '#00f0ff'
    };

    const bloques = {
        'A': { x: 30,  y: 110, w: 130, h: 110, color: colores.rojo },
        'B': { x: 290, y: 110, w: 130, h: 110, color: colores.azul },
        'C': { x: 30,  y: 300, w: 130, h: 110, color: colores.verde },
        'D': { x: 290, y: 300, w: 130, h: 110, color: colores.amarillo }
    };

    const botonesMovil = {
        'ARRIBA':    { x: 225 - 25, y: 435, w: 50, h: 32 },
        'ABAJO':     { x: 225 - 25, y: 472, w: 50, h: 32 },
        'IZQUIERDA': { x: 165 - 25, y: 454, w: 50, h: 32 },
        'DERECHA':   { x: 285 - 25, y: 454, w: 50, h: 32 }
    };

    // Banco de preguntas adaptado a tu nueva mecánica de respuestas en bloques
    const preguntasTrivia = [
        { q: "¿Cuánto es 5 + 5?", a: "10", opciones: { 'A': '12', 'B': '10', 'C': '8', 'D': '15' } },
        { q: "¿Cuál es el color del cielo?", a: "Azul", opciones: { 'A': 'Rojo', 'B': 'Verde', 'C': 'Azul', 'D': 'Gris' } },
        { q: "Creador de este juego:", a: "Leandro", opciones: { 'A': 'Juan', 'B': 'Leandro', 'C': 'Pedro', 'D': 'Diego' } },
        { q: "Mundo de bloques 3D:", a: "Minecraft", opciones: { 'A': 'Terraria', 'B': 'Roblox', 'C': 'Pacman', 'D': 'Minecraft' } }
    ];

    let triviaActual = {};
    let bloqueCorrecto = '';

    const personaje = { x: 212, y: 240, size: 26, speed: 320, color: colores.personaje };
    const teclas = {};

    function generarNuevaOrden() {
        // Elegir pregunta aleatoria
        triviaActual = preguntasTrivia[Math.floor(Math.random() * preguntasTrivia.length)];
        
        // Encontrar qué bloque contiene la respuesta correcta
        for (let letra in triviaActual.opciones) {
            if (triviaActual.opciones[letra] === triviaActual.a) {
                bloqueCorrecto = letra;
                break;
            }
        }

        tiempoRestante = Math.max(2.5, 6.0 - (score * 0.2)); 
        personaje.x = 225 - personaje.size / 2;
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
            reproducirSonido(150, 'sawtooth', 0.6); // Sonido de derrota largo
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
        } else {
            estaMoviendose = false;
            contadorPasos = 0;
        }

        if (personaje.x < 0) personaje.x = 0;
        if (personaje.x + personaje.size > canvas.width) personaje.x = canvas.width - personaje.size;
        if (personaje.y < 95) personaje.y = 95; 
        if (personaje.y + personaje.size > 430) personaje.y = 430 - personaje.size;

        // VERIFICACIÓN ESTRICTA: El personaje debe entrar al bloque físicamente
        for (const letra in bloques) {
            if (comprobarColision(personaje, bloques[letra])) {
                if (letra === bloqueCorrecto) {
                    reproducirSonido(600, 'triangle', 0.15); // Sonido retro de acierto (Beep agudo)
                    score++;
                    generarNuevaOrden();
                } else {
                    reproducirSonido(150, 'sawtooth', 0.5); // Sonido retro de fallo (Bzzz grave)
                    finalizarJuego(`¡Incorrecto! La respuesta era: ${triviaActual.a}`);
                }
                break;
            }
        }
    }

    function renderizar() {
        ctx.fillStyle = '#0d0221';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Barra superior fija para la pregunta
        ctx.fillStyle = colores.bg;
        ctx.fillRect(0, 0, canvas.width, 95);

        ctx.fillStyle = colores.neonCian;
        ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        // Mostrar la pregunta dinámica de la Trivia
        ctx.fillText(triviaActual.q, canvas.width / 2, 32);

        ctx.fillStyle = tiempoRestante > 1.5 ? colores.verde : colores.rojo;
        const anchoBarra = (tiempoRestante / 5.0) * canvas.width;
        ctx.fillRect(0, 89, anchoBarra, 6);

        ctx.fillStyle = '#9a8fb8';
        ctx.font = '13px "Trebuchet MS", sans-serif';
        ctx.fillText(`Puntos: ${score}`, canvas.width / 2, 60);

        // Dibujar bloques con sus respuestas dinámicas adentro
        for (const letra in bloques) {
            const b = bloques[letra];
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
            // Dibujar la opción de respuesta que le toca a este bloque
            ctx.fillText(triviaActual.opciones[letra], b.x + b.w / 2, b.y + b.h / 2 + 5);
        }

        // Dibujar Personaje con ojos y animación de pies
        const px = personaje.x; const py = personaje.y; const size = personaje.size;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(px + 2, py + size - 3, size - 4, 3);
        ctx.fillStyle = personaje.color;
        ctx.fillRect(px + 4, py, size - 8, size - 5); 
        ctx.fillStyle = colores.pantalon;
        ctx.fillRect(px + 4, py + size - 10, size - 8, 5);
        ctx.fillStyle = '#ffffff';
        let offsetPies = estaMoviendose ? Math.sin(contadorPasos) * 3 : 0;
        ctx.fillRect(px + 5, py + size - 5 + (offsetPies > 0 ? -2 : 0), 5, 5);
        ctx.fillRect(px + size - 10, py + size - 5 + (offsetPies < 0 ? -2 : 0), 5, 5);
        ctx.fillStyle = '#000000';
        let ojoY = py + 6;
        if (direccionMirada === 'ABAJO') {
            ctx.fillRect(px + 7, ojoY, 3, 4); ctx.fillRect(px + size - 10, ojoY, 3, 4);
        } else if (direccionMirada === 'IZQUIERDA') {
            ctx.fillRect(px + 4, ojoY, 3, 4); ctx.fillRect(px + 10, ojoY, 3, 4);
        } else if (direccionMirada === 'DERECHA') {
            ctx.fillRect(px + size - 13, ojoY, 3, 4); ctx.fillRect(px + size - 7, ojoY, 3, 4);
        }
        ctx.restore();

        // D-PAD Virtual para celulares
        if (esMovil) {
            ctx.fillStyle = 'rgba(26, 11, 61, 0.6)';
            ctx.fillRect(0, 430, canvas.width, 80); 

            for (const dir in botonesMovil) {
                const btn = botonesMovil[dir];
                ctx.fillStyle = teclas[dir] ? colores.neonCian : 'rgba(0, 240, 255, 0.1)';
                ctx.strokeStyle = colores.neonCian;
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 6); ctx.fill(); ctx.stroke();
                ctx.fillStyle = teclas[dir] ? '#0d0221' : '#ffffff';
                ctx.font = 'bold 14px sans-serif';
                let flecha = (dir === 'ARRIBA') ? '▲' : (dir === 'ABAJO') ? '▼' : (dir === 'IZQUIERDA') ? '◀' : '▶';
                ctx.fillText(flecha, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
            }
        }
    }

    function buclePrincipal() {
        actualizar(); renderizar();
        if (juegoActivo) requestAnimationFrame(buclePrincipal);
    }

    function finalizarJuego(mensaje) {
        juegoActivo = false; 
        const gos = document.getElementById('game-over-screen');
        const msg = document.getElementById('final-score-msg');
        if (gos && msg) {
            msg.innerText = `${mensaje}\nPuntuación final: ${score} aciertos`;
            gos.style.display = 'flex';
        }
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ juego: 'simon', puntos: score })
        }).catch(err => console.error(err));
    }

    window.addEventListener('keydown', e => { teclas[e.key] = true; if(audioCtx.state === 'suspended') audioCtx.resume(); });
    window.addEventListener('keyup', e => { teclas[e.key] = false; });

    function manejarEntrada(clientX, clientY, estaPresionando) {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        if (!juegoActivo) return;

        const rect = canvas.getBoundingClientRect();
        const tX = ((clientX - rect.left) / rect.width) * canvas.width;
        const tY = ((clientY - rect.top) / rect.height) * canvas.height;

        // TOCAR EL D-PAD: Solo funciona si estás en la zona baja del control
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

    generarNuevaOrden();
    ultimaActualizacion = Date.now();
    buclePrincipal();
})();
