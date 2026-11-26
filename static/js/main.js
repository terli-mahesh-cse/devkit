import { storage } from './storage.js';
import { initPalette } from './palette.js';
import { initCounter } from './counter.js';
import { initJson } from './json.js';
import { initCase } from './case.js';
import { initBase64 } from './base64.js';
import { initColor } from './color.js';
import { initUrlenc } from './urlenc.js';
import { initUuid } from './uuid.js';
import { initTimestamp } from './timestamp.js';
import { initHash } from './hash.js';

// Tool Registry
export const TOOLS = [
  { id: 'counter', label: 'Word Counter', icon: '📝', shortcut: 'Alt+1', init: initCounter },
  { id: 'json', label: 'JSON Formatter', icon: '{ }', shortcut: 'Alt+2', init: initJson },
  { id: 'case', label: 'Case Converter', icon: 'Aa', shortcut: 'Alt+3', init: initCase },
  { id: 'base64', label: 'Base64', icon: '64', shortcut: 'Alt+4', init: initBase64 },
  { id: 'color', label: 'Colour Picker', icon: '🎨', shortcut: 'Alt+5', init: initColor },
  { id: 'urlenc', label: 'URL Encode', icon: '🔗', shortcut: 'Alt+6', init: initUrlenc },
  { id: 'uuid', label: 'UUID Generator', icon: '🆔', shortcut: 'Alt+7', init: initUuid },
  { id: 'timestamp', label: 'Timestamp', icon: '⏱️', shortcut: 'Alt+8', init: initTimestamp },
  { id: 'hash', label: 'Hash Generator', icon: '#️⃣', shortcut: 'Alt+9', init: initHash },
];

let activeToolId = null;
const initializedTools = new Set();

// 1. Theme Setup
function initTheme() {
  const savedTheme = storage.get('devkit:theme');
  let currentTheme = savedTheme;

  if (!currentTheme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme = prefersDark ? 'dark' : 'light';
  }

  applyTheme(currentTheme);

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      storage.set('devkit:theme', nextTheme);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeLabel = document.getElementById('themeLabel');
  const themeIcon = document.getElementById('themeIcon');
  if (themeLabel) {
    themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
  }
  if (themeIcon) {
    if (theme === 'dark') {
      themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    } else {
      themeIcon.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    }
  }
}

// 2. Favourites & Navigation List
function getFavorites() {
  return storage.get('devkit:favorites', []);
}

function toggleFavorite(toolId) {
  let favs = getFavorites();
  if (favs.includes(toolId)) {
    favs = favs.filter(id => id !== toolId);
  } else {
    favs.push(toolId);
  }
  storage.set('devkit:favorites', favs);
  renderNavigation();
  requestAnimationFrame(updatePillPosition);
}

function renderNavigation() {
  const navList = document.getElementById('navList');
  if (!navList) return;

  const favs = getFavorites();
  // Favorites pinned to top
  const sortedTools = [...TOOLS].sort((a, b) => {
    const aFav = favs.includes(a.id);
    const bFav = favs.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0; // maintain relative registry order
  });

  navList.innerHTML = '';

  sortedTools.forEach(tool => {
    const isFav = favs.includes(tool.id);
    const isSelected = tool.id === activeToolId;

    const li = document.createElement('li');
    li.className = 'nav-item';
    li.dataset.toolId = tool.id;

    li.innerHTML = `
      <button class="nav-link" id="tab-${tool.id}" role="tab" aria-controls="panel-${tool.id}" aria-selected="${isSelected ? 'true' : 'false'}" type="button">
        <span class="nav-icon" aria-hidden="true">${tool.icon}</span>
        <span class="nav-label">${tool.label}</span>
        <span class="nav-shortcut">${tool.shortcut}</span>
        <span class="fav-star ${isFav ? 'is-fav' : ''}" role="button" aria-label="${isFav ? 'Unpin favorite' : 'Pin favorite'}" title="${isFav ? 'Unpin favorite' : 'Pin favorite'}" tabindex="0">${isFav ? '★' : '☆'}</span>
      </button>
    `;

    const btn = li.querySelector('.nav-link');
    btn.addEventListener('click', (e) => {
      if (e.target.closest('.fav-star')) return;
      switchToTool(tool.id);
    });

    const starBtn = li.querySelector('.fav-star');
    starBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(tool.id);
    });
    starBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(tool.id);
      }
    });

    navList.appendChild(li);
  });
}

