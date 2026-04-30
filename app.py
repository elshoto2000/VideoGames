from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

def conectar_db():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def inicializar_db():
    conn = conectar_db()
    # Mantenemos la estructura, asegurando que 'juego' sea la clave para filtrar
    conn.execute('''
        CREATE TABLE IF NOT EXISTS ranking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            puntos INTEGER,
            juego TEXT,
            UNIQUE(nombre, juego)
        )
    ''')
    conn.commit()
    conn.close()

# Ejecutamos la creación de la tabla al iniciar
inicializar_db()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/juego/<nombre_juego>')
def cargar_juego(nombre_juego):
    # Forzamos que el nombre del juego esté en minúsculas para la consulta SQL
    nombre_juego_busqueda = nombre_juego.lower() 
    
    conn = conectar_db()
    # Consultas corregidas para buscar siempre en minúsculas
    r_snake = conn.execute('SELECT nombre, puntos FROM ranking WHERE juego = "snake" ORDER BY puntos DESC LIMIT 5').fetchall()
    r_trivia = conn.execute('SELECT nombre, puntos FROM ranking WHERE juego = "trivia" ORDER BY puntos DESC LIMIT 5').fetchall()
    r_clicker = conn.execute('SELECT nombre, puntos FROM ranking WHERE juego = "clicker" ORDER BY puntos DESC LIMIT 5').fetchall()
    conn.close()

    return render_template('juego.html', 
                           juego=nombre_juego, 
                           ranking_snake=r_snake,
                           ranking_trivia=r_trivia, 
                           ranking_clicker=r_clicker)

@app.route('/guardar_puntaje', methods=['POST'])
def guardar_puntaje():
    datos = request.json
    nombre = datos.get('nombre')
    puntos = datos.get('puntos')
    # Guardamos el identificador del juego siempre en minúsculas para consistencia
    juego = datos.get('juego').lower() 
    
    conn = conectar_db()
    try:
        # Lógica de UPSERT: Solo actualiza si el nuevo puntaje es mayor[cite: 1]
        usuario = conn.execute('SELECT puntos FROM ranking WHERE nombre = ? AND juego = ?', (nombre, juego)).fetchone()
        
        if usuario:
            if puntos > usuario['puntos']:
                conn.execute('UPDATE ranking SET puntos = ? WHERE nombre = ? AND juego = ?', (puntos, nombre, juego))
        else:
            conn.execute('INSERT INTO ranking (nombre, puntos, juego) VALUES (?, ?, ?)', (nombre, puntos, juego))
        
        conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/obtener_ranking')
def obtener_ranking():
    conn = conectar_db()
    # Esta ruta es la que alimenta el Top Global del index.html[cite: 3]
    ranking = conn.execute('SELECT nombre, puntos, juego FROM ranking ORDER BY puntos DESC LIMIT 50').fetchall()
    conn.close()
    return jsonify({"ranking": [dict(row) for row in ranking]})

if __name__ == '__main__':
    app.run(debug=True)
