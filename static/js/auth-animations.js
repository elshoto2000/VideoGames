/* ═══════════════════════════════════════════════════════
   auth-animations.js — Ciclo visual del Login / Registro
   Estados: reposo → procesando → éxito → redirección
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ─── Estado del autómata ─────────────────────── */
    const ESTADOS = {
        REPOSO:       'reposo',
        PROCESANDO:   'procesando',
        EXITO:        'exito',
        ERROR:        'error',
    };
    let estado = ESTADOS.REPOSO;

    /* ─── Detectar qué formulario está activo ─────── */
    const esLogin    = !!document.getElementById('form-login');
    const esRegistro = !!document.getElementById('form-registro');
    if (!esLogin && !esRegistro) return;

    const formId  = esLogin ? 'form-login' : 'form-registro';
    const apiRuta = esLogin ? '/login'      : '/registro';

    /* ─── Referencias DOM ─────────────────────────── */
    const form     = document.getElementById(formId);
    const btnSubmit = form.querySelector('.btn-submit');
    const card     = form.closest('.auth-card');

    /* ─── Inyectar estructura del botón animado ─────
       El botón original se convierte en el hub visual  */
    btnSubmit.innerHTML = `
        <span class="btn-label">${btnSubmit.dataset.label || btnSubmit.textContent.trim()}</span>
        <span class="btn-spinner" aria-hidden="true"></span>
        <span class="btn-check"  aria-hidden="true"></span>
    `;
    btnSubmit.setAttribute('data-label', btnSubmit.querySelector('.btn-label').textContent);

    /* ─── Mensaje de error / éxito inline ─────────── */
    let msgEl = document.getElementById('auth-msg');
    if (!msgEl) {
        msgEl = document.createElement('p');
        msgEl.id = 'auth-msg';
        msgEl.style.cssText = `
            margin-top: 0.75rem;
            font-size: 0.85rem;
            min-height: 1.2em;
            transition: opacity 0.3s;
            opacity: 0;
        `;
        btnSubmit.parentNode.insertBefore(msgEl, btnSubmit.nextSibling);
    }

    /* ─── Aplicar estado visual ───────────────────── */
    function aplicarEstado(nuevoEstado, mensaje = '') {
        estado = nuevoEstado;
        btnSubmit.classList.remove('btn--procesando', 'btn--exito', 'btn--error');
        msgEl.style.opacity = '0';

        switch (nuevoEstado) {
            case ESTADOS.PROCESANDO:
                btnSubmit.classList.add('btn--procesando');
                btnSubmit.disabled = true;
                break;

            case ESTADOS.EXITO:
                btnSubmit.classList.add('btn--exito');
                btnSubmit.disabled = true;
                msgEl.style.color = 'var(--success)';
                msgEl.textContent = mensaje;
                msgEl.style.opacity = '1';
                break;

            case ESTADOS.ERROR:
                btnSubmit.classList.remove('btn--procesando');
                btnSubmit.disabled = false;
                msgEl.style.color = 'var(--danger)';
                msgEl.textContent = mensaje;
                msgEl.style.opacity = '1';
                // Sacudir la tarjeta
                card.classList.add('auth-shake');
                setTimeout(() => card.classList.remove('auth-shake'), 600);
                break;

            case ESTADOS.REPOSO:
            default:
                btnSubmit.disabled = false;
                break;
        }
    }

    /* ─── Intercepción del formulario ────────────── */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (estado === ESTADOS.PROCESANDO || estado === ESTADOS.EXITO) return;

        const datos = {};
        new FormData(form).forEach((v, k) => { datos[k] = v; });

        // Avatar base64 (sólo en registro)
        if (esRegistro) {
            const avatarInput = document.getElementById('avatar-data');
            if (avatarInput) datos.avatar = avatarInput.value;
        }

        aplicarEstado(ESTADOS.PROCESANDO);

        /* Duración mínima del spinner para que se vea la animación */
        const [respuesta] = await Promise.all([
            fetch(apiRuta, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos),
            }).then(r => r.json()),
            new Promise(res => setTimeout(res, 900))   // mínimo 0.9 s
        ]);

        if (respuesta.status === 'success') {
            aplicarEstado(ESTADOS.EXITO, esLogin ? '¡Bienvenido!' : '¡Cuenta creada!');
            /* El checkmark se dibuja, luego redirigimos */
            setTimeout(() => {
                window.location.href = esLogin ? '/dashboard' : '/login';
            }, 1400);
        } else {
            aplicarEstado(ESTADOS.ERROR, respuesta.message || 'Algo salió mal, intenta de nuevo.');
        }
    });

    /* ─── Inyectar estilos dinámicos del botón ───── */
    const style = document.createElement('style');
    style.textContent = `
        /* ── Botón base ── */
        .btn-submit {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            overflow: hidden;
            min-width: 160px;
            min-height: 46px;
        }

        .btn-label, .btn-spinner, .btn-check {
            position: absolute;
            transition: opacity 0.25s, transform 0.25s;
        }

        /* Reposo: label visible */
        .btn-label   { opacity: 1;  transform: scale(1);    }
        .btn-spinner { opacity: 0;  transform: scale(0.6);  }
        .btn-check   { opacity: 0;  transform: scale(0.6);  }

        /* ── Estado: procesando ── */
        .btn--procesando .btn-label   { opacity: 0;  transform: scale(0.7); }
        .btn--procesando .btn-spinner { opacity: 1;  transform: scale(1);   }
        .btn--procesando .btn-check   { opacity: 0;  transform: scale(0.6); }

        /* ── Estado: éxito ── */
        .btn--exito .btn-label   { opacity: 0;  transform: scale(0.7); }
        .btn--exito .btn-spinner { opacity: 0;  transform: scale(0.6); }
        .btn--exito .btn-check   { opacity: 1;  transform: scale(1);   }
        .btn--exito { background: var(--success) !important; border-color: var(--success) !important; }

        /* ── Estado: error (label vuelve) ── */
        .btn--error .btn-label { opacity: 1; transform: scale(1); }

        /* ── Spinner SVG giratorio ── */
        .btn-spinner::before {
            content: '';
            display: block;
            width: 20px; height: 20px;
            border: 2.5px solid rgba(255,255,255,0.25);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: btn-spin 0.75s linear infinite;
        }

        @keyframes btn-spin {
            to { transform: rotate(360deg); }
        }

        /* ── Checkmark SVG dibujado ── */
        .btn-check::before {
            content: '';
            display: block;
            width: 22px; height: 22px;
            border: 2.5px solid white;
            border-radius: 50%;
        }
        .btn-check::after {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            width: 12px; height: 7px;
            border-left: 2.5px solid white;
            border-bottom: 2.5px solid white;
            transform: translate(-55%, -60%) rotate(-45deg);
        }

        /* ── Entrada del form ── */
        .auth-card {
            animation: authCardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes authCardIn {
            from { opacity: 0; transform: translateY(18px) scale(0.97); }
            to   { opacity: 1; transform: none; }
        }

        /* ── Sacudida en error ── */
        @keyframes auth-shake-kf {
            0%,100% { transform: translateX(0); }
            20%      { transform: translateX(-8px); }
            40%      { transform: translateX(8px); }
            60%      { transform: translateX(-5px); }
            80%      { transform: translateX(5px); }
        }
        .auth-shake {
            animation: auth-shake-kf 0.5s ease;
        }

        /* ── Ring pulsante alrededor del botón ── */
        .btn-submit::after {
            content: '';
            position: absolute;
            inset: -3px;
            border-radius: inherit;
            border: 2px solid transparent;
            transition: border-color 0.3s, box-shadow 0.3s;
            pointer-events: none;
        }
        .btn--procesando::after {
            border-color: rgba(79,124,255,0.4);
            box-shadow: 0 0 14px rgba(79,124,255,0.25);
            animation: ring-pulse 1.2s ease-in-out infinite;
        }
        @keyframes ring-pulse {
            0%,100% { box-shadow: 0 0 0 0 rgba(79,124,255,0.3); }
            50%      { box-shadow: 0 0 0 8px rgba(79,124,255,0); }
        }
        .btn--exito::after {
            border-color: rgba(52,199,123,0.5);
        }
    `;
    document.head.appendChild(style);

})();
