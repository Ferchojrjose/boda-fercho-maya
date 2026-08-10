import { invitados } from './invitados.js';

(function () {
  var codeInput = document.getElementById('form_code');
  var searchBtn = document.getElementById('btn-buscar');
  var guestBox = document.getElementById('guest-box');
  var guestList = document.getElementById('guest-list');
  var codeMessage = document.getElementById('code-message');
  var form = document.getElementById('rsvp-form');
  var messageInput = document.getElementById('form_message');
  var confirmBtn = document.getElementById('btn-confirmar');

  // Modal de resultado
  var modal = document.getElementById('rsvp-modal');
  var modalMessage = modal ? modal.querySelector('.rsvp-modal-message') : null;
  var modalIcon = modal ? modal.querySelector('.rsvp-modal-icon i') : null;

  // Si es true, al cerrar el modal se reinicia el flujo para un nuevo código
  var reiniciarAlCerrar = false;

  // Muestra el modal con un tipo ('success' | 'error') y un mensaje
  function showModal(tipo, mensaje) {
    if (!modal) {
      return;
    }
    modal.classList.remove('is-success', 'is-error');
    modal.classList.add(tipo === 'error' ? 'is-error' : 'is-success');

    if (modalIcon) {
      modalIcon.className = 'fa ' + (tipo === 'error' ? 'fa-times' : 'fa-check');
    }
    if (modalMessage) {
      modalMessage.textContent = mensaje || '';
    }
    modal.hidden = false;
  }

  function hideModal() {
    if (modal) {
      modal.hidden = true;
    }
    // Al cerrar tras un envío exitoso, limpiar todo para empezar de nuevo
    if (reiniciarAlCerrar) {
      reiniciarAlCerrar = false;
      reiniciarFlujo();
    }
  }

  // Deja el formulario listo para un nuevo código
  function reiniciarFlujo() {
    codeInput.value = '';
    guestList.innerHTML = '';
    guestBox.hidden = true;
    if (messageInput) {
      messageInput.value = '';
    }
    showMessage('');
    updateConfirmState();
    codeInput.focus();
  }

  // Muestra/oculta el spinner dentro del botón Confirmar
  function setConfirmLoading(cargando) {
    if (!confirmBtn) {
      return;
    }
    if (cargando) {
      confirmBtn.setAttribute('data-label', confirmBtn.textContent);
      confirmBtn.innerHTML = '<span class="btn-spinner"></span>';
      confirmBtn.disabled = true;
      confirmBtn.classList.add('is-loading');
    } else {
      confirmBtn.classList.remove('is-loading');
      confirmBtn.textContent = confirmBtn.getAttribute('data-label') || 'Confirmar';
      updateConfirmState();
    }
  }

  if (modal) {
    // Cerrar con la X, el botón Aceptar o el fondo
    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-modal-close')) {
        hideModal();
      }
    });
    // Cerrar con Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) {
        hideModal();
      }
    });
  }

  // Habilita el botón Confirmar solo cuando TODOS los invitados eligieron una opción
  function updateConfirmState() {
    if (!confirmBtn) {
      return;
    }
    var totalInvitados = guestList.querySelectorAll('.guest-item').length;
    var respondidos = guestList.querySelectorAll('input[type="radio"]:checked').length;
    confirmBtn.disabled = !(totalInvitados > 0 && respondidos === totalInvitados);
  }

  if (!codeInput || !searchBtn || !guestBox || !guestList) {
    return;
  }

  // Permitir únicamente números en el input del código
  codeInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');

    // Si el campo queda vacío, ocultar y limpiar la lista de invitados
    if (this.value === '') {
      guestBox.hidden = true;
      guestList.innerHTML = '';
      showMessage('');
      updateConfirmState();
    }
  });

  // Actualizar el estado del botón al marcar/desmarcar invitados
  guestList.addEventListener('change', updateConfirmState);

  function showMessage(text) {
    if (codeMessage) {
      codeMessage.textContent = text || '';
    }
  }

  function crearRadio(grupo, valor, nombre) {
    var choice = document.createElement('span');
    choice.className = 'guest-choice';

    var radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = grupo;
    radio.value = valor;
    radio.setAttribute('data-guest', nombre);

    choice.appendChild(radio);
    return choice;
  }

  function renderGuests(integrantes) {
    guestList.innerHTML = '';

    integrantes.forEach(function (nombre, index) {
      var grupo = 'resp_' + index;

      var li = document.createElement('li');
      li.className = 'guest-item';

      var span = document.createElement('span');
      span.className = 'guest-name';
      span.textContent = nombre;

      li.appendChild(span);
      li.appendChild(crearRadio(grupo, 'confirmar', nombre));
      li.appendChild(crearRadio(grupo, 'no', nombre));
      guestList.appendChild(li);
    });
  }

  function buscarInvitado() {
    var codigo = codeInput.value.trim();

    if (!codigo) {
      guestBox.hidden = true;
      showMessage('Por favor ingresa tu código.');
      return;
    }

    var invitado = invitados.find(function (item) {
      return item.codigo === codigo;
    });

    if (!invitado) {
      guestBox.hidden = true;
      showMessage('No encontramos ese código. Verifícalo e intenta de nuevo.');
      return;
    }

    showMessage('');
    renderGuests(invitado.integrantes);
    guestBox.hidden = false;
    updateConfirmState();
  }

  function confirmarAsistencia(e) {
    if (e) {
      e.preventDefault();
    }

    var confirmados = [];
    var desconfirmados = [];

    // Recorrer las respuestas elegidas y clasificarlas por el nombre del invitado
    Array.prototype.slice
      .call(guestList.querySelectorAll('input[type="radio"]:checked'))
      .forEach(function (radio) {
        var nombre = radio.getAttribute('data-guest');
        if (radio.value === 'confirmar') {
          confirmados.push(nombre);
        } else {
          desconfirmados.push(nombre);
        }
      });

    // JSON listo para enviar por HTTP
    var data = {
      codigo: codeInput.value.trim(),
      confirmados: confirmados,
      desconfirmados: desconfirmados,
      mensaje: messageInput ? messageInput.value.trim() : ''
    };

    // Endpoint del Web App de Google Apps Script (doPost)
    var ENDPOINT = 'https://script.google.com/macros/s/AKfycbyzkJ9wux4VOkB2vAZhCbLvjMlIj-s6bD-YfO2XN8xLunwrOyD9QhAqJ9ztDtVbua4/exec';

    // Cuerpo (body) exacto que se envía por HTTP
    var payload = JSON.stringify(data);

    console.log('=== Enviando confirmación RSVP ===');
    console.log('POST →', ENDPOINT);
    console.log('Body:', payload);
    console.log('Objeto:', data);

    // Mostrar spinner mientras se espera la respuesta
    setConfirmLoading(true);

    // Content-Type text/plain para evitar el preflight CORS de Apps Script;
    // en el doPost se lee con JSON.parse(e.postData.contents)
    fetch(ENDPOINT, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }
        return res.json();
      })
      .then(function (respuesta) {
        console.log('Respuesta de Apps Script:', respuesta);

        // Desestructurar el mensaje de la respuesta del doPost
        var message = (respuesta || {}).message;

        setConfirmLoading(false);
        reiniciarAlCerrar = true; // al cerrar el modal se limpia el flujo
        showModal('success', message || 'Datos procesados correctamente');
      })
      .catch(function (err) {
        console.error('Error al enviar la confirmación:', err);
        setConfirmLoading(false);
        reiniciarAlCerrar = false;
        showModal('error', 'Error al registrar invitados');
      });
  }

  searchBtn.addEventListener('click', buscarInvitado);

  if (form) {
    form.addEventListener('submit', confirmarAsistencia);
  }

  // Permitir buscar con Enter sin enviar el formulario
  codeInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarInvitado();
    }
  });
})();
