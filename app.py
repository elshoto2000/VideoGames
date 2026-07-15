from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os
import time

app = Flask(__name__)
# SECRET_KEY larga y estable — NUNCA guardes datos grandes en la sesión
app.secret_key = os.environ.get("SECRET_KEY", "arcade_secret_2026_XyZ9qR")
# Limitar cookie a solo datos pequeños
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True

# ─── SOCKET.IO ─────────────────────────────────────────────────────
# async_mode="eventlet" requiere el paquete `eventlet` (ver requirements.txt).
# En Render, el comando de arranque debe usar el worker eventlet, p.ej.:
#   gunicorn --worker-class eventlet -w 1 app:app
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

MONGO_URI = "mongodb+srv://herreraleandro628:apu20082009@cluster0.q4tnkcc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client.arcade_db
puntajes_col = db.puntajes
usuarios_col = db.usuarios

print("✅ Conectado exitosamente a MongoDB Atlas")

# ─── HELPER: obtener usuario actual desde DB ──────────────────────
def get_usuario():
    """Devuelve el doc del usuario en sesión, o None."""
    username = session.get('username')
    if not username:
        return None
    return usuarios_col.find_one({"username": username})

# ─── AUTENTICACIÓN ────────────────────────────────────────────────

@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'GET':
        return render_template('registro.html')

    datos    = request.json or {}
    username = datos.get('username', '').strip()
    password = datos.get('password', '').strip()
    avatar   = datos.get('avatar', '')   # base64 — se guarda en Mongo, NUNCA en sesión

    if not username or not password:
        return jsonify({"status": "error", "message": "Usuario y contraseña requeridos"}), 400
    if len(username) < 3 or len(username) > 20:
        return jsonify({"status": "error", "message": "El nombre debe tener entre 3 y 20 caracteres"}), 400
    if usuarios_col.find_one({"username": username}):
        return jsonify({"status": "error", "message": "Ese nombre de usuario ya existe"}), 409

    usuarios_col.insert_one({
        "username": username,
        "password": generate_password_hash(password),
        "avatar":   avatar,
        "logros":   []          # lista de IDs de logros desbloqueados
    })
    return jsonify({"status": "success"})


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')

    datos    = request.json or {}
    username = datos.get('username', '').strip()
    password = datos.get('password', '').strip()

    usuario = usuarios_col.find_one({"username": username})
    if not usuario or not check_password_hash(usuario['password'], password):
        return jsonify({"status": "error", "message": "Usuario o contraseña incorrectos"}), 401

    # ⚠️  Solo guardamos el username en la sesión — NUNCA el avatar
    session.clear()
    session['username'] = username
    return jsonify({"status": "success"})


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))


@app.route('/api/sesion')
def api_sesion():
    """Consultado por el JS del frontend para renderizar navbar."""
    u = get_usuario()
    if u:
        return jsonify({
            "loggedin": True,
            "username": u['username'],
            "avatar":   u.get('avatar', '')   # leído en tiempo real desde Mongo
        })
    return jsonify({"loggedin": False})


# ─── PERFIL Y AVATAR ──────────────────────────────────────────────

@app.route('/perfil')
def perfil():
    if 'username' not in session:
        return redirect(url_for('login'))
    u = get_usuario()
    if not u:
        session.clear()
        return redirect(url_for('login'))
    return render_template('perfil.html',
                           username=u['username'],
                           avatar=u.get('avatar', ''))


@app.route('/actualizar_avatar', methods=['POST'])
def actualizar_avatar():
    if 'username' not in session:
        return jsonify({"status": "error"}), 401
    datos  = request.json or {}
    avatar = datos.get('avatar', '')
    # Guardamos en Mongo — la sesión NO se toca
    usuarios_col.update_one(
        {"username": session['username']},
        {"$set": {"avatar": avatar}}
    )
    return jsonify({"status": "success"})


# ─── DASHBOARD ────────────────────────────────────────────────────

@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        return redirect(url_for('home'))
    u = get_usuario()
    if not u:
        session.clear()
        return redirect(url_for('home'))
    return render_template('dashboard.html',
                           username=u['username'],
                           avatar=u.get('avatar', ''))


# ─── PÁGINAS PRINCIPALES ──────────────────────────────────────────

@app.route('/')
def home():
    return render_template('index.html')


@app.route('/juego/lobby')
def cargar_lobby():
    if 'username' not in session:
        return redirect(url_for('login'))
    u = get_usuario()
    if not u:
        return redirect(url_for('login'))
    return render_template('juego.html',
                           juego='lobby',
                           username=u['username'],
                           avatar=u.get('avatar', ''),
                           ranking_snake=[],
                           ranking_trivia=[],
                           ranking_clicker=[],
                           ranking_simon=[],
                           ranking_geo=[])

