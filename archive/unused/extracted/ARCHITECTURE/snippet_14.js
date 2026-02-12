// # Extracted from ARCHITECTURE.md (fence #14, lang='javascript')
// Plugin interface
class MyPlugin {
  constructor(map) {
    this.map = map;
  }

  install() {
    // Register tools, panels, etc.
    this.map.registerTool("myTool", MyTool);
    this.map.addPanel("myPanel", MyPanel);
  }
}

// Usage
map.installPlugin(new MyPlugin(map));
