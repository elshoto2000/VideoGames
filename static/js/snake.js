(function() {
    const container = document.querySelector('.canvas-placeholder');
    if (!container) return;
    container.innerHTML = ""; 

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    // --- AJUSTE DE PANTALLA RESPONSIVO ---
    function resizeCanvas() {
        const size = Math.min(container.clientWidth, container.clientHeight, 400);
        canvas.width = size;
        canvas.height = size;
        gridSize = size / 20; // Ajustamos la cuadrícula proporcionalmente
    }

    let gridSize = 20;
    const userElement = document.getElementById('display-user') || { innerText: "Leandro" };
    const user = userElement.innerText.replace("Jugador: ", "").trim();
    
    let snake, foods, dx, dy, score, speed, gameRunning;
    let lockInput = false;
    let currentColor = "#00f0ff";
    const neonColors = ["#00f0ff", "#ff00ff", "#00ff00", "#ffff00", "#ff8000"];

    function init() {
        resizeCanvas();
        // Posiciones iniciales basadas en el tamaño del grid
        snake = [
            {x: gridSize * 10, y: gridSize * 10},
            {x: gridSize * 9, y: gridSize * 10},
            {x: gridSize * 8, y: gridSize * 10}
        ];
        foods = [];
        dx = gridSize; dy = 0; score = 0; speed = 130;
        gameRunning = true;
        lockInput = false;
        
        // Llenamos de manzanas (máximo 200 para que no explote el procesador del móvil)
        for(let i=0; i < 200; i++) spawnFood();
        game();
    }

    function game() {
        if (!gameRunning) return;
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};

        // Colisión con paredes (ahora dinámicas)
        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height || 
            snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            return gameOver(); 
        }

        snake.unshift(head);
        const foodIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);
        
        if (foodIndex !== -1) {
            score += 10;
            speed = Math.max(60, speed - 1);
            foods.splice(foodIndex, 1);
            currentColor = neonColors[Math.floor(Math.random() * neonColors.length)];
            spawnFood(); // Reponemos la manzana
        } else {
            snake.pop();
        }

        draw();
        lockInput = false;
        setTimeout(game, speed);
    }

    function spawnFood() {
        let newFood = {
            x: Math.floor(Math.random() * 20) * gridSize,
            y: Math.floor(Math.random() * 20) * gridSize
        };
        if(!snake.some(s => s.x === newFood.x && s.y === newFood.y)) {
            foods.push(newFood);
        }
    }

    function draw() {
        ctx.fillStyle = "#0d0221";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Manzanas Neón
        ctx.fillStyle = "#ff4757";
        foods.forEach(f => {
            ctx.beginPath();
            ctx.arc(f.x + gridSize/2, f.y + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Serpiente con Brillo
        snake.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? currentColor : "rgba(255,255,255,0.3)";
            if(i === 0) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = currentColor;
            }
            ctx.fillRect(seg.x + 1, seg.y + 1, gridSize - 2, gridSize - 2);
            ctx.shadowBlur = 0;

            // Ojitos
            if (i === 0) {
                ctx.fillStyle = "white";
                ctx.fillRect(seg.x + 4, seg.y + 4, 4, 4);
                ctx.fillRect(seg.x + gridSize - 8, seg.y + 4, 4, 4);
            }
        });
    }

    function gameOver() {
        gameRunning = false;
        let screen = document.getElementById('game-over-screen') || document.createElement('div');
        screen.id = 'game-over-screen';
        screen.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(13,2,33,0.95); display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:9999; color:white; text-align:center;`;
        
        screen.innerHTML = `
            <h2 style="color:${currentColor}">GAME OVER</h2>
            <p>Puntos: ${score}</p>
            <button id="retry" style="padding:15px 30px; background:${currentColor}; border:none; border-radius:5px; font-weight:bold;">REINTENTAR</button>
        `;
        container.appendChild(screen);
        document.getElementById('retry').onclick = () => { screen.remove(); init(); };

        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nombre: user, puntos: score, juego: 'snake'})
        }).then(() => {
            if (typeof actualizarRankingLateral === 'function') actualizarRankingLateral('snake');
        });
    }

    // --- CONTROLES TÁCTILES (SWIPE) ---
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        e.preventDefault();
    }, {passive: false});

    canvas.addEventListener('touchend', e => {
        if (lockInput || !gameRunning) return;
        let dxTouch = e.changedTouches[0].screenX - touchStartX;
        let dyTouch = e.changedTouches[0].screenY - touchStartY;

        if (Math.abs(dxTouch) > Math.abs(dyTouch)) {
            if (dxTouch > 30 && dx === 0) { dx = gridSize; dy = 0; }
            else if (dxTouch < -30 && dx === 0) { dx = -gridSize; dy = 0; }
        } else {
            if (dyTouch > 30 && dy === 0) { dx = 0; dy = gridSize; }
            else if (dyTouch < -30 && dy === 0) { dx = 0; dy = -gridSize; }
        }
        lockInput = true;
    }, false);

    // --- CONTROLES TECLADO ---
    window.onkeydown = e => {
        if (lockInput || !gameRunning) return;
        const key = e.key;
        if (key === "ArrowUp" && dy === 0) { dx = 0; dy = -gridSize; }
        if (key === "ArrowDown" && dy === 0) { dx = 0; dy = gridSize; }
        if (key === "ArrowLeft" && dx === 0) { dx = -gridSize; dy = 0; }
        if (key === "ArrowRight" && dx === 0) { dx = gridSize; dy = 0; }
        lockInput = true;
    };

    // Ajustar si el usuario voltea el teléfono
    window.addEventListener('resize', resizeCanvas);

    init();
})();
