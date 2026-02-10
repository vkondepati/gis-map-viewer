# # Extracted from CONTRIBUTING.md (fence #11, lang='python')
# Python test example
def test_buffer_operation():
    """Test buffer creation."""
    geometry = create_test_polygon()
    result = buffer_geometry(geometry, 1000)

    assert result is not None
    assert result.geom_type == 'Polygon'
