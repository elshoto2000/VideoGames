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
    canvas.height = 450;
    contenedor.insertBefore(canvas, contenedor.firstChild);

    const ctx = canvas.getContext('2d');

    // 2. VARIABLES DEL JUEGO
    let score = 0;
    let juegoActivo = true;
    let tiempoRestante = 4.0; 
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

    // Estado del Personaje
    const personaje = {
        x: 212,
        y: 240,
        size: 26,
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
    }

    function comprobarColision(p, b) {
        return p.x < b.x + b.w &&
               p.x + p.size > b.x &&
               p.y < b.y + b.h && // Corregido: b.h para la altura de colisión
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

        if (teclas['ArrowUp'] || teclas['w'] || teclas['W']) personaje.y -= personaje.speed * dt;
        if (teclas['ArrowDown'] || teclas['s'] || teclas['S']) personaje.y += personaje.speed * dt;
        if (teclas['ArrowLeft'] || teclas['a'] || teclas['A']) personaje.x -= personaje.speed * dt;
        if (teclas['ArrowRight'] || teclas['d'] || teclas['D']) personaje.x += personaje.speed * dt;

        if (personaje.x < 0) personaje.x = 0;
        if (personaje.x + personaje.size > canvas.width) personaje.x = canvas.width - personaje.size;
        if (personaje.y < 70) personaje.y = 70; 
        if (personaje.y + personaje.size > canvas.height) personaje.y = canvas.height - personaje.size;

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
        ctx.fillStyle = '#0d0221';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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

        ctx.shadowBlur = 10;
        ctx.shadowColor = colores.personaje;
        ctx.fillStyle = personaje.color;
        ctx.fillRect(personaje.x, personaje.y, personaje.size, personaje.size);
        ctx.shadowBlur = 0; 
    }

    function buclePrincipal() {
        actualizar();
        renderizar();
        if (juegoActivo) {
            requestAnimationFrame(buclePrincipal);
        }
    }

    // 6. DETENER JUEGO Y ENVIAR AL BACKEND (CORREGIDO SIN DUPLICADOS)
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

    // 7. LISTENERS DE CONTROLES
    window.addEventListener('keydown', e => { teclas[e.key] = true; });
    window.addEventListener('keyup', e => { teclas[e.key] = false; });

    canvas.addEventListener('click', e => {
        if (!juegoActivo) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

        for (const nombre in bloques) {
            const b = bloques[nombre];
            if (clickX >= b.x && clickX <= b.x + b.w && clickY >= b.y && clickY <= b.y + b.h) {
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
