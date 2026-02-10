# Desktop GIS Map Viewer - Project Structure

Open-source desktop GIS map viewer for visualizing, analyzing, and editing geospatial data from files, web services, and cloud data warehouses.

## Project Information

| Property          | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| **Project Name**  | Desktop GIS Map Viewer                                |
| **Version**       | 1.0.0                                                 |
| **License**       | MIT                                                   |
| **Status**        | In Development                                        |
| **Repository**    | https://github.com/yourusername/gis-map-viewer        |
| **Documentation** | [Online Docs](https://gis-map-viewer.readthedocs.io/) |

## Quick Start

**For Users**:

1. [Download & Install](docs/INSTALLATION.md)
2. [Quick Start Guide](docs/USAGE.md)
3. [Feature Reference](docs/FEATURES.md)

**For Developers**:

1. [Development Setup](docs/DEVELOPMENT.md)
2. [API Reference](docs/API.md)
3. [Architecture Guide](docs/ARCHITECTURE.md)

**For Contributors**:

1. [Contributing Guidelines](docs/CONTRIBUTING.md)
2. [Code of Conduct](docs/CODE_OF_CONDUCT.md)
3. [Roadmap](docs/ROADMAP.md)

## Directory Structure

```
gis-map-viewer/
├── README.md                    # Project overview
├── LICENSE                      # MIT License
├── CHANGELOG.md                 # Version history
│
├── docs/                        # Documentation files
│   ├── INDEX.md                 # Documentation index/guide
│   ├── FEATURES.md              # Feature documentation
│   ├── INSTALLATION.md          # Installation guide
│   ├── USAGE.md                 # Quick start & workflows
│   ├── EDITING.md               # Feature editing guide
│   ├── CONFIGURATION.md         # User preferences
│   ├── SUPPORTED_FORMATS.md     # Data formats reference
│   ├── DATA_WAREHOUSES.md       # Data warehouse integration
│   ├── CRS_SUPPORT.md           # Coordinate systems
│   ├── TROUBLESHOOTING.md       # Common issues
│   ├── API.md                   # Developer API reference
│   ├── ARCHITECTURE.md          # System design
│   ├── DEVELOPMENT.md           # Development setup
│   ├── CONTRIBUTING.md          # Contribution guidelines
│   ├── ROADMAP.md               # Project roadmap
│   ├── CODE_OF_CONDUCT.md       # Community standards
│   ├── SECURITY.md              # Security policy
│   ├── images/                  # Documentation images/diagrams
│   ├── examples/                # Code examples
│   └── tutorials/               # Step-by-step tutorials
│
├── src/                         # Source code
│   ├── main/
│   │   ├── electron/            # Main Electron process
│   │   │   ├── main.js
│   │   │   └── preload.js
│   │   ├── ui/                  # User interface
│   │   │   ├── components/
│   │   │   ├── styles/
│   │   │   └── main.html
│   │   └── backend/             # Backend processing
│   │       ├── map/
│   │       ├── data/
│   │       ├── analysis/
│   │       └── connectors/
│   │
│   ├── lib/                     # Core libraries
│   │   ├── loaders/             # Data loaders
│   │   │   ├── geojson.js
│   │   │   ├── shapefile.js
│   │   │   ├── csv.js
│   │   │   └── ...
│   │   ├── connectors/          # Database connectors
│   │   │   ├── duckdb.js
│   │   │   ├── snowflake.js
│   │   │   ├── databricks.js
│   │   │   └── iceberg.js
│   │   ├── services/            # Web services
│   │   │   ├── wms.js
│   │   │   ├── wfs.js
│   │   │   └── wmts.js
│   │   └── analysis/            # Spatial analysis
│   │       ├── buffer.js
│   │       ├── intersection.js
│   │       └── ...
│   │
│   └── utils/                   # Utility functions
│       ├── crs.js               # Coordinate system utilities
│       ├── validation.js
│       └── conversion.js
│
├── test/                        # Test files
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── e2e/                     # End-to-end tests
│   └── fixtures/                # Test data
│
├── build/                       # Build output
│   ├── dist/                    # Distribution packages
│   │   ├── win/                 # Windows
│   │   ├── mac/                 # macOS
│   │   └── linux/               # Linux
│   └── temp/                    # Build artifacts
│
├── config/                      # Configuration files
│   ├── webpack.config.js        # Webpack configuration
│   ├── electron-builder.yml     # Electron builder config
│   ├── jest.config.js           # Test runner config
│   └── .eslintrc                # Linting rules
│
├── resources/                   # Application resources
│   ├── icons/                   # App icons
│   ├── themes/                  # UI themes
│   ├── icons/                   # Tool icons
│   └── data/                    # Sample datasets
│
├── scripts/                     # Build and utility scripts
│   ├── build.js                 # Build script
│   ├── release.js               # Release automation
│   └── generate-docs.js         # Documentation generation
│
├── package.json                 # NPM configuration
├── package-lock.json            # Dependency lock
├── .gitignore                   # Git ignore rules
├── .github/
│   ├── workflows/               # CI/CD pipelines
│   │   ├── test.yml
│   │   ├── release.yml
│   │   └── docs.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
└── .vscode/                     # VS Code settings
    ├── settings.json
    ├── extensions.json
    └── launch.json
```

## Technology Stack

### Frontend

- **Framework**: Electron (Desktop shell)
- **Rendering**: Leaflet / OpenLayers / Mapbox GL
- **UI**: React / Vue / QML
- **State**: Redux / Vuex
- **Language**: JavaScript/TypeScript

### Backend

- **Runtime**: Node.js / Python
- **Geospatial**: GDAL/OGR, GEOS, Proj4
- **Database**: DuckDB (local), Connectors for SF/Databricks/Iceberg

### External Services

- **Maps**: WMS, WFS, WMTS, XYZ tiles
- **Data**: Cloud data warehouses (Snowflake, Databricks, Iceberg)

## Key Files

### Configuration

- `package.json`: Node.js dependencies and scripts
- `.eslintrc`: Code linting rules
- `tsconfig.json`: TypeScript configuration
- `.vscode/settings.json`: Development environment settings

### Entry Points

- `src/main/electron/main.js`: Electron main process
- `src/main/ui/main.html`: Application window
- `src/lib/index.js`: Main API entry point

### Build & Deployment

- `scripts/build.js`: Build automation
- `config/electron-builder.yml`: Package configuration
- `.github/workflows/`: CI/CD pipelines

## Development Workflow

### Setup Development Environment

```bash
git clone https://github.com/yourusername/gis-map-viewer.git
cd gis-map-viewer
npm install
npm run dev
```

### Development Commands

```bash
npm run dev           # Start development server
npm run build         # Build for distribution
npm run test          # Run test suite
npm run lint          # Check code style
npm run docs          # Generate documentation
```

### Build Distribution

```bash
npm run build:win     # Windows installer
npm run build:mac     # macOS DMG
npm run build:linux   # Linux AppImage
npm run build:docker  # Docker image
```

## Code Quality

### Standards

- **Linting**: ESLint + Prettier
- **Testing**: Jest (unit), Cypress (e2e)
- **Coverage**: Minimum 80%
- **Type Checking**: TypeScript or JSDoc

### Pre-Commit Hooks

- Format code with Prettier
- Run linter (ESLint)
- Run unit tests
- Check for security issues

### Documentation

- Code comments for complex logic
- JSDoc for public APIs
- README for each module
- Type definitions in TypeScript

## Contributing

See [CONTRIBUTING.md](../docs/CONTRIBUTING.md) for:

- How to set up development environment
- Coding standards
- Git workflow
- Pull request process
- Release process

## Community

- **Issues**: [GitHub Issues](https://github.com/yourusername/gis-map-viewer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/gis-map-viewer/discussions)
- **Docs**: [ReadTheDocs](https://gis-map-viewer.readthedocs.io/)

## Release Process

Releases follow [Semantic Versioning](https://semver.org/):

1. **Major** (X.0.0): Breaking changes
2. **Minor** (0.X.0): New features
3. **Patch** (0.0.X): Bug fixes

See [ROADMAP.md](../docs/ROADMAP.md) for release schedule.

## License

MIT License - See [LICENSE](LICENSE) file

## Acknowledgments

- GDAL/OGR team for geospatial I/O
- GEOS for geometry operations
- OpenStreetMap for base map data
- All contributors and community members

## Getting Help

1. **Documentation**: Start at [docs/INDEX.md](docs/INDEX.md)
2. **Troubleshooting**: Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
3. **Ask Questions**: Use [GitHub Discussions](https://github.com/yourusername/gis-map-viewer/discussions)
4. **Report Bugs**: Open [GitHub Issues](https://github.com/yourusername/gis-map-viewer/issues)

---

**Last Updated**: February 2026  
**Documentation Version**: 1.0.0

For full documentation, visit [docs/INDEX.md](docs/INDEX.md)
