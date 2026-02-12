# # Extracted from TROUBLESHOOTING.md (fence #5, lang='bash')
     # Convert Shapefile to GeoJSON
     ogr2ogr -f GeoJSON output.geojson input.shp

     # Convert GeoTIFF to PNG
     gdal_translate input.tif output.png
