# Contributing

Thanks for considering contributing to the Moodle Content Extractor! Here's how to get started.

## Getting started

1. Fork and clone the repository.
2. Open `chrome://extensions`, enable Developer mode, and load the project folder as an unpacked extension.
3. Make your changes — the extension uses vanilla JS with no build step.
4. Reload the extension in `chrome://extensions` to test.

## Guidelines

- **Keep it generic.** Moodle installations vary widely in themes, versions, and configurations. Avoid overly specific CSS selectors or assumptions about DOM structure. Prefer broad, resilient selectors.
- **No build tools required.** The extension should remain zero-dependency and work by loading the folder directly.
- **Test on real Moodle pages.** If possible, verify your changes against a live Moodle instance.
- **Follow existing code style.** Consistent formatting, JSDoc comments on public functions, and clear variable names.

## Reporting issues

Open an issue with:
- Your Moodle version/theme (if known).
- Steps to reproduce.
- Expected vs actual behavior.
- Browser and OS.

## Pull requests

1. Create a feature branch from `main`.
2. Keep commits focused and descriptive.
3. Update the README if your change affects usage.
4. Open a PR with a clear description of what and why.

## Code of conduct

Be respectful and constructive. We're all here to make studying easier.
