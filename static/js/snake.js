const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 400; 
canvas.height = 400;
document.querySelector('.canvas-placeholder').innerHTML = "";
document.querySelector('.canvas-placeholder').appendChild(canvas);

const user = document.getElementById('display-user').innerText;
let snake = [{x: 200, y: 200}, {x: 180, y: 200}, {x: 160, y: 200}];
let food = {x: 0, y: 0};
let dx = 20, dy = 0, score = 0, speed = 150, juegoActivo = true;
let snakeColor = '#00f0ff'; // Color neón

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
    ctx.fillStyle = "#0d0221"; // Fondo oscuro espacial
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function dibujarSerpiente() {
    snake.forEach((part, index) => {
        const esCabeza = index === 0;
        ctx.fillStyle = esCabeza ? '#00f0ff' : '#00a2ff';
        ctx.strokeStyle = '#0d0221';
        ctx.fillRect(part.x, part.y, 20, 20);
        ctx.strokeRect(part.x, part.y, 20, 20);

        // --- DIBUJAR OJOS SI ES LA CABEZA ---
        if (esCabeza) {
            ctx.fillStyle = "white";
            // Ojo 1
            ctx.fillRect(part.x + 4, part.y + 4, 4, 4);
            // Ojo 2
            ctx.fillRect(part.x + 12, part.y + 4, 4, 4);
            
            ctx.fillStyle = "black";
            // Pupilas (mirando según la dirección)
            if (dx > 0) { // Derecha
                ctx.fillRect(part.x + 6, part.y + 5, 2, 2);
                ctx.fillRect(part.x + 14, part.y + 5, 2, 2);
            } else if (dx < 0) { // Izquierda
                ctx.fillRect(part.x + 4, part.y + 5, 2, 2);
                ctx.fillRect(part.x + 12, part.y + 5, 2, 2);
            } else { // Arriba o Abajo
                ctx.fillRect(part.x + 5, part.y + 4, 2, 2);
                ctx.fillRect(part.x + 13, part.y + 4, 2, 2);
            }
        }
    });
}

function avanzarSerpiente() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    // Atravesar paredes
    if (head.x < 0) head.x = canvas.width - 20;
    if (head.x >= canvas.width) head.x = 0;
    if (head.y < 0) head.y = canvas.height - 20;
    if (head.y >= canvas.height) head.y = 0;

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        food = {x: posRandom(), y: posRandom()};
        if (speed > 70) speed -= 2;
    } else {
        snake.pop();
    }

    // Colisión consigo misma
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            morir();
        }
    }
}

function dibujarComida() {
    ctx.fillStyle = "#ff0055";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff0055";
    ctx.fillRect(food.x, food.y, 20, 20);
    ctx.shadowBlur = 0;
}

function morir() {
    juegoActivo = false;
    alert("¡Perdiste! Puntos: " + score);
    guardarPuntaje(user, score, "Snake");
    location.reload(); 
}

// --- CONTROLES DE TECLADO ---
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -20; }
    if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 20; }
    if (e.key === 'ArrowLeft' && dx === 0) { dx = -20; dy = 0; }
    if (e.key === 'ArrowRight' && dx === 0) { dx = 20; dy = 0; }
});

// --- CONTROLES TÁCTILES (SWIPE) ---
let touchstartX = 0, touchstartY = 0;

document.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
}, {passive: true});

document.addEventListener('touchend', e => {
    let swipeX = e.changedTouches[0].screenX - touchstartX;
    let swipeY = e.changedTouches[0].screenY - touchstartY;

    if (Math.abs(swipeX) > Math.abs(swipeY)) {
        if (swipeX > 0 && dx === 0) { dx = 20; dy = 0; } // Derecha
        else if (swipeX < 0 && dx === 0) { dx = -20; dy = 0; } // Izquierda
    } else {
        if (swipeY > 0 && dy === 0) { dy = 20; dx = 0; } // Abajo
        else if (swipeY < 0 && dy === 0) { dy = -20; dx = 0; } // Arriba
    }
}, {passive: true});

async function guardarPuntaje(nombre, puntos, juego) {
    try {
        await fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nombre, puntos, juego})
        });
    } catch (e) { console.error("Error al guardar:", e); }
}

main();
