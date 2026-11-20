import { GameState } from './state.js';
import {
  getBrushTool, getNextBrushTool, getNextBagLevel, buyBrushUpgrade, buyBagUpgrade,
} from './upgrades.js';
import { showToast } from './ui.js';
import { saveGame } from './save.js';

// Mağaza panelini hazırlayır və "Al" düyməsinə klik əlavə edir
export function createShopPanel() {
  const shop = {
    activeId: null,
    lastKey: '',
    panel: document.getElementById('shop-panel'),
    title: document.getElementById('shop-title'),
    info: document.getElementById('shop-info'),
    buyButton: document.getElementById('shop-buy'),
  };

  shop.buyButton.addEventListener('click', () => {
    let result = null;
    if (shop.activeId === 'tool') {
      result = buyBrushUpgrade();
    } else if (shop.activeId === 'bag') {
      result = buyBagUpgrade();
    }
    if (result !== null) {
      showToast(result.message);
      if (result.ok) { saveGame(); }
      shop.lastKey = '';
    }
  });

  return shop;
}

// Panelin mətnini və düyməsini yeniləyir (yalnız nəsə dəyişibsə)
function renderPanel(shop, id) {
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
  if (key === shop.lastKey) { return; }
  shop.lastKey = key;

  shop.title.textContent = title;
  shop.info.textContent = info;
  if (price === null) {
    shop.buyButton.textContent = 'Maksimum';
    shop.buyButton.disabled = true;
  } else {
    shop.buyButton.textContent = 'Al: ' + price + ' 💰';
    shop.buyButton.disabled = GameState.money < price;
  }
}

// Hər kadrda: oyunçu alət və ya çanta sahəsindədirsə panel açılır
export function updateShopPanel(shop, activeId) {
  shop.activeId = activeId;
  if (activeId === 'tool' || activeId === 'bag') {
    renderPanel(shop, activeId);
    shop.panel.classList.add('show');
  } else {
    shop.panel.classList.remove('show');
    shop.lastKey = '';
  }
}
