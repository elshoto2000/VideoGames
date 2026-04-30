(function() {
    let score = 0, timeLeft = 10, active = false;
    let gameInterval = null; // Para controlar y detener el timer
    const container = document.querySelector('.canvas-placeholder');
    const user = document.getElementById('display-user').innerText;

    // Inicializamos la interfaz del clicker
    container.innerHTML = `
        <div id="clicker-area" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%; position:relative;">
            <div id="stats" style="position:absolute; top:20px; text-align:center; pointer-events: none;">
                <h1 id="c-count" style="font-size:4rem; color:var(--neon); margin:0;">0</h1>
                <p id="c-timer" style="font-size:1.5rem; color:white;">10s</p>
            </div>
            <button id="target" class="btn-play" style="padding:40px; border-radius:50%; font-size:1.5rem; transition:0.05s; z-index:10;">¡DALE!</button>
        </div>
    `;

    const btn = document.getElementById('target');
    const countTxt = document.getElementById('c-count');
    const timerTxt = document.getElementById('c-timer');

    function move() {
        // Mantenemos el botón dentro de rangos seguros (20% a 80%) para que no se salga del canvas
        const x = Math.random() * 60 + 20;
        const y = Math.random() * 50 + 30;
        btn.style.position = 'absolute';
        btn.style.left = x + '%';
        btn.style.top = y + '%';
        btn.style.transform = 'translate(-50%, -50%)'; // Centra el botón en el punto aleatorio
    }

    btn.onclick = () => {
        // Iniciar el juego con el primer clic
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
        
        // 1. Limpieza total del área de juego para evitar botones fantasma
        container.innerHTML = ""; 

        // 2. Mostrar overlay de Game Over
        const overlay = document.getElementById('game-over-screen');
        if (overlay) {
            overlay.style.display = 'flex';
            const msg = document.getElementById('final-score-msg');
            if (msg) msg.innerText = `Hiciste ${score} clics`;
        }

        // 3. Guardar puntaje
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nombre: user, puntos: score, juego: 'clicker'})
        }).catch(err => console.error("Error al guardar clicker:", err));
    }
})();
