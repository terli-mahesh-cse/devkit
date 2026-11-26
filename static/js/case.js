import { copyToClipboard } from './clipboard.js';

// Helper to extract words respecting camelCase, spaces, hyphens and underscores
export const toWords = (s) => {
  if (!s || typeof s !== 'string') return [];
  return s.trim().split(/[\s_\-]+|(?<=[a-z])(?=[A-Z])/).filter(Boolean);
};

// Pure Functions: one per style
export const upper = (s) => (s ? s.toUpperCase() : '');
export const lower = (s) => (s ? s.toLowerCase() : '');
export const title = (s) => (s ? s.toLowerCase().replace(/(^|\s)\w/g, (c) => c.toUpperCase()) : '');
export const camel = (s) =>
  toWords(s)
    .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join('');
export const snake = (s) => toWords(s).map((w) => w.toLowerCase()).join('_');
export const kebab = (s) => toWords(s).map((w) => w.toLowerCase()).join('-');
export const pascal = (s) =>
  toWords(s)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join('');

export const CASE_FUNCTIONS = {
  upper: { fn: upper, label: 'UPPER' },
  lower: { fn: lower, label: 'lower' },
  title: { fn: title, label: 'Title' },
  camel: { fn: camel, label: 'camelCase' },
  snake: { fn: snake, label: 'snake_case' },
  kebab: { fn: kebab, label: 'kebab-case' },
  pascal: { fn: pascal, label: 'PascalCase' },
};

export function initCase() {
  const input = document.getElementById('caseInput');
  const output = document.getElementById('caseOutput');
  const badge = document.getElementById('caseBadge');
  const copyBtn = document.getElementById('caseCopyBtn');
  const clearBtn = document.getElementById('caseClearBtn');
  const statusLine = document.getElementById('caseStatus');
  const buttonsContainer = document.getElementById('caseButtonContainer');

  if (!input || !output) return;

  let activeCase = 'camel';

  function convert(caseKey) {
    activeCase = caseKey;
    const config = CASE_FUNCTIONS[caseKey];
    if (!config) return;

    // Update active button state
    if (buttonsContainer) {
      buttonsContainer.querySelectorAll('button[data-case]').forEach((btn) => {
        if (btn.getAttribute('data-case') === caseKey) {
          btn.className = 'btn btn-primary';
        } else {
          btn.className = 'btn btn-secondary';
        }
      });
    }

    const text = input.value;
    const converted = config.fn(text);
    output.value = converted;

    if (badge) {
      badge.textContent = config.label;
      badge.className = 'badge badge-success';
    }

    if (statusLine) {
      if (text.length > 0) {
        statusLine.textContent = `Converted ${text.length} characters to ${config.label}.`;
        statusLine.className = 'status-line';
      } else {
        statusLine.textContent = '';
        statusLine.className = 'status-line';
      }
    }
  }

  // Handle case button clicks
  if (buttonsContainer) {
    buttonsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-case]');
      if (!btn) return;
      const caseKey = btn.getAttribute('data-case');
      convert(caseKey);
    });
  }

  // Live convert on input
  input.addEventListener('input', () => {
    convert(activeCase);
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!output.value) {
        if (statusLine) {
          statusLine.textContent = 'Nothing to copy';
          statusLine.className = 'status-line warning';
        }
        return;
      }
      copyToClipboard(output.value, copyBtn, 'Converted text copied!');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      output.value = '';
      if (statusLine) statusLine.textContent = '';
      if (badge) {
        badge.textContent = 'Pure Functions';
        badge.className = 'badge badge-neutral';
      }
      input.focus();
    });
  }

  // Set default initial case button active
  convert('camel');
}
