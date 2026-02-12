# # Extracted from CRS_SUPPORT.md (fence #9, lang='sql')
-- Snowflake GEOGRAPHY assumes WGS 84
-- For other CRS, use GEOMETRY type
SELECT ST_POINT(-74.0060, 40.7128)::GEOMETRY(4326);
