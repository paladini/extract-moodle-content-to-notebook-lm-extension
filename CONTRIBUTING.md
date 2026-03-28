# Contributing

Thanks for contributing.

This project is intentionally small, dependency-free, and easy to run locally. Contributions should preserve that simplicity.

## Local setup

1. Fork and clone the repository.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Load the project folder as an unpacked extension.
5. Reload the extension after each change while testing.

## Project principles

- Keep the extension zero-dependency when possible.
- Prefer resilient Moodle selectors over brittle theme-specific selectors.
- Preserve local-first behavior and avoid unnecessary network dependencies.
- Keep the UX direct and understandable.
- Avoid large refactors unless they clearly reduce complexity or risk.

## What makes a good contribution

- Fixes a real bug with a narrow, understandable diff.
- Improves content extraction across Moodle variants.
- Improves export quality for NotebookLM workflows.
- Improves reliability, backup, recovery, or error handling.
- Improves docs for users and contributors.

## Testing expectations

Before opening a pull request, try to validate the change on a real Moodle page when possible.

Useful manual checks:

1. Start capture and browse a Moodle course.
2. Confirm the course and modules appear correctly in the popup.
3. Export Markdown and inspect the output structure.
4. If your change touches persistence, test backup, restore, and clear flows.
5. If your change touches NotebookLM guidance, verify the README instructions remain accurate.

## Pull request guidelines

1. Create a focused branch from `main`.
2. Keep commits small and descriptive.
3. Update docs when behavior changes.
4. Explain the problem, the change, and the tradeoff in the PR description.
5. Include screenshots or sample output when the UI or exported content changes.

## Issue reports

Please include:

- Browser name and version.
- Moodle version or theme, if known.
- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Screenshots or exported snippets if useful.

## Community standards

Be respectful, specific, and constructive. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
