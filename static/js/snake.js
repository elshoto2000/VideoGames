const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 400; 
canvas.height = 400;
canvas.className = "snake-canvas"; // Para estilos CSS

const container = document.querySelector('.canvas-placeholder');
container.innerHTML = ""; 
container.appendChild(canvas);

const user = document.getElementById('display-user').innerText;
let snake = [{x: 200, y: 200}, {x: 180, y: 200}];
let food = {x: 40, y: 40};
let dx = 20, dy = 0, score = 0, speed = 150, juegoActivo = true;

const posRandom = () => Math.floor(Math.random() * 19) * 20;

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
        ctx.fillStyle = "#00f0ff";
        ctx.shadowBlur = 10; ctx.shadowColor = "#00f0ff";
        ctx.fillRect(p.x, p.y, 18, 18);
    });
}

function avanzarSerpiente() {
    const cabeza = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    // --- CORRECCIÓN: Colisión con paredes ---
    if (cabeza.x < 0 || cabeza.x >= 400 || cabeza.y < 0 || cabeza.y >= 400 || chocó(cabeza)) {
        juegoActivo = false;
        finalizar();
        return;
    }

    snake.unshift(cabeza);

    if (cabeza.x === food.x && cabeza.y === food.y) {
        score += 10;
        speed = Math.max(60, speed - 2); 
        food = {x: posRandom(), y: posRandom()};
    } else { 
        snake.pop(); 
    }
}

function chocó(cabeza) {
    return snake.some(p => p.x === cabeza.x && p.y === cabeza.y);
}

function dibujarComida() {
    ctx.fillStyle = "#ff4757";
    ctx.shadowBlur = 15; ctx.fillRect(food.x, food.y, 18, 18);
}

function finalizar() {
    const overlay = document.getElementById('game-over-screen');
    overlay.style.display = 'flex';
    document.getElementById('final-score-msg').innerText = `Puntaje: ${score}`;
    guardarPuntaje(user, score, 'snake'); // Enviamos en minúscula[cite: 1]
}

window.onkeydown = e => {
    if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -20; }
    if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 20; }
    if (e.key === "ArrowLeft" && dx === 0) { dx = -20; dy = 0; }
    if (e.key === "ArrowRight" && dx === 0) { dx = 20; dy = 0; }
};

async function guardarPuntaje(nombre, puntos, juego) {
    await fetch('/guardar_puntaje', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({nombre, puntos, juego})
    });
}

main();
