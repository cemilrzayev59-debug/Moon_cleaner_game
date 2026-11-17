import * as THREE from 'three';
import { CONFIG } from './config.js';
import { tozToplA } from './state.js';

export function createDustSystem(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = CONFIG.CANVAS_SIZE;
  canvas.height = CONFIG.CANVAS_SIZE;
  const ctx = canvas.getContext('2d');

  // Kətanı tam tünd tozla doldururuq
  ctx.fillStyle = '#2a2a2a'; 
  ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

  const texture = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(CONFIG.MOON_RADIUS * 2, CONFIG.MOON_RADIUS * 2);
  const mat = new THREE.MeshStandardMaterial({ 
    map: texture, transparent: true, roughness: 0.9
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

  const size = CONFIG.BRUSH_SIZE;

  // Fırçanın dəydiyi kvadrat sahədəki bütün pikselləri yoxlayırıq
  const imageData = ctx.getImageData(canvasX - size/2, canvasY - size/2, size, size);
  let silinenTozSayi = 0;

  // Hər pikselin şəffaflığını (alfa) yoxlayırıq
  for (let i = 3; i < imageData.data.length; i += 4) {
    if (imageData.data[i] > 0) { // Əgər piksel şəffaf deyilsə, deməli tozdur
      silinenTozSayi++;
    }
  }

  // Əgər həqiqətən toz silinirsə, çantaya əlavə et
  if (silinenTozSayi > 0) {
    tozToplA(silinenTozSayi * CONFIG.DUST_YIELD);
  }

  // İndi həmin sahəni sil (Silgi effekti)
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(canvasX - size / 2, canvasY - size / 2, size, size);
  
  texture.needsUpdate = true;
}
