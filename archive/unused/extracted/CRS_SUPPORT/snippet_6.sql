# # Extracted from CRS_SUPPORT.md (fence #6, lang='sql')
-- DuckDB stores CRS as SRID
SELECT ST_SetSRID(ST_Point(-74.0060, 40.7128), 4326);
