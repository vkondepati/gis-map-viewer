# # Extracted from CRS_SUPPORT.md (fence #10, lang='python')
from databricks.labs.mosaic import *

df = spark.read.parquet("path/to/geospatial/data")
# Mosaic auto-detects CRS
display(df.select(mos.st_srid(mos.col("geometry"))))
