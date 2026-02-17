# Map Chat Context + Memory Implementation Plan

## Goal
Fix map-chat grounding so answers reflect the **current visible map extent**, and add **turn-to-turn memory** that persists per session with clear reset behavior.

## Current Gaps (Confirmed)
- Chat requests are one-shot (`question + mapContext`) without multi-turn history.
- Context includes layer summaries and sample properties, not full in-extent feature data.
- Selected features are represented only as count, not feature-level details.
- Context can be truncated as a large JSON string, risking loss of relevant rows.
- No session persistence/reset model tied to project lifecycle.
- No tests for map-chat context correctness or memory behavior.

## Implementation Phases

### Phase 1: Extent Grounding + Payload Contract
Status: `completed`

- [x] Update renderer chat payload to send structured object:
  - `sessionId`
  - `history`
  - `question`
  - `mapContext`
- [x] Update preload bridge to accept/pass structured payload.
- [x] Update main IPC handler to accept new payload shape.
- [x] Build extent-grounded context in renderer:
  - map metadata (`bounds`, `center`, `zoom`)
  - per-layer summary (`visible`, `totalCount`, `inExtentCount`)
  - `featuresInExtent[]` (compact feature rows)
  - `selectedFeatures[]` (compact feature rows)
- [x] Reuse existing geometry helpers for extent intersection.
- [x] Add deterministic caps on features/attributes before send.

### Phase 2: Session Memory (Local JSON Persistence)
Status: `pending`

- [ ] Add in-process session store in main process keyed by `sessionId`.
- [ ] Persist memory JSON under Electron user data folder.
- [ ] Add pruning:
  - max turns per session
  - session TTL
- [ ] On request:
  - merge/validate history
  - append current turn
  - store assistant response summary
- [ ] Add clear/reset operations for session memory.

### Phase 3: Prompt Hardening
Status: `pending`

- [ ] Build prompt inputs with strict ordering:
  1. system instruction
  2. prior turns (last K)
  3. current question
  4. current extent-grounded context
- [ ] Require assistant to prefer `featuresInExtent` for answers.
- [ ] Require explicit missing-data statements when fields are absent.
- [ ] Reduce reliance on blunt string truncation by compacting upstream.

### Phase 4: UI + Lifecycle Controls
Status: `pending`

- [ ] Add chat memory control(s) in chat panel:
  - clear chat/session memory
  - optional debug toggle
- [ ] Reset/rotate chat session on:
  - New Project
  - Close Project
- [ ] Keep UI chat state and model history state synchronized.

### Phase 5: Validation + Tests
Status: `pending`

- [ ] Add tests for:
  - extent feature filtering/compaction
  - session store persistence/pruning
  - prompt assembly with history + current context
- [ ] Manual validation scenarios:
  - "Get me fire stations in Frisco area from current map extent"
  - pan map and re-ask (answer changes with extent)
  - follow-up references ("same area", "those stations")

## File-Level Worklist

### `electron-app/renderer/renderer.js`
- [x] Add `mapChatState` (session + turns + context digest).
- [x] Add compact feature serialization helper.
- [x] Add `buildExtentFeatureContext(bounds)` and selected-feature builder.
- [x] Update `buildMapAssistantContext()` schema.
- [x] Update submit handler to send structured payload and persist local turn list.
- [ ] Hook session reset into project lifecycle functions.

### `electron-app/preload.js`
- [x] Update `askMapAssistant` bridge signature to accept structured payload.

### `electron-app/main.js`
- [x] Update IPC `ai:mapAssistantAsk` for new payload.
- [ ] Add session-memory store + JSON load/save/prune.
- [ ] Refactor assistant call to include prior turns + strict context block.
- [ ] Add clear-memory handler(s) if needed by renderer.

### `electron-app/renderer/index.html`
- [ ] Add clear-memory and optional debug controls in map chat panel.

### `electron-app/renderer/styles.css`
- [ ] Style new map-chat controls.

### `electron-app/.env.example`
- [ ] Add optional memory/context tuning vars:
  - `MAP_CHAT_MAX_TURNS`
  - `MAP_CHAT_SESSION_TTL_HOURS`
  - `MAP_CHAT_MAX_FEATURES_IN_EXTENT`
  - `MAP_CHAT_DEBUG_CONTEXT`

### `tests/`
- [ ] Add map-chat context tests.
- [ ] Add session store tests.
- [ ] Add prompt assembly tests.

## Acceptance Criteria
- [ ] Queries against current extent return feature-level results when available.
- [ ] Panning/zooming changes response based on new extent.
- [ ] Follow-up questions resolve against prior turns in same session.
- [ ] Session memory clears/resets on project close/new project.
- [ ] Debug/inspection output confirms payload has expected bounds + in-extent counts.

## Rollout Strategy
- Phase A (required): Phase 1 + Phase 2 + Phase 3 + basic manual validation.
- Phase B (optional): add vector recall (Chroma or equivalent) only if long-range recall still fails after Phase A.

## Change Log
- 2026-02-17: Plan document created.
- 2026-02-17: Phase 1 implemented and verified (payload contract + extent-grounded context).
