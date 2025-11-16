export interface BookPage {
  character: string;
  emoji: string;
  title: string;
  description: string;
  sound: string;
  backgroundImage?: string;
}

export interface Book {
  id: string;
  title: string;
  theme: string;
  coverEmoji: string;
  coverImage?: string; // Orijinal yüklenen çizim
  pages: BookPage[];
}

export const defaultBooks: Book[] = [
  {
    id: "orman-arkadaslari",
    title: "Orman Arkadaşları",
    theme: "Orman hayvanları ve dostluk",
    coverEmoji: "🌲",
    pages: [
      {
        character: "Ayı",
        emoji: "🐻",
        title: "Merhaba! Ben Ayı!",
        description: "Ormanda yaşıyorum ve yeni arkadaşlar arıyorum!",
        sound: "Hav hav!"
      },
      {
        character: "Tavşan",
        emoji: "🐰",
        title: "Merhaba! Ben Tavşan!",
        description: "Çayırlarda hoplayıp zıplamayı çok severim!",
        sound: "Hop hop!"
      },
      {
        character: "Baykuş",
        emoji: "🦉",
        title: "Merhaba! Ben Baykuş!",
        description: "Geceleri yıldızları izlemeyi seviyorum!",
        sound: "Huu huu!"
      },
      {
        character: "Hepimiz",
        emoji: "🎈",
        title: "Hepimiz Arkadaşız!",
        description: "Birlikte eğlenmeye ne dersin?",
        sound: "Yaşasın!"
      }
    ]
  }
];
