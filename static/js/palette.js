/**
 * Command Palette (Ctrl/Cmd + K) with fuzzy search
 */
function fuzzyMatch(text, query) {
  if (!query) return true;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return true;
  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) qIdx++;
  }
  return qIdx === q.length;
}

export function initPalette(tools, onSelectTool) {
  const backdrop = document.getElementById('paletteModal');
  const input = document.getElementById('paletteInput');
  const resultsList = document.getElementById('paletteResults');
  const openBtn = document.getElementById('openPaletteBtn');

  if (!backdrop || !input || !resultsList) return;

  let selectedIndex = 0;
  let filteredTools = [...tools];

  function openPalette() {
    backdrop.classList.add('open');
    input.value = '';
    selectedIndex = 0;
    renderResults();
    setTimeout(() => input.focus(), 50);
  }

  function closePalette() {
    backdrop.classList.remove('open');
  }

  function renderResults() {
    const query = input.value.trim().toLowerCase();
    filteredTools = tools.filter(t => {
      if (!query) return true;
      return fuzzyMatch(t.label, query) || fuzzyMatch(t.id, query) || (t.shortcut && t.shortcut.toLowerCase().includes(query));
    });

    if (selectedIndex >= filteredTools.length) {
      selectedIndex = Math.max(0, filteredTools.length - 1);
    }

    resultsList.innerHTML = '';
    if (filteredTools.length === 0) {
      resultsList.innerHTML = `<li style="padding: 16px; color: var(--text-muted); text-align: center;">No matching tools found</li>`;
      return;
    }

    filteredTools.forEach((tool, index) => {
      const li = document.createElement('li');
      li.className = `palette-item ${index === selectedIndex ? 'selected' : ''}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', index === selectedIndex ? 'true' : 'false');
      li.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 16px;">${tool.icon}</span>
          <span style="font-weight: 500;">${tool.label}</span>
        </div>
        <span class="kbd-badge">${tool.shortcut || ''}</span>
      `;

      li.addEventListener('click', () => {
        onSelectTool(tool.id);
        closePalette();
      });

      resultsList.appendChild(li);
    });
  }

  input.addEventListener('input', () => {
    selectedIndex = 0;
    renderResults();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredTools.length > 0) {
        selectedIndex = (selectedIndex + 1) % filteredTools.length;
        renderResults();
        ensureVisible();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredTools.length > 0) {
        selectedIndex = (selectedIndex - 1 + filteredTools.length) % filteredTools.length;
        renderResults();
        ensureVisible();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[selectedIndex]) {
        onSelectTool(filteredTools[selectedIndex].id);
        closePalette();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    }
  });

  function ensureVisible() {
    const items = resultsList.querySelectorAll('.palette-item');
    if (items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  // Backdrop click to close
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closePalette();
    }
  });

  if (openBtn) {
    openBtn.addEventListener('click', openPalette);
  }

  return { openPalette, closePalette };
}
