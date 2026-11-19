import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameState, tozToplA, getBrushSize } from './state.js';

const GRID = CONFIG.GRID;
const CELL = CONFIG.CELL;
const SIZE = CONFIG.SURFACE_SIZE;
const HEIGHT = CONFIG.DUST_HEIGHT;
const CHUNK_CELLS = CONFIG.CHUNK_CELLS;
const CHUNKS = CONFIG.CHUNKS_PER_SIDE;

function wrapIndex(value) {
  return ((value % GRID) + GRID) % GRID;
}

function mod1(value) {
  return ((value % 1) + 1) % 1;
}

function placeTexture(texture, planeSize, centerX, centerZ) {
  texture.repeat.set(planeSize / SIZE, planeSize / SIZE);
  texture.offset.set(
    mod1((centerX - planeSize / 2) / SIZE),
    mod1(1 - (centerZ + planeSize / 2) / SIZE)
  );
}

function crossProduct(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

// Nöqtələri əhatə edən ən kiçik qabarıq çoxbucaqlı
function convexHull(points) {
  points.sort((p, q) => (p[0] - q[0]) || (p[1] - q[1]));

  const lower = [];
  for (const point of points) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper = [];
  for (let k = points.length - 1; k >= 0; k--) {
    const point = points[k];
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function createDustSystem(scene) {
  // Toz xəritəsi: ağ = toz var, təmizlənən yer şəffaf olur
  const canvas = document.createElement('canvas');
  canvas.width = GRID;
  canvas.height = GRID;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, GRID, GRID);

  // Parçaların sərhədini göstərən zəif xətlər
  ctx.fillStyle = '#d4d4d4';
  for (let k = 0; k < CHUNKS; k++) {
    const edge = k * CHUNK_CELLS;
    ctx.fillRect(edge - 1, 0, 2, GRID);
    ctx.fillRect(0, edge - 1, GRID, 2);
  }
  ctx.fillRect(GRID - 1, 0, 1, GRID);
  ctx.fillRect(0, GRID - 1, GRID, 1);

  const texTop = new THREE.CanvasTexture(canvas);
  texTop.colorSpace = THREE.SRGBColorSpace;
  texTop.wrapS = THREE.RepeatWrapping;
  texTop.wrapT = THREE.RepeatWrapping;
  const texWin = texTop.clone();

  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.FAR_SIZE, CONFIG.FAR_SIZE),
    new THREE.MeshStandardMaterial({ color: CONFIG.DUST_COLOR, map: texTop, alphaTest: 0.5, roughness: 1.0 })
  );
  top.rotation.x = -Math.PI / 2;
  top.frustumCulled = false;
  top.renderOrder = 0;
  scene.add(top);

  const walls = [];
  const wallCount = CONFIG.WALL_COLORS.length;
  for (let index = 0; index < wallCount; index++) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(CONFIG.LAYER_WINDOW, CONFIG.LAYER_WINDOW),
      new THREE.MeshBasicMaterial({ color: CONFIG.WALL_COLORS[index], map: texWin, alphaTest: 0.5 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.frustumCulled = false;
    mesh.renderOrder = index + 1;
    scene.add(mesh);
    walls.push({ mesh, height: (HEIGHT * (wallCount - index)) / (wallCount + 1) });
  }

  // Fırçanın təmizləyəcəyi yeri göstərən yaşıl kvadrat (ölçüsü alətə görə dəyişir)
  const marker = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0x66ffcc, transparent: true, opacity: 0.35, depthWrite: false })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  scene.add(marker);

  return {
    cleaned: new Uint8Array(GRID * GRID),
    cleanedCount: 0,
    version: 0,
    chunkCleaned: new Uint16Array(CHUNKS * CHUNKS), // hər parçada təmizlənən xana sayı
    chunkDone: new Uint8Array(CHUNKS * CHUNKS),     // 1 = parça tamamlanıb
    rewardPending: 0,                                // ekranda göstəriləcək pul
    ctx,
    texTop,
    texWin,
    top,
    walls,
    marker,
    lastHit: null,
    dirty: false,
    lastUpload: 0,
  };
}

export function updateDustWindow(dustSystem, playerPos, nowMs) {
  dustSystem.top.position.set(playerPos.x, HEIGHT, playerPos.z);
  placeTexture(dustSystem.texTop, CONFIG.FAR_SIZE, playerPos.x, playerPos.z);

  for (const wall of dustSystem.walls) {
    wall.mesh.position.set(playerPos.x, wall.height, playerPos.z);
  }
  placeTexture(dustSystem.texWin, CONFIG.LAYER_WINDOW, playerPos.x, playerPos.z);

  if (dustSystem.dirty && nowMs - dustSystem.lastUpload > 66) {
    dustSystem.texTop.needsUpdate = true;
    dustSystem.texWin.needsUpdate = true;
    dustSystem.dirty = false;
    dustSystem.lastUpload = nowMs;
  }
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
  dustSystem.chunkCleaned[chunkIndex] = CHUNK_CELLS * CHUNK_CELLS;

  dustSystem.ctx.clearRect(startI, startJ, CHUNK_CELLS, CHUNK_CELLS);
  dustSystem.dirty = true;
  dustSystem.version += 1;

  GameState.money += CONFIG.CHUNK_REWARD;
  dustSystem.rewardPending += CONFIG.CHUNK_REWARD;
}

