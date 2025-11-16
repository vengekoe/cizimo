import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedElements from "./AnimatedElements";

interface BookCoverProps {
  onStart: () => void;
  title?: string;
  emoji?: string;
  coverImage?: string;
}

const BookCover = ({ onStart, title = "Orman Arkadaşları", emoji = "🌲", coverImage }: BookCoverProps) => {
  // Her kitap için benzersiz gradient ve buton renkleri oluştur
  const colorThemes = [
    { 
      gradient: "from-purple-500/30 via-pink-500/30 to-red-500/30",
      button: "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    },
    { 
      gradient: "from-blue-500/30 via-cyan-500/30 to-teal-500/30",
      button: "from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
    },
    { 
      gradient: "from-green-500/30 via-emerald-500/30 to-lime-500/30",
      button: "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
    },
    { 
      gradient: "from-orange-500/30 via-amber-500/30 to-yellow-500/30",
      button: "from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
    },
    { 
      gradient: "from-indigo-500/30 via-violet-500/30 to-purple-500/30",
      button: "from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
    },
  ];
  
  // Başlığa göre tutarlı bir tema seç
  const themeIndex = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colorThemes.length;
  const theme = colorThemes[themeIndex];
  
  return (
    <div className={`relative w-full h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br ${theme.gradient}`}>
      <div className="absolute inset-0 animate-fade-in">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt="Kitap Kapağı" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${theme.gradient} opacity-50`} />
        )}
      </div>
      
      {/* Animasyonlu öğeler */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatedElements type="sun" />
      </div>
      
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
          className={`text-2xl md:text-3xl px-12 py-8 bg-gradient-to-r ${theme.button} text-white transition-all duration-300 shadow-2xl hover:scale-110 bounce-gentle`}
        >
          Kitabı Aç 📖
        </Button>

        <Link to="/">
          <Button
            size="lg"
            variant="outline"
            className={`text-xl md:text-2xl px-10 py-6 bg-gradient-to-r ${theme.button} text-white border-2 border-white/30 backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-xl`}
          >
            <Home className="w-6 h-6 mr-2" />
            Kitaplık
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default BookCover;
