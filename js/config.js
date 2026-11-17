// Oyunun bütün sabit ədədləri
export const CONFIG = {
  VERSION: 'v0.2.1', // Versiyanı artırdıq ki, dəyişikliyi görəsən

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

  // Toz sistemi (DÜZƏLİŞ EDİLDİ)
  DUST_COUNT: 150,          // Səthdə neçə toz ləkəsi olsun
  DUST_RADIUS: 2.0,         // Toz ləkəsinin ölçüsü (bir az böyütdük)
  CLEAN_DISTANCE: 4.0,      // Oyunçu toza daha uzaqdan təmizləyə bilər
  CLEAN_SPEED: 5.0,         // Toz daha sürətlə yox olur (toxunanda dərhal hiss olunsun)
  DUST_YIELD: 1,            // Bir toz ləkəsi neçə vahid çanta doldurur
};
