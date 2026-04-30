(function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400; 
    canvas.height = 400;
    
    const container = document.querySelector('.canvas-placeholder');
    container.innerHTML = ""; // Limpieza inicial
    container.appendChild(canvas);

    // Obtenemos el nombre de usuario de la interfaz
    const user = document.getElementById('display-user').innerText;
    
    let snake = [{x: 200, y: 200}, {x: 180, y: 200}, {x: 160, y: 200}];
    let food = {x: 100, y: 100};
    let dx = 20, dy = 0, score = 0, speed = 130;
    let lockInput = false;
    let gameRunning = true;

    function game() {
        if (!gameRunning) return;

        const head = {x: snake[0].x + dx, y: snake[0].y + dy};

        // Colisiones: Paredes o Cuerpo
        if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400 || 
            snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            return gameOver(); 
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            speed = Math.max(70, speed - 1);
            spawnFood();
        } else {
            snake.pop();
        }

        draw();
        lockInput = false;
        setTimeout(game, speed);
    }

    function spawnFood() {
        food = {
            x: Math.floor(Math.random() * 20) * 20,
            y: Math.floor(Math.random() * 20) * 20
        };
        // No aparecer sobre la serpiente
        if (snake.some(seg => seg.x === food.x && seg.y === food.y)) {
            spawnFood();
        }
    }

    function draw() {
        // Fondo
        ctx.fillStyle = "#0d0221";
        ctx.fillRect(0, 0, 400, 400);
        
        // Comida Neón
        ctx.fillStyle = "#ff4757";
        ctx.shadowBlur = 15; 
        ctx.shadowColor = "#ff4757";
        ctx.fillRect(food.x, food.y, 18, 18);

        // Serpiente Neón
        snake.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? "#00f0ff" : "#009db0";
            ctx.shadowBlur = i === 0 ? 15 : 0;
            ctx.shadowColor = "#00f0ff";
            ctx.fillRect(seg.x, seg.y, 18, 18);
        });
        
        ctx.shadowBlur = 0; // Limpiar brillo para el siguiente frame
    }

    function gameOver() {
    gameRunning = false;
    const container = document.querySelector('.canvas-placeholder');
    
    // Si el div no existe en el HTML, lo creamos por código
    let screen = document.getElementById('game-over-screen');
    if (!screen) {
        screen = document.createElement('div');
        screen.id = 'game-over-screen';
        container.appendChild(screen);
    }

    screen.innerHTML = `
        <h1 style="color: #00f0ff; text-shadow: 0 0 15px #00f0ff;">GAME OVER</h1>
        <p style="font-size: 1.5rem; color: white;">Puntos: ${score}</p>
        <div style="display: flex; flex-direction: column; gap: 10px; width: 80%; margin-top: 20px;">
            <button onclick="location.reload()" class="btn-play" style="background: #00f0ff; color: #0d0221; font-weight:bold; padding:12px; border:none; cursor:pointer;">REINTENTAR</button>
            <button onclick="window.location.href=window.location.href" class="btn-play" style="background: #555; color: white; padding:12px; border:none; cursor:pointer;">CAMBIAR DE CUENTA</button>
        </div>
    `;
    screen.style.display = 'flex';

    // Guardado forzado
    fetch('/guardar_puntaje', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({nombre: user, puntos: score, juego: 'snake'})
    }).then(() => console.log("Puntaje guardado correctamente"));
}

    // Controles
    window.onkeydown = e => {
        if (lockInput || !gameRunning) return;
        
        if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -20; lockInput = true; }
        if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 20; lockInput = true; }
        if (e.key === "ArrowLeft" && dx === 0) { dx = -20; dy = 0; lockInput = true; }
        if (e.key === "ArrowRight" && dx === 0) { dx = 20; dy = 0; lockInput = true; }
    };

    game();
})();
