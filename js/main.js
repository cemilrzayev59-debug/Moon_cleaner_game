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

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

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

// Oyunçunun 3D koordinatı (Kürənin təpəsindən başlayır)
const playerPos = new THREE.Vector3(0, CONFIG.MOON_RADIUS, 0);

// Köməkçi vektorlar
const baseForward = new THREE.Vector3(0, 0, -1);
const upVec = new THREE.Vector3();
const forwardVec = new THREE.Vector3();
const rightVec = new THREE.Vector3();
const moveVec = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0); 

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  // 1. Kürənin səth normalı (Yuxarı istiqamət)
  upVec.copy(playerPos).normalize();

  // 2. Kameranın baxdığı istiqamətləri hesablayırıq
  // Əvvəlcə Yaw (sağa-sola) fırlanmasını tətbiq edirik
  forwardVec.copy(baseForward).applyAxisAngle(upVec, inputState.cameraYaw);
  rightVec.crossVectors(forwardVec, upVec).normalize();

  // 3. Oyunçunu hərəkət etdiririk
  moveVec.set(0, 0, 0);
  moveVec.addScaledVector(forwardVec, inputState.joystick.y);
  moveVec.addScaledVector(rightVec, inputState.joystick.x);

  if (moveVec.lengthSq() > 0.01) {
    moveVec.normalize();
    // Hərəkət etdikdən sonra koordinatı yeniləyirik
    playerPos.addScaledVector(moveVec, CONFIG.PLAYER_SPEED * dt);
    // Vektorun uzunluğunu dəyişdirib yenidən kürənin səthinə oturduruq
    playerPos.normalize().multiplyScalar(CONFIG.MOON_RADIUS);
  }

  // 4. Kameranı yeniləyirik
  upVec.copy(playerPos).normalize(); // Yeni normal
  camera.up.copy(upVec); // Kameranın "təpəsi" həmişə kürədən kənara baxır
  
  // Kamera oyunçunun göz hündürlüyündə
  camera.position.copy(playerPos).addScaledVector(upVec, CONFIG.CAMERA_HEIGHT);

  // Yuxarı/aşağı baxış (Pitch) əlavə edirik
  const lookDir = forwardVec.clone().applyAxisAngle(rightVec, inputState.cameraPitch);
  camera.lookAt(camera.position.clone().add(lookDir));

  // 5. Fırçanın animasiyası
  if (inputState.actionPressed) {
    brushGroup.position.y = -0.6; 
    brushGroup.rotation.x = 1.0;  
  } else {
    brushGroup.position.y = -0.4; 
    brushGroup.rotation.x = 0.5;
  }

  // 6. Təmizləmə (Raycaster)
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
