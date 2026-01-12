import { useState, useRef } from "react";

interface SwipeInteractionProps {
  emoji: string;
  sound: string;
  label: string;
  position?: "top" | "bottom" | "center";
}

const SwipeInteraction = ({ emoji, sound, label, position = "bottom" }: SwipeInteractionProps) => {
  const [swipeCount, setSwipeCount] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const startX = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    const deltaX = e.touches[0].clientX - startX.current;
    setCurrentX(deltaX);
  };

  const handleTouchEnd = () => {
    if (Math.abs(currentX) > 50) {
      setSwipeCount(prev => prev + 1);
    }
    isSwiping.current = false;
    setCurrentX(0);
  };

  const positionClasses = {
    top: "top-4",
    center: "top-1/2 -translate-y-1/2",
    bottom: "bottom-28"
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="text-lg md:text-xl px-3 py-2 md:px-4 md:py-3 bg-card/90 backdrop-blur-sm rounded-xl shadow-xl transition-all duration-200 cursor-pointer select-none"
        style={{
          transform: `translateX(${currentX}px)`,
        }}
      >
        {emoji}
      </div>
      
      {swipeCount > 0 && (
        <p className="text-sm text-accent font-bold animate-fade-in">
          {sound} {swipeCount > 2 && "💫"}
        </p>
      )}
    </div>
  );
};

export default SwipeInteraction;
