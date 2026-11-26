import { copyToClipboard } from './clipboard.js';

export function urlEncode(text) {
  if (text === null || text === undefined) return '';
  return encodeURIComponent(String(text));
}

export function urlDecode(text) {
  if (text === null || text === undefined) return '';
  return decodeURIComponent(String(text));
}

export function initUrlenc() {
  const input = document.getElementById('urlInput');
  const output = document.getElementById('urlOutput');
  const badge = document.getElementById('urlBadge');
  const encodeBtn = document.getElementById('urlEncodeBtn');
  const decodeBtn = document.getElementById('urlDecodeBtn');
  const copyBtn = document.getElementById('urlCopyBtn');
  const clearBtn = document.getElementById('urlClearBtn');
  const statusLine = document.getElementById('urlStatus');

  if (!input || !output) return;

  function handleEncode() {
    const text = input.value;
    if (!text) {
      output.value = '';
      if (badge) {
        badge.textContent = 'Empty';
        badge.className = 'badge badge-neutral';
      }
      if (statusLine) {
        statusLine.textContent = 'Enter text or URL to encode';
        statusLine.className = 'status-line warning';
      }
      return;
    }

    try {
      const res = urlEncode(text);
      output.value = res;
      if (badge) {
        badge.textContent = 'Encoded';
        badge.className = 'badge badge-success';
      }
      if (statusLine) {
        statusLine.textContent = `Encoded URL (${text.length} chars → ${res.length} chars).`;
        statusLine.className = 'status-line success';
      }
    } catch (err) {
      output.value = '';
      if (badge) {
        badge.textContent = 'Error';
        badge.className = 'badge badge-error';
      }
      if (statusLine) {
        statusLine.textContent = err.message;
        statusLine.className = 'status-line error';
      }
    }
  }

  function handleDecode() {
    const text = input.value;
    if (!text.trim()) {
      output.value = '';
      if (badge) {
        badge.textContent = 'Empty';
        badge.className = 'badge badge-neutral';
      }
      if (statusLine) {
        statusLine.textContent = 'Enter encoded URL to decode';
        statusLine.className = 'status-line warning';
      }
      return;
    }

    try {
      const res = urlDecode(text);
      output.value = res;
      if (badge) {
        badge.textContent = 'Decoded';
        badge.className = 'badge badge-success';
      }
      if (statusLine) {
        statusLine.textContent = `Decoded URL component cleanly (${res.length} chars).`;
        statusLine.className = 'status-line success';
      }
    } catch (err) {
      output.value = '';
      if (badge) {
        badge.textContent = 'Malformed URI';
        badge.className = 'badge badge-error badge-shake';
      }
      if (statusLine) {
        statusLine.textContent = `URIError: Malformed URI sequence (${err.message})`;
        statusLine.className = 'status-line error';
      }
    }
  }

  if (encodeBtn) encodeBtn.addEventListener('click', handleEncode);
  if (decodeBtn) decodeBtn.addEventListener('click', handleDecode);

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!output.value) {
        if (statusLine) {
          statusLine.textContent = 'Nothing to copy in output';
          statusLine.className = 'status-line warning';
        }
        return;
      }
      copyToClipboard(output.value, copyBtn, 'URL result copied!');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      output.value = '';
      if (badge) {
        badge.textContent = 'Ready';
        badge.className = 'badge badge-neutral';
      }
      if (statusLine) {
        statusLine.textContent = '';
        statusLine.className = 'status-line';
      }
      input.focus();
    });
  }
}
