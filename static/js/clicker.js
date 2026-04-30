const banco = [
    { p: "¿Qué partícula tiene carga negativa?", r: ["Protón", "Neutrón", "Electrón"], c: 2 },
    { p: "¿Cuál es la velocidad de la luz aprox?", r: ["300,000 km/s", "150,000 km/s"], c: 0 },
    { p: "Si un agujero negro tiene más masa, ¿su radio de Schwarzschild...?", r: ["Aumenta", "Disminuye", "No cambia"], c: 0 },
    { p: "¿Qué lenguaje usa Flask?", r: ["JS", "Python", "PHP"], c: 1 },
    { p: "¿Cuántos bits hay en un byte?", r: ["4", "8", "16"], c: 1 }
];

let idx = 0, score = 0, racha = 1;
const user = document.getElementById('display-user').innerText;

function dibujarPregunta() {
    const cont = document.querySelector('.canvas-placeholder');
    if (idx >= banco.length) {
        document.getElementById('game-over-screen').style.display = 'flex';
        document.getElementById('final-score-msg').innerText = `Tu sabiduría: ${score} puntos`;
        guardarPuntaje();
        return;
    }

    const q = banco[idx];
    cont.innerHTML = `
        <div style="padding:20px; text-align:center; width:100%;">
            <div style="color:var(--accent); font-weight:bold;">Racha: x${racha}</div>
            <h2 style="margin:20px 0; font-size:1.4rem;">${q.p}</h2>
            <div style="display:grid; gap:10px;">
                ${q.r.map((opt, i) => `<button class="btn-play" onclick="chequear(${i})">${opt}</button>`).join('')}
            </div>
        </div>
    `;
}

function chequear(i) {
    if (i === banco[idx].c) {
        score += 10 * racha;
        racha++;
    } else {
        racha = 1;
    }
    idx++;
    dibujarPregunta();
}

async function guardarPuntaje() {
    await fetch('/guardar_puntaje', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nombre: user, puntos: score, juego: 'trivia' })
    });
}

dibujarPregunta();
