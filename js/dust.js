import * as THREE from 'three';
import { CONFIG } from './config.js';
import { tozToplA } from './state.js';

export function createDustSystem(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = CONFIG.CANVAS_SIZE;
  canvas.height = CONFIG.CANVAS_SIZE;
  const ctx = canvas.getContext('2d');

  // Kətanı tam tünd, ləkəsiz rənglə doldururuq (təsadüfi nöqtələr SİLİNDİ)
  ctx.fillStyle = '#2a2a2a'; 
  ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

  const texture = new THREE.CanvasTexture(canvas);
  
  const geo = new THREE.PlaneGeometry(CONFIG.MOON_RADIUS * 2, CONFIG.MOON_RADIUS * 2);
  const mat = new THREE.MeshStandardMaterial({ 
    map: texture, 
    transparent: true,
    roughness: 0.9
  });
  
  const dustMesh = new THREE.Mesh(geo, mat);
  dustMesh.rotation.x = -Math.PI / 2;
  dustMesh.position.y = 0.1; 
  scene.add(dustMesh);

  return { canvas, ctx, texture };
}

export function updateDustSystem(dustSystem, brushPos, isBrushing, dt) {
  if (!isBrushing) {
    return;
  }

  const { ctx, texture, canvas } = dustSystem;
  
  const canvasX = ((brushPos.x + CONFIG.MOON_RADIUS) / (CONFIG.MOON_RADIUS * 2)) * canvas.width;
  const canvasY = ((brushPos.z + CONFIG.MOON_RADIUS) / (CONFIG.MOON_RADIUS * 2)) * canvas.height;

  const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
  if (pixel[3] > 0) { 
    tozToplA(CONFIG.DUST_YIELD * dt);
  }

  // Kvadrat silgi effekti (piksel kimi)
  ctx.globalCompositeOperation = 'destination-out';
  const size = CONFIG.BRUSH_SIZE;
  // Dairə (arc) yerinə Kvadrat (fillRect) istifadə edirik
  ctx.fillRect(canvasX - size / 2, canvasY - size / 2, size, size);
  
  texture.needsUpdate = true;
}
