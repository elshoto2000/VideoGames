# Biblioteca visual de Voxel Miner

Los PNG se mantienen separados del bundle de juego. El manifiesto `manifest.json` conecta cada recurso con el ID numérico o la entidad que ya usa el motor; los IDs de bloques son parte del formato del mundo y no deben renumerarse.

## Dirección del piloto: Cantera Viva

Pixel art 2D original de lectura clara en tiles de 32×32: tierra y madera cálidas, roca azul pizarra, hierba de musgo y mineral cobrizo. Se toman únicamente rasgos generales del género de minería/sandbox; no se reutilizan ni calcan sprites de otros juegos.

## Organización

- `blocks/terrain/`: tierra, hierba, piedra, arena y otros terrenos.
- `blocks/ores/`: variantes de piedra con minerales.
- `blocks/wood/`: troncos, hojas y tablas.
- `entities/player/`, `entities/animals/`, `entities/monsters/`: personajes y criaturas.
- `items/tools/`, `ui/`, `effects/`, `biomes/`: herramientas, interfaz, efectos y escenarios.

## Fallback y compatibilidad

El cargador omite recursos ausentes o inválidos; el bundle conserva el dibujo existente como respaldo. No cambiar IDs, dimensiones de colisión, dureza, drops, inventario serializado, controles, nombre accesible del canvas ni API de guardado al sustituir arte. La escala lógica de los bloques es 32×32.

Los PNG originales de alta resolución se conservan en `source/`; las versiones compactas listas para el motor están en sus carpetas de categoría. Los tiles terminados usan vecino más próximo para mantener bordes pixelados y el manifiesto incluye únicamente los recursos del primer piloto.
