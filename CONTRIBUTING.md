# Contributing to NexaMap

Thank you for your interest in contributing to NexaMap — an open-source desktop GIS project focused on accessibility, performance, and extensibility. This document explains how to contribute, report issues, propose features, and the workflow we follow.

---

## Quick links

- Report bugs: use Issues
- Propose features: use Issues → Feature request
- Submit code: Fork → branch → Pull Request
- Community: GitHub Discussions

---

## Getting started

1. Fork the repository and clone your fork:

```bash
git clone https://github.com/your-username/gis-map-viewer.git
cd gis-map-viewer
```

2. Create a feature branch from `main`:

```bash
git checkout -b feat/short-description
```

3. Make changes, run tests, and keep commits small and focused.

4. Push your branch and open a Pull Request against `main`.

---


## Help wanted and good first issues

We tag beginner-friendly tasks with `good first issue` and broader community tasks with `help wanted`.

- Check existing issues and filter by those labels.
- If you want a starter task, open a discussion and share your background.
- If you create an issue intended for newcomers, use the **Good first issue** template.

See also: [`docs/OPEN_SOURCE_ISSUES.md`](docs/OPEN_SOURCE_ISSUES.md) for pre-scoped issue ideas maintainers can publish.

---

## Code of conduct

Please follow the project's `CODE_OF_CONDUCT.md`. Be kind and respectful during reviews and discussions.

---

## Contribution types

- Bug fixes
- New features or tool implementations
- Documentation improvements or examples
- Tests and CI improvements
- Localization and accessibility fixes
- Design (icons, UI/UX proposals)

---

## Branching & workflow

- `main`: stable production-ready code
- `develop` (optional): active development integration
- Feature branches: `feat/<short-description>`
- Bugfix branches: `fix/<short-description>`
- Release branches: `release/vX.Y.Z`

Pull Requests should target `main` (or `develop` if present). Include a clear description, motivation, and link to any relevant issue.

---

## Pull request checklist

- [ ] Followed project coding style and lint rules
- [ ] Tests added or updated (unit/integration)
- [ ] Documentation updated if behavior changes
- [ ] `CHANGELOG.md` updated with short note (if necessary)
- [ ] CI passes

Use the PR template when opening a pull request.

---

## Code style & tooling

- JavaScript/TypeScript: ESLint + Prettier (project config)
- Python: Black + Flake8 (if applicable)
- Run linters locally before committing.

Example commands:

```bash
npm run lint
npm test
```

---

## Commit messages

We use Conventional Commits. Examples:

- `fix(parser): handle null geometries`
- `feat(api): add ST_Buffer helper`
- `docs: update CONTRIBUTING.md`
- `chore: bump dependencies`

Good commit messages help with changelog generation.

---

## Tests

- Add unit tests for new logic and regression tests for fixes.
- Aim for coverage where reasonable; maintainers will review test scope.

Run tests locally:

```bash
npm test
```

---

## Documentation

- Update `docs/` for new features or user-facing changes.
- Add examples in `/docs/examples` when adding new API features.

---

## Pull request review process

- PRs will be assigned reviewers from maintainers.
- Expect a review cycle: code style, tests, API design, docs.
- Address review comments; maintainers may request changes or approve.
- Once CI passes and approvals obtained, a maintainer will merge.

---

## Commit signing and license

By contributing, you agree to license your contributions under the project's MIT license. A Contributor License Agreement (CLA) is not required at this time. If we change this policy, we will notify contributors.

---

## Security and sensitive issues

If you discover a security vulnerability, see `SECURITY.md` for private reporting instructions. Do not disclose publicly until fixed.

---

## How to propose a new feature

1. Search Issues to avoid duplicates.
2. Open an Issue using the "Feature request" template.
3. Provide motivation, proposed API or UI changes, and examples.
4. If substantial, open a design discussion in GitHub Discussions.

---

## How to become a maintainer

- Contributors who make repeated, high-quality contributions may be invited to become maintainers.
- See `MAINTAINERS.md` for the current list and how additions are made.

---

## Helpful links

- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
- [`SECURITY.md`](SECURITY.md)
- Issue templates in `.github/ISSUE_TEMPLATE`

Thank you for contributing to NexaMap — your help makes the project better for everyone.
