import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorPicker } from "../ColorPicker";

const PRESETS = [
  "#23332A", "#332327", "#468B2F", "#256D48",
  "#6D2537", "#31C202", "#02C25E",
];

describe("ColorPicker", () => {
  it("renders a button for each preset color", () => {
    render(<ColorPicker value="#31C202" onChange={jest.fn()} />);
    PRESETS.forEach((color) => {
      expect(
        screen.getByLabelText(`Select color ${color}`)
      ).toBeInTheDocument();
    });
  });

  it("renders 7 preset swatches", () => {
    render(<ColorPicker value="#31C202" onChange={jest.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(PRESETS.length);
  });

  it("calls onChange with the correct color when a swatch is clicked", async () => {
    const onChange = jest.fn();
    render(<ColorPicker value="#31C202" onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Select color #468B2F"));

    expect(onChange).toHaveBeenCalledWith("#468B2F");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("renders the custom color input (hidden)", () => {
    render(<ColorPicker value="#31C202" onChange={jest.fn()} />);
    const colorInput = document.querySelector('input[type="color"]');
    expect(colorInput).toBeInTheDocument();
  });

  it("applies a different box-shadow to the currently selected color", () => {
    const selected = "#468B2F";
    render(<ColorPicker value={selected} onChange={jest.fn()} />);

    const selectedBtn = screen.getByLabelText(`Select color ${selected}`);
    const otherBtn = screen.getByLabelText("Select color #31C202");

    // Selected has the ring shadow; unselected has the plain shadow
    expect(selectedBtn).toHaveStyle("box-shadow: 0 0 0 2px #CAECFC, 0 0 0 4px #468B2F");
    expect(otherBtn).toHaveStyle("box-shadow: 0 1px 3px rgba(0,0,0,0.4)");
  });

  it("renders a custom-color label with title", () => {
    render(<ColorPicker value="#31C202" onChange={jest.fn()} />);
    expect(screen.getByTitle("Custom color")).toBeInTheDocument();
  });
});
