import { GameState, exportState, importState } from './state.js';

const OLD_SAVE_KEY = 'ay_temizleme_save_v1';

// Hər oyunçunun yaddaşı öz ID-sinə bağlıdır
function getSaveKey(playerId) {
  return 'ay_temizleme_save_v1:' + playerId;
}

export function saveGame() {
  try {
    const data = exportState();
    data.savedAt = Date.now();
    localStorage.setItem(getSaveKey(GameState.playerId), JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('Saxlama xətası:', e);
    return false;
  }
}

export function loadGame() {
  try {
    let raw = localStorage.getItem(getSaveKey(GameState.playerId));
    if (!raw) {
      // Köhnə versiyadakı yaddaşı tapıb köçürürük
      raw = localStorage.getItem(OLD_SAVE_KEY);
    }
    if (!raw) { return false; }
    importState(JSON.parse(raw));
    return true;
  } catch (e) {
    console.warn('Yükləmə xətası:', e);
    return false;
  }
}

// Avtomatik saxlama: hər 10 saniyədən bir, həmçinin səhifə gizlənəndə və ya bağlananda
export function startAutoSave() {
  setInterval(saveGame, 10000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { saveGame(); }
  });
  window.addEventListener('pagehide', saveGame);
}
