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
}

const PageNavigation = ({ currentPage, totalPages, onNext, onPrevious, onHome, onFinish }: PageNavigationProps) => {
  const isLastPage = currentPage === totalPages - 1;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background/95 to-transparent backdrop-blur-sm p-4 md:p-6 pointer-events-auto">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <Button
          onClick={onPrevious}
          disabled={currentPage === 0}
          size="lg"
          variant="secondary"
          className="text-xl md:text-2xl px-6 py-6 disabled:opacity-30"
        >
          <ChevronLeft className="w-8 h-8" />
          <span className="hidden md:inline ml-2">Önceki</span>
        </Button>
        
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button
              size="lg"
              variant="outline"
              className="text-xl md:text-2xl px-6 py-6"
            >
              <Home className="w-6 h-6" />
              <span className="hidden md:inline ml-2">Kitaplık</span>
            </Button>
          </Link>
          
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300 ${
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
            size="lg"
            variant="default"
            className="text-xl md:text-2xl px-8 py-6 bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all"
          >
            <Check className="w-6 h-6 mr-2" />
            Bitir
          </Button>
        ) : (
          <Button
            onClick={onNext}
            size="lg"
            variant="secondary"
            className="text-xl md:text-2xl px-6 py-6"
          >
            <span className="hidden md:inline mr-2">Sonraki</span>
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageNavigation;
