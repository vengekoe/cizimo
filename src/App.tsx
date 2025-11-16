import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BookReader from "./pages/BookReader";
import NotFound from "./pages/NotFound";
import BookSidebar from "./components/BookSidebar";
import { useBooks } from "./hooks/useBooks";
import { cn } from "./lib/utils";

const queryClient = new QueryClient();

const AppContent = () => {
  const { books } = useBooks();
  const location = window.location;
  const isBookReader = location.pathname.includes('/book/');

  return (
    <div className="flex w-full">
      {!isBookReader && <BookSidebar books={books} />}
      <main className={cn("flex-1 w-full", !isBookReader && "mr-16")}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book/:bookId" element={<BookReader />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
