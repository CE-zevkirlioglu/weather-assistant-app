import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getWeatherPrediction } from './api';
import { getSelectedCity } from './city';
import { getCurrentLocation } from './location';

const NOTIFICATION_TIME_KEY = 'notification_time';
const NOTIFICATION_ENABLED_KEY = 'notification_enabled';

// Bildirim handler'ı ayarla (Expo Go'da çalışmayabilir)
// Bildirim tetiklendiğinde API'den gerçek zamanlı veri çek
try {
  // Handler içinden gönderilen bildirimleri takip et (çift tetiklemeyi önlemek için)
  let processingNotificationId: string | null = null;
  let lastProcessedTime: number = 0;
  const PROCESSING_COOLDOWN = 5000; // 5 saniye cooldown (aynı bildirim 5 saniye içinde tekrar işlenmesin)
  
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // ÖNEMLİ: Handler içinden gönderilen bildirimleri işaretle
      // Bu bildirimler handler'dan geçtiğinde direkt gösterilmeli, tekrar işlenmemeli
      const isFromHandler = notification.request.content.data?.fromHandler === true;
      
      // Eğer bu bildirim şu anda işleniyorsa, tekrar işleme (iOS'ta çift tetiklemeyi önle)
      if (processingNotificationId === notification.request.identifier) {
        return {
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }
      
      // Cooldown kontrolü: Aynı bildirim çok kısa süre içinde tekrar tetiklenirse, işleme
      const now = Date.now();
      if (notification.request.identifier === processingNotificationId && 
          (now - lastProcessedTime) < PROCESSING_COOLDOWN) {
        return {
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }
      
      // Eğer bildirim bizim zamanlanmış bildirimimiz ise ve veri çekilmesi gerekiyorsa
      if (notification.request.content.data?.type === 'weather_update' && 
          notification.request.content.data?.needsFetch === true &&
          !isFromHandler) {
        // İşleniyor olarak işaretle
        processingNotificationId = notification.request.identifier;
        lastProcessedTime = now;
        
        try {
          // ÖNEMLİ: iOS'ta çift bildirimi önlemek için orijinal bildirimi TAMAMEN gizle
          // Handler çalışmadan önce iOS bildirimi gösterebilir, bu yüzden tüm gösterimleri engelle
          const originalIdentifier = notification.request.identifier;
          
          // ÖNCE tüm zamanlanmış bildirimleri iptal et (özellikle needsFetch: true olanlar)
          // iOS'ta handler çalışmadan önce bildirim gösterilebilir, bu yüzden hemen iptal et
          try {
            // Önce orijinal bildirimi hemen iptal et
            try {
              await Notifications.cancelScheduledNotificationAsync(originalIdentifier);
            } catch (cancelOriginalError) {
              // Ignore
            }
            
            // Sonra tüm needsFetch: true olan bildirimleri iptal et
            const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const scheduled of allScheduled) {
              if (scheduled.identifier === originalIdentifier || 
                  (scheduled.content.data?.needsFetch === true && 
                   scheduled.identifier.startsWith('weather-daily-trigger'))) {
                try {
                  await Notifications.cancelScheduledNotificationAsync(scheduled.identifier);
                } catch (cancelError) {
                  // Ignore
                }
              }
            }
          } catch (cancelError) {
            // Ignore
          }

          // Bildirim tetiklendiğinde (seçilen saatte) API'den GÜNCEL veri çek
          // Önce seçilen şehri kontrol et
          const selectedCity = await getSelectedCity();
          
          if (selectedCity) {
            // Seçilen şehir varsa direkt kullan
            const weatherData = await getWeatherPrediction(
              selectedCity.latitude,
              selectedCity.longitude
            );

            // Gerçek zamanlı veri ile yeni bildirim gönder (hemen)
            // fromHandler: true ile işaretle ki handler'da tekrar işlenmesin
            const notificationId = `weather-update-${Date.now()}`;
            const locationName = weatherData.meta.location_name || selectedCity.name;
            await Notifications.scheduleNotificationAsync({
              identifier: notificationId,
              content: {
                title: `Hava Durumu - ${locationName}`,
                body: weatherData.summary,
                data: { 
                  weatherData, 
                  type: 'weather_update', 
                  needsFetch: false,
                  fromHandler: true, // Handler'dan geldiğini işaretle
                },
                sound: true,
              },
              trigger: null, // Hemen gönder
            });
            
            // İşleniyor flag'ini temizle (kısa bir gecikme ile, iOS'ta çift tetiklemeyi önlemek için)
            setTimeout(() => {
              processingNotificationId = null;
            }, 1000);

            // Günlük bildirimi yeniden zamanla (bir sonraki gün için)
            // AsyncStorage'dan saat bilgisini al
            try {
              const timeString = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
              if (timeString) {
                const { hour, minute } = JSON.parse(timeString);
                
                // Bir sonraki gün için zamanla (bugün değil)
                await Notifications.scheduleNotificationAsync({
                  identifier: 'weather-daily-trigger',
                  content: {
                    title: 'Hava Durumu', // Minimal title - handler'da gizlenecek
                    body: 'Güncelleniyor...', // Minimal body - handler'da gizlenecek
                    sound: false, // Ses yok
                    data: { type: 'weather_update', needsFetch: true },
                  },
                  trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour,
                    minute,
                  },
                });
              }
            } catch (rescheduleError) {
              // Ignore
            }

            // İlk tetikleyici bildirimi tamamen gizle (iOS için tüm gösterimleri engelle)
            return {
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
            };
          }
          
          // Şehir seçilmemişse konum al
          const location = await getCurrentLocation();
          
          if (location) {
            const weatherData = await getWeatherPrediction(
              location.latitude,
              location.longitude
            );

            // Gerçek zamanlı veri ile yeni bildirim gönder (hemen)
            // fromHandler: true ile işaretle ki handler'da tekrar işlenmesin
            const notificationId = `weather-update-${Date.now()}`;
            const locationName = weatherData.meta.location_name || 'Konum';
            await Notifications.scheduleNotificationAsync({
              identifier: notificationId,
              content: {
                title: `Hava Durumu - ${locationName}`,
                body: weatherData.summary,
                data: { 
                  weatherData, 
                  type: 'weather_update', 
                  needsFetch: false,
                  fromHandler: true, // Handler'dan geldiğini işaretle
                },
                sound: true,
              },
              trigger: null, // Hemen gönder
            });
            
            // İşleniyor flag'ini temizle (kısa bir gecikme ile, iOS'ta çift tetiklemeyi önlemek için)
            setTimeout(() => {
              processingNotificationId = null;
            }, 1000);

            // Günlük bildirimi yeniden zamanla (bir sonraki gün için)
            // AsyncStorage'dan saat bilgisini al
            try {
              const timeString = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
              if (timeString) {
                const { hour, minute } = JSON.parse(timeString);
                
                // Bir sonraki gün için zamanla (bugün değil)
                await Notifications.scheduleNotificationAsync({
                  identifier: 'weather-daily-trigger',
                  content: {
                    title: 'Hava Durumu', // Minimal title - handler'da gizlenecek
                    body: 'Güncelleniyor...', // Minimal body - handler'da gizlenecek
                    sound: false, // Ses yok
                    data: { type: 'weather_update', needsFetch: true },
                  },
                  trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour,
                    minute,
                  },
                });
              }
            } catch (rescheduleError) {
              // Ignore
            }

            // İlk tetikleyici bildirimi tamamen gizle (iOS için tüm gösterimleri engelle)
            return {
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
            };
          } else {
            // İşleniyor flag'ini temizle (kısa bir gecikme ile)
            setTimeout(() => {
              processingNotificationId = null;
            }, 1000);
            
            // Konum alınamazsa hata mesajı gönder
            await Notifications.scheduleNotificationAsync({
              identifier: `weather-error-${Date.now()}`,
              content: {
                title: 'Hava Durumu Güncellemesi',
                body: 'Konum bilgisi alınamadı. Lütfen konum iznini kontrol edin.',
                data: { 
                  type: 'weather_update', 
                  needsFetch: false,
                  fromHandler: true, // Handler'dan geldiğini işaretle
                },
                sound: true,
              },
              trigger: null, // Hemen gönder
            });
            return {
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
            };
          }
        } catch (error) {
          // İşleniyor flag'ini temizle (kısa bir gecikme ile)
          setTimeout(() => {
            processingNotificationId = null;
          }, 1000);
          
          // Hata durumunda hata mesajı gönder
          try {
            await Notifications.scheduleNotificationAsync({
              identifier: `weather-error-${Date.now()}`,
              content: {
                title: 'Hava Durumu Güncellemesi',
                body: 'Hava durumu bilgisi alınamadı.',
                data: { 
                  type: 'weather_update', 
                  needsFetch: false,
                  fromHandler: true, // Handler'dan geldiğini işaretle
                },
                sound: true,
              },
              trigger: null, // Hemen gönder
            });
          } catch (notifError) {
            // Ignore
          }
          return {
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: false,
            shouldShowList: false,
          };
        }
      }

      // Handler içinden gönderilen bildirimler için direkt göster (fromHandler: true)
      // Bu bildirimler zaten işlenmiş ve hazır
      if (notification.request.content.data?.fromHandler === true) {
        return {
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      }

      // Zaten gerçek veri içeren bildirimler için direkt göster
      // ÖNEMLİ: needsFetch: false olan bildirimler (yani handler'da oluşturduğumuz bildirimler) için göster
      if (notification.request.content.data?.needsFetch === false) {
        return {
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      }

      // Diğer bildirimler için varsayılan davranış
      return {
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
} catch (error) {
  // Ignore
}

// Bildirim listener'ı kaldırıldı - setNotificationHandler hem foreground hem background'da çalıştığı için
// listener'a gerek yok ve çift bildirim gönderilmesini önlemek için kaldırıldı

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    return false;
  }
}

