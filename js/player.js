import * as THREE from 'three';

export function createPlayer(camera) {
  const brushGroup = new THREE.Group();
  
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.8, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xff3388, flatShading: true })
  );
  handle.position.y = 0.2;
  brushGroup.add(handle);

  const bristles = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.1, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })
  );
  bristles.position.y = -0.25;
  brushGroup.add(bristles);

  brushGroup.position.set(0.3, -0.4, -0.7); 
  brushGroup.rotation.x = 0.5;
  brushGroup.rotation.z = -0.2;
  
  camera.add(brushGroup);
  
  return { brushGroup };
}