// Bir xananı təmizlənmiş sayır, tozu çantaya əlavə edir, parçanı yoxlayır
function cleanCell(dustSystem, worldI, worldJ) {
  const i = wrapIndex(worldI);
  const j = wrapIndex(worldJ);
  const index = j * GRID + i;
  if (dustSystem.cleaned[index] === 1) { return; }
  if (GameState.bag >= GameState.bagCapacity) { return; }

  dustSystem.cleaned[index] = 1;
  dustSystem.cleanedCount += 1;
  dustSystem.version += 1;
  tozToplA(CONFIG.KG_PER_SQUARE_UNIT * CELL * CELL);

  const chunkX = Math.floor(i / CHUNK_CELLS);
  const chunkY = Math.floor(j / CHUNK_CELLS);
  const chunkIndex = chunkY * CHUNKS + chunkX;
  dustSystem.chunkCleaned[chunkIndex] += 1;
  const needed = CHUNK_CELLS * CHUNK_CELLS * CONFIG.CHUNK_DONE_RATIO;
  if (dustSystem.chunkDone[chunkIndex] === 0 && dustSystem.chunkCleaned[chunkIndex] >= needed) {
    completeChunk(dustSystem, chunkX, chunkY);
  }
}

function cleanSquare(dustSystem, x, z, size) {
  const half = size / 2;
  const minI = Math.floor((x - half) / CELL);
  const maxI = Math.floor((x + half) / CELL);
  const minJ = Math.floor((z - half) / CELL);
  const maxJ = Math.floor((z + half) / CELL);
  for (let j = minJ; j <= maxJ; j++) {
    for (let i = minI; i <= maxI; i++) {
      const centerX = (i + 0.5) * CELL;
      const centerZ = (j + 0.5) * CELL;
      if (Math.abs(centerX - x) <= half && Math.abs(centerZ - z) <= half) {
        cleanCell(dustSystem, i, j);
      }
    }
  }
}

function eraseSweep(dustSystem, ax, az, bx, bz, size) {
  const half = size / 2;
  const hull = convexHull([
    [ax - half, az - half], [ax + half, az - half], [ax + half, az + half], [ax - half, az + half],
    [bx - half, bz - half], [bx + half, bz - half], [bx + half, bz + half], [bx - half, bz + half],
  ]);

  const ctx = dustSystem.ctx;
  const toPixels = GRID / SIZE;
  const baseX = mod1(ax / SIZE) * GRID;
  const baseY = mod1(az / SIZE) * GRID;

  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000000';
  for (let shiftX = -1; shiftX <= 1; shiftX++) {
    for (let shiftY = -1; shiftY <= 1; shiftY++) {
      ctx.beginPath();
      for (let k = 0; k < hull.length; k++) {
        const pixelX = baseX + shiftX * GRID + (hull[k][0] - ax) * toPixels;
        const pixelY = baseY + shiftY * GRID + (hull[k][1] - az) * toPixels;
        if (k === 0) {
          ctx.moveTo(pixelX, pixelY);
        } else {
          ctx.lineTo(pixelX, pixelY);
        }
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  dustSystem.dirty = true;
}

// Hazırkı parçanın tamamlanma faizi (0-100)
export function getChunkProgress(dustSystem, x, z) {
  const i = wrapIndex(Math.floor(x / CELL));
  const j = wrapIndex(Math.floor(z / CELL));
  const chunkIndex = Math.floor(j / CHUNK_CELLS) * CHUNKS + Math.floor(i / CHUNK_CELLS);
  const share = dustSystem.chunkCleaned[chunkIndex] / (CHUNK_CELLS * CHUNK_CELLS);
  return Math.min(100, Math.floor((share / CONFIG.CHUNK_DONE_RATIO) * 100));
}

export function updateDustSystem(dustSystem, hitPoint, heading, isBrushing) {
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

  if (GameState.bag >= GameState.bagCapacity) {
    dustSystem.lastHit = { x: hitPoint.x, z: hitPoint.z };
    return;
  }

  let startX = hitPoint.x;
  let startZ = hitPoint.z;
  const from = dustSystem.lastHit;
  if (from !== null) {
    const distance = Math.hypot(hitPoint.x - from.x, hitPoint.z - from.z);
    if (distance < 3) {
      startX = from.x;
      startZ = from.z;
      const stepLength = size / 3;
      const steps = Math.ceil(distance / stepLength);
      for (let step = 1; step < steps; step++) {
        const t = step / steps;
        cleanSquare(dustSystem, from.x + (hitPoint.x - from.x) * t, from.z + (hitPoint.z - from.z) * t, size);
      }
    }
  }
  cleanSquare(dustSystem, hitPoint.x, hitPoint.z, size);
  eraseSweep(dustSystem, startX, startZ, hitPoint.x, hitPoint.z, size);
  dustSystem.lastHit = { x: hitPoint.x, z: hitPoint.z };
}
