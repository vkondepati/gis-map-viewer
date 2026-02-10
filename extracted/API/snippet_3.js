// # Extracted from API.md (fence #3, lang='javascript')
// Fit map to bounds
map.fitBounds(
  [
    [minLon, minLat],
    [maxLon, maxLat],
  ],
  { padding: 50 },
);

// Zoom to specific level
map.setZoom(5);

// Pan to center
map.panTo([lon, lat]);

// Fly to location
map.flyTo({
  center: [lon, lat],
  zoom: 10,
  duration: 1000, // ms
});

// Reset map
map.reset();
