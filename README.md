<div align="center">

# Moodle Content Extractor for NotebookLM

Turn Moodle pages into clean Markdown for NotebookLM, flashcards, summaries, and AI-assisted study workflows.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave-1f6feb.svg)](#installation)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-2da44e.svg)](#contributing)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Download-4285F4.svg)](https://chromewebstore.google.com/detail/moodle-content-extractor/dcmooninccogclmaimgbmhineffjdjda)

[English](README.md) | [Portuguese (Brazil)](README.pt-BR.md)

</div>

---

## Why this exists

Moodle content is usually fragmented across lessons, pages, files, and embedded videos. This extension captures that material while you browse Moodle pages in tabs where capture access was enabled by user action, then exports each course as a structured Markdown file designed to work well with NotebookLM.

The result is a smoother study workflow: collect content once, export once, and reuse it for summaries, Q&A, flashcards, and revision.

## Features

- Automatic capture while you browse Moodle pages in tabs where capture access was enabled.
- Course and module grouping based on Moodle breadcrumbs and page context.
- Per-course Markdown exports ready for NotebookLM.
- Extraction of videos and attachment links such as PDF, DOCX, and PPTX.
- Safer persistence with write verification, snapshots, backup, and restore.
- Zero dependencies and no build step.
- Local-first architecture: no external server required.

## Installation

The extension is available on the **[Chrome Web Store](https://chromewebstore.google.com/detail/moodle-content-extractor/dcmooninccogclmaimgbmhineffjdjda)**. Install it directly from there for the easiest setup.

Alternatively, you can load it manually from source:

1. Clone this repository.

```bash
git clone https://github.com/paladini/extract-moodle-content-to-notebook-lm-extension.git
cd extract-moodle-content-to-notebook-lm-extension
```

2. Open `chrome://extensions` in Chrome or another Chromium-based browser.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select this project folder.

## Recommended Workflow With NotebookLM

This is the workflow that has been working well in practice:

1. Open the extension and configure your Moodle base URL.
2. Click Start Capture.
3. Browse the Moodle lesson and activity pages you want to save.
4. Stop capture when you are done browsing.
5. Export the course as Markdown.
6. In NotebookLM, create a new notebook.
7. Upload the course syllabus and the Markdown exported by this extension.
8. Ask Gemini inside NotebookLM to generate flashcards.

In English, “plano de ensino” is usually best translated as “course syllabus” or simply “syllabus”. If you want the README and site copy to sound more academic, “course syllabus” is the safer wording.

## Usage

1. Click the extension icon.
2. Save your Moodle base URL, for example `https://moodle.example.edu`.
3. Click Start Capture.
4. Browse the Moodle lesson or activity pages you want to include.
5. Click Stop Capture when you are done collecting content.
6. Export a single course or use Export All.
7. Optionally export a JSON backup or restore from a previous backup.

## What the Export Looks Like

```markdown
# Course Name

## Module: 1.1 Introduction to Databases
Type: lesson
Captured at: 2026-03-11T02:30:00.000Z

[extracted content]

### Videos
- https://youtube.com/...

### Resources
- https://moodle.example.edu/pluginfile.php/...
```

NotebookLM handles this structure well because the content is already grouped by course and module boundaries.

## Data Safety

The extension now includes stronger local recovery features:

- Verified writes to storage.
- Serialized capture writes to reduce race-condition loss.
- Automatic snapshots before destructive actions.
- JSON backup export and import.
- Manual restore of the latest snapshot.

## Privacy & Permissions

The extension uses **minimal, dynamic permissions**:

- **`activeTab`** + **`scripting`**: Scripts are injected dynamically after explicit user action. The extension does not run a static content script on all pages.
- **`storage`**: Local browser storage for captured courses and settings.
- **`downloads`**: Export functionality for Markdown and JSON backup files.

**Data is processed entirely locally.** No external backend or server communication occurs. Content is stored in your browser's local storage and only sent elsewhere when you explicitly export files.

For full details, see [docs/permissions.html](docs/permissions.html).

## How it works

1. `content.js` detects Moodle pages and extracts content.
2. `background.js` stores data in `chrome.storage.local` grouped by course.
3. The popup lets users manage capture, export, backup, and recovery.
4. Exports are downloaded as Markdown files ready for NotebookLM.

## Project Structure

```text
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── icons/
├── .github/
├── docs/
├── README.md
├── README.pt-BR.md
├── CONTRIBUTING.md
├── CONTRIBUTING.pt-BR.md
└── LICENSE
```

## Open Source

If you want to contribute, start with [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and the issue templates in [.github/ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE).

Public pages for GitHub Pages and store links live in [docs/index.html](docs/index.html), [docs/privacy.html](docs/privacy.html), and [docs/permissions.html](docs/permissions.html).

## Author

Fernando Paladini

- GitHub: https://github.com/paladini
- Email: fnpaladini@gmail.com

## License

This project is released under the MIT License. See [LICENSE](LICENSE).
