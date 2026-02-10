# NexaMap Desktop Example (Electron)

This is a minimal Electron-based desktop map app demonstrating core functionality from the specs:

- Loads and displays GeoJSON files
- Basic layer listing
- CRS selector placeholder (EPSG:3857 / EPSG:4326)

Setup

1. Install dependencies:

```bash
cd electron-app
npm install
```

2. Run the app:

```bash
npm start
```

Notes

- This scaffold is intentionally small; advanced CRS reprojection, GDAL integration, and data-warehouse connectors are left as next steps and extension points.
