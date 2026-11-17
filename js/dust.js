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
  
  const geo = new THREE.SphereGeometry(CONFIG.MOON_RADIUS + 0.1, 64, 64);
  const mat = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true
  });
  
  const dustMesh = new THREE.Mesh(geo, mat);
  // DÜZƏLİŞ: Ay mərkəzdə olduğu üçün toz da mərkəzdə olmalıdır
  dustMesh.position.set(0, 0, 0); 
  scene.add(dustMesh);

  return { canvas, ctx, texture, dustMesh };
}

export function updateDustSystem(dustSystem, uv, isBrushing, dt) {
  if (!isBrushing || GameState.bag >= GameState.bagCapacity) {
    return;
  }

  const { ctx, texture, canvas } = dustSystem;
  
  const canvasX = uv.x * canvas.width;
  const canvasY = (1 - uv.y) * canvas.height;

  const baseSize = CONFIG.BRUSH_SIZE;
  const v = 1 - uv.y;
  const sinTheta = Math.sin(v * Math.PI);
  const widthFactor = 1.0 / Math.max(sinTheta, 0.05); 
  
  const brushWidth = baseSize * widthFactor;
  const brushHeight = baseSize;

  const startX = Math.max(0, Math.min(canvas.width - brushWidth, Math.floor(canvasX - brushWidth / 2)));
  const startY = Math.max(0, Math.min(canvas.height - brushHeight, Math.floor(canvasY - brushHeight / 2)));

  const imageData = ctx.getImageData(startX, startY, Math.ceil(brushWidth), brushHeight);
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
  ctx.fillRect(startX, startY, brushWidth, brushHeight);
  
  texture.needsUpdate = true;
}
