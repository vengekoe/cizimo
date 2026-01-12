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
import { 
  Loader2, Shield, Users, BarChart3, Crown, ArrowLeft, 
  Search, RefreshCw, UserCheck, UserX, RotateCcw, Book, Baby, Clock
} from "lucide-react";
import { format } from "date-fns";
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

  useEffect(() => {
    if (!isAdminLoading && !isAdmin && user) {
      navigate("/home");
    }
  }, [isAdmin, isAdminLoading, user, navigate]);

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
            <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              İstatistikler
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Kullanıcılar
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
                  <div className="overflow-x-auto">
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
                                value={u.tier}
                                onValueChange={(v) => handleUpdateTier(u.user_id, v as SubscriptionTier)}
                                disabled={updatingUser === u.user_id}
                              >
                                <SelectTrigger className="w-[140px] h-8">
                                  <SelectValue />
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
                                  {u.monthly_credits === -1 ? "∞" : `${u.used_credits}/${u.monthly_credits}`}
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
                                  {u.children_count}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Book className="w-3 h-3" />
                                  {u.books_count}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(u.total_reading_seconds)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(u.user_created_at), "d MMM yyyy", { locale: tr })}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
