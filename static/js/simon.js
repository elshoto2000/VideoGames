(function () {
    const contenedor = document.querySelector('.canvas-placeholder');
    if (!contenedor) return;

    // 1. LIMPIEZA Y CONFIGURACIÓN DEL CANVAS
    // Removemos cualquier elemento viejo excepto la pantalla de Game Over
    Array.from(contenedor.children).forEach(child => {
        if (child.id !== 'game-over-screen') child.remove();
    });

    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.width = 450;
    canvas.height = 450;
    contenedor.insertBefore(canvas, contenedor.firstChild);

    const ctx = canvas.getContext('2d');

    // 2. VARIABLES DEL JUEGO
    let score = 0;
    let juegoActivo = true;
    let tiempoRestante = 4.0; // Segundos para llegar al bloque
    let ultimaActualizacion = Date.now();

    // Colores del Arcade
    const colores = {
        bg: '#1a0b3d',
        rojo: '#ff4757',
        azul: '#00f0ff',
        verde: '#2ecc71',
        amarillo: '#ffd23f',
        personaje: '#ffffff'
    };

    // Definición de los 4 bloques en las esquinas
    const bloques = {
        'ROJO':     { x: 20,  y: 80,  w: 140, h: 140, color: colores.rojo },
        'AZUL':     { x: 290, y: 80,  w: 140, h: 140, color: colores.azul },
        'VERDE':    { x: 20,  y: 290, w: 140, h: 140, color: colores.verde },
        'AMARILLO': { x: 290, y: 290, w: 140, h: 140, color: colores.amarillo }
    };

    const nombresBloques = Object.keys(bloques);
    let bloqueObjetivo = '';

    // Estado del Personaje (Inicia exactamente en el centro)
    const personaje = {
        x: 212,
        y: 240,
        size: 26,
        speed: 320, // Velocidad en píxeles por segundo
        color: colores.personaje
    };

    // Teclas presionadas
    const teclas = {};

    // 3. LOGICA ESPECÍFICA DEL JUEGO
    function generarNuevaOrden() {
        const indiceAleatorio = Math.floor(Math.random() * nombresBloques.length);
        bloqueObjetivo = nombresBloques[indiceAleatorio];
        
        // El tiempo se reduce un poquito en cada ronda para hacerlo más difícil
        tiempoRestante = Math.max(1.5, 4.0 - (score * 0.15)); 
        
        // Devolvemos al personaje al centro para la nueva ronda
        personaje.x = 225 - personaje.size / 2;
        personaje.y = 245 - personaje.size / 2;
    }

    function comprobarColision(p, b) {
        return p.x < b.x + b.w &&
               p.x + p.size > b.x &&
               p.y < b.y + b.w &&
               p.y + p.size > b.y;
    }

    // 4. BUCLE DE ACTUALIZACIÓN (MOVIMIENTO Y TIEMPO)
    function actualizar() {
        if (!juegoActivo) return;

        const ahora = Date.now();
        const dt = (ahora - ultimaActualizacion) / 1000; // Delta time en segundos
        ultimaActualizacion = ahora;

        // Reducir temporizador
        tiempoRestante -= dt;
        if (tiempoRestante <= 0) {
            finalizarJuego("¡Te quedaste sin tiempo!");
            return;
        }

        // Movimiento fluido del jugador basado en DT
        if (teclas['ArrowUp'] || teclas['w'] || teclas['W']) personaje.y -= personaje.speed * dt;
        if (teclas['ArrowDown'] || teclas['s'] || teclas['S']) personaje.y += personaje.speed * dt;
        if (teclas['ArrowLeft'] || teclas['a'] || teclas['A']) personaje.x -= personaje.speed * dt;
        if (teclas['ArrowRight'] || teclas['d'] || teclas['D']) personaje.x += personaje.speed * dt;

        // Límites de la pantalla cuadrada
        if (personaje.x < 0) personaje.x = 0;
        if (personaje.x + personaje.size > canvas.width) personaje.x = canvas.width - personaje.size;
        if (personaje.y < 70) personaje.y = 70; // Espacio libre para la orden superior
        if (personaje.y + personaje.size > canvas.height) personaje.y = canvas.height - personaje.size;

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
        // Limpiar pantalla
        ctx.fillStyle = '#0d0221';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar barra superior de estado
        ctx.fillStyle = colores.bg;
        ctx.fillRect(0, 0, canvas.width, 70);

        // Texto de orden de Simón
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SIMÓN DICE: ¡VE AL BLOQUE ${bloqueObjetivo}!`, canvas.width / 2, 32);

        // Barra de tiempo dinámico
        ctx.fillStyle = tiempoRestante > 1.5 ? colores.verde : colores.rojo;
        const anchoBarra = (tiempoRestante / (4.0 - (score * 0.15))) * canvas.width;
        ctx.fillRect(0, 64, anchoBarra, 6);

        // Texto de Score actual
        ctx.fillStyle = '#9a8fb8';
        ctx.font = '14px "Trebuchet MS", sans-serif';
        ctx.fillText(`Puntos: ${score}`, canvas.width / 2, 54);

        // Dibujar los 4 bloques
        for (const nombre in bloques) {
            const b = bloques[nombre];
            ctx.fillStyle = b.color;
            ctx.globalAlpha = (nombre === bloqueObjetivo) ? 1.0 : 0.4; // Brilla más el bloque objetivo
            ctx.fillRect(b.x, b.y, b.w, b.h);
            
            // Texto identificador dentro del bloque
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
            ctx.fillText(nombre, b.x + b.w / 2, b.y + b.h / 2 + 5);
        }

        // Dibujar Personaje (Cuadrado con sombra neón)
        ctx.shadowBlur = 10;
        ctx.shadowColor = colores.personaje;
        ctx.fillStyle = personaje.color;
        ctx.fillRect(personaje.x, personaje.y, personaje.size, personaje.size);
        ctx.shadowBlur = 0; // Apagar sombra para el resto
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
        juegoActive = false;
        juegoActivo = false;
        
        // Mostrar pantalla de Game Over incorporada en juego.html
        const gos = document.getElementById('game-over-screen');
        const msg = document.getElementById('final-score-msg');
        if (gos && msg) {
            msg.innerText = `${mensaje}\nPuntuación final: ${score} aciertos`;
            gos.style.display = 'flex';
        }

        // Enviar score a Flask vía POST automático
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ juego: 'simon', puntos: score })
        })
        .then(response => response.json())
        .then(data => console.log("Puntaje guardado:", data))
        .catch(err => console.error("Error guardando puntaje:", err));
    }

    // 7. LISTENERS DE CONTROLES (Teclado y clics táctiles para móviles)
    window.addEventListener('keydown', e => { teclas[e.key] = true; });
    window.addEventListener('keyup', e => { teclas[e.key] = false; });

    // Clics directos en los bloques para soporte móvil/mouse
    canvas.addEventListener('click', e => {
        if (!juegoActivo) return;
        const rect = canvas.getBoundingClientRect();
        // Escalar coordenadas reales del canvas
        const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

        // Comprobar si el clic cayó en algún bloque
        for (const nombre in bloques) {
            const b = bloques[nombre];
            if (clickX >= b.x && clickX <= b.x + b.w && clickX >= b.y && clickX <= b.y + b.h) {
                if (nombre === bloqueObjetivo) {
                    score++;
                    generarNuevaOrden();
                } else {
                    finalizarJuego(`¡Simón dijo ${bloqueObjetivo}, no ${nombre}!`);
                }
                break;
            }
        }
    });

    // Iniciar
    generarNuevaOrden();
    ultimaActualizacion = Date.now();
    buclePrincipal();
})();
