import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateTaskModal } from "../CreateTaskModal";

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onCreated: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe("CreateTaskModal", () => {
  describe("visibility", () => {
    it("does not render when open is false", () => {
      render(<CreateTaskModal {...defaultProps} open={false} />);
      expect(screen.queryByText("New Task")).not.toBeInTheDocument();
    });

    it("renders the form when open is true", () => {
      render(<CreateTaskModal {...defaultProps} />);
      expect(screen.getByText("New Task")).toBeInTheDocument();
    });
  });

  describe("form fields", () => {
    it("renders the task name input", () => {
      render(<CreateTaskModal {...defaultProps} />);
      expect(screen.getByPlaceholderText(/deep work/i)).toBeInTheDocument();
    });

    it("renders the color picker", () => {
      render(<CreateTaskModal {...defaultProps} />);
      // ColorPicker renders preset swatches
      expect(screen.getByLabelText("Select color #31C202")).toBeInTheDocument();
    });

    it("disables the Create button when name is empty", () => {
      render(<CreateTaskModal {...defaultProps} />);
      expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
    });

    it("enables the Create button when name is entered", async () => {
      render(<CreateTaskModal {...defaultProps} />);
      await userEvent.type(screen.getByPlaceholderText(/deep work/i), "My task");
      expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
    });

    it("updates the preview text as the name is typed", async () => {
      render(<CreateTaskModal {...defaultProps} />);
      await userEvent.type(screen.getByPlaceholderText(/deep work/i), "Focus");
      expect(screen.getByText("Focus")).toBeInTheDocument();
    });

    it("shows 'Unnamed task' in the preview when name is empty", () => {
      render(<CreateTaskModal {...defaultProps} />);
      expect(screen.getByText("Unnamed task")).toBeInTheDocument();
    });
  });

  describe("cancel", () => {
    it("calls onClose when Cancel button is clicked", async () => {
      render(<CreateTaskModal {...defaultProps} />);
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("successful submission", () => {
    it("calls onCreated with the new task and closes the modal", async () => {
      const mockTask = { id: "abc", name: "Focus", color: "#31C202" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      });

      render(<CreateTaskModal {...defaultProps} />);
      await userEvent.type(screen.getByPlaceholderText(/deep work/i), "Focus");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() => {
        expect(defaultProps.onCreated).toHaveBeenCalledWith(mockTask);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("sends name and color in the POST body", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "1", name: "Focus", color: "#468B2F" }),
      });

      render(<CreateTaskModal {...defaultProps} />);
      await userEvent.type(screen.getByPlaceholderText(/deep work/i), "Focus");
      await userEvent.click(screen.getByLabelText("Select color #468B2F"));
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe("/api/tasks");
      expect(JSON.parse(options.body)).toMatchObject({ name: "Focus", color: "#468B2F" });
    });
  });

  describe("error handling", () => {
    it("shows an error message when the fetch fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => "Internal Server Error",
      });

      render(<CreateTaskModal {...defaultProps} />);
      await userEvent.type(screen.getByPlaceholderText(/deep work/i), "Focus");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() => {
        expect(screen.getByText("Internal Server Error")).toBeInTheDocument();
      });
    });

    it("does not call onCreated on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => "Error",
      });

      render(<CreateTaskModal {...defaultProps} />);
      await userEvent.type(screen.getByPlaceholderText(/deep work/i), "Focus");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() => screen.getByText("Error"));
      expect(defaultProps.onCreated).not.toHaveBeenCalled();
    });
  });
});
