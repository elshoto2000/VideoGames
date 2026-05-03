(function() {
    const categories = {
        "Historia": [
            { q: "¿En qué año llegó el hombre a la Luna?", a: ["1959", "1969", "1979", "1989"], c: 1 },
            { q: "¿Quién descubrió América?", a: ["Magallanes", "Colón", "Vespucio", "Pizarro"], c: 1 },
            { q: "¿Qué país tiene forma de bota?", a: ["España", "Italia", "Grecia", "Francia"], c: 1 },
            { q: "¿Cuál era la moneda de España antes del Euro?", a: ["Peseta", "Escudo", "Franco", "Lira"], c: 0 },
            { q: "¿En qué siglo comenzó la Revolución Industrial?", a: ["XVIII", "XIX", "XVII", "XX"], c: 0 },
            { q: "¿Quién fue el primer presidente de EE.UU.?", a: ["Lincoln", "Jefferson", "Washington", "Adams"], c: 2 },
            { q: "¿Qué civilización construyó las pirámides de Giza?", a: ["Mayas", "Incas", "Egipcios", "Aztecas"], c: 2 },
            { q: "¿Cuál fue la capital del Imperio Inca?", a: ["Lima", "Quito", "Cusco", "Machu Picchu"], c: 2 },
            { q: "¿En qué año terminó la Segunda Guerra Mundial?", a: ["1940", "1945", "1950", "1939"], c: 1 },
            { q: "¿Quién era conocido como 'El Libertador'?", a: ["San Martín", "Sucre", "Bolívar", "Hidalgo"], c: 2 },
            { q: "¿Qué reina financió el viaje de Colón?", a: ["Isabel la Católica", "Victoria", "Catalina II", "Juana I"], c: 0 },
            { q: "¿Dónde nació la democracia?", a: ["Roma", "Atenas", "Esparta", "París"], c: 1 },
            { q: "¿Qué muro cayó en 1989?", a: ["Muro de Adriano", "Muro de Berlín", "Muro de China", "Muro Atlántico"], c: 1 },
            { q: "¿Quién fue el líder de la Revolución Rusa?", a: ["Stalin", "Lenin", "Trotsky", "Putin"], c: 1 },
            { q: "¿Cuál es el río más largo del mundo?", a: ["Nilo", "Amazonas", "Misisipi", "Danubio"], c: 1 }
        ],
        "Ciencia y Física": [
            { q: "¿Cuál es la unidad de la fuerza en el SI?", a: ["Pascal", "Newton", "Joule", "Watt"], c: 1 },
            { q: "¿Qué partícula tiene carga positiva?", a: ["Electrón", "Neutrón", "Protón", "Fotón"], c: 2 },
            { q: "¿Cuál es la velocidad de la luz aprox.?", a: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "343 m/s"], c: 0 },
            { q: "¿Quién propuso la relatividad?", a: ["Newton", "Einstein", "Tesla", "Hawking"], c: 1 },
            { q: "¿Qué planeta es el más grande?", a: ["Saturno", "Júpiter", "Tierra", "Marte"], c: 1 },
            { q: "¿Cuál es el símbolo del Oro?", a: ["Ag", "Fe", "Au", "Cu"], c: 2 },
            { q: "¿Qué gas necesitamos para respirar?", a: ["Nitrógeno", "Oxígeno", "Helio", "CO2"], c: 1 },
            { q: "¿Cómo se llama el centro de un átomo?", a: ["Corteza", "Núcleo", "Órbita", "Protón"], c: 1 },
            { q: "¿Cuál es el planeta más cercano al Sol?", a: ["Venus", "Marte", "Mercurio", "Tierra"], c: 2 },
            { q: "¿Qué órgano bombea sangre?", a: ["Pulmón", "Cerebro", "Hígado", "Corazón"], c: 3 },
            { q: "¿Cuál es el punto de ebullición del agua?", a: ["90°C", "100°C", "120°C", "80°C"], c: 1 },
            { q: "¿Quién formuló la ley de gravitación universal?", a: ["Galileo", "Kepler", "Newton", "Tesla"], c: 2 },
            { q: "¿Qué estudia la botánica?", a: ["Animales", "Plantas", "Rocas", "Estrellas"], c: 1 },
            { q: "¿Cuál es la fórmula química del agua?", a: ["H2O", "HO2", "CO2", "O2"], c: 0 },
            { q: "¿Qué planeta tiene anillos visibles?", a: ["Marte", "Venus", "Saturno", "Urano"], c: 2 }
        ],
        "Tecnología": [
            { q: "¿Lenguaje base para la estructura web?", a: ["Python", "HTML", "PHP", "Java"], c: 1 },
            { q: "¿Qué comando SQL se usa para leer datos?", a: ["UPDATE", "INSERT", "SELECT", "DELETE"], c: 2 },
            { q: "¿Qué significa el 5 en HTML5?", a: ["Versión 5", "5 lenguajes", "5 navegadores", "5 años"], c: 0 },
            { q: "¿Qué propiedad CSS cambia el fondo?", a: ["color", "background-color", "bg-color", "fill"], c: 1 },
            { q: "¿Qué comando de Python imprime?", a: ["echo", "log", "print", "display"], c: 2 },
            { q: "¿Qué significa CPU?", a: ["Central Process Unit", "Core Power Unit", "Central Plate Unit", "Control Power Unit"], c: 0 },
            { q: "¿Quién fundó Microsoft?", a: ["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Jeff Bezos"], c: 1 },
            { q: "¿Qué es un 'Bug'?", a: ["Un virus", "Un error de código", "Un hardware", "Un cable"], c: 1 },
            { q: "¿Cuál es el navegador de Google?", a: ["Safari", "Firefox", "Chrome", "Edge"], c: 2 },
            { q: "¿Qué significa WWW?", a: ["World Wide Web", "World West Web", "Web World Wide", "Wide Web World"], c: 0 },
            { q: "¿Qué empresa creó el iPhone?", a: ["Samsung", "Apple", "Xiaomi", "Nokia"], c: 1 },
            { q: "¿Qué sistema operativo usa la mayoría de móviles?", a: ["iOS", "Windows", "Android", "Linux"], c: 2 },
            { q: "¿Para qué sirve un Router?", a: ["Procesar datos", "Dar internet", "Imprimir", "Guardar fotos"], c: 1 },
            { q: "¿Cuál es el lenguaje de la IA?", a: ["Python", "HTML", "CSS", "SQL"], c: 0 },
            { q: "¿Qué es la RAM?", a: ["Memoria de video", "Memoria temporal", "Disco duro", "Procesador"], c: 1 }
        ],
        "Anime": [
    { q: "¿Quién robó el cuerpo de Jonathan Joestar para sobrevivir un siglo en el fondo del mar?", a: ["Dio Brando", "Kars", "Yoshikage Kira", "Enrico Pucci"], c: 0 },
    { q: "Nombre de la técnica de respiración que Jonathan y Joseph usaban antes de la aparición de los Stands.", a: ["Haki", "Hamón", "Nen", "Ki"], c: 1 },
    { q: "Lugar donde Giorno Giovanna busca ascender para eliminar el tráfico de drogas.", a: ["Passione", "Morioh", "Green Dolphin Street", "Nápoles"], c: 0 },
    { q: "¿Cómo se llama el Stand de Jotaro Kujo que posee la misma habilidad que The World?", a: ["Hierophant Green", "Magician's Red", "Star Platinum", "Silver Chariot"], c: 2 },
    { q: "¿Cuál es el verdadero nombre del 'Alquimista de Acero'?", a: ["Roy Mustang", "Alphonse Elric", "Edward Elric", "Van Hohenheim"], c: 2 },
    { q: "Ciudad amurallada donde la humanidad se refugia del acoso de los Titanes.", a: ["Shiganshina", "Sina", "Rose", "Paradis"], c: 3 },
    { q: "¿Quién es el autor del cuaderno que cayó en el mundo humano por aburrimiento de Ryuk?", a: ["Light Yagami", "L Lawliet", "Misa Amane", "Rem"], c: 0 },
    { q: "Nombre del sistema que mide el coeficiente de criminalidad de los ciudadanos.", a: ["Sybil", "Hologram", "Enforcement", "Dominator"], c: 0 },
    { q: "¿Qué personaje de JoJo's solo quiere vivir una vida tranquila en Morioh?", a: ["Okuyasu Nijimura", "Rohan Kishibe", "Yoshikage Kira", "Koichi Hirose"], c: 2 },
    { q: "Nación de donde proviene el ninja que busca convertirse en Hokage.", a: ["Aldea de la Lluvia", "Konohagakure", "Sunagakure", "Kumogakure"], c: 1 },
    { q: "Nombre del EVA pilotado por el 'Third Child' en la lucha contra los Ángeles.", a: ["Unidad 00", "Unidad 02", "Unidad 01", "Unidad 05"], c: 2 },
    { q: "¿Cuál es el nombre del capitán de la tripulación de los Sombrero de Paja?", a: ["Roronoa Zoro", "Monkey D. Luffy", "Vinsmoke Sanji", "Portgas D. Ace"], c: 1 },
    { q: "¿Cómo se llama el bar donde los trabajadores de Anteiku se reúnen?", a: ["Touka", "Helter Skelter", "Anteiku", "Quinx"], c: 2 },
    { q: "Entidad que reside dentro de Yuji Itadori tras comerse un dedo maldito.", a: ["Mahito", "Jogo", "Sukuna", "Hanami"], c: 2 },
    { q: "Nombre del fenómeno que transportó a miles de jugadores a Aincrad.", a: ["The Seed", "FullDive", "Sword Art Online", "Link Start"], c: 2 }
],
    "Dibujos Animados": [
        { q: "¿Cómo se llama el mejor amigo de Bob Esponja?", a: ["Calamardo", "Patricio", "Arenita", "Don Cangrejo"], c: 1 },
        { q: "¿Cuál es el nombre del perro de los Simpson?", a: ["Ayudante de Santa", "Bola de Nieve", "Huesos", "Pulgoso"], c: 0 },
        { q: "¿Qué animal es Bugs Bunny?", a: ["Pato", "Conejo", "Gato", "Perro"], c: 1 },
        { q: "¿Quién vive en una mansión con un perro llamado Scooby?", a: ["Shaggy", "Fred", "Daphne", "Velma"], c: 0 },
        { q: "¿Cómo se llama el niño que tiene padrinos mágicos?", a: ["Timmy Turner", "Danny Phantom", "Jimmy Neutron", "Ben 10"], c: 0 },
        { q: "¿Qué superhéroe vive en una Baticueva?", a: ["Superman", "Batman", "Spiderman", "Iron Man"], c: 1 },
        { q: "¿Quién persigue siempre al Correcaminos?", a: ["Silvestre", "Tom", "El Coyote", "Lucas"], c: 2 },
        { q: "¿Cómo se llaman las tres Supernenas?", a: ["Ana, Bella y Clara", "Pétalo, Burbuja y Cactus", "Luz, Sol y Luna", "Marta, Julia y Sofía"], c: 1 },
        { q: "¿Cuál es el color favorito de Shrek?", a: ["Azul", "Verde", "Rojo", "Amarillo"], c: 1 },
        { q: "¿Qué busca siempre Scrat en Ice Age?", a: ["Una manzana", "Una nuez", "Una bellota", "Un queso"], c: 2 },
        { q: "¿Cómo se llama el laboratorio del niño genio?", a: ["El laboratorio de Dexter", "La cueva de Jimmy", "El taller de Phineas", "La zona de Ben"], c: 0 },
        { q: "¿Quién es el archienemigo de Perry el Ornitorrinco?", a: ["Doofenshmirtz", "Plankton", "Mojo Jojo", "Lex Luthor"], c: 0 },
        { q: "¿Cómo se llama el gato naranja que odia los lunes?", a: ["Tom", "Garfield", "Félix", "Salem"], c: 1 },
        { q: "¿Qué comen las Tortugas Ninja?", a: ["Hamburguesas", "Pizza", "Tacos", "Sushi"], c: 1 },
        { q: "¿Cuál es el nombre del humano amigo de Scooby Doo?", a: ["Shaggy", "Fred", "Daphne", "Velma"], c: 0 }
    ],
        "Cine y Actores": [
            { q: "¿Quién interpretó a Iron Man?", a: ["Tom Cruise", "Robert Downey Jr", "Brad Pitt", "Chris Evans"], c: 1 },
            { q: "¿Cuál es la película más taquillera?", a: ["Avatar", "Titanic", "Endgame", "Star Wars"], c: 0 },
            { q: "¿Quién dirigió 'Jurassic Park'?", a: ["Scorsese", "Spielberg", "Nolan", "Tarantino"], c: 1 },
            { q: "¿Cómo se llama el villano de Avengers?", a: ["Loki", "Ultron", "Thanos", "Hela"], c: 2 },
            { q: "¿En qué película dicen 'Yo soy tu padre'?", a: ["Star Trek", "Star Wars", "Matrix", "Alien"], c: 1 },
            { q: "¿Quién ganó el Oscar por 'El Renacido'?", a: ["DiCaprio", "Pitt", "Depp", "Phoenix"], c: 0 },
            { q: "¿Qué actor hace de 'The Rock'?", a: ["Vin Diesel", "Dwayne Johnson", "John Cena", "Statham"], c: 1 },
            { q: "¿Cómo se llama el barco del Titanic?", a: ["Britannic", "Olympic", "Titanic", "Carpathia"], c: 2 },
            { q: "¿Cuál es la saga de un anillo mágico?", a: ["Harry Potter", "El Señor de los Anillos", "Crónicas de Narnia", "Percy Jackson"], c: 1 },
            { q: "¿Quién es el Joker en 'El Caballero Oscuro'?", a: ["Heath Ledger", "Jared Leto", "Joaquin Phoenix", "Jack Nicholson"], c: 0 },
            { q: "¿Qué película trata sobre sueños dentro de sueños?", a: ["Matrix", "Origen (Inception)", "Interstellar", "Tenet"], c: 1 },
            { q: "¿Quién es la actriz de 'Maléfica'?", a: ["Julia Roberts", "Angelina Jolie", "Scarlett Johansson", "Emma Watson"], c: 1 },
            { q: "¿Cuál es el nombre del agente 007?", a: ["Jason Bourne", "Ethan Hunt", "James Bond", "Jack Reacher"], c: 2 },
            { q: "¿Qué estudio creó 'Toy Story'?", a: ["Disney", "Pixar", "Dreamworks", "Universal"], c: 1 },
            { q: "¿En qué ciudad vive Batman?", a: ["Metrópolis", "Gotham", "Central City", "Nueva York"], c: 1 }
        ]
    };

    let currentQuestions = [];
    let currentIdx = 0, score = 0;
    const container = document.querySelector('.canvas-placeholder');
    const userElement = document.getElementById('display-user') || { innerText: "Leandro" };
    let user = userElement.innerText.replace("Jugador: ", "").trim();

    function showMenu() {
        if (!container) return;
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%; padding:10px; box-sizing:border-box; color:white;">
                <h2 style="color:#00f0ff; text-shadow:0 0 10px #00f0ff; margin-bottom:15px; font-size:1.2rem; text-align:center;">ELIGE TU CATEGORÍA</h2>
                <div id="cat-list" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; width:100%; max-width:350px;">
                    ${Object.keys(categories).map(cat => `
                        <button class="cat-btn" data-cat="${cat}" style="padding:15px 5px; background:rgba(0,240,255,0.1); border:1px solid #00f0ff; color:white; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.8rem; transition:0.3s;">
                            ${cat.toUpperCase()}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('.cat-btn').forEach(btn => {
            btn.onclick = () => {
                const cat = btn.getAttribute('data-cat');
                currentQuestions = [...categories[cat]].sort(() => Math.random() - 0.5);
                currentIdx = 0;
                score = 0;
                renderQuestion();
            };
        });
    }

    function renderQuestion() {
        container.innerHTML = "";
        if (currentIdx >= currentQuestions.length) return showEnd();

        const data = currentQuestions[currentIdx];
        const div = document.createElement('div');
        div.style.cssText = "padding:15px; text-align:left; width:100%; display:flex; flex-direction:column; justify-content:center; height:100%; color:white; box-sizing: border-box;";
        div.innerHTML = `
            <p style="color:#00f0ff; font-size:0.7rem; margin-bottom:5px;">Pregunta ${currentIdx + 1} de ${currentQuestions.length}</p>
            <h2 style="margin-bottom:15px; font-size:1rem; line-height: 1.2;">${data.q}</h2>
            <div id="options" style="display:flex; flex-direction:column; gap:8px; width:100%;"></div>
        `;

        const optionsDiv = div.querySelector('#options');
        data.a.forEach((opt, i) => {
            const b = document.createElement('button');
            b.style.cssText = "width:100%; text-align:left; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); cursor:pointer; color: white; border-radius: 5px; display:flex; justify-content:space-between; align-items:center; font-size:0.9rem;";
            b.innerHTML = `<span>${opt}</span> <span class="fb" style="font-weight:bold;"></span>`;
            
            b.onclick = () => {
                const all = optionsDiv.querySelectorAll('button');
                all.forEach(btn => btn.style.pointerEvents = "none");
                const fb = b.querySelector('.fb');

                if (i === data.c) {
                    score += 10;
                    b.style.borderColor = "#00f0ff"; b.style.background = "rgba(0, 240, 255, 0.2)";
                    fb.innerText = "✓"; fb.style.color = "#00f0ff";
                } else {
                    b.style.borderColor = "#ff4757"; b.style.background = "rgba(255, 71, 87, 0.2)";
                    fb.innerText = "✗"; fb.style.color = "#ff4757";
                    const correct = all[data.c];
                    correct.style.borderColor = "#00f0ff";
                    correct.querySelector('.fb').innerText = "✓";
                }
                setTimeout(() => { currentIdx++; renderQuestion(); }, 1200);
            };
            optionsDiv.appendChild(b);
        });
        container.appendChild(div);
    }

    function actualizarRankingLateral(juego) {
        fetch('/obtener_ranking')
        .then(res => res.json())
        .then(data => {
            // Filtramos por el juego "trivia" y ordenamos
            const topJuego = data.ranking
                .filter(r => r.juego.toLowerCase() === juego.toLowerCase())
                .sort((a, b) => b.puntos - a.puntos)
                .slice(0, 5);

            const listaHtml = document.getElementById('ranking-list'); 
            if (listaHtml) {
                listaHtml.innerHTML = topJuego.map((r, index) => `
                    <li>
                        <span>${index + 1}. ${r.nombre}</span> 
                        <b>${r.puntos}</b>
                    </li>
                `).join('');
            }
        })
        .catch(err => console.error("Error al actualizar ranking:", err));
    }
    
    async function showEnd() { // Añadimos 'async' aquí
    container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%; text-align:center; color:white; padding:20px; box-sizing:border-box;">
            <h1 style="color:#00f0ff; text-shadow:0 0 10px #00f0ff; font-size:1.5rem; margin-bottom:10px;">¡COMPLETADO!</h1>
            <p style="font-size:1.2rem; margin-bottom:20px;">Puntaje: <span style="color:#00f0ff">${score}</span></p>
            <div style="display:flex; flex-direction:column; gap:10px; width:100%; max-width:250px;">
                <button id="btn-restart" style="padding:15px; background:#00f0ff; color:#0d0221; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">OTRA CATEGORÍA</button>
                <button onclick="window.location.reload()" style="padding:15px; background:#333; color:white; border:none; border-radius:8px; cursor:pointer;">SALIR</button>
            </div>
        </div>
    `;
    document.getElementById('btn-restart').onclick = showMenu;
    
    try {
        // Esperamos a que el envío termine
        const response = await fetch('/guardar_puntaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nombre: user, puntos: score, juego: 'trivia'}) 
        });

        if (response.ok) {
            // Solo cuando el servidor confirme (OK), pedimos el ranking
            actualizarRankingLateral('trivia'); 
        }
    } catch (error) {
        console.error("Error guardando puntaje:", error);
    }
}

    showMenu();
})();
