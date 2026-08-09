from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os
import re
import time

app = Flask(__name__)
# SECRET_KEY larga y estable — NUNCA guardes datos grandes en la sesión
app.secret_key = os.environ.get("SECRET_KEY", "arcade_secret_2026_XyZ9qR")
# Limitar cookie a solo datos pequeños
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True

# ⚠️ NUNCA dejes la contraseña en el código: el repo es público.
# Configura MONGO_URI en Render → Environment.
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError(
        "Falta la variable de entorno MONGO_URI. "
        "En Render: tu servicio -> Environment -> Add Environment Variable, "
        "key = MONGO_URI, value = mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/"
    )

# serverSelectionTimeoutMS evita que el arranque se cuelgue si Atlas no responde
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
db = client.arcade_db
puntajes_col = db.puntajes
usuarios_col = db.usuarios

try:
    client.admin.command("ping")
    print("✅ Conectado exitosamente a MongoDB Atlas")
except Exception as _e:
    print(f"⚠️  No se pudo conectar a MongoDB Atlas: {_e}")
    print("   Revisa: (1) usuario/password en MONGO_URI, "
          "(2) Atlas -> Network Access debe permitir 0.0.0.0/0 para Render.")

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
    r_tama    = list(puntajes_col.find({"juego": "tamagochi"}).sort("puntos", -1).limit(5))

    return render_template('juego.html',
                           juego=nombre_juego,
                           username=u['username'],
                           avatar=u.get('avatar', ''),
                           ranking_snake=r_snake,
                           ranking_trivia=r_trivia,
                           ranking_clicker=r_clicker,
                           ranking_simon=r_simon,
                           ranking_geo=r_geo,
                           ranking_tamagochi=r_tama)


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


# ─── PERSONALIZACIÓN DE SNAKE (colores + accesorios) ──────────────
# Guardado en MongoDB, dentro del propio documento del usuario,
# en el campo "snake_config": { colores: [...], accesorios: [...], equipado: id|None }

HEX_RE = re.compile(r'^#[0-9a-fA-F]{6}$')
DEFAULT_COLORES_SNAKE = ['#4f7cff']


@app.route('/api/snake_config', methods=['GET'])
def api_snake_config():
    """Devuelve la config guardada de la serpiente del usuario logueado."""
    if 'username' not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    u = get_usuario()
    cfg = (u or {}).get('snake_config', {})
    return jsonify({
        "colores":    cfg.get('colores', DEFAULT_COLORES_SNAKE),
        "accesorios": cfg.get('accesorios', []),
        "equipado":   cfg.get('equipado')
    })


@app.route('/api/snake_config/colores', methods=['POST'])
def guardar_colores_snake():
    """Guarda el patrón de colores (1 a 5 colores hex) de la serpiente."""
    if 'username' not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    datos   = request.json or {}
    colores = datos.get('colores', [])
    if not isinstance(colores, list):
        return jsonify({"status": "error", "message": "Formato inválido"}), 400

    colores = [c for c in colores if isinstance(c, str) and HEX_RE.match(c)][:5]
    if not colores:
        return jsonify({"status": "error", "message": "Se necesita al menos un color válido"}), 400

    usuarios_col.update_one(
        {"username": session['username']},
        {"$set": {"snake_config.colores": colores}}
    )
    return jsonify({"status": "success", "colores": colores})


@app.route('/api/snake_config/accesorio', methods=['POST'])
def guardar_accesorio_snake():
    """Crea y guarda un nuevo gorro (accesorio) para la serpiente."""
    if 'username' not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    datos  = request.json or {}
    nombre = (datos.get('nombre') or '').strip()[:24] or 'Gorro'
    color  = datos.get('color', '#222222')
    if not (isinstance(color, str) and HEX_RE.match(color)):
        color = '#222222'

    nuevo = {
        "id":     f"acc_{int(time.time() * 1000)}",
        "tipo":   "sombrero",
        "nombre": nombre,
        "color":  color
    }

    usuarios_col.update_one(
        {"username": session['username']},
        {"$push": {"snake_config.accesorios": nuevo}}
    )
    return jsonify({"status": "success", "accesorio": nuevo})


