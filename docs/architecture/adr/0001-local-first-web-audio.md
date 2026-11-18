# ADR 0001: Local-first browser application with Web Audio

- Status: Accepted
- Date: 2026-11-17

## Context

The product must provide immediate key-to-sound feedback while preserving ordinary text input. A backend would add latency, deployment complexity, privacy risk, and an unnecessary availability dependency.

## Decision

Build a static React application. Use Web Audio API for client-side synthesis. Persist settings and explicitly saved compositions locally. Do not require an account or network service for core use.

## Consequences

Positive:
- No server round trip in the audio path.
- User text stays in the browser.
- Static hosting is inexpensive and portable.
- Core experience can work offline after initial load if assets are cached.

Trade-offs:
- Audio behavior varies by browser and device.
- Local data is not automatically synchronized across devices.
- Browser storage can be cleared or quota-limited.
- The application must handle autoplay restrictions and device output changes.
