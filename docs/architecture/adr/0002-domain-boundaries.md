# ADR 0002: Keep music, audio, typing, and UI as separate modules

- Status: Accepted
- Date: 2026-11-17

## Context

Piano Typing and Word Orchestra may eventually share music and audio capabilities. The two products must not share product-specific workflows or scoring semantics.

## Decision

Keep domain pitch mapping and typing metrics as pure modules. Keep Web Audio in an infrastructure adapter. Keep React presentation thin. Expose an audio interface that can be reused by another application without importing Piano Typing UI or session workflows.

## Consequences

- Music mapping can be tested without a browser.
- Audio can be replaced by a fake in tests.
- Word Orchestra can later consume the stable audio contract.
- Do not create a separate package or monorepo until the contracts have proven stable through real use.
