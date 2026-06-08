(function () {
    'use strict';

    /* ── Banco de preguntas ─────────────────────────────── */
    const CATEGORIES = {
        "🏛️ Historia": [
            { q: "¿En qué año llegó el hombre a la Luna?", a: ["1959","1969","1979","1989"], c: 1 },
            { q: "¿Quién descubrió América?", a: ["Magallanes","Colón","Vespucio","Pizarro"], c: 1 },
            { q: "¿Qué país tiene forma de bota?", a: ["España","Italia","Grecia","Francia"], c: 1 },
            { q: "¿Cuál era la moneda de España antes del Euro?", a: ["Peseta","Escudo","Franco","Lira"], c: 0 },
            { q: "¿En qué siglo comenzó la Revolución Industrial?", a: ["XVIII","XIX","XVII","XX"], c: 0 },
            { q: "¿Quién fue el primer presidente de EE.UU.?", a: ["Lincoln","Jefferson","Washington","Adams"], c: 2 },
            { q: "¿Qué civilización construyó las pirámides de Giza?", a: ["Mayas","Incas","Egipcios","Aztecas"], c: 2 },
            { q: "¿Cuál fue la capital del Imperio Inca?", a: ["Lima","Quito","Cusco","Machu Picchu"], c: 2 },
            { q: "¿En qué año terminó la Segunda Guerra Mundial?", a: ["1940","1945","1950","1939"], c: 1 },
            { q: "¿Quién era conocido como 'El Libertador'?", a: ["San Martín","Sucre","Bolívar","Hidalgo"], c: 2 },
            { q: "¿Qué reina financió el viaje de Colón?", a: ["Isabel la Católica","Victoria","Catalina II","Juana I"], c: 0 },
            { q: "¿Dónde nació la democracia?", a: ["Roma","Atenas","Esparta","París"], c: 1 },
            { q: "¿Qué muro cayó en 1989?", a: ["Muro de Adriano","Muro de Berlín","Muro de China","Muro Atlántico"], c: 1 },
            { q: "¿Quién fue el líder de la Revolución Rusa?", a: ["Stalin","Lenin","Trotsky","Putin"], c: 1 },
            { q: "¿Cuál es el río más largo del mundo?", a: ["Nilo","Amazonas","Misisipi","Danubio"], c: 1 },
        ],
        "🔬 Ciencia y Física": [
            { q: "¿Cuál es la unidad de la fuerza en el SI?", a: ["Pascal","Newton","Joule","Watt"], c: 1 },
            { q: "¿Qué partícula tiene carga positiva?", a: ["Electrón","Neutrón","Protón","Fotón"], c: 2 },
            { q: "¿Cuál es la velocidad de la luz aprox.?", a: ["300,000 km/s","150,000 km/s","1,000,000 km/s","343 m/s"], c: 0 },
            { q: "¿Quién propuso la relatividad?", a: ["Newton","Einstein","Tesla","Hawking"], c: 1 },
            { q: "¿Qué planeta es el más grande?", a: ["Saturno","Júpiter","Tierra","Marte"], c: 1 },
            { q: "¿Cuál es el símbolo del Oro?", a: ["Ag","Fe","Au","Cu"], c: 2 },
            { q: "¿Qué gas necesitamos para respirar?", a: ["Nitrógeno","Oxígeno","Helio","CO2"], c: 1 },
            { q: "¿Cómo se llama el centro de un átomo?", a: ["Corteza","Núcleo","Órbita","Protón"], c: 1 },
            { q: "¿Cuál es el planeta más cercano al Sol?", a: ["Venus","Marte","Mercurio","Tierra"], c: 2 },
            { q: "¿Qué órgano bombea sangre?", a: ["Pulmón","Cerebro","Hígado","Corazón"], c: 3 },
            { q: "¿Cuál es el punto de ebullición del agua?", a: ["90°C","100°C","120°C","80°C"], c: 1 },
            { q: "¿Quién formuló la ley de gravitación universal?", a: ["Galileo","Kepler","Newton","Tesla"], c: 2 },
            { q: "¿Qué estudia la botánica?", a: ["Animales","Plantas","Rocas","Estrellas"], c: 1 },
            { q: "¿Cuál es la fórmula química del agua?", a: ["H2O","HO2","CO2","O2"], c: 0 },
            { q: "¿Qué planeta tiene anillos visibles?", a: ["Marte","Venus","Saturno","Urano"], c: 2 },
        ],
        "💻 Tecnología": [
            { q: "¿Lenguaje base para la estructura web?", a: ["Python","HTML","PHP","Java"], c: 1 },
            { q: "¿Qué comando SQL se usa para leer datos?", a: ["UPDATE","INSERT","SELECT","DELETE"], c: 2 },
            { q: "¿Qué propiedad CSS cambia el fondo?", a: ["color","background-color","bg-color","fill"], c: 1 },
            { q: "¿Qué comando de Python imprime?", a: ["echo","log","print","display"], c: 2 },
            { q: "¿Qué significa CPU?", a: ["Central Process Unit","Core Power Unit","Central Plate Unit","Control Power Unit"], c: 0 },
            { q: "¿Quién fundó Microsoft?", a: ["Steve Jobs","Bill Gates","Mark Zuckerberg","Jeff Bezos"], c: 1 },
            { q: "¿Qué es un 'Bug'?", a: ["Un virus","Un error de código","Un hardware","Un cable"], c: 1 },
            { q: "¿Cuál es el navegador de Google?", a: ["Safari","Firefox","Chrome","Edge"], c: 2 },
            { q: "¿Qué significa WWW?", a: ["World Wide Web","World West Web","Web World Wide","Wide Web World"], c: 0 },
            { q: "¿Qué empresa creó el iPhone?", a: ["Samsung","Apple","Xiaomi","Nokia"], c: 1 },
            { q: "¿Qué sistema operativo usan la mayoría de móviles?", a: ["iOS","Windows","Android","Linux"], c: 2 },
            { q: "¿Cuál es el lenguaje más usado en IA?", a: ["Python","HTML","CSS","SQL"], c: 0 },
            { q: "¿Qué es la RAM?", a: ["Memoria de video","Memoria temporal","Disco duro","Procesador"], c: 1 },
            { q: "¿Qué etiqueta HTML crea un enlace?", a: ["<link>","<a>","<href>","<url>"], c: 1 },
            { q: "¿Qué significa CSS?", a: ["Computer Style Sheets","Cascading Style Sheets","Creative Style Systems","Complex Style Syntax"], c: 1 },
        ],
        "🎌 Anime": [
            { q: "¿Quién robó el cuerpo de Jonathan Joestar?", a: ["Dio Brando","Kars","Yoshikage Kira","Enrico Pucci"], c: 0 },
            { q: "¿Cómo se llama el Stand de Jotaro Kujo?", a: ["Hierophant Green","Magician's Red","Star Platinum","Silver Chariot"], c: 2 },
            { q: "¿Cuál es el verdadero nombre del Alquimista de Acero?", a: ["Roy Mustang","Alphonse Elric","Edward Elric","Van Hohenheim"], c: 2 },
            { q: "¿Quién es el autor del Death Note?", a: ["Light Yagami","L Lawliet","Misa Amane","Rem"], c: 0 },
            { q: "¿Qué personaje solo quiere vivir tranquilo en Morioh?", a: ["Okuyasu","Rohan Kishibe","Yoshikage Kira","Koichi"], c: 2 },
            { q: "¿De dónde proviene el ninja que quiere ser Hokage?", a: ["Aldea de la Lluvia","Konohagakure","Sunagakure","Kumogakure"], c: 1 },
            { q: "¿Qué EVA pilota el Tercer Niño contra los Ángeles?", a: ["Unidad 00","Unidad 02","Unidad 01","Unidad 05"], c: 2 },
            { q: "¿Cuál es el nombre del capitán de los Sombrero de Paja?", a: ["Roronoa Zoro","Monkey D. Luffy","Sanji","Portgas D. Ace"], c: 1 },
            { q: "¿Qué entidad vive dentro de Yuji Itadori?", a: ["Mahito","Jogo","Sukuna","Hanami"], c: 2 },
            { q: "¿En qué organización asciende Giorno Giovanna?", a: ["Passione","Morioh","Green Dolphin","Nápoles"], c: 0 },
            { q: "¿Cómo se llama la técnica de respiración de los Joestars?", a: ["Haki","Hamón","Nen","Ki"], c: 1 },
            { q: "¿Cómo se llama el sistema que mide el coeficiente de criminalidad?", a: ["Sybil","Hologram","Enforcement","Dominator"], c: 0 },
            { q: "¿Dentro de qué videojuego quedan atrapados los jugadores en SAO?", a: ["The Seed","FullDive","Aincrad","Link Start"], c: 2 },
            { q: "¿Qué protege el muro de la humanidad de los Titanes?", a: ["Shiganshina","Wall Sina","Wall Rose","Paradis"], c: 3 },
            { q: "¿Cómo se llama el ghoul cafetero que ayuda a Kaneki?", a: ["Touka","Rize","Hinami","Yoshimura"], c: 0 },
        ],
        "📺 Dibujos Animados": [
            { q: "¿Cómo se llama el mejor amigo de Bob Esponja?", a: ["Calamardo","Patricio","Arenita","Don Cangrejo"], c: 1 },
            { q: "¿Cuál es el nombre del perro de los Simpson?", a: ["Ayudante de Santa","Bola de Nieve","Huesos","Pulgoso"], c: 0 },
            { q: "¿Quién persigue siempre al Correcaminos?", a: ["Silvestre","Tom","El Coyote","Lucas"], c: 2 },
            { q: "¿Cómo se llaman las tres Supernenas?", a: ["Ana, Bella y Clara","Pétalo, Burbuja y Cactus","Luz, Sol y Luna","Marta, Julia y Sofía"], c: 1 },
            { q: "¿Qué busca siempre Scrat en Ice Age?", a: ["Una manzana","Una nuez","Una bellota","Un queso"], c: 2 },
            { q: "¿Cómo se llama el laboratorio del niño genio?", a: ["El laboratorio de Dexter","La cueva de Jimmy","El taller de Phineas","La zona de Ben"], c: 0 },
            { q: "¿Quién es el archienemigo de Perry el Ornitorrinco?", a: ["Doofenshmirtz","Plankton","Mojo Jojo","Lex Luthor"], c: 0 },
            { q: "¿Cómo se llama el gato naranja que odia los lunes?", a: ["Tom","Garfield","Félix","Salem"], c: 1 },
            { q: "¿Qué comen las Tortugas Ninja?", a: ["Hamburguesas","Pizza","Tacos","Sushi"], c: 1 },
            { q: "¿Cómo se llama el niño que tiene padrinos mágicos?", a: ["Timmy Turner","Danny Phantom","Jimmy Neutron","Ben 10"], c: 0 },
            { q: "¿Qué superhéroe vive en una Baticueva?", a: ["Superman","Batman","Spiderman","Iron Man"], c: 1 },
            { q: "¿Cuál es el color favorito de Shrek?", a: ["Azul","Verde","Rojo","Amarillo"], c: 1 },
            { q: "¿Quién es el archienemigo de los Vengadores en Avengers EMH?", a: ["Loki","Ultron","Thanos","MODOK"], c: 1 },
            { q: "¿En qué ciudad vive Batman?", a: ["Metrópolis","Gotham","Central City","Nueva York"], c: 1 },
            { q: "¿Cómo se llama el humano amigo de Scooby Doo?", a: ["Shaggy","Fred","Daphne","Velma"], c: 0 },
        ],
        "🎬 Cine": [
            { q: "¿Quién interpretó a Iron Man?", a: ["Tom Cruise","Robert Downey Jr","Brad Pitt","Chris Evans"], c: 1 },
            { q: "¿Cuál es la película más taquillera de la historia?", a: ["Avatar","Titanic","Endgame","Star Wars"], c: 0 },
            { q: "¿Quién dirigió 'Jurassic Park'?", a: ["Scorsese","Spielberg","Nolan","Tarantino"], c: 1 },
            { q: "¿En qué película dicen 'Yo soy tu padre'?", a: ["Star Trek","Star Wars","Matrix","Alien"], c: 1 },
            { q: "¿Quién ganó el Oscar por 'El Renacido'?", a: ["DiCaprio","Pitt","Depp","Phoenix"], c: 0 },
            { q: "¿Qué película trata sobre sueños dentro de sueños?", a: ["Matrix","Inception","Interstellar","Tenet"], c: 1 },
            { q: "¿Quién es la actriz de 'Maléfica'?", a: ["Julia Roberts","Angelina Jolie","Scarlett Johansson","Emma Watson"], c: 1 },
            { q: "¿Cuál es el nombre del agente 007?", a: ["Jason Bourne","Ethan Hunt","James Bond","Jack Reacher"], c: 2 },
            { q: "¿Qué estudio creó 'Toy Story'?", a: ["Disney","Pixar","Dreamworks","Universal"], c: 1 },
            { q: "¿En qué ciudad vive Batman?", a: ["Metrópolis","Gotham","Star City","Nueva York"], c: 1 },
            { q: "¿Quién interpreta al Joker en 'El Caballero Oscuro'?", a: ["Heath Ledger","Jared Leto","Joaquin Phoenix","Jack Nicholson"], c: 0 },
            { q: "¿Qué actor es conocido como 'The Rock'?", a: ["Vin Diesel","Dwayne Johnson","John Cena","Jason Statham"], c: 1 },
            { q: "¿Qué saga se basa en un anillo mágico?", a: ["Harry Potter","El Señor de los Anillos","Crónicas de Narnia","Percy Jackson"], c: 1 },
            { q: "¿Cómo se llama el villano principal de Avengers: Infinity War?", a: ["Loki","Ultron","Thanos","Hela"], c: 2 },
            { q: "¿Qué película de Pixar trata sobre emociones dentro de la mente?", a: ["Soul","Coco","Inside Out","Brave"], c: 2 },
        ],
    };

    const CAT_NAMES  = Object.keys(CATEGORIES);
    const COLORS_CAT = ['#4f7cff','#34c77b','#e8c97a','#e8445a','#c56aff','#ff9f43'];
    const TIME_PER_Q = 20; // segundos

    /* ── DOM ────────────────────────────────────────────── */
    const container = document.querySelector('.canvas-placeholder');
    if (!container) return;

    const userEl = document.getElementById('display-user');
    const USER   = (userEl ? userEl.innerText : 'Jugador').replace('Jugador: ', '').trim();

    /* ── Estado ─────────────────────────────────────────── */
    let questions = [], idx = 0, score = 0, streak = 0, maxStreak = 0;
    let timer = TIME_PER_Q, timerInterval = null;

    /* ── Helpers ─────────────────────────────────────────── */
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

    function css(el, styles) { Object.assign(el.style, styles); }

    /* ── Render: Menú de categorías ──────────────────────── */
    function showMenu() {
        clearInterval(timerInterval);
        container.innerHTML = '';

        const wrap = document.createElement('div');
        css(wrap, {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', width: '100%',
            padding: '16px', boxSizing: 'border-box', color: '#eeeef5',
            fontFamily: '"DM Sans", sans-serif',
        });

        wrap.innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <div style="font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase; color:#5a5a78; font-family:'DM Mono',monospace; margin-bottom:4px;">Trivia Master</div>
                <h2 style="font-family:'Syne',sans-serif; font-size:1.4rem; font-weight:800; margin:0; color:#eeeef5;">Elige tu categoría</h2>
                <p style="color:#5a5a78; font-size:0.8rem; margin-top:6px;">15 preguntas · ${TIME_PER_Q}s por pregunta</p>
            </div>
            <div id="cat-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%; max-width:380px;"></div>
        `;
        container.appendChild(wrap);

        const grid = wrap.querySelector('#cat-grid');
        CAT_NAMES.forEach((cat, i) => {
            const btn = document.createElement('button');
            css(btn, {
                padding: '14px 10px', background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${COLORS_CAT[i]}44`,
                borderRadius: '12px', cursor: 'pointer', color: '#eeeef5',
                fontFamily: '"DM Sans",sans-serif', fontWeight: '600', fontSize: '0.82rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                transition: 'all 0.15s',
            });
            btn.innerHTML = `<span style="font-size:1.4rem;">${cat.split(' ')[0]}</span><span style="color:${COLORS_CAT[i]}; font-size:0.72rem;">${cat.slice(2)}</span>`;
            btn.onmouseenter = () => { btn.style.background = `${COLORS_CAT[i]}18`; btn.style.borderColor = `${COLORS_CAT[i]}88`; };
            btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.04)'; btn.style.borderColor = `${COLORS_CAT[i]}44`; };
            btn.onclick = () => startCategory(cat, COLORS_CAT[i]);
            grid.appendChild(btn);
        });
    }

    /* ── Iniciar categoría ───────────────────────────────── */
    function startCategory(cat, color) {
        questions = shuffle(CATEGORIES[cat]).slice(0, 15);
        idx       = 0;
        score     = 0;
        streak    = 0;
        maxStreak = 0;
        renderQuestion(color);
    }

    /* ── Render: Pregunta ────────────────────────────────── */
    function renderQuestion(color = '#4f7cff') {
        clearInterval(timerInterval);
        if (idx >= questions.length) return showEnd(color);

        const q = questions[idx];
        timer    = TIME_PER_Q;

        container.innerHTML = '';
        const wrap = document.createElement('div');
        css(wrap, {
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            height: '100%', width: '100%', padding: '14px',
            boxSizing: 'border-box', color: '#eeeef5',
            fontFamily: '"DM Sans",sans-serif',
        });

        // Número / timer
        const topBar = document.createElement('div');
        css(topBar, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' });
        topBar.innerHTML = `
            <span style="font-size:0.72rem; color:#5a5a78; font-family:'DM Mono',monospace;">
                ${idx + 1} / ${questions.length}
            </span>
            <span style="font-size:0.72rem; color:${color}; font-family:'DM Mono',monospace;">
                🔥 Racha: ${streak} &nbsp;|&nbsp; ${score} pts
            </span>
            <span id="q-timer" style="font-size:0.82rem; font-weight:700; font-family:'DM Mono',monospace; color:${color};">
                ${timer}s
            </span>`;

        // Barra de tiempo
        const timerBar = document.createElement('div');
        css(timerBar, { width: '100%', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' });
        const timerFill = document.createElement('div');
        css(timerFill, { height: '100%', width: '100%', background: color, borderRadius: '2px', transition: 'width 1s linear' });
        timerBar.appendChild(timerFill);

        // Pregunta
        const qEl = document.createElement('div');
        css(qEl, {
            flex: '1', display: 'flex', alignItems: 'center',
            fontSize: '1rem', fontWeight: '500', lineHeight: '1.45',
            padding: '10px 4px', color: '#eeeef5',
        });
        qEl.textContent = q.q;

        // Opciones
        const opts = document.createElement('div');
        css(opts, { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' });

        const letters = ['A','B','C','D'];
        q.a.forEach((opt, i) => {
            const btn = document.createElement('button');
            css(btn, {
                width: '100%', textAlign: 'left', padding: '10px 14px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '10px', cursor: 'pointer', color: '#eeeef5',
                fontFamily: '"DM Sans",sans-serif', fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.12s',
            });
            btn.innerHTML = `<span style="font-family:'DM Mono',monospace; font-size:0.7rem; color:${color}; background:${color}18; padding:2px 7px; border-radius:4px;">${letters[i]}</span> ${opt}`;

            btn.onmouseenter = () => { if (!btn.disabled) btn.style.background = 'rgba(255,255,255,0.08)'; };
            btn.onmouseleave = () => { if (!btn.disabled) btn.style.background = 'rgba(255,255,255,0.04)'; };

            btn.onclick = () => answer(i, q.c, opts, color);
            opts.appendChild(btn);
        });

        wrap.append(topBar, timerBar, qEl, opts);
        container.appendChild(wrap);

        // Timer visual
        timerInterval = setInterval(() => {
            timer--;
            const timerEl = document.getElementById('q-timer');
            if (timerEl) timerEl.textContent = `${timer}s`;
            if (timerFill) timerFill.style.width = `${(timer / TIME_PER_Q) * 100}%`;
            if (timer <= 5) {
                if (timerEl) timerEl.style.color = '#e8445a';
                if (timerFill) timerFill.style.background = '#e8445a';
            }
            if (timer <= 0) {
                clearInterval(timerInterval);
                streak = 0;
                setTimeout(() => { idx++; renderQuestion(color); }, 800);
                lockOptions(opts, q.c, null);
            }
        }, 1000);
    }

    /* ── Responder ───────────────────────────────────────── */
    function answer(sel, correct, optsEl, color) {
        clearInterval(timerInterval);
        const timeBonus = Math.max(0, timer * 2);
        lockOptions(optsEl, correct, sel);

        if (sel === correct) {
            streak++;
            maxStreak = Math.max(maxStreak, streak);
            const combo = streak >= 3 ? ` (x${Math.min(streak, 5)} combo!)` : '';
            const points = 10 + timeBonus + Math.min((streak - 1) * 5, 20);
            score += points;
            flash(optsEl.parentElement, '#34c77b');
        } else {
            streak = 0;
            flash(optsEl.parentElement, '#e8445a');
        }
        setTimeout(() => { idx++; renderQuestion(color); }, 1100);
    }

    function lockOptions(optsEl, correct, sel) {
        optsEl.querySelectorAll('button').forEach((b, i) => {
            b.disabled = true;
            b.style.cursor = 'default';
            if (i === correct) { b.style.background = 'rgba(52,199,123,0.18)'; b.style.borderColor = '#34c77b'; }
            else if (i === sel) { b.style.background = 'rgba(232,68,90,0.18)'; b.style.borderColor = '#e8445a'; }
        });
    }

    function flash(el, color) {
        el.style.boxShadow = `0 0 0 2px ${color}60`;
        setTimeout(() => { el.style.boxShadow = ''; }, 500);
    }

    /* ── Fin ─────────────────────────────────────────────── */
    async function showEnd(color) {
        container.innerHTML = '';
        const wrap = document.createElement('div');
        css(wrap, {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', width: '100%',
            padding: '20px', boxSizing: 'border-box', color: '#eeeef5',
            fontFamily: '"DM Sans",sans-serif', textAlign: 'center', gap: '14px',
        });

        const pct = Math.round((score / (questions.length * (10 + TIME_PER_Q * 2))) * 100);
        const medal = score >= 300 ? '🥇' : score >= 150 ? '🥈' : '🥉';

        wrap.innerHTML = `
            <div style="font-size:2.8rem;">${medal}</div>
            <div style="font-family:'Syne',sans-serif; font-size:1.5rem; font-weight:800; color:${color};">¡Completado!</div>
            <div style="font-size:2rem; font-weight:700; font-family:'DM Mono',monospace;">${score} pts</div>
            <div style="display:flex; gap:20px; font-size:0.8rem; color:#5a5a78;">
                <span>Racha máx: <b style="color:${color};">${maxStreak}</b></span>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px; width:100%; max-width:260px; margin-top:8px;">
                <button id="btn-otra" style="padding:12px; background:${color}; color:#080810; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:0.9rem; font-family:'DM Sans',sans-serif;">Otra categoría</button>
                <button id="btn-salir" style="padding:12px; background:rgba(255,255,255,0.05); color:#a8a8be; border:1px solid rgba(255,255,255,0.08); border-radius:10px; cursor:pointer; font-size:0.85rem; font-family:'DM Sans',sans-serif;">Salir al menú</button>
            </div>
        `;
        container.appendChild(wrap);
        wrap.querySelector('#btn-otra').onclick  = showMenu;
        wrap.querySelector('#btn-salir').onclick = () => window.location.href = '/';

        // Guardar puntaje
        try {
            const res = await fetch('/guardar_puntaje', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: USER, puntos: score, juego: 'trivia' })
            });
            if (res.ok && typeof window.cargarRanking === 'function') window.cargarRanking();
        } catch (e) { console.error('Error guardando puntaje:', e); }
    }

    /* ── Start ───────────────────────────────────────────── */
    showMenu();
})();
