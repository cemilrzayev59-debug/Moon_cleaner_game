import { GameState } from './state.js';

let toastTimer = null;
const elements = {};   // tapılmış HTML elementlərigyfxfy
const lastTexts = {};  // son yazılmış mətnlər (boş yerə yeniləməmək üçün)

function getElement(id) {
  if (!elements[id]) {
    elements[id] = document.getElementById(id);
  }
  return elements[id];
}

// Mətn dəyişibsə yazır
function setTextIfChanged(id, text) {
  if (lastTexts[id] === text) { return; }
  const element = getElement(id);
  if (element) {
    element.textContent = text;
    lastTexts[id] = text;
  }
}

// Ekranın yuxarısında qısa mesaj göstərir
export function showToast(text) {
  const toast = getElement('toast');
  toast.textContent = text;
  toast.classList.add('show');
  if (toastTimer !== null) { clearTimeout(toastTimer); }
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toastTimer = null;
  }, 1800);
}

// Pul və çanta yazısı (çantanın real tutumu göstərilir)
export function updateHUD() {
  setTextIfChanged('hud-money', '💰 ' + Math.floor(GameState.money));
  setTextIfChanged(
    'hud-bag',
    '🎒 ' + GameState.bag.toFixed(2) + '/' + GameState.bagCapacity.toFixed(2) + ' kq'
  );
}

// Parça faizi və bazaya məsafə yazıları
export function updateInfoLabels(chunkPercent, baseMeters) {
  setTextIfChanged('chunk-info', 'Parça: ' + chunkPercent + '%');
  setTextIfChanged('base-info', 'Baza: ' + baseMeters + ' m');
}
