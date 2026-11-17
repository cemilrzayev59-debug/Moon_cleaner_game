import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameState, tozToplA } from './state.js';

export function createDustSystem(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = CONFIG.CANVAS_SIZE;
  canvas.height = CONFIG.CANVAS_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = '#2a2a2a'; 
  ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

  const texture = new THREE.CanvasTexture(canvas);
  
  // TEXTURE-Nİ TƏKRARLANAN EDİRİK (Sonsuz Kürə effekti üçün)
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // 2000x2000 sahədə 1024-lük kətanı 10 dəfə təkrarlayırıq
  texture.repeat.set(CONFIG.PLANE_SIZE / CONFIG.SURFACE_SIZE, CONFIG.PLANE_SIZE / CONFIG.SURFACE_SIZE);
  
  const geo = new THREE.PlaneGeometry(CONFIG.PLANE_SIZE, CONFIG.PLANE_SIZE);
  const mat = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true
  });
  
  const dustMesh = new THREE.Mesh(geo, mat);
  dustMesh.rotation.x = -Math.PI / 2;
  dustMesh.position.y = 0.05; 
  scene.add(dustMesh);

  return { canvas, ctx, texture, dustMesh };
}

export function updateDustSystem(dustSystem, uv, isBrushing, dt) {
  if (!isBrushing || GameState.bag >= GameState.bagCapacity) {
    return;
  }

  const { ctx, texture, canvas } = dustSystem;
  
  // UV koordinatlarını (0-1) kətanın lokal ölçüsünə çeviririk (0-1024)
  // Çünki şəkil 10 dəfə təkrarlanır, 1 vahid = 1/10
  const repeatFactor = CONFIG.PLANE_SIZE / CONFIG.SURFACE_SIZE; // 10
  const localU = (uv.x * repeatFactor) % 1.0;
  const localV = ((1 - uv.y) * repeatFactor) % 1.0;

  const canvasX = localU * canvas.width;
  const canvasY = localV * canvas.height;

  const size = CONFIG.BRUSH_SIZE;

  const startX = Math.max(0, Math.min(canvas.width - size, Math.floor(canvasX - size / 2)));
  const startY = Math.max(0, Math.min(canvas.height - size, Math.floor(canvasY - size / 2)));

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
  ctx.fillStyle = 'black';

  // Kənarlarda kəsilməməsi üçün 3 yerdə (mərkəz, sol, sağ) silirik
  const drawSquare = (x, y) => {
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  };

  drawSquare(canvasX, canvasY);
  drawSquare(canvasX - canvas.width, canvasY);
  drawSquare(canvasX + canvas.width, canvasY);
  drawSquare(canvasX, canvasY - canvas.height);
  drawSquare(canvasX, canvasY + canvas.height);
  
  texture.needsUpdate = true;
}
