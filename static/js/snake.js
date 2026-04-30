(function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400; 
    canvas.height = 400;
    
    const container = document.querySelector('.canvas-placeholder');
    container.innerHTML = "";
    container.appendChild(canvas);

    // Obtenemos el nombre de usuario de la interfaz
    const user = document.getElementById('display-user').innerText;
    
    let snake = [{x: 200, y: 200}, {x: 180, y: 200}, {x: 160, y: 200}];
    let food = {x: 100, y: 100};
    let dx = 20, dy = 0, score = 0, speed = 130;
    let lockInput = false;
    let gameRunning = true; // Variable para controlar el estado del juego

    function game() {
        if (!gameRunning) return; // Si el juego terminó, no ejecutar más ciclos

        const head = {x: snake[0].x + dx, y: snake[0].y + dy};

        // Verificación de colisión con paredes o cuerpo
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
        // Evitar que la comida aparezca encima de la serpiente
        if (snake.some(seg => seg.x === food.x && seg.y === food.y)) {
            spawnFood();
        }
    }

    function draw() {
        ctx.fillStyle = "#0d0221";
        ctx.fillRect(0, 0, 400, 400);
        
        // Comida con brillo (Neon)
        ctx.fillStyle = "#ff4757";
        ctx.shadowBlur = 15; 
        ctx.shadowColor = "#ff4757";
        ctx.fillRect(food.x, food.y, 18, 18);

        // Serpiente
        snake.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? "#00f0ff" : "#009db0";
            ctx.shadowBlur = i === 0 ? 15 : 0;
            ctx.shadowColor = "#00f0ff";
            ctx.fillRect(seg.x, seg.y, 18, 18);
        });
        
        // Reset del shadow para no afectar otros dibujos
        ctx.shadowBlur = 0;
    }

    function gameOver() {
    gameRunning = false;
    ctx.fillStyle = "rgba(13, 2, 33, 0.8)";
    ctx.fillRect(0, 0, 400, 400);

    const screen = document.getElementById('game-over-screen');
    
    // Inyectamos los botones específicos que pediste
    screen.innerHTML = `
        <h1 style="color: var(--accent); text-shadow: 0 0 15px var(--accent); margin-bottom: 10px;">GAME OVER</h1>
        <p id="final-score-msg" style="font-size: 1.5rem; margin-bottom: 20px;">Puntos: ${score}</p>
        
        <div style="display: flex; flex-direction: column; gap: 10px; width: 80%;">
            <button onclick="location.reload()" class="btn-play" style="background: var(--neon); color: #0d0221;">
                REINTENTAR
            </button>
            <button onclick="window.location.href=window.location.href" class="btn-play" style="background: var(--muted); font-size: 0.8rem;">
                CAMBIAR DE CUENTA
            </button>
        </div>
    `;
    
    screen.style.display = 'flex';

    fetch('/guardar_puntaje', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({nombre: user, puntos: score, juego: 'snake'})
    });
}

        // Guardar en base de datos
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nombre: user, puntos: score, juego: 'snake'})
        }).catch(err => console.error("Error al guardar:", err));
    }

    window.onkeydown = e => {
        if (lockInput || !gameRunning) return;
        
        // Evitar que la serpiente se muerda dándose la vuelta directamente
        if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -20; lockInput = true; }
        if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 20; lockInput = true; }
        if (e.key === "ArrowLeft" && dx === 0) { dx = -20; dy = 0; lockInput = true; }
        if (e.key === "ArrowRight" && dx === 0) { dx = 20; dy = 0; lockInput = true; }
    };

    game();
})();
