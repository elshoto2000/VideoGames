from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
import os

app = Flask(__name__)

# 1. Configuración de MongoDB Atlas
# Tu cadena de conexión ya con la contraseña apu20082009
MONGO_URI = "mongodb+srv://herreraleandro628:apu20082009@cluster0.q4tnkcc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client.arcade_db
puntajes_col = db.puntajes

print("✅ Conectado exitosamente a MongoDB Atlas")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/juego/<nombre_juego>')
def cargar_juego(nombre_juego):
    nombre_juego_busqueda = nombre_juego.lower() 
    
    # Obtenemos los rankings directamente de MongoDB para cada juego
    r_snake = list(puntajes_col.find({"juego": "snake"}).sort("puntos", -1).limit(5))
    r_trivia = list(puntajes_col.find({"juego": "trivia"}).sort("puntos", -1).limit(5))
    r_clicker = list(puntajes_col.find({"juego": "clicker"}).sort("puntos", -1).limit(5))

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
    juego = datos.get('juego').lower() 
    
    try:
        # Lógica de UPSERT en MongoDB:
        # Si el usuario ya existe en ese juego, solo actualiza si el puntaje es mayor.
        puntajes_col.update_one(
            {"nombre": nombre, "juego": juego},
            {"$max": {"puntos": puntos}},
            upsert=True
        )
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error al guardar: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/obtener_ranking')
def obtener_ranking():
    # Obtenemos el Top Global de MongoDB
    # Convertimos el cursor de Mongo a una lista y limpiamos el campo '_id' que no es serializable
    ranking = list(puntajes_col.find().sort("puntos", -1).limit(50))
    for r in ranking:
        r['_id'] = str(r['_id']) 
        
    return jsonify({"ranking": ranking})

if __name__ == '__main__':
    # Usar el puerto que Render asigne o el 5000 por defecto
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
