import { CONFIG } from './config.js';
import { GameState, spendMoney, setBagCapacity } from './state.js';

// Ədədi min və max arasında saxlayır
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Səviyyələr dəyişəndən və ya yüklənəndən sonra çağırılır
export function applyUpgrades() {
  const upgrades = GameState.upgrades;
  upgrades.brushLevel = clamp(Math.round(upgrades.brushLevel), 1, CONFIG.BRUSH_TOOLS.length);
  upgrades.bagLevel = clamp(Math.round(upgrades.bagLevel), 1, CONFIG.BAG_LEVELS.length);
  setBagCapacity(CONFIG.BAG_LEVELS[upgrades.bagLevel - 1].capacity);
}

// Hazırkı alət
export function getBrushTool() {
  return CONFIG.BRUSH_TOOLS[GameState.upgrades.brushLevel - 1];
}

// Hazırkı fırçanın ağzının ölçüsü
export function getBrushSize() {
  return getBrushTool().size;
}

// Növbəti alət (yoxdursa null)
export function getNextBrushTool() {
  return CONFIG.BRUSH_TOOLS[GameState.upgrades.brushLevel] || null;
}

// Növbəti çanta səviyyəsi (yoxdursa null)
export function getNextBagLevel() {
  return CONFIG.BAG_LEVELS[GameState.upgrades.bagLevel] || null;
}

// Növbəti aləti alır
export function buyBrushUpgrade() {
  const next = getNextBrushTool();
  if (next === null) { return { ok: false, message: 'Ən güclü alətdir' }; }
  if (!spendMoney(next.price)) { return { ok: false, message: 'Pul çatmır' }; }
  GameState.upgrades.brushLevel += 1;
  applyUpgrades();
  return { ok: true, message: next.name + ' alındı!' };
}

// Növbəti çantanı alırdwefefe
export function buyBagUpgrade() {
  const next = getNextBagLevel();
  if (next === null) { return { ok: false, message: 'Ən böyük çantadır' }; }
  if (!spendMoney(next.price)) { return { ok: false, message: 'Pul çatmır' }; }
  GameState.upgrades.bagLevel += 1;
  applyUpgrades();
  return { ok: true, message: 'Çanta ' + next.capacity + ' kq oldu!' };
}
