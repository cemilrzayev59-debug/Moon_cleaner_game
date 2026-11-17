import * as THREE from 'three';
import { CONFIG } from './config.js';

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000008);

  // ---- Ulduzlar ----
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 800;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false });
  scene.add(new THREE.Points(starGeo, starMat));

  // ---- Düz Ay Səthi (2000x2000) ----
  const groundGeo = new THREE.PlaneGeometry(CONFIG.SURFACE_SIZE, CONFIG.SURFACE_SIZE);
  const groundMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ---- Yanlardakı Dağlar (Vizual effekt üçün) ----
  const mountainMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
  for (let i = 0; i < 40; i++) {
    const mountainGeo = new THREE.ConeGeometry(30, 80, 8);
    const mountain = new THREE.Mesh(mountainGeo, mountainMat);
    // Səthin kənarlarına yerləşdiririk
    const angle = Math.random() * Math.PI * 2;
    const dist = CONFIG.SURFACE_SIZE * 0.45;
    mountain.position.set(Math.cos(angle) * dist, 40, Math.sin(angle) * dist);
    scene.add(mountain);
  }

  // ---- Yer ----
  const earthGeo = new THREE.SphereGeometry(30, 16, 12);
  const earthMat = new THREE.MeshStandardMaterial({ color: 0x3388ff, emissive: 0x114488, flatShading: true });
  const earth = new THREE.Mesh(earthGeo, earthMat);
  earth.position.set(400, 300, -600);
  scene.add(earth);

  // ---- İşıq ----
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
  sunLight.position.set(100, 300, 100);
  scene.add(sunLight);

  const ambient = new THREE.AmbientLight(0x445566, 0.8);
  scene.add(ambient);

  return { scene };
}
