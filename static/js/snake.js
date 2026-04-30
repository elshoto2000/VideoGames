(function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400; canvas.height = 400;
    
    const container = document.querySelector('.canvas-placeholder');
    container.innerHTML = "";
    container.appendChild(canvas);

    const user = document.getElementById('display-user').innerText;
    let snake = [{x: 200, y: 200}, {x: 180, y: 200}, {x: 160, y: 200}];
    let food = {x: 100, y: 100};
    let dx = 20, dy = 0, score = 0, speed = 130;
    let lockInput = false;

    function game() {
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};

        // COLISIÓN PAREDES O CUERPO
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
    }

    function draw() {
        ctx.fillStyle = "#0d0221";
        ctx.fillRect(0, 0, 400, 400);
        
        // Comida
        ctx.fillStyle = "#ff4757";
        ctx.shadowBlur = 15; ctx.shadowColor = "#ff4757";
        ctx.fillRect(food.x, food.y, 18, 18);

        // Serpiente
        snake.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? "#00f0ff" : "#009db0";
            ctx.shadowBlur = i === 0 ? 10 : 0;
            ctx.fillRect(seg.x, seg.y, 18, 18);
        });
    }

    function gameOver() {
        document.getElementById('game-over-screen').style.display = 'flex';
        document.getElementById('final-score-msg').innerText = `Puntos: ${score}`;
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nombre: user, puntos: score, juego: 'snake'})
        });
    }

    window.onkeydown = e => {
        if (lockInput) return;
        if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -20; lockInput = true; }
        if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 20; lockInput = true; }
        if (e.key === "ArrowLeft" && dx === 0) { dx = -20; dy = 0; lockInput = true; }
        if (e.key === "ArrowRight" && dx === 0) { dx = 20; dy = 0; lockInput = true; }
    };

    game();
})();
