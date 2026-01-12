import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import BookCover from "@/components/BookCover";
import BookPage from "@/components/BookPage";
import ClickInteraction from "@/components/interactions/ClickInteraction";
import DragInteraction from "@/components/interactions/DragInteraction";
import SwipeInteraction from "@/components/interactions/SwipeInteraction";
import ShakeInteraction from "@/components/interactions/ShakeInteraction";
import PageNavigation from "@/components/PageNavigation";
import BookFeedback from "@/components/BookFeedback";
import { useBooks } from "@/hooks/useBooks";
import { Button } from "@/components/ui/button";
import { Home, Loader2 } from "lucide-react";

const BookReader = () => {
  const { bookId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { books, updateLastRead } = useBooks();
  const [currentPage, setCurrentPage] = useState(-1);
  const [pageDirection, setPageDirection] = useState<"forward" | "backward">("forward");
  const [showFeedback, setShowFeedback] = useState(false);
  const [hydrating, setHydrating] = useState(true);

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

  // Allow time for local storage hydration across routes
  useEffect(() => {
    if (book) {
      setHydrating(false);
      return;
    }
    const t = setTimeout(() => setHydrating(false), 700);
    return () => clearTimeout(t);
  }, [book]);

  if (!book) {
    if (hydrating) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Yükleniyor...</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold mb-4">Kitap bulunamadı 📚</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Aradığınız kitap mevcut değil.
          </p>
          <Link to="/">
            <Button size="lg" className="gap-2">
              <Home className="w-5 h-5" />
              Kitaplığa Dön
            </Button>
          </Link>
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
  
  // Her sayfa için farklı interaksiyon tipi belirle
  const interactionTypes = ["click", "drag", "swipe", "shake", "click"] as const;
  const interactionType = interactionTypes[currentPage % interactionTypes.length];
  
  // Interaksiyon etiketleri
  const interactionLabels = {
    click: "Tıkla benimle konuş!",
    drag: "Sürükle beni!",
    swipe: "Kaydır beni!",
    shake: "Cihazını salla!"
  };
  
  // Görsel yoksa gradient arka plan kullan
  const gradientBackgrounds = [
    "from-blue-400/20 via-purple-400/20 to-pink-400/20",
    "from-green-400/20 via-teal-400/20 to-cyan-400/20",
    "from-orange-400/20 via-red-400/20 to-pink-400/20",
    "from-yellow-400/20 via-orange-400/20 to-red-400/20",
  ];
  const gradientBg = gradientBackgrounds[currentPage % gradientBackgrounds.length];

  // Interaksiyon componentini seç
  const renderInteraction = () => {
    const props = {
      emoji: page.emoji,
      sound: page.sound,
      label: interactionLabels[interactionType]
    };

    switch (interactionType) {
      case "click":
        return <ClickInteraction {...props} />;
      case "drag":
        return <DragInteraction {...props} />;
      case "swipe":
        return <SwipeInteraction {...props} />;
      case "shake":
        return <ShakeInteraction {...props} />;
      default:
        return <ClickInteraction {...props} />;
    }
  };

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
          <div className="text-center space-y-4 md:space-y-6 lg:space-y-8 animate-fade-in px-4 md:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground bg-card/60 backdrop-blur-sm px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-2xl md:rounded-3xl shadow-2xl">
              {page.title}
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-foreground bg-card/50 backdrop-blur-sm px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl md:rounded-2xl shadow-xl max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto leading-relaxed">
              {page.description}
            </p>
          </div>
        </BookPage>
      </div>

      <PageNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onHome={handleHome}
        onFinish={handleFinish}
        interactionButton={renderInteraction()}
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
