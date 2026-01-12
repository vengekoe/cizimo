import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin, AdminUser } from "@/hooks/useAdmin";
import { TIER_NAMES, TIER_EMOJIS, SubscriptionTier } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, Shield, Users, BarChart3, Crown, 
  Search, RefreshCw, UserCheck, UserX, RotateCcw, Book, Baby, Clock,
  TrendingUp, Activity, Zap, AlertTriangle, CheckCircle2, Settings
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    isAdmin, 
    isAdminLoading, 
    users, 
    usersLoading, 
    statistics, 
    statsLoading,
    updateSubscription,
    toggleAdminRole,
    resetCredits,
    refetchUsers,
  } = useAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);


  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateTier = async (userId: string, tier: SubscriptionTier) => {
    setUpdatingUser(userId);
    await updateSubscription({ userId, tier });
    setUpdatingUser(null);
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    setUpdatingUser(userId);
    await toggleAdminRole({ userId, makeAdmin: !isCurrentlyAdmin });
    setUpdatingUser(null);
  };

  const handleResetCredits = async (userId: string) => {
    setUpdatingUser(userId);
    await resetCredits(userId);
    setUpdatingUser(null);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}s ${minutes}dk`;
    return `${minutes}dk`;
  };

  if (authLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Erişim Reddedildi</h2>
            <p className="text-muted-foreground mb-4">Bu sayfaya erişim yetkiniz yok.</p>
            <Button onClick={() => navigate("/home")}>Ana Sayfaya Dön</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Admin Paneli
              </h1>
              <p className="text-sm text-muted-foreground">Platform yönetimi ve istatistikler</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        </div>

        <Tabs defaultValue="stats" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">İstatistikler</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Kullanıcılar</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Aktivite</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Sistem</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : statistics ? (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{statistics.total_users}</p>
                          <p className="text-xs text-muted-foreground">Toplam Kullanıcı</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                          <Baby className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{statistics.total_children}</p>
                          <p className="text-xs text-muted-foreground">Çocuk Profili</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                          <Book className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{statistics.total_books}</p>
                          <p className="text-xs text-muted-foreground">Toplam Kitap</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900 rounded-lg">
                          <Clock className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{statistics.total_reading_hours}s</p>
                          <p className="text-xs text-muted-foreground">Okuma Süresi</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Bu Ay</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Yeni Kullanıcı</span>
                        <Badge variant="secondary">{statistics.new_users_this_month}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Oluşturulan Kitap</span>
                        <Badge variant="secondary">{statistics.books_this_month}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Okuma Oturumu</span>
                        <Badge variant="secondary">{statistics.total_reading_sessions}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Paket Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {statistics.users_by_tier && Object.entries(statistics.users_by_tier).map(([tier, count]) => (
                        <div key={tier} className="flex justify-between items-center">
                          <span className="flex items-center gap-2">
                            <span>{TIER_EMOJIS[tier as SubscriptionTier]}</span>
                            <span className="text-sm">{TIER_NAMES[tier as SubscriptionTier]?.split(" ").slice(1).join(" ")}</span>
                          </span>
                          <Badge>{count}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  İstatistik verisi bulunamadı
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Kullanıcı Yönetimi
                    </CardTitle>
                    <CardDescription>
                      Tüm kullanıcıları görüntüle ve yönet
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Kullanıcı ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => refetchUsers()}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kullanıcı</TableHead>
                          <TableHead>Paket</TableHead>
                          <TableHead>Kredi</TableHead>
                          <TableHead>İçerik</TableHead>
                          <TableHead>Kayıt</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.user_id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {u.is_admin && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                                <div>
                                  <p className="font-medium">{u.display_name || "İsimsiz"}</p>
                                  <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={u.tier || "minik_masal"}
                                onValueChange={(v) => handleUpdateTier(u.user_id, v as SubscriptionTier)}
                                disabled={updatingUser === u.user_id}
                              >
                                <SelectTrigger className="w-[140px] h-8">
                                  <SelectValue placeholder="Paket seçin">
                                    {u.tier ? `${TIER_EMOJIS[u.tier]} ${TIER_NAMES[u.tier]?.split(" ").slice(1).join(" ")}` : "Paket seçin"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="minik_masal">🐣 Minik Masal</SelectItem>
                                  <SelectItem value="masal_kesfifcisi">🐿️ Masal Keşifçisi</SelectItem>
                                  <SelectItem value="masal_kahramani">🦄 Masal Kahramanı</SelectItem>
                                  <SelectItem value="sonsuz_masal">🐉 Sonsuz Masal</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {u.monthly_credits === -1 ? "∞" : `${u.used_credits || 0}/${u.monthly_credits || 0}`}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleResetCredits(u.user_id)}
                                  disabled={updatingUser === u.user_id}
                                  title="Kredileri sıfırla"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Baby className="w-3 h-3" />
                                  {u.children_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Book className="w-3 h-3" />
                                  {u.books_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(u.total_reading_seconds || 0)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {u.user_created_at ? format(new Date(u.user_created_at), "d MMM yyyy", { locale: tr }) : "-"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant={u.is_admin ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => handleToggleAdmin(u.user_id, u.is_admin)}
                                disabled={updatingUser === u.user_id || u.user_id === user?.id}
                                title={u.is_admin ? "Admin yetkisini kaldır" : "Admin yap"}
                              >
                                {u.is_admin ? (
                                  <>
                                    <UserX className="w-3 h-3 mr-1" />
                                    Admin Kaldır
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Admin Yap
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {filteredUsers.map((u) => (
                      <Card key={u.user_id} className="overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                          {/* User Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {u.is_admin && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                              <div>
                                <p className="font-medium">{u.display_name || "İsimsiz"}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">{u.email}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {u.user_created_at ? format(new Date(u.user_created_at), "d MMM yy", { locale: tr }) : "-"}
                            </Badge>
                          </div>

                          {/* Stats Row */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Baby className="w-3 h-3" />
                              {u.children_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Book className="w-3 h-3" />
                              {u.books_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(u.total_reading_seconds || 0)}
                            </span>
                            <span className="flex items-center gap-1 ml-auto">
                              <Zap className="w-3 h-3" />
                              {u.monthly_credits === -1 ? "∞" : `${u.used_credits || 0}/${u.monthly_credits || 0}`}
                            </span>
                          </div>

                          {/* Actions Row */}
                          <div className="flex items-center gap-2">
                            <Select
                              value={u.tier || "minik_masal"}
                              onValueChange={(v) => handleUpdateTier(u.user_id, v as SubscriptionTier)}
                              disabled={updatingUser === u.user_id}
                            >
                              <SelectTrigger className="flex-1 h-9">
                                <SelectValue placeholder="Paket seçin">
                                  {u.tier ? `${TIER_EMOJIS[u.tier]} ${TIER_NAMES[u.tier]?.split(" ").slice(1).join(" ")}` : "Paket seçin"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minik_masal">🐣 Minik Masal</SelectItem>
                                <SelectItem value="masal_kesfifcisi">🐿️ Masal Keşifçisi</SelectItem>
                                <SelectItem value="masal_kahramani">🦄 Masal Kahramanı</SelectItem>
                                <SelectItem value="sonsuz_masal">🐉 Sonsuz Masal</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => handleResetCredits(u.user_id)}
                              disabled={updatingUser === u.user_id}
                              title="Kredileri sıfırla"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>

                            <Button
                              variant={u.is_admin ? "destructive" : "outline"}
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => handleToggleAdmin(u.user_id, u.is_admin)}
                              disabled={updatingUser === u.user_id || u.user_id === user?.id}
                              title={u.is_admin ? "Admin yetkisini kaldır" : "Admin yap"}
                            >
                              {u.is_admin ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Son Aktiviteler
                </CardTitle>
                <CardDescription>
                  Platformdaki son kullanıcı hareketleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Recent Signups */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Son Kayıt Olan Kullanıcılar
                      </h3>
                      <div className="space-y-2">
                        {users
                          .sort((a, b) => new Date(b.user_created_at).getTime() - new Date(a.user_created_at).getTime())
                          .slice(0, 5)
                          .map((u) => (
                            <div key={u.user_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{u.display_name || u.email}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(u.user_created_at), { addSuffix: true, locale: tr })}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline">
                                {TIER_EMOJIS[u.tier]} {TIER_NAMES[u.tier]?.split(" ").slice(1).join(" ")}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Most Active Users */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        En Aktif Kullanıcılar
                      </h3>
                      <div className="space-y-2">
                        {users
                          .sort((a, b) => b.total_reading_seconds - a.total_reading_seconds)
                          .slice(0, 5)
                          .map((u, index) => (
                            <div key={u.user_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                  index === 0 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600' :
                                  index === 1 ? 'bg-gray-100 dark:bg-gray-800 text-gray-600' :
                                  index === 2 ? 'bg-orange-100 dark:bg-orange-900 text-orange-600' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{u.display_name || u.email}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {u.books_count} kitap • {u.children_count} çocuk
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">{formatDuration(u.total_reading_seconds)}</p>
                                <p className="text-xs text-muted-foreground">okuma süresi</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Users with Most Books */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Book className="w-4 h-4 text-blue-500" />
                        En Çok Kitap Oluşturanlar
                      </h3>
                      <div className="space-y-2">
                        {users
                          .sort((a, b) => b.books_count - a.books_count)
                          .slice(0, 5)
                          .map((u) => (
                            <div key={u.user_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <Book className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{u.display_name || u.email}</p>
                                  <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                {u.books_count} kitap
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="space-y-4">
              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Sistem Durumu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Veritabanı</span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-500">Çalışıyor</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">API Servisleri</span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-500">Çalışıyor</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Dosya Depolama</span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-500">Çalışıyor</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Platform Kullanımı
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statistics && (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Toplam Kullanıcı Kapasitesi</span>
                          <span className="font-medium">{statistics.total_users} / ∞</span>
                        </div>
                        <Progress value={Math.min((statistics.total_users / 1000) * 100, 100)} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Bu Ay Oluşturulan Kitaplar</span>
                          <span className="font-medium">{statistics.books_this_month}</span>
                        </div>
                        <Progress value={Math.min((statistics.books_this_month / 100) * 100, 100)} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Aktif Okuma Oturumları</span>
                          <span className="font-medium">{statistics.total_reading_sessions}</span>
                        </div>
                        <Progress value={Math.min((statistics.total_reading_sessions / 500) * 100, 100)} className="h-2" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Hızlı İşlemler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => refetchUsers()}>
                      <RefreshCw className="w-5 h-5" />
                      <span className="text-xs">Verileri Yenile</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/home")}>
                      <Book className="w-5 h-5" />
                      <span className="text-xs">Ana Sayfa</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/profile")}>
                      <Users className="w-5 h-5" />
                      <span className="text-xs">Profil</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => window.location.reload()}>
                      <Activity className="w-5 h-5" />
                      <span className="text-xs">Sayfayı Yenile</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Info */}
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Admin olarak giriş yaptınız. </span>
                  Tüm kullanıcı verilerine ve sistem ayarlarına erişiminiz var. 
                  Lütfen değişiklik yaparken dikkatli olun.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Admin;
