import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, BookOpen, Home } from "lucide-react";
import { Book } from "@/data/books";
import { cn } from "@/lib/utils";

interface BookSidebarProps {
  books: Book[];
  currentBookId?: string;
}

const BookSidebar = ({ books, currentBookId }: BookSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());

  const toggleBook = (bookId: string) => {
    const newExpanded = new Set(expandedBooks);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
    }
    setExpandedBooks(newExpanded);
  };

  return (
    <>
      {/* Backdrop - menü açıkken arka plana tıklanınca kapat */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside
        className={cn(
          "fixed right-0 top-0 h-screen bg-gradient-to-b from-primary/10 to-accent/10 backdrop-blur-md border-l border-border/50 transition-all duration-300 z-50 overflow-y-auto shadow-2xl",
          isOpen ? "w-72" : "w-16"
        )}
      >
      <div className="p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-primary/20 transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <BookOpen className="w-5 h-5" />
          )}
          <span className={cn("font-bold text-foreground", !isOpen && "hidden")}>
            📚 Kitaplarım
          </span>
        </button>

        {isOpen && (
          <>
            <Link
              to="/"
              className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-card/50 hover:bg-card transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Ana Sayfa</span>
            </Link>

            <div className="mt-6 space-y-2">
              {books.map((book) => {
                const isExpanded = expandedBooks.has(book.id);
                const isCurrent = currentBookId === book.id;

                return (
                  <div key={book.id} className="rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleBook(book.id)}
                      className={cn(
                        "w-full flex items-center gap-2 p-3 transition-colors rounded-lg",
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-card/50 hover:bg-card"
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="text-2xl">{book.coverEmoji}</span>
                      <span className="text-sm font-medium truncate">
                        {book.title}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="bg-muted/30 p-2 space-y-1">
                        <Link
                          to={`/book/${book.id}`}
                          className={cn(
                            "block p-2 rounded text-sm transition-colors",
                            isCurrent
                              ? "bg-primary/20 text-primary font-medium"
                              : "hover:bg-muted/50"
                          )}
                        >
                          📖 Hikayeyi Oku
                        </Link>
                        {book.pages.map((page, idx) => (
                          <Link
                            key={idx}
                            to={`/book/${book.id}?page=${idx}`}
                            className="block p-2 rounded text-sm hover:bg-muted/50 transition-colors"
                          >
                            <span className="mr-2">{page.emoji}</span>
                            {page.character}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </aside>
    </>
  );
};

export default BookSidebar;
