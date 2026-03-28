# Chrome Web Store Release Guide

## 1. Prepare the extension package

1. Make sure `manifest.json` is correct.
2. Confirm the extension works when loaded unpacked.
3. Remove temporary or local-only files from the release package.
4. Zip the extension source files.

## 2. Create a developer account

1. Go to the Chrome Web Store Developer Dashboard.
2. Pay the one-time registration fee.
3. Complete the developer profile.

## 3. Create the store listing

Prepare these assets in advance:

- Extension name.
- Short description.
- Detailed description.
- Screenshots.
- A 128x128 icon.
- Privacy disclosure and support links.
- Website URL or GitHub URL.

What the repository already has:

- Basic extension icons in `icons/icon-16.png`, `icons/icon-48.png`, and `icons/icon-128.png`.
- Privacy page in `docs/privacy.html`.
- Permissions explanation page in `docs/permissions.html`.
- Public landing page in `docs/index.html`.

What you still need for the Chrome Web Store listing:

- Store screenshots.
- Optional promotional graphics if you want a richer listing.
- Final store description text.

## 4. Upload the package

1. Create a new item in the dashboard.
2. Upload the zip file.
3. Fill in the listing fields.
4. Add screenshots and promotional assets.

## 5. Complete policy and privacy information

You will likely need to declare:

- What data is handled.
- Whether data is sold or transferred.
- Why permissions such as `storage`, `downloads`, `activeTab`, and `scripting` are needed.

Because this extension is local-first, be explicit that it stores content locally in the browser and exports files on user request.

Suggested public links for the listing:

- Website: `https://paladini.github.io/extract-moodle-content-to-notebook-lm-extension/`
- Privacy policy: `https://paladini.github.io/extract-moodle-content-to-notebook-lm-extension/privacy.html`
- Permissions explanation: `https://paladini.github.io/extract-moodle-content-to-notebook-lm-extension/permissions.html`

## 6. Submit for review

1. Review the package carefully.
2. Submit for review.
3. Respond to any Chrome Web Store reviewer questions.

## Suggested listing angle

- Primary value: turn Moodle into NotebookLM-ready Markdown.
- Secondary value: local-first capture with backup and restore.
- Audience: students, teachers, researchers, and self-learners using Moodle.