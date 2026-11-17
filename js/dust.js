import * as THREE from 'three';
import { CONFIG } from './config.js';
import { tozToplA } from './state.js';

export function createDustSystem(scene) {
  const group = new THREE.Group();
  const patches = [];
  const geo = new THREE.CircleGeometry(CONFIG.DUST_RADIUS, 8);
  
  for (let i = 0; i < CONFIG.DUST_COUNT; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x444444, flatShading: true, transparent: true, opacity: 1.0
    });
    const patch = new THREE.Mesh(geo, mat);
    
    const angle = Math.random() * Math.PI * 2;
    const dist = 3 + Math.random() * (CONFIG.MOON_RADIUS - 6);
    
    patch.position.set(Math.cos(angle) * dist, 0.03, Math.sin(angle) * dist);
    patch.rotation.x = -Math.PI / 2;
    
    patch.userData.amount = 1.0;
    patch.userData.cleaned = false;

    group.add(patch);
    patches.push(patch);
  }

  scene.add(group);
  return { group, patches };
}

// YENİ: brushPos birbaşa fırçanın koordinatıdır
export function updateDustSystem(dustSystem, brushPos, isBrushing, dt) {
  if (!isBrushing) {
    return;
  }

  for (let i = 0; i < dustSystem.patches.length; i++) {
    const patch = dustSystem.patches[i];
    
    if (patch.userData.cleaned) {
      continue;
    }

    // Fırça ilə toz arasındakı real məsafə
    const dx = brushPos.x - patch.position.x;
    const dz = brushPos.z - patch.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Əgər məsafə CLEAN_DISTANCE-dən kiçikdirsə (çox yaxındırsa)
    if (dist < CONFIG.CLEAN_DISTANCE) {
      patch.userData.amount -= CONFIG.CLEAN_SPEED * dt;
      
      if (patch.userData.amount > 0) {
        patch.scale.setScalar(patch.userData.amount);
        patch.material.opacity = patch.userData.amount;
      } else {
        patch.userData.amount = 0;
        patch.userData.cleaned = true;
        patch.visible = false;
        tozToplA(CONFIG.DUST_YIELD);
      }
    }
  }
}