@app.route('/api/snake_config/equipar', methods=['POST'])
def equipar_accesorio_snake():
    """Marca un accesorio como puesto (o lo quita si id es null)."""
    if 'username' not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    datos  = request.json or {}
    acc_id = datos.get('id')  # puede ser None para quitar el accesorio

    usuarios_col.update_one(
        {"username": session['username']},
        {"$set": {"snake_config.equipado": acc_id}}
    )
    return jsonify({"status": "success"})


@app.route('/api/snake_config/eliminar', methods=['POST'])
def eliminar_accesorio_snake():
    """Elimina un gorro guardado y lo desequipa si estaba puesto."""
    if 'username' not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    datos  = request.json or {}
    acc_id = datos.get('id')
    if not acc_id:
        return jsonify({"status": "error", "message": "Falta id"}), 400

    usuarios_col.update_one(
        {"username": session['username']},
        {"$pull": {"snake_config.accesorios": {"id": acc_id}}}
    )
    usuarios_col.update_one(
        {"username": session['username'], "snake_config.equipado": acc_id},
        {"$set": {"snake_config.equipado": None}}
    )
    return jsonify({"status": "success"})


# ══════════════════════════════════════════════════════════════════
# ─── TAMAGOTCHI ───────────────────────────────────────────────────
# El estado vive en Mongo con timestamps. Nada corre en memoria:
# al leer el estado se recalcula todo el tiempo transcurrido
# ("lazy tick"), así la mascota sigue viviendo aunque Render free
# duerma el servicio tras 15 min de inactividad.
# ══════════════════════════════════════════════════════════════════

tama_col = db.tamagotchis

# ── Ritmo del juego (ajusta estos números para acelerar/frenar) ──
TAMA_ECLOSION_SEG = 90            # el huevo eclosiona a los 90 s
TAMA_ETAPAS = [                   # (etapa, segundos de vida necesarios)
    ("bebe",   0),
    ("nino",   2 * 3600),         # niño a las 2 h
    ("adulto", 8 * 3600),         # adulto a las 8 h
]

# Desgaste por hora (despierto / dormido)
# Con estos valores una mascota totalmente abandonada muere a las ~30 h.
# Sube los números (en negativo) si quieres que sea más exigente.
TAMA_TASAS_DESPIERTO = {"hambre": -4.5, "energia": -4.0, "felicidad": -3.5, "limpieza": -4.0}
TAMA_TASAS_DORMIDO   = {"hambre": -2.5, "energia": 22.0, "felicidad": -0.8, "limpieza": -2.0}

TAMA_SALUD_REGEN     = 5.0        # +salud/h si todo va bien
TAMA_SALUD_BASE      = -1.0       # desgaste natural/h
TAMA_SALUD_POR_CRISIS = -4.5      # extra/h por cada barra en crisis
TAMA_SALUD_ENFERMO   = -4.0       # extra/h si está enfermo
TAMA_ENFERMA_BAJO    = 38         # salud por debajo de esto → enferma
TAMA_MONEDAS_HORA    = 6.0        # propina/h si el bienestar es bueno

TAMA_MAX_DT = 30 * 86400          # tope de seguridad: 30 días por tick

TIENDA = {
    "manzana":  {"nombre": "Manzana",  "precio": 5,  "tipo": "comida",    "hambre": 25, "felicidad": 2},
    "pan":      {"nombre": "Pan",      "precio": 9,  "tipo": "comida",    "hambre": 40, "felicidad": 3},
    "pizza":    {"nombre": "Pizza",    "precio": 16, "tipo": "comida",    "hambre": 60, "felicidad": 8},
    "pastel":   {"nombre": "Pastel",   "precio": 24, "tipo": "comida",    "hambre": 45, "felicidad": 22},
    "medicina": {"nombre": "Medicina", "precio": 30, "tipo": "medicina"},
    "pelota":   {"nombre": "Pelota",   "precio": 40, "tipo": "juguete"},
    "peluche":  {"nombre": "Peluche",  "precio": 70, "tipo": "juguete"},
    "gorro":    {"nombre": "Gorro",    "precio": 55, "tipo": "cosmetico"},
    "lazo":     {"nombre": "Lazo",     "precio": 55, "tipo": "cosmetico"},
    "lampara":  {"nombre": "Lampara",  "precio": 90, "tipo": "cosmetico"},
}

