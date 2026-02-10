# # Extracted from USAGE.md (fence #9, lang='sql')
   SELECT name, population, ST_ASGEOJSON(geom)
   FROM cities
   WHERE country = 'USA'
