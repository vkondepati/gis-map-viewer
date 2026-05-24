# Platform Boundary Inventory

This inventory captures the Electron-only interactions found in
`electron-app/renderer/renderer.js` before the platform adapter refactor.

## File IO

- `openSpatialFile`
- `saveGeoJSON`
- `saveTextFile`
- `writeGeoJSON`

## Project IO

- `openProject`
- `saveProject`
- `writeProject`
- `readProject`

## Folder / Workspace Operations

- `pickFolder`
- `listDirectory`
- `createFolder`
- `createGeoJSONFile`
- `createKMLFile`
- `createAttributesFile`
- `deletePath`

## AI / Backend Calls

- `askMapAssistant`

## Print / Export

- `saveCurrentWindowPdf`

## Shell / Menu Events

- `onOpenProjectFromShell`
- `onMenuAction`

## Result

All of the interactions above are desktop-platform concerns and should be
consumed through a platform adapter rather than directly from
`window.electronAPI`.
