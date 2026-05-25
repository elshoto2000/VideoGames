// js/simon.js
(function () {
    console.log("Iniciando Módulo Simón Dice con Soporte de Preguntas...");

    // ==========================================
    // 1. CONFIGURACIÓN DE ELEMENTOS Y CANVAS
    // ==========================================
    const canvasPlaceholder = document.querySelector('.canvas-placeholder');
    if (!canvasPlaceholder) {
        console.error("No se encontró el contenedor .canvas-placeholder en el HTML.");
        return;
    }

    // Limpieza de duplicados previos en el DOM
    const canvasViejo = document.getElementById('game-canvas');
    if (canvasViejo) canvasViejo.remove();

    // Creación del Canvas Principal
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.width = 480;
    canvas.height = 480;
    canvasPlaceholder.insertBefore(canvas, canvasPlaceholder.firstChild);

    const ctx = canvas.getContext('2d');

    // ==========================================
    // 2. ESTADO DEL JUEGO Y VARIABLES DE SESIÓN
    // ==========================================
    let secuenciaIA = [];
    let secuenciaJugador = [];
    let rondaActual = 0;
    let indiceListaPreguntas = 0; // 0: Web, 1: Python/SQL, 2: Física
    let juegoBloqueado = true; // Bloquea clics mientras la IA muestra los colores
    let cuadranteIluminado = null; 
    let preguntaUsadaEnEstaRonda = false;

    // Dimensiones y centro del Simon
    const centroX = canvas.width / 2;
    const centroY = canvas.height / 2;
    const radioExterior = 220;
    const radioInterior = 70;

    // Colores base y colores brillantes cuando se activan
    const CONFIG_COLORES = {
        0: { base: "#006400", brillo: "#00FF00", nombre: "Verde" },   // Arriba-Izquierda
        1: { base: "#8B0000", brillo: "#FF0000", nombre: "Rojo" },    // Arriba-Derecha
        2: { base: "#8B8B00", brillo: "#FFFF00", nombre: "Amarillo" },// Abajo-Izquierda
        3: { base: "#00008B", brillo: "#0000FF", nombre: "Azul" }     // Abajo-Derecha
    };

    // ==========================================
    // 3. SELECCIÓN DINÁMICA DE PREGUNTAS
    // ==========================================
    function obtenerPreguntaAleatoria() {
        // Validamos que el banco de preguntas esté inyectado en el entorno global de la ventana
        if (!window.BancoPreguntasArcade || !window.BancoPreguntasArcade[indiceListaPreguntas]) {
            console.warn("Banco de preguntas global no disponible. Usando plantilla de respaldo.");
            return {
                q: "¿Qué significa JS?",
                opciones: { A: "JavaScript", B: "JavaSource", C: "JustStyle", D: "JQueryScript" },
                a: "JavaScript"
            };
        }
        const listaFiltro = window.BancoPreguntasArcade[indiceListaPreguntas];
        const indiceAleatorio = Math.floor(Math.random() * listaFiltro.length);
        return listaFiltro[indiceAleatorio];
    }

    // Determina qué lista de preguntas usar basándose en la ronda del juego
    function actualizarDificultadPreguntas() {
        if (rondaActual <= 4) {
            indiceListaPreguntas = 0; // Rondas 1-4: HTML, CSS, WordPress
        } else if (rondaActual <= 9) {
            indiceListaPreguntas = 1; // Rondas 5-9: Python y SQL
        } else {
            indiceListaPreguntas = 2; // Rondas 10+: Física
        }
    }

    // ==========================================
    // 4. SISTEMA DE RENDERIZADO (DIBUJO DE CANVAS)
    // ==========================================
    function dibujarArcoSegmento(startAngle, endAngle, color, esCentro = false) {
        ctx.beginPath();
        ctx.arc(centroX, centroY, radioExterior, startAngle, endAngle);
        ctx.arc(centroX, centroY, radioInterior, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#111625";
        ctx.stroke();
    }

    function renderizarSimonDice() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Cuadrante 0: Verde (Arriba Izquierda: 180° a 270° -> π a 1.5π)
        dibujarArcoSegmento(Math.PI, 1.5 * Math.PI, cuadranteIluminado === 0 ? CONFIG_COLORES[0].brillo : CONFIG_COLORES[0].base);

        // Cuadrante 1: Rojo (Arriba Derecha: 270° a 360° -> 1.5π a 2π)
        dibujarArcoSegmento(1.5 * Math.PI, 2 * Math.PI, cuadranteIluminado === 1 ? CONFIG_COLORES[1].brillo : CONFIG_COLORES[1].base);

        // Cuadrante 2: Amarillo (Abajo Izquierda: 90° a 180° -> 0.5π a π)
        dibujarArcoSegmento(0.5 * Math.PI, Math.PI, cuadranteIluminado === 2 ? CONFIG_COLORES[2].brillo : CONFIG_COLORES[2].base);

        // Cuadrante 3: Azul (Abajo Derecha: 0° a 90° -> 0 a 0.5π)
        dibujarArcoSegmento(0, 0.5 * Math.PI, cuadranteIluminado === 3 ? CONFIG_COLORES[3].brillo : CONFIG_COLORES[3].base);

        // Botón o Anillo Central Decorativo
        ctx.beginPath();
        ctx.arc(centroX, centroY, radioInterior, 0, 2 * Math.PI);
        ctx.fillStyle = "#1a1f2c";
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#FFD700"; // Anillo dorado central
        ctx.stroke();

        // Texto de puntuación en el centro
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`R41`, centroX, centroY - 12);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#00FF00";
        ctx.fillText(`Pts: ${rondaActual}`, centroX, centroY + 15);
    }

    // ==========================================
    // 5. MECÁNICAS DE CONTROL E ILUMINACIÓN
    // ==========================================
    function iluminarCuadrante(id, duracion = 400) {
        cuadranteIluminado = id;
        renderizarSimonDice();
        setTimeout(() => {
            if (cuadranteIluminado === id) {
                cuadranteIluminado = null;
                renderizarSimonDice();
            }
        }, duracion);
    }

    function reproducirSecuenciaIA() {
        juegoBloqueado = true;
        secuenciaJugador = [];
        actualizarDificultadPreguntas();
        
        let i = 0;
        const intervalo = setInterval(() => {
            if (i >= secuenciaIA.length) {
                clearInterval(intervalo);
                juegoBloqueado = false; // Le cedemos el turno al usuario
                return;
            }
            iluminarCuadrante(secuenciaIA[i]);
            i++;
        }, 600);
    }

    function añadirPasoYContinuar() {
        rondaActual++;
        preguntaUsadaEnEstaRonda = false;
        const nuevoColorId = Math.floor(Math.random() * 4);
        secuenciaIA.push(nuevoColorId);
        setTimeout(reproducirSecuenciaIA, 800);
    }

    // ==========================================
    // 6. SISTEMA DE SALVACIÓN POR PREGUNTA (MODAL)
    // ==========================================
    function lanzarModalPreguntaSalvacion() {
        juegoBloqueado = true;
        preguntaUsadaEnEstaRonda = true;

        const dataPregunta = obtenerPreguntaAleatoria();

        // Creación e inyección del modal en el árbol HTML dinámicamente
        const contenedorModal = document.createElement('div');
        contenedorModal.id = 'arcade-quiz-modal';
        contenedorModal.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(10, 14, 23, 0.95); display: flex;
            justify-content: center; align-items: center; z-index: 99999;
            font-family: sans-serif; color: #fff; padding: 20px;
        `;

        const tarjetaEstructura = document.createElement('div');
        tarjetaEstructura.style = `
            background: #1f2638; padding: 30px; border-radius: 12px;
            max-width: 500px; width: 100%; box-shadow: 0 8px 32px rgba(0,255,0,0.2);
            border: 2px solid #00ff00; text-align: center;
        `;

        const categoriaTexto = indiceListaPreguntas === 0 ? "DESARROLLO WEB" : indiceListaPreguntas === 1 ? "PROGRAMACIÓN (PYTHON / SQL)" : "FÍSICA COMPLETA";
        
        tarjetaEstructura.innerHTML = `
            <h3 style="color: #00ff00; margin-top: 0; letter-spacing: 2px;">SALVACIÓN EXTRA</h3>
            <p style="font-size: 13px; color: #8a99ad; margin-bottom: 20px;">Categoría: ${categoriaTexto}</p>
            <h2 style="font-size: 18px; margin-bottom: 25px; line-height: 1.5;">${dataPregunta.q}</h2>
            <div id="quiz-options-box" style="display: grid; grid-template-columns: 1fr; gap: 12px;"></div>
        `;

        contenedorModal.appendChild(tarjetaEstructura);
        document.body.appendChild(contenedorModal);

        const cajaBotones = tarjetaEstructura.querySelector('#quiz-options-box');

        // Renderizado de las claves A, B, C, D
        Object.keys(dataPregunta.opciones).forEach(clave => {
            const textoOpcion = dataPregunta.opciones[clave];
            const botonOp = document.createElement('button');
            botonOp.style = `
                background: #29344f; color: #fff; border: 1px solid #41537a;
                padding: 14px; border-radius: 6px; cursor: pointer; text-align: left;
                font-size: 15px; transition: all 0.2s ease;
            `;
            botonOp.innerText = `${clave}) ${textoOpcion}`;

            botonOp.onmouseover = () => { botonOp.style.background = '#36466b'; };
            botonOp.onmouseout = () => { botonOp.style.background = '#29344f'; };

            botonOp.onclick = () => {
                // Desactivamos todos los clics inmediatos en el modal para prevenir doble entrada
                const todosLosBotones = cajaBotones.querySelectorAll('button');
                todosLosBotones.forEach(b => b.disabled = true);

                if (textoOpcion === dataPregunta.a) {
                    // ¡Correcto! Se salva
                    botonOp.style.background = '#006400';
                    botonOp.style.borderColor = '#00ff00';
                    setTimeout(() => {
                        contenedorModal.remove();
                        alert("¡Respuesta Correcta! Continúas en la ronda.");
                        // Reintentar la misma ronda: IA la repite para que recuerdes la secuencia
                        setTimeout(reproducirSecuenciaIA, 600);
                    }, 1200);
                } else {
                    // Incorrecto: Pierde definitivamente
                    botonOp.style.background = '#8b0000';
                    botonOp.style.borderColor = '#ff0000';
                    setTimeout(() => {
                        contenedorModal.remove();
                        terminarPartidaDefinitivamente();
                    }, 1200);
                }
            };

            cajaBotones.appendChild(botonOp);
        });
    }

    function terminarPartidaDefinitivamente() {
        console.log("Finalizando juego. Puntuación conseguida:", rondaActual);
        if (typeof window.finalizarJuego === "function") {
            window.finalizarJuego(rondaActual);
        } else {
            alert(`Fin del juego. Conseguiste: ${rondaActual} puntos.`);
            location.reload();
        }
    }

    // ==========================================
    // 7. CAPTURA Y EVALUACIÓN DE CLICS DEL MOUSE
    // ==========================================
    canvas.onclick = function (evento) {
        if (juegoBloqueado) return;

        // Coordenadas locales respecto a las dimensiones de render del lienzo
        const rect = canvas.getBoundingClientRect();
        const xClic = evento.clientX - rect.left;
        const yClic = evento.clientY - rect.top;

        // Distancia del centro para validar si el clic ocurrió dentro de la dona
        const distanciaCentro = Math.sqrt(Math.pow(xClic - centroX, 2) + Math.pow(yClic - centroY, 2));

        if (distanciaCentro < radioInterior || distanciaCentro > radioExterior) {
            return; // Clic fuera del área de juego
        }

        let cuadranteSeleccionado = null;

        if (xClic < centroX && yClic < centroY) cuadranteSeleccionado = 0; // Arriba Izq
        else if (xClic >= centroX && yClic < centroY) cuadranteSeleccionado = 1; // Arriba Der
        else if (xClic < centroX && yClic >= centroY) cuadranteSeleccionado = 2; // Abajo Izq
        else if (xClic >= centroX && yClic >= centroY) cuadranteSeleccionado = 3; // Abajo Der

        if (cuadranteSeleccionado !== null) {
            iluminarCuadrante(cuadranteSeleccionado, 250);
            secuenciaJugador.push(cuadranteSeleccionado);

            // Validar si el paso actual coincide con la IA
            const indiceVerificacion = secuenciaJugador.length - 1;
            if (cuadranteSeleccionado !== secuenciaIA[indiceVerificacion]) {
                // El jugador cometió un error
                if (!preguntaUsadaEnEstaRonda) {
                    lanzarModalPreguntaSalvacion();
                } else {
                    terminarPartidaDefinitivamente();
                }
                return;
            }

            // Si completó toda la secuencia actual exitosamente
            if (secuenciaJugador.length === secuenciaIA.length) {
                juegoBloqueado = true;
                añadirPasoYContinuar();
            }
        }
    };

    // ==========================================
    // 8. INICIALIZACIÓN AUTOMÁTICA DEL MODULO
    // ==========================================
    function iniciarEstructuraSimon() {
        secuenciaIA = [];
        secuenciaJugador = [];
        rondaActual = 0;
        preguntaUsadaEnEstaRonda = false;
        renderizarSimonDice();
        añadirPasoYContinuar();
    }

    // Ejecución de arranque directo
    iniciarEstructuraSimon();

})();
