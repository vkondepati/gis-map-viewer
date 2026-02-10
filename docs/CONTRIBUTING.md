# Contributing Guide

Thank you for your interest in contributing to Desktop GIS Map Viewer! This document provides guidelines for participating in our open-source project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Contributions](#making-contributions)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Getting Started

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. We adopt the [Contributor Covenant](CODE_OF_CONDUCT.md).

All participants must:

- Be respectful and professional
- Welcome contributors of all backgrounds
- Focus on constructive feedback
- Report unacceptable behavior to conduct@example.com

### Ways to Contribute

1. **Code** - Fix bugs, add features, improve performance
2. **Documentation** - Write guides, fix typos, improve clarity
3. **Testing** - Report bugs, test features, write tests
4. **Translation** - Help localize to other languages
5. **Design** - UI/UX improvements, icons, mockups
6. **Community** - Answer questions, help other contributors

### Before You Start

1. **Check existing issues** - Your idea might already be discussed
2. **Search pull requests** - Maybe someone is working on it
3. **Read documentation** - Might answer your question
4. **Start small** - First contribution doesn't have to be huge

## Development Setup

### Prerequisites

- Git 2.20+
- Node.js 16+ OR Python 3.8+
- Docker (optional)

### Clone Repository

```bash
# Fork on GitHub first, then clone your fork
git clone https://github.com/YOUR_USERNAME/gis-map-viewer.git
cd gis-map-viewer

# Add upstream remote for syncing
git remote add upstream https://github.com/yourusername/gis-map-viewer.git
```

### JavaScript Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Check code style
npm run lint

# Format code
npm run format
```

### Python Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Check code style
flake8 .

# Format code
black .
```

## Making Contributions

### Create a Branch

```bash
# Update local repo
git fetch upstream
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/amazing-feature

# Or for bug fix
git checkout -b fix/issue-123
```

### Branch Naming

- **Features**: `feature/descriptive-name`
- **Bug Fixes**: `fix/issue-number` or `fix/descriptive-name`
- **Docs**: `docs/descriptive-name`
- **Tests**: `test/descriptive-name`

### Make Your Changes

1. **Write code** - Follow code standards (see below)
2. **Add tests** - For new features and bug fixes
3. **Update docs** - Reflect changes in documentation
4. **Test locally** - Verify everything works
5. **Commit** - Use conventional commits

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject line

Body paragraph. Explain the change and why it's needed.

Closes #123
```

**Types**:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (not logic)
- `refactor` - Code restructuring
- `test` - Test additions/fixes
- `chore` - Build, CI, dependencies

**Examples**:

```
feat(spatial): add buffer operation for polygons

Implements ST_Buffer using GEOS library.
Allows configurable buffer distance and join styles.

Closes #123

fix(ui): correct zoom control button alignment

fix(crs): handle missing .prj file gracefully

docs(api): update DuckDB connector documentation
```

### Code Quality

Before pushing, ensure:

```bash
# All tests pass
npm test          # or pytest

# Code style passes
npm run lint      # or flake8 .

# Code is formatted
npm run format    # or black .

# No security issues
npm audit         # or safety check
```

## Code Standards

### JavaScript/TypeScript

- **Formatter**: Prettier (configured in .prettierrc)
- **Linter**: ESLint (configured in .eslintrc.json)
- **Style**:
  - 2-space indentation
  - Semicolons required
  - Single quotes preferred
  - Max line length: 100 characters

```javascript
// Good ✅
const result = map.addLayer(layer);
map.on("click", (event) => {
  console.log("Clicked at:", event.latlng);
});

// Bad ❌
let result = map.addLayer(layer);
map.on("click", (event) => {
  console.log("Clicked at:", event.latlng);
});
```

### Python

- **Formatter**: Black (88 char line length)
- **Linter**: Flake8
- **Type hints**: Required for public APIs
- **Docstrings**: Google-style format

```python
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
```

### Testing Standards

- **Coverage**: Aim for >80% overall
- **Core libraries**: >90% coverage
- **UI components**: >70% coverage

```javascript
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
```

```python
# Python test example
def test_buffer_operation():
    """Test buffer creation."""
    geometry = create_test_polygon()
    result = buffer_geometry(geometry, 1000)

    assert result is not None
    assert result.geom_type == 'Polygon'
```

## Pull Request Process

### Before Opening PR

1. **Sync with main**:

```bash
git fetch upstream
git rebase upstream/main
```

2. **Push to your fork**:

```bash
git push origin feature/amazing-feature
```

### Open Pull Request

1. **Go to GitHub**
2. **Click "Compare & pull request"**
3. **Complete PR template**:
   - Description of changes
   - Related issues (Fixes #123)
   - Type of change (feature, fix, docs)
   - Testing done
   - Checklist items

### PR Template

```markdown
## Description

Clear description of what this PR does and why.

## Related Issues

Fixes #123
Related to #456

## Type of Change

- [x] Bug fix (non-breaking)
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe how you tested this:

- Manual testing on Windows/macOS/Linux
- Unit tests added
- Integration tests updated

## Checklist

- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Comments added for complex logic
- [x] Documentation updated
- [x] Tests pass
- [x] No new warnings
- [x] No breaking changes
```

### Review Process

1. **Automated checks** run (CI/CD)
2. **Maintainers review** code quality and design
3. **Feedback** provided in comments
4. **You revise** as needed
5. **Approval** once accepted
6. **Merge** when ready

### Address Feedback

1. **Read comments** carefully
2. **Make requested changes**
3. **Commit with message**: `fix: address review feedback`
4. **Push changes**: `git push origin feature/amazing-feature`
5. **Respond to comments** asking for confirmation
6. **Request re-review** if major changes made

## Common Contributions

### Fixing a Bug

1. **Search for issue** - Find the GitHub issue
2. **Create branch**: `git checkout -b fix/issue-123`
3. **Fix the bug** - Minimal changes only
4. **Add test** - Verify fix works
5. **Update docs** - If behavior changed
6. **Submit PR** - Reference the issue

### Adding a Feature

1. **Discuss first** - Open issue to get feedback
2. **Get approval** - Maintainers agree with approach
3. **Create branch**: `git checkout -b feature/name`
4. **Write tests** - Test-driven development preferred
5. **Implement feature**
6. **Update docs**
7. **Submit PR**

### Improving Documentation

1. **Identify unclear section**
2. **Create branch**: `git checkout -b docs/fix-title`
3. **Improve writing** - Clarify, add examples, fix typos
4. **Check formatting** - Proper markdown
5. **Test links** - Ensure all links work
6. **Submit PR**

### Writing Tests

1. **Identify untested code** - Check coverage report
2. **Create test file**: `tests/unit/feature.test.js`
3. **Write tests**:
   - Happy path (feature works)
   - Edge cases
   - Error handling
4. **Ensure tests pass**: `npm test`
5. **Submit PR**

## Becoming a Maintainer

### Requirements

- 6+ months active participation
- 10+ merged pull requests
- Deep knowledge of codebase
- Commitment to project values
- Endorsement by existing maintainers

### Process

1. Nominated by current maintainer
2. Discussed in steering committee
3. Approval by consensus
4. Formal announcement

### Responsibilities

- Review and merge PRs
- Release new versions
- Respond to critical issues
- Represent project in community

## Resources

- **Documentation**: [docs/](../docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/gis-map-viewer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/gis-map-viewer/discussions)
- **Discord**: [Community chat](https://discord.gg/yourserver)
- **Email**: hello@example.com

## Questions?

Feel free to:

1. **Ask in Discussions** - For contribution questions
2. **Email maintainers** - For sensitive topics
3. **Comment on issues** - Join existing conversations
4. **Join Discord** - Real-time chat

---

Thank you for contributing to make GIS Map Viewer better! 🎉
