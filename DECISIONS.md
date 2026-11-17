# DECISIONS — Razılaşdırılmış qərarlar

## Texnologiya
- **Dil:** Saf JavaScript, ES modulları. TypeScript YOX.
- **3D:** Three.js **0.160.0**, CDN-dən importmap ilə.
- **Build aləti YOXDUR** — npm, Vite, webpack istifadə olunmur.
- **Hosting:** GitHub Pages.
- **Saxlama:** localStorage, JSON.

## Qovluq strukturu
- Bir HTML faylına yığma YOXDUR.
- css/ — bütün üslublar style.css-də.
- js/ — hər fayl tək məsuliyyət daşıyır, təxminən 150 sətirdən az.
- assets/ — yalnız CC0 resurslar.

## Kodlaşdırma qaydaları
- if, for, while həmişə {} ilə yazılır.
- Bit hiylələri istifadə olunmur.
- Funksiya adları Azərbaycan dilində, dəyişənlər qarışıq.
- Hər funksiyanın üstündə qısa Azərbaycanca şərh.

## İdarəetmə
- Sol aşağı: virtual joystick.
- Sağ tərəf: kamera sürüşdürmə.
- Sağ aşağı: təmizləmə düyməsi (basılı tutulur).
- Kamera: Birinci şəxs (First-Person).

## Oyun məntiqi
- GameState yalnız js/state.js-də.
- state.js Three.js import etmir və DOM-a toxunmur.
- Bütün dəyişikliklər funksiyalarla.

## Multiplayer
- Yalnız v1.0 bitəndən sonra başlayacaq.
