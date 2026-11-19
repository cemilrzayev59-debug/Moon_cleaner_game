// Oyun başlayanda "Telefon yoxsa Kompüter?" ekranını göstərir.
// Seçim edilən kimi onChosen('phone') və ya onChosen('pc') çağırılır.
export function chooseDevice(onChosen) {
  const screen = document.getElementById('start-screen');
  const phoneButton = document.getElementById('choose-phone');
  const pcButton = document.getElementById('choose-pc');
  let chosen = false;

  // Toxunuşlu ekran varsa telefonu, yoxdursa kompüteri tövsiyə edirik
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  if (isTouchDevice) {
    phoneButton.classList.add('suggested');
  } else {
    pcButton.classList.add('suggested');
  }

  function pick(device) {
    if (chosen) { return; }
    chosen = true;
    document.body.classList.add('device-' + device);
    screen.classList.add('hidden');
    onChosen(device);
  }

  phoneButton.addEventListener('pointerup', () => { pick('phone'); });
  pcButton.addEventListener('pointerup', () => { pick('pc'); });
}
