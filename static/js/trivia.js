(function() {
    const questions = [
        { q: "¿Cuál es la unidad de la fuerza en el SI?", a: ["Pascal", "Newton", "Joule", "Watt"], c: 1 },
        { q: "¿Qué sucede en el horizonte de sucesos?", a: ["La luz escapa", "El tiempo se detiene", "Nada escapa", "Se ve blanco"], c: 2 },
        { q: "¿Lenguaje base para la estructura web?", a: ["Python", "HTML", "PHP", "Java"], c: 1 },
        { q: "¿Qué partícula tiene carga positiva?", a: ["Electrón", "Neutrón", "Protón", "Fotón"], c: 2 },
        { q: "¿Cuál es el planeta más grande del sistema solar?", a: ["Saturno", "Urano", "Júpiter", "Neptuno"], c: 2 },
        { q: "¿Qué comando en SQL se usa para leer datos?", a: ["UPDATE", "INSERT", "SELECT", "DELETE"], c: 2 },
        { q: "¿Quién propuso la teoría de la relatividad?", a: ["Newton", "Einstein", "Tesla", "Hawking"], c: 1 },
        { q: "¿Qué etiqueta HTML se usa para los enlaces?", a: ["<link>", "<a>", "<href>", "<src>"], c: 1 }
    ];

    let current = 0, score = 0;
    const container = document.querySelector('.canvas-placeholder');

    const userElement = document.getElementById('display-user') || document.querySelector('span[style*="color: red"]') || { innerText: "Leandro" };
    let user = userElement.innerText.replace("Jugador: ", "").trim();

    function resetGame() {
        current = 0;
        score = 0;
        render();
    }

    function render() {
        if (!container) return;
        container.innerHTML = ""; 

        if (current >= questions.length) {
            return end();
        }

        const data = questions[current];
        const div = document.createElement('div');
        div.style.cssText = "padding:20px; text-align:left; width:100%; display:flex; flex-direction:column; justify-content:center; height:100%; color:white; box-sizing: border-box;";
        
        div.innerHTML = `
            <p style="color:#00f0ff; font-size:0.8rem; margin-bottom:5px;">Pregunta ${current + 1} de ${questions.length}</p>
            <h2 style="margin-bottom:20px; font-size:1.2rem; line-height: 1.2;">${data.q}</h2>
        `;

        const optionsContainer = document.createElement('div');
        optionsContainer.style.cssText = "display:flex; flex-direction:column; gap:10px; width:100%;";

        data.a.forEach((opt, i) => {
            const b = document.createElement('button');
            b.className = "btn-play";
            b.style.cssText = "width:100%; text-align:left; padding:12px; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); cursor:pointer; color: white; font-family: inherit;";
            b.innerHTML = `<span>${opt}</span> <span class="feedback"></span>`;
            
            b.onclick = () => {
                const allButtons = optionsContainer.querySelectorAll('button');
                allButtons.forEach(btn => btn.style.pointerEvents = "none");

                const feedback = b.querySelector('.feedback');
                
                if (i === data.c) {
                    score += 10;
                    b.style.borderColor = "#00f0ff"; 
                    b.style.background = "rgba(0, 240, 255, 0.1)";
                    feedback.innerHTML = "✅";
                } else {
                    b.style.borderColor = "#ff4757"; 
                    b.style.background = "rgba(255, 71, 87, 0.1)";
                    feedback.innerHTML = "❌";
                    allButtons[data.c].style.borderColor = "#00f0ff";
                    allButtons[data.c].querySelector('.feedback').innerHTML = "✅";
                }

                setTimeout(() => {
                    current++;
                    render(); 
                }, 1000);
            };
            optionsContainer.appendChild(b);
        });

        div.appendChild(optionsContainer);
        container.appendChild(div);
    }

    function end() {
        container.innerHTML = ""; 
        
        let screen = document.getElementById('game-over-screen');
        if (!screen) {
            screen = document.createElement('div');
            screen.id = 'game-over-screen';
            screen.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(13,2,33,0.95); display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:9999; text-align:center; color:white; border-radius:15px;";
            container.appendChild(screen);
        }

        screen.innerHTML = `
            <h1 style="color: #00f0ff; text-shadow: 0 0 15px #00f0ff; margin-bottom:10px;">FIN DE TRIVIA</h1>
            <p style="font-size: 1.5rem; margin-bottom: 20px;">Puntaje: ${score} / ${questions.length * 10}</p>
            <div style="display: flex; flex-direction: column; gap: 10px; width: 80%; max-width: 300px;">
                <button id="btn-restart" class="btn-play" style="background: #00f0ff; color: #0d0221; font-weight:bold; padding: 12px; border: none; cursor: pointer; border-radius: 4px;">REINTENTAR</button>
                <button id="btn-back-menu" class="btn-play" style="background: #555; color: white; padding: 12px; border: none; cursor: pointer; border-radius: 4px;">VOLVER AL MENÚ</button>
                <button onclick="location.reload()" style="background: transparent; color: #aaa; border: none; font-size: 0.7rem; cursor: pointer; margin-top: 5px;">Cambiar de cuenta</button>
            </div>
        `;
        screen.style.display = 'flex';

        // Configurar el botón VOLVER AL MENÚ con la ruta corregida
        document.getElementById('btn-back-menu').onclick = () => {
            window.location.href = "index.html"; 
        };

        document.getElementById('btn-restart').onclick = () => {
            screen.style.display = 'none';
            resetGame();
        };

        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre: user, puntos: score, juego: 'trivia' })
        });
    }

    setTimeout(render, 200);
})();
