import { CONFIG } from './config.js';

export const GameState = {
  playerId: 'local',   // hələlik tək oyunçu; multiplayer-də hər oyunçunun öz ID-si olacaq
  money: 0,
  bag: 0,
  bagCapacity: CONFIG.BAG_LEVELS[0].capacity,
  totalDustCollected: 0,
  upgrades: {
    brushLevel: 1,
    bagLevel: 1,
  },
};

// Pulu 0.1 dəqiqliyə yuvarlaqlaşdırır
function roundMoney(value) {
  return Math.round(value * 10) / 10;
}

// Ədəd deyilsə ehtiyat dəyəri qaytarır (xarab yaddaşdan qorunmaq üçün)
function toNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

// Saxlamaq üçün oyun vəziyyətinin surəti
export function exportState() {
  return {
    playerId: GameState.playerId,
    money: GameState.money,
    bag: GameState.bag,
    totalDustCollected: GameState.totalDustCollected,
    upgrades: {
      brushLevel: GameState.upgrades.brushLevel,
      bagLevel: GameState.upgrades.bagLevel,
    },
  };
}

// Yaddaşdan oxunan məlumatı yoxlayıb oyun vəziyyətinə yazır
export function importState(data) {
  GameState.money = Math.max(0, toNumber(data.money, 0));
  GameState.bag = Math.max(0, toNumber(data.bag, 0));
  GameState.totalDustCollected = Math.max(0, toNumber(data.totalDustCollected, 0));
  if (data.upgrades) {
    GameState.upgrades.brushLevel = toNumber(data.upgrades.brushLevel, 1);
    GameState.upgrades.bagLevel = toNumber(data.upgrades.bagLevel, 1);
  }
}

// Çantanın tutumunu dəyişir (çanta tutumdan çox doludursa, artığı kəsir)
export function setBagCapacity(capacity) {
  GameState.bagCapacity = capacity;
  if (GameState.bag > capacity) {
    GameState.bag = capacity;
  }
}

// Çanta doludurmu
export function isBagFull() {
  return GameState.bagCapacity - GameState.bag < 0.0001;
}

// Tozu çantaya əlavə edir, həqiqətən əlavə olunan miqdarı qaytarır
export function collectDust(amount) {
  if (amount <= 0) { return 0; }
  const freeSpace = GameState.bagCapacity - GameState.bag;
  const added = Math.min(freeSpace, amount);
  GameState.bag += added;
  GameState.totalDustCollected += added;
  return added;
}

// Çantadakı bütün tozu satır
export function sellDust(pricePerKg) {
  const sold = GameState.bag;
  const earned = roundMoney(sold * pricePerKg);
  GameState.bag = 0;
  earnMoney(earned);
  return { earned, sold };
}

// Pul qazandırır
export function earnMoney(amount) {
  if (amount <= 0) { return; }
  GameState.money = roundMoney(GameState.money + amount);
}

// Pul xərcləyir; kifayət etmirsə false qaytarır
export function spendMoney(amount) {
  if (amount > GameState.money) { return false; }
  GameState.money = roundMoney(GameState.money - amount);
  return true;
}
