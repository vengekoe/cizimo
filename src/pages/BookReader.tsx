import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import BookCover from "@/components/BookCover";
import BookPage from "@/components/BookPage";
import InteractiveElement from "@/components/InteractiveElement";
import PageNavigation from "@/components/PageNavigation";
import BookFeedback from "@/components/BookFeedback";
import { useBooks } from "@/hooks/useBooks";

const BookReader = () => {
  const { bookId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { books, updateLastRead } = useBooks();
  const [currentPage, setCurrentPage] = useState(-1);
  const [pageDirection, setPageDirection] = useState<"forward" | "backward">("forward");
  const [showFeedback, setShowFeedback] = useState(false);

  const book = books.find((b) => b.id === bookId);
  const totalPages = book?.pages.length || 0;

  // Kitap açıldığında son okunma tarihini güncelle
  useEffect(() => {
    if (bookId && updateLastRead) {
      updateLastRead(bookId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam !== null) {
      const page = parseInt(pageParam);
      if (!isNaN(page) && page >= 0 && page < totalPages) {
        setCurrentPage(page);
      }
    }
  }, [searchParams, totalPages]);

  if (!book) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Kitap bulunamadı 📚</h1>
          <p className="text-xl text-muted-foreground">
            Aradığınız kitap mevcut değil.
          </p>
        </div>
      </div>
    );
  }

  const handleStart = () => {
    setPageDirection("forward");
    setCurrentPage(0);
    setSearchParams({ page: "0" });
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setPageDirection("forward");
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      setSearchParams({ page: nextPage.toString() });
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setPageDirection("backward");
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      setSearchParams({ page: prevPage.toString() });
    }
  };

  const handleHome = () => {
    setPageDirection("backward");
    setCurrentPage(-1);
    setSearchParams({});
  };

  const handleFinish = () => {
    setShowFeedback(true);
  };

  if (currentPage === -1) {
    return <BookCover onStart={handleStart} title={book.title} emoji={book.coverEmoji} coverImage={book.coverImage} />;
  }

  const page = book.pages[currentPage];
  const bgImage = page.backgroundImage;
  
  // Animasyon tipini sayfa numarasına göre belirle
  const animationTypes = ["butterfly", "butterfly", "stars", "celebration"] as const;
  const animation = animationTypes[currentPage % animationTypes.length];
  
  // Görsel yoksa gradient arka plan kullan
  const gradientBackgrounds = [
    "from-blue-400/20 via-purple-400/20 to-pink-400/20",
    "from-green-400/20 via-teal-400/20 to-cyan-400/20",
    "from-orange-400/20 via-red-400/20 to-pink-400/20",
    "from-yellow-400/20 via-orange-400/20 to-red-400/20",
  ];
  const gradientBg = gradientBackgrounds[currentPage % gradientBackgrounds.length];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div
        key={currentPage}
        className={
          (pageDirection === "forward" ? "page-turn-enter" : "page-turn-exit") +
          " relative z-0"
        }
      >
        <BookPage
          backgroundImage={bgImage}
          pageNumber={currentPage + 1}
          animationType={animation}
          gradientFallback={gradientBg}
        >
          <div className="text-center space-y-8 animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground bg-card/80 backdrop-blur-sm px-8 py-4 rounded-3xl shadow-2xl">
              {page.title}
            </h2>
            <p className="text-2xl md:text-3xl text-foreground bg-card/70 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl max-w-2xl">
              {page.description}
            </p>
          </div>
          <InteractiveElement
            emoji={page.emoji}
            sound={page.sound}
            label={`Tıkla benimle konuş!`}
          />
        </BookPage>
      </div>

      <PageNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onHome={handleHome}
        onFinish={handleFinish}
      />

      <BookFeedback
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        bookTitle={book.title}
        bookId={book.id}
      />
    </div>
  );
};

export default BookReader;
