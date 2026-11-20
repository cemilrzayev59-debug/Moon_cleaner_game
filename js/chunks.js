import { CONFIG } from './config.js';
import { earnMoney } from './state.js';

const GRID = CONFIG.GRID;
const CELL = CONFIG.CELL;
const CHUNK_CELLS = CONFIG.CHUNK_CELLS;
const CHUNKS = CONFIG.CHUNKS_PER_SIDE;
const CHUNK_AREA = CHUNK_CELLS * CHUNK_CELLS;
const NEEDED_CELLS = CHUNK_AREA * CONFIG.CHUNK_DONE_RATIO; // parçanın "bitdi" sayılması üçün lazım olan xana sayı

// Dünya təkrarlandığı üçün xana nömrəsini 0..GRID-1 aralığına gətirir
export function wrapIndex(value) {
  return ((value % GRID) + GRID) % GRID;
}

// (i, j) xanasının hansı parçaya aid olduğunu verir
function chunkIndexOf(i, j) {
  return Math.floor(j / CHUNK_CELLS) * CHUNKS + Math.floor(i / CHUNK_CELLS);
}

// Bazanın altında və ətrafında toz olmasın: həmin yeri əvvəlcədən təmiz sayır (pul vermir)
export function clearBaseFootprint(dustSystem) {
  const halfWidth = CONFIG.BASE_WIDTH / 2 + CONFIG.BASE_CLEAR_MARGIN;
  const halfDepth = CONFIG.BASE_DEPTH / 2 + CONFIG.BASE_CLEAR_MARGIN;
  const minI = Math.max(0, Math.floor((CONFIG.BASE_X - halfWidth) / CELL));
  const maxI = Math.min(GRID - 1, Math.floor((CONFIG.BASE_X + halfWidth) / CELL));
  const minJ = Math.max(0, Math.floor((CONFIG.BASE_Z - halfDepth) / CELL));
  const maxJ = Math.min(GRID - 1, Math.floor((CONFIG.BASE_Z + halfDepth) / CELL));

  for (let j = minJ; j <= maxJ; j++) {
    for (let i = minI; i <= maxI; i++) {
      const index = j * GRID + i;
      if (dustSystem.cleaned[index] === 0) {
        dustSystem.cleaned[index] = 1;
        dustSystem.cleanedCount += 1;
        dustSystem.chunkCleaned[chunkIndexOf(i, j)] += 1;
      }
    }
  }
  dustSystem.ctx.clearRect(minI, minJ, maxI - minI + 1, maxJ - minJ + 1);

  // Tam bazanın altında qalan parçalar mükafatsız "bitmiş" sayılır
  for (let chunkIndex = 0; chunkIndex < dustSystem.chunkCleaned.length; chunkIndex++) {
    if (dustSystem.chunkCleaned[chunkIndex] >= NEEDED_CELLS) {
      dustSystem.chunkDone[chunkIndex] = 1;
    }
  }
  dustSystem.dirty = true;
  dustSystem.version += 1;
}

// Parçanı tamamlayır: qalan tozu silir və pul verir
function completeChunk(dustSystem, chunkX, chunkY) {
  const chunkIndex = chunkY * CHUNKS + chunkX;
  dustSystem.chunkDone[chunkIndex] = 1;

  const startI = chunkX * CHUNK_CELLS;
  const startJ = chunkY * CHUNK_CELLS;
  for (let j = startJ; j < startJ + CHUNK_CELLS; j++) {
    for (let i = startI; i < startI + CHUNK_CELLS; i++) {
      const index = j * GRID + i;
      if (dustSystem.cleaned[index] === 0) {
        dustSystem.cleaned[index] = 1;
        dustSystem.cleanedCount += 1;
      }
    }
  }
  dustSystem.chunkCleaned[chunkIndex] = CHUNK_AREA;

  dustSystem.ctx.clearRect(startI, startJ, CHUNK_CELLS, CHUNK_CELLS);
  dustSystem.dirty = true;
  dustSystem.version += 1;

  earnMoney(CONFIG.CHUNK_REWARD);
  dustSystem.rewardPending += CONFIG.CHUNK_REWARD;
}

// Təmizlənmiş xananı parçaya yazır, parça bitibsə mükafat verir
export function addCleanedCell(dustSystem, i, j) {
  const chunkIndex = chunkIndexOf(i, j);
  dustSystem.chunkCleaned[chunkIndex] += 1;
  if (dustSystem.chunkDone[chunkIndex] === 0 && dustSystem.chunkCleaned[chunkIndex] >= NEEDED_CELLS) {
    completeChunk(dustSystem, Math.floor(i / CHUNK_CELLS), Math.floor(j / CHUNK_CELLS));
  }
}

// Hazırkı parçanın tamamlanma faizi (0-100)edededede
export function getChunkProgress(dustSystem, x, z) {
  const i = wrapIndex(Math.floor(x / CELL));
  const j = wrapIndex(Math.floor(z / CELL));
  const share = dustSystem.chunkCleaned[chunkIndexOf(i, j)] / CHUNK_AREA;
  return Math.min(100, Math.floor((share / CONFIG.CHUNK_DONE_RATIO) * 100));
}
