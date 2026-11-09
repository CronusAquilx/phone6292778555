import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VisitGate } from "./VisitGate";

let pathname = "/";

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname }),
  useHydrated: () => true,
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ loading: false }) }));
vi.mock("@/lib/console/visit", () => ({ useVisit: () => ({ stage: "setup" }) }));
vi.mock("@/components/astra/AuthPage", () => ({ AuthPage: () => <div>Account</div> }));
vi.mock("./ConsoleOnboarding", () => ({ ConsoleOnboarding: () => <h1>Layout choices</h1> }));
vi.mock("./FirstVisitChangelog", () => ({
  FirstVisitChangelog: ({ onContinue }: { onContinue: () => void }) => (
    <><h1>Latest changes</h1><button onClick={onContinue}>Continue</button></>
  ),
}));

describe("VisitGate changelog", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    pathname = "/";
  });

  it("puts changes before layouts, then skips them after dismissal", () => {
    const first = render(<VisitGate><div>App</div></VisitGate>);
    expect(screen.getByRole("heading", { name: "Latest changes" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Layout choices" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Layout choices" })).toBeTruthy();

    first.unmount();
    render(<VisitGate><div>App</div></VisitGate>);
    expect(screen.queryByRole("heading", { name: "Latest changes" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Layout choices" })).toBeTruthy();
  });

  it("never interrupts standalone gameplay", () => {
    pathname = "/play";
    render(<VisitGate><div>Standalone game</div></VisitGate>);
    expect(screen.getByText("Standalone game")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Latest changes" })).toBeNull();
  });
});
