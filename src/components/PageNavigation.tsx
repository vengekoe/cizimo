import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Home, Check } from "lucide-react";
import { Link } from "react-router-dom";

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrevious: () => void;
  onHome: () => void;
  onFinish?: () => void;
  interactionButton?: React.ReactNode;
}

const PageNavigation = ({ currentPage, totalPages, onNext, onPrevious, onHome, onFinish, interactionButton }: PageNavigationProps) => {
  const isLastPage = currentPage === totalPages - 1;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background/95 to-transparent backdrop-blur-sm p-2 sm:p-3 md:p-4 pointer-events-auto">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-1 sm:gap-2 md:gap-4">
        <Button
          onClick={onPrevious}
          disabled={currentPage === 0}
          size="sm"
          variant="secondary"
          className="text-sm sm:text-base md:text-xl px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-6 disabled:opacity-30 min-w-0 shrink-0"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8" />
          <span className="hidden sm:inline ml-1 md:ml-2">Önceki</span>
        </Button>
        
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0 overflow-hidden">
          {interactionButton && (
            <div className="flex items-center shrink-0">
              {interactionButton}
            </div>
          )}
          
          <Link to="/" className="shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="text-sm sm:text-base md:text-xl px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-6"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              <span className="hidden md:inline ml-2">Kitaplık</span>
            </Button>
          </Link>
          
          <div className="flex gap-1 shrink-0">
            {Array.from({ length: totalPages }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                  i === currentPage
                    ? "bg-primary scale-125"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
        
        {isLastPage ? (
          <Button
            onClick={onFinish}
            size="sm"
            variant="default"
            className="text-sm sm:text-base md:text-xl px-3 sm:px-4 md:px-8 py-2 sm:py-3 md:py-6 bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all shrink-0"
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Bitir</span>
          </Button>
        ) : (
          <Button
            onClick={onNext}
            size="sm"
            variant="secondary"
            className="text-sm sm:text-base md:text-xl px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-6 shrink-0"
          >
            <span className="hidden sm:inline mr-1 md:mr-2">Sonraki</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageNavigation;
