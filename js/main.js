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

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);

const { scene } = createWorld();
scene.add(camera);

const { player, brushGroup } = createPlayer(camera);
scene.add(player);

const dustSystem = createDustSystem(scene);

setupControls();
updateHUD();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function updateCamera() {
  camera.position.set(
    player.position.x,
    player.position.y + CONFIG.CAMERA_HEIGHT,
    player.position.z
  );
  
  const lookX = player.position.x - Math.sin(inputState.cameraYaw) * 10;
  const lookZ = player.position.z - Math.cos(inputState.cameraYaw) * 10;
  camera.lookAt(lookX, player.position.y + CONFIG.CAMERA_HEIGHT - 0.5, lookZ);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  updatePlayer(player, inputState.joystick, inputState.cameraYaw, dt, inputState.actionPressed, brushGroup);
  updateDustSystem(dustSystem, player.position, inputState.cameraYaw, inputState.actionPressed, dt);
  updateCamera();
  updateHUD();

  renderer.render(scene, camera);
}

animate();
