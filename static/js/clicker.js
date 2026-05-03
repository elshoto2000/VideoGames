(function() {
    let clicks = 0;
    let timeLeft = 10;
    let timerId = null;
    let gameActive = false;
    const container = document.querySelector('.canvas-placeholder');

    // Selección del usuario (basado en tu estructura actual)
    const userElement = document.getElementById('display-user') || { innerText: "Leandro" };
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
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:white; padding: 20px; box-sizing: border-box;">
                <p id="timer-display" style="color:#00f0ff; font-size:1.2rem; margin-bottom:10px;">Tiempo: ${timeLeft}s</p>
                <div id="click-target" style="width:140px; height:140px; background:#00f0ff; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 0 25px #00f0ff; user-select:none; transition: transform 0.05s;">
                    <span style="color:#0d0221; font-weight:bold; font-size:2.5rem;">+1</span>
                </div>
                <p style="margin-top:20px; font-size:1.5rem;">Clicks: <span id="click-count" style="color:#00f0ff; font-weight:bold;">0</span></p>
            </div>
        `;

        const target = document.getElementById('click-target');
        const handleInteraction = (e) => {
            if (e.type === 'touchstart') e.preventDefault();
            if (gameActive) {
                clicks++;
                const countDisplay = document.getElementById('click-count');
                if (countDisplay) countDisplay.innerText = clicks;
                target.style.transform = "scale(0.9)";
                setTimeout(() => target.style.transform = "scale(1)", 50);
            }
        };

        target.onclick = handleInteraction;
        target.ontouchstart = handleInteraction;
    }

    function updateTimer() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) timerDisplay.innerText = `Tiempo: ${timeLeft}s`;
    }

    function endGame() {
        gameActive = false;
        clearInterval(timerId);

        // Pantalla de Game Over limpia: Solo Reintentar y Cambiar Cuenta
        container.innerHTML = `
            <div id="game-over-screen" style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%; text-align:center; color:white; background:rgba(13,2,33,0.98); border-radius:15px; padding: 20px; box-sizing: border-box;">
                <h1 style="color: #00f0ff; text-shadow: 0 0 10px #00f0ff; font-size: 1.8rem; margin: 0 0 10px 0;">TIEMPO AGOTADO</h1>
                <p style="font-size: 1.3rem; margin-bottom: 20px;">Total de Clicks: <span style="color:#00f0ff">${clicks}</span></p>
                
                <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 250px;">
                    <button id="btn-restart-clicker" style="background:#00f0ff; color:#0d0221; font-weight:bold; height: 50px; border:none; border-radius:8px; cursor:pointer; font-size: 1rem;">
                        🎮 REINTENTAR
                    </button>
                    <button onclick="location.reload()" style="background:transparent; color:#888; border:none; font-size: 0.8rem; text-decoration:underline; cursor:pointer; margin-top: 5px;">
                        Entrar con otra cuenta
                    </button>
                </div>
            </div>
        `;

        document.getElementById('btn-restart-clicker').onclick = startGame;

        // Guardar puntaje y actualizar ranking con la misma lógica que Snake/Trivia
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre: user, puntos: clicks, juego: 'clicker' })
        })
        .then(res => {
            if (res.ok) {
                actualizarRankingLateral('clicker');
            }
        })
        .catch(err => console.error("Error al guardar:", err));
    }

    function actualizarRankingLateral(juego) {
        fetch('/obtener_ranking')
        .then(res => res.json())
        .then(data => {
            // Misma lógica de filtrado y ordenamiento que en Trivia
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

    // Pequeño delay para asegurar que el container esté listo
    setTimeout(startGame, 200);
})();
