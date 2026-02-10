// # Extracted from CONTRIBUTING.md (fence #10, lang='javascript')
// Unit test example
describe("Buffer Operation", () => {
  it("should create buffer around polygon", () => {
    const polygon = createTestPolygon();
    const result = buffer(polygon, 1000);

    expect(result).toBeDefined();
    expect(result.type).toBe("Polygon");
    expect(result.coordinates).toBeDefined();
  });
});
