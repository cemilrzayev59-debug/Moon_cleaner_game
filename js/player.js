// Birinci şəxs idarəetməsi və Fırça modeli
import * as THREE from 'three';
import { CONFIG } from './config.js';

// Fırçanı yaradır və birbaşa Kameraya əlavə edir
export function createPlayer(camera) {
  const player = new THREE.Group();
  
  const brushGroup = new THREE.Group();
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.8, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xff3388, flatShading: true })
  );
  handle.position.y = 0.2;
  brushGroup.add(handle);

  const bristles = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.1, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })
  );
  bristles.position.y = -0.25;
  brushGroup.add(bristles);

  brushGroup.position.set(0.4, -0.4, -0.8); 
  brushGroup.rotation.x = 0.5;
  brushGroup.rotation.z = -0.3;
  
  camera.add(brushGroup);
  
  return { player, brushGroup };
}

export function updatePlayer(player, input, cameraYaw, dt, isBrushing, brushGroup) {
  if (isBrushing) {
    brushGroup.position.y = -0.6; 
    brushGroup.rotation.x = 1.0;  
  } else {
    brushGroup.position.y = -0.4; 
    brushGroup.rotation.x = 0.5;
  }

  const sinY = Math.sin(cameraYaw);
  const cosY = Math.cos(cameraYaw);

  const moveX = -sinY * input.y + cosY * input.x;
  const moveZ = -cosY * input.y - sinY * input.x;

  const mag = Math.sqrt(moveX * moveX + moveZ * moveZ);
  if (mag < 0.05) { return; }

  const nx = moveX / mag;
  const nz = moveZ / mag;
  const speed = Math.min(mag, 1);

  player.position.x += nx * CONFIG.PLAYER_SPEED * speed * dt;
  player.position.z += nz * CONFIG.PLAYER_SPEED * speed * dt;

  const dx = player.position.x;
  const dz = player.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const maxDist = CONFIG.MOON_RADIUS - 2;
  if (dist > maxDist) {
    player.position.x = (dx / dist) * maxDist;
    player.position.z = (dz / dist) * maxDist;
  }
}
