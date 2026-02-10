# # Extracted from TROUBLESHOOTING.md (fence #14, lang='bash')
   # Remove features with missing geometry
   ogr2ogr -f Shapefile -where "geometry IS NOT NULL" output.shp input.shp