export async function scheduleDailyNotification(hour: number, minute: number): Promise<void> {
  try {
    // Bildirim izinlerini kontrol et
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        throw new Error('Notification permission not granted');
      }
    }
    
    // Önceki bildirimleri iptal et
    await Notifications.cancelAllScheduledNotificationsAsync();

    // iOS'ta çift bildirimi önlemek için: Bildirimi minimal yaparak zamanla
    // Handler tetiklendiğinde (seçilen saatte) API'den GÜNCEL veri çekip bildirim gönderecek
    // setNotificationHandler background'da çalışmalı (iOS için UIBackgroundModes eklendi)
    // ÖNEMLİ: iOS'ta handler çalışmadan önce bildirim gösterilebilir, bu yüzden
    // handler'da tamamen gizleyeceğiz
    await Notifications.scheduleNotificationAsync({
      identifier: 'weather-daily-trigger',
      content: {
        title: 'Hava Durumu', // Minimal title - handler'da gizlenecek
        body: 'Güncelleniyor...', // Minimal body - handler'da gizlenecek
        sound: false, // Ses yok
        data: { type: 'weather_update', needsFetch: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    // Saati kaydet
    await AsyncStorage.setItem(NOTIFICATION_TIME_KEY, JSON.stringify({ hour, minute }));
  } catch (error) {
    throw error;
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
  } catch (error) {
    // Ignore
  }
}

export async function getNotificationTime(): Promise<{ hour: number; minute: number } | null> {
  try {
    const timeString = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
    if (!timeString) return null;
    return JSON.parse(timeString);
  } catch (error) {
    return null;
  }
}

export async function isNotificationEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
}

export async function setNotificationEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, enabled.toString());
  } catch (error) {
    // Ignore
  }
}

