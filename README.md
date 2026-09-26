# Resume Analyzer

A browser app that helps you revise a resume using transparent, English-language heuristics. Resume text stays in your browser; there is no model integration, tracking, account, database, or external service.

## Run

Install Node.js 20 or later, then run these commands from this directory:

```sh
npm start
```

Open http://localhost:3000. No dependency installation or build step is needed. Set `PORT` to change the port. The server binds only to your local machine.

```sh
npm test
```

## Features

- Upload a resume PDF and optionally paste a job description. Resume paste input has been removed.
- Extract text locally with bundled Mozilla PDF.js, review it in a read-only preview, and analyze it.
- Clear loading, invalid-file, encrypted-file, no-text, and limit errors; replacing or clearing a file cancels its pending result.
- Check standard section headings, email presence, word count, action verbs, and measurable bullets.
- Detect terms from a small built-in skill dictionary and compare job keywords.
- Get actionable writing suggestions and download a plain-text review.
- Responsive layout, labeled form controls, keyboard focus, live completion announcement, and clear/reset controls.

## How it works and limitations

`analyzer.js` is a pure analysis module. It detects headings on separate lines, counts bullets beginning with common markers, and recognizes a fixed list of action verbs and measurement patterns. It does not verify facts. A missing heading can mean the heading uses an unsupported name. A summary is optional.

Job keywords combine dictionary skills and up to 15 repeated English words after a small stop-word filter. Overlap is the percentage of those terms appearing in the resume using case-insensitive boundary matches. It cannot interpret synonyms, negation, proficiency, job requirements, or semantic relevance. Missing terms are prompts to review, never advice to invent experience.

This is **not AI analysis, an ATS score, or a prediction of hiring success**. It extracts selectable text from PDFs, but cannot read DOCX, perform OCR, or assess visual formatting. Length suggestions are rough prompts, not universal resume rules. Best suited to English text. PDF limits: 10 MB, 30 pages, 60,000 extracted characters, and a 45-second parser timeout. Job descriptions accept up to 60,000 characters. Scanned/image-only files need OCR before upload. Password-protected files need an unlocked copy. Complex columns, unusual font encodings, and mixed image/text pages can produce incomplete or out-of-order text; always check the preview. Pages without text are reported.

## Privacy and security

The local server serves only an explicit allowlist of application assets. Analysis runs entirely in the browser, without network requests or browser storage. Closing/reloading the tab clears input. Browser extensions and browser-provided form recovery are outside this app's control. Exporting a report explicitly saves a file on your device. User-derived output uses text nodes, never HTML interpolation. The local server restricts connections and workers to the same origin. PDF bytes are passed directly to the parser in memory. The static GitHub Pages host serves app assets; there is no resume upload endpoint.

## Project structure

- `index.html`, `styles.css`, `app.js`: accessible browser interface
- `analyzer.js`: deterministic analysis logic
- `analyzer.test.js`: regression tests for matching, feedback signals, empty inputs, limits, and overlap
- `server.js`: local static server using Node's standard library

No secrets or real resume data are included.

## PDF dependency

Mozilla PDF.js (`pdfjs-dist` **6.3.289**, Apache-2.0) is bundled in `vendor/` so there is no runtime CDN dependency. Both `pdf.min.mjs` and `pdf.worker.min.mjs` come from `legacy/build/` in the same official npm package. The license is in `vendor/PDFJS-LICENSE.txt`. See https://mozilla.github.io/pdf.js/ and https://www.npmjs.com/package/pdfjs-dist. Use a current Chrome, Edge, Firefox, or Safari browser. Node.js only serves local files; browser extraction uses the compatibility browser build.

To update PDF.js, obtain a current `pdfjs-dist` release from npm, replace both bundled modules together and retain its license. Re-test selectable-text, password-protected, damaged, and image-only PDFs before deployment. No optional rendering, fonts, WASM, or CMap assets are bundled; PDFs requiring uncommon external character maps may not extract correctly. PDF scripts are not executed and dynamic evaluation is disabled.

## Deployment

GitHub Pages publishes `main` from `/ (root)` at https://govindjp.github.io/resume-analyzer/. All asset and worker paths are relative to the app. No Node server runs on Pages. Commit the `vendor/` files along with application changes. Run `npm test` for analysis and PDF reader logic tests; validate the actual browser worker/upload flow before release.
