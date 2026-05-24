# NexaMap Web Version Plan

## Goal

Create a web version of NexaMap without impacting the desktop Electron version.

The core approach is to separate:

- shared map/UI/application logic
- desktop-specific platform behavior
- web-specific platform behavior

The desktop app must continue to run throughout the migration.

## Principles

- Do not rewrite the Electron app from scratch.
- Do not fork the renderer into two diverging codebases.
- Keep Electron-specific logic behind a platform adapter.
- Move shared logic into reusable modules.
- Introduce the web app as a parallel shell over shared core logic.

## Current Boundaries

Desktop-specific files:

- `electron-app/main.js`
- `electron-app/preload.js`

Shared-candidate frontend files:

- `electron-app/renderer/index.html`
- `electron-app/renderer/renderer.js`
- `electron-app/renderer/styles.css`

## Migration Phases

### Phase 0: Freeze Platform Boundaries

Goal:
- stop more direct Electron coupling from spreading through renderer logic

Tasks:
- inventory every `window.electronAPI.*` usage in `renderer.js`
- group usages into:
  - file IO
  - project IO
  - folder/workspace operations
  - AI/backend calls
  - print/export
  - shell/menu events

Deliverable:
- clear list of platform-specific behaviors

### Phase 1: Introduce a Platform Interface

Goal:
- make renderer logic depend on an injected platform object instead of Electron directly

Create:
- `shared/platform/platform-types.js`
- `shared/platform/desktop-platform.js`
- later `shared/platform/web-platform.js`

Initial platform surface:

- `openSpatialFile`
- `saveGeoJSON`
- `saveTextFile`
- `writeGeoJSON`
- `openProject`
- `saveProject`
- `writeProject`
- `readProject`
- `deleteProject`
- `pickFolder`
- `listDirectory`
- `createFolder`
- `createGeoJSONFile`
- `createKMLFile`
- `createAttributesFile`
- `deletePath`
- `saveCurrentWindowPdf`
- `askMapAssistant`
- `onOpenProjectFromShell`
- `onMenuAction`

Refactor:
- replace direct `window.electronAPI` calls in `renderer.js` with `platform.*`
- initialize the app through something like:
  - `createNexaMapApp({ platform, document, window })`

Desktop behavior:
- keep using `window.electronAPI` under the desktop adapter

Deliverable:
- Electron renderer works with no direct dependency on Electron APIs outside the adapter

### Phase 2: Split `renderer.js` into Shared Modules

Goal:
- isolate reusable browser-safe logic

Suggested modules:

- `shared/core/app-state.js`
- `shared/core/map-runtime.js`
- `shared/core/layers.js`
- `shared/core/file-import.js`
- `shared/core/project-io.js`
- `shared/core/attributes.js`
- `shared/core/editing.js`
- `shared/core/analysis.js`
- `shared/core/chat.js`
- `shared/ui/dialogs.js`

Responsibilities:

- `app-state.js`
  - active layer
  - project dirty state
  - shared app state
- `map-runtime.js`
  - Leaflet map creation
  - basemap logic
  - fit bounds helpers
- `layers.js`
  - add/remove/toggle layers
  - TOC
  - ArcGIS REST registration
- `file-import.js`
  - GeoJSON/shapefile parsing
  - CRS handling
- `project-io.js`
  - build/load project state
- `attributes.js`
  - attribute table rendering and edits
- `editing.js`
  - edit sessions, undo/redo, geometry changes
- `analysis.js`
  - buffer and spatial tools
- `chat.js`
  - map assistant UI and payload generation
- `dialogs.js`
  - modal open/close and dialog wiring

Deliverable:
- Electron app still works, but shared logic is modular and reusable

### Phase 3: Create Shared UI Assets

Goal:
- share HTML/CSS structure between desktop and web shells

Create:
- `shared/ui/index.template.html`
- `shared/ui/styles.css`

Desktop:
- continue using `electron-app/renderer/index.html` initially
- gradually align it with shared template

Web:
- create a dedicated web shell using the same shared UI assets

Deliverable:
- one UI system with two bootstraps

### Phase 4: Add the Web App Shell

Goal:
- create a browser entry point without affecting Electron

Create:
- `web-app/package.json`
- `web-app/vite.config.js`
- `web-app/index.html`
- `web-app/src/main.js`

Recommendation:
- use Vite with plain JavaScript first
- avoid React unless the team wants a broader UI rewrite

Web bootstrap:
- import shared app initializer
- create a web platform adapter
- start the shared NexaMap app

Deliverable:
- NexaMap launches in browser using shared logic

### Phase 5: Implement `webPlatform`

