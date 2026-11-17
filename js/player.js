// Astronavt mesh-i və hərəkət məntiqi
import * as THREE from 'three';
import { CONFIG } from './config.js';

export function createPlayer(scene) {
  const group = new THREE.Group();
  const suitMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, flatShading: true });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x66ccff, flatShading: true });

  // Bədən
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.7, 4, 8), suitMat);
  body.position.y = 1.0;
  group.add(body);

  // Baş (helmet)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), suitMat);
  head.position.y = 1.8;
  group.add(head);

  // Vizör
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2.2),
    visorMat
  );
  visor.position.set(0, 1.82, 0.18);
  visor.rotation.x = Math.PI / 2;
  group.add(visor);

  // Ayaqlar
  const legGeo = new THREE.CapsuleGeometry(0.12, 0.4, 4, 6);
  const legL = new THREE.Mesh(legGeo, suitMat);
  legL.position.set(-0.18, 0.3, 0);
  group.add(legL);
  const legR = new THREE.Mesh(legGeo, suitMat);
  legR.position.set(0.18, 0.3, 0);
  group.add(legR);

  // Qollar
  const armGeo = new THREE.CapsuleGeometry(0.1, 0.4, 4, 6);
  const armL = new THREE.Mesh(armGeo, suitMat);
  armL.position.set(-0.42, 1.05, 0);
  armL.rotation.z = 0.2;
  group.add(armL);

  const armR = new THREE.Mesh(armGeo, suitMat);
  armR.position.set(0.45, 1.0, 0.15);
  armR.rotation.z = -0.3;
  armR.rotation.x = -0.5;
  group.add(armR);

  // Diş fırçası
  const brushGroup = new THREE.Group();
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.45, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xff3388, flatShading: true })
  );
  brushGroup.add(handle);

  const bristles = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.03, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })
  );
  bristles.position.set(0, -0.22, 0.06);
  brushGroup.add(bristles);

  brushGroup.position.set(0.62, 0.78, 0.35);
  brushGroup.rotation.x = -0.9;
  brushGroup.rotation.z = 0.35;
  group.add(brushGroup);

  scene.add(group);
  return group;
}

// Oyunçunu hərəkət etdirir.
export function updatePlayer(player, input, cameraYaw, dt) {
  const sinY = Math.sin(cameraYaw);
  const cosY = Math.cos(cameraYaw);

  const moveX = -sinY * input.y + cosY * input.x;
  const moveZ = -cosY * input.y - sinY * input.x;

  const mag = Math.sqrt(moveX * moveX + moveZ * moveZ);
  if (mag < 0.05) {
    return;
  }

  const nx = moveX / mag;
  const nz = moveZ / mag;
  const speed = Math.min(mag, 1);

  player.position.x += nx * CONFIG.PLAYER_SPEED * speed * dt;
  player.position.z += nz * CONFIG.PLAYER_SPEED * speed * dt;

  // Sərhəddən kənara çıxmasın
  const dx = player.position.x;
  const dz = player.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const maxDist = CONFIG.MOON_RADIUS - 2;
  if (dist > maxDist) {
    player.position.x = (dx / dist) * maxDist;
    player.position.z = (dz / dist) * maxDist;
  }

  player.rotation.y = Math.atan2(-nx, -nz);
}
