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
  dustMesh.position.y = -CONFIG.MOON_RADIUS;
  scene.add(dustMesh);

  return { canvas, ctx, texture, dustMesh };
}

export function updateDustSystem(dustSystem, uv, isBrushing, dt) {
  if (!isBrushing) {
    return;
  }

  if (GameState.bag >= GameState.bagCapacity) {
    return;
  }

  const { ctx, texture, canvas } = dustSystem;
  
  const canvasX = uv.x * canvas.width;
  const canvasY = (1 - uv.y) * canvas.height;

  const size = CONFIG.BRUSH_SIZE;

  // DÜZƏLİŞ: Kürənin qütblərində UV dartılmasının qarşısını alırıq
  // uv.y 0 və ya 1-ə yaxınlaşdıqca (qütblərə yaxın) fırçanın enini kiçildirik
  const poleFactor = Math.sin(uv.y * Math.PI); 
  const dynamicWidth = Math.max(size * 0.3, size * poleFactor);
  const dynamicHeight = size;
  
  const startX = Math.max(0, Math.min(canvas.width - dynamicWidth, Math.floor(canvasX - dynamicWidth/2)));
  const startY = Math.max(0, Math.min(canvas.height - dynamicHeight, Math.floor(canvasY - dynamicHeight/2)));

  const imageData = ctx.getImageData(startX, startY, Math.ceil(dynamicWidth), dynamicHeight);
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
  ctx.fillRect(startX, startY, dynamicWidth, dynamicHeight);
  
  texture.needsUpdate = true;
}
