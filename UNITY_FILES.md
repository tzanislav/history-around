# Unity Files (Current)

This project now uses Unity files from:

- newFront-end/public/Build
- newFront-end/public/unity-game.html

These files are copied into Back-End/public by upload-unity-files.ps1.

## Recommended Flow

From project root:

1. Run upload-unity-files.ps1
2. Verify API status:
   - /api/health
   - /api/unity-status

## Naming Convention

Canonical file names in Back-End/public/Build should be:

- Web.loader.js
- Web.framework.js
- Web.data
- Web.wasm

The deploy script normalizes naming automatically when source files use lowercase names.

## Legacy

Old Brotli-specific notes and old front-end references were archived under _old/docs.
