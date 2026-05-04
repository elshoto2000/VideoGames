(function() {
    let clicks = 0;
    let timeLeft = 10;
    let timerId = null;
    let gameActive = false;
    const container = document.querySelector('.canvas-placeholder');

    // 1. CORRECCIÓN: Obtener el nombre real del usuario que entró
    const userElement = document.getElementById('display-user') || { innerText: "Invitado" };
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

    container.innerHTML = `
        <div id="game-over-screen" style="
            display:flex; 
            flex-direction:column; 
            justify-content:center; 
            align-items:center; 
            width:100%; 
            height:100%; 
            position:absolute; 
            top:0; left:0; 
            background:rgba(13,2,33,0.95); 
            padding: 10px; 
            box-sizing: border-box;
            border: 2px solid #00f0ff;
            border-radius: 15px;">
            
            <h2 style="color: #00f0ff; text-shadow: 0 0 10px #00f0ff; font-size: 1.5rem; margin-bottom: 10px;">TIEMPO AGOTADO</h2>
            <p style="font-size: 1.2rem; color: white; margin-bottom: 15px;">Clicks: <span style="color:#00f0ff; font-weight:bold;">${clicks}</span></p>
            
            <button id="btn-restart-clicker" style="
                width: 80%; 
                max-width: 200px;
                background:#00f0ff; 
                color:#0d0221; 
                font-weight:bold; 
                padding: 12px; 
                border:none; 
                border-radius:8px; 
                cursor:pointer; 
                font-size: 1rem;
                box-shadow: 0 0 15px rgba(0,240,255,0.4);">
                🎮 REINTENTAR
            </button>
            
            <button onclick="location.reload()" style="background:transparent; color:#888; border:none; font-size: 0.8rem; text-decoration:underline; cursor:pointer; margin-top: 15px;">
                Cambiar Jugador
            </button>
        </div>
    `;

    document.getElementById('btn-restart-clicker').onclick = startGame;

        // 2. CORRECCIÓN: Enviar las variables correctas (user y clicks)
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: user, 
                puntos: clicks,
                juego: 'clicker' // Cambiado de 'snake' a 'clicker'
            })
        })
        .then(response => response.json())
        .then(data => {
            if(data.status === "success") {
                console.log("¡Puntaje guardado!");
                // 3. CORRECCIÓN: Actualizar el ranking lateral inmediatamente
                actualizarRankingLateral('clicker');
            }
        });
    } // <-- Te faltaba esta llave de cierre

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

    setTimeout(startGame, 200);
})();
