import { createStore, useStore } from './store';

// Appearance: Light, Dark, or follow the device (System). Saved per device — like the desktop
// notifications switch — and applied before first paint by public/theme-init.js.
export type ThemePref = 'light' | 'dark' | 'system';

const KEY = 'grove.theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

const themeStore = createStore<ThemePref>(readPref());

function apply() {
  const pref = themeStore.get();
  const dark = pref === 'dark' || (pref === 'system' && media.matches);
  const root = document.documentElement;
  if (root.classList.contains('dark') !== dark) {
    // Swap the whole page at once: without this, elements with colour transitions fade on their own.
    root.classList.add('theme-switching');
    root.classList.toggle('dark', dark);
    void getComputedStyle(root).color; // apply the new colours before transitions come back
    requestAnimationFrame(() => root.classList.remove('theme-switching'));
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#242526' : '#0866FF');
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    /* private mode: still switch for this visit */
  }
  themeStore.set(() => pref);
  apply();
}

export const useThemePref = () => useStore(themeStore, (s) => s);

// Follow the device when it switches (e.g. automatic dark mode at sunset), and other tabs.
media.addEventListener('change', apply);
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    themeStore.set(readPref);
    apply();
  }
});
apply();
