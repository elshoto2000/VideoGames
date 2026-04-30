import os
from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))
DATABASE = os.path.join(basedir, 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

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
    conn = get_db_connection()
    # Traemos los tops de cada juego por separado
    top_snake = conn.execute('SELECT nombre, puntos FROM puntajes WHERE juego = "Snake" ORDER BY puntos DESC LIMIT 5').fetchall()
    top_pong = conn.execute('SELECT nombre, puntos FROM puntajes WHERE juego = "Pong" ORDER BY puntos DESC LIMIT 5').fetchall()
    # Puedes agregar más juegos aquí...
    
    conn.close()
    
    return render_template('index.html', 
                           ranking_snake=top_snake, 
                           ranking_pong=top_pong, 
                           usuario="Leandro") # Aquí puedes usar tu variable de usuario real

@app.route('/guardar_puntaje', methods=['POST'])
def guardar_puntaje():
    datos = request.get_json()
    nombre = datos.get('nombre')
    puntos = datos.get('puntos')
    juego = datos.get('juego')

    if nombre and puntos is not None:
        conn = get_db_connection()
        conn.execute('INSERT INTO puntajes (nombre, puntos, juego) VALUES (?, ?, ?)',
                     (nombre, puntos, juego))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 400

if __name__ == '__main__':
    app.run(debug=True)
