// Toz sistemi: səthdə toz ləkələrinin yaradılması və təmizlənməsi
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { tozToplA } from './state.js';

// Səhnədə toz ləkələrini yaradır
export function createDustSystem(scene) {
  const group = new THREE.Group();
  const patches = [];

  // Tünd boz rəngli dairə həndəsəsi
  const geo = new THREE.CircleGeometry(CONFIG.DUST_RADIUS, 8);
  
  for (let i = 0; i < CONFIG.DUST_COUNT; i++) {
    // Hər toz üçün ayrıca material yaradırıq ki, tək-tək yox edə bilək
    const mat = new THREE.MeshStandardMaterial({
      color: 0x444444, // Tünd boz (Ay səthindən tünd)
      flatShading: true,
      transparent: true,
      opacity: 1.0
    });
    
    const patch = new THREE.Mesh(geo, mat);
    
    // Təsadüfi mövqe (Ay dairəsinin içində)
    const angle = Math.random() * Math.PI * 2;
    // Mərkəzdən bir az aralı yerləşdiririk
    const dist = 3 + Math.random() * (CONFIG.MOON_RADIUS - 6);
    
    patch.position.set(
      Math.cos(angle) * dist,
      0.03, // Səthdən bir az yuxarıda
      Math.sin(angle) * dist
    );
    patch.rotation.x = -Math.PI / 2;
    
    // Vəziyyətini yadda saxlayırıq
    patch.userData.amount = 1.0; // 1.0 = tam tozlu, 0.0 = təmiz
    patch.userData.cleaned = false;

    group.add(patch);
    patches.push(patch);
  }

  scene.add(group);
  return { group, patches };
}

// Hər kadrda tozları yoxlayır və təmizləyir
export function updateDustSystem(dustSystem, playerPos, isBrushing, dt) {
  if (!isBrushing) {
    return; // Düymə basılmayıbsa, heç nə etmə
  }

  for (let i = 0; i < dustSystem.patches.length; i++) {
    const patch = dustSystem.patches[i];
    
    if (patch.userData.cleaned) {
      continue; // Əgər artıq təmizlənibsə, keç
    }

    // Oyunçu ilə toz arasındakı məsafə
    const dx = playerPos.x - patch.position.x;
    const dz = playerPos.z - patch.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Əgər oyunçu toza yaxındırsa, təmizlə
    if (dist < CONFIG.CLEAN_DISTANCE) {
      patch.userData.amount -= CONFIG.CLEAN_SPEED * dt;
      
      // Vizual kiçilmə (yox olma effekti)
      if (patch.userData.amount > 0) {
        patch.scale.setScalar(patch.userData.amount);
        patch.material.opacity = patch.userData.amount;
      } else {
        // Tam təmizləndi
        patch.userData.amount = 0;
        patch.userData.cleaned = true;
        patch.visible = false;
        
        // Çantaya toz əlavə et (state.js-dəki funksiya)
        tozToplA(CONFIG.DUST_YIELD);
      }
    }
  }
}
