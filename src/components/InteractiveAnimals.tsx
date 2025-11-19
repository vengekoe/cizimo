import { useState } from "react";

interface Animal {
  emoji: string;
  sound: string;
  position: { left: string; top: string };
}

// Gerçek hayvan seslerini çal
const playAnimalSound = (soundFile: string) => {
  const audio = new Audio(soundFile);
  audio.volume = 0.5;
  audio.play().catch(err => console.log("Ses çalma hatası:", err));
};

const animals: Animal[] = [
  { emoji: "🐦", sound: "Cik cik!", position: { left: "10%", top: "15%" } },
  { emoji: "🐸", sound: "Vrak vrak!", position: { left: "85%", top: "20%" } },
  { emoji: "🦋", sound: "Fır fır!", position: { left: "15%", top: "60%" } },
  { emoji: "🐝", sound: "Vızz vızz!", position: { left: "75%", top: "55%" } },
  { emoji: "🐛", sound: "Hışır hışır!", position: { left: "30%", top: "75%" } },
  { emoji: "🦗", sound: "Cırcır!", position: { left: "60%", top: "70%" } },
];

// Her hayvan için gerçek ses dosyası
const animalSoundFiles: Record<string, string> = {
  "🐦": "/sounds/bird.mp3",
  "🐸": "/sounds/frog.mp3",
  "🦋": "/sounds/bird.mp3", // Kelebek için kuş sesi
  "🐝": "/sounds/bee.mp3",
  "🐛": "/sounds/cricket.mp3", // Tırtıl için böcek sesi
  "🦗": "/sounds/cricket.mp3",
};


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

  const handleAnimalClick = (index: number, animal: Animal) => {
    setActiveAnimal(index);
    setClickedAnimals(prev => new Set([...prev, index]));
    
    // Gerçek hayvan sesini çal
    const soundFile = animalSoundFiles[animal.emoji];
    if (soundFile) {
      playAnimalSound(soundFile);
    }
    
    // 600ms sonra animasyonu kaldır
    setTimeout(() => {
      setActiveAnimal(null);
    }, 600);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {visibleAnimals.map((animal, index) => (
        <button
          key={index}
          onClick={() => handleAnimalClick(index, animal)}
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
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-fade-in z-[60]">
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
