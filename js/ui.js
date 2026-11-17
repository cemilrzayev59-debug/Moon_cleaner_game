// HUD-u (pul, çanta) yeniləyir
import { GameState } from './state.js';

export function updateHUD() {
  const moneyEl = document.getElementById('hud-money');
  const bagEl = document.getElementById('hud-bag');
  if (moneyEl) {
    moneyEl.textContent = `💰 ${Math.floor(GameState.money)}`;
  }
  if (bagEl) {
    bagEl.textContent = `🎒 ${Math.floor(GameState.bag)}/${GameState.bagCapacity}`;
  }
}
