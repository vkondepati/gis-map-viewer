# Installation Guide

This project is an Electron desktop application located in `electron-app/`.

## System Requirements

- Windows 10+, macOS 12+, or Ubuntu 20.04+
- Node.js 20.x (recommended)
- npm 10+
- Git

## Run From Source

1. Clone the repository.

```bash
git clone <your-repo-url>
cd map
```

2. Install dependencies.

```bash
npm install --prefix electron-app
```

3. Start the app.

```bash
npm run dev
```

Alternative:

```bash
npm start
```

## Build Distributables Locally

From repository root:

```bash
cd electron-app
npx --yes electron-builder --publish never --win --x64
npx --yes electron-builder --publish never --mac --x64 --arm64
npx --yes electron-builder --publish never --linux AppImage deb --x64
```

Build output is generated in:

```text
electron-app/dist/
```

## Install From Release Artifacts

Artifacts are produced by the GitHub release pipeline (see `docs/RELEASE_PIPELINE.md`):

- Windows: `.exe`
- macOS: `.dmg` / `.zip`
- Linux: `.AppImage` / `.deb`

Download the artifact for your platform from the GitHub Release and install it normally.

## Troubleshooting

- If Electron fails to launch, remove `electron-app/node_modules` and run install again.
- If build tools fail on Linux, install required system libraries for Electron packaging.
- If macOS build is unsigned in CI, this is expected unless signing secrets are configured.
