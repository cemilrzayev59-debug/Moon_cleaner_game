// Oyunun bütün sabit ədədləri
export const CONFIG = {
  VERSION: 'v0.2',

  // Ay səthi
  MOON_RADIUS: 60,

  // Oyunçu
  PLAYER_SPEED: 6,          // vahid/saniyə

  // Kamera
  CAMERA_DISTANCE: 8,
  CAMERA_HEIGHT: 5,

  // Joystick
  JOYSTICK_RADIUS: 50,      // piksel (maksimum sürüşmə)

  // Çanta
  BAG_CAPACITY: 100,

  // Toz sistemi (YENİ)
  DUST_COUNT: 150,          // Səthdə neçə toz ləkəsi olsun
  DUST_RADIUS: 1.5,         // Bir toz ləkəsinin ölçüsü
  CLEAN_DISTANCE: 2.5,      // Oyunçu toza nə qədər yaxın olanda təmizləyə bilər
  CLEAN_SPEED: 1.5,         // Bir ləkənin nə qədər sürətlə yox olması (saniyə)
  DUST_YIELD: 1,            // Bir toz ləkəsi neçə vahid çanta doldurur
};
