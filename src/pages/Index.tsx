import { useState } from "react";
import BookCover from "@/components/BookCover";
import BookPage from "@/components/BookPage";
import InteractiveElement from "@/components/InteractiveElement";
import PageNavigation from "@/components/PageNavigation";
import bearPageImage from "@/assets/bear-page.jpg";
import rabbitPageImage from "@/assets/rabbit-page.jpg";
import owlPageImage from "@/assets/owl-page.jpg";
import celebrationPageImage from "@/assets/celebration-page.jpg";

const Index = () => {
  const [currentPage, setCurrentPage] = useState(-1);
  const [pageDirection, setPageDirection] = useState<"forward" | "backward">("forward");

  const totalPages = 5;

  const handleStart = () => {
    setPageDirection("forward");
    setCurrentPage(0);
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setPageDirection("forward");
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setPageDirection("backward");
      setCurrentPage(currentPage - 1);
    }
  };

  const handleHome = () => {
    setPageDirection("backward");
    setCurrentPage(-1);
  };

  if (currentPage === -1) {
    return <BookCover onStart={handleStart} />;
  }

  const pages = [
    // Sayfa 1: Ayı
    <BookPage key={0} backgroundImage={bearPageImage} pageNumber={1}>
      <div className="text-center space-y-8 animate-fade-in">
        <h2 className="text-4xl md:text-6xl font-bold text-foreground bg-card/80 backdrop-blur-sm px-8 py-4 rounded-3xl shadow-2xl">
          Merhaba! Ben Ayı! 🐻
        </h2>
        <p className="text-2xl md:text-3xl text-foreground bg-card/70 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl max-w-2xl">
          Ormanda yaşıyorum ve yeni arkadaşlar arıyorum!
        </p>
      </div>
      <InteractiveElement emoji="🐻" sound="Hav hav!" label="Tıkla benimle konuş!" />
    </BookPage>,

    // Sayfa 2: Tavşan
    <BookPage key={1} backgroundImage={rabbitPageImage} pageNumber={2}>
      <div className="text-center space-y-8 animate-fade-in">
        <h2 className="text-4xl md:text-6xl font-bold text-foreground bg-card/80 backdrop-blur-sm px-8 py-4 rounded-3xl shadow-2xl">
          Merhaba! Ben Tavşan! 🐰
        </h2>
        <p className="text-2xl md:text-3xl text-foreground bg-card/70 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl max-w-2xl">
          Çayırlarda hoplayıp zıplamayı çok severim!
        </p>
      </div>
      <InteractiveElement emoji="🐰" sound="Hop hop!" label="Benimle zıpla!" />
    </BookPage>,

    // Sayfa 3: Baykuş
    <BookPage key={2} backgroundImage={owlPageImage} pageNumber={3}>
      <div className="text-center space-y-8 animate-fade-in">
        <h2 className="text-4xl md:text-6xl font-bold text-card bg-primary/80 backdrop-blur-sm px-8 py-4 rounded-3xl shadow-2xl">
          Merhaba! Ben Baykuş! 🦉
        </h2>
        <p className="text-2xl md:text-3xl text-card bg-primary/70 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl max-w-2xl">
          Geceleri yıldızları izlemeyi seviyorum!
        </p>
      </div>
      <InteractiveElement emoji="🦉" sound="Huu huu!" label="Benimle şarkı söyle!" />
    </BookPage>,

    // Sayfa 4: Hepsi birlikte
    <BookPage key={3} backgroundImage={celebrationPageImage} pageNumber={4}>
      <div className="text-center space-y-8 animate-fade-in">
        <h2 className="text-4xl md:text-6xl font-bold text-foreground bg-card/80 backdrop-blur-sm px-8 py-4 rounded-3xl shadow-2xl">
          Hepimiz Arkadaşız! 🎉
        </h2>
        <p className="text-2xl md:text-3xl text-foreground bg-card/70 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl max-w-2xl">
          Birlikte eğlenmeye ne dersin?
        </p>
      </div>
      <InteractiveElement emoji="🎈" sound="Yaşasın!" label="Kutlama zamanı!" />
    </BookPage>,

    // Sayfa 5: Son
    <BookPage key={4} backgroundImage={celebrationPageImage} pageNumber={5}>
      <div className="text-center space-y-8 animate-fade-in">
        <h2 className="text-4xl md:text-6xl font-bold text-foreground bg-card/80 backdrop-blur-sm px-8 py-4 rounded-3xl shadow-2xl">
          Hikayemiz Bitti! 📖
        </h2>
        <p className="text-2xl md:text-3xl text-foreground bg-card/70 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl max-w-2xl">
          Umarız eğlenmişsindir! Tekrar okumak ister misin?
        </p>
        <button
          onClick={handleHome}
          className="text-2xl md:text-3xl px-12 py-6 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-full hover:scale-110 transition-all duration-300 shadow-2xl bounce-gentle"
        >
          Başa Dön 🏠
        </button>
      </div>
    </BookPage>,
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div
        key={currentPage}
        className={pageDirection === "forward" ? "page-turn-enter" : "page-turn-exit"}
      >
        {pages[currentPage]}
      </div>

      {currentPage < totalPages - 1 && (
        <PageNavigation
          currentPage={currentPage}
          totalPages={totalPages}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onHome={handleHome}
        />
      )}
    </div>
  );
};

export default Index;