// Test için: Hemen bildirim gönder
export async function sendTestNotification(): Promise<void> {
  try {
    // İzin kontrolü
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        throw new Error('Notification permission not granted');
      }
    }
    
    const location = await getCurrentLocation();
    if (location) {
      const weatherData = await getWeatherPrediction(
        location.latitude,
        location.longitude
      );

      await Notifications.scheduleNotificationAsync({
        identifier: `test-notification-${Date.now()}`,
        content: {
          title: 'Hava Durumu Güncellemesi (Test)',
          body: weatherData.summary,
          data: { 
            weatherData, 
            type: 'weather_update', 
            needsFetch: false,
            fromHandler: true, // Handler'dan geldiğini işaretle
          },
          sound: true,
        },
        trigger: null, // Hemen gönder
      });
    } else {
      throw new Error('Konum alınamadı');
    }
  } catch (error) {
    throw error;
  }
}

// Zamanlanan bildirimleri listele
export async function getScheduledNotifications(): Promise<any[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    return [];
  }
}

// Debug: Bildirim durumunu kontrol et
export async function checkNotificationStatus(): Promise<{
  permissionStatus: string;
  scheduledCount: number;
  scheduledNotifications: any[];
}> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    return {
      permissionStatus: status,
      scheduledCount: scheduled.length,
      scheduledNotifications: scheduled,
    };
  } catch (error) {
    return {
      permissionStatus: 'unknown',
      scheduledCount: 0,
      scheduledNotifications: [],
    };
  }
}
