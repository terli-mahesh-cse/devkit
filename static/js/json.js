import { copyToClipboard } from './clipboard.js';

function getLineAndColumn(text, position) {
  if (position === null || position === undefined || isNaN(position)) return null;
  const clampedPos = Math.max(0, Math.min(position, text.length));
  const lines = text.slice(0, clampedPos).split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return { line, col };
}

function extractErrorDetails(text, err) {
  const msg = err.message || 'Syntax error';
  let line = null;
  let col = null;

  // 1. Try position match (e.g., "at position 23")
  const posMatch = msg.match(/position\s+(\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    const loc = getLineAndColumn(text, pos);
    if (loc) {
      line = loc.line;
      col = loc.col;
    }
  }

  // 2. Try explicit line and column in message
  if (line === null) {
    const lineColMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (lineColMatch) {
      line = parseInt(lineColMatch[1], 10);
      col = parseInt(lineColMatch[2], 10);
    }
  }

  // 3. V8 / Chromium snippet format: "...<snippet>" is not valid JSON
  if (line === null) {
    const snippetMatch = msg.match(/(?:\.\.\.)?([^\n\r"]+?)\s*(?:is not valid JSON|in JSON)/i);
    if (snippetMatch) {
      const snippet = snippetMatch[1].trim();
      const idx = text.indexOf(snippet);
      if (idx !== -1) {
        const loc = getLineAndColumn(text, idx + snippet.length);
        if (loc) {
          line = loc.line;
          col = loc.col;
        }
      }
    }
  }

  // 4. Fallback if still unknown: default to line 1, col 1
  if (line === null || col === null) {
    line = 1;
    col = 1;
  }

  let readableError;
  if (msg.toLowerCase().includes(`line ${line}`) && msg.toLowerCase().includes(`column ${col}`)) {
    readableError = msg;
  } else {
    readableError = `${msg} (line ${line}, column ${col})`;
  }

  return { message: readableError, line, col };
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (value !== null && typeof value === 'object') {
    const sorted = {};
    Object.keys(value).sort().forEach(k => {
      sorted[k] = sortObjectKeys(value[k]);
    });
    return sorted;
  }
  return value;
}

export function formatJsonLocal(text, indentVal = 2, sortKeys = false) {
  if (!text || text.trim() === '') {
    return { ok: false, error: 'Input is empty' };
  }

  try {
    let parsed = JSON.parse(text);
    if (sortKeys) {
      parsed = sortObjectKeys(parsed);
    }
    const indent = indentVal === 'tab' ? '\t' : parseInt(indentVal, 10);
    const value = JSON.stringify(parsed, null, indent);
    return { ok: true, value };
  } catch (err) {
    const details = extractErrorDetails(text, err);
    return { ok: false, error: details.message, line: details.line, col: details.col };
  }
}

export function minifyJsonLocal(text) {
  if (!text || text.trim() === '') {
    return { ok: false, error: 'Input is empty' };
  }

  try {
    const parsed = JSON.parse(text);
    const value = JSON.stringify(parsed);
    return { ok: true, value };
  } catch (err) {
    const details = extractErrorDetails(text, err);
    return { ok: false, error: details.message, line: details.line, col: details.col };
  }
}

export function initJson() {
  const input = document.getElementById('jsonInput');
  const output = document.getElementById('jsonOutput');
  const badge = document.getElementById('jsonBadge');
  const sizeLabel = document.getElementById('jsonSizeLabel');
  const formatBtn = document.getElementById('jsonFormatBtn');
  const minifyBtn = document.getElementById('jsonMinifyBtn');
  const validateBtn = document.getElementById('jsonValidateBtn');
  const indentSelect = document.getElementById('jsonIndentSelect');
  const sortKeysToggle = document.getElementById('jsonSortKeysToggle');
  const useServerToggle = document.getElementById('jsonUseServerToggle');
  const copyBtn = document.getElementById('jsonCopyBtn');
  const clearBtn = document.getElementById('jsonClearBtn');
  const statusLine = document.getElementById('jsonStatus');

  if (!input || !output) return;

  function updateInputSize() {
    const bytes = new Blob([input.value]).size;
    if (sizeLabel) {
      if (bytes < 1024) {
        sizeLabel.textContent = `${bytes} B`;
      } else if (bytes < 1024 * 1024) {
        sizeLabel.textContent = `${(bytes / 1024).toFixed(1)} KB`;
      } else {
        sizeLabel.textContent = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      }
    }

    // 1 MB Warning
    if (bytes > 1024 * 1024) {
      if (statusLine && !statusLine.classList.contains('error')) {
        statusLine.textContent = 'Warning: Input exceeds 1 MB. Formatting large payloads may take a moment.';
        statusLine.className = 'status-line warning';
      }
    }
  }

  function setBadgeState(state, message) {
    if (!badge) return;
    badge.classList.remove('badge-pop', 'badge-shake', 'badge-success', 'badge-error', 'badge-warning', 'badge-neutral');

    if (state === 'valid') {
      badge.textContent = message || 'Valid JSON';
      badge.classList.add('badge-success', 'badge-pop');
    } else if (state === 'invalid') {
      badge.textContent = message || 'Invalid JSON';
      badge.classList.add('badge-error', 'badge-shake');
    } else if (state === 'warning') {
      badge.textContent = message || 'Warning';
      badge.classList.add('badge-warning', 'badge-pop');
    } else {
      badge.textContent = message || 'Ready';
      badge.classList.add('badge-neutral');
    }
  }

  async function handleFormat() {
    const text = input.value;
    if (!text.trim()) {
      setBadgeState('neutral', 'Empty');
      if (statusLine) {
        statusLine.textContent = 'Please enter JSON to format';
        statusLine.className = 'status-line warning';
      }
      return;
    }

    const indentVal = indentSelect ? indentSelect.value : 2;
    const sortKeys = sortKeysToggle ? sortKeysToggle.checked : false;
    const useServer = useServerToggle ? useServerToggle.checked : false;

    if (useServer) {
      // POST /api/format-json
      try {
        if (statusLine) {
          statusLine.textContent = 'Sending to server /api/format-json...';
          statusLine.className = 'status-line';
        }
        const resp = await fetch('/api/format-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, indent: indentVal, sort_keys: sortKeys })
        });
        const resData = await resp.json();
        if (resData.ok) {
          output.value = resData.value;
          setBadgeState('valid', 'Valid JSON (Server)');
          if (statusLine) {
            statusLine.textContent = 'Successfully formatted via server POST /api/format-json';
            statusLine.className = 'status-line success';
          }
        } else {
          setBadgeState('invalid', 'Invalid JSON');
          if (statusLine) {
            statusLine.textContent = resData.error || 'Server error parsing JSON';
            statusLine.className = 'status-line error';
          }
        }
      } catch (err) {
        setBadgeState('invalid', 'Network Error');
        if (statusLine) {
          statusLine.textContent = `Server request failed: ${err.message}`;
          statusLine.className = 'status-line error';
        }
      }
    } else {
      // Browser formatting
      const res = formatJsonLocal(text, indentVal, sortKeys);
      if (res.ok) {
        output.value = res.value;
        setBadgeState('valid', 'Valid JSON');
        if (statusLine) {
          statusLine.textContent = 'Formatted cleanly in browser';
          statusLine.className = 'status-line success';
        }
      } else {
        setBadgeState('invalid', 'Invalid JSON');
        if (statusLine) {
          statusLine.textContent = res.error;
          statusLine.className = 'status-line error';
        }
      }
    }
  }

  function handleMinify() {
    const text = input.value;
    if (!text.trim()) {
      setBadgeState('neutral', 'Empty');
      return;
    }

    const res = minifyJsonLocal(text);
    if (res.ok) {
      output.value = res.value;
      setBadgeState('valid', 'Valid JSON (Minified)');
      if (statusLine) {
        statusLine.textContent = 'Minified successfully without whitespace';
        statusLine.className = 'status-line success';
      }
    } else {
      setBadgeState('invalid', 'Invalid JSON');
      if (statusLine) {
        statusLine.textContent = res.error;
        statusLine.className = 'status-line error';
      }
    }
  }

  function handleValidate() {
    const text = input.value;
    if (!text.trim()) {
      setBadgeState('neutral', 'Empty');
      if (statusLine) {
        statusLine.textContent = 'Please enter JSON to validate';
        statusLine.className = 'status-line warning';
      }
      return;
    }

    try {
      const parsed = JSON.parse(text);
      const isArr = Array.isArray(parsed);
      setBadgeState('valid', 'Valid JSON');
      if (statusLine) {
        statusLine.textContent = `Valid JSON: Root element is ${isArr ? 'Array' : typeof parsed}`;
        statusLine.className = 'status-line success';
      }
    } catch (err) {
      const details = extractErrorDetails(text, err);
      setBadgeState('invalid', 'Invalid JSON');
      if (statusLine) {
        statusLine.textContent = details.message;
        statusLine.className = 'status-line error';
      }
    }
  }

  input.addEventListener('input', updateInputSize);

  if (formatBtn) formatBtn.addEventListener('click', handleFormat);
  if (minifyBtn) minifyBtn.addEventListener('click', handleMinify);
  if (validateBtn) validateBtn.addEventListener('click', handleValidate);

  if (useServerToggle) {
    useServerToggle.addEventListener('change', () => {
      if (statusLine) {
        if (useServerToggle.checked) {
          statusLine.textContent = "Note: 'Use server' is active. Formatted requests will call POST /api/format-json.";
          statusLine.className = 'status-line warning';
        } else {
          statusLine.textContent = 'All processing happens in your browser.';
          statusLine.className = 'status-line';
        }
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!output.value) {
        if (statusLine) {
          statusLine.textContent = 'Nothing to copy in output';
          statusLine.className = 'status-line warning';
        }
        return;
      }
      copyToClipboard(output.value, copyBtn, 'JSON copied!');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      output.value = '';
      updateInputSize();
      setBadgeState('neutral', 'Ready');
      if (statusLine) {
        statusLine.textContent = '';
        statusLine.className = 'status-line';
      }
      input.focus();
    });
  }

  updateInputSize();
}
