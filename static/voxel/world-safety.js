(() => {
  'use strict';

  const cancelAction = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('button');
    if (!button) return;

    if (button.matches('button[title^="Generar otro mundo"]')) {
      const confirmed = window.confirm(
        '¿Generar otro mundo? Esto reemplazará el mundo actual y se perderán los cambios que aún no se hayan guardado.'
      );
      if (!confirmed) cancelAction(event);
      return;
    }

    const deleteButton = button.matches('button[aria-label^="Borrar mundo "]')
      ? button
      : null;
    if (deleteButton) {
      const worldName = deleteButton.getAttribute('aria-label').replace(/^Borrar mundo\s*/, '');
      const confirmed = window.confirm(
        `¿Borrar permanentemente el mundo «${worldName}»? Esta acción no se puede deshacer.`
      );
      if (!confirmed) cancelAction(event);
    }
  }, true);

  window.addEventListener('keydown', (event) => {
    if (event.repeat || event.key.toLowerCase() !== 'r') return;
    if (!document.querySelector('canvas[aria-label="Mundo del juego"]')) return;

    const confirmed = window.confirm(
      '¿Generar otro mundo? Esto reemplazará el mundo actual y se perderán los cambios que aún no se hayan guardado.'
    );
    if (!confirmed) cancelAction(event);
  }, true);
})();
