import { ReactNode } from "react";
import AnimatedElements from "./AnimatedElements";
import InteractiveAnimals from "./InteractiveAnimals";
import { TextPosition } from "@/data/books";

interface BookPageProps {
  children: ReactNode;
  backgroundImage?: string;
  pageNumber: number;
  animationType?: "sun" | "butterfly" | "stars" | "celebration";
  gradientFallback?: string;
  textPosition?: TextPosition;
}

const getPositionClasses = (position: TextPosition = "top") => {
  const baseClasses = "relative z-10 w-full flex flex-col px-4 md:px-8";
  
  switch (position) {
    case "top":
      return `${baseClasses} items-center justify-start pt-6 md:pt-10`;
    case "bottom":
      return `${baseClasses} items-center justify-end pb-24 md:pb-28`;
    case "top-left":
      return `${baseClasses} items-start justify-start pt-6 md:pt-10 text-left`;
    case "top-right":
      return `${baseClasses} items-end justify-start pt-6 md:pt-10 text-right`;
    case "bottom-left":
      return `${baseClasses} items-start justify-end pb-24 md:pb-28 text-left`;
    case "bottom-right":
      return `${baseClasses} items-end justify-end pb-24 md:pb-28 text-right`;
    default:
      return `${baseClasses} items-center justify-start pt-6 md:pt-10`;
  }
};

const getGradientClasses = (position: TextPosition = "top") => {
  // Gradient yönünü metin konumuna göre ayarla
  switch (position) {
    case "top":
    case "top-left":
    case "top-right":
      return "bg-gradient-to-b from-black/50 via-black/20 to-transparent";
    case "bottom":
    case "bottom-left":
    case "bottom-right":
      return "bg-gradient-to-t from-black/50 via-black/20 to-transparent";
    default:
      return "bg-gradient-to-b from-black/50 via-black/20 to-transparent";
  }
};

const BookPage = ({ children, backgroundImage, pageNumber, animationType, gradientFallback, textPosition = "top" }: BookPageProps) => {
  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden m-0 p-0">
      {backgroundImage ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            backgroundColor: 'hsl(var(--background))'
          }}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientFallback || 'from-primary/20 via-secondary/20 to-accent/20'}`} />
      )}
      
      {/* Dinamik gradient overlay - metin konumuna göre */}
      <div className={`absolute inset-0 ${getGradientClasses(textPosition)} pointer-events-none z-0`} />
      
      {/* Animasyonlu öğeler */}
      {animationType && (
        <div className="absolute inset-0 pointer-events-none z-5">
          <AnimatedElements type={animationType} />
        </div>
      )}
      
      {/* İnteraktif hayvanlar */}
      <InteractiveAnimals pageNumber={pageNumber} />
      
      {/* Dinamik konumlu içerik */}
      <div className={`${getPositionClasses(textPosition)} h-full`}>
        {children}
      </div>
      
      <div className="absolute bottom-20 right-4 text-xl font-bold text-white/70 drop-shadow-lg z-20">
        {pageNumber}
      </div>
    </div>
  );
};

export default BookPage;