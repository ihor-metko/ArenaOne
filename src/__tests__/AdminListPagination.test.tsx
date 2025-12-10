import { render, screen, fireEvent } from "@testing-library/react";
import { AdminListPagination } from "@/components/admin/AdminList/AdminListPagination";

// Mock Card component to avoid next-intl dependency issues
jest.mock("@/components/ui", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

describe("AdminListPagination", () => {
  const defaultProps = {
    page: 1,
    pageSize: 10,
    totalCount: 50,
    totalPages: 5,
    setPage: jest.fn(),
    setPageSize: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render pagination info", () => {
    render(<AdminListPagination {...defaultProps} />);
    
    expect(screen.getByText(/Showing 1 to 10 of 50/)).toBeInTheDocument();
  });

  it("should render with custom showing text", () => {
    render(
      <AdminListPagination
        {...defaultProps}
        showingText="Custom text 1-10 of 50 items"
      />
    );
    
    expect(screen.getByText("Custom text 1-10 of 50 items")).toBeInTheDocument();
  });

  it("should render previous and next buttons", () => {
    render(<AdminListPagination {...defaultProps} />);
    
    expect(screen.getByLabelText("Previous")).toBeInTheDocument();
    expect(screen.getByLabelText("Next")).toBeInTheDocument();
  });

  it("should disable previous button on first page", () => {
    render(<AdminListPagination {...defaultProps} page={1} />);
    
    const prevButton = screen.getByLabelText("Previous");
    expect(prevButton).toBeDisabled();
  });

  it("should disable next button on last page", () => {
    render(<AdminListPagination {...defaultProps} page={5} />);
    
    const nextButton = screen.getByLabelText("Next");
    expect(nextButton).toBeDisabled();
  });

  it("should call setPage when clicking previous button", () => {
    const setPage = jest.fn();
    render(<AdminListPagination {...defaultProps} page={3} setPage={setPage} />);
    
    const prevButton = screen.getByLabelText("Previous");
    fireEvent.click(prevButton);
    
    expect(setPage).toHaveBeenCalledWith(2);
  });

  it("should call setPage when clicking next button", () => {
    const setPage = jest.fn();
    render(<AdminListPagination {...defaultProps} page={2} setPage={setPage} />);
    
    const nextButton = screen.getByLabelText("Next");
    fireEvent.click(nextButton);
    
    expect(setPage).toHaveBeenCalledWith(3);
  });

  it("should render page number buttons", () => {
    render(<AdminListPagination {...defaultProps} page={1} />);
    
    // Should show first 5 pages
    expect(screen.getByLabelText("Page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 4")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 5")).toBeInTheDocument();
  });

  it("should call setPage when clicking a page number", () => {
    const setPage = jest.fn();
    render(<AdminListPagination {...defaultProps} page={1} setPage={setPage} />);
    
    const page3Button = screen.getByLabelText("Page 3");
    fireEvent.click(page3Button);
    
    expect(setPage).toHaveBeenCalledWith(3);
  });

  it("should highlight current page", () => {
    render(<AdminListPagination {...defaultProps} page={3} />);
    
    const currentPageButton = screen.getByLabelText("Page 3");
    expect(currentPageButton).toHaveClass("im-pagination-page--active");
  });

  it("should render page size selector", () => {
    render(<AdminListPagination {...defaultProps} />);
    
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("10");
  });

  it("should call setPageSize when changing page size", () => {
    const setPageSize = jest.fn();
    render(<AdminListPagination {...defaultProps} setPageSize={setPageSize} />);
    
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "25" } });
    
    expect(setPageSize).toHaveBeenCalledWith(25);
  });

  it("should render custom button labels", () => {
    render(
      <AdminListPagination
        {...defaultProps}
        previousText="Previous Page"
        nextText="Next Page"
        pageSizeLabel="Items per page:"
      />
    );
    
    expect(screen.getByLabelText("Previous Page")).toBeInTheDocument();
    expect(screen.getByLabelText("Next Page")).toBeInTheDocument();
    expect(screen.getByText("Items per page:")).toBeInTheDocument();
  });

  it("should show correct range for middle pages", () => {
    render(<AdminListPagination {...defaultProps} page={3} pageSize={10} totalCount={50} />);
    
    expect(screen.getByText(/Showing 21 to 30 of 50/)).toBeInTheDocument();
  });

  it("should handle last page with fewer items", () => {
    render(
      <AdminListPagination
        {...defaultProps}
        page={5}
        pageSize={10}
        totalCount={47}
      />
    );
    
    expect(screen.getByText(/Showing 41 to 47 of 47/)).toBeInTheDocument();
  });

  it("should limit page numbers to 5", () => {
    render(
      <AdminListPagination
        {...defaultProps}
        totalPages={10}
        page={1}
      />
    );
    
    // Should only show 5 page buttons
    expect(screen.getByLabelText("Page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 5")).toBeInTheDocument();
    expect(screen.queryByLabelText("Page 6")).not.toBeInTheDocument();
  });

  it("should center page numbers around current page", () => {
    render(
      <AdminListPagination
        {...defaultProps}
        totalPages={10}
        page={5}
      />
    );
    
    // When on page 5 of 10, should show pages 3-7
    expect(screen.getByLabelText("Page 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 7")).toBeInTheDocument();
    expect(screen.queryByLabelText("Page 1")).not.toBeInTheDocument();
  });
});
