# DevKit 🛠️
> **All processing happens in your browser.** A privacy-first developer toolbox for students and engineers.

DevKit bundles 9 essential utilities into a single-page app with zero framework overhead, dark-first linear/raycast design system, 60fps animations, keyboard-driven navigation, and offline execution.

---

## ✨ Features (9 Tools)

1. **Word Counter**: Real-time counter for words, characters (with and without spaces), sentences, paragraphs, and estimated reading time (`words / 200`). Live tweens and edge-case handling for multiple spaces, newlines, and empty inputs.
2. **JSON Formatter**: Format (2 spaces, 4 spaces, tab indentation), minify, and validate JSON. Features recursive alphabetical key sorting, line and column syntax error reporting, a 1 MB payload warning, and an optional server-side toggle (`POST /api/format-json`).
3. **Case Converter**: Pure functions for `UPPER`, `lower`, `Title`, `camelCase`, `snake_case`, `kebab-case`, and `PascalCase`.
4. **Base64 Encoder / Decoder**: Unicode-safe encoding and decoding with `TextEncoder` and `TextDecoder`. Chunks byte operations (8192-byte chunks) to prevent stack overflows, supporting emojis (🚀), Hindi (नमस्ते), and Telugu (నమస్కారం).
5. **Colour Picker & Contrast**: Synchronized editing across interactive `<input type="color">`, HEX, RGB, and HSL. Includes a live preview swatch and WCAG 2.1 relative luminance and contrast ratio metrics against both white (`#FFFFFF`) and black (`#000000`) with dynamic AA/AAA compliance badges.
6. **URL Encoder / Decoder**: URL component encoding and decoding with error boundary detection for malformed sequences.
7. **UUID v4 Generator**: Generates 1 to 20 RFC 4122 v4 UUIDs simultaneously with individual and bulk "Copy All" operations.
8. **Timestamp Converter**: Bidirectional conversion between Unix timestamps (seconds or milliseconds) and human date strings (ISO 8601 UTC and formatted Local Time), with a one-click "Set to Now" button.
9. **Hash Generator**: Real-time cryptographic hashing for SHA-1, SHA-256, and SHA-512 via browser-native `crypto.subtle`.

### Cross-Cutting Features
- **Privacy First**: 100% in-browser processing by default. Nothing pasted is sent to a server.
- **Copy & Clear**: Every tool has dedicated Copy (with 1.2s "Copied!" feedback and toasts) and Clear controls.
- **State Persistence**: Last-used tool (`devkit:lastTool`), favourites (`devkit:favorites`), and theme (`devkit:theme`) are safely persisted in `localStorage`.
- **Keyboard-Driven**:
  - `Ctrl + K` / `Cmd + K`: Command palette with fuzzy abbreviation search.
  - `Alt + 1..9`: Direct tool switching.
  - `?`: Keyboard shortcuts cheatsheet.
  - `Esc`: Close active modal dialog.
- **Deep Linking**: Browser hash (`#counter`, `#json`, etc.) stays in sync with history back/forward navigation.
- **Accessibility**: Semantic HTML (`<nav>`, `<main>`, `role="tablist"`, `role="tab"`, `role="tabpanel"`), `aria-selected`, `aria-live="polite"` on status lines and toasts, and visible 2px violet focus rings.
- **Motion**: 60fps CSS transforms and opacity transitions with full `@media (prefers-reduced-motion: reduce)` support.

---

## 📁 Project Structure

