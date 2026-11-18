import { useRef } from "react";
import type { KeyboardEvent, CompositionEvent } from "react";
import type { KeyInput } from "../domain/types";
import { isModifierOnlyKey, isPrintableKey } from "../domain/music/pitch";

interface TypingSurfaceProps {
  value: string;
  onChange: (value: string) => void;
  onKeyInput: (input: KeyInput) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TypingSurface({
  value,
  onChange,
  onKeyInput,
  disabled = false,
  placeholder = "Start typing. Your keyboard is the instrument."
}: TypingSurfaceProps) {
  const composing = useRef(false);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    const nativeEvent = event.nativeEvent;
    if (disabled || event.repeat || composing.current || nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key !== "Enter" && (isModifierOnlyKey(event.key) || !isPrintableKey(event.key))) return;
    onKeyInput({ code: event.code, key: event.key, timestamp: performance.now() });
  }

  function handleCompositionEnd(event: CompositionEvent<HTMLTextAreaElement>): void {
    composing.current = false;
    if (disabled) return;
    // IME keydown events are not ordinary text keystrokes. One melodic event per
    // committed Unicode code point is emitted *after* the composition finishes.
    // We never persist the committed source text in a composition.
    for (const key of Array.from(event.data ?? "").slice(0, 256)) {
      onKeyInput({ code: "IME", key, timestamp: performance.now() });
    }
  }

  return (
    <textarea
      aria-label="Type here"
      className="typing-surface"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      onKeyDown={handleKeyDown}
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={handleCompositionEnd}
      placeholder={placeholder}
      disabled={disabled}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      rows={5}
    />
  );
}
