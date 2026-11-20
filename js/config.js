const CELL = 0.3;          // optimallaşdırılmış xana ölçüsü
const SURFACE_SIZE = 270;
const CHUNK_SIZE = 6;

export const CONFIG = {
  VERSION: 'v0.9.4',

  CELL,
  SURFACE_SIZE,

  GRID: Math.round(SURFACE_SIZE / CELL), 
  CHUNK_SIZE,

  CHUNK_CELLS: Math.round(CHUNK_SIZE / CELL),
  CHUNKS_PER_SIDE: Math.round(SURFACE_SIZE / CHUNK_SIZE),

  CHUNK_REWARD: 4,
  CHUNK_DONE_RATIO: 0.97,

  FAR_SIZE: 2000,
  LAYER_WINDOW: 60,

  DUST_HEIGHT: 0.12,
  DUST_COLOR: 0xa8a8a8,

  WALL_COLORS: [
    0x666666,
    0x585858,
    0x4a4a4a
  ],

  PLAYER_SPEED: 6,
  JOYSTICK_RADIUS: 50,
  BAG_CAPACITY: 1.0,

  CAMERA_HEIGHT: 1.8,
  PITCH_LIMIT: 1.5,

  TOUCH_SENSITIVITY: 0.005,
  MOUSE_SENSITIVITY: 0.0025,

  REACH: 5,

  KG_PER_SQUARE_UNIT: 0.02,
  SELL_PRICE_PER_KG: 10,

  // Baza
  BASE_X: SURFACE_SIZE / 2,
  BASE_Z: SURFACE_SIZE / 2,

  BASE_WIDTH: 18,
  BASE_DEPTH: 12,

  PAD_HALF: 2.2,
  BASE_CLEAR_MARGIN: 1.5,

  // Süpürgələr
  BRUSH_TOOLS: [
    { name: 'Diş fırçası', size: 0.4, price: 0 },
    { name: 'Kiçik fırça', size: 0.6, price: 30 },
    { name: 'Süpürgə', size: 0.9, price: 120 },
    { name: 'Geniş süpürgə', size: 1.3, price: 400 },
    { name: 'Təmizləyici', size: 1.8, price: 1200 },
  ],

  // Çanta
  BAG_LEVELS: [
    { capacity: 1, price: 0 },
    { capacity: 2, price: 25 },
    { capacity: 4, price: 90 },
    { capacity: 8, price: 300 },
    { capacity: 16, price: 900 },
  ],

  // Robot süpürgələr (0-eduegf7egfcı səviyyə = robot hələ alınmayıb)
  // size: təmizlədiyi zolağın eni (metr), speed: sürəti (metr/saniyə)
  ROBOT_LEVELS: [
    { name: 'Robot yoxdur', size: 0, speed: 0, price: 0 },
    { name: 'Robot süpürgə', size: 1.0, speed: 2.5, price: 150 },
    { name: 'Sürətli robot', size: 1.4, speed: 3.5, price: 700 },
    { name: 'Super robot', size: 2.0, speed: 5, price: 2200 },
  ],

  // Robot tozlu yeri bu məsafələrdə (metr) axtarır: əvvəl yaxında, tapmasa daha uzaqda
  ROBOT_SEARCH_RADIUS: [20, 50, 120],
};
