import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameState, tozToplA } from './state.js';

export function createDustSystem(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = CONFIG.CANVAS_SIZE;
  canvas.height = CONFIG.CANVAS_SIZE;
  // willReadFrequently əlavə edildi (performans üçün)
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = '#2a2a2a'; 
  ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

  const texture = new THREE.CanvasTexture(canvas);
  
  const geo = new THREE.SphereGeometry(CONFIG.MOON_RADIUS + 0.1, 64, 64);
  // MeshBasicMaterial edildi ki, işıq ona təsir etməsin
  const mat = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true
  });
  
  const dustMesh = new THREE.Mesh(geo, mat);
  dustMesh.position.y = -CONFIG.MOON_RADIUS;
  scene.add(dustMesh);

  // dustMesh-i qaytarırıq ki, Raycaster onu tapa bilsin
  return { canvas, ctx, texture, dustMesh };
}

// YENİLƏNDİ: Artıq riyaziyyat yoxdur, birbaşa UV koordinatı gəlir
export function updateDustSystem(dustSystem, uv, isBrushing, dt) {
  if (!isBrushing) {
    return;
  }

  if (GameState.bag >= GameState.bagCapacity) {
    return;
  }

  const { ctx, texture, canvas } = dustSystem;
  
  // UV (0-1) koordinatlarını Kətan (0-2048) koordinatlarına çeviririk
  const canvasX = uv.x * canvas.width;
  const canvasY = (1 - uv.y) * canvas.height; // Y oxu tərsdir

  const size = CONFIG.BRUSH_SIZE;
  
  // Sərhədləri qoruyuruq
  const startX = Math.max(0, Math.min(canvas.width - size, Math.floor(canvasX - size/2)));
  const startY = Math.max(0, Math.min(canvas.height - size, Math.floor(canvasY - size/2)));

  const imageData = ctx.getImageData(startX, startY, size, size);
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
  ctx.fillRect(startX, startY, size, size);
  
  texture.needsUpdate = true;
}
