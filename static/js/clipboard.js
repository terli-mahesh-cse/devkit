/**
 * Toast notifications manager
 */
export function showToast(message, type = 'mint') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  const iconSvg = type === 'error'
    ? `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`
    : `<svg class="toast-icon" viewBox="0 0 20 20" fill="#22c55e"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>`;

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 200ms ease forwards';
    setTimeout(() => toast.remove(), 220);
  }, 2200);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Copy text to clipboard with button feedback & toast
 */
export async function copyToClipboard(text, btnElement, toastLabel = 'Copied to clipboard!') {
  if (!btnElement) return;
  const originalText = btnElement.getAttribute('data-original-label') || btnElement.textContent;
  if (!btnElement.getAttribute('data-original-label')) {
    btnElement.setAttribute('data-original-label', originalText);
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const success = document.execCommand('copy');
      document.body.removeChild(ta);
      if (!success) throw new Error('execCommand failed');
    }

    btnElement.textContent = 'Copied!';
    btnElement.classList.add('copied');
    showToast(toastLabel, 'mint');

    setTimeout(() => {
      btnElement.textContent = originalText;
      btnElement.classList.remove('copied');
    }, 1200);
  } catch (err) {
    console.warn('[clipboard] copy failed:', err);
    btnElement.textContent = 'Press Ctrl+C';
    showToast('Could not copy automatically. Press Ctrl+C', 'error');

    setTimeout(() => {
      btnElement.textContent = originalText;
      btnElement.classList.remove('copied');
    }, 1600);
  }
}
