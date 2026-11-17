import * as THREE from 'three';

export function createPlayer(camera) {
  const brushGroup = new THREE.Group();
  
  // Geniş sarı süpürgə başlığı (İkinci şəkildəki kimi)[span_6](start_span)[span_6](end_span)
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.12, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4 })
  );
  head.position.set(0, -0.3, -1.2);
  brushGroup.add(head);

  // Süpürgənin qıl tərəfi (alt hissə)
  const bristles = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.08, 0.23),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 })
  );
  bristles.position.set(0, -0.38, -1.2);
  brushGroup.add(bristles);

  // Süpürgə dəstəyi (yuxarı uzanan qolu)
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
  );
  handle.rotation.x = Math.PI / 4;
  handle.position.set(0, 0.1, -0.8);
  brushGroup.add(handle);
  
  camera.add(brushGroup);
  
  return { brushGroup };
}
