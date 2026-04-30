const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// El tamaño interno del juego siempre será 400x400 para que la lógica no cambie
canvas.width = 400; 
canvas.height = 400;

// ESTO ES LO QUE HACE QUE SE AJUSTE A CUALQUIER PANTALLA
canvas.style.width = "100%";       // Se estira al ancho del contenedor azul
canvas.style.height = "auto";      // Mantiene la proporción
canvas.style.aspectRatio = "1/1";  // Se asegura de ser un cuadrado
canvas.style.maxWidth = "500px";   // En PC no queremos que sea GIGANTE, máximo 500px
canvas.style.display = "block";
canvas.style.margin = "0 auto";    // Centrado

const container = document.querySelector('.canvas-placeholder');
container.innerHTML = "";
container.appendChild(canvas);

const user = document.getElementById('display-user').innerText;
let snake = [{x: 200, y: 200}, {x: 180, y: 200}];
let food = {x: 0, y: 0};
let dx = 20, dy = 0, score = 0, speed = 150, juegoActivo = true;
let snakeColor = '#00f0ff';

const posRandom = () => Math.floor(Math.random() * 19 + 1) * 20;
food = {x: posRandom(), y: posRandom()};

function main() {
    if (!juegoActivo) return;
    setTimeout(() => {
        limpiarCanvas();
        dibujarComida();
        avanzarSerpiente();
        dibujarSerpiente();
        main();
    }, speed);
}

function limpiarCanvas() {
    ctx.fillStyle = "#0d0221";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function dibujarSerpiente() {
    snake.forEach(p => {
        ctx.fillStyle = snakeColor;
        ctx.shadowBlur = 10; ctx.shadowColor = snakeColor;
        ctx.fillRect(p.x, p.y, 18, 18);
    });
}

function avanzarSerpiente() {
    const cabeza = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    // Agregamos la cabeza al inicio
    snake.unshift(cabeza);

    // Lógica de comida
    if (cabeza.x === food.x && cabeza.y === food.y) {
        score += 10;
        speed = Math.max(50, speed - 2); 
        snakeColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        food = {x: posRandom(), y: posRandom()};
    } else { 
        snake.pop(); 
    }

    // --- CORRECCIÓN DE COLISIÓN (Paredes que matan) ---
    // Usamos >= 400 y < 0 para que sea exacto con el tamaño del canvas[cite: 1]
    const chocoPared = cabeza.x < 0 || cabeza.x >= 400 || cabeza.y < 0 || cabeza.y >= 400;

    if (chocoPared || chocó()) {
        juegoActivo = false;
        finalizar();
    }
}

function chocó() {
    return snake.slice(1).some(p => p.x === snake[0].x && p.y === snake[0].y);
}

function dibujarComida() {
    ctx.fillStyle = "#ff4757";
    ctx.shadowBlur = 15; ctx.fillRect(food.x, food.y, 18, 18);
}

function finalizar() {
    const overlay = document.getElementById('game-over-screen');
    overlay.style.display = 'flex';
    document.getElementById('final-score-msg').innerText = `Récord de Neón: ${score} puntos`;
    guardarPuntaje(user, score, 'snake');
}

window.onkeydown = e => {
    if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -20; }
    if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 20; }
    if (e.key === "ArrowLeft" && dx === 0) { dx = -20; dy = 0; }
    if (e.key === "ArrowRight" && dx === 0) { dx = 20; dy = 0; }
};

async function guardarPuntaje(nombre, puntos, juego) {
    try {
        const respuesta = await fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombre,
                puntos: puntos,
                juego: juego
            })
        });
        
        const resultado = await respuesta.json();
        if (resultado.status === "success") {
            console.log("Puntaje guardado con éxito");
        }
    } catch (error) {
        console.error("Error al guardar puntaje:", error);
    }
}

// ... (Aquí está tu código actual de dibujar serpiente, comer manzana, etc.) ...

// --- AQUÍ PEGAS EL CÓDIGO DE SWIPE ---
let touchstartX = 0;
let touchstartY = 0;

document.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
}, {passive: true});

document.addEventListener('touchend', e => {
    let touchendX = e.changedTouches[0].screenX;
    let touchendY = e.changedTouches[0].screenY;
    
    let swipeX = touchendX - touchstartX;
    let swipeY = touchendY - touchstartY;

    if (Math.abs(swipeX) > Math.abs(swipeY)) {
        if (swipeX > 0 && dx === 0) { dx = 20; dy = 0; } // Derecha
        else if (swipeX < 0 && dx === 0) { dx = -20; dy = 0; } // Izquierda
    } else {
        if (swipeY > 0 && dy === 0) { dy = 20; dx = 0; } // Abajo
        else if (swipeY < 0 && dy === 0) { dy = -20; dx = 0; } // Arriba
    }
});

main();
