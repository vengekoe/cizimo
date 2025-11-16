interface AnimatedElementsProps {
  type: "sun" | "butterfly" | "stars" | "celebration";
}

const AnimatedElements = ({ type }: AnimatedElementsProps) => {
  if (type === "sun") {
    return (
      <>
        {/* Parıldayan güneş */}
        <div className="absolute top-[15%] right-[20%] w-32 h-32 md:w-40 md:h-40">
          <div className="absolute inset-0 bg-yellow-400 rounded-full animate-pulse opacity-50" />
          <div className="absolute inset-2 bg-yellow-300 rounded-full animate-[spin_20s_linear_infinite]">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-8 md:w-3 md:h-12 bg-yellow-400 rounded-full"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${i * 45}deg) translate(-50%, -150%)`,
                  transformOrigin: "center",
                }}
              />
            ))}
          </div>
        </div>

        {/* Uçan kuşlar */}
        <div className="absolute top-[25%] left-[15%] text-4xl animate-[bird-fly_15s_ease-in-out_infinite]">
          🦅
        </div>
        <div className="absolute top-[30%] left-[25%] text-3xl animate-[bird-fly_18s_ease-in-out_infinite_2s]">
          🦅
        </div>
      </>
    );
  }

  if (type === "butterfly") {
    return (
      <>
        {/* Uçan kelebekler */}
        <div className="absolute top-[20%] right-[15%] text-5xl animate-[butterfly-float_8s_ease-in-out_infinite]">
          🦋
        </div>
        <div className="absolute top-[40%] left-[10%] text-4xl animate-[butterfly-float_10s_ease-in-out_infinite_2s]">
          🦋
        </div>
        <div className="absolute bottom-[30%] right-[25%] text-3xl animate-[butterfly-float_12s_ease-in-out_infinite_4s]">
          🦋
        </div>
      </>
    );
  }

  if (type === "stars") {
    return (
      <>
        {/* Parıldayan yıldızlar */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl md:text-4xl animate-[twinkle_3s_ease-in-out_infinite]"
            style={{
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 90 + 5}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            ⭐
          </div>
        ))}
        
        {/* Hafif hareket eden ay */}
        <div className="absolute top-[20%] right-[15%] text-7xl md:text-8xl animate-[gentle-float_6s_ease-in-out_infinite]">
          🌙
        </div>

        {/* Uçan ateş böcekleri */}
        <div className="absolute top-[45%] left-[20%] w-3 h-3 bg-yellow-300 rounded-full animate-[firefly_4s_ease-in-out_infinite] shadow-lg shadow-yellow-400" />
        <div className="absolute top-[60%] right-[30%] w-2 h-2 bg-yellow-300 rounded-full animate-[firefly_5s_ease-in-out_infinite_1s] shadow-lg shadow-yellow-400" />
        <div className="absolute bottom-[40%] left-[40%] w-3 h-3 bg-yellow-300 rounded-full animate-[firefly_6s_ease-in-out_infinite_2s] shadow-lg shadow-yellow-400" />
      </>
    );
  }

  if (type === "celebration") {
    return (
      <>
        {/* Uçan balonlar */}
        <div className="absolute bottom-[10%] left-[15%] text-6xl animate-[balloon-float_10s_ease-in-out_infinite]">
          🎈
        </div>
        <div className="absolute bottom-[15%] right-[20%] text-5xl animate-[balloon-float_12s_ease-in-out_infinite_2s]">
          🎈
        </div>

        {/* Parıldayan konfeti */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-[confetti-fall_4s_linear_infinite]"
            style={{
              top: `${-10}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              fontSize: `${Math.random() * 20 + 20}px`,
            }}
          >
            {["🎊", "🎉", "⭐", "✨", "💫"][Math.floor(Math.random() * 5)]}
          </div>
        ))}

        {/* Uçan kelebekler */}
        <div className="absolute top-[25%] left-[20%] text-4xl animate-[butterfly-float_8s_ease-in-out_infinite]">
          🦋
        </div>
        <div className="absolute top-[35%] right-[25%] text-4xl animate-[butterfly-float_10s_ease-in-out_infinite_3s]">
          🦋
        </div>
      </>
    );
  }

  return null;
};

export default AnimatedElements;