TAMA_COOLDOWNS = {"jugar": 45, "limpiar": 30, "acariciar": 8, "comer": 10}


def _clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


def _tama_nuevo_doc(username, nombre, anterior=None):
    """Crea el documento de una mascota nueva. Hereda monedas y cosméticos."""
    ahora = time.time()
    return {
        "username":       username,
        "nombre":         nombre,
        "creado_en":      ahora,
        "ultimo_tick":    ahora,
        "nacido":         False,
        "edad_seg":       0.0,
        "toques_huevo":   0,
        "hambre":         100.0,
        "energia":        100.0,
        "felicidad":      100.0,
        "limpieza":       100.0,
        "salud":          100.0,
        "durmiendo":      False,
        "enfermo":        False,
        "muerto":         False,
        "monedas":        (anterior or {}).get("monedas", 25),
        "inventario":     (anterior or {}).get("inventario", {"manzana": 3}),
        "cosmeticos":     (anterior or {}).get("cosmeticos", []),
        "equipado":       (anterior or {}).get("equipado", {"accesorio": None}),
        "mejor_edad_seg": (anterior or {}).get("mejor_edad_seg", 0.0),
        "muertes":        (anterior or {}).get("muertes", 0),
        "curas":          (anterior or {}).get("curas", 0),
        "cooldowns":      {},
    }


def _tama_etapa(edad_seg, nacido):
    if not nacido:
        return "huevo"
    etapa = "bebe"
    for nombre, umbral in TAMA_ETAPAS:
        if edad_seg >= umbral:
            etapa = nombre
    return etapa


def _tama_tick(t):
    """Avanza la simulación hasta ahora. Devuelve (doc, cambio)."""
    ahora = time.time()
    dt = min(max(0.0, ahora - t.get("ultimo_tick", ahora)), TAMA_MAX_DT)
    t["ultimo_tick"] = ahora

    if t.get("muerto"):
        return t, dt > 0

    # ── Etapa huevo: no hay desgaste, solo incubación ──
    if not t.get("nacido"):
        t["edad_seg"] = t.get("edad_seg", 0.0) + dt
        # cada toque del jugador acelera 6 s
        avance = t["edad_seg"] + t.get("toques_huevo", 0) * 6
        if avance >= TAMA_ECLOSION_SEG:
            t["nacido"] = True
            t["edad_seg"] = 0.0
        return t, True

    horas = dt / 3600.0
    t["edad_seg"] = t.get("edad_seg", 0.0) + dt

    tasas = TAMA_TASAS_DORMIDO if t.get("durmiendo") else TAMA_TASAS_DESPIERTO
    # El peluche frena la pérdida de felicidad
    mult_fel = 0.6 if "peluche" in t.get("cosmeticos", []) else 1.0

    for k, r in tasas.items():
        r_ef = r * (mult_fel if k == "felicidad" and r < 0 else 1.0)
        t[k] = _clamp(t.get(k, 100.0) + r_ef * horas)

    # Se despierta sola con la energía llena
    if t.get("durmiendo") and t["energia"] >= 100.0:
        t["durmiendo"] = False

    # ── Salud ──
    crisis = sum(1 for k in ("hambre", "energia", "limpieza") if t.get(k, 100.0) <= 5.0)
    if crisis == 0 and not t.get("enfermo") and min(t["hambre"], t["felicidad"], t["limpieza"]) >= 50:
        delta = TAMA_SALUD_REGEN
    else:
        delta = TAMA_SALUD_BASE + TAMA_SALUD_POR_CRISIS * crisis
        if t.get("enfermo"):
            delta += TAMA_SALUD_ENFERMO
    t["salud"] = _clamp(t.get("salud", 100.0) + delta * horas)

    if t["salud"] <= TAMA_ENFERMA_BAJO:
        t["enfermo"] = True

    # ── Propina por buen cuidado ──
    bienestar = (t["hambre"] + t["felicidad"] + t["limpieza"] + t["salud"]) / 4.0
    if bienestar >= 60 and not t.get("enfermo"):
        t["monedas"] = int(t.get("monedas", 0) + TAMA_MONEDAS_HORA * horas)

    # ── Muerte ──
    if t["salud"] <= 0.0:
        t["muerto"] = True
        t["muerto_en"] = ahora
        t["muertes"] = t.get("muertes", 0) + 1

    if t["edad_seg"] > t.get("mejor_edad_seg", 0.0):
        t["mejor_edad_seg"] = t["edad_seg"]

    return t, True


