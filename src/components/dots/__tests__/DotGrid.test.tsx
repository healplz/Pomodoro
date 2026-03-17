import { render, screen } from "@testing-library/react";
import { DotGrid, type DotSession } from "../DotGrid";

const makeSessions = (count: number): DotSession[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `session-${i}`,
    taskId: null,
    color: "#31C202",
    durationSeconds: 1500,
  }));

describe("DotGrid", () => {
  describe("empty state", () => {
    it("renders the empty state message when sessions is empty", () => {
      render(<DotGrid sessions={[]} />);
      expect(
        screen.getByText("Complete a session to earn your first dot")
      ).toBeInTheDocument();
    });

    it("does not render the Today label when sessions is empty", () => {
      render(<DotGrid sessions={[]} />);
      expect(screen.queryByText("Today")).not.toBeInTheDocument();
    });
  });

  describe("with sessions", () => {
    it("renders the Today label", () => {
      render(<DotGrid sessions={makeSessions(1)} />);
      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("does not render the empty state message when sessions exist", () => {
      render(<DotGrid sessions={makeSessions(1)} />);
      expect(
        screen.queryByText("Complete a session to earn your first dot")
      ).not.toBeInTheDocument();
    });

    it("renders a title for each session dot", () => {
      render(<DotGrid sessions={makeSessions(3)} />);
      const dots = screen.getAllByTitle("25 min session");
      expect(dots).toHaveLength(3);
    });

    it("uses the session's durationSeconds to compute the title", () => {
      const sessions: DotSession[] = [
        { id: "a", taskId: null, color: "#31C202", durationSeconds: 600 }, // 10 min
        { id: "b", taskId: null, color: "#02C25E", durationSeconds: 3600 }, // 60 min
      ];
      render(<DotGrid sessions={sessions} />);
      expect(screen.getByTitle("10 min session")).toBeInTheDocument();
      expect(screen.getByTitle("60 min session")).toBeInTheDocument();
    });
  });

  describe("milestone tomato", () => {
    it("does not show the milestone at 3 sessions", () => {
      render(<DotGrid sessions={makeSessions(3)} />);
      expect(screen.queryByTitle("4 pomodoros! Great focus!")).not.toBeInTheDocument();
    });

    it("shows the milestone emoji at exactly 4 sessions", () => {
      render(<DotGrid sessions={makeSessions(4)} />);
      expect(screen.getByTitle("4 pomodoros! Great focus!")).toBeInTheDocument();
    });

    it("does not show the milestone at 5 sessions", () => {
      render(<DotGrid sessions={makeSessions(5)} />);
      expect(screen.queryByTitle("4 pomodoros! Great focus!")).not.toBeInTheDocument();
    });

    it("shows the milestone again at 8 sessions", () => {
      render(<DotGrid sessions={makeSessions(8)} />);
      expect(screen.getByTitle("4 pomodoros! Great focus!")).toBeInTheDocument();
    });
  });
});
