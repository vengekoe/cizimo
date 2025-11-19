import { useState } from "react";

interface Animal {
  emoji: string;
  sound: string;
  position: { left: string; top: string };
}

const animals: Animal[] = [
  { emoji: "🐦", sound: "Cik cik!", position: { left: "10%", top: "15%" } },
  { emoji: "🐸", sound: "Vrak vrak!", position: { left: "85%", top: "20%" } },
  { emoji: "🦋", sound: "Fır fır!", position: { left: "15%", top: "70%" } },
  { emoji: "🐝", sound: "Vızz vızz!", position: { left: "75%", top: "65%" } },
  { emoji: "🐛", sound: "Hışır hışır!", position: { left: "30%", top: "85%" } },
  { emoji: "🦗", sound: "Cırcır!", position: { left: "65%", top: "80%" } },
];

interface InteractiveAnimalsProps {
  pageNumber: number;
}

const InteractiveAnimals = ({ pageNumber }: InteractiveAnimalsProps) => {
  const [activeAnimal, setActiveAnimal] = useState<number | null>(null);
  const [clickedAnimals, setClickedAnimals] = useState<Set<number>>(new Set());

  // Sayfa numarasına göre farklı hayvanlar göster (rastgelelik için)
  const visibleAnimals = animals.filter((_, index) => 
    (pageNumber + index) % 3 !== 0
  ).slice(0, 4);

  const handleAnimalClick = (index: number) => {
    setActiveAnimal(index);
    setClickedAnimals(prev => new Set([...prev, index]));
    
    // 600ms sonra animasyonu kaldır
    setTimeout(() => {
      setActiveAnimal(null);
    }, 600);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {visibleAnimals.map((animal, index) => (
        <button
          key={index}
          onClick={() => handleAnimalClick(index)}
          className="absolute pointer-events-auto cursor-pointer transition-all duration-300 hover:scale-125 focus:outline-none group"
          style={{
            left: animal.position.left,
            top: animal.position.top,
            transform: activeAnimal === index ? "scale(1.5) rotate(15deg)" : "scale(1)",
          }}
          aria-label={`${animal.emoji} - ${animal.sound}`}
        >
          {/* Hayvan emojisi */}
          <span 
            className={`text-4xl md:text-5xl drop-shadow-lg transition-all duration-300 ${
              clickedAnimals.has(index) ? "animate-bounce" : ""
            }`}
          >
            {animal.emoji}
          </span>
          
          {/* Ses balonu - tıklandığında göster */}
          {activeAnimal === index && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-fade-in">
              <div className="bg-background/95 text-foreground px-4 py-2 rounded-full border-2 border-primary shadow-lg whitespace-nowrap text-sm font-bold">
                {animal.sound}
              </div>
              {/* Balon kuyrugu */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-background/95 border-r-2 border-b-2 border-primary" />
            </div>
          )}
          
          {/* Hover efekti - keşfet animasyonu */}
          <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-150 transition-all duration-300 -z-10" />
        </button>
      ))}
    </div>
  );
};

export default InteractiveAnimals;
