import { ReactNode } from "react";
import AnimatedElements from "./AnimatedElements";

interface BookPageProps {
  children: ReactNode;
  backgroundImage?: string;
  pageNumber: number;
  animationType?: "sun" | "butterfly" | "stars" | "celebration";
  gradientFallback?: string;
}

const BookPage = ({ children, backgroundImage, pageNumber, animationType, gradientFallback }: BookPageProps) => {
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {backgroundImage ? (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientFallback || 'from-primary/20 via-secondary/20 to-accent/20'}`} />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none z-0" />
      
      {/* Animasyonlu öğeler */}
      {animationType && (
        <div className="absolute inset-0 pointer-events-none z-5">
          <AnimatedElements type={animationType} />
        </div>
      )}
      
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 md:p-16">
        <div className="bg-background/90 dark:bg-background/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl max-w-4xl">
          {children}
        </div>
      </div>
      
      <div className="absolute bottom-8 right-8 text-2xl font-bold text-foreground/60 z-20">
        {pageNumber}
      </div>
    </div>
  );
};

export default BookPage;
