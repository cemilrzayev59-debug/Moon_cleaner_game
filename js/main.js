import * as THREE from 'three';
import { CONFIG } from './config.js';
import { applyUpgrades } from './state.js';
import { loadGame, saveGame } from './save.js';
import { createWorld, updateWorld } from './world.js';
import { createPlayer, updateBrush } from './player.js';
import { setupControls, inputState } from './controls.js';
import { updateHUD } from './ui.js';
import { createDustSystem, updateDustWindow, updateDustSystem, getChunkProgress } from './dust.js';
import { createMinimap, updateMinimap } from './minimap.js';
import { createBase, updateBase, isInsideBase, showToast } from './base.js';

loadGame();
applyUpgrades();

const container = document.getElementById('game-container');
document.getElementById('version-tag').textContent = CONFIG.VERSION;
const chunkLabel = document.getElementById('chunk-info');
const baseLabel = document.getElementById('base-info');
let lastChunkText = '';
let lastBaseText = '';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 2000);

const world = createWorld();
world.scene.add(camera);

const { brushGroup } = createPlayer(camera);
const dustSystem = createDustSystem(world.scene);
const minimap = createMinimap();
const base = createBase(world.scene);

setupControls();
updateHUD();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setInterval(saveGame, 10000);

// Oyun bazada başlayır
const playerPos = new THREE.Vector3(CONFIG.BASE_X, 0, CONFIG.BASE_Z + 4);
const heading = new THREE.Vector3(0, 0, -1);
let currentPitch = 0;

const upVec = new THREE.Vector3(0, 1, 0);
const rightVec = new THREE.Vector3();
const moveVec = new THREE.Vector3();
const lookDir = new THREE.Vector3();
const hitPoint = new THREE.Vector3();
const clock = new THREE.Clock();

// Baxış istiqaməti ilə toz qatının kəsişmə nöqtəsi (fırça çatmasa və ya baza üstündədirsə null)
function findGroundHit() {
  if (lookDir.y > -0.05) { return null; }
  const distance = (CONFIG.DUST_HEIGHT - camera.position.y) / lookDir.y;
  if (distance > CONFIG.REACH) { return null; }
  hitPoint.copy(camera.position).addScaledVector(lookDir, distance);
  if (isInsideBase(hitPoint.x, hitPoint.z)) { return null; }
  return hitPoint;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  const nowMs = performance.now();

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
  }

  camera.position.set(playerPos.x, playerPos.y + CONFIG.CAMERA_HEIGHT, playerPos.z);
  camera.up.set(0, 1, 0);

  lookDir.copy(heading).multiplyScalar(Math.cos(currentPitch)).addScaledVector(upVec, Math.sin(currentPitch));
  camera.lookAt(camera.position.clone().add(lookDir));

  updateWorld(world, playerPos);
  updateDustWindow(dustSystem, playerPos, nowMs);
  updateBrush(brushGroup, inputState.actionPressed, dt, clock.elapsedTime);

  const hit = findGroundHit();
  updateDustSystem(dustSystem, hit, heading, inputState.actionPressed);
  updateBase(base, playerPos);
  updateMinimap(minimap, dustSystem, playerPos, heading, nowMs);

  // Parça tamamlananda mesaj
  if (dustSystem.rewardPending > 0) {
    showToast('Parça təmizləndi! +' + dustSystem.rewardPending + ' 💰');
    dustSystem.rewardPending = 0;
    saveGame();
  }

  // Parça faizi və bazaya məsafə
  const target = hit !== null ? hit : playerPos;
  const chunkText = 'Parça: ' + getChunkProgress(dustSystem, target.x, target.z) + '%';
  if (chunkText !== lastChunkText) {
    chunkLabel.textContent = chunkText;
    lastChunkText = chunkText;
  }
  const baseText = 'Baza: ' + Math.round(Math.hypot(playerPos.x - CONFIG.BASE_X, playerPos.z - CONFIG.BASE_Z)) + ' m';
  if (baseText !== lastBaseText) {
    baseLabel.textContent = baseText;
    lastBaseText = baseText;
  }

  updateHUD();
  renderer.render(world.scene, camera);
}

animate();
