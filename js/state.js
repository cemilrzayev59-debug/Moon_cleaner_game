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
  const qazanc = satilan * qiymetPerVahid;
  GameState.money += qazanc;
  GameState.bag = 0;
  return { qazanc, satilan };
}

export function pulXercle(miqdar) {
  if (miqdar > GameState.money) { return false; }
  GameState.money -= miqdar;
  return true;
}
