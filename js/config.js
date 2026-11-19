const CELL = 0.15;          // təmizlik izləmə şəbəkəsinin xana ölçüsü (dünya vahidi)
const SURFACE_SIZE = 270;   // dünyanın təkrarlandığı ölçü (əvvəl 192 idi, sahə ~2 dəfə böyük)
const CHUNK_SIZE = 6;       // parçanın ölçüsü (SURFACE_SIZE-a bölünməlidir)

export const CONFIG = {
  VERSION: 'v0.9.1',

  CELL,
  SURFACE_SIZE,
  GRID: Math.round(SURFACE_SIZE / CELL),                 // 1800
  CHUNK_SIZE,
  CHUNK_CELLS: Math.round(CHUNK_SIZE / CELL),            // bir parçada tərəf başına 40 xana
  CHUNKS_PER_SIDE: Math.round(SURFACE_SIZE / CHUNK_SIZE), // 45
  CHUNK_REWARD: 4,         // parça təmizlənəndə verilən pul
  CHUNK_DONE_RATIO: 0.97,  // parçanın neçə faizi təmizlənəndə "bitdi" sayılır

  FAR_SIZE: 2000,
  LAYER_WINDOW: 60,
  DUST_HEIGHT: 0.12,
  DUST_COLOR: 0xa8a8a8,
  WALL_COLORS: [0x666666, 0x585858, 0x4a4a4a],

  PLAYER_SPEED: 6,           // yeriş sürəti (əvvəl 15 idi)
  JOYSTICK_RADIUS: 50,
  BAG_CAPACITY: 1.0,

  CAMERA_HEIGHT: 1.8,
  PITCH_LIMIT: 1.5,

  REACH: 5,
  KG_PER_SQUARE_UNIT: 0.02,  // çanta nə qədər tez dolur
  SELL_PRICE_PER_KG: 10,     // 1 kq tozun satış qiyməti

  // Baza (dünya xəritəsinin ortasında)
  BASE_X: SURFACE_SIZE / 2,
  BASE_Z: SURFACE_SIZE / 2,
  BASE_WIDTH: 18,
  BASE_DEPTH: 12,
  PAD_HALF: 2.2,             // sahələrin yarım eni
  BASE_CLEAR_MARGIN: 1.5,    // bazanın ətrafında tozdan təmiz saxlanan əlavə zolaq

  // Alət yeniləmələri: size = fırçanın ağzı, price = qiymət
  BRUSH_TOOLS: [
    { name: 'Diş fırçası', size: 0.4, price: 0 },
    { name: 'Kiçik fırça', size: 0.6, price: 30 },
    { name: 'Süpürgə', size: 0.9, price: 120 },
    { name: 'Geniş süpürgə', size: 1.3, price: 400 },
    { name: 'Təmizləyici', size: 1.8, price: 1200 },
  ],

  // Çanta yeniləmələri: capacity = tutum (kq)
  BAG_LEVELS: [
    { capacity: 1, price: 0 },
    { capacity: 2, price: 25 },
    { capacity: 4, price: 90 },
    { capacity: 8, price: 300 },
    { capacity: 16, price: 900 },
  ],
};
