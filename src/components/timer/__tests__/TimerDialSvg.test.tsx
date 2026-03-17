import { render } from "@testing-library/react";
import { TimerDialSvg } from "../TimerDialSvg";

describe("TimerDialSvg", () => {
  it("renders an SVG element", () => {
    const { container } = render(<TimerDialSvg size={300} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("sets width and height from the size prop", () => {
    const { container } = render(<TimerDialSvg size={320} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("320");
    expect(svg.getAttribute("height")).toBe("320");
  });

  it("renders a tick mark for each of the 25 minutes", () => {
    const { container } = render(<TimerDialSvg size={300} />);
    const lines = container.querySelectorAll("line");
    expect(lines.length).toBe(25);
  });

  it("renders labels for each major tick (5, 10, 15, 20, 25)", () => {
    const { container } = render(<TimerDialSvg size={300} />);
    const texts = Array.from(container.querySelectorAll("text")).map(
      (t) => t.textContent
    );
    expect(texts).toContain("5");
    expect(texts).toContain("10");
    expect(texts).toContain("15");
    expect(texts).toContain("20");
    expect(texts).toContain("25");
  });

  it("renders the bezel and plate circles", () => {
    const { container } = render(<TimerDialSvg size={300} />);
    const circles = container.querySelectorAll("circle");
    // bezel ring, inner plate, colored arc ring = 3 circles
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it("applies the taskColor to the arc ring", () => {
    const { container } = render(
      <TimerDialSvg size={300} taskColor="#02C25E" />
    );
    const circles = container.querySelectorAll("circle");
    const hasTaskColor = Array.from(circles).some(
      (c) => c.getAttribute("stroke") === "#02C25E"
    );
    expect(hasTaskColor).toBe(true);
  });

  it("defaults taskColor to #E63946 when not provided", () => {
    const { container } = render(<TimerDialSvg size={300} />);
    const circles = container.querySelectorAll("circle");
    const hasDefault = Array.from(circles).some(
      (c) => c.getAttribute("stroke") === "#E63946"
    );
    expect(hasDefault).toBe(true);
  });
});
