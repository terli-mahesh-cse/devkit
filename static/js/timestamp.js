import { copyToClipboard } from './clipboard.js';

export function parseTimestampInput(input) {
  if (input === null || input === undefined) return null;
  const str = String(input).trim();
  if (!str) return null;

  // Number test (seconds or milliseconds)
  if (/^-?\d+$/.test(str)) {
    const val = parseInt(str, 10);
    // If fewer than 12 digits, assume seconds; otherwise milliseconds
    const ms = Math.abs(val) < 100000000000 ? val * 1000 : val;
    const date = new Date(ms);
    return isNaN(date.getTime()) ? null : date;
  }

  // Date parse
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

export function formatTimestampDetails(date) {
  if (!date || isNaN(date.getTime())) return null;
  const ms = date.getTime();
  const seconds = Math.floor(ms / 1000);
  const iso = date.toISOString();
  const local = date.toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'long'
  });
  const utc = date.toUTCString();

  return {
    date,
    seconds,
    ms,
    iso,
    local,
    utc
  };
}

export function initTimestamp() {
  const unixInput = document.getElementById('timestampUnixInput');
  const dateInput = document.getElementById('timestampDateInput');
  const fromUnixBtn = document.getElementById('timestampFromUnixBtn');
  const fromDateBtn = document.getElementById('timestampFromDateBtn');
  const nowBtn = document.getElementById('timestampNowBtn');
  const copyBtn = document.getElementById('timestampCopyBtn');
  const clearBtn = document.getElementById('timestampClearBtn');
  const badge = document.getElementById('timestampBadge');
  const statusLine = document.getElementById('timestampStatus');

  const resSeconds = document.getElementById('tsResultSeconds');
  const resMs = document.getElementById('tsResultMs');
  const resIso = document.getElementById('tsResultIso');
  const resLocal = document.getElementById('tsResultLocal');

  let currentDetails = null;

  function displayDetails(details) {
    currentDetails = details;
    if (!details) {
      if (resSeconds) resSeconds.textContent = '-';
      if (resMs) resMs.textContent = '-';
      if (resIso) resIso.textContent = '-';
      if (resLocal) resLocal.textContent = '-';
      if (badge) {
        badge.textContent = 'Unix ↔ ISO';
        badge.className = 'badge badge-neutral';
      }
      return;
    }

    if (resSeconds) resSeconds.textContent = String(details.seconds);
    if (resMs) resMs.textContent = String(details.ms);
    if (resIso) resIso.textContent = details.iso;
    if (resLocal) resLocal.textContent = details.local;

    // Update input values to match
    if (unixInput) unixInput.value = details.seconds;
    if (dateInput) {
      // YYYY-MM-DDTHH:mm format for datetime-local
      const localIso = new Date(details.ms - (details.date.getTimezoneOffset() * 60000))
        .toISOString()
        .slice(0, 16);
      dateInput.value = localIso;
    }

    if (badge) {
      badge.textContent = 'Converted';
      badge.className = 'badge badge-success';
    }

    if (statusLine) {
      statusLine.textContent = `UTC: ${details.utc}`;
      statusLine.className = 'status-line success';
    }
  }

  function handleConvertFromUnix() {
    const raw = unixInput.value.trim();
    if (!raw) {
      if (statusLine) {
        statusLine.textContent = 'Please enter a Unix timestamp';
        statusLine.className = 'status-line warning';
      }
      return;
    }

    const date = parseTimestampInput(raw);
    if (!date) {
      if (badge) {
        badge.textContent = 'Invalid Timestamp';
        badge.className = 'badge badge-error badge-shake';
      }
      if (statusLine) {
        statusLine.textContent = 'Could not parse timestamp number';
        statusLine.className = 'status-line error';
      }
      return;
    }

    displayDetails(formatTimestampDetails(date));
  }

  function handleConvertFromDate() {
    const raw = dateInput.value;
    if (!raw) {
      if (statusLine) {
        statusLine.textContent = 'Please pick or enter a date';
        statusLine.className = 'status-line warning';
      }
      return;
    }

    const date = new Date(raw);
    if (isNaN(date.getTime())) {
      if (badge) {
        badge.textContent = 'Invalid Date';
        badge.className = 'badge badge-error badge-shake';
      }
      if (statusLine) {
        statusLine.textContent = 'Invalid date format';
        statusLine.className = 'status-line error';
      }
      return;
    }

    displayDetails(formatTimestampDetails(date));
  }

  function setNow() {
    const now = new Date();
    displayDetails(formatTimestampDetails(now));
    if (statusLine) {
      statusLine.textContent = 'Timestamp set to current instant';
      statusLine.className = 'status-line success';
    }
  }

  if (fromUnixBtn) fromUnixBtn.addEventListener('click', handleConvertFromUnix);
  if (fromDateBtn) fromDateBtn.addEventListener('click', handleConvertFromDate);
  if (nowBtn) nowBtn.addEventListener('click', setNow);

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!currentDetails) {
        if (statusLine) {
          statusLine.textContent = 'No timestamp details to copy';
          statusLine.className = 'status-line warning';
        }
        return;
      }

      const text = [
        `DevKit Timestamp Conversion`,
        `Unix Seconds: ${currentDetails.seconds}`,
        `Unix Milliseconds: ${currentDetails.ms}`,
        `ISO 8601 (UTC): ${currentDetails.iso}`,
        `Local Time: ${currentDetails.local}`,
        `UTC: ${currentDetails.utc}`
      ].join('\n');

      copyToClipboard(text, copyBtn, 'Timestamp details copied!');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (unixInput) unixInput.value = '';
      if (dateInput) dateInput.value = '';
      displayDetails(null);
      if (statusLine) statusLine.textContent = '';
    });
  }

  // Initialize with current time
  setNow();
}
