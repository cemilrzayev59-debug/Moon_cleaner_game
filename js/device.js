// Cihazı özü təyin edir: toxunuşlu ekran varsa 'phone', yoxdursa 'pc'.
// Test üçün linkin sonuna ?device=phone və ya ?device=pc yazmaq olar.
// Seçilən cihaza uyğun "device-phone" və ya "device-pc" sinfi səhifəyə əlavə olunur.
export function detectDevice() {
  const params = new URLSearchParams(window.location.search);
  const forced = params.get('device');

  let device = 'pc';
  if (forced === 'phone' || forced === 'pc') {
    device = forced;
  } else if (window.matchMedia('(pointer: coarse)').matches) {
    device = 'phone';
  }

  document.body.classList.add('device-' + device);
  return device;
}
