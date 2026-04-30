// Variables de estado
let clics = 0;
let tiempo = 10;
let iniciado = false;
let cronometro;

// Referencias a los elementos
const cont = document.querySelector('.canvas-placeholder');
const user = document.getElementById('display-user').innerText;

// 1. Construir la interfaz una sola vez
cont.innerHTML = `
    <div style="position:absolute; top:10px; width:100%; text-align:center; z-index:10; pointer-events:none;">
        <h2 id="num-clics" style="color:var(--neon); margin:0; font-size:2.5rem;">0 CLICS</h2>
        <p id="timer" style="color:white; margin:0; font-weight:bold;">TIEMPO: 10s</p>
    </div>
    <button id="boton-loco" class="btn-play" style="position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); padding:20px 40px; z-index:5; cursor:pointer; transition: top 0.1s, left 0.1s;">
        ¡DALE!
    </button>
`;

const elBoton = document.getElementById('boton-loco');
const elTextoClics = document.getElementById('num-clics');
const elTimer = document.getElementById('timer');

// 2. Función para mover el botón
function mover() {
    // Calculamos rangos para que no se salga del cuadro negro (450px de alto)
    const x = Math.floor(Math.random() * 70) + 15; // 15% a 85%
    const y = Math.floor(Math.random() * 50) + 30; // 30% a 80% (evita el texto de arriba)
    
    elBoton.style.left = x + "%";
    elBoton.style.top = y + "%";
}

// 3. Lógica del clic
elBoton.addEventListener('click', () => {
    if (!iniciado) {
        iniciado = true;
        empezarTiempo();
    }
    clics++;
    elTextoClics.innerText = clics + " CLICS";
    mover();
});

// 4. Temporizador
function empezarTiempo() {
    cronometro = setInterval(() => {
        tiempo--;
        elTimer.innerText = "TIEMPO: " + tiempo + "s";

        if (tiempo <= 0) {
            clearInterval(cronometro);
            elBoton.disabled = true;
            elBoton.style.display = "none"; // Desaparece al terminar
            finalizarJuego();
        }
    }, 1000);
}

// 5. Finalizar y Guardar
function finalizarJuego() {
    const overlay = document.getElementById('game-over-screen');
    if (overlay) {
        overlay.style.display = 'flex';
        document.getElementById('final-score-msg').innerText = "¡Finalizado! Hiciste " + clics + " clics.";
    }
    
    // Guardar en tu servidor Flask
    fetch('/guardar_puntaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre: user,
            puntos: clics,
            juego: 'clicker'
        })
    });
}