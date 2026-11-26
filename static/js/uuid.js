import { copyToClipboard } from './clipboard.js';

export function generateUuidV4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateMultipleUuids(count = 1) {
  const n = Math.max(1, Math.min(20, count));
  const list = [];
  for (let i = 0; i < n; i++) {
    list.push(generateUuidV4());
  }
  return list;
}

export function initUuid() {
  const rangeInput = document.getElementById('uuidRangeInput');
  const countInput = document.getElementById('uuidCountInput');
  const outputContainer = document.getElementById('uuidOutputContainer');
  const badge = document.getElementById('uuidBadge');
  const generateBtn = document.getElementById('uuidGenerateBtn');
  const copyAllBtn = document.getElementById('uuidCopyAllBtn');
  const clearBtn = document.getElementById('uuidClearBtn');
  const statusLine = document.getElementById('uuidStatus');

  if (!outputContainer) return;

  let currentUuids = [];

  function syncCount(val) {
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 1;
    num = Math.max(1, Math.min(20, num));
    if (rangeInput) rangeInput.value = num;
    if (countInput) countInput.value = num;
    return num;
  }

  function renderList(uuids) {
    currentUuids = uuids;
    outputContainer.innerHTML = '';

    if (uuids.length === 0) {
      outputContainer.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 24px;">No UUIDs generated yet. Click "Generate New UUIDs".</div>`;
      if (badge) {
        badge.textContent = 'RFC 4122';
        badge.className = 'badge badge-neutral';
      }
      return;
    }

    uuids.forEach((id, index) => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 13px;';
      
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
          <span style="color: var(--text-muted); font-size: 11px; width: 22px;">#${index + 1}</span>
          <span style="user-select: all; word-break: break-all;">${id}</span>
        </div>
        <button class="btn btn-secondary btn-copy" type="button" style="padding: 4px 10px; font-size: 12px; min-height: 32px;">Copy</button>
      `;

      const copyBtn = row.querySelector('.btn-copy');
      copyBtn.addEventListener('click', () => {
        copyToClipboard(id, copyBtn, 'UUID copied!');
      });

      outputContainer.appendChild(row);
    });

    if (badge) {
      badge.textContent = `${uuids.length} ${uuids.length === 1 ? 'UUID' : 'UUIDs'}`;
      badge.className = 'badge badge-success';
    }

    if (statusLine) {
      statusLine.textContent = `Generated ${uuids.length} unique UUID v4 strings.`;
      statusLine.className = 'status-line success';
    }
  }

  function handleGenerate() {
    const count = syncCount(countInput ? countInput.value : 5);
    const list = generateMultipleUuids(count);
    renderList(list);
  }

  if (rangeInput) {
    rangeInput.addEventListener('input', (e) => syncCount(e.target.value));
  }
  if (countInput) {
    countInput.addEventListener('input', (e) => syncCount(e.target.value));
  }

  if (generateBtn) generateBtn.addEventListener('click', handleGenerate);

  if (copyAllBtn) {
    copyAllBtn.addEventListener('click', () => {
      if (currentUuids.length === 0) {
        if (statusLine) {
          statusLine.textContent = 'No UUIDs to copy';
          statusLine.className = 'status-line warning';
        }
        return;
      }
      copyToClipboard(currentUuids.join('\n'), copyAllBtn, `Copied all ${currentUuids.length} UUIDs!`);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      renderList([]);
      if (statusLine) statusLine.textContent = '';
    });
  }

  // Initial generation
  handleGenerate();
}
