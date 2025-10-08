import { Button } from "@heroui/button";

interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  thumbnails?: string[]; // Optional base64 thumbnail images
}

export const PageNavigator = ({
  currentPage,
  totalPages,
  onPageChange,
  thumbnails = [],
}: PageNavigatorProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <nav
      className="border-t border-default-200 bg-default-50"
      aria-label="Page navigation"
    >
      {/* Navigation Controls */}
      <div className="flex items-center justify-between p-4 border-b border-default-200">
        <Button
          size="sm"
          variant="flat"
          onPress={handlePrevious}
          isDisabled={currentPage <= 1}
          aria-label="Go to previous page"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </Button>

        <output
          className="text-sm font-medium"
          aria-live="polite"
          aria-atomic="true"
        >
          Page {currentPage} of {totalPages}
        </output>

        <Button
          size="sm"
          variant="flat"
          onPress={handleNext}
          isDisabled={currentPage >= totalPages}
          aria-label="Go to next page"
        >
          Next
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>

      {/* Thumbnail Grid */}
      <div className="p-4 overflow-x-auto">
        <ul className="flex gap-3 list-none m-0 p-0">
          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1;
            const isActive = pageNumber === currentPage;
            const thumbnail = thumbnails[index];

            return (
              <li key={pageNumber}>
                <button
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  className={`
                    flex-shrink-0 w-24 rounded-lg overflow-hidden transition-all block
                    ${
                      isActive
                        ? "ring-2 ring-primary shadow-lg scale-105"
                        : "ring-1 ring-default-300 hover:ring-primary hover:scale-102"
                    }
                  `}
                  aria-label={`Go to page ${pageNumber}${isActive ? " (current page)" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Thumbnail or Placeholder */}
                  <div className="aspect-[8.5/11] bg-default-200 relative">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                        aria-hidden="true"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-default-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Page Number Badge */}
                    <div
                      className={`
                    absolute bottom-1 right-1 px-2 py-0.5 rounded text-xs font-semibold
                    ${isActive ? "bg-primary text-white" : "bg-default-900/70 text-white"}
                  `}
                      aria-hidden="true"
                    >
                      {pageNumber}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
