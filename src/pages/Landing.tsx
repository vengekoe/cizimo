import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Wand2, Heart, Star, Palette, ArrowRight, Menu, X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import DemoStoryPlayer from "@/components/DemoStoryPlayer";
import { useSubscription, TIER_NAMES, TIER_EMOJIS, SubscriptionTier } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { allFeatures } = useSubscription();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navItems = [
    { label: "Özellikler", href: "#features" },
    { label: "Nasıl Çalışır", href: "#how-it-works" },
    { label: "Örnek Hikaye", href: "#demo" },
    { label: "Paketler", href: "#pricing" },
  ];

  const scrollToSection = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Feature comparison data
  const featureLabels: Record<string, string> = {
    basic_personalization: "Temel kişiselleştirme",
    advanced_personalization: "Gelişmiş kişiselleştirme",
    cover_design_selection: "Kapak tasarımı seçimi",
    friend_sharing: "Arkadaşla paylaşma",
    unlimited_friend_sharing: "Sınırsız paylaşım",
    basic_stats: "Basit istatistik",
    detailed_stats: "Detaylı istatistik",
    advanced_stats: "Gelişmiş istatistik",
    photo_story: "Fotoğraftan hikaye",
    audio_story: "Sesli hikaye",
    font_selection: "Yazı tipi seçimi",
    unlimited_revision: "Sınırsız revizyon",
    favorite_pages: "Favori sayfalar",
    custom_illustration: "Özel illüstrasyon",
    weekly_themes: "Haftalık temalar",
    family_sharing: "Aile paylaşımı",
    print_ready: "Baskıya hazır",
    library_backup: "Kütüphane yedekleme",
  };

  const comparisonFeatures = [
    "basic_personalization",
    "advanced_personalization",
    "photo_story",
    "audio_story",
    "unlimited_revision",
    "custom_illustration",
    "family_sharing",
    "print_ready",
  ];

  const tierOrder: SubscriptionTier[] = ["minik_masal", "masal_kesfifcisi", "masal_kahramani", "sonsuz_masal"];

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

      {/* Header with Navigation */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">📚</span>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Çizimo
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <Button 
                  onClick={() => navigate('/home')}
                  className="rounded-full bg-gradient-to-r from-primary to-accent"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Kütüphanem
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/auth')}
                    className="rounded-full hidden sm:flex"
                  >
                    Giriş Yap
                  </Button>
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="rounded-full bg-gradient-to-r from-primary to-accent"
                  >
                    Başla
                  </Button>
                </>
              )}
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-border mt-4">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => scrollToSection(item.href)}
                    className="text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                {user ? (
                  <Button 
                    onClick={() => navigate('/home')}
                    className="mt-2"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Kütüphanem
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/auth')}
                    className="mt-2"
                  >
                    Giriş Yap
                  </Button>
                )}
              </div>
            </nav>
          )}
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
      <section id="demo" className="relative z-10 py-16 bg-gradient-to-b from-transparent via-primary/5 to-transparent scroll-mt-20">
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
      <section id="how-it-works" className="relative z-10 bg-card/50 backdrop-blur-sm py-16 scroll-mt-20">
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
      <section id="features" className="relative z-10 container mx-auto px-4 py-16 scroll-mt-20">
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

      {/* Pricing / Package Comparison */}
      <section id="pricing" className="relative z-10 py-16 bg-gradient-to-b from-transparent via-accent/5 to-transparent scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Paketler & Fiyatlandırma 💎
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              İhtiyacınıza uygun paketi seçin. Her zaman yükseltebilir veya düşürebilirsiniz.
            </p>
          </div>

          {/* Package Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {allFeatures?.map((plan) => {
              const isPremium = plan.tier === "sonsuz_masal";
              return (
                <div 
                  key={plan.tier}
                  className={cn(
                    "bg-card rounded-2xl p-6 border",
                    isPremium && "border-primary bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-950/50 dark:to-pink-950/50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{TIER_EMOJIS[plan.tier]}</span>
                    <div>
                      <h3 className="font-bold">{TIER_NAMES[plan.tier].split(" ").slice(1).join(" ")}</h3>
                      <p className="text-2xl font-bold">{plan.price_tl} <span className="text-sm font-normal text-muted-foreground">TL/ay</span></p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>{plan.unlimited_stories ? "Sınırsız hikaye" : `${plan.monthly_credits} hikaye/ay`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>{plan.unlimited_pages ? "Sınırsız sayfa" : `Max ${plan.max_pages} sayfa`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>{plan.max_children} çocuk profili</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant={isPremium ? "default" : "outline"}
                    onClick={() => navigate('/auth')}
                  >
                    Başla
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Comparison Table - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full bg-card rounded-2xl overflow-hidden border">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground">Özellik</th>
                  {allFeatures?.map((plan) => (
                    <th key={plan.tier} className={cn(
                      "p-4 text-center",
                      plan.tier === "sonsuz_masal" && "bg-gradient-to-b from-violet-50 to-transparent dark:from-violet-950/50"
                    )}>
                      <div className="text-2xl mb-1">{TIER_EMOJIS[plan.tier]}</div>
                      <div className="font-bold text-sm">{TIER_NAMES[plan.tier].split(" ").slice(1).join(" ")}</div>
                      <div className="text-xl font-bold mt-1">{plan.price_tl} <span className="text-xs font-normal text-muted-foreground">TL/ay</span></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Core limits */}
                <tr className="border-b bg-muted/30">
                  <td className="p-4 font-medium">Aylık Hikaye</td>
                  {allFeatures?.map((plan) => (
                    <td key={plan.tier} className="p-4 text-center">
                      {plan.unlimited_stories ? (
                        <span className="text-primary font-bold">Sınırsız</span>
                      ) : (
                        <span>{plan.monthly_credits}</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Maksimum Sayfa</td>
                  {allFeatures?.map((plan) => (
                    <td key={plan.tier} className="p-4 text-center">
                      {plan.unlimited_pages ? (
                        <span className="text-primary font-bold">Sınırsız</span>
                      ) : (
                        <span>{plan.max_pages}</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b bg-muted/30">
                  <td className="p-4 font-medium">Çocuk Profili</td>
                  {allFeatures?.map((plan) => (
                    <td key={plan.tier} className="p-4 text-center">{plan.max_children}</td>
                  ))}
                </tr>

                {/* Feature comparison */}
                {comparisonFeatures.map((featureKey, idx) => (
                  <tr key={featureKey} className={cn("border-b", idx % 2 === 0 && "bg-muted/30")}>
                    <td className="p-4 font-medium">{featureLabels[featureKey]}</td>
                    {allFeatures?.map((plan) => {
                      const hasFeature = plan[featureKey as keyof typeof plan] === true;
                      return (
                        <td key={plan.tier} className="p-4 text-center">
                          {hasFeature ? (
                            <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* CTA row */}
                <tr>
                  <td className="p-4"></td>
                  {allFeatures?.map((plan) => (
                    <td key={plan.tier} className="p-4 text-center">
                      <Button 
                        variant={plan.tier === "sonsuz_masal" ? "default" : "outline"}
                        onClick={() => navigate('/auth')}
                        className={cn(
                          "w-full",
                          plan.tier === "sonsuz_masal" && "bg-gradient-to-r from-primary to-accent"
                        )}
                      >
                        Başla
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
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
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Çizimo
              </span>
            </div>
            <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> for kids
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">© 2025 Çizimo. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
