# Project Roadmap

Strategic vision and planned development timeline for Desktop GIS Map Viewer.

## Table of Contents

- [Vision](#vision)
- [Release Schedule](#release-schedule)
- [Version 1.0 - Current](#version-10---current)
- [Version 1.1 - Planned](#version-11---planned)
- [Version 1.2 - Future](#version-12---future)
- [Version 2.0 - Long-term](#version-20---long-term)
- [Feature Proposals](#feature-proposals)
- [Community Input](#community-input)

## Vision

**Build the world's leading open-source desktop GIS viewer that is:**

- **Accessible** - For professionals and beginners alike
- **Performant** - Handles large datasets efficiently
- **Extensible** - Through plugins and APIs
- **Community-driven** - Transparent governance and planning
- **Open** - Fully open-source with permissive license

## Release Schedule

| Version | Target  | Status         | Focus                        |
| ------- | ------- | -------------- | ---------------------------- |
| 1.0     | Q2 2026 | 🔄 In Progress | Core features, documentation |
| 1.1     | Q3 2026 | 📋 Planned     | 3D, analysis, plugins        |
| 1.2     | Q4 2026 | 📋 Planned     | Collaboration, mobile        |
| 2.0     | 2027    | 💭 Proposed    | Cloud-native, AI             |

## Version 1.0 - Current

**Focus**: Stable core GIS functionality with modern data support

**Target**: Q2 2026

### Completed ✅

- [x] Core mapping functionality
- [x] Zoom, pan, identify, select tools
- [x] Layer management and styling
- [x] Shapefile and GeoJSON support
- [x] CSV import with lat/long coordinates
- [x] WMS/WFS/WMTS web service integration
- [x] Data warehouse connectors (DuckDB, Snowflake, Databricks, Iceberg)
- [x] WGS 84 coordinate system support
- [x] Basic geometry editing
- [x] Project save/load
- [x] Spatial analysis tools (buffer, intersection, union)
- [x] Windows, macOS, Linux installers

### In Progress 🔄

- [ ] Comprehensive documentation
- [ ] API stabilization
- [ ] Performance optimization for large datasets
- [ ] Community feedback integration
- [ ] Release candidate testing

### Release Criteria

- ✅ Core features stable and tested
- ✅ User documentation complete
- ✅ 80%+ test coverage
- ✅ Performance meets requirements
- ✅ No critical bugs
- ✅ Community feedback addressed

## Version 1.1 - Planned

**Focus**: Advanced capabilities and extensibility

**Target**: Q3 2026

### Features

#### 3D Visualization

- [ ] 3D map view (Cesium.js integration)
- [ ] Terrain/elevation rendering
- [ ] 3D building visualization
- [ ] Perspective and orthographic views
- [ ] 3D feature styling

#### Advanced Spatial Analysis

- [ ] Voronoi diagrams
- [ ] Delaunay triangulation
- [ ] Network analysis
- [ ] Routing optimization
- [ ] Heat maps

#### Raster Processing

- [ ] Raster rendering improvements
- [ ] Band math operations
- [ ] Classification tools
- [ ] Map algebra
- [ ] Satellite imagery tools

#### Plugin System

- [ ] Plugin architecture
- [ ] Plugin marketplace
- [ ] Developer SDK
- [ ] Example plugins
- [ ] Plugin documentation

#### Performance

- [ ] Lazy loading for large datasets
- [ ] Spatial indexing improvements
- [ ] Memory optimization
- [ ] GPU acceleration options
- [ ] Progressive rendering

### Timeline

- Month 1: Design & architecture
- Month 2-3: Development
- Month 1: Testing & polish
- Final week: Release candidate

## Version 1.2 - Future

**Focus**: Collaboration and mobile access

**Target**: Q4 2026

### Features

#### Real-time Collaboration

- [ ] Multi-user editing
- [ ] Change tracking
- [ ] Conflict resolution
- [ ] User permissions
- [ ] Activity log

#### Time-Series Data

- [ ] Temporal animation
- [ ] Time slider controls
- [ ] Historical comparison
- [ ] Change analysis
- [ ] Video export

#### Advanced Styling

- [ ] Data-driven expressions
- [ ] Custom style builder
- [ ] Animation support
- [ ] Dynamic labels
- [ ] Advanced symbology

#### Mobile Companion

- [ ] Mobile app (iOS/Android)
- [ ] Mobile data capture
- [ ] Cloud sync
- [ ] Offline mapping
- [ ] Touch-optimized UI

#### Offline Mode

- [ ] Offline data storage
- [ ] Offline editing
- [ ] Sync when online
- [ ] Automatic conflict resolution

## Version 2.0 - Long-term

**Focus**: Cloud-native, AI, and advanced analytics

**Target**: 2027

### Major Changes

#### Cloud-Native Architecture

- [ ] Web browser version
- [ ] Serverless functions
- [ ] Cloud data pipelines
- [ ] Multi-cloud support
- [ ] Containerized deployment

#### AI and Machine Learning

- [ ] Object detection (satellite/aerial images)
- [ ] Land cover classification
- [ ] Change detection
- [ ] Predictive analytics
- [ ] Anomaly detection

#### Enterprise Features

- [ ] LDAP/SSO authentication
- [ ] Audit logging
- [ ] Fine-grained permissions
- [ ] API rate limiting
- [ ] Enterprise SLA support

#### Ecosystem

- [ ] Plugin marketplace
- [ ] Community extensions
- [ ] Third-party integrations
- [ ] Certification program
- [ ] Commercial support model

#### Advanced Analytics

- [ ] Statistical analysis tools
- [ ] Data mining
- [ ] Pattern recognition
- [ ] Predictive models
- [ ] Dashboard builder

## Feature Proposals

### High Priority (Next 2 Releases)

| Feature                      | Effort | Impact | Status   |
| ---------------------------- | ------ | ------ | -------- |
| GeoPackage write support     | Medium | High   | Proposed |
| Vector tile (MVT) support    | Medium | High   | Proposed |
| PostGIS advanced features    | Medium | Medium | Proposed |
| REST API (headless)          | Medium | Medium | Proposed |
| Batch processing             | Medium | Medium | Proposed |
| Advanced styling expressions | Medium | High   | Proposed |

### Medium Priority (2-3 Releases Out)

| Feature                         | Effort | Impact | Status   |
| ------------------------------- | ------ | ------ | -------- |
| LiDAR point cloud visualization | Large  | Medium | Proposed |
| Time-aware queries              | Large  | Medium | Proposed |
| ML model integration            | Large  | Medium | Proposed |
| Advanced geocoding              | Medium | Low    | Proposed |
| Network analysis tools          | Large  | Low    | Proposed |

### Future Considerations (Speculative)

- Augmented Reality visualization
- Blockchain-based data verification
- IoT sensor integration
- Quantum geospatial computing
- Advanced computer vision features

## Community Input

### How to Influence Roadmap

1. **Vote on Features** - Upvote on GitHub Discussions
2. **Sponsor Development** - Organizations can fund features
3. **Submit RFCs** - Request for Comments on major features
4. **Join Governance** - Become core contributor

### Feature Request Process

1. **Check existing issues** - Don't duplicate
2. **Open discussion** - Gauge community interest
3. **Submit formal proposal** - With use cases
4. **Discuss with team** - Get feedback
5. **RFC if major** - For significant features
6. **Implementation** - If approved and prioritized

### Voting System

**How it works**:

- Users vote on GitHub Discussions
- High-voted features get prioritized
- Sponsors can fast-track development
- Quarterly review of priorities

**Voting Weight**:

- Regular user: 1 vote
- Core contributor: 5 votes
- Sponsor: 10 votes
- Steering committee: 20 votes

## Breaking Changes

### Version 1.1

- No breaking changes planned
- Backward compatible with 1.0 APIs

### Version 1.2

- Minor breaking changes possible
- Early deprecation notices in 1.1
- Migration guide provided

### Version 2.0

- Potential major breaking changes
- Long deprecation period
- Comprehensive migration guide

## Deprecation Policy

- **Notice period**: 2 versions before removal
- **Documentation**: Clear migration guide
- **Support**: Office hours for questions
- **Timeline**: Published in advance

## Documentation Roadmap

### Version 1.0

- ✅ User guide
- ✅ Installation guide
- ✅ Feature documentation
- ✅ API reference
- [ ] Video tutorials
- [ ] Interactive demos

### Version 1.1

- [ ] Plugin development guide
- [ ] Raster processing guide
- [ ] 3D visualization guide
- [ ] Advanced styling cookbook

### Version 1.2

- [ ] Collaboration guide
- [ ] Mobile app guide
- [ ] REST API documentation

## Getting Involved

### Ways to Help Roadmap

1. **Vote** - Help prioritize features
2. **Propose** - Suggest new features
3. **Discuss** - Share use cases
4. **Contribute** - Help implement
5. **Sponsor** - Fund development
6. **Feedback** - Report issues

### Roadmap Review

- **Quarterly**: Community feedback session
- **Annually**: Strategic planning review
- **Ad-hoc**: Major changes as needed

### Contact

- **Discussions**: [GitHub Discussions](https://github.com/yourusername/gis-map-viewer/discussions)
- **Issues**: [Feature requests](https://github.com/yourusername/gis-map-viewer/issues)
- **Discord**: [Community chat](https://discord.gg/yourserver)

---

**Last Updated**: February 2026  
**Next Review**: March 2026

For current progress, see [GitHub Project Board](https://github.com/yourusername/gis-map-viewer/projects/1).
