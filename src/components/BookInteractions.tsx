import { useState } from "react";
import { Heart, MessageCircle, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useBookInteractions, BookComment } from "@/hooks/useBookInteractions";
import { useChildren, ChildData } from "@/hooks/useChildren";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface BookInteractionsProps {
  bookId: string;
}

const EMOJI_OPTIONS = ["😊", "❤️", "🌟", "👏", "🎉", "😍", "📚", "✨"];

export const BookInteractions = ({ bookId }: BookInteractionsProps) => {
  const {
    comments,
    toggleLike,
    addComment,
    deleteComment,
    isLikedByChild,
    getLikesCount,
  } = useBookInteractions(bookId);
  const { children, selectedChildId, getChildById } = useChildren();
  const [commentText, setCommentText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("😊");
  const [isOpen, setIsOpen] = useState(false);

  const selectedChild = getChildById(selectedChildId);
  const isLiked = selectedChildId ? isLikedByChild(selectedChildId) : false;
  const likesCount = getLikesCount();

  const handleLike = () => {
    if (selectedChildId) {
      toggleLike(selectedChildId);
    }
  };

  const handleAddComment = async () => {
    if (selectedChildId && commentText.trim()) {
      await addComment(selectedChildId, commentText, selectedEmoji);
      setCommentText("");
      setSelectedEmoji("😊");
    }
  };

  const getChildForComment = (comment: BookComment): ChildData | null => {
    return children.find((c) => c.id === comment.child_id) || null;
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-2">
      {/* Like button */}
      <Button
        onClick={handleLike}
        size="icon"
        className={`w-12 h-12 rounded-full shadow-lg transition-all ${
          isLiked
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-card hover:bg-card/90 text-muted-foreground"
        }`}
        disabled={!selectedChildId}
      >
        <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
      </Button>
      {likesCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
          {likesCount}
        </span>
      )}

      {/* Comments sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full shadow-lg bg-card hover:bg-card/90 text-muted-foreground relative"
          >
            <MessageCircle className="w-5 h-5" />
            {comments.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {comments.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Yorumlar ({comments.length})
            </SheetTitle>
          </SheetHeader>

          {/* Add comment form */}
          {selectedChild && (
            <div className="py-4 border-b space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedChild.avatar_emoji || "👶"}</span>
                <span className="text-sm font-medium">{selectedChild.name}</span>
              </div>
              
              {/* Emoji picker */}
              <div className="flex gap-1 flex-wrap">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                      selectedEmoji === emoji
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Comment input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Yorum yaz..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Henüz yorum yok</p>
                <p className="text-sm">İlk yorumu sen yap!</p>
              </div>
            ) : (
              comments.map((comment) => {
                const child = getChildForComment(comment);
                return (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-3 rounded-xl bg-muted/50 group"
                  >
                    <span className="text-2xl">{comment.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {child?.avatar_emoji || "👶"} {child?.name || "Çocuk"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
