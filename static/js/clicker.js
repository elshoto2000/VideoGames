(function() {
    let clicks = 0;
    let timeLeft = 10;
    let timerId = null;
    let gameActive = false;
    const container = document.querySelector('.canvas-placeholder');

    // Obtener el usuario de forma segura
    const userElement = document.getElementById('display-user') || document.querySelector('span[style*="color: red"]') || { innerText: "Leandro" };
    let user = userElement.innerText.replace("Jugador: ", "").trim();

    function startGame() {
        clicks = 0;
        timeLeft = 10;
        gameActive = true;
        renderGame();
        
        timerId = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                endGame();
            } else {
                updateTimer();
            }
        }, 1000);
    }

    function renderGame() {
        if (!container) return;
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:white;">
                <p id="timer-display" style="color:#00f0ff; font-size:1.2rem; margin-bottom:10px;">Tiempo: ${timeLeft}s</p>
                <div id="click-target" style="width:120px; height:120px; background:#00f0ff; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 0 20px #00f0ff; user-select:none;">
                    <span style="color:#0d0221; font-weight:bold; font-size:2rem;">+1</span>
                </div>
                <p style="margin-top:20px; font-size:1.5rem;">Clicks: <span id="click-count">0</span></p>
            </div>
        `;

        const target = document.getElementById('click-target');
        target.onclick = () => {
            if (gameActive) {
                clicks++;
                document.getElementById('click-count').innerText = clicks;
                // Efecto visual de click
                target.style.transform = "scale(0.95)";
                setTimeout(() => target.style.transform = "scale(1)", 50);
            }
        };
    }

    function updateTimer() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) timerDisplay.innerText = `Tiempo: ${timeLeft}s`;
    }

    function endGame() {
        gameActive = false;
        clearInterval(timerId);
        container.innerHTML = ""; 

        // Crear pantalla final dinámica
        let screen = document.getElementById('game-over-screen');
        if (!screen) {
            screen = document.createElement('div');
            screen.id = 'game-over-screen';
            screen.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(13,2,33,0.95); display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:9999; text-align:center; color:white; border-radius:15px;";
            container.appendChild(screen);
        }

        screen.innerHTML = `
            <h1 style="color: #00f0ff; text-shadow: 0 0 15px #00f0ff; margin-bottom:10px;">TIEMPO AGOTADO</h1>
            <p style="font-size: 1.5rem; margin-bottom: 20px;">Total de Clicks: ${clicks}</p>
            <div style="display: flex; flex-direction: column; gap: 10px; width: 80%; max-width: 300px;">
                <button id="btn-restart-clicker" class="btn-play" style="background: #00f0ff; color: #0d0221; font-weight:bold; padding: 12px; border: none; cursor: pointer; border-radius: 4px;">REINTENTAR</button>
                <button onclick="window.location.href='/menu'" class="btn-play" style="background: #555; color: white; padding: 12px; border: none; cursor: pointer; border-radius: 4px;">VOLVER AL MENÚ</button>
                <button onclick="location.reload()" style="background: transparent; color: #aaa; border: none; font-size: 0.7rem; cursor: pointer; margin-top: 5px;">Cambiar de cuenta</button>
            </div>
        `;
        screen.style.display = 'flex';

        // Reiniciar juego sin recargar página
        document.getElementById('btn-restart-clicker').onclick = () => {
            screen.style.display = 'none';
            startGame();
        };

        // Guardar en la base de datos
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre: user, puntos: clicks, juego: 'clicker' })
        }).catch(err => console.error("Error al guardar:", err));
    }

    // Iniciar automáticamente
    setTimeout(startGame, 200);
})();
