(function() {
    const rawQuestions = [
        { q: "¿Cuál es la unidad de la fuerza en el SI?", a: ["Pascal", "Newton", "Joule", "Watt"], c: 1 },
        { q: "¿Qué sucede en el horizonte de sucesos?", a: ["La luz escapa", "El tiempo se detiene", "Nada escapa", "Se ve blanco"], c: 2 },
        { q: "¿Lenguaje base para la estructura web?", a: ["Python", "HTML", "PHP", "Java"], c: 1 },
        { q: "¿Qué partícula tiene carga positiva?", a: ["Electrón", "Neutrón", "Protón", "Fotón"], c: 2 },
        { q: "¿Cuál es el planeta más grande?", a: ["Saturno", "Urano", "Júpiter", "Neptuno"], c: 2 },
        { q: "¿Qué comando SQL se usa para leer datos?", a: ["UPDATE", "INSERT", "SELECT", "DELETE"], c: 2 },
        { q: "¿Quién propuso la relatividad?", a: ["Newton", "Einstein", "Tesla", "Hawking"], c: 1 },
        // --- 15 PREGUNTAS NUEVAS ---
        { q: "¿Qué significa el 5 en HTML5?", a: ["Versión 5", "5 lenguajes", "5 navegadores", "5 años"], c: 0 },
        { q: "¿Cuál es la velocidad de la luz aprox.?", a: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "343 m/s"], c: 0 },
        { q: "¿Qué planeta es conocido como el Lucero del Alba?", a: ["Marte", "Mercurio", "Venus", "Júpiter"], c: 2 },
        { q: "¿Cómo se llama la fuerza que atrae objetos al centro de la Tierra?", a: ["Fricción", "Gravedad", "Magnética", "Inercia"], c: 1 },
        { q: "¿Qué lenguaje se ejecuta en el lado del cliente?", a: ["PHP", "Python", "JavaScript", "SQL"], c: 2 },
        { q: "¿Quién pintó la Mona Lisa?", a: ["Van Gogh", "Picasso", "Da Vinci", "Dalí"], c: 2 },
        { q: "¿Qué país tiene forma de bota?", a: ["España", "Italia", "Grecia", "Francia"], c: 1 },
        { q: "¿Cuál es el elemento químico del agua?", a: ["H2O", "O2", "CO2", "HO2"], c: 0 },
        { q: "¿Qué propiedad CSS cambia el color de fondo?", a: ["color", "background-color", "bg-color", "fill"], c: 1 },
        { q: "¿Cuál es el océano más grande del mundo?", a: ["Atlántico", "Índico", "Ártico", "Pacífico"], c: 3 },
        { q: "¿Qué dispositivo convierte código en algo visual?", a: ["Teclado", "Navegador", "Router", "CPU"], c: 1 },
        { q: "¿En qué año llegó el hombre a la Luna?", a: ["1959", "1969", "1979", "1989"], c: 1 },
        { q: "¿Cuál es el símbolo químico del Oro?", a: ["Ag", "Fe", "Au", "Cu"], c: 2 },
        { q: "¿Qué comando de Python imprime en pantalla?", a: ["echo", "log", "print", "display"], c: 2 }
    ];

    let questions = [];
    let current = 0, score = 0;
    const container = document.querySelector('.canvas-placeholder');
    const userElement = document.getElementById('display-user') || { innerText: "Leandro" };
    let user = userElement.innerText.replace("Jugador: ", "").trim();

    function shuffleQuestions() {
        // Copiamos y desordenamos el array
        questions = [...rawQuestions].sort(() => Math.random() - 0.5);
    }

    function resetGame() {
        current = 0;
        score = 0;
        shuffleQuestions();
        render();
    }

    function render() {
        if (!container) return;
        container.innerHTML = ""; 
        if (current >= questions.length) return end();

        const data = questions[current];
        const div = document.createElement('div');
        div.style.cssText = "padding:20px; text-align:left; width:100%; display:flex; flex-direction:column; justify-content:center; height:100%; color:white; box-sizing: border-box;";
        div.innerHTML = `
            <p style="color:#00f0ff; font-size:0.8rem; margin-bottom:5px;">Pregunta ${current + 1} de ${questions.length}</p>
            <h2 style="margin-bottom:20px; font-size:1.1rem; line-height: 1.2;">${data.q}</h2>
        `;

        const optionsContainer = document.createElement('div');
        optionsContainer.style.cssText = "display:flex; flex-direction:column; gap:8px; width:100%;";

        data.a.forEach((opt, i) => {
            const b = document.createElement('button');
            b.style.cssText = "width:100%; text-align:left; padding:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); cursor:pointer; color: white; border-radius: 5px;";
            b.innerHTML = `<span>${opt}</span> <span class="feedback"></span>`;
            
            b.onclick = () => {
                const allButtons = optionsContainer.querySelectorAll('button');
                allButtons.forEach(btn => btn.style.pointerEvents = "none");
                if (i === data.c) {
                    score += 10;
                    b.style.borderColor = "#00f0ff"; b.style.background = "rgba(0, 240, 255, 0.1)";
                } else {
                    b.style.borderColor = "#ff4757"; b.style.background = "rgba(255, 71, 87, 0.1)";
                    allButtons[data.c].style.borderColor = "#00f0ff";
                }
                setTimeout(() => { current++; render(); }, 1000);
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
            screen.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(13,2,33,0.98); display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:9999; text-align:center; color:white; border-radius:15px; padding: 20px; box-sizing: border-box;";
            container.appendChild(screen);
        }
        screen.innerHTML = `
            <h1 style="color: #00f0ff; text-shadow: 0 0 10px #00f0ff; font-size: 1.8rem; margin: 0 0 10px 0;">FIN DE TRIVIA</h1>
            <p style="font-size: 1.3rem; margin-bottom: 20px;">Puntaje: <span style="color:#00f0ff">${score} / ${questions.length * 10}</span></p>
            <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 280px;">
                <button id="btn-restart-trivia" style="background:#00f0ff; color:#0d0221; font-weight:bold; height: 50px; border:none; border-radius:8px; cursor:pointer;">🎮 REINTENTAR</button>
                <button id="btn-menu-trivia" style="background:#333; color:white; height: 50px; border:none; border-radius:8px; cursor:pointer;">🏠 MENÚ PRINCIPAL</button>
            </div>
        `;
        screen.style.display = 'flex';
        document.getElementById('btn-restart-trivia').onclick = () => { screen.style.display = 'none'; resetGame(); };
        document.getElementById('btn-menu-trivia').onclick = () => { window.location.href = "index.html"; };

       fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            // CORRECCIÓN: Cambiar 'snake' por 'trivia'
            body: JSON.stringify({nombre: user, puntos: score, juego: 'trivia'}) 
        }).then(() => {
            actualizarRankingLateral('trivia'); // CORRECCIÓN: 'trivia'
        });

        // Asegúrate de que esta función esté definida dentro del scope de la Trivia
        function actualizarRankingLateral(juego) {
            fetch('/obtener_ranking')
            .then(res => res.json())
            .then(data => {
                const topJuego = data.ranking.filter(r => r.juego === juego).slice(0, 5);
                const listaHtml = document.querySelector('.ranking-lateral ul');
                if (listaHtml) {
                    listaHtml.innerHTML = topJuego.map(r => `<li>${r.nombre}: ${r.puntos}</li>`).join('');
                }
            });
        }
    }

    shuffleQuestions();
    setTimeout(render, 200);
})();
