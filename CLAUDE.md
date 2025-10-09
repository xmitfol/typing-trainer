# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Russian keyboard typing trainer SaaS application. It's a client-side web application that helps users learn touch typing with:
- Virtual keyboard with color-coded finger positions
- 6 difficulty levels (from pinky to advanced)
- Real-time statistics (WPM, accuracy, errors)
- Star rating system
- Local storage for best results
- Responsive design

## Architecture
The application follows a modular JavaScript architecture with no build system:

- **Single-page application** (`index.html`) - Main entry point with embedded virtual keyboard
- **Config-driven design** (`config/settings.js`) - Centralized configuration with APP_CONFIG object
- **Module pattern** - Each JS file is a self-contained module:
  - `main.js` - Core TypingTrainer class and application logic
  - `keyboard.js` - Virtual keyboard management and key highlighting
  - `stats.js` - Statistics calculation and display
  - `utils.js` - Utility functions and local storage management

## Key Components

### Configuration System (`config/settings.js`)
Central configuration object `APP_CONFIG` contains:
- Difficulty levels with target WPM and error thresholds
- Keyboard finger color mapping (pink=pinky, orange=ring, green=middle, cyan/blue=index, purple=thumb)
- Rating system (1-5 stars based on WPM and accuracy)
- UI settings, animations, and future API configurations

Access via: `Settings.get('path.to.setting', defaultValue)`

### Data Files
- `data/quotes.json` - Inspirational quotes displayed at top
- `data/texts/ru.json` - Training texts for each difficulty level
- Training texts are embedded in main.js for basic levels, external files for advanced content

### Virtual Keyboard
HTML-based virtual keyboard with Russian QWERTY layout, color-coded by finger positions. Keys use `data-key` attributes matching JavaScript KeyboardEvent.key values.

## Development Commands

This is a static web application with no build process. For development:

```bash
# Serve locally (recommended - handles CORS for data files)
python -m http.server 8000
# or
php -S localhost:8000
# or
npx http-server -p 8000

# Then open http://localhost:8000
```

For quick testing, you can open `index.html` directly in browser, but some data loading may fail due to CORS.

## File Structure
- `index.html` - Main application page
- `assets/css/` - Stylesheets (main.css, keyboard.css, components.css)
- `assets/js/` - JavaScript modules
- `config/settings.js` - Application configuration
- `data/` - Training texts and quotes
- `docs/README.md` - Detailed Russian documentation

## Testing
No automated test framework. Manual testing by:
1. Opening application in browser
2. Testing each difficulty level
3. Verifying keyboard highlighting works
4. Checking statistics accuracy
5. Testing on different screen sizes

## Key Technical Details
- Uses jQuery-like `$()` function (custom utility, not jQuery)
- LocalStorage for persistence via `StorageUtils` class
- Event-driven architecture with keyboard event listeners
- Real-time WPM calculation during typing
- Color-coded virtual keyboard matches physical finger positions
- Russian language focus with Cyrillic character support