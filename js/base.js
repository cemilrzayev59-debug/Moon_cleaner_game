import * as THREE from 'three';
import { CONFIG } from './config.js';
import {
  GameState, sat, getBrushTool, getNextBrushTool, getNextBagLevel,
  buyBrushUpgrade, buyBagUpgrade,
} from './state.js';
import { saveGame } from './save.js';

let toastTimer = null;

// Ekranın yuxarısında qısa mesaj göstərir
export function showToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.add('show');
  if (toastTimer !== null) { clearTimeout(toastTimer); }
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toastTimer = null;
  }, 1800);
}

function makeLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
  sprite.scale.set(6, 1.5, 1);
  return sprite;
}

const PADS = [
  { id: 'sell', label: 'SATIŞ', color: 0x35c46a, offsetX: -6 },
  { id: 'tool', label: 'ALƏT', color: 0x3b82f6, offsetX: 0 },
  { id: 'bag', label: 'ÇANTA', color: 0xf59e0b, offsetX: 6 },
];

export function createBase(scene) {
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(CONFIG.BASE_WIDTH, 0.3, CONFIG.BASE_DEPTH),
    new THREE.MeshStandardMaterial({ color: 0x4b5a73, roughness: 0.9 })
  );
  slab.position.set(CONFIG.BASE_X, 0.15, CONFIG.BASE_Z);
  scene.add(slab);

  const zones = [];
  for (const pad of PADS) {
    const x = CONFIG.BASE_X + pad.offsetX;
    const z = CONFIG.BASE_Z - 2;

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(CONFIG.PAD_HALF * 2, 0.08, CONFIG.PAD_HALF * 2),
      new THREE.MeshStandardMaterial({ color: pad.color, emissive: pad.color, emissiveIntensity: 0.35 })
    );
    plate.position.set(x, 0.34, z);
    scene.add(plate);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 9, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: pad.color, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide,
      })
    );
    beam.position.set(x, 4.8, z);
    scene.add(beam);

    const label = makeLabel(pad.label);
    label.position.set(x, 3.4, z);
    scene.add(label);

    zones.push({ id: pad.id, x, z });
  }

  const base = {
    zones,
    activeId: null,
    lastPanelKey: '',
    panel: document.getElementById('shop-panel'),
    panelTitle: document.getElementById('shop-title'),
    panelInfo: document.getElementById('shop-info'),
    buyButton: document.getElementById('shop-buy'),
  };

  base.buyButton.addEventListener('click', () => {
    let result = null;
    if (base.activeId === 'tool') {
      result = buyBrushUpgrade();
    } else if (base.activeId === 'bag') {
      result = buyBagUpgrade();
    }
    if (result !== null) {
      showToast(result.message);
      if (result.ok) { saveGame(); }
      base.lastPanelKey = '';
    }
  });

  return base;
}

// Oyunçu bazadadırmı (bazanın üstündə fırça işləmir)
export function isInsideBase(x, z) {
  return Math.abs(x - CONFIG.BASE_X) <= CONFIG.BASE_WIDTH / 2 + 0.5
    && Math.abs(z - CONFIG.BASE_Z) <= CONFIG.BASE_DEPTH / 2 + 0.5;
}

function renderPanel(base, id) {
  let title = '';
  let info = '';
  let price = null;

  if (id === 'tool') {
    const current = getBrushTool();
    const next = getNextBrushTool();
    title = 'Alət yeniləməsi';
    if (next === null) {
      info = current.name + ' (' + current.size + ' m): ən güclü alətdir';
    } else {
      info = current.name + ' (' + current.size + ' m) → ' + next.name + ' (' + next.size + ' m)';
      price = next.price;
    }
  } else {
    const next = getNextBagLevel();
    title = 'Çanta yeniləməsi';
    if (next === null) {
      info = 'Çanta: ' + GameState.bagCapacity + ' kq (maksimum)';
    } else {
      info = 'Çanta: ' + GameState.bagCapacity + ' kq → ' + next.capacity + ' kq';
      price = next.price;
    }
  }

  const key = id + '|' + info + '|' + price + '|' + Math.floor(GameState.money);
  if (key === base.lastPanelKey) { return; }
  base.lastPanelKey = key;

  base.panelTitle.textContent = title;
  base.panelInfo.textContent = info;
  if (price === null) {
    base.buyButton.textContent = 'Maksimum';
    base.buyButton.disabled = true;
  } else {
    base.buyButton.textContent = 'Al: ' + price + ' 💰';
    base.buyButton.disabled = GameState.money < price;
  }
}

// Hər kadrda: oyunçu hansı sahədədir? Satış avtomatikdir, yeniləmələr üçün panel açılır
export function updateBase(base, playerPos) {
  let activeId = null;
  for (const zone of base.zones) {
    if (Math.abs(playerPos.x - zone.x) <= CONFIG.PAD_HALF && Math.abs(playerPos.z - zone.z) <= CONFIG.PAD_HALF) {
      activeId = zone.id;
    }
  }
  base.activeId = activeId;

  if (activeId === 'sell' && GameState.bag > 0.0001) {
    const result = sat(CONFIG.SELL_PRICE_PER_KG);
    showToast('Satıldı: ' + result.satilan.toFixed(2) + ' kq, +' + result.qazanc + ' 💰');
    saveGame();
  }

  if (activeId === 'tool' || activeId === 'bag') {
    renderPanel(base, activeId);
    base.panel.classList.add('show');
  } else {
    base.panel.classList.remove('show');
    base.lastPanelKey = '';
  }
}
