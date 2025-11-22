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
      className="flex flex-col items-center gap-2"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        onMouseDown={handleMouseDown}
        className={`text-3xl md:text-4xl px-6 py-4 bg-card/90 backdrop-blur-sm rounded-2xl shadow-xl cursor-grab active:cursor-grabbing transition-all duration-300 ${
          isDragging ? "scale-110 shadow-2xl" : "hover:scale-105"
        }`}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          userSelect: 'none'
        }}
      >
        {emoji}
      </div>
      
      {dragCount > 0 && (
        <p className="text-lg text-accent font-bold animate-fade-in pointer-events-none">
          {sound} {dragCount > 2 && "✨"}
        </p>
      )}
    </div>
  );
};

export default DragInteraction;
