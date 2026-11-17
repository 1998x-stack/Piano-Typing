# Security and Privacy Baseline

## 1. Data minimization

Piano Typing has no account or backend in the first release. It MUST:
- Listen only on the focused in-app typing surface.
- Never install a system-wide keyboard listener.
- Never capture keystrokes from other tabs or applications.
- Avoid storing raw text by default.
- Avoid sending text or note events to third parties.
- Avoid microphone, camera, clipboard-read, or notification permissions.
- Provide a clear way to clear local data.

## 2. Browser security

- Use framework escaping; do not render user text as HTML.
- Do not use eval, Function constructors, or dynamic script injection.
- Avoid third-party runtime scripts and remote fonts in the initial release.
- Keep dependencies minimal and review updates.
- Add a restrictive Content Security Policy at the hosting layer when deployment headers are available.
- Use HTTPS in production.
- Do not store secrets in frontend configuration.

## 3. Storage safety

Persisted JSON is untrusted input. Validate shape, bounds, enum values, and schema version before using it. A corrupted record must not crash app startup.

## 4. Accessibility and user control

- Mute and volume controls remain keyboard accessible.
- Reduced-motion preference is respected.
- Audio is never autoplayed before user interaction.
- Provide visible audio status and a retry path.
- User can delete saved sessions and compositions.

## 5. Future cloud features

Any future sync, analytics, AI, or sharing feature requires a separate privacy review, explicit opt-in, data-flow documentation, retention policy, and deletion behavior. Do not silently introduce a backend dependency.
