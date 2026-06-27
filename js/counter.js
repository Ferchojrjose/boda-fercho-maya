(function () {
  var TARGET = new Date('2026-12-12T17:00:00');

  function calcTimeRemaining(target) {
    var diff = target - Date.now();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    var totalSeconds = Math.floor(diff / 1000);
    return {
      days:    Math.floor(totalSeconds / 86400),
      hours:   Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function renderCounter() {
    var t = calcTimeRemaining(TARGET);

    var html =
      '<div class="count-block days">'    + pad(t.days)    + '<span class="count-label">' + (t.days    === 1 ? 'día'    : 'días')    + '</span></div>' +
      '<div class="count-block hours">'   + pad(t.hours)   + '<span class="count-label">' + (t.hours   === 1 ? 'hora'   : 'horas')   + '</span></div>' +
      '<div class="count-block minutes">' + pad(t.minutes) + '<span class="count-label">' + (t.minutes === 1 ? 'minuto' : 'minutos') + '</span></div>' +
      '<div class="count-block seconds">' + pad(t.seconds) + '<span class="count-label">' + (t.seconds === 1 ? 'segundo': 'segundos')+ '</span></div>';

    document.getElementById('count').innerHTML = html;

    if (t.days === 0 && t.hours === 0 && t.minutes === 0 && t.seconds === 0) {
      return;
    }
    setTimeout(renderCounter, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCounter);
  } else {
    renderCounter();
  }
})();
