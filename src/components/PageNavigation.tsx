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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background/95 to-transparent backdrop-blur-sm px-3 py-3 md:px-6 md:py-4 pointer-events-auto">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 md:gap-4">
        <Button
          onClick={onPrevious}
          disabled={currentPage === 0}
          size="sm"
          variant="secondary"
          className="text-sm md:text-lg px-3 py-2 md:px-5 md:py-4 disabled:opacity-30 min-w-0 shrink-0"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          <span className="hidden sm:inline ml-1">Önceki</span>
        </Button>
        
        <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center min-w-0">
          {interactionButton && (
            <div className="flex items-center shrink-0">
              {interactionButton}
            </div>
          )}
          
          <Link to="/">
            <Button
              size="sm"
              variant="outline"
              className="text-sm md:text-lg px-3 py-2 md:px-5 md:py-4"
            >
              <Home className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline ml-1">Kitaplık</span>
            </Button>
          </Link>
          
          <div className="hidden sm:flex gap-1.5 md:gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
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
            className="text-sm md:text-lg px-3 py-2 md:px-6 md:py-4 bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all shrink-0"
          >
            <Check className="w-4 h-4 md:w-5 md:h-5 mr-1" />
            <span>Bitir</span>
          </Button>
        ) : (
          <Button
            onClick={onNext}
            size="sm"
            variant="secondary"
            className="text-sm md:text-lg px-3 py-2 md:px-5 md:py-4 shrink-0"
          >
            <span className="hidden sm:inline mr-1">Sonraki</span>
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageNavigation;
