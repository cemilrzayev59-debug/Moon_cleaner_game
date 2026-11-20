// Three.js bütün fayllar üçün bir yerdən çağırılır.
// Kitabxananı boot.js yükləyir (bir neçə ünvandan cəhd edir) və window.__THREE__ içinə qoyur.
// Oyunda yeni bir Three.js sinfi işlədəndə, onun adını aşağıdakı siyahıya da əlavə et.grhugrgr
const THREE_LIBRARY = window.__THREE__;

if (!THREE_LIBRARY) {
  throw new Error('Three.js yüklənməyib: boot.js kitabxananı əvvəlcədən yükləməlidir');
}

export const {
  AmbientLight, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, Clock, Color,
  CylinderGeometry, DirectionalLight, DoubleSide, Group, LinearFilter, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Points, PointsMaterial, RepeatWrapping,
  SRGBColorSpace, Scene, SphereGeometry, Sprite, SpriteMaterial, Vector3, WebGLRenderer,
} = THREE_LIBRARY;