def _tama_puntos(t):
    """Puntuación para el ranking global: 10 pts por hora de vida récord."""
    return int(t.get("mejor_edad_seg", 0.0) / 360.0)


def _tama_cooldowns_restantes(t):
    ahora = time.time()
    out = {}
    for acc, seg in TAMA_COOLDOWNS.items():
        fin = t.get("cooldowns", {}).get(acc, 0)
        rest = fin - ahora
        if rest > 0:
            out[acc] = round(rest, 1)
    return out


def _tama_publico(t):
    """Serializa el estado para el cliente."""
    tasas = dict(TAMA_TASAS_DORMIDO if t.get("durmiendo") else TAMA_TASAS_DESPIERTO)
    if "peluche" in t.get("cosmeticos", []):
        tasas["felicidad"] *= 0.6
    crisis = sum(1 for k in ("hambre", "energia", "limpieza") if t.get(k, 100.0) <= 5.0)
    if crisis == 0 and not t.get("enfermo") and min(t.get("hambre", 0), t.get("felicidad", 0), t.get("limpieza", 0)) >= 50:
        tasas["salud"] = TAMA_SALUD_REGEN
    else:
        tasas["salud"] = TAMA_SALUD_BASE + TAMA_SALUD_POR_CRISIS * crisis + (TAMA_SALUD_ENFERMO if t.get("enfermo") else 0)

    avance = t.get("edad_seg", 0.0) + t.get("toques_huevo", 0) * 6
    return {
        "existe":         True,
        "nombre":         t.get("nombre", "Mascota"),
        "etapa":          _tama_etapa(t.get("edad_seg", 0.0), t.get("nacido", False)),
        "nacido":         bool(t.get("nacido")),
        "edad_seg":       round(t.get("edad_seg", 0.0), 1),
        "mejor_edad_seg": round(t.get("mejor_edad_seg", 0.0), 1),
        "progreso_huevo": round(min(1.0, avance / TAMA_ECLOSION_SEG), 3),
        "eclosiona_en":   max(0, round(TAMA_ECLOSION_SEG - avance, 1)),
        "hambre":         round(t.get("hambre", 0), 1),
        "energia":        round(t.get("energia", 0), 1),
        "felicidad":      round(t.get("felicidad", 0), 1),
        "limpieza":       round(t.get("limpieza", 0), 1),
        "salud":          round(t.get("salud", 0), 1),
        "durmiendo":      bool(t.get("durmiendo")),
        "enfermo":        bool(t.get("enfermo")),
        "muerto":         bool(t.get("muerto")),
        "monedas":        int(t.get("monedas", 0)),
        "inventario":     t.get("inventario", {}),
        "cosmeticos":     t.get("cosmeticos", []),
        "equipado":       t.get("equipado", {"accesorio": None}),
        "muertes":        t.get("muertes", 0),
        "puntos":         _tama_puntos(t),
        "tasas":          {k: round(v, 2) for k, v in tasas.items()},
        "cooldowns":      _tama_cooldowns_restantes(t),
    }


def _tama_guardar(t):
    tama_col.update_one({"username": t["username"]}, {"$set": t}, upsert=True)


