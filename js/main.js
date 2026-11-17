import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { setupControls, inputState } from './controls.js';
import { updateHUD } from './ui.js';
import { createDustSystem, updateDustSystem } from './dust.js';
import { sat } from './state.js'; // Satış üçün

const container = document.getElementById('game-container');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 2000);

const { scene } = createWorld();
scene.add(camera);

const { brushGroup } = createPlayer(camera);
const dustSystem = createDustSystem(scene);

setupControls();
updateHUD();

// Müvəqqəti Satış Düyməsi hadisəsi
document.getElementById('sell-btn').addEventListener('click', () => {
  // 1 kq = 1 pul (istəyə görə artıra bilərsən)
  const result = sat(1);
  if (result.qazanc > 0) {
    updateHUD();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Oyunçunun koordinatı
const playerPos = new THREE.Vector3(0, 0, 0);
const heading = new THREE.Vector3(0, 0, -1); 
let currentPitch = 0;

const upVec = new THREE.Vector3(0, 1, 0); 
const rightVec = new THREE.Vector3();
const moveVec = new THREE.Vector3();
const lookDir = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0); 
const clock = new THREE.Clock();

// Kürə effekti (başlanğıca qayıtma)
function wrapCoordinate(value) {
  const half = CONFIG.BOUNDARY;
  if (value > half) { return value - (half * 2); }
  if (value < -half) { return value + (half * 2); }
  return value;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  if (inputState.cameraYaw !== 0) {
    heading.applyAxisAngle(upVec, -inputState.cameraYaw);
    inputState.cameraYaw = 0;
  }

  if (inputState.cameraPitch !== 0) {
    currentPitch += inputState.cameraPitch;
    if (currentPitch > CONFIG.PITCH_LIMIT) { currentPitch = CONFIG.PITCH_LIMIT; }
    if (currentPitch < -CONFIG.PITCH_LIMIT) { currentPitch = -CONFIG.PITCH_LIMIT; }
    inputState.cameraPitch = 0;
  }

  heading.y = 0;
  heading.normalize();
  rightVec.crossVectors(heading, upVec).normalize();

  moveVec.set(0, 0, 0);
  moveVec.addScaledVector(heading, inputState.joystick.y);
  moveVec.addScaledVector(rightVec, inputState.joystick.x);

  if (moveVec.lengthSq() > 0.01) {
    moveVec.normalize();
    playerPos.addScaledVector(moveVec, CONFIG.PLAYER_SPEED * dt);
    
    // Oyunçu sərhədə çatanda avtomatik qarşı tərəfdən çıxır (Kürə kimi)
    playerPos.x = wrapCoordinate(playerPos.x);
    playerPos.z = wrapCoordinate(playerPos.z);
  }

  camera.position.set(playerPos.x, playerPos.y + CONFIG.CAMERA_HEIGHT, playerPos.z);
  camera.up.set(0, 1, 0); 

  lookDir.copy(heading).multiplyScalar(Math.cos(currentPitch)).addScaledVector(upVec, Math.sin(currentPitch));
  camera.lookAt(camera.position.clone().add(lookDir));

  if (inputState.actionPressed) {
    brushGroup.position.y = -0.4; 
    brushGroup.rotation.x = 0.8;  
  } else {
    brushGroup.position.y = -0.25; 
    brushGroup.rotation.x = 0.3;
  }

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
