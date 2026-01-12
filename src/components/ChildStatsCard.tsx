import { ChildReadingStats } from "@/hooks/useReadingStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, FileText, TrendingUp } from "lucide-react";

interface ChildStatsCardProps {
  stats: ChildReadingStats;
  formatDuration: (seconds: number) => string;
}

export const ChildStatsCard = ({ stats, formatDuration }: ChildStatsCardProps) => {
  const avgPagesPerSession = stats.total_sessions > 0 
    ? Math.round(stats.total_pages_read / stats.total_sessions) 
    : 0;

  const avgSessionDuration = stats.total_sessions > 0 
    ? Math.round(stats.total_reading_seconds / stats.total_sessions) 
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{stats.avatar_emoji || "👶"}</span>
          <CardTitle className="text-lg">{stats.child_name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {/* Kitap Sayısı */}
          <div className="bg-primary/10 rounded-xl p-3">
            <div className="flex items-center gap-2 text-primary mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-medium">Kitap</span>
            </div>
            <div className="text-2xl font-bold">{stats.books_read}</div>
          </div>

          {/* Sayfa Sayısı */}
          <div className="bg-accent/10 rounded-xl p-3">
            <div className="flex items-center gap-2 text-accent mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">Sayfa</span>
            </div>
            <div className="text-2xl font-bold">{stats.total_pages_read}</div>
          </div>

          {/* Toplam Süre */}
          <div className="bg-green-500/10 rounded-xl p-3">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Toplam Süre</span>
            </div>
            <div className="text-lg font-bold">{formatDuration(stats.total_reading_seconds)}</div>
          </div>

          {/* Ortalama */}
          <div className="bg-orange-500/10 rounded-xl p-3">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Oturum Başına</span>
            </div>
            <div className="text-lg font-bold">
              {avgPagesPerSession > 0 ? `${avgPagesPerSession} sayfa` : "-"}
            </div>
          </div>
        </div>

        {stats.total_sessions > 0 && (
          <div className="mt-3 pt-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Toplam {stats.total_sessions} okuma seansı • Ortalama {formatDuration(avgSessionDuration)}/seans
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
