# # Extracted from CONTRIBUTING.md (fence #9, lang='python')
# Good ✅
def buffer_geometry(geometry: GeometryType, distance: float) -> GeometryType:
    """Create buffer around geometry.

    Args:
        geometry: Input geometry
        distance: Buffer distance in units

    Returns:
        Buffered geometry
    """
    return ST_Buffer(geometry, distance)

# Bad ❌
def buffer_geometry(geometry, distance):
    return ST_Buffer(geometry, distance)
