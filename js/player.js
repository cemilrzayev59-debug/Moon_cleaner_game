import * as THREE from 'three';

export function createPlayer(camera) {
  const brushGroup = new THREE.Group();

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.6, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xff3388, flatShading: true })
  );
  handle.position.y = 0.2;
  brushGroup.add(handle);

  const bristles = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.05, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })
  );
  bristles.position.y = -0.12;
  brushGroup.add(bristles);

  brushGroup.position.set(0.2, -0.25, -0.45);
  brushGroup.rotation.x = 0.3;
  brushGroup.rotation.z = -0.1;

  camera.add(brushGroup);

  return { brushGroup };
}

// Təmizləyəndə fırça yumşaq şəkildə aşağı əyilir və yana-yana süpürür
export function updateBrush(brushGroup, isCleaning, dt, time) {
  const data = brushGroup.userData;
  if (data.cleanAmount === undefined) {
    data.cleanAmount = 0;
  }
  const target = isCleaning ? 1 : 0;
  data.cleanAmount += (target - data.cleanAmount) * Math.min(1, dt * 10);

  const amount = data.cleanAmount;
  const sweep = Math.sin(time * 12) * amount;

  brushGroup.position.set(0.2 + sweep * 0.12, -0.25 - 0.2 * amount, -0.45 - 0.1 * amount);
  brushGroup.rotation.x = 0.3 + 0.9 * amount;
  brushGroup.rotation.z = -0.1 + sweep * 0.3;
}
