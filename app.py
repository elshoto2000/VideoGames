from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os
import base64

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "arcade_secret_2026_cambiar_esto")

MONGO_URI = "mongodb+srv://herreraleandro628:apu20082009@cluster0.q4tnkcc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client.arcade_db
puntajes_col = db.puntajes
usuarios_col = db.usuarios

print("✅ Conectado exitosamente a MongoDB Atlas")

# ─── AUTENTICACIÓN ───────────────────────────────────────────────

@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'GET':
        return render_template('registro.html')

    datos = request.json
    username = datos.get('username', '').strip()
    password = datos.get('password', '').strip()
    avatar    = datos.get('avatar', '')

    if not username or not password:
        return jsonify({"status": "error", "message": "Usuario y contraseña requeridos"}), 400

    if len(username) < 3 or len(username) > 20:
        return jsonify({"status": "error", "message": "El nombre debe tener entre 3 y 20 caracteres"}), 400

    if usuarios_col.find_one({"username": username}):
        return jsonify({"status": "error", "message": "Ese nombre de usuario ya existe"}), 409

    usuarios_col.insert_one({
        "username": username,
        "password": generate_password_hash(password),
        "avatar": avatar
    })
    return jsonify({"status": "success"})


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')

    datos = request.json
    username = datos.get('username', '').strip()
    password = datos.get('password', '').strip()

    usuario = usuarios_col.find_one({"username": username})
    if not usuario or not check_password_hash(usuario['password'], password):
        return jsonify({"status": "error", "message": "Usuario o contraseña incorrectos"}), 401

    session['username'] = username
    session['avatar']   = usuario.get('avatar', '')
    return jsonify({"status": "success"})


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))


@app.route('/perfil')
def perfil():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('perfil.html',
                           username=session['username'],
                           avatar=session.get('avatar', ''))


@app.route('/actualizar_avatar', methods=['POST'])
def actualizar_avatar():
    if 'username' not in session:
        return jsonify({"status": "error"}), 401
    
    datos = request.json
    avatar = datos.get('avatar', '')
    
    try:
        # Guardamos la imagen comprimida en la base de datos de MongoDB Atlas
        usuarios_col.update_one(
            {"username": session['username']},
            {"$set": {"avatar": avatar}}
        )
        # IMPORTANTE: NO guardes el avatar en session['avatar'] para no romper las cookies de Flask.
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/sesion')
def api_sesion():
    if 'username' in session:
        # Buscamos el avatar en tiempo real en la base de datos
        usuario_db = usuarios_col.find_one({"username": session['username']})
        avatar_actual = usuario_db.get('avatar', '') if usuario_db else ''
        return jsonify({
            "loggedin": True,
            "username": session['username'],
            "avatar": avatar_actual
        })
    return jsonify({"loggedin": False})
# ─── PÁGINAS PRINCIPALES ──────────────────────────────────────────

@app.route('/')
def home():
    return render_template('index.html')


# ─── DASHBOARD (panel del usuario) ───────────────────────────────

# ─── DASHBOARD (panel del usuario) ───────────────────────────────

# ─── DASHBOARD (panel del usuario) ───────────────────────────────

@app.route('/dashboard')
def dashboard():
    # 1. Si no hay sesión iniciada, mandamos al home
    if 'username' not in session:
        return redirect(url_for('home'))
    
    try:
        # 2. Buscamos el usuario en la base de datos
        usuario_db = usuarios_col.find_one({"username": session['username']})
        
        # 3. Si por alguna razón el usuario no existe en la base de datos (pero sí en la sesión)
        if not usuario_db:
            session.clear()
            return redirect(url_for('home'))
            
        # 4. Pasamos los datos limpios de texto a la plantilla para que Jinja2 no explote
        return render_template(
            'dashboard.html', 
            username=session['username'], 
            avatar=session.get('avatar', '')
        )
        
    except Exception as e:
        # Si algo falla con MongoDB, esto evitará el Error 500 y te mostrará el porqué en texto
        return f"Error en el servidor al conectar con la base de datos: {str(e)}", 500

@app.route('/juego/<nombre_juego>')
def cargar_juego(nombre_juego):
    if 'username' not in session:
        return redirect(url_for('login'))

    nombre_juego = nombre_juego.lower()
    r_snake   = list(puntajes_col.find({"juego": "snake"  }).sort("puntos", -1).limit(5))
    r_trivia  = list(puntajes_col.find({"juego": "trivia" }).sort("puntos", -1).limit(5))
    r_clicker = list(puntajes_col.find({"juego": "clicker"}).sort("puntos", -1).limit(5))
    r_simon   = list(puntajes_col.find({"juego": "simon"  }).sort("puntos", -1).limit(5))

    return render_template('juego.html',
                           juego=nombre_juego,
                           username=session['username'],
                           avatar=session.get('avatar', ''),
                           ranking_snake=r_snake,
                           ranking_trivia=r_trivia,
                           ranking_clicker=r_clicker,
                           ranking_simon=r_simon)


# ─── PUNTAJES Y RANKING ───────────────────────────────────────────

@app.route('/guardar_puntaje', methods=['POST'])
def guardar_puntaje():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    datos = request.json
    nombre = session['username']
    puntos = datos.get('puntos')
    juego  = datos.get('juego', '').lower()

    try:
        puntajes_col.update_one(
            {"nombre": nombre, "juego": juego},
            {"$max": {"puntos": puntos}},
            upsert=True
        )
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/obtener_ranking')
def obtener_ranking():
    ranking = list(puntajes_col.find().sort("puntos", -1).limit(50))
    for r in ranking:
        r['_id'] = str(r['_id'])
    return jsonify({"ranking": ranking})


@app.route('/obtener_ranking/<juego>')
def obtener_ranking_juego(juego):
    datos = list(puntajes_col.find({"juego": juego.lower()}).sort("puntos", -1).limit(5))
    for d in datos:
        d['_id'] = str(d['_id'])
    return jsonify(datos)


@app.route('/ranking')
def ver_ranking():
    return render_template('ranking.html')


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)

