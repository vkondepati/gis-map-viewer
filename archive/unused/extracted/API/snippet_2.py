# # Extracted from API.md (fence #2, lang='python')
# Python
from gis_viewer import GISMap

map = GISMap(
    container_id='map-div',
    center=(0, 0),
    zoom=2,
    crs='EPSG:4326',
    style='light'
)
