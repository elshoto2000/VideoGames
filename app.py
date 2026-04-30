import os
from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

# Configuración de la base de datos en una ruta que Render entienda bien
basedir = os.path.abspath(os.path.dirname(__file__))
DATABASE = os.path.join(basedir, 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Crear la tabla si no existe al arrancar
def init_db():
    with get_db_connection() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS puntajes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                puntos INTEGER NOT NULL,
                juego TEXT NOT NULL
            )
        ''')
        conn.commit()

init_db()

@app.route('/')
def index():
    # Aquí puedes pasar los mejores puntajes de Snake para la tabla de al lado
    conn = get_db_connection()
    ranking_snake = conn.execute(
        'SELECT nombre, puntos FROM puntajes WHERE juego = ? ORDER BY puntos DESC LIMIT 5', 
        ('Snake',)
    ).fetchall()
    conn.close()
    
    # Supongamos que pasas el usuario logueado. Si no, pon uno por defecto.
    return render_template('index.html', ranking=ranking_snake, usuario="Leandro")

@app.route('/guardar_puntaje', methods=['POST'])
def guardar_puntaje():
    datos = request.get_json()
    nombre = datos.get('nombre', 'Invitado')
    puntos = datos.get('puntos', 0)
    juego = datos.get('juego', 'Snake')

    if nombre and puntos >= 0:
        conn = get_db_connection()
        conn.execute('INSERT INTO puntajes (nombre, puntos, juego) VALUES (?, ?, ?)',
                     (nombre, puntos, juego))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 200
    
    return jsonify({"status": "error"}), 400

# Ruta extra para que el JavaScript pueda pedir los datos nuevos sin refrescar toda la página
@app.route('/obtener_ranking/<juego>')
def obtener_ranking(juego):
    conn = get_db_connection()
    top = conn.execute(
        'SELECT nombre, puntos FROM puntajes WHERE juego = ? ORDER BY puntos DESC LIMIT 5', 
        (juego,)
    ).fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in top])

if __name__ == '__main__':
    app.run(debug=True)
