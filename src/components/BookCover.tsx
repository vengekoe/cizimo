import { Button } from "@/components/ui/button";
import bookCoverImage from "@/assets/book-cover.jpg";

interface BookCoverProps {
  onStart: () => void;
}

const BookCover = ({ onStart }: BookCoverProps) => {
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <div className="absolute inset-0 animate-fade-in">
        <img 
          src={bookCoverImage} 
          alt="Kitap Kapağı" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-8 p-8 animate-scale-in">
        <h1 className="text-5xl md:text-7xl font-bold text-center text-primary drop-shadow-2xl">
          Arkadaşlarımızla Macera
        </h1>
        
        <p className="text-2xl md:text-3xl text-center text-foreground drop-shadow-lg max-w-2xl">
          Ormanın sevimli dostlarıyla tanış!
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
