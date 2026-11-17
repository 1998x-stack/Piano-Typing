import type { KeyboardEvent } from "react";
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
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    const nativeEvent = event.nativeEvent;
    if (disabled || event.repeat || nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Enter") {
      onKeyInput({ code: event.code, key: event.key, timestamp: performance.now() });
      return;
    }
    if (isModifierOnlyKey(event.key) || !isPrintableKey(event.key)) return;

    onKeyInput({
      code: event.code,
      key: event.key,
      timestamp: performance.now()
    });
  }

  return (
    <textarea
      aria-label="Type here"
      className="typing-surface"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      rows={5}
    />
  );
}
