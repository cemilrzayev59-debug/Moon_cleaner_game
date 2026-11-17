import * as THREE from 'three';
import { CONFIG } from './config.js';
import { GameState, tozToplA } from './state.js';

export function createDustSystem(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = CONFIG.CANVAS_SIZE;
  canvas.height = CONFIG.CANVAS_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Zəngin və dərin 3D hündürlük (heightmap) effekti üçün rənglər yaradırıq
  ctx.fillStyle = '#888888'; 
  ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

  for (let i = 0; i < 50000; i++) {
    const val = Math.floor(Math.random() * 200) + 30;
    ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
    const x = Math.random() * CONFIG.CANVAS_SIZE;
    const y = Math.random() * CONFIG.CANVAS_SIZE;
    const size = Math.random() * 4 + 2;
    ctx.fillRect(x, y, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(CONFIG.PLANE_SIZE / CONFIG.SURFACE_SIZE, CONFIG.PLANE_SIZE / CONFIG.SURFACE_SIZE);
  
  // Real 3D relyef və hündürlük üçün yüksək seqmentli həndəsə (256x256)
  const geo = new THREE.PlaneGeometry(CONFIG.PLANE_SIZE, CONFIG.PLANE_SIZE, 256, 256);
  
  // Həqiqi 3D dərinlik verən material parametrləri
  const mat = new THREE.MeshStandardMaterial({ 
    map: texture, 
    transparent: true,
    roughness: 0.7,
    bumpMap: texture,      
    bumpScale: 0.6,       
    displacementMap: texture, // Həqiqi 3D fiziki hündürlük və qabarıqlıq
    displacementScale: 10.0,  // Tozun həqiqi qalınlıq hündürlüyü
    displacementBias: -2.0,   
    depthWrite: true      
  });
  
  const dustMesh = new THREE.Mesh(geo, mat);
  dustMesh.rotation.x = -Math.PI / 2;
  dustMesh.position.y = 0.1; 
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

  const size = CONFIG.BRUSH_SIZE * 1.5;

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
  dustSystem.dustMesh.geometry.computeVertexNormals();
}
