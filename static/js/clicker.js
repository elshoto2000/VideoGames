(function() {
    let score = 0, timeLeft = 10, active = false;
    const container = document.querySelector('.canvas-placeholder');
    const user = document.getElementById('display-user').innerText;

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%; position:relative;">
            <div id="stats" style="position:absolute; top:20px; text-align:center;">
                <h1 id="c-count" style="font-size:4rem; color:var(--neon); margin:0;">0</h1>
                <p id="c-timer" style="font-size:1.5rem; color:white;">10s</p>
            </div>
            <button id="target" class="btn-play" style="padding:40px; border-radius:50%; font-size:1.5rem; transition:0.05s;">¡DALE!</button>
        </div>
    `;

    const btn = document.getElementById('target');
    const countTxt = document.getElementById('c-count');
    const timerTxt = document.getElementById('c-timer');

    function move() {
        const x = Math.random() * 60 + 20;
        const y = Math.random() * 50 + 30;
        btn.style.position = 'absolute';
        btn.style.left = x + '%';
        btn.style.top = y + '%';
    }

    btn.onclick = () => {
        if (!active && timeLeft === 10) {
            active = true;
            let timer = setInterval(() => {
                timeLeft--;
                timerTxt.innerText = timeLeft + "s";
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    active = false;
                    btn.style.display = "none";
                    finish();
                }
            }, 1000);
        }
        if (active) {
            score++;
            countTxt.innerText = score;
            move();
        }
    };

    function finish() {
        const overlay = document.getElementById('game-over-screen');
        overlay.style.display = 'flex';
        document.getElementById('final-score-msg').innerText = `Hiciste ${score} clics`;
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nombre: user, puntos: score, juego: 'clicker'})
        });
    }
})();
