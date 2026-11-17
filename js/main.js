// Başlanğıc və oyun dövrü
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createWorld } from './world.js';
import { createPlayer, updatePlayer } from './player.js';
import { setupControls, inputState } from './controls.js';
import { updateHUD } from './ui.js';

const container = document.getElementById('game-container');

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Kamera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

// Dünya və oyunçu
const { scene } = createWorld();
const player = createPlayer(scene);

// İdarəetmə
setupControls();

// HUD
updateHUD();

// Pəncərə ölçüsü dəyişəndə
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Kamera oyunçunu izləyir
function updateCamera() {
  const yaw = inputState.cameraYaw;
  const ox = Math.sin(yaw) * CONFIG.CAMERA_DISTANCE;
  const oz = Math.cos(yaw) * CONFIG.CAMERA_DISTANCE;
  camera.position.set(
    player.position.x + ox,
    player.position.y + CONFIG.CAMERA_HEIGHT,
    player.position.z + oz
  );
  camera.lookAt(
    player.position.x,
    player.position.y + 1.2,
    player.position.z
  );
}

// Vaxt
const clock = new THREE.Clock();

// Oyun dövrü
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  updatePlayer(player, inputState.joystick, inputState.cameraYaw, dt);
  updateCamera();

  renderer.render(scene, camera);
}

animate();
