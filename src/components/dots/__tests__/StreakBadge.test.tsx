import { render, screen } from "@testing-library/react";
import { StreakBadge } from "../StreakBadge";

describe("StreakBadge", () => {
  it("renders nothing when streak is 0", () => {
    const { container } = render(<StreakBadge streak={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the fire emoji", () => {
    render(<StreakBadge streak={1} />);
    expect(screen.getByText("🔥")).toBeInTheDocument();
  });

  it('shows "1 day" (singular) for a streak of 1', () => {
    render(<StreakBadge streak={1} />);
    expect(screen.getByText("1 day")).toBeInTheDocument();
  });

  it('shows "2 days" (plural) for a streak of 2', () => {
    render(<StreakBadge streak={2} />);
    expect(screen.getByText("2 days")).toBeInTheDocument();
  });

  it("shows the correct count for a long streak", () => {
    render(<StreakBadge streak={42} />);
    expect(screen.getByText("42 days")).toBeInTheDocument();
  });
});
