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
    const user = document.getElementById('display-user').innerText;[cite: 1]

    function render() {
        container.innerHTML = ""; 

        if (current >= questions.length) {
            return end();
        }

        const data = questions[current];
        const div = document.createElement('div');
        
        // Estilo de contenedor tipo formulario
        div.style.cssText = "padding:20px; text-align:left; width:100%; display:flex; flex-direction:column; justify-content:center; height:100%; color:white;";
        
        div.innerHTML = `
            <p style="color:var(--neon); font-size:0.8rem; margin-bottom:5px;">Pregunta ${current + 1} de ${questions.length}</p>
            <h2 style="margin-bottom:25px; font-size:1.4rem; text-shadow: 0 0 10px rgba(255,255,255,0.3);">${data.q}</h2>
        `;

        const optionsContainer = document.createElement('div');
        optionsContainer.style.cssText = "display:flex; flex-direction:column; gap:12px; width:100%;";

        data.a.forEach((opt, i) => {
            const b = document.createElement('button');
            b.className = "btn-play";
            // Alineación estilo formulario
            b.style.cssText = "width:100%; text-align:left; padding:15px; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);";
            b.innerHTML = `<span>${opt}</span> <span class="feedback"></span>`;
            
            b.onclick = () => {
                // Bloquear otros clics
                const allButtons = optionsContainer.querySelectorAll('button');
                allButtons.forEach(btn => btn.style.pointerEvents = "none");

                const feedback = b.querySelector('.feedback');
                
                if (i === data.c) {
                    score += 10;
                    b.style.borderColor = "var(--neon)";
                    feedback.innerHTML = "✅"; // Visto bueno
                } else {
                    b.style.borderColor = "var(--accent)";
                    feedback.innerHTML = "❌"; // Error
                    // Mostrar cuál era la correcta
                    allButtons[data.c].style.borderColor = "var(--neon)";
                    allButtons[data.c].querySelector('.feedback').innerHTML = "✅";
                }

                // Pequeña pausa para ver la respuesta antes de seguir
                setTimeout(() => {
                    current++;
                    render();
                }, 1200);
            };
            optionsContainer.appendChild(b);
        });

        div.appendChild(optionsContainer);
        container.appendChild(div);
    }

    function end() {
        container.innerHTML = ""; 
        const overlay = document.getElementById('game-over-screen');
        if (overlay) {
            overlay.innerHTML = `
                <h1 style="color: var(--neon); text-shadow: 0 0 15px var(--neon);">TRIVIA COMPLETADA</h1>
                <p style="font-size: 1.5rem; margin-bottom: 20px;">Puntaje: ${score} / ${questions.length * 10}</p>
                <div style="display: flex; flex-direction: column; gap: 10px; width: 80%;">
                    <button onclick="location.reload()" class="btn-play" style="background: var(--neon); color: #0d0221; font-weight:bold;">REINTENTAR</button>
                    <button onclick="window.location.href=window.location.href" class="btn-play" style="background: var(--muted); font-size: 0.8rem;">CAMBIAR DE CUENTA</button>
                </div>
            `;
            overlay.style.display = 'flex';
        }

        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre: user, puntos: score, juego: 'trivia' })
        }).catch(err => console.error("Error al guardar trivia:", err));
    }

    render();
})();
