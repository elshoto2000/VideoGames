from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

def conectar_db():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def inicializar_db():
    conn = conectar_db()
    # Esta línea crea la columna 'juego' que Flask no encuentra (el error amarillo)
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

inicializar_db()

@app.route('/')
def home():
    # En el inicio, también mandamos el ranking global si quieres
    return render_template('index.html')

@app.route('/juego/<nombre_juego>')
def cargar_juego(nombre_juego):
    # Intentamos obtener el usuario de la URL por si acaso reintentan
    nombre_usuario = request.args.get('user', '')

    conn = conectar_db()
    # Sacamos el Top 5 de cada juego por separado
    r_snake = conn.execute('SELECT nombre, puntos FROM ranking WHERE juego = "Snake" ORDER BY puntos DESC LIMIT 5').fetchall()
    r_trivia = conn.execute('SELECT nombre, puntos FROM ranking WHERE juego = "Trivia" ORDER BY puntos DESC LIMIT 5').fetchall()
    r_clicker = conn.execute('SELECT nombre, puntos FROM ranking WHERE juego = "Clicker" ORDER BY puntos DESC LIMIT 5').fetchall()
    conn.close()

    return render_template('juego.html', 
                           juego=nombre_juego, 
                           usuario=nombre_usuario,
                           ranking_snake=r_snake,
                           ranking_trivia=r_trivia,
                           ranking_clicker=r_clicker)

# Tu ruta de guardar_puntaje está perfecta con la lógica de UPSERT
@app.route('/guardar_puntaje', methods=['POST'])
def guardar_puntaje():
    datos = request.json
    nombre, puntos, juego = datos.get('nombre'), datos.get('puntos'), datos.get('juego')
    conn = conectar_db()
    try:
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
    ranking = conn.execute('SELECT nombre, puntos, juego FROM ranking ORDER BY puntos DESC LIMIT 50').fetchall()
    conn.close()
    return jsonify({"ranking": [dict(row) for row in ranking]})

if __name__ == '__main__':
    app.run(debug=True)
