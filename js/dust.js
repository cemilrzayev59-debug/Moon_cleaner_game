import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameState, tozToplA } from './state.js';

const GRID = CONFIG.GRID;
const CELL = CONFIG.CELL;
const HEIGHT = CONFIG.DUST_HEIGHT;
const WINDOW = CONFIG.WINDOW_CELLS;

// Dünya xanasının nömrəsini xəritə daxilindəki nömrəyə çevirir (0..GRID-1)
function wrapIndex(value) {
  return ((value % GRID) + GRID) % GRID;
}

function mod1(value) {
  return ((value % 1) + 1) % 1;
}

export function createDustSystem(scene) {
  // Toz təbəqəsinin şəkli: hər yer eyni rəngdədir, təmizlənən yer şəffaf olur
  const canvas = document.createElement('canvas');
  canvas.width = GRID;
  canvas.height = GRID;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#' + CONFIG.DUST_COLOR.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, GRID, GRID);

  // Uzaq təbəqə: yastı, ortasında oyunçunun ətrafı üçün boşluq var
  const texFar = new THREE.CanvasTexture(canvas);
  texFar.colorSpace = THREE.SRGBColorSpace;
  texFar.wrapS = THREE.RepeatWrapping;
  texFar.wrapT = THREE.RepeatWrapping;
  texFar.magFilter = THREE.NearestFilter;
  texFar.repeat.set(1 / CONFIG.SURFACE_SIZE, 1 / CONFIG.SURFACE_SIZE);

  const outer = CONFIG.FAR_SIZE / 2;
  const inner = (WINDOW * CELL) / 2 - 1;
  const shape = new THREE.Shape();
  shape.moveTo(-outer, -outer);
  shape.lineTo(outer, -outer);
  shape.lineTo(outer, outer);
  shape.lineTo(-outer, outer);
  shape.lineTo(-outer, -outer);
  const hole = new THREE.Path();
  hole.moveTo(-inner, -inner);
  hole.lineTo(-inner, inner);
  hole.lineTo(inner, inner);
  hole.lineTo(inner, -inner);
  hole.lineTo(-inner, -inner);
  shape.holes.push(hole);

  const far = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({
      map: texFar,
      alphaTest: 0.5,
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2,
    })
  );
  far.rotation.x = -Math.PI / 2;
  far.frustumCulled = false;
  scene.add(far);

  // Yaxın hissə: hər toz kvadratı həqiqi 3D qutudur
  const instanced = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: CONFIG.DUST_COLOR, roughness: 0.95 }),
    WINDOW * WINDOW
  );
  instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instanced.frustumCulled = false;
  scene.add(instanced);

  // Fırçanın təmizləyəcəyi yeri göstərən yaşıl kvadrat
  const markerSize = CONFIG.BRUSH_CELLS * CELL;
  const marker = new THREE.Mesh(
    new THREE.PlaneGeometry(markerSize, markerSize),
    new THREE.MeshBasicMaterial({ color: 0x66ffcc, transparent: true, opacity: 0.35, depthWrite: false })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  scene.add(marker);

  return {
    cleaned: new Uint8Array(GRID * GRID), // 1 = təmizlənib
    cleanedCount: 0,
    version: 0,
    ctx,
    texFar,
    far,
    instanced,
    marker,
    originI: null,
    originJ: null,
    lastHit: null,
    farDirty: false,
    lastFarUpload: 0,
  };
}

// Pəncərədəki (a, b) nömrəli qutunu xəritəyə uyğun yazır
function writeInstance(dustSystem, a, b) {
  const worldI = dustSystem.originI + a;
  const worldJ = dustSystem.originJ + b;
  const cellIndex = wrapIndex(worldJ) * GRID + wrapIndex(worldI);
  const hasDust = dustSystem.cleaned[cellIndex] === 0;

  const matrix = dustSystem.instanced.instanceMatrix.array;
  const m = (b * WINDOW + a) * 16;

  matrix.fill(0, m, m + 16);
  matrix[m] = CELL;
  matrix[m + 5] = HEIGHT;
  matrix[m + 10] = CELL;
  matrix[m + 15] = 1;
  matrix[m + 12] = (worldI + 0.5) * CELL;
  matrix[m + 13] = hasDust ? HEIGHT / 2 : -50; // təmizlənən qutu yerin altına gedir
  matrix[m + 14] = (worldJ + 0.5) * CELL;
}

