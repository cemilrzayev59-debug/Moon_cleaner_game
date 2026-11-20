import { CONFIG } from './config.js';
import { collectDust, isBagFull } from './state.js';
import { getBrushSize } from './upgrades.js';
import { wrapIndex, addCleanedCell } from './chunks.js';
import { eraseSweep } from './sweep.js';

const GRID = CONFIG.GRID;
const CELL = CONFIG.CELL;
const HEIGHT = CONFIG.DUST_HEIGHT;
const KG_PER_CELL = CONFIG.KG_PER_SQUARE_UNIT * CELL * CELL;

// Bir xananı təmizlənmiş sayır və parçanı yoxlayır.swswswsedf
// Xana yeni təmizlənibsə true, əvvəldən təmiz idisə false qaytarır.
// Tozu çantaya yazmaq bu funksiyanın işi deyil (çünki robot çantadan istifadə etmir).
function cleanCell(dustSystem, worldI, worldJ) {
  const i = wrapIndex(worldI);
  const j = wrapIndex(worldJ);
  const index = j * GRID + i;
  if (dustSystem.cleaned[index] === 1) { return false; }

  dustSystem.cleaned[index] = 1;
  dustSystem.cleanedCount += 1;
  dustSystem.version += 1;
  addCleanedCell(dustSystem, i, j);
  return true;
}

// (x, z) nöqtəsi ətrafında size ölçülü kvadratı təmizləyir.
// Neçə yeni xana təmizləndiyini qaytarır (oyunçu və robot bunu istifadə edir).
export function cleanSquare(dustSystem, x, z, size) {
  const half = size / 2;
  const minI = Math.floor((x - half) / CELL);
  const maxI = Math.floor((x + half) / CELL);
  const minJ = Math.floor((z - half) / CELL);
  const maxJ = Math.floor((z + half) / CELL);
  let newCells = 0;
  for (let j = minJ; j <= maxJ; j++) {
    for (let i = minI; i <= maxI; i++) {
      const centerX = (i + 0.5) * CELL;
      const centerZ = (j + 0.5) * CELL;
      if (Math.abs(centerX - x) <= half && Math.abs(centerZ - z) <= half) {
        if (cleanCell(dustSystem, i, j)) {
          newCells += 1;
        }
      }
    }
  }
  return newCells;
}

// Hər kadrda: marker göstərilir, düymə basılıbsa fırça əvvəlki yerdən indiki yerə süpürür
export function updateDustSystem(dustSystem, hitPoint, isBrushing) {
  dustSystem.marker.visible = hitPoint !== null;
  if (hitPoint === null) {
    dustSystem.lastHit = null;
    return;
  }

  const size = getBrushSize();
  dustSystem.marker.scale.set(size, size, 1);
  dustSystem.marker.position.set(hitPoint.x, HEIGHT + 0.01, hitPoint.z);

  if (!isBrushing) {
    dustSystem.lastHit = null;
    return;
  }

  const from = dustSystem.lastHit;
  dustSystem.lastHit = { x: hitPoint.x, z: hitPoint.z };
  if (isBagFull()) { return; }

  // Başlanğıc nöqtə: əvvəlki kadrdakı yer (yaxındırsa), yoxsa elə indiki yer
  let startX = hitPoint.x;
  let startZ = hitPoint.z;
  let steps = 1;
  if (from !== null) {
    const distance = Math.hypot(hitPoint.x - from.x, hitPoint.z - from.z);
    if (distance < 3) {
      startX = from.x;
      startZ = from.z;
      steps = Math.max(1, Math.ceil(distance / (size / 3)));
    }
  }

  // Zolağı addım-addım təmizləyirik; çanta dolan kimi dayanırıq
  let endX = startX;
  let endZ = startZ;
  let cleanedAny = false;
  for (let step = 1; step <= steps; step++) {
    if (isBagFull()) { break; }
    const t = step / steps;
    endX = startX + (hitPoint.x - startX) * t;
    endZ = startZ + (hitPoint.z - startZ) * t;
    const newCells = cleanSquare(dustSystem, endX, endZ, size);
    if (newCells > 0) {
      collectDust(newCells * KG_PER_CELL);
      cleanedAny = true;
    }
  }

  // Görüntüdən yalnız həqiqətən təmizlənən zolağı silirik
  if (cleanedAny) {
    eraseSweep(dustSystem, startX, startZ, endX, endZ, size);
  }
}
