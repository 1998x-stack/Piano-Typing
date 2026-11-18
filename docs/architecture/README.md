# Engineering Architecture

This directory is the engineering source of truth for Piano Typing.

## Documents

- SYSTEM_ARCHITECTURE.md — runtime boundaries, modules, data flow, and deployment shape.
- AUDIO_ENGINE.md — real-time audio lifecycle, note synthesis, scheduling, and latency budgets.
- DATA_MODEL.md — session, composition, settings, and persistence contracts.
- SECURITY_AND_PRIVACY.md — local-first privacy boundaries and browser security considerations.
- IMPLEMENTATION_PLAN.md — phased delivery plan with acceptance gates.
- TEST_STRATEGY.md — test pyramid, fixtures, and release gates.
- GOTCHAS.md — verified pitfalls and operational notes.
- adr/ — architecture decision records.

## Normative language

MUST indicates a release requirement. SHOULD indicates a strong default that may be changed with an explicit rationale. MAY indicates an optional capability.

Product requirements remain in the product specification. These documents define how those requirements are implemented and verified.

## Physical release gates

See [the device audio acceptance protocol](../verification/DEVICE_AUDIO_ACCEPTANCE.md) and [release gate ledger](../verification/RELEASE_GATES.md). Green CI does not establish measured audible latency.
