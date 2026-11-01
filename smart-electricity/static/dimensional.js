'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('.grid-scene');
  if (!scene) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  scene.addEventListener('pointermove', event => {
    if (motion.matches || event.pointerType === 'touch') return;
    const rect = scene.getBoundingClientRect();
    scene.style.setProperty('--turn', `${(event.clientX - rect.left) / rect.width * 12 - 6}deg`);
    scene.style.setProperty('--lean', `${(event.clientY - rect.top) / rect.height * -8 + 4}deg`);
  });
  scene.addEventListener('pointerleave', () => {
    scene.style.setProperty('--turn', '0deg');
    scene.style.setProperty('--lean', '0deg');
  });
});
