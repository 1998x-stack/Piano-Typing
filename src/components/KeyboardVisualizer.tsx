interface KeyboardVisualizerProps {
  activeCode: string;
  open: boolean;
  onToggle: () => void;
}

const ROWS = [
  [
    ["KeyQ", "Q"], ["KeyW", "W"], ["KeyE", "E"], ["KeyR", "R"], ["KeyT", "T"],
    ["KeyY", "Y"], ["KeyU", "U"], ["KeyI", "I"], ["KeyO", "O"], ["KeyP", "P"]
  ],
  [
    ["KeyA", "A"], ["KeyS", "S"], ["KeyD", "D"], ["KeyF", "F"], ["KeyG", "G"],
    ["KeyH", "H"], ["KeyJ", "J"], ["KeyK", "K"], ["KeyL", "L"]
  ],
  [
    ["KeyZ", "Z"], ["KeyX", "X"], ["KeyC", "C"], ["KeyV", "V"],
    ["KeyB", "B"], ["KeyN", "N"], ["KeyM", "M"]
  ]
];

export default function KeyboardVisualizer({
  activeCode,
  open,
  onToggle
}: KeyboardVisualizerProps) {
  return (
    <section className="keyboard-panel" aria-label="Keyboard visualization">
      <div className="keyboard-panel-heading">
        <div>
          <span className="section-kicker">KEY MAP</span>
          <strong>Physical keys become notes</strong>
        </div>
        <button
          className="keyboard-toggle"
          type="button"
          aria-expanded={open}
          onClick={onToggle}
        >
          {open ? "Hide keyboard" : "Show keyboard"}
        </button>
      </div>
      {open && (
        <div className="keyboard-visual" role="group" aria-label="QWERTY keyboard note map">
          {ROWS.map((row, rowIndex) => (
            <div className="keyboard-row" key={rowIndex}>
              {row.map(([code, label]) => (
                <span
                  className={activeCode === code ? "keycap active" : "keycap"}
                  data-testid={activeCode === code ? "active-key" : undefined}
                  key={code}
                >
                  {label}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
