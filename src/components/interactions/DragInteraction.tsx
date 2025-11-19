import { useState, useRef } from "react";

interface DragInteractionProps {
  emoji: string;
  sound: string;
  label: string;
  position?: "top" | "bottom" | "center";
}

const DragInteraction = ({ emoji, sound, label, position = "bottom" }: DragInteractionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCount, setDragCount] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPos({
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setDragCount(prev => prev + 1);
      setIsDragging(false);
      setTimeout(() => {
        setPos({ x: 0, y: 0 });
      }, 300);
    }
  };

  const positionClasses = {
    top: "top-4",
    center: "top-1/2 -translate-y-1/2",
    bottom: "bottom-28"
  };

  return (
    <div 
      className={`absolute ${positionClasses[position]} left-1/2 -translate-x-1/2 z-30`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        onMouseDown={handleMouseDown}
        className={`text-4xl md:text-6xl px-8 py-6 bg-card/90 backdrop-blur-sm rounded-2xl shadow-xl cursor-grab active:cursor-grabbing transition-all duration-300 ${
          isDragging ? "scale-110 shadow-2xl" : "hover:scale-105"
        }`}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          userSelect: 'none'
        }}
      >
        {emoji}
      </div>
      
      <div className="text-center mt-4 pointer-events-none">
        <p className="text-2xl md:text-3xl font-bold text-foreground bg-card/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
          {label}
        </p>
        {dragCount > 0 && (
          <p className="text-xl mt-2 text-accent font-bold animate-fade-in">
            {sound} {dragCount > 2 && "✨"}
          </p>
        )}
      </div>
    </div>
  );
};

export default DragInteraction;
