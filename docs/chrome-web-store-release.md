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

## 4. Fill in the required listing fields

Use this as a practical baseline when creating the item in the Chrome Web Store dashboard.

### Suggested extension name

`Moodle Content Extractor for NotebookLM`

### Suggested short description

`Capture the current Moodle page and export clean Markdown for NotebookLM.`

### Suggested detailed description

`Moodle Content Extractor for NotebookLM helps you capture Moodle lesson and activity pages one page at a time and export each course as a structured Markdown file.

This is useful for students, teachers, researchers, and self-learners who want cleaner study material for NotebookLM, summaries, flashcards, and AI-assisted revision.

Main features:
- Capture the current Moodle page on user request.
- Group content by course and module.
- Export Markdown ready for NotebookLM.
- Preserve resource and video links.
- Keep data local in the browser.
- Create backups and restore previous data when needed.

The extension is local-first and does not require an external backend to work.`

### Suggested category and language

- Category: `Productivity` or `Education`
- Default language: `English`

If your initial listing is mainly for Brazilian users, you can later add localized store text in Portuguese.

### Suggested support URL

`https://github.com/paladini/extract-moodle-content-to-notebook-lm-extension`

### Suggested website URL

`https://paladini.github.io/extract-moodle-content-to-notebook-lm-extension/`

### Suggested privacy policy URL

`https://paladini.github.io/extract-moodle-content-to-notebook-lm-extension/privacy.html`

### Suggested permissions justification URL

`https://paladini.github.io/extract-moodle-content-to-notebook-lm-extension/permissions.html`

## 5. Assets and mandatory form fields checklist

Before submitting, make sure these fields are filled in:

- Extension name.
- Short description.
- Detailed description.
- At least one screenshot.
- 128x128 icon.
- Category.
- Language.
- Support contact or support URL.
- Privacy policy URL, if requested by the dashboard or data disclosure flow.
- Website URL, if you want a public project page in the listing.

Recommended but not always mandatory:

- Promotional tile images.
- Additional localized descriptions.
- A short support FAQ in the repository or website.

## 6. Upload the package

1. Create a new item in the dashboard.
2. Upload the zip file.
3. Fill in the listing fields.
4. Add screenshots and promotional assets.

## 7. Complete policy and privacy information

You will likely need to declare:

- What data is handled.
- Whether data is sold or transferred.
- Why permissions such as `storage`, `downloads`, `activeTab`, and `scripting` are needed.

Because this extension is local-first, be explicit that it stores content locally in the browser and only captures the current Moodle page after user action.

Suggested public links for the listing:

- Website: `https://paladini.github.io/extract-moodle-content-to-notebook-lm-extension/`
- Privacy policy: `https://paladini.github.io/extract-moodle-content-to-notebook-lm-extension/privacy.html`
- Permissions explanation: `https://paladini.github.io/extract-moodle-content-to-notebook-lm-extension/permissions.html`

Suggested answers for the data disclosure flow:

- Data handled: Moodle page content captured by the user, extension settings, local backup data.
- Data sale: No.
- Data transfer to third parties: No, not by default.
- Purpose of handling: local content capture, organization, export, backup, and restore.
- User control: users manually capture the current page, export files, clear data, and restore backups.

## 8. Submit for review

1. Review the package carefully.
2. Submit for review.
3. Respond to any Chrome Web Store reviewer questions.

## Suggested listing angle

- Primary value: turn Moodle into NotebookLM-ready Markdown.
- Secondary value: local-first capture with backup and restore.
- Audience: students, teachers, researchers, and self-learners using Moodle.