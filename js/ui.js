import { GameState } from './state.js';

export function updateHUD() {
  const moneyEl = document.getElementById('hud-money');
  const bagEl = document.getElementById('hud-bag');
  if (moneyEl) { 
    moneyEl.textContent = `💰 ${Math.floor(GameState.money)}`; 
  }
  if (bagEl) { 
    // 100 yerinə 1.00 kq formatı
    bagEl.textContent = `🎒 ${GameState.bag.toFixed(2)}/1.00 kq`; 
  }
}
