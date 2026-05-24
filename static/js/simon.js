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
    canvas.height = 520; // Aumentamos la altura de 450 a 520 para que entren los botones móviles abajo si es necesario
    contenedor.insertBefore(canvas, contenedor.firstChild);

    const ctx = canvas.getContext('2d');

    // DETECTAR SI ES DISPOSITIVO MÓVIL
    const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);

    // 2. VARIABLES DEL JUEGO
    let score = 0;
    let juegoActivo = true;
    let tiempoRestante = 4.0; 
    let ultimaActualizacion = Date.now();

    // Variables para la animación de caminata
    let contadorPasos = 0;
    let estaMoviendose = false;
    let direccionMirada = 'ABAJO'; // Para saber hacia dónde apuntan los ojos ('ARRIBA', 'ABAJO', 'IZQUIERDA', 'DERECHA')

    // Colores del Arcade
    const colores = {
        bg: '#1a0b3d',
        rojo: '#ff4757',
        azul: '#00f0ff',
        verde: '#2ecc71',
        amarillo: '#ffd23f',
        personaje: '#ffffff',
        pantalon: '#ff6b81'
    };

    // Definición de los 4 bloques en las esquinas
    const bloques = {
        'ROJO':     { x: 20,  y: 80,  w: 140, h: 140, color: colores.rojo },
        'AZUL':     { x: 290, y: 80,  w: 140, h: 140, color: colores.azul },
        'VERDE':    { x: 20,  y: 290, w: 140, h: 140, color: colores.verde },
        'AMARILLO': { x: 290, y: 290, w: 140, h: 140, color: colores.amarillo }
    };

    // Configuración de los botones móviles (D-Pad en la parte inferior)
    const botonesMovil = {
        'ARRIBA':    { x: 225 - 25, y: 440, w: 50, h: 35 },
        'ABAJO':     { x: 225 - 25, y: 480, w: 50, h: 35 },
        'IZQUIERDA': { x: 165 - 25, y: 460, w: 50, h: 35 },
        'DERECHA':   { x: 285 - 25, y: 460, w: 50, h: 35 }
    };

    const nombresBloques = Object.keys(bloques);
    let bloqueObjetivo = '';

    // Estado del Personaje
    const personaje = {
        x: 212,
        y: 240,
        size: 26, // Un poquito más grande para notar los detalles
        speed: 320, 
        color: colores.personaje
    };

    const teclas = {};

    // 3. LOGICA ESPECÍFICA DEL JUEGO
    function generarNuevaOrden() {
        const indiceAleatorio = Math.floor(Math.random() * nombresBloques.length);
        bloqueObjetivo = nombresBloques[indiceAleatorio];
        
        tiempoRestante = Math.max(1.5, 4.0 - (score * 0.15)); 
        
        personaje.x = 225 - personaje.size / 2;
        personaje.y = 245 - personaje.size / 2;
        direccionMirada = 'ABAJO';
    }

    function comprobarColision(p, b) {
        return p.x < b.x + b.w &&
               p.x + p.size > b.x &&
               p.y < b.y + b.h && 
               p.y + p.size > b.y;
    }

    // 4. BUCLE DE ACTUALIZACIÓN
    function actualizar() {
        if (!juegoActivo) return;

        const ahora = Date.now();
        const dt = (ahora - ultimaActualizacion) / 1000; 
        ultimaActualizacion = ahora;

        tiempoRestante -= dt;
        if (tiempoRestante <= 0) {
            finalizarJuego("¡Te quedaste sin tiempo!");
            return;
        }

        let dx = 0;
        let dy = 0;

        // Movimiento por teclado
        if (teclas['ArrowUp'] || teclas['w'] || teclas['W']) { dy = -1; direccionMirada = 'ARRIBA'; }
        if (teclas['ArrowDown'] || teclas['s'] || teclas['S']) { dy = 1; direccionMirada = 'ABAJO'; }
        if (teclas['ArrowLeft'] || teclas['a'] || teclas['A']) { dx = -1; direccionMirada = 'IZQUIERDA'; }
        if (teclas['ArrowRight'] || teclas['d'] || teclas['D']) { dx = 1; direccionMirada = 'DERECHA'; }

        // Mover personaje
        if (dx !== 0 || dy !== 0) {
            estaMoviendose = true;
            contadorPasos += dt * 10; // Velocidad del balanceo de piernas
            
            personaje.x += dx * personaje.speed * dt;
            personaje.y += dy * personaje.speed * dt;
        } else {
            estaMoviendose = false;
            contadorPasos = 0; // Se queda firme al detenerse
        }

        // Límites de la pantalla de juego (área de los bloques)
        if (personaje.x < 0) personaje.x = 0;
        if (personaje.x + personaje.size > canvas.width) personaje.x = canvas.width - personaje.size;
        if (personaje.y < 70) personaje.y = 70; 
        if (personaje.y + personaje.size > 440) personaje.y = 440 - personaje.size; // No dejar que baje a la zona de botones

        // Validar si pisa bloques
        for (const nombre in bloques) {
            if (comprobarColision(personaje, bloques[nombre])) {
                if (nombre === bloqueObjetivo) {
                    score++;
                    generarNuevaOrden();
                } else {
                    finalizarJuego(`¡Simón dijo ${bloqueObjetivo}, no ${nombre}!`);
                }
                break;
            }
        }
    }

    // 5. DIBUJAR EN EL CANVAS
    function renderizar() {
        // Fondo principal
        ctx.fillStyle = '#0d0221';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar barra superior de estado
        ctx.fillStyle = colores.bg;
        ctx.fillRect(0, 0, canvas.width, 70);

        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SIMÓN DICE: ¡VE AL BLOQUE ${bloqueObjetivo}!`, canvas.width / 2, 32);

        ctx.fillStyle = tiempoRestante > 1.5 ? colores.verde : colores.rojo;
        const anchoBarra = (tiempoRestante / (4.0 - (score * 0.15))) * canvas.width;
        ctx.fillRect(0, 64, anchoBarra, 6);

        ctx.fillStyle = '#9a8fb8';
        ctx.font = '14px "Trebuchet MS", sans-serif';
        ctx.fillText(`Puntos: ${score}`, canvas.width / 2, 54);

        // Dibujar los 4 bloques
        for (const nombre in bloques) {
            const b = bloques[nombre];
            ctx.fillStyle = b.color;
            ctx.globalAlpha = (nombre === bloqueObjetivo) ? 1.0 : 0.4; 
            ctx.fillRect(b.x, b.y, b.w, b.h);
            
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
            ctx.fillText(nombre, b.x + b.w / 2, b.y + b.h / 2 + 5);
        }

        // --- DIBUJAR PERSONITA WALK (Píxel Art procedural) ---
        const px = personaje.x;
        const py = personaje.y;
        const size = personaje.size;

        ctx.save();
        // Sombra de los pies
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(px + 2, py + size - 4, size - 4, 4);

        // Cabeza / Cuerpo (Blanco pixel)
        ctx.fillStyle = personaje.color;
        ctx.fillRect(px + 4, py, size - 8, size - 6); // Cabeza y torso juntos estilo fantasía/guerrero

        // Pantalón / Base del cuerpo
        ctx.fillStyle = colores.pantalon;
        ctx.fillRect(px + 4, py + size - 10, size - 8, 5);

        // Animación de los Pies (Oscilación izquierda/derecha al caminar)
        ctx.fillStyle = '#ffffff';
        let offsetPies = estaMoviendose ? Math.sin(contadorPasos) * 3 : 0;
        
        // Pie Izquierdo
        ctx.fillRect(px + 5, py + size - 5 + (offsetPies > 0 ? -2 : 0), 5, 5);
        // Pie Derecho
        ctx.fillRect(px + size - 10, py + size - 5 + (offsetPies < 0 ? -2 : 0), 5, 5);

        // --- LOS OJOS DINÁMICOS ---
        ctx.fillStyle = '#000000'; // Ojos negros pixelados
        let ojoY = py + 6;
        
        if (direccionMirada === 'ABAJO') {
            ctx.fillRect(px + 7, ojoY, 3, 4);
            ctx.fillRect(px + size - 10, ojoY, 3, 4);
        } else if (direccionMirada === 'IZQUIERDA') {
            ctx.fillRect(px + 3, ojoY, 3, 4);
            ctx.fillRect(px + 10, ojoY, 3, 4);
        } else if (direccionMirada === 'DERECHA') {
            ctx.fillRect(px + size - 13, ojoY, 3, 4);
            ctx.fillRect(px + size - 6, ojoY, 3, 4);
        } else if (direccionMirada === 'ARRIBA') {
            // De espaldas no se le ven los ojos, ¡así que no se dibuja nada!
        }
        ctx.restore();

        // --- DIBUJAR BOTONES SOLO SI ES MÓVIL ---
        if (esMovil) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(0, 430, canvas.width, 90); // Contenedor del D-PAD

            for (const dir in botonesMovil) {
                const btn = botonesMovil[dir];
                
                // Si la tecla virtual está activa, brilla
                ctx.fillStyle = teclas[dir] ? 'var(--neon-cyan)' : 'rgba(0, 240, 255, 0.2)';
                ctx.strokeStyle = 'var(--neon-cyan)';
                ctx.lineWidth = 2;
                
                // Dibujar botón redondeado estilizado
                ctx.beginPath();
                ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 8);
                ctx.fill();
                ctx.stroke();

                // Texto de la flecha
                ctx.fillStyle = teclas[dir] ? '#0d0221' : '#ffffff';
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                let flecha = '';
                if (dir === 'ARRIBA') flecha = '▲';
                if (dir === 'ABAJO') flecha = '▼';
                if (dir === 'IZQUIERDA') flecha = '◀';
                if (dir === 'DERECHA') flecha = '▶';
                ctx.fillText(flecha, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
            }
        }
    }

    function buclePrincipal() {
        actualizar();
        renderizar();
        if (juegoActivo) {
            requestAnimationFrame(buclePrincipal);
        }
    }

    // 6. DETENER JUEGO Y ENVIAR AL BACKEND
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
        })
        .then(response => response.json())
        .then(data => console.log("Puntaje guardado:", data))
        .catch(err => console.error("Error guardando puntaje:", err));
    }

    // 7. LISTENERS DE CONTROLES (Teclado)
    window.addEventListener('keydown', e => { teclas[e.key] = true; });
    window.addEventListener('keyup', e => { teclas[e.key] = false; });

    // CONTROLES TÁCTILES AUTOMÁTICOS PARA CELULAR (Soporte D-Pad y Clic en bloques)
    function procesarToque(clientX, clientY, activar) {
        if (!juegoActivo) return;
        const rect = canvas.getBoundingClientRect();
        const touchX = ((clientX - rect.left) / rect.width) * canvas.width;
        const touchY = ((clientY - rect.top) / rect.height) * canvas.height;

        // 1. Validar si está presionando las flechas del D-PAD
        if (esMovil && touchY >= 430) {
            for (const dir in botonesMovil) {
                const btn = botonesMovil[dir];
                if (touchX >= btn.x && touchX <= btn.x + btn.w && touchY >= btn.y && touchY <= btn.y + btn.h) {
                    teclas[dir] = activar;
                    return;
                }
            }
        } 
        // 2. Si es un toque arriba en los bloques (acción directa al soltar/hacer click)
        else if (!activar) { 
            for (const nombre in bloques) {
                const b = bloques[nombre];
                if (touchX >= b.x && touchX <= b.x + b.w && touchY >= b.y && touchY <= b.y + b.h) {
                    if (nombre === bloqueObjetivo) {
                        score++;
                        generarNuevaOrden();
                    } else {
                        finalizarJuego(`¡Simón dijo ${bloqueObjetivo}, no ${nombre}!`);
                    }
                    break;
                }
            }
        }
    }

    // Eventos para Mouse
    canvas.addEventListener('mousedown', e => procesarToque(e.clientX, e.clientY, true));
    canvas.addEventListener('mouseup', e => {
        procesarToque(e.clientX, e.clientY, false);
        // Limpiar todas las direcciones por si acaso se arrastra fuera
        for(let d in botonesMovil) teclas[d] = false;
    });

    // Eventos para Pantallas Táctiles
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        procesarToque(e.touches[0].clientX, e.touches[0].clientY, true);
    }, {passive: false});

    canvas.addEventListener('touchend', e => {
        e.preventDefault();
        // Al levantar el dedo limpiamos los estados de movimiento
        for(let d in botonesMovil) teclas[d] = false;
        if(e.changedTouches.length > 0) {
            procesarToque(e.changedTouches[0].clientX, e.changedTouches[0].clientY, false);
        }
    }, {passive: false});

    // Iniciar
    generarNuevaOrden();
    ultimaActualizacion = Date.now();
    buclePrincipal();
})();
