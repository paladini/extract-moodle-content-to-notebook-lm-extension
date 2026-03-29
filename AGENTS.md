# Agent Release And Publishing Instructions

These instructions apply to AI agents working in this repository.

## Objective

Keep product behavior, public docs, Chrome Web Store disclosures, and release artifacts consistent on every change.

## Required workflow before commit

1. Confirm runtime behavior in source files.
2. Confirm manifest permissions and version in manifest.json.
3. Confirm public wording in README.md, README.pt-BR.md, docs/index.html, docs/privacy.html, and docs/permissions.html.
4. Ensure wording does not claim behavior that the code does not implement.
5. Ensure privacy wording matches actual handled data categories.

## Versioning policy

Use semantic versioning in manifest.json.

1. Patch bump x.y.Z:
- Bug fixes
- Documentation/disclosure alignment changes
- Internal refactors with no user-facing feature change

2. Minor bump x.Y.z:
- New user-facing features
- New optional workflows that do not break existing behavior

3. Major bump X.y.z:
- Breaking changes to user workflow, data format, or compatibility

## Release packaging steps

After updating the version, generate the Chrome Web Store package in release/.

1. Remove old zip for the target version if it exists.
2. Create the zip with only extension runtime files:
- manifest.json
- background.js
- content.js
- popup.html
- popup.js
- icons/
- LICENSE
3. Name pattern:
- release/moodle-content-extractor-notebooklm-v<version>.zip
4. Validate archive file list before commit.

## Privacy and disclosure checklist

Before commit, verify the following are true.

1. Single purpose statement matches actual behavior.
2. Permission justifications match manifest permissions and code paths.
3. Privacy policy reflects currently handled data and storage/export behavior.
4. Chrome Web Store disclosure categories are consistent with actual captured data.

## Commit policy

1. Keep commit scope coherent (behavior + docs + version + zip for that release).
2. Use clear commit messages, for example:
- chore: align privacy copy with manual capture flow
- feat: add <feature> and bump minor version
- fix: resolve <bug> and bump patch version
3. Commit release zip in release/ only when preparing a publishable release.

## Post-commit verification

1. Run git status --short and confirm no unintended changes.
2. Verify the new zip exists and matches manifest version.
3. Push only after checks pass.
