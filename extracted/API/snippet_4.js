// # Extracted from API.md (fence #4, lang='javascript')
// Get distance between points
const distance = map.getDistance([lon1, lat1], [lon2, lat2]);
// Returns: { meters: 1234.5, km: 1.2345, miles: 0.7665 }

// Get area of polygon
const area = map.getArea([
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
  ],
]);
// Returns: { m2: 12391.5, km2: 0.0124, acres: 3.06 }
