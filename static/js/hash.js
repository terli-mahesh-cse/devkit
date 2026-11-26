import { copyToClipboard } from './clipboard.js';

export async function computeHash(algorithm, text) {
  if (text === null || text === undefined) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeAllHashes(text) {
  const [sha1, sha256, sha512] = await Promise.all([
    computeHash('SHA-1', text),
    computeHash('SHA-256', text),
    computeHash('SHA-512', text)
  ]);
  return { sha1, sha256, sha512 };
}

export function initHash() {
  const input = document.getElementById('hashInput');
  const sha1Out = document.getElementById('hashSha1Output');
  const sha256Out = document.getElementById('hashSha256Output');
  const sha512Out = document.getElementById('hashSha512Output');
  const sha1CopyBtn = document.getElementById('hashSha1CopyBtn');
  const sha256CopyBtn = document.getElementById('hashSha256CopyBtn');
  const sha512CopyBtn = document.getElementById('hashSha512CopyBtn');
  const computeBtn = document.getElementById('hashComputeBtn');
  const clearBtn = document.getElementById('hashClearBtn');
  const badge = document.getElementById('hashBadge');
  const statusLine = document.getElementById('hashStatus');

  if (!input) return;

  async function updateHashes() {
    const text = input.value;
    if (!text) {
      if (sha1Out) sha1Out.textContent = '-';
      if (sha256Out) sha256Out.textContent = '-';
      if (sha512Out) sha512Out.textContent = '-';
      if (badge) {
        badge.textContent = 'crypto.subtle';
        badge.className = 'badge badge-neutral';
      }
      if (statusLine) {
        statusLine.textContent = '';
        statusLine.className = 'status-line';
      }
      return;
    }

    try {
      const hashes = await computeAllHashes(text);
      if (sha1Out) sha1Out.textContent = hashes.sha1;
      if (sha256Out) sha256Out.textContent = hashes.sha256;
      if (sha512Out) sha512Out.textContent = hashes.sha512;

      if (badge) {
        badge.textContent = 'Computed';
        badge.className = 'badge badge-success';
      }

      if (statusLine) {
        statusLine.textContent = `Generated SHA-1 (160-bit), SHA-256 (256-bit), and SHA-512 (512-bit) hashes.`;
        statusLine.className = 'status-line success';
      }
    } catch (err) {
      if (statusLine) {
        statusLine.textContent = `Error computing hash: ${err.message}`;
        statusLine.className = 'status-line error';
      }
    }
  }

  // Live updates
  input.addEventListener('input', updateHashes);
  if (computeBtn) computeBtn.addEventListener('click', updateHashes);

  if (sha1CopyBtn) {
    sha1CopyBtn.addEventListener('click', () => {
      const val = sha1Out ? sha1Out.textContent : '';
      if (!val || val === '-') return;
      copyToClipboard(val, sha1CopyBtn, 'SHA-1 hash copied!');
    });
  }

  if (sha256CopyBtn) {
    sha256CopyBtn.addEventListener('click', () => {
      const val = sha256Out ? sha256Out.textContent : '';
      if (!val || val === '-') return;
      copyToClipboard(val, sha256CopyBtn, 'SHA-256 hash copied!');
    });
  }

  if (sha512CopyBtn) {
    sha512CopyBtn.addEventListener('click', () => {
      const val = sha512Out ? sha512Out.textContent : '';
      if (!val || val === '-') return;
      copyToClipboard(val, sha512CopyBtn, 'SHA-512 hash copied!');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      updateHashes();
      input.focus();
    });
  }
}
