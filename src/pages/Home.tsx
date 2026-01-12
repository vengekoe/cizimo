import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { useAuth } from "@/hooks/useAuth";
import { useChildren } from "@/hooks/useChildren";
import { Button } from "@/components/ui/button";
import { Trash2, Star, Clock, Paintbrush, Baby } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import BottomNavigation from "@/components/BottomNavigation";
import { BookGenerationProgress } from "@/components/BookGenerationProgress";

const Home = () => {
  const { books, loading, progress, deleteBook, toggleFavorite } = useBooks();
  const { user, loading: authLoading } = useAuth();
  const { children, selectedChildId, setSelectedChildId } = useChildren();
  const navigate = useNavigate();
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"favorites" | "recent">("favorites");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Filter books by selected child
  const filteredBooks = selectedChildId 
    ? books.filter(book => book.childId === selectedChildId)
    : books;

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === "favorites") {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    } else {
      const aDate = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
      const bDate = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
      return bDate - aDate;
    }
  });

  const handleDeleteBook = (bookId: string) => {
    if (deleteBook) {
      deleteBook(bookId);
      setBookToDelete(null);
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId);

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-primary/5">
      <BookGenerationProgress progress={progress} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Hikaye Kitaplığım 📚
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Yapay zeka ile benzersiz hikayeler keşfet!
          </p>
        </div>

        {/* Çocuk Filtresi */}
        {children.length > 0 && (
          <div className="bg-card rounded-2xl p-3 border border-border mb-4">
            <div className="flex items-center gap-2">
              <Baby className="w-4 h-4 text-primary" />
              <Select value={selectedChildId || "all"} onValueChange={(v) => setSelectedChildId(v === "all" ? null : v)}>
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue placeholder="Tüm kitaplar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📚 Tüm Kitaplar</SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      <div className="flex items-center gap-2">
                        <span>{child.avatar_emoji || "👶"}</span>
                        <span>{child.name}'in Kitapları</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Sıralama */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {selectedChild ? `${selectedChild.name}'in Kitapları` : "Kitaplarım"} ({sortedBooks.length})
          </h2>
          <div className="flex gap-2">
            <Button
              variant={sortBy === "favorites" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("favorites")}
              className="h-8 text-xs"
            >
              <Star className="w-3 h-3 mr-1" />
              Favoriler
            </Button>
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("recent")}
              className="h-8 text-xs"
            >
              <Clock className="w-3 h-3 mr-1" />
              En Son
            </Button>
          </div>
        </div>

        {/* Kitap Listesi */}
        {sortedBooks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold mb-2">
              {selectedChild ? `${selectedChild.name} için henüz kitap yok` : "Henüz kitap yok"}
            </h3>
            <p className="text-muted-foreground mb-4">
              İlk hikayenizi oluşturmak için aşağıdaki + butonuna tıklayın
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedBooks.map((book) => (
              <div key={book.id} className="relative group">
                <Link
                  to={`/book/${book.id}`}
                  className="block relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary transition-all duration-300 hover:shadow-lg"
                >
                  {book.isFromDrawing && (
                    <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-medium shadow-lg">
                      <Paintbrush className="w-3 h-3" />
                      Çizimden
                    </div>
                  )}
                  <div className="p-5">
                    <div className="text-5xl mb-3">
                      {book.coverEmoji}
                    </div>
                    <h3 className="text-lg font-bold mb-1 line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{book.theme}</p>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {book.pages.length} sayfa
                      </span>
                      {book.lastReadAt && (
                        <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDistanceToNow(new Date(book.lastReadAt), { addSuffix: true, locale: tr })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="absolute top-3 right-3 z-10 flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity shadow backdrop-blur-sm ${
                      book.isFavorite 
                        ? "bg-yellow-500/90 hover:bg-yellow-500 text-white" 
                        : "bg-card/90 hover:bg-card text-muted-foreground"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite && toggleFavorite(book.id);
                    }}
                  >
                    <Star className={`w-4 h-4 ${book.isFavorite ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity shadow bg-card/90 hover:bg-card text-muted-foreground backdrop-blur-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setBookToDelete(book.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!bookToDelete} onOpenChange={() => setBookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kitabı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Kitap kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookToDelete && handleDeleteBook(bookToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
};

export default Home;