```
devkit/
├── app.py                  # Python Flask server (GET /, POST /api/format-json, GET /api/health)
├── requirements.txt        # Flask and Gunicorn dependencies
├── render.yaml             # Render infrastructure as code
├── README.md               # Documentation and deployment guide
├── .gitignore              # Git ignore rules for venv, caches, env
├── templates/
│   └── index.html          # Semantic single-page HTML
└── static/
    ├── css/
    │   ├── tokens.css      # CSS custom properties (colors, typography, radii, dark/light themes)
    │   ├── base.css        # Reset, typography, scrollbars, focus rings, selection color
    │   ├── layout.css      # 240px fixed sidebar, responsive mobile tab bar, IO cards
    │   ├── components.css  # Buttons, badges, toggles, metric cards, toasts, modals
    │   └── animations.css  # 60fps panel slide/stagger, badge shake, pill translation
    └── js/
        ├── main.js         # Tool registry, sidebar tabs, routing, shortcuts, theme
        ├── palette.js      # Ctrl+K command palette with fuzzy abbreviation search
        ├── storage.js      # Safe try/catch localStorage wrapper
        ├── clipboard.js    # Copy to clipboard with toast notification manager
        ├── counter.js      # Word counter with animated metric tweens
        ├── json.js         # JSON formatter, minifier, validator, line/col error parsing
        ├── case.js         # 7 pure case conversion functions
        ├── base64.js       # Chunked Unicode-safe Base64 encoder/decoder
        ├── color.js        # HEX, RGB, HSL conversions and WCAG contrast calculator
        ├── urlenc.js       # URL encoder and decoder
        ├── uuid.js         # RFC 4122 v4 UUID generator
        ├── timestamp.js    # Unix seconds/ms and ISO/Local date converter
        ├── hash.js         # SHA-1, SHA-256, SHA-512 via crypto.subtle
        └── tests.html      # Browser-based automated unit test suite
```

---

## 💻 Local Setup

### Prerequisites
- Python 3.10+ installed
- Git installed

### Windows (PowerShell)
```powershell
# 1. Clone or navigate to the directory
cd devkit

# 2. Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the development server
python app.py
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

### macOS & Linux (Bash / Zsh)
```bash
# 1. Navigate to directory
cd devkit

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the development server
python3 app.py
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🧪 Running Automated Self-Tests

DevKit includes a built-in automated test suite covering all pure functions and edge cases:
1. Start the server (`python app.py`).
2. Open [http://localhost:5000/static/js/tests.html](http://localhost:5000/static/js/tests.html) in any modern browser.
3. Tests verify:
   - Case converters (all 7 styles, empty string, single word, hyphens, underscores, camelCase)
   - Base64 Unicode roundtrip (English, emojis, Hindi, Telugu, and 25KB+ chunked sequences)
   - Invalid Base64 error throwing
   - HEX ↔ RGB ↔ HSL colour mathematical conversions and WCAG contrast ratios
   - Word Counter edge cases (empty strings, whitespace-only, multiple spaces, line breaks)
   - JSON formatting, key sorting, and minification
   - URL encoding / decoding
   - UUID v4 regex validation
   - SHA-1 and SHA-256 standard test vectors

---

## 🚀 GitHub Push Steps

```bash
# Initialize git (if not already done)
git init

# Stage all files
git add .

# Commit changes
git commit -m "feat: complete devkit student toolbox"

# Create a new repository on GitHub (e.g. devkit)
# Link and push:
git remote add origin https://github.com/<your-username>/devkit.git
git branch -M main
git push -u origin main
```

---

## 🌐 Deploy to Render

### Option A: Using `render.yaml` (Blueprint)
1. In the [Render Dashboard](https://dashboard.render.com/), click **New** → **Blueprint**.
2. Connect your GitHub repository.
3. Render reads `render.yaml` automatically:
   - **Environment**: Python 3.11.9
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Health Check**: `/api/health`
4. Click **Apply**.

### Option B: Manual Web Service
1. In the [Render Dashboard](https://dashboard.render.com/), click **New** → **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Health Check Path**: `/api/health`
4. Click **Deploy Web Service**.

> [!NOTE]
> **Free Tier Sleep Notice**: On Render's free tier, web services spin down after 15 minutes of inactivity. When a new request arrives, Render spins up the service automatically in ~30–50 seconds.
