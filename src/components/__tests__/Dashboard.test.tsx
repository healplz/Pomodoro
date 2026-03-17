import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dashboard } from "../Dashboard";

jest.mock("next-auth/react", () => ({ signOut: jest.fn() }));

const DEFAULT_PROPS = {
  user: { name: "Brock", image: "" },
  initialTasks: [],
  initialTodaySessions: [],
  initialStreak: 0,
  initialMaxMinutes: 25,
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe("Dashboard", () => {
  it("renders the Pomodoro header", () => {
    render(<Dashboard {...DEFAULT_PROPS} />);
    expect(screen.getByText("Pomodoro")).toBeInTheDocument();
  });

  it("renders the user initial when no image is provided", () => {
    render(<Dashboard {...DEFAULT_PROPS} />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("renders the user avatar image when provided", () => {
    render(
      <Dashboard
        {...DEFAULT_PROPS}
        user={{ name: "Brock", image: "https://example.com/avatar.jpg" }}
      />
    );
    const img = screen.getByRole("img", { name: "Brock" });
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("shows the streak badge when streak > 0", () => {
    render(<Dashboard {...DEFAULT_PROPS} initialStreak={5} />);
    expect(screen.getByText("5 days")).toBeInTheDocument();
  });

  it("does not show the streak badge when streak is 0", () => {
    render(<Dashboard {...DEFAULT_PROPS} initialStreak={0} />);
    expect(screen.queryByText(/days?/)).not.toBeInTheDocument();
  });

  it("renders the Tasks section heading", () => {
    render(<Dashboard {...DEFAULT_PROPS} />);
    expect(screen.getByText("Tasks")).toBeInTheDocument();
  });

  it("renders the new task button", () => {
    render(<Dashboard {...DEFAULT_PROPS} />);
    expect(screen.getByText("New task")).toBeInTheDocument();
  });

  it("renders initial tasks in the task list", () => {
    render(
      <Dashboard
        {...DEFAULT_PROPS}
        initialTasks={[{ id: "t1", name: "Focus", color: "#31C202" }]}
      />
    );
    expect(screen.getByText("Focus")).toBeInTheDocument();
  });

  it("renders dots alongside a task when sessions are associated", () => {
    render(
      <Dashboard
        {...DEFAULT_PROPS}
        initialTasks={[{ id: "t1", name: "Focus", color: "#31C202" }]}
        initialTodaySessions={[
          { id: "s1", taskId: "t1", color: "#31C202", durationSeconds: 1500 },
        ]}
      />
    );
    expect(screen.getByTitle("25 min")).toBeInTheDocument();
  });

  it("renders unassigned sessions under a No task row", () => {
    render(
      <Dashboard
        {...DEFAULT_PROPS}
        initialTodaySessions={[
          { id: "s1", taskId: null, color: "#31C202", durationSeconds: 900 },
        ]}
      />
    );
    expect(screen.getByText("No task")).toBeInTheDocument();
    expect(screen.getByTitle("15 min")).toBeInTheDocument();
  });

  it("calls signOut when Sign out is clicked", async () => {
    const { signOut } = require("next-auth/react");
    render(<Dashboard {...DEFAULT_PROPS} />);
    await userEvent.click(screen.getByText("Sign out"));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/sign-in" });
  });

  it("renders the timer dial on mount showing the pomo duration", async () => {
    render(<Dashboard {...DEFAULT_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText("25")).toBeInTheDocument();
    });
  });
});
