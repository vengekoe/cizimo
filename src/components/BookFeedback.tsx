import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Heart, Star } from "lucide-react";

interface BookFeedbackProps {
  open: boolean;
  onClose: () => void;
  bookTitle: string;
  bookId: string;
}

const emojis = [
  { emoji: "😍", label: "Çok sevdim!" },
  { emoji: "😊", label: "Güzeldi" },
  { emoji: "😐", label: "İdare eder" },
  { emoji: "🤔", label: "Anlamadım" },
];

const BookFeedback = ({ open, onClose, bookTitle, bookId }: BookFeedbackProps) => {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const navigate = useNavigate();

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    
    // Beğeniyi kaydet
    const feedback = {
      bookId,
      bookTitle,
      emoji,
      timestamp: Date.now(),
    };
    
    try {
      const existingFeedback = localStorage.getItem("book-feedback");
      const feedbackList = existingFeedback ? JSON.parse(existingFeedback) : [];
      feedbackList.push(feedback);
      localStorage.setItem("book-feedback", JSON.stringify(feedbackList));
    } catch (error) {
      console.error("Feedback kaydedilemedi:", error);
    }

    setShowThankYou(true);
    
    // 2 saniye sonra ana sayfaya yönlendir
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {!showThankYou ? (
          <div className="text-center space-y-6 p-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center animate-bounce-gentle">
                <Star className="w-10 h-10 text-primary-foreground" fill="currentColor" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Tebrikler! 🎉
              </h2>
              <p className="text-xl font-semibold">
                "{bookTitle}" kitabını bitirdin!
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                Bu hikayeyi beğendin mi?
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {emojis.map((item) => (
                  <button
                    key={item.emoji}
                    onClick={() => handleEmojiSelect(item.emoji)}
                    className="group relative p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/10 transition-all duration-300 hover:scale-105"
                  >
                    <div className="text-6xl mb-2 group-hover:scale-110 transition-transform">
                      {item.emoji}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                      {item.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 p-6 animate-fade-in">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <Heart className="w-10 h-10 text-primary-foreground animate-pulse" fill="currentColor" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold">
                Teşekkürler! {selectedEmoji}
              </h2>
              <p className="text-lg text-muted-foreground">
                Fikirlerini aldık!
              </p>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Kitaplığa dönülüyor...</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookFeedback;
