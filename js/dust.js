import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameState, tozToplA } from './state.js';

export function createDustSystem(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = CONFIG.CANVAS_SIZE;
  canvas.height = CONFIG.CANVAS_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Tozun rəngi 
  ctx.fillStyle = '#888888'; 
  ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

  // Şum (noise) effekti
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
  
  // Həqiqi 3D qalınlıq üçün PlaneGeometry əvəzinə BoxGeometry (En, Hündürlük/Qalınlıq, Uzunluq) istifadə edirik
  const geo = new THREE.BoxGeometry(CONFIG.PLANE_SIZE, 0.4, CONFIG.PLANE_SIZE);
  
  // Üst səth üçün təmizlənən toz teksturası
  const topMat = new THREE.MeshStandardMaterial({ 
    map: texture, 
    transparent: true,
    roughness: 0.9,
    bumpMap: texture,      
    bumpScale: 0.2,       
    depthWrite: false      
  });

  // Yan divarlar üçün real toz/torpaq qalınlığı rəngi
  const sideMat = new THREE.MeshStandardMaterial({
    color: 0x777777,
    roughness: 1.0
  });

  // BoxGeometry üçün 6 üzün materialı: [sağ, sol, üst, alt, ön, arxa]
  const materials = [
    sideMat, sideMat, // Yanlar
    topMat,  sideMat, // Üst (toz təbəqəsi) və alt
    sideMat, sideMat  // Yanlar
  ];
  
  const dustMesh = new THREE.Mesh(geo, materials);
  // Qutunun qalınlığının yarısı qədər yuxarı qaldırırıq ki, Ay səthinin üzərində 3D qat kimi oturub qalsın
  dustMesh.position.y = 0.2; 
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

  const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
  if (pixel[3] > 0) { 
    tozToplA(CONFIG.DUST_YIELD * dt * 60);
  }

  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'black';

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
