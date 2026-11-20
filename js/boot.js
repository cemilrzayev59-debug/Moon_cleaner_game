// Bu klassik skriptdir (module deyil): düymələr və xəta mesajları oyun faylları yüklənməsə belə işləyir.uugfrugf
(function () {
  var startScreen = document.getElementById('start-screen');
  var startBox = document.getElementById('start-box');
  var phoneButton = document.getElementById('choose-phone');
  var pcButton = document.getElementById('choose-pc');
  var statusBox = document.getElementById('start-status');
  var chosen = false;
  var reloadButton = null;

  // Three.js kitabxanasını yükləmək üçün ünvanlar (ardıcıllıqla sınanır)
  var THREE_URLS = [
    'js/vendor/three.module.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
    'https://unpkg.com/three@0.160.0/build/three.module.js',
    'https://esm.sh/three@0.160.0'
  ];

  statusBox.style.whiteSpace = 'pre-wrap';
  statusBox.style.textAlign = 'left';

  // Xəta paneli (üstünə toxunanda bağlanır)
  var errorBox = document.createElement('div');
  errorBox.id = 'error-box';
  errorBox.addEventListener('click', function () {
    errorBox.style.display = 'none';
  });
  document.body.appendChild(errorBox);

  function describe(error) {
    if (error && error.message) { return error.message; }
    return String(error);
  }

  function showReloadButton() {
    if (reloadButton !== null) { return; }
    reloadButton = document.createElement('button');
    reloadButton.type = 'button';
    reloadButton.className = 'choose-btn';
    reloadButton.textContent = '🔄 Səhifəni yenilə';
    reloadButton.addEventListener('click', function () { location.reload(); });
    startBox.appendChild(reloadButton);
  }

  function showStatus(text, isError) {
    statusBox.textContent = text;
    statusBox.className = isError ? 'error' : '';
    if (isError) { showReloadButton(); }
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

  // Cavab gəlməsə, müəyyən vaxtdan sonra xəta verir
  function withTimeout(promise, milliseconds, label) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error(label + ': ' + (milliseconds / 1000) + ' saniyədə cavab gəlmədi'));
      }, milliseconds);
      promise.then(
        function (value) { clearTimeout(timer); resolve(value); },
        function (error) { clearTimeout(timer); reject(error); }
      );
    });
  }

  // "https://site.com/Oyun/js/sweep.js" -> "js/sweep.js"
  function fileLabel(url) {
    return url.split('?')[0].split('/').slice(-2).join('/');
  }

  function isUrl(text) {
    return /^https?:\/\//.test(text);
  }

  function isRelative(spec) {
    return spec.charAt(0) === '.' || spec.charAt(0) === '/';
  }

  // Şərhləri silir (şərhlərin içindəki "import" sözü yanlış nəticə verməsin deyə)
  function stripComments(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  }

  // Faylın import etdiyi bütün ünvanları tapır
  function findImports(text) {
    var clean = stripComments(text);
    var pattern = /\b(?:import|export)\s*(?:[^'"`;()]*?\bfrom\s*)?['"]([^'"]+)['"]/g;
    var specs = [];
    var match = pattern.exec(clean);
    while (match !== null) {
      specs.push(match[1]);
      match = pattern.exec(clean);
    }
    return specs;
  }

  // main.js-dən başlayıb bütün faylları yoxlayır; tapılmayanları siyahıya yazır.
  // cache: 'reload' brauzerin yaddaşındakı köhnə "tapılmadı" cavabını da yeniləyir.
  function scanModules(entryUrl) {
    var visited = {};
    var order = [];
    var problems = [];

    function visit(url, importer) {
      if (visited[url]) { return Promise.resolve(); }
      visited[url] = true;

      return fetch(url, { cache: 'reload' }).then(function (response) {
        if (!response.ok) {
          problems.push({ url: url, importer: importer, reason: 'HTTP ' + response.status + ' (fayl tapılmadı)' });
          return null;
        }
        return response.text();
      }).then(function (text) {
        if (text === null) { return null; }
        order.push(url);

        var chain = Promise.resolve();
        findImports(text).forEach(function (spec) {
          if (isUrl(spec)) { return; }
          if (!isRelative(spec)) {
            problems.push({
              url: spec,
              importer: url,
              reason: '"' + spec + '" adı ilə import köhnə üsuldur (importmap artıq yoxdur), fayl köhnə versiyadır'
            });
            return;
          }
          var nextUrl = new URL(spec, url).href;
          chain = chain.then(function () { return visit(nextUrl, url); });
        });
        return chain;
      }, function (error) {
        problems.push({ url: url, importer: importer, reason: 'şəbəkə xətası: ' + describe(error) });
      });
    }

    return visit(entryUrl, 'boot.js').then(function () {
      return { order: order, problems: problems };
    });
  }

  function formatProblems(problems) {
    var lines = ['Bu fayllarda problem var:'];
    problems.forEach(function (problem) {
      var name = isUrl(problem.url) ? fileLabel(problem.url) : problem.url;
      lines.push('• ' + name + ': ' + problem.reason + ' (çağıran: ' + fileLabel(problem.importer) + ')');
    });
    lines.push('');
    lines.push('Həll: GitHub-da həmin faylı yoxla (qovluğu, adı və böyük-kiçik hərfi) və ya yenidən yüklə. Sonra 1-2 dəqiqə gözləyib səhifəni yenilə.');
    return lines.join('\n');
  }

  // Three.js-i bir neçə ünvandan sınayır, ilk işləyəni window.__THREE__ içinə qoyur
  function loadThree() {
    var errors = [];
    var index = 0;

    function tryNext() {
      if (index >= THREE_URLS.length) {
        return Promise.reject(new Error(
          'Three.js kitabxanası yüklənmədi:\n' + errors.join('\n') + '\n\n' +
          'Ehtimal: bu internetdə kitabxana saytları bloklanıb. Həll: başqa şəbəkədə ' +
          'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js ünvanını açıb faylı yüklə, ' +
          'GitHub-da js/vendor/three.module.min.js adı ilə əlavə et.'
        ));
      }
      var raw = THREE_URLS[index];
      index += 1;
      var url = isUrl(raw) ? raw : new URL(raw, document.baseURI).href;
      var label = isUrl(raw) ? raw.replace(/^https?:\/\//, '').split('/')[0] : raw;
      showStatus('Three.js yüklənir (' + label + ')...', false);

      return withTimeout(importModule(url), 15000, label).then(function (module) {
        if (!module || !module.WebGLRenderer) { throw new Error('fayl düzgün Three.js deyil'); }
        window.__THREE__ = module;
      }).catch(function (error) {
        errors.push('• ' + label + ': ' + describe(error));
        return tryNext();
      });
    }

    return tryNext();
  }

  // Fayllar yüklənib, amma import xətası varsa: hansı faylda olduğunu tapır
  function diagnoseModules(order) {
    var list = order.slice().reverse();
    var index = 0;

    function next() {
      if (index >= list.length) { return Promise.resolve(null); }
      var url = list[index];
      index += 1;
      return importModule(url).then(next, function (error) {
        return fileLabel(url) + ': ' + describe(error);
      });
    }

    return next();
  }

  // Bütün yükləmə addımları: yoxlama, Three.js, oyun faylları
  function loadGameModule() {
    var mainUrl = new URL('js/main.js', document.baseURI).href;
    showStatus('Fayllar yoxlanılır...', false);

    return scanModules(mainUrl).then(function (scan) {
      if (scan.problems.length > 0) {
        throw new Error(formatProblems(scan.problems));
      }
      return loadThree().then(function () {
        showStatus('Oyun faylları yüklənir...', false);
        return importModule(mainUrl).catch(function (error) {
          return diagnoseModules(scan.order).then(function (detail) {
            throw new Error('Faylda xəta: ' + (detail || describe(error)));
          });
        });
      });
    });
  }

  // Oyun faylları səhifə açılan kimi arxa planda yüklənməyə başlayır
  var loadPromise = loadGameModule();
  loadPromise.then(
    function () { showStatus('Hazırdır. Cihazını seç.', false); },
    function (error) { showStatus(describe(error), true); }
  );

  function pick(device) {
    if (chosen) { return; }
    chosen = true;
    showStatus('Oyun yüklənir...', false);

    loadPromise.then(function (module) {
      document.body.classList.add('device-' + device);
      try {
        module.startGame(device);
      } catch (error) {
        document.body.classList.remove('device-' + device);
        throw error;
      }
      startScreen.classList.add('hidden');
    }).catch(function (error) {
      chosen = false;
      showStatus('Oyun açılmadı:\n' + describe(error), true);
    });
  }

  phoneButton.addEventListener('click', function () { pick('phone'); });
  pcButton.addEventListener('click', function () { pick('pc'); });
})();
