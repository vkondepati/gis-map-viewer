# # Extracted from FEATURES.md (fence #1, lang='python')
# Access map object
map.fitExtent([-180, -90, 180, 90])

# Load and style layer
layer = map.addLayer('cities.geojson')
layer.setStyle({'color': 'red', 'weight': 3})

# Spatial query
results = layer.queryFeatures({'population': {'>': 100000}})
