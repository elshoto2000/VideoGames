/* Bigote Bros — capa de red del modo online (salas de hasta 4 jugadores).
   Host autoritativo: todos simulan con los mismos inputs y el host manda
   snapshots ~15 veces por segundo para corregir. Necesita socket.io cargado
   antes que este archivo y window.BigoteBros (mario.js). */
(function () {
  'use strict';

  var MAX = 4;
  var sock = null, room = null, mySlot = 0, amHost = false, playing = false;
  var lastIn = '', keepAlive = 0;
  var listeners = {};

  function emitEvt(name, data) {
    var ls = listeners[name] || [];
    for (var i = 0; i < ls.length; i++) { try { ls[i](data); } catch (e) { console.error(e); } }
  }
  function on(name, fn) { (listeners[name] = listeners[name] || []).push(fn); }

  function connected() { return !!(sock && sock.connected); }

  function connect(cb) {
    if (typeof io === 'undefined') { emitEvt('error', 'No se pudo cargar socket.io'); return; }
    if (sock) {
      if (!cb) return;
      if (sock.connected) cb(); else sock.once('connect', cb);
      return;
    }
    /* Polling primero y luego subimos a websocket solos. Si el servidor no
       tiene el worker de websockets, la partida igual funciona (más lenta)
       en vez de morir con "no hay conexión". */
    sock = io({ transports: ['polling', 'websocket'], reconnectionAttempts: 6, timeout: 20000 });
    var fallos = 0;

    sock.on('connect', function () { fallos = 0; emitEvt('conn', true); if (cb) cb(); });
    sock.on('connect_error', function () {
      fallos++;
      if (fallos >= 3) emitEvt('error', 'No hay conexión con el servidor');
    });

    sock.on('bb_room', function (r) {
      room = r;
      for (var i = 0; i < r.players.length; i++) if (r.players[i].me) { mySlot = r.players[i].slot; amHost = !!r.players[i].host; }
      emitEvt('room', r);
    });
    sock.on('bb_error', function (m) { emitEvt('error', (m && m.msg) || 'Error'); });

    sock.on('bb_start', function (d) {
      playing = true;
      var names = {};
      for (var i = 0; i < d.players.length; i++) names[d.players[i].slot] = d.players[i].user;
      // las skins elegidas por cada quien viajan en el arranque
      if (d.skins && window.BigoteBros.setSkin) {
        for (var k = 0; k < d.skins.length; k++) {
          if (d.skins[k]) { try { window.BigoteBros.setSkin(k, d.skins[k]); } catch (e) { } }
        }
      }
      window.BigoteBros.netStart({ host: amHost, myId: mySlot, nPlayers: d.n, names: names });
      emitEvt('start', d);
    });

    sock.on('bb_input', function (d) { window.BigoteBros.netRemoteInput(d.i, d.d); });
    sock.on('bb_state', function (d) { if (!amHost) window.BigoteBros.netApply(d); });

    sock.on('bb_end', function (d) {
      if (playing) window.BigoteBros.netAbort((d && d.msg) || 'Se desconectó un jugador · puntaje guardado');
      playing = false;
      room = null;
      emitEvt('end', d || {});
    });

    sock.on('disconnect', function () {
      if (playing) { window.BigoteBros.netAbort('Se cayó tu conexión · puntaje guardado'); playing = false; }
      room = null;
      emitEvt('end', { msg: 'Conexión perdida' });
    });
  }

  // mario.js nos avisa cada tick: mandamos el input (solo si cambió) y el snapshot.
  function hookGame() {
    window.BigoteBros.onNet(function (kind, data) {
      if (!connected() || !room) return;
      if (kind === 'input') {
        var packed = (data.l ? 1 : 0) + '' + (data.r ? 1 : 0) + (data.j ? 1 : 0) + (data.d ? 1 : 0);
        keepAlive++;
        if (packed === lastIn && keepAlive % 30 !== 0) return;   // solo mandamos cambios
        lastIn = packed;
        sock.emit('bb_input', { code: room.code, i: mySlot, d: data });
      } else if (kind === 'state') {
        sock.emit('bb_state', { code: room.code, s: data });
      }
    });
  }

  var BB_NET = {
    max: MAX,
    connect: connect,
    on: on,
    room: function () { return room; },
    slot: function () { return mySlot; },
    isHost: function () { return amHost; },
    create: function (name, icon) {
      connect(function () { sock.emit('bb_create', { nombre: name, icono: icon }); });
    },
    join: function (code, icon) {
      connect(function () { sock.emit('bb_join', { code: String(code || '').toUpperCase().trim(), icono: icon }); });
    },
    setIcon: function (icon) { if (connected() && room) sock.emit('bb_icon', { code: room.code, icono: icon }); },
    sendSkin: function (skin) { if (connected() && room) sock.emit('bb_skin', { code: room.code, skin: skin }); },
    ready: function (v) { if (connected() && room) sock.emit('bb_ready', { code: room.code, ready: !!v }); },
    start: function () {
      if (connected() && room && amHost) sock.emit('bb_start', { code: room.code });
    },
    leave: function () {
      if (connected() && room) sock.emit('bb_leave', { code: room.code });
      playing = false; room = null;
    },
    playing: function () { return playing; }
  };

  window.BB_NET = BB_NET;

  if (window.BigoteBros && window.BigoteBros.onNet) hookGame();
  else document.addEventListener('DOMContentLoaded', function () {
    if (window.BigoteBros && window.BigoteBros.onNet) hookGame();
  });
})();
