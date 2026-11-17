import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { setupControls, inputState } from './controls.js';
import { updateHUD } from './ui.js';
import { createDustSystem, updateDustSystem } from './dust.js';

const container = document.getElementById('game-container');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Kameranın yaxınlığı (near) kiçildildi ki, fırça kəsilmsin
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 2000);

const { scene } = createWorld();
scene.add(camera);

const { brushGroup } = createPlayer(camera);
const dustSystem = createDustSystem(scene);

setupControls();
updateHUD();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Oyunçunun 3D koordinatı (Ayın ən təpəsində başlayır)
const playerPos = new THREE.Vector3(0, CONFIG.MOON_RADIUS, 0);

// Baxış istiqaməti (vektor)
const heading = new THREE.Vector3(0, 0, -1); 
let currentPitch = 0;

// Köməkçi vektorlar (yaddaşı qorumaq üçün bir dəfə yaradılır)
const upVec = new THREE.Vector3();
const rightVec = new THREE.Vector3();
const moveVec = new THREE.Vector3();
const lookDir = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0); 
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  // 1. Kürənin səthinə perpendikulyar vektor (Yuxarı)
  upVec.copy(playerPos).normalize();

  // 2. Kameranın sağa-sola dönməsi (Yaw)
  if (inputState.cameraYaw !== 0) {
    heading.applyAxisAngle(upVec, -inputState.cameraYaw);
    inputState.cameraYaw = 0; // Sıfırlayırıq
  }

  // 3. Kameranın yuxarı-aşağı dönməsi (Pitch)
  if (inputState.cameraPitch !== 0) {
    currentPitch += inputState.cameraPitch;
    if (currentPitch > 1.5) { currentPitch = 1.5; }
    if (currentPitch < -1.5) { currentPitch = -1.5; }
    inputState.cameraPitch = 0; // Sıfırlayırıq
  }

  // 4. Hərəkət vektorlarını hesablayırıq
  // Heading həmişə yerə paralel olmalıdır
  heading.projectOnPlane(upVec).normalize();
  
  // Sağ tərəf vektoru
  rightVec.crossVectors(heading, upVec).normalize();

  // Hərəkət istiqaməti
  moveVec.set(0, 0, 0);
  moveVec.addScaledVector(heading, inputState.joystick.y);
  moveVec.addScaledVector(rightVec, inputState.joystick.x);

  if (moveVec.lengthSq() > 0.01) {
    moveVec.normalize();
    // Oyunçunu hərəkət etdiririk
    playerPos.addScaledVector(moveVec, CONFIG.PLAYER_SPEED * dt);
    // Kürənin səthinə oturduruq (həmişə radius qədər məsafədə saxlayırıq)
    playerPos.normalize().multiplyScalar(CONFIG.MOON_RADIUS);
  }

  // 5. Kameranı yeniləyirik
  upVec.copy(playerPos).normalize(); // Yeni "yuxarı"
  
  // Kamera oyunçunun gözündədir
  camera.position.copy(playerPos).addScaledVector(upVec, CONFIG.CAMERA_HEIGHT);
  camera.up.copy(upVec); // Kameranın təpəsi həmişə kürədən kənara baxır

  // Baxış istiqaməti (Pitch daxil olmaqla)
  lookDir.copy(heading).multiplyScalar(Math.cos(currentPitch)).addScaledVector(upVec, Math.sin(currentPitch));
  camera.lookAt(camera.position.clone().add(lookDir));

  // 6. Fırçanın animasiyası
  if (inputState.actionPressed) {
    brushGroup.position.y = -0.4; 
    brushGroup.rotation.x = 0.8;  
  } else {
    brushGroup.position.y = -0.25; 
    brushGroup.rotation.x = 0.3;
  }

  // 7. Təmizləmə (Ekranın mərkəzindən şüa atırıq)
  raycaster.setFromCamera(screenCenter, camera);
  const intersects = raycaster.intersectObject(dustSystem.dustMesh);
  
  if (intersects.length > 0) {
    const uv = intersects[0].uv;
    updateDustSystem(dustSystem, uv, inputState.actionPressed, dt);
  }
  
  updateHUD();
  renderer.render(scene, camera);
}

animate();
