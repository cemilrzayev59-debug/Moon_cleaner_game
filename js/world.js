// Ay dünyası: səhnə, səma, səth, işıq
import * as THREE from 'three';
import { CONFIG } from './config.js';

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000008);

  // ---- Ulduzlar ----
  const starCount = 800;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 300;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false });
  scene.add(new THREE.Points(starGeo, starMat));

  // ---- Ay səthi ----
  const groundGeo = new THREE.CircleGeometry(CONFIG.MOON_RADIUS, 64);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, flatShading: true });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ---- Kraterlər ----
  for (let i = 0; i < 25; i++) {
    const r = 1 + Math.random() * 3;
    const craterGeo = new THREE.CircleGeometry(r, 16);
    const craterMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, flatShading: true });
    const crater = new THREE.Mesh(craterGeo, craterMat);
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * (CONFIG.MOON_RADIUS - 10);
    crater.position.set(Math.cos(angle) * dist, 0.02, Math.sin(angle) * dist);
    crater.rotation.x = -Math.PI / 2;
    scene.add(crater);
  }

  // ---- Yer ----
  const earthGeo = new THREE.SphereGeometry(15, 16, 12);
  const earthMat = new THREE.MeshStandardMaterial({ color: 0x3388ff, emissive: 0x114488, flatShading: true });
  const earth = new THREE.Mesh(earthGeo, earthMat);
  earth.position.set(80, 50, -120);
  scene.add(earth);

  // ---- İşıq ----
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
  sunLight.position.set(30, 50, 20);
  scene.add(sunLight);

  const ambient = new THREE.AmbientLight(0x445566, 0.8);
  scene.add(ambient);

  return { scene };
}
