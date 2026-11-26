// Sistem Tema Multi-Buku Kas
// 1. SERVIS: Tema Biru
// 2. WIFI: Tema Pink
// 3. PRIBADI: Bisa pilih selera (Ungu, Hijau, Oranye, Hitam Slate, Toska, Merah)

export const THEMES = {
  SERVIS: {
    id: 'SERVIS',
    name: 'Biru (Service)',
    headerGradient: 'from-blue-600 via-sky-600 to-blue-500',
    primaryBg: 'bg-blue-600',
    primaryText: 'text-blue-600',
    fabGradient: 'from-blue-600 to-sky-500',
    activeTab: 'text-blue-600',
    accentBorder: 'border-blue-500',
    badgeBg: 'bg-blue-50 text-blue-700'
  },
  WIFI: {
    id: 'WIFI',
    name: 'Pink (WiFi)',
    headerGradient: 'from-pink-600 via-rose-500 to-pink-500',
    primaryBg: 'bg-pink-600',
    primaryText: 'text-pink-600',
    fabGradient: 'from-pink-600 to-rose-500',
    activeTab: 'text-pink-600',
    accentBorder: 'border-pink-500',
    badgeBg: 'bg-pink-50 text-pink-700'
  }
};

export const PRIBADI_PALETTES = {
  purple: {
    id: 'purple',
    name: 'Ungu Elegan',
    colorHex: '#9333ea',
    headerGradient: 'from-purple-600 via-indigo-600 to-purple-500',
    primaryBg: 'bg-purple-600',
    primaryText: 'text-purple-600',
    fabGradient: 'from-purple-600 to-indigo-500',
    activeTab: 'text-purple-600',
    accentBorder: 'border-purple-500',
    badgeBg: 'bg-purple-50 text-purple-700'
  },
  emerald: {
    id: 'emerald',
    name: 'Hijau Emerald',
    colorHex: '#059669',
    headerGradient: 'from-emerald-600 via-teal-600 to-emerald-500',
    primaryBg: 'bg-emerald-600',
    primaryText: 'text-emerald-600',
    fabGradient: 'from-emerald-600 to-teal-500',
    activeTab: 'text-emerald-600',
    accentBorder: 'border-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-700'
  },
  amber: {
    id: 'amber',
    name: 'Oranye Emas',
    colorHex: '#d97706',
    headerGradient: 'from-amber-600 via-orange-500 to-amber-500',
    primaryBg: 'bg-amber-600',
    primaryText: 'text-amber-600',
    fabGradient: 'from-amber-600 to-orange-500',
    activeTab: 'text-amber-600',
    accentBorder: 'border-amber-500',
    badgeBg: 'bg-amber-50 text-amber-700'
  },
  dark: {
    id: 'dark',
    name: 'Hitam Elegan',
    colorHex: '#1e293b',
    headerGradient: 'from-slate-900 via-slate-800 to-slate-900',
    primaryBg: 'bg-slate-900',
    primaryText: 'text-slate-900',
    fabGradient: 'from-slate-800 to-slate-950',
    activeTab: 'text-slate-900',
    accentBorder: 'border-slate-800',
    badgeBg: 'bg-slate-100 text-slate-800'
  },
  teal: {
    id: 'teal',
    name: 'Toska Modern',
    colorHex: '#0d9488',
    headerGradient: 'from-teal-600 via-cyan-600 to-teal-500',
    primaryBg: 'bg-teal-600',
    primaryText: 'text-teal-600',
    fabGradient: 'from-teal-600 to-cyan-500',
    activeTab: 'text-teal-600',
    accentBorder: 'border-teal-500',
    badgeBg: 'bg-teal-50 text-teal-700'
  },
  rose: {
    id: 'rose',
    name: 'Merah Berani',
    colorHex: '#e11d48',
    headerGradient: 'from-rose-600 via-red-600 to-rose-500',
    primaryBg: 'bg-rose-600',
    primaryText: 'text-rose-600',
    fabGradient: 'from-rose-600 to-red-500',
    activeTab: 'text-rose-600',
    accentBorder: 'border-rose-500',
    badgeBg: 'bg-rose-50 text-rose-700'
  }
};

const STORAGE_KEY = 'bukukas_pribadi_theme';

export const getStoredPribadiTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'purple';
  } catch {
    return 'purple';
  }
};

export const savePribadiTheme = (themeId) => {
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch (e) {
    console.error(e);
  }
};

export const getCurrentTheme = (book, pribadiPaletteId = 'purple') => {
  if (book === 'WIFI') return THEMES.WIFI;
  if (book === 'SERVIS') return THEMES.SERVIS;
  return PRIBADI_PALETTES[pribadiPaletteId] || PRIBADI_PALETTES.purple;
};
