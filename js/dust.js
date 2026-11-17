import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameState, tozToplA } from './state.js';

export function createDustSystem(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = CONFIG.CANVAS_SIZE;
  canvas.height = CONFIG.CANVAS_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Tozun rəngi (Ay səthindən bir az tünd)
  ctx.fillStyle = '#888888'; 
  ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

  // 3D qabarıqlıq (bump map) üçün şum (noise) effekti yaradırıq
  for (let i = 0; i < 30000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#7a7a7a' : '#999999';
    const x = Math.random() * CONFIG.CANVAS_SIZE;
    const y = Math.random() * CONFIG.CANVAS_SIZE;
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(CONFIG.PLANE_SIZE / CONFIG.SURFACE_SIZE, CONFIG.PLANE_SIZE / CONFIG.SURFACE_SIZE);
  
  const geo = new THREE.PlaneGeometry(CONFIG.PLANE_SIZE, CONFIG.PLANE_SIZE);
  
  // Tozu 3D kimi göstərmək üçün bumpMap və artırılmış bumpScale istifadə edirik
  const mat = new THREE.MeshStandardMaterial({ 
    map: texture, 
    transparent: true,
    roughness: 0.9,
    bumpMap: texture,      // Qabarıqlıq üçün eyni teksturadan istifadə
    bumpScale: 0.18,       // 3D qalınlıq effekti üçün dəyər artırıldı (0.05 -> 0.18)
    depthWrite: false      // Kəsişmələrdə qara ləkələrin qarşısını alır
  });
  
  const dustMesh = new THREE.Mesh(geo, mat);
  dustMesh.rotation.x = -Math.PI / 2;
  dustMesh.position.y = 0.02; // Yerdən çox az yuxarıda
  scene.add(dustMesh);

  return { canvas, ctx, texture, dustMesh };
}

export function updateDustSystem(dustSystem, uv, isBrushing, dt) {
  if (!isBrushing || GameState.bag >= GameState.bagCapacity) {
    return;
  }

  const { ctx, texture, canvas } = dustSystem;
  
  const repeatFactor = CONFIG.PLANE_SIZE / CONFIG.SURFACE_SIZE; 
  const localU = (uv.x * repeatFactor) % 1.0;
  const localV = ((1 - uv.y) * repeatFactor) % 1.0;

  const canvasX = localU * canvas.width;
  const canvasY = localV * canvas.height;

  const size = CONFIG.BRUSH_SIZE;

  // YALNIZ 1 PİKSEL YOXLAYIRIQ (Dublikat pul yığımının qarşısını alır)
  const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
  if (pixel[3] > 0) { 
    tozToplA(CONFIG.DUST_YIELD * dt * 60);
  }

  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'black';

  // Kənarlarda kəsilməməsi üçün 3 yerdə (mərkəz, sol, sağ) silirik
  const drawSquare = (x, y) => {
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  };

  // X oxu üzrə təkrarlamaları silirik
  drawSquare(canvasX, canvasY);
  drawSquare(canvasX - canvas.width, canvasY);
  drawSquare(canvasX + canvas.width, canvasY);
  // Y oxu üzrə təkrarlamaları silirik
  drawSquare(canvasX, canvasY - canvas.height);
  drawSquare(canvasX, canvasY + canvas.height);
  
  texture.needsUpdate = true;
}
