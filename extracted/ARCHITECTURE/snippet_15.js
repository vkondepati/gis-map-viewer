// # Extracted from ARCHITECTURE.md (fence #15, lang='javascript')
class BufferToolPlugin {
  install(map) {
    map.registerTool("buffer", {
      name: "Buffer",
      icon: "buffer.png",
      execute: (feature, distance) => {
        return performBuffer(feature, distance);
      },
    });
  }
}
