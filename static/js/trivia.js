(function() {
    const questions = [
        { q: "¿Cuál es la unidad de la fuerza?", a: ["Newton", "Pascal", "Joule"], c: 0 },
        { q: "¿Qué sucede en el horizonte de sucesos?", a: ["Nada escapa", "Se sale del universo", "Se ve luz blanca"], c: 0 },
        { q: "¿Lenguaje base de la web?", a: ["Java", "HTML", "C++"], c: 1 },
        { q: "¿Planeta con anillos más visibles?", a: ["Urano", "Júpiter", "Saturno"], c: 2 },
        { q: "¿Qué partícula no tiene carga?", a: ["Electrón", "Neutrón", "Protón"], c: 1 }
    ];

    let current = 0, score = 0;
    const container = document.querySelector('.canvas-placeholder');
    // Obtenemos el usuario de la interfaz
    const user = document.getElementById('display-user').innerText;

    function render() {
        // Limpieza total del contenedor antes de dibujar la siguiente pregunta o el final
        container.innerHTML = ""; 

        if (current >= questions.length) {
            return end();
        }

        const data = questions[current];
        const div = document.createElement('div');
        
        // Estilos básicos para centrar el contenido de la trivia
        div.style.cssText = "padding:20px; text-align:center; width:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;";
        
        div.innerHTML = `<h2 style="margin-bottom:20px; color:white; text-shadow: 0 0 10px var(--neon);">${data.q}</h2>`;

        const optionsContainer = document.createElement('div');
        optionsContainer.style.cssText = "display:flex; flex-wrap:wrap; justify-content:center; gap:10px;";

        data.a.forEach((opt, i) => {
            const b = document.createElement('button');
            b.className = "btn-play"; // Reutilizamos tu clase de CSS
            b.innerText = opt;
            b.onclick = () => {
                if (i === data.c) score += 20;
                current++;
                render();
            };
            optionsContainer.appendChild(b);
        });

        div.appendChild(optionsContainer);
        container.appendChild(div);
    }

    function end() {
        // 1. Limpieza absoluta para que no queden botones "debajo" del overlay
        container.innerHTML = ""; 

        // 2. Activar el overlay de Game Over
        const overlay = document.getElementById('game-over-screen');
        if (overlay) {
            overlay.style.display = 'flex';
            const msg = document.getElementById('final-score-msg');
            if (msg) msg.innerText = `Puntos: ${score}`;
        }

        // 3. Envío de datos al servidor
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre: user, puntos: score, juego: 'trivia' })
        }).catch(err => console.error("Error al guardar trivia:", err));
    }

    // Iniciar el renderizado
    render();
})();
