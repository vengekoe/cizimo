# 📦 Çizimo Paket (Abonelik) Sistemi Dokümantasyonu

## Genel Bakış

Çizimo, çocuklar için kişiselleştirilmiş hikaye oluşturma platformudur. 4 farklı abonelik paketi sunmaktadır.

---

## Paket Seviyeleri

### 🐣 Minik Masal (Başlangıç Paketi)
- **Aylık Fiyat:** 49 TL
- **Aylık Hikaye Hakkı:** 1
- **Maksimum Sayfa:** 5
- **Çocuk Profili:** 1
- **Deneme Süresi:** İlk 3 ay ücretsiz

**Özellikler:**
- ✅ Temel kişiselleştirme (ad, yaş)

---

### 🐿️ Masal Keşifçisi
- **Aylık Fiyat:** 199 TL
- **Aylık Hikaye Hakkı:** 3
- **Maksimum Sayfa:** 15
- **Çocuk Profili:** 2

**Özellikler (Minik Masal + Ek):**
- ✅ Temel kişiselleştirme (ad, yaş)
- ✅ Gelişmiş kişiselleştirme
- ✅ Kapak tasarımı seçimi
- ✅ Arkadaşla paylaşma
- ✅ Basit istatistik

---

### 🦄 Masal Kahramanı
- **Aylık Fiyat:** 499 TL
- **Aylık Hikaye Hakkı:** 10
- **Maksimum Sayfa:** 20
- **Çocuk Profili:** 3

**Özellikler (Masal Keşifçisi + Ek):**
- ✅ Tüm Masal Keşifçisi özellikleri
- ✅ Detaylı istatistik
- ✅ Fotoğraftan hikaye
- ✅ Sesli hikaye (AI anlatıcı)
- ✅ Yazı tipi seçimi
- ✅ Sınırsız revizyon
- ✅ Favori sayfa işaretleme

---

### 🐉 Sonsuz Masal Dünyası (Premium)
- **Aylık Fiyat:** 999 TL
- **Aylık Hikaye Hakkı:** Sınırsız
- **Maksimum Sayfa:** Sınırsız
- **Çocuk Profili:** 5

**Özellikler (Tüm Özellikler):**
- ✅ Tüm Masal Kahramanı özellikleri
- ✅ Sınırsız arkadaş paylaşımı
- ✅ Gelişmiş istatistik
- ✅ Özel illüstrasyon stili
- ✅ Haftalık tema koleksiyonu
- ✅ Aile içi paylaşım
- ✅ Baskıya hazır tasarım
- ✅ Kütüphane yedekleme

---

## Özellik Karşılaştırma Tablosu

| Özellik | Minik Masal | Masal Keşifçisi | Masal Kahramanı | Sonsuz Masal |
|---------|:-----------:|:---------------:|:---------------:|:------------:|
| **Fiyat (TL/ay)** | 49 | 199 | 499 | 999 |
| **Aylık Hikaye** | 1 | 3 | 10 | Sınırsız |
| **Maks. Sayfa** | 5 | 15 | 20 | Sınırsız |
| **Çocuk Profili** | 1 | 2 | 3 | 5 |
| Temel kişiselleştirme | ✅ | ✅ | ✅ | ✅ |
| Gelişmiş kişiselleştirme | ❌ | ✅ | ✅ | ✅ |
| Kapak tasarımı seçimi | ❌ | ✅ | ✅ | ✅ |
| Arkadaşla paylaşma | ❌ | ✅ | ✅ | ✅ |
| Sınırsız arkadaş paylaşımı | ❌ | ❌ | ❌ | ✅ |
| Basit istatistik | ❌ | ✅ | ✅ | ✅ |
| Detaylı istatistik | ❌ | ❌ | ✅ | ✅ |
| Gelişmiş istatistik | ❌ | ❌ | ❌ | ✅ |
| Fotoğraftan hikaye | ❌ | ❌ | ✅ | ✅ |
| Sesli hikaye (AI anlatıcı) | ❌ | ❌ | ✅ | ✅ |
| Yazı tipi seçimi | ❌ | ❌ | ✅ | ✅ |
| Sınırsız revizyon | ❌ | ❌ | ✅ | ✅ |
| Favori sayfa işaretleme | ❌ | ❌ | ✅ | ✅ |
| Özel illüstrasyon stili | ❌ | ❌ | ❌ | ✅ |
| Haftalık tema koleksiyonu | ❌ | ❌ | ❌ | ✅ |
| Aile içi paylaşım | ❌ | ❌ | ❌ | ✅ |
| Baskıya hazır tasarım | ❌ | ❌ | ❌ | ✅ |
| Kütüphane yedekleme | ❌ | ❌ | ❌ | ✅ |

---

## Teknik Altyapı

### Veritabanı Tabloları

