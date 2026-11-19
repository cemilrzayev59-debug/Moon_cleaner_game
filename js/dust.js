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

  // Fırçanın təmizləyəcəyi yeri göstərən yaşıl düzbucaqlı
  const marker = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.BRUSH_DEPTH, CONFIG.BRUSH_WIDTH),
    new THREE.MeshBasicMaterial({ color: 0x66ffcc, transparent: true, opacity: 0.35, depthWrite: false })
  );
  marker.rotation.order = 'YXZ';
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

// Fırçanın ağzı boyda düzbucaqlını (x, z) nöqtəsində silir; angle = baxış istiqaməti
function stamp(dustSystem, x, z, angle) {
  if (GameState.bag >= GameState.bagCapacity) { return; }

  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  const halfDepth = CONFIG.BRUSH_DEPTH / 2;
  const halfWidth = CONFIG.BRUSH_WIDTH / 2;

  // 1) Hesab: düzbucaqlının içindəki xanalar
  const reach = Math.hypot(halfDepth, halfWidth);
  const minI = Math.floor((x - reach) / CELL);
  const maxI = Math.floor((x + reach) / CELL);
  const minJ = Math.floor((z - reach) / CELL);
  const maxJ = Math.floor((z + reach) / CELL);
  for (let j = minJ; j <= maxJ; j++) {
    for (let i = minI; i <= maxI; i++) {
      const offsetX = (i + 0.5) * CELL - x;
      const offsetZ = (j + 0.5) * CELL - z;
      const along = offsetX * cosAngle + offsetZ * sinAngle;
      const across = -offsetX * sinAngle + offsetZ * cosAngle;
      if (Math.abs(along) <= halfDepth && Math.abs(across) <= halfWidth) {
        cleanCell(dustSystem, i, j);
      }
    }
  }

  // 2) Şəkil: hamar kənarlı düzbucaqlı silmə (xəritə təkrarlandığı üçün 9 yerdə)
  const ctx = dustSystem.ctx;
  const toPixels = GRID / SIZE;
  const pixelX = mod1(x / SIZE) * GRID;
  const pixelY = mod1(z / SIZE) * GRID;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000000';
  for (let shiftX = -1; shiftX <= 1; shiftX++) {
    for (let shiftY = -1; shiftY <= 1; shiftY++) {
      ctx.save();
      ctx.translate(pixelX + shiftX * GRID, pixelY + shiftY * GRID);
      ctx.rotate(angle);
      ctx.fillRect(
        -halfDepth * toPixels,
        -halfWidth * toPixels,
        CONFIG.BRUSH_DEPTH * toPixels,
        CONFIG.BRUSH_WIDTH * toPixels
      );
      ctx.restore();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  dustSystem.dirty = true;
}

// hitPoint: fırçanın yerə dəydiyi nöqtə (çatmırsa null); heading: baxış istiqaməti
export function updateDustSystem(dustSystem, hitPoint, heading, isBrushing) {
  dustSystem.marker.visible = hitPoint !== null;
  if (hitPoint === null) {
    dustSystem.lastHit = null;
    return;
  }

  dustSystem.marker.position.set(hitPoint.x, HEIGHT + 0.01, hitPoint.z);
  dustSystem.marker.rotation.y = Math.atan2(-heading.z, heading.x);

  if (!isBrushing) {
    dustSystem.lastHit = null;
    return;
  }

  const angle = Math.atan2(heading.z, heading.x);

  // Sürətlə hərəkət edəndə boşluq qalmasın deyə aradakı yerləri də silirik
  const from = dustSystem.lastHit;
  if (from !== null) {
    const distance = Math.hypot(hitPoint.x - from.x, hitPoint.z - from.z);
    if (distance < 3) {
      const stepLength = CONFIG.BRUSH_DEPTH / 3;
      const steps = Math.ceil(distance / stepLength);
      for (let step = 1; step < steps; step++) {
        const t = step / steps;
        stamp(dustSystem, from.x + (hitPoint.x - from.x) * t, from.z + (hitPoint.z - from.z) * t, angle);
      }
    }
  }
  stamp(dustSystem, hitPoint.x, hitPoint.z, angle);
  dustSystem.lastHit = { x: hitPoint.x, z: hitPoint.z };
}
