import { copyToClipboard } from './clipboard.js';

// Smooth tween for counter numbers over 250ms
function tweenValue(element, targetValue, suffix = '') {
  if (!element) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    element.textContent = targetValue + suffix;
    return;
  }

  const startValue = parseInt(element.getAttribute('data-value') || '0', 10);
  element.setAttribute('data-value', targetValue);

  if (isNaN(startValue) || startValue === targetValue) {
    element.textContent = targetValue + suffix;
    return;
  }

  const duration = 250;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutQuad
    const ease = 1 - (1 - progress) * (1 - progress);
    const current = Math.round(startValue + (targetValue - startValue) * ease);
    element.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = targetValue + suffix;
    }
  }

  requestAnimationFrame(update);
}

export function calculateMetrics(text) {
  if (!text || text.length === 0) {
    return {
      words: 0,
      charsWithSpaces: 0,
      charsNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeText: '0 min',
      readingTimeMinutes: 0
    };
  }

  const charsWithSpaces = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;

  // Words: handle multiple spaces, line breaks, leading/trailing whitespace
  const trimmed = text.trim();
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;

  // Sentences: split by sentence terminators or newlines
  const sentenceMatches = text.match(/[^.!?\s][^.!?]*(?:[.!?](?=\s|$)|$)/g);
  const sentences = sentenceMatches ? sentenceMatches.filter(s => s.trim().length > 0).length : (words > 0 ? 1 : 0);

  // Paragraphs: non-empty chunks separated by one or more blank lines
  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length;

  // Reading time: words / 200
  let readingTimeText = '0 min';
  let readingTimeMinutes = 0;
  if (words > 0) {
    readingTimeMinutes = words / 200;
    if (readingTimeMinutes < 1) {
      readingTimeText = '< 1 min';
    } else {
      readingTimeText = `${Math.ceil(readingTimeMinutes)} min`;
    }
  }

  return {
    words,
    charsWithSpaces,
    charsNoSpaces,
    sentences,
    paragraphs,
    readingTimeText,
    readingTimeMinutes
  };
}

export function initCounter() {
  const input = document.getElementById('counterInput');
  const badge = document.getElementById('counterBadge');
  const metricWords = document.getElementById('metricWords');
  const metricCharsSpaces = document.getElementById('metricCharsSpaces');
  const metricCharsNoSpaces = document.getElementById('metricCharsNoSpaces');
  const metricSentences = document.getElementById('metricSentences');
  const metricParagraphs = document.getElementById('metricParagraphs');
  const metricReadingTime = document.getElementById('metricReadingTime');
  const copyBtn = document.getElementById('counterCopySummaryBtn');
  const clearBtn = document.getElementById('counterClearBtn');
  const statusLine = document.getElementById('counterStatus');

  if (!input) return;

  function updateAll() {
    const text = input.value;
    const metrics = calculateMetrics(text);

    tweenValue(metricWords, metrics.words);
    tweenValue(metricCharsSpaces, metrics.charsWithSpaces);
    tweenValue(metricCharsNoSpaces, metrics.charsNoSpaces);
    tweenValue(metricSentences, metrics.sentences);
    tweenValue(metricParagraphs, metrics.paragraphs);

    if (metricReadingTime) {
      metricReadingTime.textContent = metrics.readingTimeText;
    }

    if (badge) {
      badge.textContent = `${metrics.words} ${metrics.words === 1 ? 'word' : 'words'}`;
      badge.className = `badge ${metrics.words > 0 ? 'badge-success' : 'badge-neutral'}`;
    }

    if (statusLine) {
      if (text.length > 0) {
        statusLine.textContent = `Analyzed ${metrics.words} words (${metrics.charsWithSpaces} characters).`;
        statusLine.className = 'status-line';
      } else {
        statusLine.textContent = '';
        statusLine.className = 'status-line';
      }
    }
  }

  input.addEventListener('input', updateAll);

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const metrics = calculateMetrics(input.value);
      const summary = [
        `DevKit Word Count Summary`,
        `Words: ${metrics.words}`,
        `Characters (with spaces): ${metrics.charsWithSpaces}`,
        `Characters (no spaces): ${metrics.charsNoSpaces}`,
        `Sentences: ${metrics.sentences}`,
        `Paragraphs: ${metrics.paragraphs}`,
        `Estimated Reading Time: ${metrics.readingTimeText}`
      ].join('\n');

      copyToClipboard(summary, copyBtn, 'Summary copied!');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      updateAll();
      input.focus();
    });
  }

  // Initial calculation
  updateAll();
}
