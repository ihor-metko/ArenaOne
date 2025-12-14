/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Select, SelectOption } from "@/components/ui/Select";

// Mock the Portal component to render inline for testing
jest.mock("@/components/ui/Portal", () => ({
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useDropdownPosition hook
jest.mock("@/hooks/useDropdownPosition", () => ({
  useDropdownPosition: () => ({
    top: 100,
    left: 50,
    width: 200,
    maxHeight: 300,
  }),
}));

describe("Select Component", () => {
  const mockOptions: SelectOption[] = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  it("should render with placeholder", () => {
    render(
      <Select
        options={mockOptions}
        placeholder="Select an option"
      />
    );

    expect(screen.getByText("Select an option")).toBeInTheDocument();
  });

  it("should open dropdown when clicked", () => {
    render(
      <Select
        options={mockOptions}
        placeholder="Select an option"
      />
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("should call onChange when an option is clicked", async () => {
    const handleChange = jest.fn();
    render(
      <Select
        options={mockOptions}
        placeholder="Select an option"
        onChange={handleChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Click an option
    const option = screen.getByText("Option 2");
    fireEvent.click(option);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith("option2");
    });
  });

  it("should display selected value", () => {
    render(
      <Select
        options={mockOptions}
        value="option2"
        placeholder="Select an option"
      />
    );

    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("should close dropdown when clicking outside wrapper", async () => {
    render(
      <div>
        <Select
          options={mockOptions}
          placeholder="Select an option"
        />
        <div data-testid="outside-element">Outside</div>
      </div>
    );

    // Open dropdown
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Click outside
    const outsideElement = screen.getByTestId("outside-element");
    fireEvent.mouseDown(outsideElement);

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("should not close dropdown when clicking on an option in portal", async () => {
    const handleChange = jest.fn();
    render(
      <Select
        options={mockOptions}
        placeholder="Select an option"
        onChange={handleChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Click on an option - this should trigger onChange, not close the dropdown prematurely
    const option = screen.getByText("Option 2");
    fireEvent.mouseDown(option);
    fireEvent.click(option);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith("option2");
    });
  });

  it("should handle keyboard navigation", () => {
    render(
      <Select
        options={mockOptions}
        placeholder="Select an option"
      />
    );

    const trigger = screen.getByRole("combobox");
    trigger.focus();

    // Open with Enter
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Close with Escape
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should handle ArrowDown to navigate options", () => {
    render(
      <Select
        options={mockOptions}
        placeholder="Select an option"
      />
    );

    const trigger = screen.getByRole("combobox");
    trigger.focus();

    // Open with ArrowDown
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Navigate down
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    
    // First option should be focused (index 0), after ArrowDown it should be index 1
    const options = screen.getAllByRole("option");
    expect(options[1]).toHaveClass("im-focused");
  });

  it("should handle disabled state", () => {
    render(
      <Select
        options={mockOptions}
        placeholder="Select an option"
        disabled
      />
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Dropdown should not open when disabled
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should skip disabled options", () => {
    const optionsWithDisabled: SelectOption[] = [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2", disabled: true },
      { value: "option3", label: "Option 3" },
    ];

    const handleChange = jest.fn();
    render(
      <Select
        options={optionsWithDisabled}
        placeholder="Select an option"
        onChange={handleChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Click disabled option
    const disabledOption = screen.getByText("Option 2");
    fireEvent.click(disabledOption);

    // onChange should not be called
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("should render with label", () => {
    render(
      <Select
        label="Choose an option"
        options={mockOptions}
        placeholder="Select an option"
      />
    );

    expect(screen.getByText("Choose an option")).toBeInTheDocument();
  });

  it("should render options with icons", () => {
    const optionsWithIcons: SelectOption[] = [
      { value: "option1", label: "Option 1", icon: <span data-testid="icon-1">🔵</span> },
      { value: "option2", label: "Option 2", icon: <span data-testid="icon-2">🟢</span> },
    ];

    render(
      <Select
        options={optionsWithIcons}
        placeholder="Select an option"
      />
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    expect(screen.getByTestId("icon-1")).toBeInTheDocument();
    expect(screen.getByTestId("icon-2")).toBeInTheDocument();
  });
});
