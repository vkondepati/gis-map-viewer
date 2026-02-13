# Release Pipeline

The project uses GitHub Actions workflow:

- `.github/workflows/release.yml`

## Triggers

- Tag push: `v*` (example: `v0.2.0`)
- Manual trigger: `workflow_dispatch`

## What It Does

1. Builds Electron distributables on:
   - Windows (`windows-latest`)
   - macOS (`macos-latest`)
   - Linux (`ubuntu-latest`)
2. Uploads platform artifacts from `electron-app/dist/`.
3. On tag builds, publishes a GitHub Release and attaches artifacts.

## Artifact Types

- Windows: `.exe`
- macOS: `.dmg`, `.zip`
- Linux: `.AppImage`, `.deb`

## How To Create A Release

1. Commit and push changes to `main`.
2. Create and push a version tag:

```bash
git tag v0.2.0
git push origin v0.2.0
```

3. Wait for `Release Build` workflow to finish.
4. Open GitHub Releases and verify attached assets.

## Notes

- macOS artifacts are unsigned unless you configure signing secrets.
- The workflow currently publishes build artifacts and GitHub Releases; store/distribute installers from Release assets.
