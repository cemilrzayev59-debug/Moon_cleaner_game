import * as THREE from 'three';
import { CONFIG } from './config.js';
import { tozToplA } from './state.js';

// Toz sistemini yaradırıq (Böyük bir rəsm vərəqi kimi)
export function createDustSystem(scene) {
  // 1. Görünməz bir 2D kətan (Canvas) yaradırıq
  const canvas = document.createElement('canvas');
  canvas.width = CONFIG.CANVAS_SIZE;
  canvas.height = CONFIG.CANVAS_SIZE;
  const ctx = canvas.getContext('2d');

  // 2. Kətanı tamamilə tozla (tünd boz rənglə) doldururuq
  ctx.fillStyle = '#3a3a3a'; // Tozun rəngi
  ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

  // Üzərinə bir az real görünməsi üçün qarışıq nöqtələr vururuq
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#2e2e2e' : '#4a4a4a';
    const x = Math.random() * CONFIG.CANVAS_SIZE;
    const y = Math.random() * CONFIG.CANVAS_SIZE;
    ctx.fillRect(x, y, 2, 2);
  }

  // 3. Bu kətanı 3D dünyaya toxuma (Texture) kimi çeviririk
  const texture = new THREE.CanvasTexture(canvas);
  
  // 4. Ay səthinin üzərinə qoyuruq
  // Ay radiusu 60 olduğu üçün ölçü 120x120 olur
  const geo = new THREE.PlaneGeometry(CONFIG.MOON_RADIUS * 2, CONFIG.MOON_RADIUS * 2);
  const mat = new THREE.MeshStandardMaterial({ 
    map: texture, 
    transparent: true,
    roughness: 0.9
  });
  
  const dustMesh = new THREE.Mesh(geo, mat);
  dustMesh.rotation.x = -Math.PI / 2;
  dustMesh.position.y = 0.1; // Ay səthindən bir az yuxarıda
  scene.add(dustMesh);

  return { canvas, ctx, texture };
}

// Fırça dəyəndə tozu silən funksiya (Silgi effekti)
export function updateDustSystem(dustSystem, brushPos, isBrushing) {
  if (!isBrushing) {
    return;
  }

  const { ctx, texture, canvas } = dustSystem;
  
  // Dünya koordinatlarını (X, Z) Kətan koordinatlarına (X, Y) çeviririk
  // Dünya: -60-dan +60-a qədərdir. Kətan: 0-dan 1024-ə qədər.
  const canvasX = ((brushPos.x + CONFIG.MOON_RADIUS) / (CONFIG.MOON_RADIUS * 2)) * canvas.width;
  const canvasY = ((brushPos.z + CONFIG.MOON_RADIUS) / (CONFIG.MOON_RADIUS * 2)) * canvas.height;

  // Fırçanın dəydiyi yerdə tozun (alfa kanalının) olub-olmadığını yoxlayırıq
  // Əgər orada hələ toz varsa, çantaya əlavə edirik
  const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
  if (pixel[3] > 0) { // Əgər şəffaflıq 0-dan böyükdürsə, deməli toz var
    tozToplA(CONFIG.DUST_YIELD);
  }

  // İndi isə "Silgi" effektini işə salırıq
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(canvasX, canvasY, CONFIG.BRUSH_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  
  // 3D toxumanı yeniləyirik ki, silinmə dərhal görünsün
  texture.needsUpdate = true;
}
