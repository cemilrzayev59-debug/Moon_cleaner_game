import { CONFIG } from './config.js';
import { setupKeyboardControls } from './keyboard.js';

export const inputState = {
  joystick: { x: 0, y: 0 },
  cameraYaw: 0,
  cameraPitch: 0,
  actionPressed: false,
};

// Seçilmiş cihaza görə idarəetməni qoşur: 'pc' = klaviattuhgtuhgtuura və siçan, 'phone' = toxunuş
export function setupControls(device) {
  if (device === 'pc') {
    setupKeyboardControls(inputState);
  } else {
    setupTouchControls();
  }
}

// Telefon idarəsi: virtual joystick, kamera sahəsi, təmizləmə düyməsi
function setupTouchControls() {
  const joyBase = document.getElementById('joystick-base');
  const joyKnob = document.getElementById('joystick-knob');
  const camArea = document.getElementById('camera-area');
  const actionBtn = document.getElementById('action-btn');

  let joyPointerId = null;
  let camPointerId = null;
  let camLastX = 0;
  let camLastY = 0;

  function updateJoystick(e) {
    const rect = joyBase.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const maxR = CONFIG.JOYSTICK_RADIUS;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > maxR) {
      dx = (dx / d) * maxR;
      dy = (dy / d) * maxR;
    }
    joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    inputState.joystick.x = dx / maxR;
    inputState.joystick.y = -dy / maxR;
  }

  function resetJoystick() {
    inputState.joystick.x = 0;
    inputState.joystick.y = 0;
    joyKnob.style.transform = 'translate(0, 0)';
  }

  joyBase.addEventListener('pointerdown', (e) => {
    if (joyPointerId !== null) { return; }
    joyPointerId = e.pointerId;
    joyBase.setPointerCapture(e.pointerId);
    updateJoystick(e);
  });

  joyBase.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joyPointerId) { return; }
    updateJoystick(e);
  });

  function endJoy(e) {
    if (e.pointerId !== joyPointerId) { return; }
    joyPointerId = null;
    resetJoystick();
  }
  joyBase.addEventListener('pointerup', endJoy);
  joyBase.addEventListener('pointercancel', endJoy);

  camArea.addEventListener('pointerdown', (e) => {
    if (camPointerId !== null) { return; }
    camPointerId = e.pointerId;
    camLastX = e.clientX;
    camLastY = e.clientY;
    camArea.setPointerCapture(e.pointerId);
  });

  camArea.addEventListener('pointermove', (e) => {
    if (e.pointerId !== camPointerId) { return; }
    const dx = e.clientX - camLastX;
    const dy = e.clientY - camLastY;
    camLastX = e.clientX;
    camLastY = e.clientY;

    inputState.cameraYaw += dx * CONFIG.TOUCH_SENSITIVITY;
    // Barmaq aşağı çəkəndə kamera aşağı baxsın
    inputState.cameraPitch -= dy * CONFIG.TOUCH_SENSITIVITY;

    if (inputState.cameraPitch > CONFIG.PITCH_LIMIT) { inputState.cameraPitch = CONFIG.PITCH_LIMIT; }
    if (inputState.cameraPitch < -CONFIG.PITCH_LIMIT) { inputState.cameraPitch = -CONFIG.PITCH_LIMIT; }
  });

  function endCam(e) {
    if (e.pointerId !== camPointerId) { return; }
    camPointerId = null;
  }
  camArea.addEventListener('pointerup', endCam);
  camArea.addEventListener('pointercancel', endCam);

  actionBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    actionBtn.setPointerCapture(e.pointerId);
    inputState.actionPressed = true;
  });

  actionBtn.addEventListener('pointerup', (e) => {
    e.preventDefault();
    inputState.actionPressed = false;
  });

  actionBtn.addEventListener('pointercancel', () => {
    inputState.actionPressed = false;
  });
}
