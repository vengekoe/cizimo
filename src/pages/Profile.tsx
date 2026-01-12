import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Settings, Heart, LogOut, Save } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [favoriteAnimal, setFavoriteAnimal] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [favoriteToy, setFavoriteToy] = useState("");
  const [favoriteSuperhero, setFavoriteSuperhero] = useState("");
  const [favoriteCartoon, setFavoriteCartoon] = useState("");
  const [preferredModel, setPreferredModel] = useState("gemini-3-pro-preview");
  const [preferredLanguage, setPreferredLanguage] = useState("tr");
  const [preferredPageCount, setPreferredPageCount] = useState("10");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAge(profile.age?.toString() || "");
      setGender(profile.gender || "");
      setFavoriteColor(profile.favorite_color || "");
      setFavoriteAnimal(profile.favorite_animal || "");
      setFavoriteTeam(profile.favorite_team || "");
      setFavoriteToy(profile.favorite_toy || "");
      setFavoriteSuperhero(profile.favorite_superhero || "");
      setFavoriteCartoon(profile.favorite_cartoon || "");
      setPreferredModel(profile.preferred_ai_model || "gemini-3-pro-preview");
      setPreferredLanguage(profile.preferred_language || "tr");
      setPreferredPageCount(profile.preferred_page_count?.toString() || "10");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({
      display_name: displayName || null,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      favorite_color: favoriteColor || null,
      favorite_animal: favoriteAnimal || null,
      favorite_team: favoriteTeam || null,
      favorite_toy: favoriteToy || null,
      favorite_superhero: favoriteSuperhero || null,
      favorite_cartoon: favoriteCartoon || null,
      preferred_ai_model: preferredModel,
      preferred_language: preferredLanguage,
      preferred_page_count: parseInt(preferredPageCount),
    });
    setSaving(false);
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Profil
          </h1>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-1 text-xs sm:text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Bilgiler</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-1 text-xs sm:text-sm">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Favoriler</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 text-xs sm:text-sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Ayarlar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı Bilgileri</CardTitle>
                <CardDescription>
                  Profilinizi kişiselleştirin
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Yaş</Label>
                    <Input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Yaş"
                      min="1"
                      max="120"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Cinsiyet</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Erkek</SelectItem>
                        <SelectItem value="female">Kız</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Favoriler</CardTitle>
                <CardDescription>
                  Çocuğunuzun favorilerini ekleyin, hikayeler buna göre kişiselleştirilsin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="favoriteColor">🎨 En Sevdiği Renk</Label>
                    <Input
                      id="favoriteColor"
                      value={favoriteColor}
                      onChange={(e) => setFavoriteColor(e.target.value)}
                      placeholder="Mavi, Kırmızı..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favoriteAnimal">🐾 En Sevdiği Hayvan</Label>
                    <Input
                      id="favoriteAnimal"
                      value={favoriteAnimal}
                      onChange={(e) => setFavoriteAnimal(e.target.value)}
                      placeholder="Kedi, Köpek..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="favoriteTeam">⚽ En Sevdiği Takım</Label>
                    <Input
                      id="favoriteTeam"
                      value={favoriteTeam}
                      onChange={(e) => setFavoriteTeam(e.target.value)}
                      placeholder="Fenerbahçe, Galatasaray..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favoriteToy">🧸 En Sevdiği Oyuncak</Label>
                    <Input
                      id="favoriteToy"
                      value={favoriteToy}
                      onChange={(e) => setFavoriteToy(e.target.value)}
                      placeholder="Lego, Bebek..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="favoriteSuperhero">🦸 En Sevdiği Süper Kahraman</Label>
                    <Input
                      id="favoriteSuperhero"
                      value={favoriteSuperhero}
                      onChange={(e) => setFavoriteSuperhero(e.target.value)}
                      placeholder="Batman, Spiderman..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favoriteCartoon">📺 En Sevdiği Çizgi Film</Label>
                    <Input
                      id="favoriteCartoon"
                      value={favoriteCartoon}
                      onChange={(e) => setFavoriteCartoon(e.target.value)}
                      placeholder="Rafadan Tayfa, Peppa Pig..."
                    />
                  </div>
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
                  <Label htmlFor="preferredModel">🤖 AI Modeli</Label>
                  <Select value={preferredModel} onValueChange={setPreferredModel}>
                    <SelectTrigger id="preferredModel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-3-pro-preview">🤖 Gemini 3 Pro (Önerilen)</SelectItem>
                      <SelectItem value="gpt-5-mini">⚡ GPT-5 Mini</SelectItem>
                      <SelectItem value="gpt-5.1-mini-preview">✨ GPT-5.1 Mini Preview</SelectItem>
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
