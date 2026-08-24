// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

afterEach(cleanup); // unmount between cases so queries don't see stale DOM
import Playground from "@/components/Playground";
import type { Voice } from "@/lib/types";
import { SAMPLE_TEXT } from "@/lib/voices";

const voices: Voice[] = [
  { id: "v1", name: "Rachel", descr: "Clear", custom: 0 },
  { id: "v2", name: "MyClone", descr: "Yours", custom: 1 },
];

function setup(canManage = true) {
  const onSelect = vi.fn();
  const onSaved = vi.fn();
  render(
    <Playground voices={voices} selected="v1" onSelect={onSelect} canManage={canManage} onSaved={onSaved} />,
  );
  return { onSelect, onSaved };
}

describe("Playground", () => {
  it("renders the voices, the sample text, and the sliders", () => {
    setup();
    expect(screen.getByText("Rachel")).toBeTruthy();
    expect(screen.getByText("MyClone")).toBeTruthy();
    expect(screen.getByText("yours")).toBeTruthy(); // custom badge
    expect((screen.getByLabelText("Text to speak") as HTMLTextAreaElement).value).toContain(
      SAMPLE_TEXT.slice(0, 20),
    );
    for (const s of ["stability", "style", "speed"]) expect(screen.getByLabelText(s)).toBeTruthy();
  });

  it("selecting a voice fires onSelect", () => {
    const { onSelect } = setup();
    fireEvent.click(screen.getByText("MyClone"));
    expect(onSelect).toHaveBeenCalledWith("v2");
  });

  it("disables speak and shows the read-only note when management is off", () => {
    setup(false);
    const speak = screen.getByRole("button", { name: /speak/i }) as HTMLButtonElement;
    expect(speak.disabled).toBe(true);
    expect(screen.getByText(/read-only/i)).toBeTruthy();
  });
});
