import { ReactNode } from "react";

interface BookPageProps {
  children: ReactNode;
  backgroundImage: string;
  pageNumber: number;
}

const BookPage = ({ children, backgroundImage, pageNumber }: BookPageProps) => {
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-book-page/10 to-book-page/30" />
      
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 md:p-16">
        {children}
      </div>
      
      <div className="absolute bottom-8 right-8 text-2xl font-bold text-foreground/60">
        {pageNumber}
      </div>
    </div>
  );
};

export default BookPage;
