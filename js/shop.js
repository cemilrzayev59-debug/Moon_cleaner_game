import { GameState } from './state.js';
import {
  getBrushTool, getNextBrushTool, getNextBagLevel, getRobotTool, getNextRobotTool,
  buyBrushUpgrade, buyBagUpgrade, buyRobotUpgrade,
} from './upgrades.js';
import { showToast } from './ui.js';
import { saveGame } from './save.js';

// Paneldəki sətirlər: alət, çanta, robot (key = kompüterdə basılan düymə)
const ITEMS = [
  { id: 'tool', key: '1', title: '🪥 Alət', buy: buyBrushUpgrade },
  { id: 'bag', key: '2', title: '🎒 Çanta', buy: buyBagUpgrade },
  { id: 'robot', key: '3', title: '🤖 Robot', buy: buyRobotUpgrade },
];

// Mağaza panelini hazırlayır: hər yenilənmə üçün bir sətir və "Al" düyməsi düzəldir
export function createShopPanel() {
  const shop = {
    lastKey: '',
    panel: document.getElementById('shop-panel'),
    list: document.getElementById('shop-items'),
    rows: [],
  };

  for (const item of ITEMS) {
    const row = document.createElement('div');
    row.className = 'shop-row';

    const text = document.createElement('div');
    text.className = 'shop-text';

    const title = document.createElement('div');
    title.className = 'shop-row-title';
    const keySpan = document.createElement('span');
    keySpan.className = 'shop-key';
    keySpan.textContent = '[' + item.key + '] ';
    const label = document.createElement('span');
    label.textContent = item.title;
    title.appendChild(keySpan);
    title.appendChild(label);

    const info = document.createElement('div');
    info.className = 'shop-row-info';

    text.appendChild(title);
    text.appendChild(info);

    const button = document.createElement('button');
    button.className = 'shop-buy';
    button.id = 'shop-buy-' + item.id;

    row.appendChild(text);
    row.appendChild(button);
    shop.list.appendChild(row);

    button.addEventListener('click', () => {
      const result = item.buy();
      showToast(result.message);
      if (result.ok) { saveGame(); }
      shop.lastKey = '';
    });

    shop.rows.push({ id: item.id, info: info, button: button });
  }

  return shop;
}

// Bir sətirin yazısını və qiymətini hazırlayır (qiymət null = daha yüksək səviyyə yoxdur)
function describeRow(id) {
  let info = '';
  let price = null;

  if (id === 'tool') {
    const current = getBrushTool();
    const next = getNextBrushTool();
    if (next === null) {
      info = current.name + ' (' + current.size + ' m): ən güclü alətdir';
    } else {
      info = current.name + ' (' + current.size + ' m) → ' + next.name + ' (' + next.size + ' m)';
      price = next.price;
    }
  } else if (id === 'bag') {
    const next = getNextBagLevel();
    if (next === null) {
      info = 'Çanta: ' + GameState.bagCapacity + ' kq (maksimum)';
    } else {
      info = 'Çanta: ' + GameState.bagCapacity + ' kq → ' + next.capacity + ' kq';
      price = next.price;
    }
  } else {
    const current = getRobotTool();
    const next = getNextRobotTool();
    if (next === null) {
      info = current.name + ' (' + current.size + ' m): ən güclü robotdur';
    } else if (GameState.upgrades.robotLevel === 0) {
      info = 'Özü təmizləyir: ' + next.name + ' (' + next.size + ' m)';
      price = next.price;
    } else {
      info = current.name + ' → ' + next.name + ' (' + next.size + ' m)';
      price = next.price;
    }
  }

  return { info: info, price: price };
}

// Panelin mətnini və düymələrini yeniləyir (yalnız nəsə dəyişibsə)
function renderPanel(shop) {
  const descriptions = [];
  let key = '' + Math.floor(GameState.money);

  for (const row of shop.rows) {
    const description = describeRow(row.id);
    descriptions.push(description);
    key += '|' + description.info + '|' + description.price;
  }

  if (key === shop.lastKey) { return; }
  shop.lastKey = key;

  for (let index = 0; index < shop.rows.length; index++) {
    const row = shop.rows[index];
    const description = descriptions[index];
    row.info.textContent = description.info;
    if (description.price === null) {
      row.button.textContent = 'Maksimum';
      row.button.disabled = true;
    } else {
      row.button.textContent = 'Al: ' + description.price + ' 💰';
      row.button.disabled = GameState.money < description.price;
    }
  }
}

// Hər kadrda: oyunçu YENİLƏMƏ sahəsindədirsə panel açılırdeded
export function updateShopPanel(shop, activeId) {
  if (activeId === 'upgrade') {
    renderPanel(shop);
    shop.panel.classList.add('show');
  } else {
    shop.panel.classList.remove('show');
    shop.lastKey = '';
  }
}
