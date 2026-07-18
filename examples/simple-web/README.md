# NexaMap Simple Example

This example demonstrates a tiny `GISMap` wrapper (using Leaflet) and exercises basic API calls extracted from the docs: `fitBounds`, `setZoom`, `panTo`, `flyTo`, etc.

Open `examples/simple-web/index.html` in a browser (or serve the folder) to try it.

## Backend GIS Analysis Workflow

This folder also contains a sample Node.js script showing how to load and extract spatial metadata from GeoJSON data.

### How to Run the Backend Script

You can run the analysis script directly from the root of the project using Node.js:

```bash
node examples/simple-web/geojson_analysis_demo.js
