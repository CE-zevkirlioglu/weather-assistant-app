import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Shimmer, ShimmerCard } from '@/components/ui/shimmer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getWeatherPrediction, WeatherResponse } from '@/services/api';
import { getCityChangeTimestamp, getSelectedCity } from '@/services/city';
import { checkLocationPermission, getCurrentLocationFast, requestLocationPermission } from '@/services/location';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const lastCityChangeTimestamp = useRef<number | null>(null);

  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // İlk yüklemede hemen hava durumunu çek
    loadWeatherDataInitial();
    
    try {
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        if (response.notification.request.content.data?.type === 'weather_update') {
          loadWeatherData();
        }
      });
    } catch (error) {
      console.warn('Notifications not available:', error);
    }

    return () => {
      try {
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, []);

  // Ekran focus olduğunda şehir değişikliğini kontrol et ve refresh at
  useFocusEffect(
    React.useCallback(() => {
      const checkCityChange = async () => {
        const currentTimestamp = await getCityChangeTimestamp();
        
        // İlk yüklemede timestamp'i kaydet
        if (lastCityChangeTimestamp.current === null) {
          lastCityChangeTimestamp.current = currentTimestamp;
          return;
        }
        
        // Şehir değiştiyse refresh at
        if (currentTimestamp && currentTimestamp !== lastCityChangeTimestamp.current) {
          lastCityChangeTimestamp.current = currentTimestamp;
          loadWeatherData();
        }
      };
      
      checkCityChange();
    }, [])
  );

  // İlk yükleme - hızlı ve optimize edilmiş
  const loadWeatherDataInitial = async () => {
    try {
      setLoading(true);
      setError(null);

      // Önce seçilen şehri kontrol et
      const selectedCity = await getSelectedCity();
      
      if (selectedCity) {
        // Seçilen şehir varsa direkt kullan
        const data = await getWeatherPrediction(selectedCity.latitude, selectedCity.longitude);
        setWeatherData(data);
        setLocationPermission(true); // Şehir seçildiyse izin var sayılır
        setLoading(false);
        return;
      }

      // İzin kontrolü ve konum alma paralel yapılabilir ama önce izin kontrolü
      const hasPermission = await checkLocationPermission();
      setLocationPermission(hasPermission);
      
      if (!hasPermission) {
        // İzin yoksa iste ve bekle
        const granted = await requestLocationPermission();
        setLocationPermission(granted);
        if (!granted) {
          setError('Konum izni gerekli. Lütfen ayarlardan izin verin veya bir şehir seçin.');
          setLoading(false);
          return;
        }
      }

      // İzin varsa hızlı konum al (cached konum kullanır)
      const location = await getCurrentLocationFast();
      if (!location) {
        throw new Error('Konum alınamadı');
      }

      // Konum alındığında direkt API'ye istek at
      const data = await getWeatherPrediction(location.latitude, location.longitude);
      setWeatherData(data);
    } catch (err: any) {
      setError(err.message || 'Hava durumu bilgisi alınamadı');
      console.error('Error loading weather:', err);
    } finally {
      setLoading(false);
    }
  };

  // Normal yükleme (refresh için)
  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Önce seçilen şehri kontrol et
      const selectedCity = await getSelectedCity();
      
      if (selectedCity) {
        // Seçilen şehir varsa direkt kullan
        const data = await getWeatherPrediction(selectedCity.latitude, selectedCity.longitude);
        setWeatherData(data);
        setLoading(false);
        return;
      }

      const location = await getCurrentLocationFast();
      if (!location) {
        throw new Error('Konum alınamadı');
      }

      const data = await getWeatherPrediction(location.latitude, location.longitude);
      setWeatherData(data);
    } catch (err: any) {
      setError(err.message || 'Hava durumu bilgisi alınamadı');
      console.error('Error loading weather:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  };

  const handleRetry = () => {
    loadWeatherData();
  };

  const getWeatherIcon = (condition?: string) => {
    if (!condition) return 'partly-sunny';
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return 'rainy';
    if (lower.includes('cloud')) return 'cloudy';
    if (lower.includes('sun') || lower.includes('clear')) return 'sunny';
    if (lower.includes('snow')) return 'snow';
    return 'partly-sunny';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Hero Gradient Header */}
        <LinearGradient
          colors={isDark ? ['#1e293b', '#0f172a'] : ['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.header}>
            <ThemedText style={[styles.appTitle, { color: '#ffffff' }]}>
              Hava Durumu Asistanı
            </ThemedText>
            <TouchableOpacity 
              onPress={handleRetry} 
              style={styles.refreshButton}
              activeOpacity={0.7}
              disabled={loading || refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={22} 
                color="#ffffff" 
                style={[(loading || refreshing) && styles.refreshButtonRotating]}
              />
            </TouchableOpacity>
          </View>

          {/* Weather Display */}
          {loading ? (
            // Loading state - shimmer göster
            <View style={styles.weatherHero}>
              <Shimmer width={120} height={120} borderRadius={60} style={styles.shimmerIcon} />
              <Shimmer width={200} height={60} borderRadius={12} style={styles.shimmerTemp} />
              <Shimmer width={150} height={24} borderRadius={12} style={styles.shimmerLocation} />
            </View>
          ) : weatherData ? (
            // Weather data göster
            <Animated.View 
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.weatherHero}
            >
              <View style={styles.temperatureMainContainer}>
                <Ionicons 
                  name={getWeatherIcon(weatherData.meta.condition)} 
                  size={90} 
                  color="#ffffff" 
                  style={styles.weatherIcon}
                />
                <View style={styles.temperatureTextContainer}>
                  <ThemedText style={[styles.temperature, { color: '#ffffff' }]}>
                    {weatherData.features.temp.toFixed(0)}
                  </ThemedText>
                  <ThemedText style={[styles.temperatureUnit, { color: '#ffffff' }]}>
                    °C
                  </ThemedText>
                </View>
              </View>
              {weatherData.meta.location_name && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={18} color="#ffffff" />
                  <ThemedText style={[styles.locationText, { color: '#ffffff' }]} numberOfLines={1}>
                    {weatherData.meta.location_name}
                    {weatherData.meta.location_country && `, ${weatherData.meta.location_country}`}
                  </ThemedText>
                </View>
              )}
            </Animated.View>
          ) : null}
        </LinearGradient>

        <View style={styles.scrollContainer}>
          {refreshing && weatherData && (
            <View style={[styles.shimmerOverlay, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)' }]}>
              <View style={[styles.shimmerOverlayContent, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="small" color={colors.tint} />
              </View>
            </View>
          )}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
            }
            showsVerticalScrollIndicator={false}
          >
          {/* Error State */}
          {error && !loading && !weatherData && (
            <View style={styles.centerContainer}>
              <View style={[styles.errorCard, { backgroundColor: colors.card }]}>
                <Ionicons
                  name="alert-circle-outline"
                  size={64}
                  color={colors.error}
                  style={styles.errorIcon}
                />
                <ThemedText style={[styles.errorText, { color: colors.text }]}>
                  {error}
                </ThemedText>
                <TouchableOpacity 
                  style={[styles.retryButton, { backgroundColor: colors.tint }]} 
                  onPress={handleRetry}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.retryButtonText}>Tekrar Dene</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Weather Data with Shimmer Loading */}
          {loading ? (
            <>
              <ShimmerCard>
                <Shimmer width={80} height={24} borderRadius={8} style={{ marginBottom: 16 }} />
                <Shimmer width="100%" height={20} borderRadius={8} style={{ marginBottom: 12 }} />
                <Shimmer width="90%" height={20} borderRadius={8} />
              </ShimmerCard>
              <View style={styles.statsGrid}>
                {[1, 2, 3, 4].map((i) => (
                  <ShimmerCard key={i} style={{ width: (width - 56) / 2, margin: 8 }}>
                    <Shimmer width={56} height={56} borderRadius={28} style={{ marginBottom: 12, alignSelf: 'center' }} />
                    <Shimmer width={60} height={24} borderRadius={8} style={{ marginBottom: 8, alignSelf: 'center' }} />
                    <Shimmer width={80} height={16} borderRadius={8} style={{ alignSelf: 'center' }} />
                  </ShimmerCard>
                ))}
              </View>
              <ShimmerCard>
                <Shimmer width={100} height={24} borderRadius={8} style={{ marginBottom: 16 }} />
                <Shimmer width="100%" height={20} borderRadius={8} style={{ marginBottom: 12 }} />
                <Shimmer width="100%" height={20} borderRadius={8} />
              </ShimmerCard>
              <ShimmerCard>
                <Shimmer width={80} height={24} borderRadius={8} style={{ marginBottom: 16 }} />
                <Shimmer width="100%" height={20} borderRadius={8} style={{ marginBottom: 12 }} />
                <Shimmer width="90%" height={20} borderRadius={8} style={{ marginBottom: 12 }} />
                <Shimmer width="95%" height={20} borderRadius={8} />
              </ShimmerCard>
            </>
          ) : weatherData ? (
            <Animated.View 
              entering={FadeIn.duration(300)} 
              exiting={FadeOut.duration(200)}
            >
              {/* Recommendations - Moved to top */}
              {weatherData.recommendations.filter((rec) => rec.active).length > 0 && (
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="bulb-outline" size={24} color={colors.success} />
                    <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
                      Öneriler
                    </ThemedText>
                  </View>
                  {weatherData.recommendations
                    .filter((rec) => rec.active)
                    .map((rec, index) => (
                      <View key={rec.id} style={styles.recommendationItem}>
                        <View style={[styles.recommendationIcon, { backgroundColor: `${colors.success}15` }]}>
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        </View>
                        <ThemedText style={[styles.recommendationText, { color: colors.text }]}>
                          {rec.message}
                        </ThemedText>
                      </View>
                    ))}
                </View>
              )}

              {/* Weather Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${colors.tint}15` }]}>
                    <Ionicons name="thermometer-outline" size={24} color={colors.tint} />
                  </View>
                  <ThemedText style={[styles.statValue, { color: colors.text }]}>
                    {weatherData.features.temp.toFixed(1)}°C
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Sıcaklık
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="water-outline" size={24} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.statValue, { color: colors.text }]}>
                    {weatherData.features.humidity.toFixed(0)}%
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Nem
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${colors.secondary}15` }]}>
                    <Ionicons name="leaf-outline" size={24} color={colors.secondary} />
                  </View>
                  <ThemedText style={[styles.statValue, { color: colors.text }]}>
                    {weatherData.features.wind_speed.toFixed(0)}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Rüzgar (km/h)
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${colors.accent}15` }]}>
                    <Ionicons name="speedometer-outline" size={24} color={colors.accent} />
                  </View>
                  <ThemedText style={[styles.statValue, { color: colors.text }]}>
                    {weatherData.features.pressure.toFixed(0)}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Basınç (hPa)
                  </ThemedText>
                </View>
              </View>

              {/* Detailed Features */}
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="stats-chart-outline" size={24} color={colors.tint} />
                  <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
                    Detaylı Bilgiler
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="cloud-outline" size={20} color={colors.textSecondary} />
                    <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Bulutluluk
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                      {weatherData.features.clouds.toFixed(0)}%
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="sunny-outline" size={20} color={colors.warning} />
                    <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      UV İndeksi
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                      {weatherData.features.uv_index.toFixed(1)}
                    </ThemedText>
                  </View>
                </View>
              </View>

            </Animated.View>
          ) : null}
          </ScrollView>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  heroSection: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    minHeight: 150,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    opacity: 0.95,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonRotating: {
    opacity: 0.6,
  },
  weatherHero: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  temperatureMainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    width: '100%',
  },
  weatherIcon: {
    marginRight: 12,
  },
  temperatureTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  temperature: {
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: -3,
    lineHeight: 78,
  },
  temperatureUnit: {
    fontSize: 28,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
    opacity: 0.9,
  },
  shimmerIcon: {
    marginBottom: 16,
  },
  shimmerTemp: {
    marginBottom: 12,
  },
  shimmerLocation: {
    marginTop: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 24,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  shimmerOverlayContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  errorCard: {
    width: '100%',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  errorIcon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: -0.5,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 56) / 2,
    borderRadius: 20,
    padding: 16,
    margin: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  detailRow: {
    marginVertical: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.3,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  recommendationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
