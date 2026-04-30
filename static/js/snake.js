const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 400; canvas.height = 400;
document.querySelector('.canvas-placeholder').innerHTML = "";
document.querySelector('.canvas-placeholder').appendChild(canvas);

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
    snake.unshift(cabeza);
    if (cabeza.x === food.x && cabeza.y === food.y) {
        score += 10;
        speed = Math.max(50, speed - 2); // Aumenta velocidad
        snakeColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        food = {x: posRandom(), y: posRandom()};
    } else { snake.pop(); }

    if (cabeza.x < 0 || cabeza.x >= 400 || cabeza.y < 0 || cabeza.y >= 400 || chocó()) {
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

main();