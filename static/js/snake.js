(function() {
    const container = document.querySelector('.canvas-placeholder');
    if (!container) return;

    // No limpiamos todo el container para no borrar el div #game-over-screen que ya existe en tu HTML
    // Solo nos aseguramos de que el canvas sea el primer hijo
    let canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        container.prepend(canvas);
    }
    
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        const size = Math.min(container.clientWidth, container.clientHeight, 400);
        canvas.width = size;
        canvas.height = size;
        gridSize = size / 20;
    }

    let gridSize = 20;
    const userElement = document.getElementById('display-user') || { innerText: "Leandro" };
    const user = userElement.innerText.replace("Jugador: ", "").trim();
    
    let snake, foods, dx, dy, score, speed, gameRunning;
    let lockInput = false;
    let totalApplesEaten = 0; 
    let currentColor = "#00f0ff";
    const neonColors = ["#00f0ff", "#ff00ff", "#00ff00", "#ffff00", "#ff8000"];

    function init() {
        resizeCanvas();
        snake = [
            {x: gridSize * 10, y: gridSize * 10},
            {x: gridSize * 9, y: gridSize * 10},
            {x: gridSize * 8, y: gridSize * 10}
        ];
        foods = [];
        dx = gridSize; dy = 0; score = 0; speed = 130;
        totalApplesEaten = 0;
        gameRunning = true;
        lockInput = false;
        
        // Ocultar pantalla de game over al iniciar
        const screen = document.getElementById('game-over-screen');
        if (screen) screen.style.display = 'none';

        for(let i=0; i < 5; i++) spawnFood();
        game();
    }

    function game() {
        if (!gameRunning) return;
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};

        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height || 
            snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            return gameOver(); 
        }

        snake.unshift(head);
        const foodIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);
        
        if (foodIndex !== -1) {
            score += 10;
            totalApplesEaten++;
            speed = Math.max(60, speed - 1);
            foods.splice(foodIndex, 1);
            currentColor = neonColors[Math.floor(Math.random() * neonColors.length)];
            
            if (totalApplesEaten < 5000) {
                spawnFood();
            }
        } else {
            snake.pop();
        }

        draw();
        lockInput = false;
        setTimeout(game, speed);
    }

    function spawnFood() {
        let newFood;
        let collision;
        do {
            newFood = {
                x: Math.floor(Math.random() * 20) * gridSize,
                y: Math.floor(Math.random() * 20) * gridSize
            };
            collision = snake.some(s => s.x === newFood.x && s.y === newFood.y) ||
                        foods.some(f => f.x === newFood.x && f.y === newFood.y);
        } while (collision);
        foods.push(newFood);
    }

    function draw() {
        ctx.fillStyle = "#0d0221";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#ff4757";
        foods.forEach(f => {
            ctx.beginPath();
            ctx.arc(f.x + gridSize/2, f.y + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
            ctx.fill();
        });

        snake.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? currentColor : "rgba(255,255,255,0.3)";
            if(i === 0) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = currentColor;
            }
            ctx.fillRect(seg.x + 1, seg.y + 1, gridSize - 2, gridSize - 2);
            ctx.shadowBlur = 0;

            if (i === 0) {
                ctx.fillStyle = "white";
                ctx.fillRect(seg.x + 4, seg.y + 4, 4, 4);
                ctx.fillRect(seg.x + gridSize - 8, seg.y + 4, 4, 4);
            }
        });
    }

    function actualizarRankingLateral(juego) {
        fetch('/obtener_ranking')
        .then(res => res.json())
        .then(data => {
            const topJuego = data.ranking
                .filter(r => r.juego.toLowerCase() === juego.toLowerCase())
                .sort((a, b) => b.puntos - a.puntos)
                .slice(0, 5);

            const listaHtml = document.getElementById('ranking-list'); 
            if (listaHtml) {
                listaHtml.innerHTML = topJuego.map((r, index) => `
                    <li>
                        <span>${index + 1}. ${r.nombre}</span> 
                        <b>${r.puntos}</b>
                    </li>
                `).join('');
            }
        })
        .catch(err => console.error("Error al actualizar ranking:", err));
    }

    function gameOver() {
        gameRunning = false;

        // 1. Guardar en MongoDB
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                nombre: user, 
                puntos: score, 
                juego: 'snake'
            })
        }).then(() => {
            actualizarRankingLateral('snake'); 
        });

        // 2. Usar los elementos que YA ESTÁN en tu HTML
        const screen = document.getElementById('game-over-screen');
        const finalScoreMsg = document.getElementById('final-score-msg');
        const h1GameOver = screen.querySelector('h1');
        const btnRetry = screen.querySelector('button:not([style*="background"])'); // El primer botón

        if (finalScoreMsg) finalScoreMsg.innerText = `Lograste ${score} puntos`;
        
        // 3. Aplicar estilo neón dinámico al morir
        if (h1GameOver) {
            h1GameOver.style.color = currentColor;
            h1GameOver.style.textShadow = `0 0 15px ${currentColor}`;
        }
        if (btnRetry) {
            btnRetry.style.background = currentColor;
            btnRetry.style.boxShadow = `0 0 10px ${currentColor}`;
        }

        if (screen) {
            screen.style.display = 'flex'; // Usamos flex para centrar
            screen.style.flexDirection = 'column';
            screen.style.justifyContent = 'center';
            screen.style.alignItems = 'center';
        }
    }

    // --- CONTROLES (Mantenidos igual) ---
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
            if (dxTouch > 30 && dx === 0) { dx = gridSize; dy = 0; lockInput = true; }
            else if (dxTouch < -30 && dx === 0) { dx = -gridSize; dy = 0; lockInput = true; }
        } else {
            if (dyTouch > 30 && dy === 0) { dx = 0; dy = gridSize; lockInput = true; }
            else if (dyTouch < -30 && dy === 0) { dx = 0; dy = -gridSize; lockInput = true; }
        }
    }, false);

    window.onkeydown = e => {
        if (lockInput || !gameRunning) return;
        if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -gridSize; lockInput = true; }
        if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = gridSize; lockInput = true; }
        if (e.key === "ArrowLeft" && dx === 0) { dx = -gridSize; dy = 0; lockInput = true; }
        if (e.key === "ArrowRight" && dx === 0) { dx = gridSize; dy = 0; lockInput = true; }
    };

    window.addEventListener('resize', resizeCanvas);
    init();
})();
