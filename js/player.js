import * as THREE from './three.js';
import { GameState } from './state.js';

// Qutu şəklində bir hissə düzəldir (en, hündürlük, dərinlik, rəng, yer)
function makeBox(width, height, depth, color, x, y, z, glowColor) {
  const material = new THREE.MeshStandardMaterial({ color: color, flatShading: true });
  if (glowColor !== undefined) {
    material.emissive = new THREE.Color(glowColor);
  }
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  return mesh;
}

// Konus şəklində hissə düzəldir (süpürgənin saman hissəsi üçün)
function makeCone(topRadius, bottomRadius, height, color, x, y, z) {
  const material = new THREE.MeshStandardMaterial({ color: color, flatShading: true });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, height, 6), material);
  mesh.position.set(x, y, z);
  return mesh;
}

// 1. Diş fırçası: nazik çəhrayı sap, ağ tüklər
function buildToothbrush() {
  const model = new THREE.Group();
  model.add(makeBox(0.05, 0.55, 0.05, 0xff3388, 0, 0.2, 0));
  model.add(makeBox(0.08, 0.03, 0.2, 0xff3388, 0, -0.1, 0.04));
  model.add(makeBox(0.07, 0.04, 0.19, 0xffffff, 0, -0.13, 0.04));
  return model;
}

// 2. Kiçik fırça: taxta sap və taxta blok, sarı tüklər
function buildScrubBrush() {
  const model = new THREE.Group();
  model.add(makeBox(0.05, 0.5, 0.05, 0xb5793a, 0, 0.18, 0));
  model.add(makeBox(0.12, 0.05, 0.28, 0x8a5a2b, 0, -0.08, 0));
  model.add(makeBox(0.11, 0.06, 0.27, 0xffd34d, 0, -0.135, 0));
  return model;
}

// 3. Süpürgə: uzun sap, qırmızı bağ, konus şəkilli saman
function buildBroom() {
  const model = new THREE.Group();
  model.add(makeBox(0.045, 0.75, 0.045, 0x9c6b3a, 0, 0.3, 0));
  model.add(makeBox(0.1, 0.04, 0.1, 0xcc2222, 0, -0.04, 0));
  model.add(makeCone(0.07, 0.17, 0.26, 0xe0b84a, 0, -0.19, 0));
  return model;
}

// 4. Geniş süpürgə: uzun boz sap, enli narıncı blok, qara tüklər
function buildWideBroom() {
  const model = new THREE.Group();
  model.add(makeBox(0.045, 0.8, 0.045, 0x667788, 0, 0.32, 0));
  model.add(makeBox(0.06, 0.1, 0.06, 0x445566, 0, -0.05, 0));
  model.add(makeBox(0.5, 0.06, 0.1, 0xee7722, 0, -0.12, 0));
  model.add(makeBox(0.48, 0.07, 0.09, 0x222222, 0, -0.18, 0));
  return model;
}

// 5. Təmizləyici: tünd sap, firuzəyi gövdə, enli baş, parlayan zolaq
function buildCleaner() {
  const model = new THREE.Group();
  model.add(makeBox(0.045, 0.6, 0.045, 0x333a44, 0, 0.25, 0));
  model.add(makeBox(0.16, 0.14, 0.2, 0x22ccdd, 0, -0.04, 0));
  model.add(makeBox(0.6, 0.07, 0.16, 0x2b3038, 0, -0.14, 0));
  model.add(makeBox(0.58, 0.02, 0.04, 0x66ffcc, 0, -0.18, 0.06, 0x66ffcc));
  model.add(makeBox(0.56, 0.05, 0.12, 0xdddddd, 0, -0.19, 0));
  return model;
}

// Alətin səviyyəsinə görə modellər (config.js-dəki BRUSH_TOOLS ardıcıllığı ilə eynidir)
const BRUSH_BUILDERS = [buildToothbrush, buildScrubBrush, buildBroom, buildWideBroom, buildCleaner];

// Köhnə modelin yaddaşını azad edir
function disposeModel(model) {
  model.traverse((part) => {
    if (part.geometry) {
      part.geometry.dispose();
    }
    if (part.material) {
      part.material.dispose();
    }
  });
}

// Fırçanın modelini cari alətə uyğun dəyişir
function setBrushModel(brushGroup, level) {
  const oldModel = brushGroup.userData.model;
  if (oldModel) {
    brushGroup.remove(oldModel);
    disposeModel(oldModel);
  }
  const index = Math.min(Math.max(level, 1), BRUSH_BUILDERS.length) - 1;
  const newModel = BRUSH_BUILDERS[index]();
  brushGroup.add(newModel);
  brushGroup.userData.model = newModel;
  brushGroup.userData.level = level;
}

export function createPlayer(camera) {
  const brushGroup = new THREE.Group();
  setBrushModel(brushGroup, GameState.upgrades.brushLevel);

  brushGroup.position.set(0.2, -0.25, -0.45);
  brushGroup.rotation.x = 0.3;
  brushGroup.rotation.z = -0.1;

  camera.add(brushGroup);

  return { brushGroup };
}

// Təmizləyəndə fırça yumşaq şəkildə aşağı əyilir və yana-yana süpürür
export function updateBrush(brushGroup, isCleaning, dt, time) {
  const data = brushGroup.userData;

  // Yeni alət alınıbsa, görünüşü dəyişirik
  if (data.level !== GameState.upgrades.brushLevel) {
    setBrushModel(brushGroup, GameState.upgrades.brushLevel);
  }

  if (data.cleanAmount === undefined) {
    data.cleanAmount = 0;
  }
  const target = isCleaning ? 1 : 0;
  data.cleanAmount += (target - data.cleanAmount) * Math.min(1, dt * 10);

  const amount = data.cleanAmount;
  const sweep = Math.sin(time * 12) * amount;

  brushGroup.position.set(0.2 + sweep * 0.12, -0.25 - 0.2 * amount, -0.45 - 0.1 * amount);
  brushGroup.rotation.x = 0.3 + 0.9 * amount;
  brushGroup.rotation.z = -0.1 + sweep * 0.3;
}
