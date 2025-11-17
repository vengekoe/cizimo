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
    bottom: "bottom-4"
  };

  return (
    <div className={`absolute ${positionClasses[position]} left-1/2 -translate-x-1/2`}>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="text-4xl md:text-6xl px-8 py-6 bg-card/90 backdrop-blur-sm rounded-2xl shadow-xl transition-all duration-200 cursor-pointer select-none"
        style={{
          transform: `translateX(${currentX}px)`,
        }}
      >
        {emoji}
      </div>
      
      <div className="text-center mt-4">
        <p className="text-2xl md:text-3xl font-bold text-foreground bg-card/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
          {label} <span className="text-lg">👆 Kaydır</span>
        </p>
        {swipeCount > 0 && (
          <p className="text-xl mt-2 text-accent font-bold animate-fade-in">
            {sound} {swipeCount > 2 && "💫"}
          </p>
        )}
      </div>
    </div>
  );
};

export default SwipeInteraction;
