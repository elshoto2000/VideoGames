const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Aumentamos el tamaño visual
canvas.width = 400; 
canvas.height = 400;
canvas.style.width = "100%"; // Para que se adapte al contenedor azul
canvas.style.maxWidth = "400px";
canvas.style.borderRadius = "10px";
canvas.style.boxShadow = "0 0 20px #00f0ff"; // Brillo al borde del juego

const container = document.querySelector('.canvas-placeholder');
container.innerHTML = "";
container.appendChild(canvas);

const user = document.getElementById('display-user')?.innerText || "Invitado";
let snake = [{x: 200, y: 200}, {x: 180, y: 200}, {x: 160, y: 200}];
let food = {x: 0, y: 0};
let dx = 20, dy = 0, score = 0, speed = 130, juegoActivo = true;

const posRandom = () => Math.floor(Math.random() * 19) * 20;
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
    
    // Cuadrícula de fondo muy sutil
    ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
    for(let i=0; i<canvas.width; i+=20) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke();
    }
}

function dibujarSerpiente() {
    snake.forEach((part, index) => {
        const esCabeza = index === 0;
        
        // EFECTO NEÓN
        ctx.shadowBlur = esCabeza ? 15 : 5;
        ctx.shadowColor = "#00f0ff";
        ctx.fillStyle = esCabeza ? '#00f0ff' : '#0077ff';
        
        // Dibujar cuerpo redondeado
        ctx.fillRect(part.x + 1, part.y + 1, 18, 18);
        ctx.shadowBlur = 0; // Quitamos sombra para los ojos

        if (esCabeza) {
            // OJOS
            ctx.fillStyle = "white";
            ctx.fillRect(part.x + 4, part.y + 4, 5, 5);
            ctx.fillRect(part.x + 11, part.y + 4, 5, 5);
            
            ctx.fillStyle = "black";
            // Pupilas
            ctx.fillRect(part.x + 6, part.y + 5, 2, 2);
            ctx.fillRect(part.x + 13, part.y + 5, 2, 2);
        }
    });
}

function avanzarSerpiente() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    // Atravesar paredes (Modo Infinito)
    if (head.x < 0) head.x = canvas.width - 20;
    if (head.x >= canvas.width) head.x = 0;
    if (head.y < 0) head.y = canvas.height - 20;
    if (head.y >= canvas.height) head.y = 0;

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        food = {x: posRandom(), y: posRandom()};
        if (speed > 60) speed -= 2;
    } else {
        snake.pop();
    }

    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) morir();
    }
}

function dibujarComida() {
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff0055";
    ctx.fillStyle = "#ff0055";
    ctx.beginPath();
    ctx.arc(food.x + 10, food.y + 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

async function morir() {
    juegoActivo = false;
    
    // 1. Guardar el puntaje
    await guardarPuntaje(user, score, "Snake");
    
    alert("¡Game Over! Puntos: " + score);
    
    // 2. En lugar de solo recargar, vamos a pedirle a Python los nuevos datos
    // para que la tabla de al lado se llene solita.
    location.reload(); // Esto refrescará la página y el ranking se cargará desde Python
}

// CONTROLES
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -20; }
    if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 20; }
    if (e.key === 'ArrowLeft' && dx === 0) { dx = -20; dy = 0; }
    if (e.key === 'ArrowRight' && dx === 0) { dx = 20; dy = 0; }
});

// SWIPE (Táctil)
let touchstartX = 0, touchstartY = 0;
document.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
}, {passive: true});

document.addEventListener('touchend', e => {
    let swX = e.changedTouches[0].screenX - touchstartX;
    let swY = e.changedTouches[0].screenY - touchstartY;
    if (Math.abs(swX) > Math.abs(swY)) {
        if (swX > 0 && dx === 0) { dx = 20; dy = 0; }
        else if (swX < 0 && dx === 0) { dx = -20; dy = 0; }
    } else {
        if (swY > 0 && dy === 0) { dy = 20; dx = 0; }
        else if (swY < 0 && dy === 0) { dy = -20; dx = 0; }
    }
}, {passive: true});

async function guardarPuntaje(nombre, puntos, juego) {
    await fetch('/guardar_puntaje', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({nombre, puntos, juego})
    });
}

main();
