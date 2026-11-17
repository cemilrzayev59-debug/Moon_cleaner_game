import * as THREE from 'three';
import { CONFIG } from './config.js';
import { tozToplA } from './state.js';

export function createDustSystem(scene) {
  const group = new THREE.Group();
  const patches = [];
  
  // Dairə yerinə Kvadrat (Plane) istifadə edirik
  const geo = new THREE.PlaneGeometry(CONFIG.DUST_RADIUS, CONFIG.DUST_RADIUS);
  
  for (let i = 0; i < CONFIG.DUST_COUNT; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x333333, // Tünd boz (piksel effekti üçün)
      flatShading: true
    });
    const patch = new THREE.Mesh(geo, mat);
    
    // Təsadüfi səpələmə
    const angle = Math.random() * Math.PI * 2;
    const dist = 2 + Math.random() * (CONFIG.MOON_RADIUS - 4);
    
    patch.position.set(Math.cos(angle) * dist, 0.03, Math.sin(angle) * dist);
    patch.rotation.x = -Math.PI / 2;
    
    // Təsadüfi fırlanma ki, dama-dama görünməsin
    patch.rotation.z = Math.random() * Math.PI;

    patch.userData.cleaned = false;

    group.add(patch);
    patches.push(patch);
  }

  scene.add(group);
  return { group, patches };
}

export function updateDustSystem(dustSystem, brushPos, isBrushing, dt) {
  if (!isBrushing) {
    return;
  }

  for (let i = 0; i < dustSystem.patches.length; i++) {
    const patch = dustSystem.patches[i];
    
    if (patch.userData.cleaned) {
      continue;
    }

    const dx = brushPos.x - patch.position.x;
    const dz = brushPos.z - patch.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Fırça dəyən kimi dərhal silinir (Piksel kimi)
    if (dist < CONFIG.CLEAN_DISTANCE) {
      patch.userData.cleaned = true;
      patch.visible = false;
      tozToplA(CONFIG.DUST_YIELD);
    }
  }
}
