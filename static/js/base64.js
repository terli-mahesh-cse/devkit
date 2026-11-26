import { copyToClipboard } from './clipboard.js';

/**
 * Unicode-safe Base64 encode using TextEncoder and chunked conversion
 * Avoids String.fromCharCode(...bytes) stack overflow
 */
export function b64encode(text) {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') text = String(text);
  if (text.length === 0) return '';

  const bytes = new TextEncoder().encode(text);
  const chunkSize = 8192;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let chunkStr = '';
    for (let j = 0; j < chunk.length; j++) {
      chunkStr += String.fromCharCode(chunk[j]);
    }
    binary += chunkStr;
  }

  return btoa(binary);
}

/**
 * Unicode-safe Base64 decode using TextDecoder and chunked binary conversion
 */
export function b64decode(b64) {
  if (!b64 || typeof b64 !== 'string' || b64.trim() === '') {
    return '';
  }

  // Clean whitespace/newlines
  const cleaned = b64.trim().replace(/\s+/g, '');

  let binary;
  try {
    binary = atob(cleaned);
  } catch (err) {
    throw new Error(`Invalid Base64 format: ${err.message}`);
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (err) {
    throw new Error(`Invalid UTF-8 byte sequence in Base64: ${err.message}`);
  }
}

export function initBase64() {
  const input = document.getElementById('base64Input');
  const output = document.getElementById('base64Output');
  const badge = document.getElementById('base64Badge');
  const encodeBtn = document.getElementById('base64EncodeBtn');
  const decodeBtn = document.getElementById('base64DecodeBtn');
  const copyBtn = document.getElementById('base64CopyBtn');
  const clearBtn = document.getElementById('base64ClearBtn');
  const statusLine = document.getElementById('base64Status');

  if (!input || !output) return;

  function handleEncode() {
    const text = input.value;
    if (!text) {
      output.value = '';
      if (badge) {
        badge.textContent = 'Empty Input';
        badge.className = 'badge badge-neutral';
      }
      if (statusLine) {
        statusLine.textContent = 'Enter text to encode';
        statusLine.className = 'status-line warning';
      }
      return;
    }

    try {
      const encoded = b64encode(text);
      output.value = encoded;
      if (badge) {
        badge.textContent = 'Encoded';
        badge.className = 'badge badge-success';
      }
      if (statusLine) {
        statusLine.textContent = `Encoded ${text.length} characters into ${encoded.length} Base64 characters.`;
        statusLine.className = 'status-line success';
      }
    } catch (err) {
      output.value = '';
      if (badge) {
        badge.textContent = 'Error';
        badge.className = 'badge badge-error';
      }
      if (statusLine) {
        statusLine.textContent = `Encoding error: ${err.message}`;
        statusLine.className = 'status-line error';
      }
    }
  }

  function handleDecode() {
    const text = input.value;
    if (!text.trim()) {
      output.value = '';
      if (badge) {
        badge.textContent = 'Empty Input';
        badge.className = 'badge badge-neutral';
      }
      if (statusLine) {
        statusLine.textContent = 'Enter Base64 string to decode';
        statusLine.className = 'status-line warning';
      }
      return;
    }

    try {
      const decoded = b64decode(text);
      output.value = decoded;
      if (badge) {
        badge.textContent = 'Decoded';
        badge.className = 'badge badge-success';
      }
      if (statusLine) {
        statusLine.textContent = `Decoded Base64 cleanly into ${decoded.length} characters.`;
        statusLine.className = 'status-line success';
      }
    } catch (err) {
      output.value = '';
      if (badge) {
        badge.textContent = 'Invalid Base64';
        badge.className = 'badge badge-error';
      }
      if (statusLine) {
        statusLine.textContent = err.message;
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
      copyToClipboard(output.value, copyBtn, 'Base64 result copied!');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      output.value = '';
      if (badge) {
        badge.textContent = 'Unicode Safe';
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
