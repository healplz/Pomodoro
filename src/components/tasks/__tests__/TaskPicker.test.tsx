import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskPicker, type Task } from "../TaskPicker";

const TASKS: Task[] = [
  { id: "1", name: "Deep Work", color: "#31C202" },
  { id: "2", name: "Reading", color: "#02C25E" },
];

describe("TaskPicker", () => {
  it("renders the No task chip", () => {
    render(
      <TaskPicker tasks={[]} selectedId={null} onSelect={jest.fn()} onTaskCreated={jest.fn()} />
    );
    expect(screen.getByText("No task")).toBeInTheDocument();
  });

  it("renders a chip for each task", () => {
    render(
      <TaskPicker tasks={TASKS} selectedId={null} onSelect={jest.fn()} onTaskCreated={jest.fn()} />
    );
    expect(screen.getByText("Deep Work")).toBeInTheDocument();
    expect(screen.getByText("Reading")).toBeInTheDocument();
  });

  it("calls onSelect(null) when No task chip is clicked", async () => {
    const onSelect = jest.fn();
    render(
      <TaskPicker tasks={TASKS} selectedId="1" onSelect={onSelect} onTaskCreated={jest.fn()} />
    );
    await userEvent.click(screen.getByText("No task"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("calls onSelect with the task when a task chip is clicked", async () => {
    const onSelect = jest.fn();
    render(
      <TaskPicker tasks={TASKS} selectedId={null} onSelect={onSelect} onTaskCreated={jest.fn()} />
    );
    await userEvent.click(screen.getByText("Deep Work"));
    expect(onSelect).toHaveBeenCalledWith(TASKS[0]);
  });

  it("renders the add (+) button", () => {
    render(
      <TaskPicker tasks={[]} selectedId={null} onSelect={jest.fn()} onTaskCreated={jest.fn()} />
    );
    expect(screen.getByTitle("New task")).toBeInTheDocument();
  });

  it("opens CreateTaskModal when the + button is clicked", async () => {
    render(
      <TaskPicker tasks={[]} selectedId={null} onSelect={jest.fn()} onTaskCreated={jest.fn()} />
    );
    await userEvent.click(screen.getByTitle("New task"));
    expect(screen.getByText("New Task")).toBeInTheDocument();
  });

  it("closes the modal when Cancel is clicked inside the modal", async () => {
    render(
      <TaskPicker tasks={[]} selectedId={null} onSelect={jest.fn()} onTaskCreated={jest.fn()} />
    );
    await userEvent.click(screen.getByTitle("New task"));
    expect(screen.getByText("New Task")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("New Task")).not.toBeInTheDocument();
  });

  it("renders color dot inside each task chip", () => {
    const { container } = render(
      <TaskPicker tasks={TASKS} selectedId={null} onSelect={jest.fn()} onTaskCreated={jest.fn()} />
    );
    const dots = container.querySelectorAll(".rounded-full.w-2\\.5.h-2\\.5");
    expect(dots.length).toBeGreaterThanOrEqual(TASKS.length);
  });
});
