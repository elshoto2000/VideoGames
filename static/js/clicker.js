(function() {
    let score = 0, timeLeft = 10, active = false;
    let gameInterval = null; 
    const container = document.querySelector('.canvas-placeholder');
    
    // Obtenemos el usuario de la interfaz
    const user = document.getElementById('display-user').innerText;

    // Inicializamos la interfaz del clicker dentro del contenedor fijo
    container.innerHTML = `
        <div id="clicker-area" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%; position:relative; overflow:hidden;">
            <div id="stats" style="position:absolute; top:20px; text-align:center; pointer-events: none; z-index: 5;">
                <h1 id="c-count" style="font-size:4rem; color:var(--neon); margin:0; text-shadow: 0 0 10px var(--neon);">0</h1>
                <p id="c-timer" style="font-size:1.5rem; color:white;">10s</p>
            </div>
            <button id="target" class="btn-play" style="padding:30px; border-radius:50%; font-size:1.2rem; transition:0.05s; z-index:10; position: absolute; border: 2px solid white;">¡DALE!</button>
        </div>
    `;

    const btn = document.getElementById('target');
    const countTxt = document.getElementById('c-count');
    const timerTxt = document.getElementById('c-timer');

    // Función para mover el botón solo dentro del área del juego
    function move() {
        // Usamos porcentajes del 15% al 85% para que el botón no se corte en los bordes
        const x = Math.random() * 70 + 15;
        const y = Math.random() * 70 + 15;
        btn.style.left = x + '%';
        btn.style.top = y + '%';
        btn.style.transform = 'translate(-50%, -50%)';
    }

    // Posición inicial del botón
    move();

    btn.onclick = () => {
        // Iniciar el cronómetro con el primer clic
        if (!active && timeLeft === 10) {
            active = true;
            gameInterval = setInterval(() => {
                timeLeft--;
                if (timerTxt) timerTxt.innerText = timeLeft + "s";
                
                if (timeLeft <= 0) {
                    clearInterval(gameInterval);
                    finish();
                }
            }, 1000);
        }

        if (active) {
            score++;
            if (countTxt) countTxt.innerText = score;
            move();
        }
    };

    function finish() {
        active = false;
        
        // Limpiamos el área de juego para que no se vea el botón quieto al fondo
        container.innerHTML = ""; 

        const overlay = document.getElementById('game-over-screen');
        if (overlay) {
            // Inyectamos el Game Over con los botones específicos[cite: 1]
            overlay.innerHTML = `
                <h1 style="color: var(--neon); text-shadow: 0 0 15px var(--neon); margin-bottom: 10px;">¡TIEMPO!</h1>
                <p style="font-size: 1.5rem; margin-bottom: 20px;">Hiciste ${score} clics</p>
                
                <div style="display: flex; flex-direction: column; gap: 10px; width: 80%;">
                    <button onclick="location.reload()" class="btn-play" style="background: var(--neon); color: #0d0221; font-weight: bold;">
                        REINTENTAR
                    </button>
                    <button onclick="window.location.href=window.location.href" class="btn-play" style="background: var(--muted); font-size: 0.8rem; opacity: 0.8;">
                        CAMBIAR DE CUENTA
                    </button>
                </div>
            `;
            overlay.style.display = 'flex';
        }

        // Guardar puntaje en el servidor[cite: 1]
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nombre: user, puntos: score, juego: 'clicker'})
        }).catch(err => console.error("Error al guardar clicker:", err));
    }
})();
