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

const queryClient = new QueryClient();

const AppContent = () => {
  const { books } = useBooks();

  return (
    <div className="flex w-full">
      <BookSidebar books={books} />
      <main className="ml-16 flex-1 w-full">
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
