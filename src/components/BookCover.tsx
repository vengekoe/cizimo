import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedElements from "./AnimatedElements";
import bookCoverImage from "@/assets/book-cover.jpg";

interface BookCoverProps {
  onStart: () => void;
  title?: string;
  emoji?: string;
  coverImage?: string;
}

const BookCover = ({ onStart, title = "Orman Arkadaşları", emoji = "🌲", coverImage }: BookCoverProps) => {
  // Her kitap için benzersiz gradient oluştur
  const gradientColors = [
    "from-purple-500/30 via-pink-500/30 to-red-500/30",
    "from-blue-500/30 via-cyan-500/30 to-teal-500/30",
    "from-green-500/30 via-emerald-500/30 to-lime-500/30",
    "from-orange-500/30 via-amber-500/30 to-yellow-500/30",
    "from-indigo-500/30 via-violet-500/30 to-purple-500/30",
  ];
  
  const randomGradient = gradientColors[Math.floor(Math.random() * gradientColors.length)];
  
  return (
    <div className={`relative w-full h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br ${randomGradient}`}>
      <div className="absolute inset-0 animate-fade-in">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt="Kitap Kapağı" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${randomGradient} opacity-50`} />
        )}
      </div>
      
      {/* Animasyonlu öğeler */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatedElements type="sun" />
      </div>

      {/* Ana sayfa butonu - sol üst köşe */}
      <Link to="/" className="absolute top-6 left-6 z-20">
        <Button
          size="lg"
          variant="outline"
          className="text-xl px-6 py-6 bg-card/80 backdrop-blur-sm hover:bg-card shadow-2xl"
        >
          <Home className="w-6 h-6 mr-2" />
          <span className="hidden md:inline">Kitaplık</span>
        </Button>
      </Link>
      
      <div className="relative z-10 flex flex-col items-center gap-8 p-8 animate-scale-in">
        <div className="text-8xl mb-4 animate-bounce-gentle">{emoji}</div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-center text-primary drop-shadow-2xl">
          {title}
        </h1>
        
        <p className="text-2xl md:text-3xl text-center text-foreground drop-shadow-lg max-w-2xl">
          Bir hikaye macerasına hazır ol!
        </p>
        
        <Button
          onClick={onStart}
          size="lg"
          className="text-2xl md:text-3xl px-12 py-8 bg-gradient-to-r from-primary to-accent hover:scale-110 transition-all duration-300 shadow-2xl bounce-gentle"
        >
          Kitabı Aç 📖
        </Button>
      </div>
    </div>
  );
};

export default BookCover;
