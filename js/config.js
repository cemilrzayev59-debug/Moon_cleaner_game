const CELL = 0.25;          // bir toz kvadratının ölçüsü (dünya vahidi)
const SURFACE_SIZE = 192;   // dünyanın təkrarlandığı ölçü (CELL-ə və 128-ə bölünməlidir)

export const CONFIG = {
  VERSION: 'v0.7.1',

  CELL,
  SURFACE_SIZE,
  GRID: SURFACE_SIZE / CELL,   // bir tərəfdə neçə toz kvadratı var (768)
  WINDOW_CELLS: 96,            // oyunçunun ətrafındakı 3D qutu sahəsi (cüt ədəd olmalıdır)
  FAR_SIZE: 2000,              // uzaqdakı yastı toz təbəqəsi
  DUST_HEIGHT: 0.3,            // toz qatının qalınlığı
  DUST_COLOR: 0xa8a8a8,        // tozun rəngi (tək rəng; açıq = daha ağımtıl)

  PLAYER_SPEED: 15,
  JOYSTICK_RADIUS: 50,
  BAG_CAPACITY: 1.0, // 1 kq

  CAMERA_HEIGHT: 1.8,
  PITCH_LIMIT: 1.5,

  BRUSH_CELLS: 3,    // fırçanın ağzı: 3x3 kvadrat (0.75 vahid)
  REACH: 5,          // fırça nə qədər uzağa çatır
  CELL_YIELD: 0.002, // bir kvadratı təmizləyəndə çantaya düşən toz (kq); kiçik = çanta yavaş dolur
};
