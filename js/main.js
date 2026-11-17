// Başlanğıc və oyun dövrü
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createWorld } from './world.js';
import { createPlayer, updatePlayer } from './player.js';
import { setupControls, inputState } from './controls.js';
import { updateHUD } from './ui.js';
import { createDustSystem, updateDustSystem } from './dust.js';

const container = document.getElementById('game-container');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

const { scene } = createWorld();
const player = createPlayer(scene);

// Toz sistemini qur
const dustSystem = createDustSystem(scene);

setupControls();
updateHUD();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function updateCamera() {
  const yaw = inputState.cameraYaw;
  const ox = Math.sin(yaw) * CONFIG.CAMERA_DISTANCE;
  const oz = Math.cos(yaw) * CONFIG.CAMERA_DISTANCE;
  camera.position.set(player.position.x + ox, player.position.y + CONFIG.CAMERA_HEIGHT, player.position.z + oz);
  camera.lookAt(player.position.x, player.position.y + 1.2, player.position.z);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  updatePlayer(player, inputState.joystick, inputState.cameraYaw, dt);
  
  // Toz sistemini yenilə
  updateDustSystem(dustSystem, player.position, inputState.actionPressed, dt);
  
  // Düymə basılıbsa fırçanı bir az yellə (vizual effekt)
  if (inputState.actionPressed) {
    player.rotation.z = Math.sin(Date.now() * 0.02) * 0.1;
  } else {
    player.rotation.z = 0;
  }
  
  updateCamera();
  updateHUD();

  renderer.render(scene, camera);
}

animate();