@app.route('/juego/<nombre_juego>')
def cargar_juego(nombre_juego):
    if 'username' not in session:
        return redirect(url_for('login'))
    
    u = get_usuario()
    if not u:
        return redirect(url_for('login'))
        
    nombre_juego = nombre_juego.lower()
    
    r_snake   = list(puntajes_col.find({"juego": "snake"  }).sort("puntos", -1).limit(5))
    r_trivia  = list(puntajes_col.find({"juego": "trivia" }).sort("puntos", -1).limit(5))
    r_clicker = list(puntajes_col.find({"juego": "clicker"}).sort("puntos", -1).limit(5))
    r_simon   = list(puntajes_col.find({"juego": "simon"  }).sort("puntos", -1).limit(5))
    r_geo     = list(puntajes_col.find({"juego": "geo"    }).sort("puntos", -1).limit(5))

    return render_template('juego.html',
                           juego=nombre_juego,
                           username=u['username'],
                           avatar=u.get('avatar', ''),
                           ranking_snake=r_snake,
                           ranking_trivia=r_trivia,
                           ranking_clicker=r_clicker,
                           ranking_simon=r_simon,
                           ranking_geo=r_geo)


# ─── PUNTAJES Y RANKING ───────────────────────────────────────────

@app.route('/guardar_puntaje', methods=['POST'])
def guardar_puntaje():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    datos  = request.json or {}
    nombre = session['username']
    puntos = datos.get('puntos', 0)
    juego  = datos.get('juego', '').lower()

    try:
        puntajes_col.update_one(
            {"nombre": nombre, "juego": juego},
            {"$max": {"puntos": puntos}},
            upsert=True
        )
        _verificar_logros(nombre, juego, puntos)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/ranking')
def api_ranking():
    """Ruta consultada por ranking.html para armar las tablas dinámicas con avatares."""
    docs = list(puntajes_col.find({}, {"_id": 0}))
    resultado = []
    for d in docs:
        nombre = d.get('nombre', 'Anónimo')
        user_db = usuarios_col.find_one({"username": nombre}, {"avatar": 1})
        avatar_url = user_db.get('avatar', '') if user_db else ''
        
        resultado.append({
            "nombre": nombre,
            "juego":  d.get('juego', 'unknown'),
            "puntos": d.get('puntos', 0),
            "avatar": avatar_url
        })
    return jsonify({"ranking": resultado})


@app.route('/obtener_ranking')
def obtener_ranking():
    ranking = list(puntajes_col.find().sort("puntos", -1).limit(100))
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


# ─── LOGROS ───────────────────────────────────────────────────────

LOGROS = [
    # Snake
    {"id": "snake_first",   "juego": "snake",   "titulo": "Primera Serpiente",  "desc": "Juega Snake por primera vez",         "icono": "🐍", "umbral": 1},
    {"id": "snake_100",     "juego": "snake",   "titulo": "Hambrienta",           "desc": "Alcanza 100 puntos en Snake",          "icono": "🍎", "umbral": 100},
    {"id": "snake_500",     "juego": "snake",   "titulo": "Serpiente Larga",     "desc": "Alcanza 500 puntos en Snake",          "icono": "⚡", "umbral": 500},
    # Clicker
    {"id": "clicker_first", "juego": "clicker", "titulo": "Primer Click",        "desc": "Juega Clicker por primera vez",        "icono": "👆", "umbral": 1},
    {"id": "clicker_50",    "juego": "clicker", "titulo": "Dedos Rápidos",       "desc": "Logra 50 clicks en 10 segundos",       "icono": "💨", "umbral": 50},
    {"id": "clicker_80",    "juego": "clicker", "titulo": "Máquina",             "desc": "Logra 80 clicks en 10 segundos",       "icono": "🤖", "umbral": 80},
    # Trivia
    {"id": "trivia_first",  "juego": "trivia",  "titulo": "Curioso",             "desc": "Juega Trivia por primera vez",         "icono": "🧠", "umbral": 1},
    {"id": "trivia_300",    "juego": "trivia",  "titulo": "Sabio",                "desc": "Alcanza 300 puntos en Trivia",         "icono": "📚", "umbral": 300},
    # Simón
    {"id": "simon_first",   "juego": "simon",   "titulo": "Primer Simón",        "desc": "Juega Simón Dice por primera vez",     "icono": "🎮", "umbral": 1},
    {"id": "simon_200",     "juego": "simon",   "titulo": "Buen Memoria",        "desc": "Alcanza 200 puntos en Simón",          "icono": "💡", "umbral": 200},
    # Geo Dash
    {"id": "geo_first",     "juego": "geo",     "titulo": "Geometría",           "desc": "Completa el Nivel 1 de Geo Dash",      "icono": "🟦", "umbral": 1},
    {"id": "geo_nivel2",    "juego": "geo",     "titulo": "Desafiante",          "desc": "Completa el Nivel 2 de Geo Dash",      "icono": "🔶", "umbral": 2},
    {"id": "geo_nivel3",    "juego": "geo",     "titulo": "Maestro del Cubo",    "desc": "Completa el Nivel 3 de Geo Dash",      "icono": "🏆", "umbral": 3},
    # Global
    {"id": "all_games",     "juego": None,      "titulo": "Polivalente",         "desc": "Juega todos los juegos al menos una vez", "icono": "🌟", "umbral": None},
]

