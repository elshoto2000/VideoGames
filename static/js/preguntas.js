// js/preguntas.js

const BANCO_DE_PREGUNTAS = [
    // --- LISTA 1: VIDEOJUEGOS Y TECNOLOGÍA ---
    [
        { q: "Mundo de bloques en 2D:", a: "Minecraft", opciones: { 'A': 'Terraria', 'B': 'Roblox', 'C': 'Pacman', 'D': 'Minecraft' } },
        { q: "Enemigo verde que explota en Minecraft:", a: "Creeper", opciones: { 'A': 'Zombie', 'B': 'Creeper', 'C': 'Enderman', 'D': 'Slime' } },
        { q: "Lenguaje para estructurar páginas web:", a: "HTML", opciones: { 'A': 'HTML', 'B': 'Python', 'C': 'CSS', 'D': 'Java' } },
        { q: "Estiliza y da diseño a la web:", a: "CSS", opciones: { 'A': 'PHP', 'B': 'SQL', 'C': 'CSS', 'D': 'HTML' } },
        { q: "Motor de videojuegos para juegos 2D y 3D:", a: "Unity", opciones: { 'A': 'Wordpress', 'B': 'Unity', 'C': 'Photoshop', 'D': 'Flask' } },
        { q: "Base de datos relacional usada en web:", a: "SQL", opciones: { 'A': 'HTML', 'B': 'CSS', 'C': 'SQL', 'D': 'PHP' } }
        // Aquí puedes seguir pegando tus 50 preguntas de esta categoría...
    ],

    // --- LISTA 2: MATEMÁTICAS, LÓGICA Y CIENCIA ---
    [
        { q: "¿Cuánto es 5 + 5?", a: "10", opciones: { 'A': '12', 'B': '10', 'C': '8', 'D': '15' } },
        { q: "¿Cuánto es 12 entre 4?", a: "3", opciones: { 'A': '2', 'B': '4', 'C': '3', 'D': '6' } },
        { q: "¿Cuánto es 7 x 8?", a: "56", opciones: { 'A': '54', 'B': '56', 'C': '64', 'D': '48' } },
        { q: "Si tengo 3 manzanas y me quitan 2:", a: "1", opciones: { 'A': '0', 'B': '2', 'C': '1', 'D': '3' } },
        { q: "Valor aproximado del número de Euler (e):", a: "2.718", opciones: { 'A': '3.141', 'B': '1.414', 'C': '2.718', 'D': '0.577' } },
        { q: "¿Cuál es el resultado de 10 x 0?", a: "0", opciones: { 'A': '10', 'B': '1', 'C': '0', 'D': 'None' } }
        // Aquí puedes seguir pegando tus 50 preguntas de esta categoría...
    ],

    // --- LISTA 3: CULTURA GENERAL, ARCADES Y COLORES ---
    [
        { q: "¿Cuál es el color del cielo despejado?", a: "Azul", opciones: { 'A': 'Rojo', 'B': 'Verde', 'C': 'Azul', 'D': 'Gris' } },
        { q: "Creador de este entorno Arcade:", a: "Leandro", opciones: { 'A': 'Juan', 'B': 'Leandro', 'C': 'Pedro', 'D': 'Edison' } },
        { q: "¿Qué animal es la mascota del juego Snake?", a: "Serpiente", opciones: { 'A': 'Gato', 'B': 'Gusano', 'C': 'Serpiente', 'D': 'Perro' } },
        { q: "Color que se forma mezclando Azul y Amarillo:", a: "Verde", opciones: { 'A': 'Morado', 'B': 'Verde', 'C': 'Naranja', 'D': 'Café' } },
        { q: "Héroe clásico de arcade que come fantasmas:", a: "Pac-Man", opciones: { 'A': 'Mario', 'B': 'Sonic', 'C': 'Pac-Man', 'D': 'Donkey Kong' } }
        // Aquí puedes seguir pegando tus 50 preguntas de esta categoría...
    ]
];

// Hacerlo accesible para el script del juego
window.BancoPreguntasArcade = BANCO_DE_PREGUNTAS;
