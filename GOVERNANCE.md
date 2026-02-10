# NexaMap Governance

This document describes how NexaMap is governed, how decisions are made, and how contributors can advance into maintainers or steering roles.

## Governance model

NexaMap follows a lightweight, meritocratic governance model with a Core Maintainers group and an optional Steering Committee for major direction. The model aims to balance transparency, inclusiveness, and efficient decision-making.

### Roles

- **Contributors**: Anyone who files issues, submits PRs, writes docs, or helps triage.
- **Maintainers**: Trusted contributors with merge rights for parts of the codebase.
- **Core Maintainers**: Team with broad merge rights and release responsibilities.
- **Steering Committee (optional)**: Small group advising strategy, roadmap, and major policy decisions.
- **Release Manager**: Person responsible for coordinating releases and changelogs.

### How decisions are made

- **Routine changes** (bug fixes, small improvements): Maintainers approve and merge.
- **Feature decisions** (new major features, API changes): Discuss in Issues / Discussions. A feature proposal should include rationale, compatibility concerns, and migration guidance.
- **Policy decisions** (licensing, governance changes): Discuss publicly and require approval by majority of Core Maintainers.

### Adding Maintainers

- Candidates are nominated by an existing maintainer or via community nomination.
- Requirements: sustained contributions, code quality, responsiveness, and understanding of project goals.
- Approval: Majority vote of Core Maintainers.

### Removing Maintainers

- Maintainers may step down voluntarily or be removed by consensus of Core Maintainers for cause (e.g., failing to follow Code of Conduct).
- Removal process: documented complaint → private review → resolution.

### Release process

- Releases are semantic (SemVer). Release Manager prepares release notes and coordinates tagging.
- Critical security fixes may be backported to patch versions.

### Dispute resolution

- Attempt to resolve disagreements politely in public threads.
- If unresolved, escalate to Core Maintainers for mediation.

### Meetings and communication

- Default asynchronous communication via GitHub Issues and Discussions.
- Optional periodic meetings (monthly or quarterly) for Core Maintainers.

### Transparency

- Governance decisions, meeting notes, and major proposals are recorded in the `docs/governance/` folder.

### Code of Conduct and Security

- The project enforces the `CODE_OF_CONDUCT.md` for community behavior.
- Security disclosures follow `SECURITY.md` and are handled confidentially.

---

## Values

- **Openness**: Public discussion and documented decisions
- **Merit**: Contributors earn responsibility through sustained quality work
- **Respect**: Civil and inclusive community interactions
- **Pragmatism**: Lightweight processes that avoid bureaucracy

---

## Contacts

- Repository owner: `vkondepati` (GitHub)
- Security contact: see `SECURITY.md`

---

## Governance changes

To change this document, open a PR and tag Core Maintainers. Major governance changes require majority approval from Core Maintainers.
