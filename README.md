# Resume Analyzer

A dependency-free browser app that helps you revise a resume using transparent, English-language heuristics. Resume text stays in your browser; there is no model integration, tracking, account, database, or external service.

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

- Paste a resume and an optional job description, or try fictional sample content.
- Check standard section headings, email presence, word count, action verbs, and measurable bullets.
- Detect terms from a small built-in skill dictionary and compare job keywords.
- Get actionable writing suggestions and download a plain-text review.
- Responsive layout, labeled form controls, keyboard focus, live completion announcement, and clear/reset controls.

## How it works and limitations

`analyzer.js` is a pure analysis module. It detects headings on separate lines, counts bullets beginning with common markers, and recognizes a fixed list of action verbs and measurement patterns. It does not verify facts. A missing heading can mean the heading uses an unsupported name. A summary is optional.

Job keywords combine dictionary skills and up to 15 repeated English words after a small stop-word filter. Overlap is the percentage of those terms appearing in the resume using case-insensitive boundary matches. It cannot interpret synonyms, negation, proficiency, job requirements, or semantic relevance. Missing terms are prompts to review, never advice to invent experience.

This is **not AI analysis, an ATS score, or a prediction of hiring success**. It cannot inspect PDF/DOCX files or visual formatting. Length suggestions are rough prompts, not universal resume rules. Best suited to English text. Each field accepts up to 60,000 characters.

## Privacy and security

The local server serves only an explicit allowlist of application assets. Analysis runs entirely in the browser, without network requests or browser storage. Closing/reloading the tab clears input. Browser extensions and browser-provided form recovery are outside this app's control. Exporting a report explicitly saves a file on your device. User-derived output uses text nodes, never HTML interpolation. A restrictive content security policy disables outbound connections.

## Project structure

- `index.html`, `styles.css`, `app.js`: accessible browser interface
- `analyzer.js`: deterministic analysis logic
- `analyzer.test.js`: regression tests for matching, feedback signals, empty inputs, limits, and overlap
- `server.js`: local static server using Node's standard library

No secrets or real resume data are included. The sample is fictional.
