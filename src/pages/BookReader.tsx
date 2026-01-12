import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import BookCover from "@/components/BookCover";
import BookPage from "@/components/BookPage";
import ClickInteraction from "@/components/interactions/ClickInteraction";
import DragInteraction from "@/components/interactions/DragInteraction";
import SwipeInteraction from "@/components/interactions/SwipeInteraction";
import ShakeInteraction from "@/components/interactions/ShakeInteraction";
import PageNavigation from "@/components/PageNavigation";
import BookFeedback from "@/components/BookFeedback";
import { BookInteractions } from "@/components/BookInteractions";
import AudioPlayer from "@/components/AudioPlayer";
import { useBooks } from "@/hooks/useBooks";
import { useReadingStats } from "@/hooks/useReadingStats";
import { useChildren } from "@/hooks/useChildren";
import { useBookShares } from "@/hooks/useBookShares";
import { Button } from "@/components/ui/button";
import { BookGenerationProgress } from "@/components/BookGenerationProgress";
import { Home, Loader2, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";

const BookReader = () => {
  const { bookId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { books, updateLastRead, regenerateBookImages, loading, progress } = useBooks();
  const { startReadingSession, updateReadingSession, endReadingSession } = useReadingStats();
  const { children, selectedChildId, getChildById } = useChildren();
  const { isBookSharedWith, getSharedChildIds } = useBookShares();
  const [currentPage, setCurrentPage] = useState(-1);
  const [pageDirection, setPageDirection] = useState<"forward" | "backward">("forward");
  const [showFeedback, setShowFeedback] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [sharedNotificationShown, setSharedNotificationShown] = useState(false);
  const sessionStartedRef = useRef(false);
  const maxPageReadRef = useRef(0);

  const book = books.find((b) => b.id === bookId);
  const totalPages = book?.pages.length || 0;
  
  // Check if this is a shared book (not owned by selected child)
  const ownerChild = getChildById(book?.childId);
  const isSharedBook = book && selectedChildId && book.childId !== selectedChildId && isBookSharedWith(book.id, selectedChildId);
  const sharedWithChildren = book ? children.filter(c => getSharedChildIds(book.id).includes(c.id)) : [];

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

  // Show shared book notification
  useEffect(() => {
    if (isSharedBook && ownerChild && !sharedNotificationShown) {
      toast.info(
        `Bu kitap ${ownerChild.avatar_emoji || "👶"} ${ownerChild.name} tarafından paylaşıldı`,
        { duration: 4000 }
      );
      setSharedNotificationShown(true);
    }
  }, [isSharedBook, ownerChild, sharedNotificationShown]);

  // End session when leaving page - must be before any conditional returns
  useEffect(() => {
    return () => {
      if (sessionStartedRef.current) {
        endReadingSession();
      }
    };
  }, [endReadingSession]);

  // Early return for loading/not found - AFTER all hooks
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

  const handleStart = async () => {
    setPageDirection("forward");
    setCurrentPage(0);
    setSearchParams({ page: "0" });
    
    // Start reading session
    if (book && !sessionStartedRef.current) {
      sessionStartedRef.current = true;
      maxPageReadRef.current = 1;
      await startReadingSession(book.id, book.childId || null);
    }
  };

  const handleNext = async () => {
    if (currentPage < totalPages - 1) {
      setPageDirection("forward");
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      setSearchParams({ page: nextPage.toString() });
      
      // Track max page read
      if (nextPage + 1 > maxPageReadRef.current) {
        maxPageReadRef.current = nextPage + 1;
        await updateReadingSession(maxPageReadRef.current);
      }
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

  const handleHome = async () => {
    setPageDirection("backward");
    setCurrentPage(-1);
    setSearchParams({});
    
    // End reading session when going back to cover
    if (sessionStartedRef.current) {
      await endReadingSession();
      sessionStartedRef.current = false;
      maxPageReadRef.current = 0;
    }
  };

  const handleFinish = async () => {
    // Mark all pages as read
    if (book) {
      maxPageReadRef.current = totalPages;
      await updateReadingSession(maxPageReadRef.current);
    }
    setShowFeedback(true);
  };

  const handleRegenerateImages = async () => {
    if (!bookId || isRegenerating) return;
    setIsRegenerating(true);
    await regenerateBookImages(bookId);
    setIsRegenerating(false);
    // Force page refresh to show new images
    window.location.reload();
  };

  // Show progress overlay when regenerating
  if (isRegenerating && progress.stage) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <BookGenerationProgress progress={progress} />
      </div>
    );
  }

  if (currentPage === -1) {
    return (
      <div className="relative">
        <BookCover onStart={handleStart} title={book.title} emoji={book.coverEmoji} coverImage={book.coverImage} />
        
        {/* Shared book owner badge */}
        {isSharedBook && ownerChild && (
          <div className="absolute top-4 left-4 z-50 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg">
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {ownerChild.avatar_emoji || "👶"} {ownerChild.name}'in kitabı
            </span>
          </div>
        )}
        
        {/* Shared with badge (for owner) */}
        {!isSharedBook && sharedWithChildren.length > 0 && (
          <div className="absolute top-4 left-4 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg">
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {sharedWithChildren.map(c => c.avatar_emoji || "👶").join(" ")} ile paylaşıldı
            </span>
          </div>
        )}
        
        <Button
          onClick={handleRegenerateImages}
          disabled={isRegenerating}
          className="absolute top-4 right-4 z-50 gap-2"
          variant="secondary"
        >
          <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Görselleri Yenile
        </Button>
      </div>
    );
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
    <div className="relative w-screen h-screen overflow-hidden m-0 p-0">
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
          textPosition={page.textPosition}
        >
          <div className="space-y-2 md:space-y-3 lg:space-y-4 animate-fade-in max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
            <div className="flex items-start gap-2">
              <h2 className="flex-1 font-bubble text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 bg-black/30 backdrop-blur-sm rounded-xl md:rounded-2xl">
                {page.title}
              </h2>
              <AudioPlayer 
                text={`${page.title}. ${page.description}`} 
                variant="icon"
                className="shrink-0"
              />
            </div>
            <p className="font-nunito text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-black/25 backdrop-blur-sm rounded-lg md:rounded-xl leading-relaxed">
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

      {/* Like & Comment buttons */}
      {currentPage >= 0 && <BookInteractions bookId={book.id} />}
    </div>
  );
};

export default BookReader;
