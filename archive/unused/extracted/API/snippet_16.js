// # Extracted from API.md (fence #16, lang='javascript')
// Validate geometry
const isValid = loader.validateGeometry(geometry);

// Check for missing values
const hasMissing = loader.hasMissingValues(data);

// Check coordinate range
const inRange = loader.checkCoordinateRange(coordinates, crs);

// Detect CRS
const detectedCRS = loader.detectCRS(data);
