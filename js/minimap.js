import { CONFIG } from './config.js';

const MAP_SIZE = 128;

function mod1(value) {
  return ((value % 1) + 1) % 1;
}

export function createMinimap() {
  const canvas = document.getElementById('minimap');
  canvas.width = MAP_SIZE;
  canvas.height = MAP_SIZE;

  const buffer = document.createElement('canvas');
  buffer.width = MAP_SIZE;
  buffer.height = MAP_SIZE;
  const bufferCtx = buffer.getContext('2d');

  return {
    ctx: canvas.getContext('2d'),
    buffer,
    bufferCtx,
    image: bufferCtx.createImageData(MAP_SIZE, MAP_SIZE),
    label: document.getElementById('cleaned-percent'),
    drawnVersion: -1,
    lastRedraw: 0,
  };
}

// Xəritə bütün dünyanı göstərir (dünya təkrarlandığı üçün oyunçu kənardan çıxanda qarşı tərəfdən görünür)
export function updateMinimap(map, dust, playerPos, heading, nowMs) {
  const grid = CONFIG.GRID;

  // Təmizlənmiş yerlər dəyişəndə (və ən çox 4 dəfə saniyədə) xəritəni yenidən çəkirik
  if (dust.version !== map.drawnVersion && nowMs - map.lastRedraw > 250) {
    map.drawnVersion = dust.version;
    map.lastRedraw = nowMs;

    for (let y = 0; y < MAP_SIZE; y++) {
      const rowFrom = Math.floor((y * grid) / MAP_SIZE);
      const rowTo = Math.floor(((y + 1) * grid) / MAP_SIZE);
      for (let x = 0; x < MAP_SIZE; x++) {
        const colFrom = Math.floor((x * grid) / MAP_SIZE);
        const colTo = Math.floor(((x + 1) * grid) / MAP_SIZE);
        let cleanedCells = 0;
        for (let row = rowFrom; row < rowTo; row++) {
          const rowStart = row * grid;
          for (let col = colFrom; col < colTo; col++) {
            cleanedCells += dust.cleaned[rowStart + col];
          }
        }
        const share = cleanedCells / ((rowTo - rowFrom) * (colTo - colFrom));
        const shade = 70 + share * 170;
        const p = (y * MAP_SIZE + x) * 4;
        map.image.data[p] = shade;
        map.image.data[p + 1] = shade;
        map.image.data[p + 2] = shade;
        map.image.data[p + 3] = 255;
      }
    }
    map.bufferCtx.putImageData(map.image, 0, 0);

    const percent = (dust.cleanedCount / (grid * grid)) * 100;
    map.label.textContent = 'Təmizlənib: ' + percent.toFixed(1) + '%';
  }

  map.ctx.drawImage(map.buffer, 0, 0);
  // Bazanın yeri (mavi kvadrat)
  const baseMapX = mod1(CONFIG.BASE_X / CONFIG.SURFACE_SIZE) * MAP_SIZE;
  const baseMapY = mod1(CONFIG.BASE_Z / CONFIG.SURFACE_SIZE) * MAP_SIZE;
  map.ctx.fillStyle = '#3b82f6';
  map.ctx.fillRect(baseMapX - 4, baseMapY - 4, 8, 8);
  // Oyunçunun yeri və baxdığı istiqamətrfrgrgrgrg
  const dotX = mod1(playerPos.x / CONFIG.SURFACE_SIZE) * MAP_SIZE;
  const dotY = mod1(playerPos.z / CONFIG.SURFACE_SIZE) * MAP_SIZE;
  map.ctx.strokeStyle = '#ff4040';
  map.ctx.lineWidth = 2;
  map.ctx.beginPath();
  map.ctx.moveTo(dotX, dotY);
  map.ctx.lineTo(dotX + heading.x * 10, dotY + heading.z * 10);
  map.ctx.stroke();
  map.ctx.fillStyle = '#ff4040';
  map.ctx.beginPath();
  map.ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
  map.ctx.fill();
}
