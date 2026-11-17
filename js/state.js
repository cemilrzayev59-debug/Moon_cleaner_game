// Oyun vəziyyəti — Ekrandan və Three.js-dən asılı deyil
import { CONFIG } from './config.js';

export const GameState = {
  money: 0,
  bag: 0,
  bagCapacity: CONFIG.BAG_CAPACITY,
  totalDustCollected: 0,
  upgrades: {
    brushLevel: 1,
    bagLevel: 1,
  },
};

// Çantaya toz əlavə edir. Nə qədər əlavə olunduğunu qaytarır.
export function tozToplA(miqdar) {
  if (miqdar <= 0) {
    return 0;
  }
  const bosYer = GameState.bagCapacity - GameState.bag;
  const alinan = Math.min(bosYer, miqdar);
  GameState.bag += alinan;
  GameState.totalDustCollected += alinan;
  return alinan;
}

// Çantadakı tozu satır, pul qazanır.
export function sat(qiymetPerVahid) {
  const satilan = GameState.bag;
  const qazanc = satilan * qiymetPerVahid;
  GameState.money += qazanc;
  GameState.bag = 0;
  return { qazanc, satilan };
}

// Pul xərcləyir. Uğurlu olarsa true qaytarır.
export function pulXercle(miqdar) {
  if (miqdar > GameState.money) {
    return false;
  }
  GameState.money -= miqdar;
  return true;
}
