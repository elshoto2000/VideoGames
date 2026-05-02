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
    
    let snake, foods, dx, dy, score, speed, gameRunning;
    let lockInput = false;
    let touchStartX = 0;
    let touchStartY = 0;

    function init() {
        snake = [{x: 200, y: 200}, {x: 180, y: 200}, {x: 160, y: 200}];
        foods = [];
        dx = 20; dy = 0; score = 0; speed = 130;
        gameRunning = true;
        lockInput = false;
        // Generamos 3 manzanas iniciales
        for(let i=0; i<3; i++) spawnFood();
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
        
        // Revisar si comió alguna de las manzanas
        const foodIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);
        
        if (foodIndex !== -1) {
            score += 10;
            speed = Math.max(70, speed - 1);
            foods.splice(foodIndex, 1); // Quitar la manzana comida
            spawnFood(); // Poner una nueva
        } else {
            snake.pop();
        }

        draw();
        lockInput = false;
        setTimeout(game, speed);
    }

    function spawnFood() {
        let newFood;
        while(true) {
            newFood = {
                x: Math.floor(Math.random() * 19) * 20,
                y: Math.floor(Math.random() * 19) * 20
            };
            // Evitar que aparezca sobre la serpiente u otra manzana
            const collision = snake.some(s => s.x === newFood.x && s.y === newFood.y) ||
                              foods.some(f => f.x === newFood.x && f.y === newFood.y);
            if(!collision) break;
        }
        foods.push(newFood);
    }

    function draw() {
        ctx.fillStyle = "#0d0221";
        ctx.fillRect(0, 0, 400, 400);
        
        // Dibujar todas las manzanas
        ctx.fillStyle = "#ff4757";
        foods.forEach(f => {
            ctx.fillRect(f.x, f.y, 18, 18);
        });

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
            screen.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(13,2,33,0.98); display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:9999; text-align:center; color:white; border-radius:15px; padding: 20px; box-sizing: border-box;";
            container.appendChild(screen);
        }

        screen.innerHTML = `
            <h1 style="color: #00f0ff; text-shadow: 0 0 10px #00f0ff; font-size: 1.8rem; margin: 0 0 10px 0;">¡PARTIDA TERMINADA!</h1>
            <p style="font-size: 1.3rem; margin-bottom: 20px;">Puntos: <span style="color:#00f0ff">${score}</span></p>
            <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 280px;">
                <button id="btn-restart-final" style="background:#00f0ff; color:#0d0221; font-weight:bold; height: 50px; border:none; border-radius:8px; cursor:pointer;">🎮 REINTENTAR</button>
                <button id="btn-menu-final" style="background:#333; color:white; height: 50px; border:none; border-radius:8px; cursor:pointer;">🏠 MENÚ PRINCIPAL</button>
            </div>
        `;
        screen.style.display = 'flex';
        document.getElementById('btn-restart-final').onclick = () => { screen.style.display = 'none'; init(); };
        document.getElementById('btn-menu-final').onclick = () => { window.location.href = "index.html"; };

        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nombre: user, puntos: score, juego: 'snake'})
        });
    }

    window.onkeydown = e => {
        if (lockInput || !gameRunning) return;
        if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -20; lockInput = true; }
        if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 20; lockInput = true; }
        if (e.key === "ArrowLeft" && dx === 0) { dx = -20; dy = 0; lockInput = true; }
        if (e.key === "ArrowRight" && dx === 0) { dx = 20; dy = 0; lockInput = true; }
    };

    canvas.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);

    canvas.addEventListener('touchend', e => {
        if (lockInput || !gameRunning) return;
        let diffX = e.changedTouches[0].screenX - touchStartX;
        let diffY = e.changedTouches[0].screenY - touchStartY;
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 30 && dx === 0) { dx = 20; dy = 0; lockInput = true; }
            else if (diffX < -30 && dx === 0) { dx = -20; dy = 0; lockInput = true; }
        } else {
            if (diffY > 30 && dy === 0) { dx = 0; dy = 20; lockInput = true; }
            else if (diffY < -30 && dy === 0) { dx = 0; dy = -20; lockInput = true; }
        }
    }, false);

    init();
})();
