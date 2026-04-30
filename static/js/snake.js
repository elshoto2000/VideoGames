(function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400; 
    canvas.height = 400;
    
    const container = document.querySelector('.canvas-placeholder');
    container.innerHTML = ""; 
    container.appendChild(canvas);

    const userElement = document.getElementById('display-user') || { innerText: "herrera" };
    const user = userElement.innerText.replace("Jugador: ", "").trim();
    
    let snake, food, dx, dy, score, speed, gameRunning;
    let lockInput = false;

    // Variables para control táctil
    let touchStartX = 0;
    let touchStartY = 0;

    function init() {
        snake = [{x: 200, y: 200}, {x: 180, y: 200}, {x: 160, y: 200}];
        dx = 20; dy = 0; score = 0; speed = 130;
        gameRunning = true;
        lockInput = false;
        spawnFood();
        game();
    }

    function game() {
        if (!gameRunning) return;
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};

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
            x: Math.floor(Math.random() * 19) * 20,
            y: Math.floor(Math.random() * 19) * 20
        };
    }

    function draw() {
        ctx.fillStyle = "#0d0221";
        ctx.fillRect(0, 0, 400, 400);
        ctx.fillStyle = "#ff4757";
        ctx.fillRect(food.x, food.y, 18, 18);
        snake.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? "#00f0ff" : "#009db0";
            ctx.fillRect(seg.x, seg.y, 18, 18);
        });
    }

    function gameOver() {
        gameRunning = false;
        let screen = document.getElementById('game-over-screen');
        if (!screen) {
            screen = document.createElement('div');
            screen.id = 'game-over-screen';
            screen.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(13,2,33,0.95); display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:9999; text-align:center; color:white; border-radius:15px;";
            container.appendChild(screen);
        }

        screen.innerHTML = `
            <h1 style="color: #00f0ff;">GAME OVER</h1>
            <p style="font-size: 1.5rem;">Puntos: ${score}</p>
            <div style="display: flex; flex-direction: column; gap: 10px; width: 80%; max-width: 300px; margin-top: 20px;">
                <button id="btn-restart-snake" class="btn-play" style="background:#00f0ff; color:#0d0221; font-weight:bold; padding:12px; border:none; border-radius:4px; cursor:pointer;">REINTENTAR</button>
                <button id="btn-to-menu" class="btn-play" style="background:#555; color:white; padding:12px; border:none; border-radius:4px; cursor:pointer;">VOLVER AL MENÚ</button>
            </div>
        `;
        screen.style.display = 'flex';

        document.getElementById('btn-restart-snake').onclick = () => {
            screen.style.display = 'none';
            init();
        };

        // Corregido: Si /menu falla, probamos con "/" o "index.html"
        document.getElementById('btn-to-menu').onclick = () => {
            window.location.href = "index.html"; // Cambia esto si tu menú tiene otro nombre
        };

        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nombre: user, puntos: score, juego: 'snake'})
        });
    }

    // --- CONTROLES TECLADO ---
    window.onkeydown = e => {
        if (lockInput || !gameRunning) return;
        if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -20; lockInput = true; }
        if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 20; lockInput = true; }
        if (e.key === "ArrowLeft" && dx === 0) { dx = -20; dy = 0; lockInput = true; }
        if (e.key === "ArrowRight" && dx === 0) { dx = 20; dy = 0; lockInput = true; }
    };

    // --- CONTROLES TÁCTILES (SWIPE) ---
    canvas.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);

    canvas.addEventListener('touchend', e => {
        if (lockInput || !gameRunning) return;
        
        let touchEndX = e.changedTouches[0].screenX;
        let touchEndY = e.changedTouches[0].screenY;
        
        let diffX = touchEndX - touchStartX;
        let diffY = touchEndY - touchStartY;

        // Determinar si el deslizamiento fue más horizontal o vertical
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 30 && dx === 0) { dx = 20; dy = 0; lockInput = true; } // Derecha
            else if (diffX < -30 && dx === 0) { dx = -20; dy = 0; lockInput = true; } // Izquierda
        } else {
            if (diffY > 30 && dy === 0) { dx = 0; dy = 20; lockInput = true; } // Abajo
            else if (diffY < -30 && dy === 0) { dx = 0; dy = -20; lockInput = true; } // Arriba
        }
    }, false);

    init();
})();
