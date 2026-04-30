const banco = [
    { p: "¿Qué partícula tiene carga negativa?", r: ["Protón", "Neutrón", "Electrón"], c: 2 },
    { p: "¿Cuál es la velocidad de la luz?", r: ["300,000 km/s", "150,000 km/s"], c: 0 },
    { p: "¿En qué lenguaje corre Flask?", r: ["Java", "Python", "PHP"], c: 1 },
    { p: "¿Cuál es el componente que procesa los datos en la PC?", r: ["RAM", "CPU", "SSD"], c: 1 },
    { p: "¿Qué significa HTML?", r: ["HyperText Markup Language", "High Tech Machine Learning"], c: 0 },
    { p: "¿Cuál es el río más largo del mundo?", r: ["Nilo", "Amazonas", "Guayas"], c: 1 },
    { p: "¿Quién pintó la Mona Lisa?", r: ["Picasso", "Da Vinci", "Van Gogh"], c: 1 },
    { p: "¿Cuántos bits hay en un byte?", r: ["4 bits", "8 bits", "16 bits"], c: 1 },
    { p: "¿Cuál es el lenguaje principal para Flask?", r: ["JavaScript", "Python", "PHP"], c: 1 },
    { p: "¿Qué componente de la PC se considera el 'cerebro'?", r: ["Memoria RAM", "Procesador (CPU)", "Disco Duro"], c: 1 },
    { p: "¿Cuál es el planeta más grande del sistema solar?", r: ["Marte", "Saturno", "Júpiter"], c: 2 },
    { p: "¿En qué año se descubrió América?", r: ["1492", "1500", "1485"], c: 0 },
    { p: "¿Qué significan las siglas HTML?", r: ["HyperText Markup Language", "HyperTool Multi Language"], c: 0 },
    { p: "¿Cuál es el metal más caro del mundo?", r: ["Oro", "Rodio", "Plata"], c: 1 },
    { p: "¿Cuántos continentes hay en la Tierra?", r: ["5", "6", "7"], c: 1 }
];

let idx = 0, score = 0, racha = 1;
const user = document.getElementById('display-user').innerText;

function dibujarPregunta() {
    const cont = document.querySelector('.canvas-placeholder');
    if (idx >= banco.length) {
        const overlay = document.getElementById('game-over-screen');
        overlay.style.display = 'flex';
        document.getElementById('final-score-msg').innerText = `Puntaje intelectual: ${score}`;
        guardarPuntaje(user, score, 'trivia');
        return;
    }

    const q = banco[idx];
    cont.innerHTML = `
        <div style="padding:30px; text-align:center;">
            <div style="color:var(--accent)">Racha actual: x${racha}</div>
            <h2 style="margin:20px 0;">${q.p}</h2>
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

async function guardarPuntaje(nombre, puntos, juego) {
    try {
        const respuesta = await fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombre,
                puntos: puntos,
                juego: juego
            })
        });
        
        const resultado = await respuesta.json();
        if (resultado.status === "success") {
            console.log("Puntaje guardado con éxito");
        }
    } catch (error) {
        console.error("Error al guardar puntaje:", error);
    }
}

dibujarPregunta();