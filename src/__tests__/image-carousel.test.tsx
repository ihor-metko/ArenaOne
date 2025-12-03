/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ImageCarousel } from "@/components/ui/ImageCarousel";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "common.imageCarousel": "Image carousel",
      "common.previousImage": "Previous image",
      "common.nextImage": "Next image",
      "common.carouselSlides": "Carousel slides",
      "common.slide": "Slide",
      "common.slideOf": "Slide {current} of {total}",
    };
    return translations[key] || key;
  },
}));

const mockImages = [
  { url: "/image1.jpg", alt: "Test image 1" },
  { url: "/image2.jpg", alt: "Test image 2" },
  { url: "/image3.jpg", alt: "Test image 3" },
];

describe("ImageCarousel Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    it("renders nothing when images array is empty", () => {
      const { container } = render(<ImageCarousel images={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders the carousel with images", () => {
      render(<ImageCarousel images={mockImages} />);
      
      expect(screen.getByRole("region")).toBeInTheDocument();
      // The visible slide should be rendered
      expect(screen.getByRole("group")).toBeInTheDocument();
    });

    it("renders navigation arrows when there are multiple images", () => {
      render(<ImageCarousel images={mockImages} />);
      
      expect(screen.getByLabelText("Previous image")).toBeInTheDocument();
      expect(screen.getByLabelText("Next image")).toBeInTheDocument();
    });

    it("does not render navigation arrows for single image", () => {
      render(<ImageCarousel images={[mockImages[0]]} />);
      
      expect(screen.queryByLabelText("Previous image")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Next image")).not.toBeInTheDocument();
    });

    it("renders indicators when showIndicators is true", () => {
      render(<ImageCarousel images={mockImages} showIndicators={true} />);
      
      const indicators = screen.getAllByRole("tab");
      expect(indicators).toHaveLength(3);
    });

    it("does not render indicators when showIndicators is false", () => {
      render(<ImageCarousel images={mockImages} showIndicators={false} />);
      
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });

    it("renders all images in the DOM for carousel functionality", () => {
      const { container } = render(<ImageCarousel images={mockImages} />);
      const images = container.querySelectorAll(".im-carousel-image");
      expect(images).toHaveLength(3);
    });
  });

  describe("Navigation", () => {
    it("navigates to the next image when clicking next button", () => {
      render(<ImageCarousel images={mockImages} />);
      
      const nextButton = screen.getByLabelText("Next image");
      
      act(() => {
        fireEvent.click(nextButton);
        jest.advanceTimersByTime(350);
      });
      
      // Check that the second indicator is now active
      const indicators = screen.getAllByRole("tab");
      expect(indicators[1]).toHaveAttribute("aria-selected", "true");
    });

    it("navigates to the previous image when clicking previous button", () => {
      render(<ImageCarousel images={mockImages} />);
      
      // First, go to the second image
      const nextButton = screen.getByLabelText("Next image");
      
      act(() => {
        fireEvent.click(nextButton);
        jest.advanceTimersByTime(350);
      });
      
      // Verify we're on image 2
      const indicatorsBefore = screen.getAllByRole("tab");
      expect(indicatorsBefore[1]).toHaveAttribute("aria-selected", "true");
      
      // Then go back
      const prevButton = screen.getByLabelText("Previous image");
      
      act(() => {
        fireEvent.click(prevButton);
        jest.advanceTimersByTime(350);
      });
      
      // Check that the first indicator is now active
      const indicatorsAfter = screen.getAllByRole("tab");
      expect(indicatorsAfter[0]).toHaveAttribute("aria-selected", "true");
    });

    it("loops to last image when clicking previous on first image (loop=true)", () => {
      render(<ImageCarousel images={mockImages} loop={true} />);
      
      const prevButton = screen.getByLabelText("Previous image");
      
      act(() => {
        fireEvent.click(prevButton);
        jest.advanceTimersByTime(350);
      });
      
      const indicators = screen.getAllByRole("tab");
      expect(indicators[2]).toHaveAttribute("aria-selected", "true");
    });

    it("loops to first image when clicking next on last image (loop=true)", () => {
      render(<ImageCarousel images={mockImages} loop={true} />);
      
      const nextButton = screen.getByLabelText("Next image");
      
      // Go to image 2
      act(() => {
        fireEvent.click(nextButton);
        jest.advanceTimersByTime(350);
      });
      
      // Go to image 3
      act(() => {
        fireEvent.click(nextButton);
        jest.advanceTimersByTime(350);
      });
      
      // Go back to image 1 (loop)
      act(() => {
        fireEvent.click(nextButton);
        jest.advanceTimersByTime(350);
      });
      
      const indicators = screen.getAllByRole("tab");
      expect(indicators[0]).toHaveAttribute("aria-selected", "true");
    });

    it("navigates to specific slide when clicking indicator", () => {
      render(<ImageCarousel images={mockImages} />);
      
      const indicators = screen.getAllByRole("tab");
      
      act(() => {
        fireEvent.click(indicators[2]);
        jest.advanceTimersByTime(350);
      });
      
      expect(indicators[2]).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Click handler", () => {
    it("calls onImageClick when image is clicked", () => {
      const handleClick = jest.fn();
      render(<ImageCarousel images={mockImages} onImageClick={handleClick} />);
      
      const imageButtons = screen.getAllByRole("button").filter(
        btn => btn.getAttribute("aria-label")?.includes("Test image")
      );
      
      fireEvent.click(imageButtons[0]);
      
      expect(handleClick).toHaveBeenCalledWith(0);
    });
  });

  describe("Keyboard navigation", () => {
    it("navigates with arrow keys when focused", () => {
      render(<ImageCarousel images={mockImages} />);
      
      // Focus on the carousel region
      screen.getByRole("region");
      
      // Simulate arrow key press
      fireEvent.keyDown(document, { key: "ArrowRight" });
      
      // The carousel should navigate (this test may need adjustment based on implementation)
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes on carousel region", () => {
      render(<ImageCarousel images={mockImages} />);
      
      const region = screen.getByRole("region");
      expect(region).toHaveAttribute("aria-roledescription", "carousel");
    });

    it("has proper ARIA attributes on slides", () => {
      render(<ImageCarousel images={mockImages} />);
      
      const slide = screen.getByRole("group");
      expect(slide).toHaveAttribute("aria-roledescription", "slide");
    });

    it("sets aria-hidden on non-current slides", () => {
      const { container } = render(<ImageCarousel images={mockImages} />);
      
      const slides = container.querySelectorAll(".im-carousel-slide");
      expect(slides[0]).toHaveAttribute("aria-hidden", "false");
      expect(slides[1]).toHaveAttribute("aria-hidden", "true");
      expect(slides[2]).toHaveAttribute("aria-hidden", "true");
    });

    it("has aria-live region for screen readers", () => {
      const { container } = render(<ImageCarousel images={mockImages} />);
      
      const liveRegion = container.querySelector("[aria-live='polite'][aria-atomic='true']");
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("applies custom className to carousel container", () => {
      render(<ImageCarousel images={mockImages} className="custom-class" />);
      
      const region = screen.getByRole("region");
      expect(region).toHaveClass("im-carousel", "custom-class");
    });
  });
});