// Hər kadrda: qutular və uzaq təbəqə oyunçunun ardınca gedir
export function updateDustWindow(dustSystem, playerPos, nowMs) {
  dustSystem.far.position.set(playerPos.x, HEIGHT, playerPos.z);
  dustSystem.texFar.offset.set(
    mod1(playerPos.x / CONFIG.SURFACE_SIZE),
    mod1(1 - playerPos.z / CONFIG.SURFACE_SIZE)
  );

  const originI = Math.floor(playerPos.x / CELL) - WINDOW / 2;
  const originJ = Math.floor(playerPos.z / CELL) - WINDOW / 2;
  if (originI !== dustSystem.originI || originJ !== dustSystem.originJ) {
    dustSystem.originI = originI;
    dustSystem.originJ = originJ;
    for (let b = 0; b < WINDOW; b++) {
      for (let a = 0; a < WINDOW; a++) {
        writeInstance(dustSystem, a, b);
      }
    }
    dustSystem.instanced.instanceMatrix.needsUpdate = true;
  }

  // Uzaq təbəqənin şəklini çox tez-tez yükləməmək üçün
  if (dustSystem.farDirty && nowMs - dustSystem.lastFarUpload > 150) {
    dustSystem.texFar.needsUpdate = true;
    dustSystem.farDirty = false;
    dustSystem.lastFarUpload = nowMs;
  }
}

// Bir toz kvadratını təmizləyir və tozu çantaya əlavə edir
function cleanCell(dustSystem, worldI, worldJ) {
  const i = wrapIndex(worldI);
  const j = wrapIndex(worldJ);
  const index = j * GRID + i;
  if (dustSystem.cleaned[index] === 1) { return; }
  if (GameState.bag >= GameState.bagCapacity) { return; }

  dustSystem.cleaned[index] = 1;
  dustSystem.cleanedCount += 1;
  dustSystem.version += 1;
  tozToplA(CONFIG.CELL_YIELD);

  dustSystem.ctx.clearRect(i, j, 1, 1);
  dustSystem.farDirty = true;

  const a = worldI - dustSystem.originI;
  const b = worldJ - dustSystem.originJ;
  if (a >= 0 && a < WINDOW && b >= 0 && b < WINDOW) {
    writeInstance(dustSystem, a, b);
    dustSystem.instanced.instanceMatrix.needsUpdate = true;
  }
}

// Fırçanın ağzı boyda düzbucaqlı sahəni təmizləyir
function cleanFootprint(dustSystem, x, z) {
  const centerI = Math.floor(x / CELL);
  const centerJ = Math.floor(z / CELL);
  const start = Math.floor(CONFIG.BRUSH_CELLS / 2);
  for (let dj = 0; dj < CONFIG.BRUSH_CELLS; dj++) {
    for (let di = 0; di < CONFIG.BRUSH_CELLS; di++) {
      cleanCell(dustSystem, centerI - start + di, centerJ - start + dj);
    }
  }
}

// hitPoint: fırçanın yerə dəydiyi dünya nöqtəsi (çatmırsa null)
export function updateDustSystem(dustSystem, hitPoint, isBrushing) {
  dustSystem.marker.visible = hitPoint !== null;
  if (hitPoint === null) {
    dustSystem.lastHit = null;
    return;
  }

  const start = Math.floor(CONFIG.BRUSH_CELLS / 2);
  const centerI = Math.floor(hitPoint.x / CELL);
  const centerJ = Math.floor(hitPoint.z / CELL);
  dustSystem.marker.position.set(
    (centerI - start + CONFIG.BRUSH_CELLS / 2) * CELL,
    HEIGHT + 0.02,
    (centerJ - start + CONFIG.BRUSH_CELLS / 2) * CELL
  );

  if (!isBrushing) {
    dustSystem.lastHit = null;
    return;
  }

  // Sürətlə hərəkət edəndə boşluq qalmasın deyə aradakı yerləri də təmizləyirik
  const from = dustSystem.lastHit;
  if (from !== null) {
    const distance = Math.hypot(hitPoint.x - from.x, hitPoint.z - from.z);
    if (distance < 3) {
      const steps = Math.ceil(distance / CELL);
      for (let step = 1; step < steps; step++) {
        const t = step / steps;
        cleanFootprint(dustSystem, from.x + (hitPoint.x - from.x) * t, from.z + (hitPoint.z - from.z) * t);
      }
    }
  }
  cleanFootprint(dustSystem, hitPoint.x, hitPoint.z);
  dustSystem.lastHit = { x: hitPoint.x, z: hitPoint.z };
}
