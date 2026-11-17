import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("Piano Typing application", () => {
  it("renders the studio and defaults to Free Play", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /let your hands make music/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Free Play" })).toHaveClass("active");
    expect(screen.getByLabelText("Type here")).toBeInTheDocument();
  });

  it("switches to Typing Flow and displays the target passage", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Typing Flow" }));
    expect(screen.getByText("The quiet morning begins with a single note.")).toBeInTheDocument();
    expect(screen.getByText(/accuracy compares each typed character/i)).toBeInTheDocument();
  });

  it("counts printable keystrokes without requiring audio permission", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Type here"), "abc");
    expect(screen.getByTestId("keystroke-count")).toHaveTextContent("3");
    expect(screen.getByTestId("notes-count")).toHaveTextContent("3");
  });

  it("adds a low bass pulse at word boundaries", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Type here"), "a ");
    expect(screen.getByTestId("notes-count")).toHaveTextContent("2");
  });

  it("records a chord accompaniment when punctuation closes a phrase", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Type here"), "a.");
    expect(screen.getByTestId("notes-count")).toHaveTextContent("5");
  });

  it("highlights the last physical key in the on-screen keyboard", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Type here"), "a");
    expect(screen.getByTestId("active-key")).toHaveTextContent("A");
  });

  it("pauses and resumes without clearing the current session", async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText("Type here");
    await user.type(input, "a");
    await user.click(screen.getByRole("button", { name: "Pause session" }));
    expect(screen.getByLabelText("Type here")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Resume session" }));
    expect(screen.getByLabelText("Type here")).toBeEnabled();
    expect(screen.getByTestId("keystroke-count")).toHaveTextContent("1");
  });

  it("toggles mute without disabling the typing surface", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Mute sound" }));
    expect(screen.getByRole("button", { name: "Unmute sound" })).toBeInTheDocument();
    expect(screen.getByLabelText("Type here")).toBeEnabled();
  });
});
