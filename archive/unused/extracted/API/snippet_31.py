# # Extracted from API.md (fence #31, lang='python')
from gis_viewer import GISMap, DataLoader, SpatialAnalysis
import json

# Create map
map = GISMap(
    container_id='map-div',
    center=(-74.0060, 40.7128),
    zoom=10,
    crs='EPSG:4326'
)

# Load data
loader = DataLoader()
geojson = loader.load_geojson('/data/survey.geojson')

# Add layer
map.add_layer({
    'id': 'survey-points',
    'name': 'Survey Points',
    'source': geojson,
    'type': 'GeoJSON',
    'style': {
        'fill_color': '#FF0000',
        'fill_opacity': 0.7
    }
})

# Spatial analysis
layer = map.get_layer('survey-points')
features = layer.get_features()

analysis = SpatialAnalysis(map)
for feature in features:
    buffered = analysis.buffer(feature, {'distance': 1000})
    print(f"Buffered: {buffered}")

# Export
with open('/output/results.geojson', 'w') as f:
    json.dump({'type': 'FeatureCollection', 'features': features}, f)