def _tama_cargar():
    """Devuelve el doc del usuario en sesión ya actualizado, o None."""
    username = session.get("username")
    if not username:
        return None
    t = tama_col.find_one({"username": username})
    if not t:
        return None
    t.pop("_id", None)
    t, _ = _tama_tick(t)
    _tama_guardar(t)
    return t


def _tama_respuesta(t, mensaje=None):
    """Respuesta estándar: estado + logros nuevos + puntaje sincronizado."""
    nuevos = _tama_logros(session["username"], t)
    return jsonify({
        "status":  "success",
        "estado":  _tama_publico(t),
        "logros":  nuevos,
        "mensaje": mensaje,
    })


@app.route("/api/tama/estado")
def api_tama_estado():
    if "username" not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401
    t = _tama_cargar()
    if not t:
        return jsonify({"status": "success", "estado": {"existe": False}})
    return _tama_respuesta(t)


@app.route("/api/tama/nuevo", methods=["POST"])
def api_tama_nuevo():
    if "username" not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    datos  = request.json or {}
    nombre = (datos.get("nombre") or "").strip()[:16]
    if len(nombre) < 2:
        return jsonify({"status": "error", "message": "El nombre necesita al menos 2 letras"}), 400

    anterior = tama_col.find_one({"username": session["username"]})
    # Solo se puede crear si no hay mascota o si la anterior murió
    if anterior and not anterior.get("muerto"):
        anterior.pop("_id", None)
        anterior, _ = _tama_tick(anterior)
        _tama_guardar(anterior)
        if not anterior.get("muerto"):
            return jsonify({"status": "error", "message": "Ya tienes una mascota viva"}), 409

    t = _tama_nuevo_doc(session["username"], nombre, anterior)
    _tama_guardar(t)
    return _tama_respuesta(t, f"¡{nombre} está incubando! 🥚")


@app.route("/api/tama/accion", methods=["POST"])
def api_tama_accion():
    if "username" not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    t = _tama_cargar()
    if not t:
        return jsonify({"status": "error", "message": "No tienes mascota"}), 404
    if t.get("muerto"):
        return jsonify({"status": "error", "message": "Tu mascota ha muerto"}), 409

    accion = (request.json or {}).get("accion", "")
    ahora  = time.time()
    msg    = None

    # Toques al huevo (acelera la eclosión)
    if accion == "tocar_huevo":
        if t.get("nacido"):
            return jsonify({"status": "error", "message": "Ya nació"}), 409
        t["toques_huevo"] = min(t.get("toques_huevo", 0) + 1, 200)
        t, _ = _tama_tick(t)
        _tama_guardar(t)
        return _tama_respuesta(t, "¡Ha nacido! 🐣" if t.get("nacido") else None)

    if not t.get("nacido"):
        return jsonify({"status": "error", "message": "Todavía es un huevo"}), 409

    # Dormir / despertar
    if accion == "dormir":
        t["durmiendo"] = not t.get("durmiendo")
        msg = "Buenas noches 💤" if t["durmiendo"] else "¡Buenos días! ☀️"
        _tama_guardar(t)
        return _tama_respuesta(t, msg)

    if t.get("durmiendo"):
        return jsonify({"status": "error", "message": "Está durmiendo, despiértala primero"}), 409

    # Cooldown
    if accion in TAMA_COOLDOWNS:
        fin = t.get("cooldowns", {}).get(accion, 0)
        if fin > ahora:
            return jsonify({"status": "error", "message": f"Espera {int(fin - ahora) + 1}s"}), 429

    if accion == "jugar":
        bono = 1.5 if "pelota" in t.get("cosmeticos", []) else 1.0
        t["felicidad"] = _clamp(t["felicidad"] + 18 * bono)
        t["energia"]   = _clamp(t["energia"] - 12)
        t["hambre"]    = _clamp(t["hambre"] - 6)
        t["limpieza"]  = _clamp(t["limpieza"] - 5)
        t["monedas"]   = int(t.get("monedas", 0) + 3)
        msg = "¡Qué divertido! +3 ◎"

    elif accion == "limpiar":
        t["limpieza"]  = 100.0
        t["felicidad"] = _clamp(t["felicidad"] + 5)
        msg = "Limpia y reluciente ✨"

    elif accion == "acariciar":
        t["felicidad"] = _clamp(t["felicidad"] + 6)
        msg = None

    else:
        return jsonify({"status": "error", "message": "Acción desconocida"}), 400

    t.setdefault("cooldowns", {})[accion] = ahora + TAMA_COOLDOWNS.get(accion, 0)
    _tama_guardar(t)
    return _tama_respuesta(t, msg)


