import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ClickInteractionProps {
  emoji: string;
  sound: string;
  label: string;
  position?: "top" | "bottom" | "center";
}

const ClickInteraction = ({ emoji, sound, label, position = "bottom" }: ClickInteractionProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    setIsAnimating(true);
    setClickCount(prev => prev + 1);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const positionClasses = {
    top: "top-4",
    center: "top-1/2 -translate-y-1/2",
    bottom: "bottom-28"
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleClick}
        size="sm"
        variant="secondary"
        className={`text-lg md:text-xl px-3 py-2 md:px-4 md:py-3 bg-card/90 backdrop-blur-sm hover:scale-110 transition-all duration-300 shadow-xl ${
          isAnimating ? "wiggle scale-110" : ""
        }`}
      >
        {emoji}
      </Button>
      
      {clickCount > 0 && (
        <p className="text-sm text-accent font-bold animate-fade-in">
          {sound} {clickCount > 2 && "🎉"}
        </p>
      )}
    </div>
  );
};

export default ClickInteraction;
