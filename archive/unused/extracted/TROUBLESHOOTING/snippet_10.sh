# # Extracted from TROUBLESHOOTING.md (fence #10, lang='bash')
     # Using GDAL
     ogr2ogr -f Shapefile -simplify 10 output.shp input.shp

     # Using Python
     import geopandas as gpd
     gdf = gpd.read_file('input.shp')
     gdf['geometry'] = gdf.geometry.simplify(tolerance=0.01)
     gdf.to_file('output.shp')
