import * as THREE from 'three';

export function createPlayer(camera) {
  const brushGroup = new THREE.Group();
  
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.6, 0.05), // Daha kiçik
    new THREE.MeshStandardMaterial({ color: 0xff3388, flatShading: true })
  );
  handle.position.y = 0.2;
  brushGroup.add(handle);

  const bristles = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.05, 0.25), // Daha kiçik
    new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })
  );
  bristles.position.y = -0.12;
  brushGroup.add(bristles);

  // Kameranın tam qarşısına, sağ aşağıya yerləşdiririk
  brushGroup.position.set(0.2, -0.25, -0.45); 
  brushGroup.rotation.x = 0.3;
  brushGroup.rotation.z = -0.1;
  
  camera.add(brushGroup);
  
  return { brushGroup };
}
