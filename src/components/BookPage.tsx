import { ReactNode } from "react";
import AnimatedElements from "./AnimatedElements";
import InteractiveAnimals from "./InteractiveAnimals";

interface BookPageProps {
  children: ReactNode;
  backgroundImage?: string;
  pageNumber: number;
  animationType?: "sun" | "butterfly" | "stars" | "celebration";
  gradientFallback?: string;
}

const BookPage = ({ children, backgroundImage, pageNumber, animationType, gradientFallback }: BookPageProps) => {
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
      
      {/* Üst kısımda yazı için gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none z-0" />
      
      {/* Animasyonlu öğeler */}
      {animationType && (
        <div className="absolute inset-0 pointer-events-none z-5">
          <AnimatedElements type={animationType} />
        </div>
      )}
      
      {/* İnteraktif hayvanlar */}
      <InteractiveAnimals pageNumber={pageNumber} />
      
      {/* Yazıyı üst kısma konumlandır */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-start pt-8 md:pt-12 px-4 md:px-8">
        {children}
      </div>
      
      <div className="absolute bottom-20 right-4 text-xl font-bold text-foreground/50 z-20">
        {pageNumber}
      </div>
    </div>
  );
};

export default BookPage;
