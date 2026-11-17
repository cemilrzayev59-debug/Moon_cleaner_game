import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameState, tozToplA } from './state.js';

export function createDustSystem(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = CONFIG.CANVAS_SIZE;
  canvas.height = CONFIG.CANVAS_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Ay səthinin toz rəngi
  ctx.fillStyle = '#888888'; 
  ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

  // İncə dənəvər Ay tozu (regolith) toxuması
  for (let i = 0; i < 60000; i++) {
    const shade = Math.floor(Math.random() * 60) + 100;
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    const x = Math.random() * CONFIG.CANVAS_SIZE;
    const y = Math.random() * CONFIG.CANVAS_SIZE;
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(CONFIG.PLANE_SIZE / CONFIG.SURFACE_SIZE, CONFIG.PLANE_SIZE / CONFIG.SURFACE_SIZE);
  
  // Səth tamamilə DÜZ qalır, həndəsə əyilmir!
  const geo = new THREE.PlaneGeometry(CONFIG.PLANE_SIZE, CONFIG.PLANE_SIZE);
  
  // Bump map ilə işıq altında real 3D qabarıqlıq effekti (həndəsəni əymədən)
  const mat = new THREE.MeshStandardMaterial({ 
    map: texture, 
    transparent: true,
    roughness: 0.9,
    bumpMap: texture,      
    bumpScale: 0.15,       // İşıq və kölgə ilə həqiqi 3D toxuma effekti
    depthWrite: false      
  });
  
  const dustMesh = new THREE.Mesh(geo, mat);
  dustMesh.rotation.x = -Math.PI / 2;
  dustMesh.position.y = 0.03; // Yerin üzərində düz səth kimi oturur
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