@app.route("/api/tama/usar", methods=["POST"])
def api_tama_usar():
    if "username" not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    t = _tama_cargar()
    if not t:
        return jsonify({"status": "error", "message": "No tienes mascota"}), 404
    if t.get("muerto"):
        return jsonify({"status": "error", "message": "Tu mascota ha muerto"}), 409
    if not t.get("nacido"):
        return jsonify({"status": "error", "message": "Todavía es un huevo"}), 409

    item = (request.json or {}).get("item", "")
    it   = TIENDA.get(item)
    if not it or it["tipo"] not in ("comida", "medicina"):
        return jsonify({"status": "error", "message": "Objeto no usable"}), 400
    if t.get("inventario", {}).get(item, 0) <= 0:
        return jsonify({"status": "error", "message": f"No tienes {it['nombre']}"}), 409
    if t.get("durmiendo"):
        return jsonify({"status": "error", "message": "Está durmiendo"}), 409

    ahora = time.time()
    if it["tipo"] == "comida":
        fin = t.get("cooldowns", {}).get("comer", 0)
        if fin > ahora:
            return jsonify({"status": "error", "message": f"Está masticando, espera {int(fin - ahora) + 1}s"}), 429
        if t["hambre"] >= 99:
            return jsonify({"status": "error", "message": "Está llena 🤤"}), 409
        t["hambre"]    = _clamp(t["hambre"] + it["hambre"])
        t["felicidad"] = _clamp(t["felicidad"] + it.get("felicidad", 0))
        t["limpieza"]  = _clamp(t["limpieza"] - 3)
        t.setdefault("cooldowns", {})["comer"] = ahora + TAMA_COOLDOWNS["comer"]
        msg = f"Ñam, {it['nombre'].lower()} 😋"
    else:
        if not t.get("enfermo"):
            return jsonify({"status": "error", "message": "No está enferma"}), 409
        t["enfermo"] = False
        t["salud"]   = _clamp(t["salud"] + 35)
        t["curas"]   = t.get("curas", 0) + 1
        msg = "¡Curada! 💚"

    t["inventario"][item] = t["inventario"][item] - 1
    if t["inventario"][item] <= 0:
        t["inventario"].pop(item, None)

    _tama_guardar(t)
    return _tama_respuesta(t, msg)


@app.route("/api/tama/comprar", methods=["POST"])
def api_tama_comprar():
    if "username" not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    t = _tama_cargar()
    if not t:
        return jsonify({"status": "error", "message": "No tienes mascota"}), 404

    item = (request.json or {}).get("item", "")
    it   = TIENDA.get(item)
    if not it:
        return jsonify({"status": "error", "message": "Objeto inexistente"}), 400
    if it["tipo"] == "cosmetico" and item in t.get("cosmeticos", []):
        return jsonify({"status": "error", "message": "Ya lo tienes"}), 409
    if t.get("monedas", 0) < it["precio"]:
        return jsonify({"status": "error", "message": "Monedas insuficientes ◎"}), 409

    t["monedas"] = int(t["monedas"] - it["precio"])
    if it["tipo"] == "cosmetico":
        t.setdefault("cosmeticos", []).append(item)
    else:
        inv = t.setdefault("inventario", {})
        inv[item] = inv.get(item, 0) + 1

    _tama_guardar(t)
    return _tama_respuesta(t, f"Compraste {it['nombre']} 🛍️")


