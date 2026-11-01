 'use strict';
(() => {
  let mode = 'dark';
  try { mode = localStorage.getItem('electricity-theme') || 'dark'; } catch {}
  document.documentElement.dataset.theme = mode === 'light' ? 'light' : 'dark';
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.createElement('button');
    button.id = 'theme-toggle'; button.type = 'button';
    const label = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      button.textContent = dark ? 'Light mode' : 'Dark mode';
      button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      button.setAttribute('aria-pressed', String(dark));
    };
    label(); document.querySelector('header').append(button);
    button.addEventListener('click', () => {
      document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('electricity-theme', document.documentElement.dataset.theme); } catch {}
      label(); window.dispatchEvent(new Event('themechange'));
    });
  });
})();
