/*
 * Carga recursos visuales independientes del bundle de juego.
 * Los recursos pendientes o fallidos se omiten; el bundle conserva sus fallbacks.
 */
(async () => {
  const base = '/static/voxel/textures/';
  const version = '20261117-art-catalog2';
  const art = {
    blocks: Object.create(null),
    items: Object.create(null),
    entities: Object.create(null),
  };
  const imageCache = new Map();

  const loadImage = (path) => {
    if (imageCache.has(path)) return imageCache.get(path);
    const promise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        console.warn(`Voxel Miner: no se pudo cargar el recurso ${path}`);
        resolve(null);
      };
      image.src = `${base}${path}?v=${version}`;
    });
    imageCache.set(path, promise);
    return promise;
  };

  try {
    const response = await fetch(`${base}manifest.json?v=${version}`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();
    const pending = new Set(manifest.pendingAssets || []);
    const allEntries = [
      ...Object.entries(manifest.blocks || {}).map(([id, path]) => ['blocks', id, path]),
      ...Object.entries(manifest.items || {}).map(([id, path]) => ['items', id, path]),
      ...Object.entries(manifest.entities || {}).map(([id, path]) => ['entities', id, path]),
    ];
    const entries = allEntries.filter(([, , path]) => !pending.has(path));
    const images = await Promise.all(entries.map(([, , path]) => loadImage(path)));
    entries.forEach(([group, id], index) => {
      if (images[index]) art[group][id] = images[index];
    });
  } catch (error) {
    console.warn('Voxel Miner: se usarán los recursos de respaldo.', error);
  }

  window.VoxelArt = art;
  const mountGame = () => import('/static/voxel/assets/index-voxel-visual2.js');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountGame, { once: true });
  } else {
    mountGame();
  }
})();