def _verificar_logros(nombre, juego, puntos):
    """Comprueba y desbloquea logros para el jugador."""
    u = usuarios_col.find_one({"username": nombre})
    if not u:
        return
    desbloqueados = set(u.get('logros', []))
    nuevos = []

    for logro in LOGROS:
        if logro['id'] in desbloqueados:
            continue
        if logro['juego'] is None:
            juegos_jugados = set(
                r['juego'] for r in puntajes_col.find({"nombre": nombre})
            )
            if {'snake','clicker','trivia','simon','geo'}.issubset(juegos_jugados):
                nuevos.append(logro['id'])
        elif logro['juego'] == juego and puntos >= logro['umbral']:
            nuevos.append(logro['id'])

    if nuevos:
        usuarios_col.update_one(
            {"username": nombre},
            {"$addToSet": {"logros": {"$each": nuevos}}}
        )


@app.route('/api/logros')
def api_logros():
    u = get_usuario()
    desbloqueados = set(u.get('logros', [])) if u else set()
    resultado = []
    for l in LOGROS:
        resultado.append({
            "id":           l['id'],
            "titulo":       l['titulo'],
            "desc":         l['desc'],
            "icono":        l['icono'],
            "desbloqueado": l['id'] in desbloqueados
        })
    return jsonify(resultado)


@app.route('/logros')
def ver_logros():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('logros.html')


# ─── SPACE LOBBY — multijugador en tiempo real (Socket.IO) ────────
LOBBY_ROOM = "space_lobby"
# sid -> {username, avatar, colorIdx, x, y, room, facing, moving, last_seen}
lobby_players = {}


def _color_idx_for(username):
    """Color determinístico por usuario (0-5) para que sea estable entre reconexiones."""
    return sum(ord(c) for c in username) % 6


@socketio.on('connect')
def on_lobby_connect():
    # No hacemos nada hasta que el cliente mande 'lobby_join' con su posición inicial.
    if 'username' not in session:
        return False  # rechaza conexiones sin sesión


@socketio.on('lobby_join')
def on_lobby_join(data):
    username = session.get('username')
    if not username:
        return
    data = data or {}
    u = usuarios_col.find_one({"username": username}) or {}
    sid = request.sid

    lobby_players[sid] = {
        "username": username,
        "avatar":   u.get('avatar', ''),
        "colorIdx": _color_idx_for(username),
        "x":        data.get('x', 240),
        "y":        data.get('y', 190),
        "room":     data.get('room', 'central'),
        "facing":   data.get('facing', 1),
        "moving":   False,
        "last_seen": time.time(),
    }

    join_room(LOBBY_ROOM)

    # Al que entra: le mandamos el estado actual de todos (menos él mismo)
    otros = {s: p for s, p in lobby_players.items() if s != sid}
    emit('lobby_state', {"players": otros, "you": sid})

    # A los demás: avisamos que se unió un jugador nuevo
    emit('lobby_player_joined', {"sid": sid, "player": lobby_players[sid]},
         room=LOBBY_ROOM, include_self=False)


@socketio.on('lobby_move')
def on_lobby_move(data):
    sid = request.sid
    p = lobby_players.get(sid)
    if not p:
        return
    data = data or {}
    p['x']      = data.get('x', p['x'])
    p['y']      = data.get('y', p['y'])
    p['room']   = data.get('room', p['room'])
    p['facing'] = data.get('facing', p['facing'])
    p['moving'] = data.get('moving', p['moving'])
    p['last_seen'] = time.time()

    emit('lobby_player_moved', {
        "sid": sid, "x": p['x'], "y": p['y'], "room": p['room'],
        "facing": p['facing'], "moving": p['moving']
    }, room=LOBBY_ROOM, include_self=False)


@socketio.on('lobby_chat')
def on_lobby_chat(data):
    sid = request.sid
    p = lobby_players.get(sid)
    if not p:
        return
    texto = str((data or {}).get('text', '')).strip()[:140]
    if not texto:
        return
    emit('lobby_chat', {
        "sid": sid, "username": p['username'], "text": texto
    }, room=LOBBY_ROOM)  # incluido el propio emisor, para confirmar entrega


@socketio.on('disconnect')
def on_lobby_disconnect():
    sid = request.sid
    if sid in lobby_players:
        leave_room(LOBBY_ROOM)
        del lobby_players[sid]
        emit('lobby_player_left', {"sid": sid}, room=LOBBY_ROOM)


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port)
