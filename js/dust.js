import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameState, tozToplA } from './state.js';

// 0-1 aralığına salır (mənfi ədədlər üçün də)
function mod1(value) {
  return ((value % 1) + 1) % 1;
}

export function createDustSystem(scene) {
  const size = CONFIG.CANVAS_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Toz xəritəsi: boz toz, təmizlənən yer şəffaf olur
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 30000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#7c7c7c' : '#989898';
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 6 + Math.random() * 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyni şəkil iki teksturada: yaxın (3D) və uzaq (yastı) üçün
  const texNear = new THREE.CanvasTexture(canvas);
  texNear.wrapS = THREE.RepeatWrapping;
  texNear.wrapT = THREE.RepeatWrapping;
  const texFar = texNear.clone();
  texFar.wrapS = THREE.RepeatWrapping;
  texFar.wrapT = THREE.RepeatWrapping;

  // Yaxın hissə: toz qalınlığı displacementMap ilə həqiqətən qabarıq olur
  const near = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.WINDOW_SIZE, CONFIG.WINDOW_SIZE, CONFIG.WINDOW_SEGMENTS, CONFIG.WINDOW_SEGMENTS),
    new THREE.MeshStandardMaterial({
      map: texNear,
      bumpMap: texNear,
      bumpScale: 1,
      displacementMap: texNear,
      displacementScale: CONFIG.DUST_HEIGHT / 0.54,
      alphaTest: 0.5,
      roughness: 0.95,
    })
  );
  near.rotation.x = -Math.PI / 2;
  near.frustumCulled = false;
  scene.add(near);

  // Uzaq hissə: yastı, yalnız rəng görünür
  const far = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.FAR_SIZE, CONFIG.FAR_SIZE),
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

  return { canvas, ctx, texNear, texFar, near, far };
}

// Hər kadrda: toz sahəsi oyunçunun ardınca gedir, xəritə isə dünyaya sabit qalır
export function updateDustWindow(dustSystem, playerPos) {
  const S = CONFIG.SURFACE_SIZE;
  const W = CONFIG.WINDOW_SIZE;
  const F = CONFIG.FAR_SIZE;
  const step = W / CONFIG.WINDOW_SEGMENTS;

  // Təpə nöqtələri titrəməsin deyə şəbəkə addımına yuvarlaqlaşdırırıq
  const centerX = Math.round(playerPos.x / step) * step;
  const centerZ = Math.round(playerPos.z / step) * step;
  dustSystem.near.position.set(centerX, 0, centerZ);
  dustSystem.texNear.repeat.set(W / S, W / S);
  dustSystem.texNear.offset.set(mod1((centerX - W / 2) / S), mod1(1 - (centerZ + W / 2) / S));

  dustSystem.far.position.set(playerPos.x, CONFIG.DUST_HEIGHT - 0.01, playerPos.z);
  dustSystem.texFar.repeat.set(F / S, F / S);
  dustSystem.texFar.offset.set(mod1((playerPos.x - F / 2) / S), mod1(1 - (playerPos.z + F / 2) / S));
}

// hitPoint: fırçanın yerə dəydiyi dünya nöqtəsi (və ya null)
export function updateDustSystem(dustSystem, hitPoint, isBrushing, dt) {
  if (!isBrushing || !hitPoint || GameState.bag >= GameState.bagCapacity) {
    return;
  }

  const { ctx, canvas, texNear, texFar } = dustSystem;
  const S = CONFIG.SURFACE_SIZE;
  const canvasX = mod1(hitPoint.x / S) * canvas.width;
  const canvasY = mod1(hitPoint.z / S) * canvas.height;

  // Mərkəz pikselində toz varsa, çantaya toz əlavə olunur
  const pixel = ctx.getImageData(Math.floor(canvasX), Math.floor(canvasY), 1, 1).data;
  if (pixel[3] > 0) {
    tozToplA(CONFIG.DUST_YIELD * dt * 60);
  }

  // Dairəvi silmə; kənarlarda xəritə təkrarlandığı üçün 9 yerdə silirik
  const radius = (CONFIG.BRUSH_RADIUS / S) * canvas.width;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'black';
  for (let shiftX = -1; shiftX <= 1; shiftX++) {
    for (let shiftY = -1; shiftY <= 1; shiftY++) {
      ctx.beginPath();
      ctx.arc(canvasX + shiftX * canvas.width, canvasY + shiftY * canvas.height, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = 'source-over';

  texNear.needsUpdate = true;
  texFar.needsUpdate = true;
}
