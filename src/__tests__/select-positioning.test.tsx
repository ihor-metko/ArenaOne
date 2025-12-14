import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Select } from "@/components/ui/Select";

describe("Select positioning", () => {
  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
  ];

  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });
  });

  it("should render dropdown with placement-bottom class when enough space below", async () => {
    // Mock getBoundingClientRect to simulate trigger at top of viewport
    const mockGetBoundingClientRect = jest.fn(() => ({
      top: 50,
      bottom: 90,
      left: 100,
      right: 400,
      width: 300,
      height: 40,
      x: 100,
      y: 50,
      toJSON: () => {},
    }));

    render(
      <Select
        label="Test Select"
        options={options}
        value=""
        onChange={() => {}}
      />
    );

    const combobox = screen.getByRole("combobox");
    
    // Mock the ref
    Object.defineProperty(combobox, "getBoundingClientRect", {
      value: mockGetBoundingClientRect,
    });

    // Open dropdown
    fireEvent.click(combobox);

    // Wait for dropdown to appear
    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveClass("im-placement-bottom");
    });
  });

  it("should render dropdown with placement-top class when not enough space below", async () => {
    // Mock getBoundingClientRect to simulate trigger at bottom of viewport
    const mockGetBoundingClientRect = jest.fn(() => ({
      top: 700,
      bottom: 740,
      left: 100,
      right: 400,
      width: 300,
      height: 40,
      x: 100,
      y: 700,
      toJSON: () => {},
    }));

    render(
      <Select
        label="Test Select"
        options={options}
        value=""
        onChange={() => {}}
      />
    );

    const combobox = screen.getByRole("combobox");
    
    // Mock the ref
    Object.defineProperty(combobox, "getBoundingClientRect", {
      value: mockGetBoundingClientRect,
    });

    // Open dropdown
    fireEvent.click(combobox);

    // Wait for dropdown to appear
    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveClass("im-placement-top");
    });
  });

  it("should apply bottom CSS property when placement is top", async () => {
    // Mock getBoundingClientRect to simulate trigger at bottom of viewport
    const mockGetBoundingClientRect = jest.fn(() => ({
      top: 700,
      bottom: 740,
      left: 100,
      right: 400,
      width: 300,
      height: 40,
      x: 100,
      y: 700,
      toJSON: () => {},
    }));

    render(
      <Select
        label="Test Select"
        options={options}
        value=""
        onChange={() => {}}
      />
    );

    const combobox = screen.getByRole("combobox");
    
    // Mock the ref
    Object.defineProperty(combobox, "getBoundingClientRect", {
      value: mockGetBoundingClientRect,
    });

    // Open dropdown
    fireEvent.click(combobox);

    // Wait for dropdown to appear
    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      
      const style = listbox.style;
      // When placement is top, should use bottom instead of top
      expect(style.bottom).toBeTruthy();
      expect(style.top).toBeFalsy();
    });
  });

  it("should apply top CSS property when placement is bottom", async () => {
    // Mock getBoundingClientRect to simulate trigger at top of viewport
    const mockGetBoundingClientRect = jest.fn(() => ({
      top: 50,
      bottom: 90,
      left: 100,
      right: 400,
      width: 300,
      height: 40,
      x: 100,
      y: 50,
      toJSON: () => {},
    }));

    render(
      <Select
        label="Test Select"
        options={options}
        value=""
        onChange={() => {}}
      />
    );

    const combobox = screen.getByRole("combobox");
    
    // Mock the ref
    Object.defineProperty(combobox, "getBoundingClientRect", {
      value: mockGetBoundingClientRect,
    });

    // Open dropdown
    fireEvent.click(combobox);

    // Wait for dropdown to appear
    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      
      const style = listbox.style;
      // When placement is bottom, should use top instead of bottom
      expect(style.top).toBeTruthy();
      expect(style.bottom).toBeFalsy();
    });
  });

  it("should close dropdown when clicking outside", async () => {
    render(
      <div>
        <Select
          label="Test Select"
          options={options}
          value=""
          onChange={() => {}}
        />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const combobox = screen.getByRole("combobox");
    
    // Open dropdown
    fireEvent.click(combobox);

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"));

    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });
});
