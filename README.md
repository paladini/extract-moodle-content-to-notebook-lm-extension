<div align="center">

# Moodle Content Extractor for NotebookLM

**Browse Moodle. Export Markdown. Study smarter with [NotebookLM](https://notebooklm.google.com/).**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave-blueviolet.svg)](#installation)

</div>

---

A browser extension that silently captures structured content from [Moodle](https://moodle.org/) pages as you browse, then exports it as clean Markdown files optimized for [Google NotebookLM](https://notebooklm.google.com/). Content is automatically organized by **course** and **module** — just navigate your classes normally and export when you're ready.

> **No build step. No dependencies. Just load and go.**

<!-- TODO: Add screenshot or demo GIF here -->
<!-- ![Screenshot](docs/screenshot.png) -->

## Features

- **Auto-capture** — Content is captured in the background as you browse Moodle pages.
- **Course & module detection** — Groups content by course (via breadcrumb) and module (via page heading/URL) automatically.
- **Per-course export** — Export each course as a separate `.md` file, ready to upload to NotebookLM.
- **NotebookLM-optimized Markdown** — Structured `H1` (course) → `H2` (module) hierarchy so NotebookLM creates meaningful topics out of the box.
- **Video & resource extraction** — Captures YouTube/Vimeo embeds and file attachments (PDF, DOCX, PPTX, etc.).
- **URL-based filtering** — Only captures pages matching your configured Moodle instance URL.
- **Moodle DOM detection** — Validates DOM signatures to avoid capturing non-Moodle pages.

## Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/paladini/extract-moodle-content-to-notebook-lm-extension.git
   ```
2. Open `chrome://extensions` in Chrome (or any Chromium-based browser like Edge or Brave).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the cloned project folder.
5. The extension icon will appear in your toolbar. You're ready to go!

## Usage

1. **Configure your Moodle URL** — Click the extension icon and enter your Moodle base URL (e.g. `https://moodle.example.com`). Click **Save**.
2. **Start capturing** — Click **Start Capture**. The status dot turns green.
3. **Browse your courses** — Navigate through your Moodle courses and modules normally. Each page is captured automatically in the background.
4. **Stop capturing** — Click **Stop Capture** when done.
5. **Export** — Click **Export** next to a specific course, or **Export All** to download all courses. Each course becomes a separate `.md` file.
6. **Upload to NotebookLM** — Upload the exported `.md` file(s) as sources in [NotebookLM](https://notebooklm.google.com/) and start studying.

## Export Format

Each exported Markdown file follows this structure:

```markdown
# Course Name

## Module: 1.1 Introduction to Databases
**Type:** lesson | **Captured at:** 2026-03-11T02:30:00.000Z

[extracted content...]

### Videos
- [Video](https://youtube.com/...)

### Resources
- [Slides](https://moodle.example.com/pluginfile.php/...)

---

## Module: 1.2 Relational Model
...
```

This hierarchy lets NotebookLM automatically create meaningful topics and summaries from your course material.

## How It Works

1. A **content script** (`content.js`) runs on every page and checks for Moodle DOM signatures.
2. When a valid Moodle page is detected (and capturing is enabled), it extracts course info from the breadcrumb, module info from the URL/heading, and the main content area.
3. The extracted data is sent to the **service worker** (`background.js`), which stores it in `chrome.storage.local` grouped by course and deduplicated by URL.
4. On export, the service worker assembles a Markdown file per course and triggers a download via the `chrome.downloads` API.

## Tech Stack

- **Manifest V3** Chrome Extension
- **Permissions:** `storage`, `activeTab`, `scripting`, `downloads`
- **Vanilla JavaScript** — zero dependencies, no build step

## Project Structure

```
├── manifest.json      # Extension manifest (V3)
├── background.js      # Service worker: state, storage, export
├── content.js         # Content script: Moodle detection & extraction
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic and event handlers
├── LICENSE            # MIT License
├── CONTRIBUTING.md    # Contribution guidelines
└── README.md          # You are here
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started, report issues, and submit pull requests.

## Author

**Fernando Paladini** — [GitHub](https://github.com/paladini)

## License

[MIT](LICENSE) — feel free to use, modify, and distribute.
