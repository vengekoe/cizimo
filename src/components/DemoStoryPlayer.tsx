import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

import forestBg from "@/assets/demo-story/page-1-forest.jpg";
import butterflyBg from "@/assets/demo-story/page-2-butterfly.jpg";
import starsBg from "@/assets/demo-story/page-3-stars.jpg";
import homeBg from "@/assets/demo-story/page-4-home.jpg";

interface StoryPage {
  emoji: string;
  title: string;
  text: string;
  bgImage: string;
  character: string;
}

const demoStory: StoryPage[] = [
  {
    emoji: "🌈",
    title: "Gökkuşağı Ormanı",
    text: "Bir varmış bir yokmuş, rengarenk bir ormanın derinliklerinde küçük bir tavşan yaşarmış...",
    bgImage: forestBg,
    character: "🐰",
  },
  {
    emoji: "🦋",
    title: "Kelebek Arkadaş",
    text: "Bir gün tavşan, parlak kanatları olan bir kelebekle tanışmış. Kelebek ona sihirli bir sır fısıldamış...",
    bgImage: butterflyBg,
    character: "🦋",
  },
  {
    emoji: "⭐",
    title: "Yıldız Tozu",
    text: "Birlikte gökyüzüne uçmuşlar ve yıldız tozu toplamışlar. Her toz tanesi bir dilek gerçekleştiriyormuş!",
    bgImage: starsBg,
    character: "✨",
  },
  {
    emoji: "🏠",
    title: "Eve Dönüş",
    text: "Macera bittikten sonra tavşan evine dönmüş. Artık en iyi arkadaşı vardı ve her gün yeni maceralar yaşayacaklardı!",
    bgImage: homeBg,
    character: "🐰",
  },
];

const DemoStoryPlayer = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage((prev) => (prev + 1) % demoStory.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const goToPage = (direction: "prev" | "next") => {
    setIsAnimating(true);
    setTimeout(() => {
      if (direction === "prev") {
        setCurrentPage((prev) => (prev - 1 + demoStory.length) % demoStory.length);
      } else {
        setCurrentPage((prev) => (prev + 1) % demoStory.length);
      }
      setIsAnimating(false);
    }, 300);
  };

  const page = demoStory[currentPage];

  return (
    <div className="relative max-w-lg mx-auto">
      {/* Book container */}
      <div className="relative perspective-1000">
        {/* Book shadow */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/20 blur-xl rounded-full" />
        
        {/* Book */}
        <div
          className={`relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${
            isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
          style={{ aspectRatio: "3/4" }}
        >
          {/* Background Image */}
          <img
            src={page.bgImage}
            alt={page.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
          {/* Page content */}
          <div className="absolute inset-0 flex flex-col p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">{page.emoji}</span>
              <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                {currentPage + 1} / {demoStory.length}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 drop-shadow-lg">
              {page.title}
            </h3>

            {/* Character animation */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-7xl sm:text-8xl animate-bounce-slow drop-shadow-2xl">
                {page.character}
              </div>
            </div>

            {/* Text */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <p className="text-foreground text-sm sm:text-base leading-relaxed">
                {page.text}
              </p>
            </div>

            {/* Floating elements */}
            <div className="absolute top-1/4 right-4 text-2xl animate-float opacity-60">✨</div>
            <div className="absolute top-1/3 left-4 text-xl animate-float delay-300 opacity-60">⭐</div>
            <div className="absolute bottom-1/3 right-8 text-2xl animate-float delay-500 opacity-60">🌟</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10"
          onClick={() => goToPage("prev")}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10"
          onClick={() => goToPage("next")}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Page indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {demoStory.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setIsAnimating(true);
              setTimeout(() => {
                setCurrentPage(i);
                setIsAnimating(false);
              }, 300);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentPage
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        🎬 Otomatik oynatılan örnek hikaye
      </p>
    </div>
  );
};

export default DemoStoryPlayer;