@app.route("/api/tama/equipar", methods=["POST"])
def api_tama_equipar():
    if "username" not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401

    t = _tama_cargar()
    if not t:
        return jsonify({"status": "error", "message": "No tienes mascota"}), 404

    item = (request.json or {}).get("item")  # None = quitar
    if item is not None:
        if item not in t.get("cosmeticos", []):
            return jsonify({"status": "error", "message": "No tienes ese objeto"}), 409
        if TIENDA.get(item, {}).get("tipo") != "cosmetico":
            return jsonify({"status": "error", "message": "No es equipable"}), 400

    t.setdefault("equipado", {})["accesorio"] = item
    _tama_guardar(t)
    return _tama_respuesta(t)


# ── Logros propios del Tamagotchi (los de puntos se resuelven en
#    _verificar_logros vía /guardar_puntaje; estos son por condición) ──
def _tama_logros(username, t):
    u = usuarios_col.find_one({"username": username}, {"logros": 1})
    if not u:
        return []
    ya = set(u.get("logros", []))
    nuevos = []

    def marcar(lid, cond):
        if cond and lid not in ya:
            nuevos.append(lid)

    marcar("tama_nace",   t.get("nacido"))
    marcar("tama_nino",   _tama_etapa(t.get("mejor_edad_seg", 0), t.get("nacido")) in ("nino", "adulto"))
    marcar("tama_adulto", t.get("mejor_edad_seg", 0) >= TAMA_ETAPAS[-1][1])
    marcar("tama_doctor", t.get("curas", 0) >= 1)
    marcar("tama_rico",   t.get("monedas", 0) >= 150)
    marcar("tama_fashion", len(t.get("cosmeticos", [])) >= 3)
    marcar("tama_luto",   t.get("muertes", 0) >= 1)

    if nuevos:
        usuarios_col.update_one(
            {"username": username},
            {"$addToSet": {"logros": {"$each": nuevos}}}
        )
        titulos = {l["id"]: l["titulo"] for l in LOGROS}
        return [titulos.get(n, n) for n in nuevos]
    return []


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
    # Tamagotchi (por tiempo de vida — 10 pts por hora)
    {"id": "tama_dia",     "juego": "tamagochi", "titulo": "Un día juntos",     "desc": "Mantén viva a tu mascota 24 horas",     "icono": "📅", "umbral": 240},
    {"id": "tama_semana",  "juego": "tamagochi", "titulo": "Inseparables",      "desc": "Mantén viva a tu mascota 7 días",       "icono": "🏅", "umbral": 1680},
    # Tamagotchi (por condición — se desbloquean desde _tama_logros)
    {"id": "tama_nace",    "juego": "tamagochi", "titulo": "Nace un amigo",     "desc": "Haz eclosionar tu primer huevo",        "icono": "🐣", "umbral": None},
    {"id": "tama_nino",    "juego": "tamagochi", "titulo": "Está creciendo",    "desc": "Tu mascota llega a la etapa Niño",      "icono": "🧒", "umbral": None},
    {"id": "tama_adulto",  "juego": "tamagochi", "titulo": "Ya es adulta",      "desc": "Tu mascota llega a la etapa Adulto",    "icono": "🎂", "umbral": None},
    {"id": "tama_doctor",  "juego": "tamagochi", "titulo": "Doctor Mascota",    "desc": "Cura a tu mascota de una enfermedad",   "icono": "💉", "umbral": None},
    {"id": "tama_rico",    "juego": "tamagochi", "titulo": "Buen cuidador",     "desc": "Acumula 150 monedas cuidando bien",     "icono": "💰", "umbral": None},
    {"id": "tama_fashion", "juego": "tamagochi", "titulo": "A la moda",         "desc": "Consigue 3 objetos cosméticos",         "icono": "🎩", "umbral": None},
    {"id": "tama_luto",    "juego": "tamagochi", "titulo": "Se aprende",        "desc": "Perdiste una mascota… inténtalo de nuevo", "icono": "🕯️", "umbral": None},
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
        elif logro['juego'] == juego and logro['umbral'] is not None and puntos >= logro['umbral']:
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

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)

