# 🌤️ Weather Assistant

<div align="center">

**Modern ve akıllı hava durumu asistanı uygulaması**

[![Expo](https://img.shields.io/badge/Expo-54.0-black?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-Private-red?style=flat-square)](LICENSE)

*Akıllı hava durumu tahminleri ve kişiselleştirilmiş öneriler ile günlük planlamanızı kolaylaştırın*

</div>

---

## ✨ Özellikler

### 🌍 Akıllı Konum Yönetimi
- **Otomatik konum tespiti** - GPS ile anlık konumunuzu kullanarak hava durumu bilgisi
- **Şehir seçimi** - İstediğiniz şehri manuel olarak seçebilme
- **Hızlı konum alma** - Cache'lenmiş konum verileri ile optimize edilmiş performans

### 📊 Detaylı Hava Durumu Analizi
- **Gerçek zamanlı veriler** - Sıcaklık, nem, rüzgar hızı, basınç, bulutluluk ve UV indeksi
- **Akıllı tahminler** - Makine öğrenmesi destekli hava durumu tahminleri
- **Görsel istatistikler** - Modern kartlar ve grafikler ile veri görselleştirme

### 💡 Kişiselleştirilmiş Öneriler
- **Akıllı öneriler** - Hava durumuna göre otomatik öneriler
- **Çoklu öneri desteği** - Birden fazla aktif öneri görüntüleme
- **Bağlamsal uyarılar** - Önemli hava durumu değişiklikleri için bildirimler

### 🧪 Manuel Test Modu
- **Özel tahminler** - Manuel olarak girilen verilerle hava durumu tahmini
- **Detaylı sonuçlar** - Tahmin olasılıkları ve durum analizleri
- **Gerçek zamanlı sonuçlar** - Anında tahmin ve öneri görüntüleme

### 🔔 Akıllı Bildirimler
- **Zamanlanmış bildirimler** - Özelleştirilebilir bildirim zamanları
- **Hava durumu uyarıları** - Önemli değişiklikler için otomatik bildirimler
- **Arka plan güncellemeleri** - Uygulama kapalıyken bile güncel bilgiler

### 🎨 Modern Kullanıcı Arayüzü
- **Gradient tasarım** - Mor-mavi gradient temalar
- **Dark mode desteği** - Otomatik sistem temasına uyum
- **Shimmer loading** - Profesyonel yükleme animasyonları
- **Smooth animasyonlar** - React Native Reanimated ile akıcı geçişler
- **Haptic feedback** - Dokunsal geri bildirimler

### ⚙️ Gelişmiş Ayarlar
- **Şehir yönetimi** - Favori şehirler ekleme ve düzenleme
- **Bildirim ayarları** - Bildirim zamanlarını özelleştirme
- **Tema tercihleri** - Açık/koyu mod seçimi

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- **Node.js** 18+ 
- **npm** veya **yarn**
- **Expo CLI** (global olarak yüklü olmalı)
- **iOS Simulator** (macOS için) veya **Android Studio** (Android için)

### Kurulum

1. **Projeyi klonlayın**
   ```bash
   git clone <repository-url>
   cd weather-assistant-app
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Uygulamayı başlatın**
   ```bash
   npx expo start
   ```

4. **Platform seçimi**
   - **iOS**: `i` tuşuna basın veya `npx expo run:ios`
   - **Android**: `a` tuşuna basın veya `npx expo run:android`
   - **Web**: `w` tuşuna basın veya `npx expo start --web`

---

## 📱 Platform Desteği

| Platform | Durum | Notlar |
|----------|-------|--------|
| 📱 iOS | ✅ Tam Destek | iOS 13+ |
| 🤖 Android | ✅ Tam Destek | Android 6.0+ |
| 🌐 Web | ✅ Tam Destek | Modern tarayıcılar |

---

## 🛠️ Teknolojiler

### Core Framework
- **[Expo](https://expo.dev)** - React Native geliştirme platformu
- **[React Native](https://reactnative.dev)** - Cross-platform mobil uygulama framework
- **[TypeScript](https://www.typescriptlang.org)** - Tip güvenli JavaScript

### UI & Styling
- **[Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)** - Gradient arka planlar
- **[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)** - Yüksek performanslı animasyonlar
- **[Expo Vector Icons](https://docs.expo.dev/guides/icons/)** - İkon kütüphanesi

### Navigation & Routing
- **[Expo Router](https://docs.expo.dev/router/introduction/)** - File-based routing
- **[React Navigation](https://reactnavigation.org)** - Navigasyon çözümü

### Services & APIs
- **[Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)** - Konum servisleri
- **[Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)** - Push bildirimleri
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** - Yerel veri depolama

### Development Tools
- **[ESLint](https://eslint.org)** - Kod kalitesi kontrolü
- **[TypeScript](https://www.typescriptlang.org)** - Tip kontrolü

---

## 📂 Proje Yapısı

```
weather-assistant-app/
├── app/                    # Expo Router sayfaları
│   ├── (tabs)/            # Tab navigasyon sayfaları
│   │   ├── index.tsx      # Ana sayfa
│   │   ├── test.tsx       # Manuel test ekranı
│   │   └── settings.tsx   # Ayarlar sayfası
│   └── _layout.tsx        # Root layout
├── assets/                # Statik dosyalar
│   └── images/           # Görseller ve ikonlar
├── components/           # Yeniden kullanılabilir bileşenler
│   ├── ui/               # UI bileşenleri
│   └── themed-*.tsx      # Tema destekli bileşenler
├── constants/            # Sabitler ve temalar
│   └── theme.ts          # Renk şemaları ve temalar
├── hooks/                # Custom React hooks
├── services/             # API ve servis katmanı
│   ├── api.ts           # Hava durumu API servisi
│   ├── city.ts          # Şehir yönetimi
│   ├── location.ts      # Konum servisleri
│   └── notifications.ts  # Bildirim yönetimi
└── scripts/              # Yardımcı scriptler
```

---

## 🎯 Kullanım

### Ana Sayfa
Ana sayfa otomatik olarak konumunuzu tespit eder ve güncel hava durumu bilgilerini gösterir. Pull-to-refresh ile verileri yenileyebilirsiniz.

### Manuel Test
Test sekmesinde manuel olarak hava durumu verilerini girerek özel tahminler alabilirsiniz:
- Sıcaklık (°C)
- Nem (%)
- Rüzgar Hızı (km/h)
- Basınç (hPa)
- Bulutluluk (%)
- UV İndeksi

### Ayarlar
Ayarlar sekmesinden:
- Şehir seçimi yapabilirsiniz
- Bildirim zamanlarını ayarlayabilirsiniz
- Tema tercihlerinizi değiştirebilirsiniz

---

## 🔧 Geliştirme

### Scriptler

```bash
# Geliştirme sunucusunu başlat
npm start

# iOS için build
npm run ios

# Android için build
npm run android

# Web için başlat
npm run web

# Lint kontrolü
npm run lint

# Projeyi sıfırla (starter kodları app-example'a taşır)
npm run reset-project
```

### Kod Standartları

- **TypeScript** kullanımı zorunludur
- **ESLint** kurallarına uyulmalıdır
- Bileşenler **functional components** olarak yazılmalıdır
- **Custom hooks** ile mantık ayrımı yapılmalıdır

---

## 🌐 API Entegrasyonu

Uygulama hava durumu tahminleri için bir backend API kullanır. API endpoint'i `services/api.ts` dosyasında yapılandırılmıştır.

### API Endpoints

- `GET /weather` - Konum bazlı hava durumu tahmini
- `POST /predict` - Manuel verilerle hava durumu tahmini

---

## 📝 Lisans

Bu proje özel bir projedir ve ticari kullanım için lisanslanmamıştır.

---

## 👥 Katkıda Bulunma

Bu proje şu anda kapalı geliştirme aşamasındadır. Katkılar şu anda kabul edilmemektedir.

---

## 📞 İletişim

Sorularınız veya önerileriniz için lütfen issue açın.

---

<div align="center">

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ using Expo & React Native

</div>
