// localStorage ilə saxlama/yükləmə
import { GameState } from './state.js';

const SAVE_KEY = 'ay_temizleme_save_v1';

export function saveGame() {
  try {
    const data = {
      money: GameState.money,
      bag: GameState.bag,
      totalDustCollected: GameState.totalDustCollected,
      upgrades: GameState.upgrades,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('Saxlama xətası:', e);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) { return false; }
    const data = JSON.parse(raw);
    GameState.money = data.money || 0;
    GameState.bag = data.bag || 0;
    GameState.totalDustCollected = data.totalDustCollected || 0;
    if (data.upgrades) {
      Object.assign(GameState.upgrades, data.upgrades);
    }
    return true;
  } catch (e) {
    console.warn('Yükləmə xətası:', e);
    return false;
  }
}
