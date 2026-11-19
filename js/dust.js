import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameState, tozToplA } from './state.js';

const GRID = CONFIG.GRID;
const CELL = CONFIG.CELL;
const SIZE = CONFIG.SURFACE_SIZE;
const HEIGHT = CONFIG.DUST_HEIGHT;

// Dünya xanasının nömrəsini xəritə daxilindəki nömrəyə çevirir (0..GRID-1)
function wrapIndex(value) {
  return ((value % GRID) + GRID) % GRID;
}

function mod1(value) {
  return ((value % 1) + 1) % 1;
}

// Şəkil dünyaya sabit qalsın, lövhə isə oyunçunun ardınca getsin deyə
function placeTexture(texture, planeSize, centerX, centerZ) {
  texture.repeat.set(planeSize / SIZE, planeSize / SIZE);
  texture.offset.set(
    mod1((centerX - planeSize / 2) / SIZE),
    mod1(1 - (centerZ + planeSize / 2) / SIZE)
  );
}

// Üç nöqtənin dönmə istiqaməti (çoxbucaqlı qurmaq üçün)
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

  // Eyni şəkil iki teksturada (böyük lövhə və yaxın divar lövhələri üçün)
  const texTop = new THREE.CanvasTexture(canvas);
  texTop.colorSpace = THREE.SRGBColorSpace;
  texTop.wrapS = THREE.RepeatWrapping;
  texTop.wrapT = THREE.RepeatWrapping;
  const texWin = texTop.clone();

  // Üst təbəqə: tozun üzü
  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.FAR_SIZE, CONFIG.FAR_SIZE),
    new THREE.MeshStandardMaterial({ color: CONFIG.DUST_COLOR, map: texTop, alphaTest: 0.5, roughness: 1.0 })
  );
  top.rotation.x = -Math.PI / 2;
  top.frustumCulled = false;
  top.renderOrder = 0;
  scene.add(top);

  // Aşağıdakı tünd lövhələr: tozun kənarında yan divar kimi görünür
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

  // Fırçanın təmizləyəcəyi yeri göstərən yaşıl kvadrat
  const marker = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.BRUSH_SIZE, CONFIG.BRUSH_SIZE),
    new THREE.MeshBasicMaterial({ color: 0x66ffcc, transparent: true, opacity: 0.35, depthWrite: false })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  scene.add(marker);

  return {
    cleaned: new Uint8Array(GRID * GRID), // 1 = təmizlənib (faiz və xəritə üçün)
    cleanedCount: 0,
    version: 0,
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

// Hər kadrda: lövhələr oyunçunun ardınca gedir, şəkil isə vaxtaşırı yenilənir
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

// Bir xananı təmizlənmiş sayır və tozu çantaya əlavə edir
function cleanCell(dustSystem, worldI, worldJ) {
  const index = wrapIndex(worldJ) * GRID + wrapIndex(worldI);
  if (dustSystem.cleaned[index] === 1) { return; }
  if (GameState.bag >= GameState.bagCapacity) { return; }

  dustSystem.cleaned[index] = 1;
  dustSystem.cleanedCount += 1;
  dustSystem.version += 1;
  tozToplA(CONFIG.KG_PER_SQUARE_UNIT * CELL * CELL);
}

// Hesab: (x, z) mərkəzli düz kvadratın içindəki xanalar təmizlənir
function cleanSquare(dustSystem, x, z) {
  const half = CONFIG.BRUSH_SIZE / 2;
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

// Şəkil: fırçanın A nöqtəsindən B nöqtəsinə süpürdüyü bütün sahəni bir çoxbucaqlı kimi silir
function eraseSweep(dustSystem, ax, az, bx, bz) {
  const half = CONFIG.BRUSH_SIZE / 2;
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
  // Xəritə təkrarlandığı üçün kənarlarda 9 yerdə silirik
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

// hitPoint: fırçanın yerə dəydiyi nöqtə (çatmırsa null); heading artıq lazım deyil
export function updateDustSystem(dustSystem, hitPoint, heading, isBrushing) {
  dustSystem.marker.visible = hitPoint !== null;
  if (hitPoint === null) {
    dustSystem.lastHit = null;
    return;
  }

  dustSystem.marker.position.set(hitPoint.x, HEIGHT + 0.01, hitPoint.z);

  if (!isBrushing) {
    dustSystem.lastHit = null;
    return;
  }

  // Çanta doludursa təmizləmə dayanır
  if (GameState.bag >= GameState.bagCapacity) {
    dustSystem.lastHit = { x: hitPoint.x, z: hitPoint.z };
    return;
  }

  // Əvvəlki nöqtə yaxındırsa, iki nöqtənin arasını da silirik (boşluq qalmasın)
  let startX = hitPoint.x;
  let startZ = hitPoint.z;
  const from = dustSystem.lastHit;
  if (from !== null) {
    const distance = Math.hypot(hitPoint.x - from.x, hitPoint.z - from.z);
    if (distance < 3) {
      startX = from.x;
      startZ = from.z;
      const stepLength = CONFIG.BRUSH_SIZE / 3;
      const steps = Math.ceil(distance / stepLength);
      for (let step = 1; step < steps; step++) {
        const t = step / steps;
        cleanSquare(dustSystem, from.x + (hitPoint.x - from.x) * t, from.z + (hitPoint.z - from.z) * t);
      }
    }
  }
  cleanSquare(dustSystem, hitPoint.x, hitPoint.z);
  eraseSweep(dustSystem, startX, startZ, hitPoint.x, hitPoint.z);
  dustSystem.lastHit = { x: hitPoint.x, z: hitPoint.z };
}
