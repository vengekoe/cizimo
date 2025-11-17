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
    bottom: "bottom-4"
  };

  return (
    <div className={`absolute ${positionClasses[position]} left-1/2 -translate-x-1/2`}>
      <Button
        onClick={handleClick}
        size="lg"
        variant="secondary"
        className={`text-4xl md:text-6xl px-8 py-6 bg-card/90 backdrop-blur-sm hover:scale-125 transition-all duration-300 shadow-xl ${
          isAnimating ? "wiggle scale-125" : ""
        }`}
      >
        {emoji}
      </Button>
      
      <div className="text-center mt-4">
        <p className="text-2xl md:text-3xl font-bold text-foreground bg-card/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
          {label}
        </p>
        {clickCount > 0 && (
          <p className="text-xl mt-2 text-accent font-bold animate-fade-in">
            {sound} {clickCount > 2 && "🎉"}
          </p>
        )}
      </div>
    </div>
  );
};

export default ClickInteraction;
