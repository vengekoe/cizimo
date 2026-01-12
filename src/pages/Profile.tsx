import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useChildren } from "@/hooks/useChildren";
import { useReadingStats } from "@/hooks/useReadingStats";
import { useSubscription, TIER_NAMES } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, User, Settings, Baby, LogOut, Save, Plus, BarChart3, Crown, Sparkles, Lock, Shield } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { ChildCard } from "@/components/ChildCard";
import { ChildStatsCard } from "@/components/ChildStatsCard";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { CreditDisplay } from "@/components/subscription/CreditDisplay";

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { children, loading: childrenLoading, addChild, updateChild, deleteChild, maxChildren, canAddChild, getRemainingChildSlots } = useChildren();
  const { stats, loading: statsLoading, formatDuration } = useReadingStats();
  const { subscription, isAdmin, hasFeature } = useSubscription();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [addingChild, setAddingChild] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [preferredModel, setPreferredModel] = useState("gemini-3-pro-preview");
  const [preferredImageModel, setPreferredImageModel] = useState("dall-e-3");
  const [preferredLanguage, setPreferredLanguage] = useState("tr");
  const [preferredPageCount, setPreferredPageCount] = useState("10");

  // New child form
  const [newChildName, setNewChildName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setPreferredModel(profile.preferred_ai_model || "gemini-3-pro-preview");
      setPreferredImageModel(profile.preferred_image_model || "dall-e-3");
      setPreferredLanguage(profile.preferred_language || "tr");
      setPreferredPageCount(profile.preferred_page_count?.toString() || "10");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({
      display_name: displayName || null,
      preferred_ai_model: preferredModel,
      preferred_image_model: preferredImageModel,
      preferred_language: preferredLanguage,
      preferred_page_count: parseInt(preferredPageCount),
    });
    setSaving(false);
  };

  const handleAddChild = async () => {
    if (!newChildName.trim()) return;
    
    setAddingChild(true);
    await addChild({ name: newChildName.trim() });
    setNewChildName("");
    setAddingChild(false);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              Profil
            </h1>
            <SubscriptionBadge />
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>

        <Tabs defaultValue="children" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="children" className="flex items-center gap-1 text-xs sm:text-sm">
              <Baby className="w-4 h-4" />
              <span className="hidden sm:inline">Çocuklar</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-1 text-xs sm:text-sm">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Paket</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">İstatistik</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1 text-xs sm:text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Hesap</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 text-xs sm:text-sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Ayarlar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="children">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="w-5 h-5" />
                  Çocuklarım
                </CardTitle>
                <CardDescription>
                  Her çocuk için ayrı profil ve kişiselleştirilmiş hikayeler oluşturun
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Child limit indicator */}
                {!isAdmin && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Çocuk Profilleri</span>
                      <span className="text-sm">
                        <span className="font-bold text-primary">{children.length}</span>
                        <span className="text-muted-foreground"> / {maxChildren}</span>
                      </span>
                    </div>
                    <Progress value={(children.length / maxChildren) * 100} className="h-2" />
                    {!canAddChild() && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Profil limitine ulaştınız. Daha fazla çocuk eklemek için paketinizi yükseltin.
                      </p>
                    )}
                  </div>
                )}

                {/* Add child form */}
                <div className="flex gap-2">
                  <Input
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    placeholder="Çocuğun adı..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddChild()}
                    disabled={!canAddChild()}
                  />
                  <Button 
                    onClick={handleAddChild} 
                    disabled={addingChild || !newChildName.trim() || !canAddChild()}
                  >
                    {addingChild ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : !canAddChild() ? (
                      <>
                        <Lock className="w-4 h-4 mr-1" />
                        Limit
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Ekle
                      </>
                    )}
                  </Button>
                </div>

                {!canAddChild() && (
                  <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                      <span className="font-medium">Daha fazla çocuk profili eklemek için </span>
                      paketinizi yükseltin. Mevcut paketiniz {maxChildren} çocuk profiline izin veriyor.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {childrenLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : children.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Baby className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz çocuk eklenmedi</p>
                  <p className="text-sm">Yukarıdan çocuk ekleyerek başlayın</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {children.map((child) => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    onUpdate={updateChild}
                    onDelete={deleteChild}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Abonelik Paketim
                </CardTitle>
                <CardDescription>
                  {subscription ? (
                    <>Mevcut paketiniz: <strong>{TIER_NAMES[subscription.tier]}</strong></>
                  ) : (
                    "Paket bilgilerinizi görüntüleyin"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreditDisplay />
              </CardContent>
            </Card>

            <SubscriptionPlans />
          </TabsContent>

          <TabsContent value="stats">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Okuma İstatistikleri
                </CardTitle>
                <CardDescription>
                  Her çocuğun okuma performansını takip edin
                </CardDescription>
              </CardHeader>
            </Card>

            {statsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : stats.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz okuma verisi yok</p>
                  <p className="text-sm">Kitap okumaya başladığınızda istatistikler burada görünecek</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {stats.map((stat) => (
                  <ChildStatsCard
                    key={stat.child_id}
                    stats={stat}
                    formatDuration={formatDuration}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Hesap Bilgileri</CardTitle>
                <CardDescription>
                  Kendi profilinizi düzenleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Görünen İsim</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="İsminizi girin"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>AI Ayarları</CardTitle>
                <CardDescription>
                  Varsayılan hikaye oluşturma ayarlarınızı belirleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredModel">🤖 Hikaye AI Modeli</Label>
                  <Select value={preferredModel} onValueChange={setPreferredModel}>
                    <SelectTrigger id="preferredModel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-3-pro-preview">
                        <div className="flex flex-col">
                          <span>🤖 Google Gemini 3 Pro Preview</span>
                          <span className="text-xs text-muted-foreground">Önerilen - Yeni nesil, güçlü hikaye anlatımı</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gpt-5-mini">
                        <div className="flex flex-col">
                          <span>⚡ OpenAI GPT-5 Mini</span>
                          <span className="text-xs text-muted-foreground">Hızlı ve verimli, kaliteli hikayeler</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gpt-5.1-mini-preview">
                        <div className="flex flex-col">
                          <span>✨ OpenAI GPT-5.1 Mini Preview</span>
                          <span className="text-xs text-muted-foreground">En yeni - Gelişmiş akıl yürütme</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredImageModel">🎨 Görsel AI Modeli</Label>
                  <Select value={preferredImageModel} onValueChange={setPreferredImageModel}>
                    <SelectTrigger id="preferredImageModel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dall-e-3">
                        <div className="flex flex-col">
                          <span>🎨 OpenAI DALL-E 3</span>
                          <span className="text-xs text-muted-foreground">Önerilen - Yüksek kalite, detaylı çocuk kitabı görselleri</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gpt-image-1">
                        <div className="flex flex-col">
                          <span>✨ OpenAI GPT Image 1</span>
                          <span className="text-xs text-muted-foreground">En yeni OpenAI - Organizasyon doğrulaması gerekli</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gemini-2.5-flash-image">
                        <div className="flex flex-col">
                          <span>⚡ Google Gemini 2.5 Flash Image</span>
                          <span className="text-xs text-muted-foreground">Hızlı - Bölge kısıtlaması olabilir</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gemini-3-pro-image">
                        <div className="flex flex-col">
                          <span>🌟 Google Gemini 3 Pro Image</span>
                          <span className="text-xs text-muted-foreground">Yeni nesil - Bölge kısıtlaması olabilir</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredLanguage">🌍 Hikaye Dili</Label>
                  <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                    <SelectTrigger id="preferredLanguage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredPageCount">📄 Varsayılan Sayfa Sayısı</Label>
                  <Select value={preferredPageCount} onValueChange={setPreferredPageCount}>
                    <SelectTrigger id="preferredPageCount">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Sayfa</SelectItem>
                      <SelectItem value="10">10 Sayfa</SelectItem>
                      <SelectItem value="15">15 Sayfa</SelectItem>
                      <SelectItem value="20">20 Sayfa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full mt-6"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </>
          )}
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
