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

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
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
  camera.position.set(
    player.position.x,
    player.position.y + CONFIG.CAMERA_HEIGHT,
    player.position.z
  );
  camera.rotation.set(inputState.cameraPitch, inputState.cameraYaw, 0);
}

// YENİ: Raycaster (Şüa atıcı) yaradırıq
const raycaster = new THREE.Raycaster();
// Fırçanın ekranda olduğu yer (sağ aşağı)
// Ekranın mərkəzi (0,0)-dır. Sağ aşağı üçün X müsbət, Y mənfi olur.
const brushNDC = new THREE.Vector2(0.2, -0.2); 

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  updatePlayer(player, inputState.joystick, inputState.cameraYaw, dt, inputState.actionPressed, brushGroup);
  
  // Kameradan fırçanın istiqamətinə şüa göndəririk
  raycaster.setFromCamera(brushNDC, camera);
  
  // Şüanın toz kürəsinə dəyib-dəymədiyini yoxlayırıq
  const intersects = raycaster.intersectObject(dustSystem.dustMesh);
  
  if (intersects.length > 0) {
    // Əgər dəyibsə, həmin nöqtənin dəqiq UV koordinatını alırıq
    const uv = intersects[0].uv;
    updateDustSystem(dustSystem, uv, inputState.actionPressed, dt);
  }
  
  updateCamera();
  updateHUD();

  renderer.render(scene, camera);
}

animate();
