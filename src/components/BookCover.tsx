import { Button } from "@/components/ui/button";
import AnimatedElements from "./AnimatedElements";
import bookCoverImage from "@/assets/book-cover.jpg";

interface BookCoverProps {
  onStart: () => void;
  title?: string;
  emoji?: string;
}

const BookCover = ({ onStart, title = "Orman Arkadaşları", emoji = "🌲" }: BookCoverProps) => {
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <div className="absolute inset-0 animate-fade-in">
        <img 
          src={bookCoverImage} 
          alt="Kitap Kapağı" 
          className="w-full h-full object-cover"
        />
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
          className="text-2xl md:text-3xl px-12 py-8 bg-gradient-to-r from-primary to-accent hover:scale-110 transition-all duration-300 shadow-2xl bounce-gentle"
        >
          Kitabı Aç 📖
        </Button>
      </div>
    </div>
  );
};

export default BookCover;
