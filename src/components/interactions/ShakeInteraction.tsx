import { useState, useEffect } from "react";

interface ShakeInteractionProps {
  emoji: string;
  sound: string;
  label: string;
  position?: "top" | "bottom" | "center";
}

const ShakeInteraction = ({ emoji, sound, label, position = "bottom" }: ShakeInteractionProps) => {
  const [shakeCount, setShakeCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let shakeThreshold = 15;

    const handleMotion = (event: DeviceMotionEvent) => {
      const { x, y, z } = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
      
      if (!x || !y || !z) return;

      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      if (deltaX + deltaY + deltaZ > shakeThreshold) {
        setIsShaking(true);
        setShakeCount(prev => prev + 1);
        
        setTimeout(() => setIsShaking(false), 500);
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);

  const positionClasses = {
    top: "top-4",
    center: "top-1/2 -translate-y-1/2",
    bottom: "bottom-4"
  };

  return (
    <div className={`absolute ${positionClasses[position]} left-1/2 -translate-x-1/2 z-30`}>
      <div
        className={`text-4xl md:text-6xl px-8 py-6 bg-card/90 backdrop-blur-sm rounded-2xl shadow-xl transition-all duration-300 ${
          isShaking ? "animate-wiggle scale-110" : ""
        }`}
      >
        {emoji}
      </div>
      
      <div className="text-center mt-4">
        <p className="text-2xl md:text-3xl font-bold text-foreground bg-card/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
          {label} <span className="text-lg">📱 Salla</span>
        </p>
        {shakeCount > 0 && (
          <p className="text-xl mt-2 text-accent font-bold animate-fade-in">
            {sound} {shakeCount > 2 && "⭐"}
          </p>
        )}
      </div>
    </div>
  );
};

export default ShakeInteraction;
