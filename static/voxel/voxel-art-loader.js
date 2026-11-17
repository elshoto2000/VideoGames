/*
 * Carga recursos visuales independientes del bundle de juego.
 * Las texturas fallidas se omiten: el bundle conserva su dibujo procedural.
 */
(async () => {
  const base = '/static/voxel/textures/';
  const version = '20261116-art-pilot1';
  const art = { blocks: Object.create(null), entities: Object.create(null) };

  const loadImage = (path) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      console.warn(`Voxel Miner: no se pudo cargar el recurso ${path}`);
      resolve(null);
    };
    image.src = `${base}${path}?v=${version}`;
  });

  try {
    const response = await fetch(`${base}manifest.json?v=${version}`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();
    const entries = [
      ...Object.entries(manifest.blocks || {}).map(([id, path]) => ['blocks', id, path]),
      ...Object.entries(manifest.entities || {}).map(([id, path]) => ['entities', id, path]),
    ];
    const images = await Promise.all(entries.map(([, , path]) => loadImage(path)));
    entries.forEach(([group, id], index) => {
      if (images[index]) art[group][id] = images[index];
    });
  } catch (error) {
    console.warn('Voxel Miner: se usarán las texturas de respaldo.', error);
  }

  window.VoxelArt = art;
  const mountGame = () => import('/static/voxel/assets/index-voxel-visual1.js');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountGame, { once: true });
  } else {
    mountGame();
  }
})();
