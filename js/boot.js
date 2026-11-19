// Bu klassik skriptdir (module deyil): düymələr oyun faylları yüklənməsə belə həmişə işləyir.
(function () {
  var startScreen = document.getElementById('start-screen');
  var phoneButton = document.getElementById('choose-phone');
  var pcButton = document.getElementById('choose-pc');
  var statusBox = document.getElementById('start-status');
  var chosen = false;

  // Xəta paneli (üstünə toxunanda bağlanır)
  var errorBox = document.createElement('div');
  errorBox.id = 'error-box';
  errorBox.addEventListener('click', function () {
    errorBox.style.display = 'none';
  });
  document.body.appendChild(errorBox);

  function showStatus(text, isError) {
    statusBox.textContent = text;
    statusBox.className = isError ? 'error' : '';
  }

  function describe(error) {
    if (error && error.message) { return error.message; }
    return String(error);
  }

  function reportError(text) {
    errorBox.textContent = text + '\n(bağlamaq üçün toxun)';
    errorBox.style.display = 'block';
  }

  window.addEventListener('error', function (event) {
    var file = event.filename ? event.filename.split('/').pop() : '';
    var where = file ? ' [' + file + ':' + event.lineno + ']' : '';
    reportError('Xəta: ' + event.message + where);
  });

  window.addEventListener('unhandledrejection', function (event) {
    reportError('Xəta: ' + describe(event.reason));
  });

  // Toxunuşlu ekran varsa telefonu, yoxdursa kompüteri tövsiyə edirik
  var isTouchDevice = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (isTouchDevice) {
    phoneButton.classList.add('suggested');
  } else {
    pcButton.classList.add('suggested');
  }

  // import() köhnə brauzerdə sintaksis xətası verməsin deyə Function ilə çağırılır
  function importModule(url) {
    try {
      var loader = new Function('url', 'return import(url);');
      return loader(url);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Oyun faylları səhifə açılan kimi arxa planda yüklənməyə başlayır
  var mainUrl = new URL('js/main.js', document.baseURI).href;
  var loadPromise = importModule(mainUrl);
  loadPromise.then(
    function () { showStatus('Hazırdır. Cihazını seç.', false); },
    function (error) {
      showStatus('Oyun faylları yüklənmədi: ' + describe(error) + '. İnterneti yoxla və səhifəni yenilə.', true);
    }
  );

  function pick(device) {
    if (chosen) { return; }
    chosen = true;
    showStatus('Oyun yüklənir...', false);

    loadPromise.then(function (module) {
      document.body.classList.add('device-' + device);
      module.startGame(device);
      startScreen.classList.add('hidden');
    }).catch(function (error) {
      document.body.classList.remove('device-' + device);
      showStatus('Oyun açılmadı: ' + describe(error) + '. Səhifəni yeniləyib yenidən yoxla.', true);
    });
  }

  phoneButton.addEventListener('click', function () { pick('phone'); });
  pcButton.addEventListener('click', function () { pick('pc'); });
})();
