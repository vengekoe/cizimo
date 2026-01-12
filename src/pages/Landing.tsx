import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Wand2, Heart, Star, Palette, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import DemoStoryPlayer from "@/components/DemoStoryPlayer";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Çizimden Hikaye",
      description: "Çocuğunuzun çizimleri sihirli hikayelere dönüşsün!",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: <Wand2 className="w-8 h-8" />,
      title: "Yapay Zeka Büyüsü",
      description: "Her hikaye benzersiz ve kişiselleştirilmiş",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Güvenli İçerik",
      description: "Çocuklara uygun, eğitici ve eğlenceli",
      gradient: "from-rose-500 to-orange-500",
    },
  ];

  const steps = [
    { emoji: "🎨", text: "Çizim yükle veya tema seç" },
    { emoji: "✨", text: "Yapay zeka hikayeyi oluştursun" },
    { emoji: "📖", text: "Birlikte okuyun ve eğlenin!" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 overflow-hidden">
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-6xl animate-bounce-slow opacity-50">🌟</div>
        <div className="absolute top-40 right-20 text-5xl animate-bounce-slow delay-300 opacity-50">🎈</div>
        <div className="absolute bottom-40 left-20 text-5xl animate-bounce-slow delay-500 opacity-50">🦋</div>
        <div className="absolute bottom-20 right-10 text-6xl animate-bounce-slow delay-700 opacity-50">🌈</div>
        <div className="absolute top-1/3 left-1/4 text-4xl animate-float opacity-30">✨</div>
        <div className="absolute top-1/2 right-1/3 text-4xl animate-float delay-500 opacity-30">⭐</div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📚</span>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Çizimo
            </span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/auth')}
            className="rounded-full"
          >
            Giriş Yap
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-8 pb-16 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Yapay zeka destekli hikaye oluşturucu
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Çocuğunuzun Hayal Gücü
            </span>
            <br />
            <span className="text-foreground">Hikayelere Dönüşsün! ✨</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Çizimlerden, temalardan veya kendi fikirlerinizden benzersiz hikaye kitapları oluşturun. 
            Her gece yatmadan önce yeni bir macera!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Sparkles className="mr-2 w-5 h-5" />
              Ücretsiz Başla
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground">
              Kredi kartı gerektirmez • Hemen başlayın
            </p>
          </div>
        </div>

        {/* Demo books showcase */}
        <div className="mt-12 flex justify-center items-end gap-4 perspective-1000">
          {["🚀", "🦄", "🐉", "🌊", "🏰"].map((emoji, i) => (
            <div
              key={i}
              className={`bg-card rounded-2xl shadow-xl p-4 transform transition-all hover:scale-110 hover:-translate-y-2 ${
                i === 2 ? "scale-110 -translate-y-4" : ""
              }`}
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div className="text-4xl sm:text-5xl">{emoji}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Story Section */}
      <section className="relative z-10 py-16 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Örnek Hikaye 📖
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              İşte yapay zeka ile oluşturulmuş bir hikaye örneği! 
              Her hikaye benzersiz ve çocuğunuza özel.
            </p>
          </div>
          
          <DemoStoryPlayer />
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 bg-card/50 backdrop-blur-sm py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Nasıl Çalışır? 🎯
          </h2>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl mb-4 shadow-lg">
                  {step.emoji}
                </div>
                <p className="font-medium text-lg">{step.text}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
          Neden Çizimo? 💫
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-card rounded-3xl p-6 border border-border hover:border-primary/50 transition-all hover:shadow-xl group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial / Social Proof */}
      <section className="relative z-10 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <blockquote className="text-xl sm:text-2xl font-medium max-w-3xl mx-auto mb-6">
            "Kızım her gece kendi çizdiği resimlerin hikayeye dönüşmesini bekliyor. 
            Hayal gücü inanılmaz gelişti!"
          </blockquote>
          <p className="text-muted-foreground">— Mutlu Anne, İstanbul</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-br from-primary to-accent rounded-3xl p-8 sm:p-12 text-white max-w-3xl mx-auto shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Hemen Hikaye Oluşturmaya Başlayın! 🚀
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Çocuğunuzla birlikte sihirli dünyalara yolculuk edin
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6 rounded-full hover:scale-105 transition-all"
            >
              <BookOpen className="mr-2 w-5 h-5" />
              Kayıt Ol
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6 rounded-full bg-white/10 border-white/30 hover:bg-white/20 text-white hover:scale-105 transition-all"
            >
              Giriş Yap
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>for kids & parents</span>
          </p>
          <p className="text-sm mt-2">© 2025 Çizimo. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
