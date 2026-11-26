import { copyToClipboard } from './clipboard.js';

/**
 * Pure colour conversion and WCAG contrast utilities
 */

// Parse HEX to {r, g, b}
export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return null;
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Convert {r, g, b} to #rrggbb
export function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

// Convert {r, g, b} to {h, s, l} (h: 0-360, s: 0-100, l: 0-100)
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Convert {h, s, l} to {r, g, b}
export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

// Parse RGB string like "rgb(124, 58, 237)" or "124, 58, 237"
export function parseRgbString(str) {
  if (!str) return null;
  const m = str.match(/(?:rgb\s*\(\s*)?(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)?/i);
  if (!m) return null;
  const r = parseInt(m[1], 10);
  const g = parseInt(m[2], 10);
  const b = parseInt(m[3], 10);
  if (r > 255 || g > 255 || b > 255) return null;
  return { r, g, b };
}

// Parse HSL string like "hsl(262, 83%, 58%)" or "262, 83, 58"
export function parseHslString(str) {
  if (!str) return null;
  const m = str.match(/(?:hsl\s*\(\s*)?(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)?/i);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const s = parseInt(m[2], 10);
  const l = parseInt(m[3], 10);
  if (s > 100 || l > 100) return null;
  return { h, s, l };
}

// WCAG relative luminance
export function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// WCAG contrast ratio between two colors
export function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getWcagBadge(ratio) {
  if (ratio >= 7.0) {
    return { label: 'AAA', level: 'aaa', isPass: true };
  } else if (ratio >= 4.5) {
    return { label: 'AA', level: 'aa', isPass: true };
  } else if (ratio >= 3.0) {
    return { label: 'AA Large', level: 'aa-large', isPass: true };
  } else {
    return { label: 'Fail', level: 'fail', isPass: false };
  }
}

export function initColor() {
  const picker = document.getElementById('colorPickerInput');
  const hexInput = document.getElementById('colorHexInput');
  const rgbInput = document.getElementById('colorRgbInput');
  const hslInput = document.getElementById('colorHslInput');
  const activeColorName = document.getElementById('activeColorName');
  const swatch = document.getElementById('colorSwatchPreview');
  const contrastBadge = document.getElementById('colorContrastBadge');
  const contrastWhiteRatio = document.getElementById('contrastWhiteRatio');
  const contrastWhiteBadge = document.getElementById('contrastWhiteBadge');
  const contrastBlackRatio = document.getElementById('contrastBlackRatio');
  const contrastBlackBadge = document.getElementById('contrastBlackBadge');
  const copyHexBtn = document.getElementById('colorCopyHexBtn');
  const copyRgbBtn = document.getElementById('colorCopyRgbBtn');
  const copyHslBtn = document.getElementById('colorCopyHslBtn');
  const randomBtn = document.getElementById('colorRandomBtn');
  const clearBtn = document.getElementById('colorClearBtn');
  const statusLine = document.getElementById('colorStatus');

  if (!picker || !hexInput) return;

  function updateFromRgb(rgb, source = 'all') {
    if (!rgb) return;
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    if (source !== 'picker') picker.value = hex;
    if (source !== 'hex') hexInput.value = hex;
    if (source !== 'rgb') rgbInput.value = rgbStr;
    if (source !== 'hsl') hslInput.value = hslStr;

    if (activeColorName) activeColorName.textContent = hex;
    if (swatch) swatch.style.backgroundColor = hex;

    // Contrast against White (#FFF) and Black (#000)
    const whiteRgb = { r: 255, g: 255, b: 255 };
    const blackRgb = { r: 0, g: 0, b: 0 };
    const ratioWhite = getContrastRatio(rgb, whiteRgb);
    const ratioBlack = getContrastRatio(rgb, blackRgb);

    const badgeWhite = getWcagBadge(ratioWhite);
    const badgeBlack = getWcagBadge(ratioBlack);

    if (contrastWhiteRatio) contrastWhiteRatio.textContent = `${ratioWhite.toFixed(2)} : 1`;
    if (contrastWhiteBadge) {
      contrastWhiteBadge.textContent = badgeWhite.label;
      contrastWhiteBadge.className = `badge ${badgeWhite.isPass ? 'badge-success' : 'badge-error'}`;
    }

    if (contrastBlackRatio) contrastBlackRatio.textContent = `${ratioBlack.toFixed(2)} : 1`;
    if (contrastBlackBadge) {
      contrastBlackBadge.textContent = badgeBlack.label;
      contrastBlackBadge.className = `badge ${badgeBlack.isPass ? 'badge-success' : 'badge-error'}`;
    }

    if (contrastBadge) {
      if (ratioWhite >= 4.5 && ratioBlack >= 4.5) {
        contrastBadge.textContent = 'WCAG AA on Both';
        contrastBadge.className = 'badge badge-success';
      } else if (ratioWhite >= 7.0 || ratioBlack >= 7.0) {
        contrastBadge.textContent = 'WCAG AAA';
        contrastBadge.className = 'badge badge-success';
      } else if (ratioWhite >= 4.5 || ratioBlack >= 4.5) {
        contrastBadge.textContent = 'WCAG AA';
        contrastBadge.className = 'badge badge-success';
      } else {
        contrastBadge.textContent = 'Low Contrast';
        contrastBadge.className = 'badge badge-warning';
      }
    }

    if (statusLine) {
      statusLine.textContent = `Luminance: ${(getLuminance(rgb.r, rgb.g, rgb.b) * 100).toFixed(1)}%`;
      statusLine.className = 'status-line';
    }
  }

  // Event Listeners
  picker.addEventListener('input', () => {
    const rgb = hexToRgb(picker.value);
    updateFromRgb(rgb, 'picker');
  });

  hexInput.addEventListener('input', () => {
    const rgb = hexToRgb(hexInput.value);
    if (rgb) {
      updateFromRgb(rgb, 'hex');
    } else {
      if (statusLine) {
        statusLine.textContent = 'Invalid HEX code (use #RGB or #RRGGBB)';
        statusLine.className = 'status-line error';
      }
    }
  });

  rgbInput.addEventListener('input', () => {
    const rgb = parseRgbString(rgbInput.value);
    if (rgb) {
      updateFromRgb(rgb, 'rgb');
    } else {
      if (statusLine) {
        statusLine.textContent = 'Invalid RGB format (e.g. rgb(124, 58, 237))';
        statusLine.className = 'status-line error';
      }
    }
  });

  hslInput.addEventListener('input', () => {
    const hsl = parseHslString(hslInput.value);
    if (hsl) {
      const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      updateFromRgb(rgb, 'hsl');
    } else {
      if (statusLine) {
        statusLine.textContent = 'Invalid HSL format (e.g. hsl(262, 83%, 58%))';
        statusLine.className = 'status-line error';
      }
    }
  });

  // Copy Buttons
  if (copyHexBtn) {
    copyHexBtn.addEventListener('click', () => {
      copyToClipboard(hexInput.value, copyHexBtn, 'HEX code copied!');
    });
  }

  if (copyRgbBtn) {
    copyRgbBtn.addEventListener('click', () => {
      copyToClipboard(rgbInput.value, copyRgbBtn, 'RGB value copied!');
    });
  }

  if (copyHslBtn) {
    copyHslBtn.addEventListener('click', () => {
      copyToClipboard(hslInput.value, copyHslBtn, 'HSL value copied!');
    });
  }

  // Random colour generator
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      updateFromRgb({ r, g, b });
    });
  }

  // Reset to default
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      updateFromRgb({ r: 124, g: 58, b: 237 });
    });
  }

  // Initial load
  updateFromRgb({ r: 124, g: 58, b: 237 });
}
