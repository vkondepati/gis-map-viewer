# Open Source Starter Issues

This list is intentionally scoped to be approachable for new contributors. Maintainers can copy these items into GitHub Issues and apply labels such as `good first issue`, `help wanted`, `documentation`, and `enhancement`.

## Issue 1: Fix placeholder repository links

**Problem**
Several files still contain placeholder values like `yourusername` and `yourserver`.

**Proposed work**
- Replace placeholder repository/org URLs with real ones.
- Verify README badges and all community links resolve.

**Suggested labels**
`good first issue`, `documentation`

---

## Issue 2: Add a development setup validator script

**Problem**
New contributors are unsure whether their local environment is correctly configured.

**Proposed work**
- Create a lightweight script (for example, `scripts/check-dev-env.sh`) that validates Node/npm and required tooling.
- Add script usage to `CONTRIBUTING.md`.

**Suggested labels**
`help wanted`, `developer experience`

---

## Issue 3: Improve issue templates with reproduction checklist

**Problem**
Some bug reports arrive with incomplete details and are hard to triage.

**Proposed work**
- Add required checklist items for reproducibility (sample data, expected vs actual behavior, app version).
- Validate front matter keys for better template compatibility.

**Suggested labels**
`good first issue`, `triage`

---

## Issue 4: Add architecture diagram to docs

**Problem**
The architecture page is text-only and can be hard to parse for newcomers.

**Proposed work**
- Add a simple component diagram (SVG/PNG + source if possible).
- Include a short narrative for data flow.

**Suggested labels**
`help wanted`, `documentation`

---

## Issue 5: Add "first PR" walkthrough

**Problem**
First-time contributors may not know how to submit a high-quality PR.

**Proposed work**
- Add a short checklist section in `CONTRIBUTING.md` called “Your first PR”.
- Include examples for branch naming and commit messages.

**Suggested labels**
`good first issue`, `documentation`
