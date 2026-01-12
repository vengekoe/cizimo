import { useState } from "react";
import { ChildData } from "@/hooks/useChildren";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Trash2, Save, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChildCardProps {
  child: ChildData;
  onUpdate: (childId: string, updates: Partial<ChildData>) => Promise<boolean>;
  onDelete: (childId: string) => Promise<boolean>;
}

const EMOJI_OPTIONS = ["👶", "👧", "👦", "🧒", "👸", "🤴", "🦸", "🧚", "🐰", "🦊", "🐻", "🦁"];

export const ChildCard = ({ child, onUpdate, onDelete }: ChildCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [name, setName] = useState(child.name);
  const [age, setAge] = useState(child.age?.toString() || "");
  const [gender, setGender] = useState(child.gender || "");
  const [avatarEmoji, setAvatarEmoji] = useState(child.avatar_emoji || "👶");
  const [favoriteColor, setFavoriteColor] = useState(child.favorite_color || "");
  const [favoriteAnimal, setFavoriteAnimal] = useState(child.favorite_animal || "");
  const [favoriteTeam, setFavoriteTeam] = useState(child.favorite_team || "");
  const [favoriteToy, setFavoriteToy] = useState(child.favorite_toy || "");
  const [favoriteSuperhero, setFavoriteSuperhero] = useState(child.favorite_superhero || "");
  const [favoriteCartoon, setFavoriteCartoon] = useState(child.favorite_cartoon || "");

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(child.id, {
      name,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      avatar_emoji: avatarEmoji,
      favorite_color: favoriteColor || null,
      favorite_animal: favoriteAnimal || null,
      favorite_team: favoriteTeam || null,
      favorite_toy: favoriteToy || null,
      favorite_superhero: favoriteSuperhero || null,
      favorite_cartoon: favoriteCartoon || null,
    });
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(child.id);
    setDeleting(false);
  };

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{avatarEmoji}</span>
                <div>
                  <CardTitle className="text-lg">{child.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {child.age ? `${child.age} yaş` : "Yaş belirtilmedi"}
                    {child.gender && ` • ${child.gender === "male" ? "Erkek" : child.gender === "female" ? "Kız" : child.gender}`}
                  </p>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`name-${child.id}`}>İsim</Label>
                <Input
                  id={`name-${child.id}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Çocuğun ismi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`emoji-${child.id}`}>Avatar</Label>
                <Select value={avatarEmoji} onValueChange={setAvatarEmoji}>
                  <SelectTrigger id={`emoji-${child.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMOJI_OPTIONS.map((emoji) => (
                      <SelectItem key={emoji} value={emoji}>
                        <span className="text-xl">{emoji}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`age-${child.id}`}>Yaş</Label>
                <Input
                  id={`age-${child.id}`}
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Yaş"
                  min="1"
                  max="18"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`gender-${child.id}`}>Cinsiyet</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id={`gender-${child.id}`}>
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

            {/* Favorites */}
            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-3">Favoriler</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`color-${child.id}`}>🎨 Renk</Label>
                  <Input
                    id={`color-${child.id}`}
                    value={favoriteColor}
                    onChange={(e) => setFavoriteColor(e.target.value)}
                    placeholder="Mavi..."
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`animal-${child.id}`}>🐾 Hayvan</Label>
                  <Input
                    id={`animal-${child.id}`}
                    value={favoriteAnimal}
                    onChange={(e) => setFavoriteAnimal(e.target.value)}
                    placeholder="Kedi..."
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`team-${child.id}`}>⚽ Takım</Label>
                  <Input
                    id={`team-${child.id}`}
                    value={favoriteTeam}
                    onChange={(e) => setFavoriteTeam(e.target.value)}
                    placeholder="Fenerbahçe..."
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`toy-${child.id}`}>🧸 Oyuncak</Label>
                  <Input
                    id={`toy-${child.id}`}
                    value={favoriteToy}
                    onChange={(e) => setFavoriteToy(e.target.value)}
                    placeholder="Lego..."
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`hero-${child.id}`}>🦸 Süper Kahraman</Label>
                  <Input
                    id={`hero-${child.id}`}
                    value={favoriteSuperhero}
                    onChange={(e) => setFavoriteSuperhero(e.target.value)}
                    placeholder="Batman..."
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`cartoon-${child.id}`}>📺 Çizgi Film</Label>
                  <Input
                    id={`cartoon-${child.id}`}
                    value={favoriteCartoon}
                    onChange={(e) => setFavoriteCartoon(e.target.value)}
                    placeholder="Peppa Pig..."
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex-1"
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
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" disabled={deleting}>
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Çocuğu silmek istediğinize emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu işlem geri alınamaz. {child.name} ve tüm bilgileri silinecektir.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
