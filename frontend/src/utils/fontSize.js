export const FONT_SIZES = [
  { id: 'sm', label: 'Kecil', scale: '14px', badge: 'A-' },
  { id: 'base', label: 'Normal', scale: '16px', badge: 'A' },
  { id: 'lg', label: 'Besar', scale: '18px', badge: 'A+' },
  { id: 'xl', label: 'Sgt Besar', scale: '20px', badge: 'A++' }
];

export const getStoredFontSize = (role) => {
  if (typeof window === 'undefined') return 'base';
  if (role) {
    const roleSize = localStorage.getItem(`saldoku_font_size_${role}`);
    if (roleSize) return roleSize;
  }
  return localStorage.getItem('saldoku_font_size') || 'base';
};

export const applyFontSize = (sizeId, role) => {
  if (typeof window === 'undefined') return;
  const found = FONT_SIZES.find(f => f.id === sizeId) || FONT_SIZES[1];
  document.documentElement.style.fontSize = found.scale;
  localStorage.setItem('saldoku_font_size', found.id);
  if (role) {
    localStorage.setItem(`saldoku_font_size_${role}`, found.id);
  }
};
