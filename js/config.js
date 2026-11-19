const CELL = 0.15;          // təmizlik izləmə şəbəkəsinin xana ölçüsü (dünya vahidi)
const SURFACE_SIZE = 192;   // dünyanın təkrarlandığı ölçü

export const CONFIG = {
  VERSION: 'v0.8.1',

  CELL,
  SURFACE_SIZE,
  GRID: Math.round(SURFACE_SIZE / CELL), // 1280 (128-ə bölünməlidir, xəritə üçün)
  FAR_SIZE: 2000,              // uzaqdakı toz təbəqəsi
  LAYER_WINDOW: 60,            // yaxında divar effekti görünən sahə
  DUST_HEIGHT: 0.12,           // toz qatının qalınlığı
  DUST_COLOR: 0xa8a8a8,        // tozun rəngi (tək rəng)
  WALL_COLORS: [0x666666, 0x585858, 0x4a4a4a], // tozun yan divarı (yuxarıdan aşağı)

  PLAYER_SPEED: 15,
  JOYSTICK_RADIUS: 50,
  BAG_CAPACITY: 1.0, // 1 kq

  CAMERA_HEIGHT: 1.8,
  PITCH_LIMIT: 1.5,

  BRUSH_SIZE: 0.8,   // fırçanın ağzı: düz kvadrat (en və uzunluq eynidir)
  REACH: 5,          // fırça nə qədər uzağa çatır
  KG_PER_SQUARE_UNIT: 0.02, // 1 kvadrat vahid təmizləyəndə düşən toz (kq); kiçik = çanta yavaş dolur
};
