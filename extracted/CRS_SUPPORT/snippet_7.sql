# # Extracted from CRS_SUPPORT.md (fence #7, lang='sql')
-- Transform to UTM Zone 18N
SELECT ST_Transform(geometry, 4326, 32618) FROM table;
