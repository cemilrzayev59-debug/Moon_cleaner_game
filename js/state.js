import { CONFIG } from './config.js';

export const GameState = {
  money: 0,
  bag: 0,
  bagCapacity: CONFIG.BAG_LEVELS[0].capacity,
  totalDustCollected: 0,
  upgrades: {
    brushLevel: 1,
    bagLevel: 1,
  },
};

// Səviyyələr dəyişəndən və ya yüklənəndən sonra çağırılır
export function applyUpgrades() {
  const maxBrush = CONFIG.BRUSH_TOOLS.length;
  const maxBag = CONFIG.BAG_LEVELS.length;
  GameState.upgrades.brushLevel = Math.min(Math.max(GameState.upgrades.brushLevel, 1), maxBrush);
  GameState.upgrades.bagLevel = Math.min(Math.max(GameState.upgrades.bagLevel, 1), maxBag);
  GameState.bagCapacity = CONFIG.BAG_LEVELS[GameState.upgrades.bagLevel - 1].capacity;
}

export function getBrushTool() {
  return CONFIG.BRUSH_TOOLS[GameState.upgrades.brushLevel - 1];
}

export function getBrushSize() {
  return getBrushTool().size;
}

export function getNextBrushTool() {
  return CONFIG.BRUSH_TOOLS[GameState.upgrades.brushLevel] || null;
}

export function getNextBagLevel() {
  return CONFIG.BAG_LEVELS[GameState.upgrades.bagLevel] || null;
}

export function tozToplA(miqdar) {
  if (miqdar <= 0) { return 0; }
  const bosYer = GameState.bagCapacity - GameState.bag;
  const alinan = Math.min(bosYer, miqdar);
  GameState.bag += alinan;
  GameState.totalDustCollected += alinan;
  return alinan;
}

export function sat(qiymetPerVahid) {
  const satilan = GameState.bag;
  const qazanc = Math.round(satilan * qiymetPerVahid * 10) / 10;
  GameState.money = Math.round((GameState.money + qazanc) * 10) / 10;
  GameState.bag = 0;
  return { qazanc, satilan };
}

export function pulXercle(miqdar) {
  if (miqdar > GameState.money) { return false; }
  GameState.money -= miqdar;
  return true;
}

export function buyBrushUpgrade() {
  const next = getNextBrushTool();
  if (next === null) { return { ok: false, message: 'Ən güclü alətdir' }; }
  if (!pulXercle(next.price)) { return { ok: false, message: 'Pul çatmır' }; }
  GameState.upgrades.brushLevel += 1;
  applyUpgrades();
  return { ok: true, message: next.name + ' alındı!' };
}

export function buyBagUpgrade() {
  const next = getNextBagLevel();
  if (next === null) { return { ok: false, message: 'Ən böyük çantadır' }; }
  if (!pulXercle(next.price)) { return { ok: false, message: 'Pul çatmır' }; }
  GameState.upgrades.bagLevel += 1;
  applyUpgrades();
  return { ok: true, message: 'Çanta ' + next.capacity + ' kq oldu!' };
}
