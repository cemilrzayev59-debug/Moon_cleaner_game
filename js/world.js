import * as THREE from 'three';

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000008);

  // Oyunçu ilə birlikdə hərəkət edən qrup: ulduzlar və Yer
  const sky = new THREE.Group();
  scene.add(sky);

  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 1500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi));
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  sky.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false })));

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(50, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x3388ff, emissive: 0x114488, flatShading: true })
  );
  earth.position.set(600, 450, -1000);
  sky.add(earth);

  // Ay səthi (təmiz yer): oyunçunu izləyir, ona görə dünya sonsuzdur
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshStandardMaterial({ color: 0xc4c8d2, roughness: 1.0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.material.depthWrite = false; // uzaqda titrəməsin deyə yer ilk çəkilir
  ground.renderOrder = -1;
  scene.add(ground);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
  sunLight.position.set(100, 300, 100);
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x445566, 0.9));

  return { scene, sky, ground };
}

// Hər kadrda çağırılır: göy və yer oyunçunun ardınca gedireufeyfgey
export function updateWorld(world, playerPos) {
  world.sky.position.set(playerPos.x, 0, playerPos.z);
  world.ground.position.set(playerPos.x, 0, playerPos.z);
}