#### 1. `subscriptions` (Kullanıcı Abonelikleri)
```sql
- id: UUID (Primary Key)
- user_id: UUID (Kullanıcı ID)
- tier: subscription_tier (Paket seviyesi)
- monthly_credits: INTEGER (Aylık hikaye hakkı, -1 = sınırsız)
- used_credits: INTEGER (Kullanılan kredi)
- max_pages: INTEGER (Maksimum sayfa, -1 = sınırsız)
- max_children: INTEGER (Maksimum çocuk profili)
- price_tl: INTEGER (Aylık fiyat TL)
- trial_ends_at: TIMESTAMP (Deneme süresi bitiş tarihi)
- current_period_start: TIMESTAMP (Dönem başlangıcı)
- current_period_end: TIMESTAMP (Dönem bitişi)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. `subscription_features` (Paket Özellikleri)
```sql
- id: UUID (Primary Key)
- tier: subscription_tier (Paket seviyesi)
- monthly_credits: INTEGER
- max_pages: INTEGER
- max_children: INTEGER
- price_tl: INTEGER
- trial_months: INTEGER (Deneme süresi ay)
- basic_personalization: BOOLEAN
- advanced_personalization: BOOLEAN
- cover_design_selection: BOOLEAN
- friend_sharing: BOOLEAN
- unlimited_friend_sharing: BOOLEAN
- basic_stats: BOOLEAN
- detailed_stats: BOOLEAN
- advanced_stats: BOOLEAN
- photo_story: BOOLEAN
- audio_story: BOOLEAN
- font_selection: BOOLEAN
- unlimited_revision: BOOLEAN
- favorite_pages: BOOLEAN
- custom_illustration: BOOLEAN
- weekly_themes: BOOLEAN
- family_sharing: BOOLEAN
- print_ready: BOOLEAN
- library_backup: BOOLEAN
- unlimited_stories: BOOLEAN
- unlimited_pages: BOOLEAN
```

### Enum Tanımları
```sql
CREATE TYPE subscription_tier AS ENUM (
  'minik_masal',
  'masal_kesfifcisi', 
  'masal_kahramani',
  'sonsuz_masal'
);
```

---

## Kredi Sistemi

### Nasıl Çalışır?
1. Her paket aylık belirli sayıda hikaye kredisi sağlar
2. Hikaye oluşturulduğunda `used_credits` artar
3. Dönem sonunda (current_period_end) krediler sıfırlanır
4. `-1` değeri sınırsız anlamına gelir

### Veritabanı Fonksiyonları

```sql
-- Kalan kredi sorgulama
SELECT get_remaining_credits(_user_id);

-- Hikaye oluşturabilir mi kontrolü
SELECT can_create_story(_user_id);

-- Kredi kullanma
SELECT use_story_credit(_user_id);

-- Kullanıcı paket seviyesi
SELECT get_user_tier(_user_id);
```

---

## Frontend Hook: useSubscription()

```typescript
const {
  subscription,           // Aktif abonelik
  currentFeatures,        // Mevcut paket özellikleri
  allFeatures,           // Tüm paket özellikleri
  remainingCredits,      // Kalan kredi (-1 = sınırsız)
  isInTrial,             // Deneme süresinde mi?
  canCreateStory,        // Hikaye oluşturabilir mi?
  getMaxPages,           // İzin verilen sayfa sayısı
  hasFeature,            // Özellik kontrolü
  maxChildren,           // Maks çocuk profili
  useCredit,             // Kredi kullan
  changeTier,            // Paket değiştir
  tierName,              // Paket adı (görüntüleme için)
  tierEmoji,             // Paket emojisi
} = useSubscription();
```

### Kullanım Örnekleri

```typescript
// Özellik kontrolü
if (hasFeature('audio_story')) {
  // Sesli hikaye özelliği aktif
}

// Kredi kontrolü
if (canCreateStory) {
  // Hikaye oluşturulabilir
}

// Sayfa limiti kontrolü
const allowedPages = getMaxPages(requestedPageCount);
```

---

## RLS (Row Level Security) Politikaları

### subscriptions tablosu
- **SELECT:** Kullanıcı sadece kendi aboneliğini görebilir
- **INSERT:** Kullanıcı kendi aboneliğini oluşturabilir
- **UPDATE:** Kullanıcı veya admin güncelleyebilir
- **DELETE:** İzin verilmez

### subscription_features tablosu
- **SELECT:** Herkes görebilir (public)
- **INSERT/UPDATE/DELETE:** İzin verilmez (admin only)

---

## Yeni Kullanıcı Akışı

1. Kullanıcı kayıt olur
2. Otomatik olarak "minik_masal" paketi atanır
3. 3 aylık ücretsiz deneme süresi başlar
4. Deneme süresi bitiminde ödeme gerekir

---

## Paket Yükseltme/Düşürme

- Paket değişikliği anında uygulanır
- Krediler sıfırlanır
- Yeni paket limitleri geçerli olur
- Ödeme entegrasyonu henüz mevcut değil (TODO)

---

## Notlar

- Admin kullanıcılar tüm özelliklere sınırsız erişime sahiptir
- Kredi sistemi `use_story_credit()` fonksiyonu ile yönetilir
- Ödeme entegrasyonu (Stripe/iyzico) ileride eklenecektir

---

*Son güncelleme: Ocak 2026*
