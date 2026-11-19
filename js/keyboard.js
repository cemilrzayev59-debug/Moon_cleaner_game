import { CONFIG } from './config.js';

// Kompüter idarəsi: WASD/oxlar, siçan baxışı, sol klik və ya Boşluq, E (mağazada "Al")
export function setupKeyboardControls(inputState) {
  const container = document.getElementById('game-container');
  const hint = document.getElementById('pc-hint');
  const shopPanel = document.getElementById('shop-panel');
  const shopBuy = document.getElementById('shop-buy');

  const keys = {};      // hazırda basılı düymələr
  let spaceDown = false;
  let mouseDown = false;

  function isDown(firstCode, secondCode) {
    return keys[firstCode] === true || keys[secondCode] === true;
  }

  // Basılı düymələrə görə joystick qiymətlərini təyin edir
  function updateMove() {
    inputState.joystick.y = (isDown('KeyW', 'ArrowUp') ? 1 : 0) - (isDown('KeyS', 'ArrowDown') ? 1 : 0);
    inputState.joystick.x = (isDown('KeyD', 'ArrowRight') ? 1 : 0) - (isDown('KeyA', 'ArrowLeft') ? 1 : 0);
  }

  function updateAction() {
    inputState.actionPressed = spaceDown || mouseDown;
  }

  function isLocked() {
    return document.pointerLockElement === container;
  }

  // Ekranın altındakı köməkçi yazı
  function updateHint() {
    if (isLocked()) {
      hint.textContent = 'WASD: yeriş · Siçan: baxış · Sol klik / Boşluq: təmizlə · E: al · Esc: siçanı burax';
    } else {
      hint.textContent = 'Başlamaq üçün oyuna klikləyin';
    }
  }

  // Siçanı oyuna "kilidləyir" (kursor gizlənir, baxış siçanla idarə olunur)
  function lockMouse() {
    try {
      const result = container.requestPointerLock();
      if (result && result.catch) { result.catch(() => {}); }
    } catch (error) {
      console.warn('Siçan kilidi xətası:', error);
    }
  }

  // Bütün düymələri buraxılmış sayır
  function releaseAll() {
    for (const code in keys) {
      keys[code] = false;
    }
    spaceDown = false;
    mouseDown = false;
    updateMove();
    updateAction();
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      spaceDown = true;
      updateAction();
      return;
    }
    if (e.code === 'KeyE') {
      if (!e.repeat && shopPanel.classList.contains('show')) { shopBuy.click(); }
      return;
    }
    if (e.code.startsWith('Arrow')) { e.preventDefault(); }
    keys[e.code] = true;
    updateMove();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      spaceDown = false;
      updateAction();
      return;
    }
    keys[e.code] = false;
    updateMove();
  });

  window.addEventListener('blur', releaseAll);

  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) { return; }
    if (!isLocked()) {
      lockMouse();
      return;
    }
    mouseDown = true;
    updateAction();
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button !== 0) { return; }
    mouseDown = false;
    updateAction();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isLocked()) { return; }
    inputState.cameraYaw += e.movementX * CONFIG.MOUSE_SENSITIVITY;
    inputState.cameraPitch -= e.movementY * CONFIG.MOUSE_SENSITIVITY;
  });

  container.addEventListener('contextmenu', (e) => { e.preventDefault(); });

  document.addEventListener('pointerlockchange', () => {
    if (!isLocked()) { releaseAll(); }
    updateHint();
  });

  updateHint();
}
