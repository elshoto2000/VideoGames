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
    const user = document.getElementById('display-user').innerText;

    function render() {
        container.innerHTML = ""; // Limpieza total
        if (current >= questions.length) return end();

        const data = questions[current];
        const div = document.createElement('div');
        div.style.cssText = "padding:20px; text-align:center; width:100%";
        div.innerHTML = `<h2 style="margin-bottom:20px;">${data.q}</h2>`;

        data.a.forEach((opt, i) => {
            const b = document.createElement('button');
            b.className = "btn-play";
            b.style.margin = "5px";
            b.innerText = opt;
            b.onclick = () => {
                if (i === data.c) score += 20;
                current++;
                render();
            };
            div.appendChild(b);
        });
        container.appendChild(div);
    }

    function end() {
        document.getElementById('game-over-screen').style.display = 'flex';
        document.getElementById('final-score-msg').innerText = `Puntos: ${score}`;
        fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nombre: user, puntos: score, juego: 'trivia'})
        });
    }

    render();
})();
