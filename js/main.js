import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createWorld } from './world.js';
import { createPlayer, updatePlayer, getBrushWorldPosition } from './player.js';
import { setupControls, inputState } from './controls.js';
import { updateHUD } from './ui.js';
import { createDustSystem, updateDustSystem } from './dust.js';

const container = document.getElementById('game-container');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
// Kamera rotasiya qaydası (FPS üçün standart)
camera.rotation.order = 'YXZ';

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
  // Oyunçunun göz hündürlüyündə
  camera.position.set(
    player.position.x,
    player.position.y + CONFIG.CAMERA_HEIGHT,
    player.position.z
  );
  
  // Birbaşa rotasiya təyin edirik (Yuxarı-aşağı və Sağa-sola)
  camera.rotation.set(inputState.cameraPitch, inputState.cameraYaw, 0);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  updatePlayer(player, inputState.joystick, inputState.cameraYaw, dt, inputState.actionPressed, brushGroup);
  
  // Fırçanın real dünya koordinatını alırıq
  const brushPos = getBrushWorldPosition(brushGroup);
  
  // Təmizləmə sistemini fırçanın koordinatı ilə işlədirik
  updateDustSystem(dustSystem, brushPos, inputState.actionPressed, dt);
  
  updateCamera();
  updateHUD();

  renderer.render(scene, camera);
}

animate();