// 3. Sliding Pill Highlight
function updatePillPosition() {
  const pill = document.getElementById('navHighlightPill');
  const activeLi = document.querySelector(`.nav-item[data-tool-id="${activeToolId}"]`);
  const navList = document.getElementById('navList');

  if (!pill || !activeLi || !navList) return;

  const isMobile = window.innerWidth <= 768;
  const listRect = navList.getBoundingClientRect();
  const itemRect = activeLi.getBoundingClientRect();

  if (isMobile) {
    const offsetLeft = itemRect.left - listRect.left + navList.scrollLeft;
    pill.style.width = `${itemRect.width}px`;
    pill.style.height = `${itemRect.height}px`;
    pill.style.transform = `translate3d(${offsetLeft}px, 0, 0)`;
  } else {
    const offsetTop = itemRect.top - listRect.top + navList.scrollTop;
    pill.style.width = '100%';
    pill.style.height = `${itemRect.height}px`;
    pill.style.transform = `translate3d(0, ${offsetTop}px, 0)`;
  }
}

// 4. Tool Switching
export function switchToTool(toolId, updateHistory = true) {
  const tool = TOOLS.find(t => t.id === toolId);
  if (!tool) return;

  const oldToolId = activeToolId;
  activeToolId = toolId;

  // Persist last tool
  storage.set('devkit:lastTool', toolId);

  // Sync hash
  if (updateHistory && window.location.hash !== `#${toolId}`) {
    history.replaceState(null, '', `#${toolId}`);
  }

  // Update tabs aria-selected
  document.querySelectorAll('.nav-link').forEach(link => {
    const isCurrent = link.id === `tab-${toolId}`;
    link.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  });

  const oldPanel = oldToolId ? document.getElementById(`panel-${oldToolId}`) : null;
  const newPanel = document.getElementById(`panel-${toolId}`);

  if (oldPanel && oldPanel !== newPanel) {
    oldPanel.classList.add('switching-out');
    setTimeout(() => {
      oldPanel.classList.remove('active', 'switching-out');
      if (newPanel) {
        newPanel.classList.add('active');
      }
    }, 150);
  } else if (newPanel) {
    document.querySelectorAll('.tool-card').forEach(p => p.classList.remove('active', 'switching-out'));
    newPanel.classList.add('active');
  }

  // Lazy init tool
  if (!initializedTools.has(toolId)) {
    initializedTools.add(toolId);
    try {
      tool.init();
    } catch (err) {
      console.error(`Error initializing tool ${toolId}:`, err);
    }
  }

  requestAnimationFrame(updatePillPosition);
}

// 5. Hash Routing & Initial Tool
function initRouting() {
  function getInitialToolId() {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && TOOLS.some(t => t.id === hash)) {
      return hash;
    }
    const lastTool = storage.get('devkit:lastTool');
    if (lastTool && TOOLS.some(t => t.id === lastTool)) {
      return lastTool;
    }
    return 'counter';
  }

  switchToTool(getInitialToolId(), true);

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && TOOLS.some(t => t.id === hash) && hash !== activeToolId) {
      switchToTool(hash, false);
    }
  });

  window.addEventListener('resize', updatePillPosition);
}

// 6. Keyboard Shortcuts & Modals
function initKeyboardAndModals() {
  const shortcutsModal = document.getElementById('shortcutsModal');
  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const closeShortcutsBtn = document.getElementById('closeShortcutsBtn');
  const closeShortcutsBottomBtn = document.getElementById('closeShortcutsBottomBtn');

  function openShortcuts() {
    if (shortcutsModal) shortcutsModal.classList.add('open');
  }

  function closeShortcuts() {
    if (shortcutsModal) shortcutsModal.classList.remove('open');
  }

  if (shortcutsBtn) shortcutsBtn.addEventListener('click', openShortcuts);
  if (closeShortcutsBtn) closeShortcutsBtn.addEventListener('click', closeShortcuts);
  if (closeShortcutsBottomBtn) closeShortcutsBottomBtn.addEventListener('click', closeShortcuts);
  if (shortcutsModal) {
    shortcutsModal.addEventListener('click', (e) => {
      if (e.target === shortcutsModal) closeShortcuts();
    });
  }

  // Palette init
  const palette = initPalette(TOOLS, (toolId) => {
    switchToTool(toolId);
  });

  // Global keydown
  window.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    );

    // Escape closes modals
    if (e.key === 'Escape') {
      closeShortcuts();
      if (palette) palette.closePalette();
      return;
    }

    // Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette) palette.openPalette();
      return;
    }

    // Alt + 1..9
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const index = parseInt(e.key, 10) - 1;
      if (index >= 0 && index < TOOLS.length) {
        switchToTool(TOOLS[index].id);
      }
      return;
    }

    // '?' opens shortcuts (when not typing)
    if (e.key === '?' && !isTyping && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      openShortcuts();
    }
  });
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderNavigation();
  initRouting();
  initKeyboardAndModals();
});
