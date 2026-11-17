import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameState, tozToplA } from './state.js';

export function createDustSystem(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = CONFIG.CANVAS_SIZE;
  canvas.height = CONFIG.CANVAS_SIZE;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#2a2a2a'; 
  ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

  const texture = new THREE.CanvasTexture(canvas);
  
  // Toz kürəsi (Ay səthindən bir az böyük)
  const geo = new THREE.SphereGeometry(CONFIG.MOON_RADIUS + 0.1, 64, 64);
  const mat = new THREE.MeshStandardMaterial({ 
    map: texture, transparent: true, roughness: 0.9
  });
  
  const dustMesh = new THREE.Mesh(geo, mat);
  dustMesh.position.y = -CONFIG.MOON_RADIUS;
  scene.add(dustMesh);

  return { canvas, ctx, texture };
}

export function updateDustSystem(dustSystem, brushPos, isBrushing, dt) {
  if (!isBrushing) {
    return;
  }

  // YENİ: Əgər çanta doludursa, təmizləməni dayandır
  if (GameState.bag >= GameState.bagCapacity) {
    return;
  }

  const { ctx, texture, canvas } = dustSystem;
  
  // Fırça koordinatını kürənin mərkəzinə görə normallaşdırırıq
  const vec = new THREE.Vector3().copy(brushPos);
  vec.y += CONFIG.MOON_RADIUS; // Kürənin mərkəzinə görə düzəliş
  vec.normalize();
  
  // Kürənin səthindəki nöqtə
  const px = vec.x * CONFIG.MOON_RADIUS;
  const py = vec.y * CONFIG.MOON_RADIUS;
  const pz = vec.z * CONFIG.MOON_RADIUS;

  // UV koordinatlarına çeviririk
  const u = 0.5 + (Math.atan2(pz, px) / (2 * Math.PI));
  const v = 0.5 - (Math.asin(py / CONFIG.MOON_RADIUS) / Math.PI);

  const canvasX = u * canvas.width;
  const canvasY = v * canvas.height;

  const size = CONFIG.BRUSH_SIZE;

  const imageData = ctx.getImageData(canvasX - size/2, canvasY - size/2, size, size);
  let silinenTozSayi = 0;

  for (let i = 3; i < imageData.data.length; i += 4) {
    if (imageData.data[i] > 0) {
      silinenTozSayi++;
    }
  }

  if (silinenTozSayi > 0) {
    tozToplA(silinenTozSayi * CONFIG.DUST_YIELD);
  }

  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(canvasX - size / 2, canvasY - size / 2, size, size);
  
  texture.needsUpdate = true;
}
