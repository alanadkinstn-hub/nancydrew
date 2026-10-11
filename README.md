# Nancy Drew Collection (PWA)

Companion to the [Hardy Boys Collection](https://github.com/alanadkinstn-hub/hardyboys), built the same way.

Static site: `index.html` (app + embedded checklist data), `manifest.webmanifest`, `sw.js`, icons.
Host on any HTTPS static host (deployed with GitHub Pages from `main` /). Open in Safari on iPhone → Share → Add to Home Screen.

- Data: IndexedDB on the device (localStorage fallback). Backup via JSON export/import (`app: "nancydrew-catalog"`, `series: "nancydrew"`, same schema as the Hardy Boys app); CSV exports for copies and full checklist.
- Rebuild after editing: `python3 tools/build_data.py && python3 tools/build.py` (sources in `src/`, template in `tools/index.src.html`). Covers: `python3 tools/fetch_covers.py` (polite, cached in `tools/olcache/`).
- Tests (Playwright): serve the folder on :8766, then `node tools/test6.js`, `test7.js`, `test8.js`.
- Browser storage is tied to the site's URL. Export/import a backup when moving.