Goal:
- replace Electron APIs with browser-safe implementations

Create:
- `shared/platform/web-platform.js`

Mappings:

- `openSpatialFile`
  - browser file picker
  - drag/drop
- `saveGeoJSON`, `saveTextFile`, `saveProject`
  - Blob download
- `writeGeoJSON`, `writeProject`
  - treat as download/save-as for MVP
- `openProject`, `readProject`
  - upload `.prj` JSON and parse client-side
- `pickFolder`, `listDirectory`, `createFolder`, `deletePath`
  - omit or stub for web MVP
- `saveCurrentWindowPdf`
  - `window.print()` initially
- `askMapAssistant`
  - `fetch('/api/map-assistant')`
- `onOpenProjectFromShell`, `onMenuAction`
  - no-op in web

Deliverable:
- web shell can run the shared app without Electron

### Phase 6: Add a Small Backend for Web-Only Needs

Goal:
- support secure server-side features that should not run in browser

Create:
- `server-api/` or `web-api/`

Suggested endpoints:

- `POST /api/map-assistant`
- optional `POST /api/convert/shapefile`
- optional `GET/POST /api/projects`

Important:
- OpenAI API calls must not happen directly from browser code
- browser should call backend, backend should call OpenAI

Deliverable:
- secure AI support and optional server-backed features for web

### Phase 7: Define Feature Compatibility

Goal:
- make feature support explicit across desktop and web

Features to support in both first:

- basemaps
- GeoJSON load
- shapefile load
- ArcGIS REST display layers
- layer TOC
- visibility toggles
- symbology
- selection
- client-side analysis tools
- project import/export as JSON files

Desktop-first features:

- native menus
- folder operations
- direct file path save-back
- shell integration
- Electron PDF export

Web-later features:

- hosted project persistence
- auth
- collaboration
- server-backed workspaces

Deliverable:
- explicit support matrix for users and developers

### Phase 8: Refactor Project Persistence

Goal:
- support both desktop and web project workflows cleanly

Project schema should store:

- layer type:
  - `geojson`
  - `arcgis-rest`
  - future `wms`
  - future `wmts`
- layer config:
  - `sourcePath`
  - `serviceUrl`
  - `layerId`
  - symbology
  - visibility
  - labels
- map config:
  - center
  - zoom
  - basemap

Desktop persistence:
- file-based save/load

Web persistence:
- file upload/download first
- backend persistence later if needed

Deliverable:
- one portable project format across desktop and web

### Phase 9: Add Tests and Regression Coverage

Goal:
- prevent desktop regressions during extraction

Add shared tests for:

- layer serialization/deserialization
- GeoJSON add/remove/toggle
- ArcGIS REST layer config handling
- shapefile normalization
- CRS helpers
- project build/load

Desktop manual regression checklist:

- open GeoJSON
- open shapefile
- add ArcGIS REST layer
- save/load project
- print
- AI chat
- edit features
- edit attributes

Web MVP checklist:

- launch browser app
- open GeoJSON
- open shapefile zip
- add ArcGIS REST layer
- export project
- import project
- run buffer
- call AI backend

Deliverable:
- confidence that desktop stays stable while web evolves

## Recommended Repo Structure

```text
apps/
  desktop/
    main.js
    preload.js
    renderer-entry.js
  web/
    index.html
    src/main.js
packages/
  nexamap-core/
    src/
      app-state.js
      map-runtime.js
      layers.js
      file-import.js
      project-io.js
      attributes.js
      editing.js
      analysis.js
      chat.js
  nexamap-platform-desktop/
    src/index.js
  nexamap-platform-web/
    src/index.js
  nexamap-ui/
    index.html
    styles.css
server-api/
  src/
    map-assistant.js
```

## Execution Order

Recommended order for this repo:

1. Introduce the platform abstraction in the current Electron renderer
2. Extract shared modules from `renderer.js`
3. Verify Electron desktop still works
4. Create `web-app/` with Vite
5. Implement `webPlatform`
6. Add backend for AI
7. Add tests for shared core
8. Expand web-only capabilities later

## First Concrete Milestone

The best first implementation step is:

- refactor `renderer.js` so every `window.electronAPI` usage is isolated behind a `platform` object

Why:

- highest leverage
- lowest desktop risk
- required foundation for the web shell

## Success Criteria

Desktop success:

- Electron app behavior remains unchanged during refactor
- existing workflows continue to work

Web MVP success:

- browser app launches
- local spatial files can be opened
- ArcGIS REST layers can be displayed
- projects can be exported/imported
- shared map logic is reused from the desktop codebase
