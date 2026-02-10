// Tiny GISMap wrapper around Leaflet to demonstrate extracted snippets
class GISMap {
  constructor(opts) {
    this.opts = opts || {};
    const center = opts.center || [0, 0];
    const zoom = opts.zoom || 2;
    this._map = L.map(opts.container || 'map-div').setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this._map);
    this._initial = { center: center.slice(), zoom };
  }

  fitBounds(bounds, opts) {
    this._map.fitBounds(bounds, opts || {});
  }

  setZoom(z) {
    this._map.setZoom(z);
  }

  panTo(latlng) {
    this._map.panTo(latlng);
  }

  flyTo({ center, zoom, duration }) {
    this._map.flyTo(center, zoom, { animate: true, duration: (duration || 1000) / 1000 });
  }

  reset() {
    this._map.setView(this._initial.center, this._initial.zoom);
  }
}

// Wire UI to map using the extracted snippet-style calls
window.addEventListener('load', () => {
  const map = new GISMap({ container: 'map-div', center: [0, 0], zoom: 2, crs: 'EPSG:4326' });

  document.getElementById('fit-btn').addEventListener('click', () => {
    map.fitBounds([
      [-10, -10],
      [10, 10],
    ], { padding: 50 });
  });

  document.getElementById('zoom-btn').addEventListener('click', () => map.setZoom(5));
  document.getElementById('pan-btn').addEventListener('click', () => map.panTo([0, 0]));
  document.getElementById('fly-btn').addEventListener('click', () =>
    map.flyTo({ center: [55.75, 37.62], zoom: 10, duration: 1000 })
  );
  document.getElementById('reset-btn').addEventListener('click', () => map.reset());
});
