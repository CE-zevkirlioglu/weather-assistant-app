import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Shimmer, ShimmerCard } from '@/components/ui/shimmer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getWeatherPrediction, RiskLevel, WeatherResponse } from '@/services/api';
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
    Easing,
    RefreshControl,
    Animated as RNAnimated,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/** Scroll content uses paddingHorizontal 20 + 20; stat cards use margin 6 on each side (×4 across a row). */
const CONTENT_HORIZONTAL_PADDING = 40;
const STAT_CARD_MARGIN = 6;
const STAT_CARD_WIDTH = Math.floor(
  (width - CONTENT_HORIZONTAL_PADDING - STAT_CARD_MARGIN * 4) / 2
);

function riskLevelLabelEn(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    very_high: 'Very high',
  };
  return map[level] ?? level;
}

function riskFactorLabelEn(code: string): string {
  const map: Record<string, string> = {
    rain: 'Rain',
    cold: 'Cold',
    heat: 'Heat',
    uv: 'UV',
    wind: 'Wind',
  };
  return map[code] ?? code;
}

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

  const refreshSpin = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!loading && !refreshing) {
      refreshSpin.setValue(0);
      return;
    }

    refreshSpin.setValue(0);
    const loop = RNAnimated.loop(
      RNAnimated.timing(refreshSpin, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();

    return () => {
      loop.stop();
      refreshSpin.setValue(0);
    };
  }, [loading, refreshing, refreshSpin]);

  const refreshSpinDeg = refreshSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    // Fetch weather as soon as the screen mounts
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

  // When the screen gains focus, detect city changes and refresh
  useFocusEffect(
    React.useCallback(() => {
      const checkCityChange = async () => {
        const currentTimestamp = await getCityChangeTimestamp();
        
        // On first load, record the timestamp
        if (lastCityChangeTimestamp.current === null) {
          lastCityChangeTimestamp.current = currentTimestamp;
          return;
        }
        
        // Refresh if the city changed
        if (currentTimestamp && currentTimestamp !== lastCityChangeTimestamp.current) {
          lastCityChangeTimestamp.current = currentTimestamp;
          loadWeatherData();
        }
      };
      
      checkCityChange();
    }, [])
  );

  // Initial load — fast path
  const loadWeatherDataInitial = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prefer the selected city if set
      const selectedCity = await getSelectedCity();
      
      if (selectedCity) {
        // Use coordinates from the saved city
        const data = await getWeatherPrediction(selectedCity.latitude, selectedCity.longitude);
        setWeatherData(data);
        setLocationPermission(true); // Treat saved city as valid location context
        setLoading(false);
        return;
      }

      // Request permission before resolving GPS
      const hasPermission = await checkLocationPermission();
      setLocationPermission(hasPermission);
      
      if (!hasPermission) {
        // Prompt if permission is missing
        const granted = await requestLocationPermission();
        setLocationPermission(granted);
        if (!granted) {
          setError('Location permission is required. Enable it in Settings or pick a city.');
          setLoading(false);
          return;
        }
      }

      // Fast location (may use cache)
      const location = await getCurrentLocationFast();
      if (!location) {
        throw new Error('Could not get location');
      }

      // Fetch prediction from API
      const data = await getWeatherPrediction(location.latitude, location.longitude);
      setWeatherData(data);
    } catch (err: any) {
      setError(err.message || 'Could not load weather');
      console.error('Error loading weather:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pull-to-refresh / explicit reload
  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prefer the selected city if set
      const selectedCity = await getSelectedCity();
      
      if (selectedCity) {
        // Use coordinates from the saved city
        const data = await getWeatherPrediction(selectedCity.latitude, selectedCity.longitude);
        setWeatherData(data);
        setLoading(false);
        return;
      }

      const location = await getCurrentLocationFast();
      if (!location) {
        throw new Error('Could not get location');
      }

      const data = await getWeatherPrediction(location.latitude, location.longitude);
      setWeatherData(data);
    } catch (err: any) {
      setError(err.message || 'Could not load weather');
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
        {/* Compact hero header */}
        <LinearGradient
          colors={isDark ? ['#1e293b', '#0f172a'] : ['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.header}>
            <ThemedText style={[styles.appTitle, { color: '#ffffff' }]}>
              Weather Assistant
            </ThemedText>
            <TouchableOpacity 
              onPress={handleRetry} 
              style={styles.refreshButton}
              activeOpacity={0.7}
              disabled={loading || refreshing}
            >
              <RNAnimated.View style={{ transform: [{ rotate: refreshSpinDeg }] }}>
                <Ionicons name="refresh" size={22} color="#ffffff" />
              </RNAnimated.View>
            </TouchableOpacity>
          </View>

          {/* Weather display */}
          {loading ? (
            // Loading — shimmer placeholders
            <View style={styles.weatherHero}>
              <View style={styles.heroMainRow}>
                <Shimmer width={72} height={72} borderRadius={36} style={styles.shimmerIcon} />
                <View style={styles.heroTextBlock}>
                  <Shimmer width={136} height={46} borderRadius={12} style={styles.shimmerTemp} />
                  <Shimmer width={168} height={18} borderRadius={10} style={styles.shimmerLocation} />
                </View>
              </View>
            </View>
          ) : weatherData ? (
            // Loaded weather hero
            <Animated.View 
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.weatherHero}
            >
              <View style={styles.heroMainRow}>
                <View style={styles.heroIconBadge}>
                  <Ionicons 
                    name={getWeatherIcon(weatherData.meta.condition)} 
                    size={42} 
                    color="#ffffff" 
                  />
                </View>
                <View style={styles.heroTextBlock}>
                  <View style={styles.temperatureMainContainer}>
                    <View style={styles.temperatureValueGroup}>
                      <ThemedText style={[styles.temperature, { color: '#ffffff' }]}>
                        {weatherData.features.temp.toFixed(0)}
                      </ThemedText>
                      <ThemedText style={[styles.temperatureUnit, { color: '#ffffff' }]}>
                        °C
                      </ThemedText>
                    </View>
                    {weatherData.meta.location_name ? (
                      <View style={styles.locationInlineContainer}>
                        <Ionicons name="location" size={12} color="#ffffff" />
                        <ThemedText style={styles.locationInlineText} numberOfLines={1}>
                          {weatherData.meta.location_name}
                          {weatherData.meta.location_country ? `, ${weatherData.meta.location_country}` : ''}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  <ThemedText style={[styles.heroConditionText, { color: 'rgba(255,255,255,0.88)' }]} numberOfLines={1}>
                    {weatherData.meta.condition || 'Current conditions'}
                  </ThemedText>
                </View>
              </View>
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
                  <ThemedText style={styles.retryButtonText}>Try again</ThemedText>
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
              <View style={styles.compactStatsGrid}>
                {[1, 2, 3, 4].map((i) => (
                  <ShimmerCard key={i} style={{ width: STAT_CARD_WIDTH, margin: STAT_CARD_MARGIN }}>
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
              <View style={[styles.card, styles.overviewCard, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="grid-outline" size={22} color={colors.tint} />
                  <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
                    Today at a glance
                  </ThemedText>
                </View>

                {weatherData.summary ? (
                  <ThemedText style={[styles.summaryText, { color: colors.text }]}>
                    {weatherData.summary}
                  </ThemedText>
                ) : null}

                {weatherData.risk_summary ? (
                  <>
                    <View style={styles.overviewMetaGrid}>
                      <View style={[styles.overviewMetaCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <ThemedText style={[styles.overviewMetaLabel, { color: colors.textSecondary }]}>
                          Risk level
                        </ThemedText>
                        <ThemedText style={[styles.overviewMetaValue, { color: colors.text }]}>
                          {riskLevelLabelEn(weatherData.risk_summary.risk_level)}
                        </ThemedText>
                      </View>
                      <View style={[styles.overviewMetaCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <ThemedText style={[styles.overviewMetaLabel, { color: colors.textSecondary }]}>
                          Risk score
                        </ThemedText>
                        <ThemedText style={[styles.overviewMetaValue, { color: colors.text }]}>
                          {(weatherData.risk_summary.risk_score * 100).toFixed(0)}%
                        </ThemedText>
                      </View>
                    </View>

                    {weatherData.risk_summary.risk_factors?.length > 0 ? (
                      <View style={styles.riskFactorsRow}>
                        {weatherData.risk_summary.risk_factors.map((code) => (
                          <View
                            key={code}
                            style={[styles.riskFactorChip, { borderColor: colors.cardBorder, backgroundColor: colors.backgroundSecondary }]}
                          >
                            <ThemedText style={[styles.riskFactorChipText, { color: colors.text }]}>
                              {riskFactorLabelEn(code)}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </>
                ) : null}

                {weatherData.recommendations.filter((rec) => rec.active).length > 0 ? (
                  <View style={styles.recommendationsCompactList}>
                    {weatherData.recommendations
                      .filter((rec) => rec.active)
                      .map((rec) => (
                        <View key={rec.id} style={styles.recommendationItem}>
                          <View style={[styles.recommendationIcon, { backgroundColor: `${colors.success}15` }]}>
                            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                          </View>
                          <ThemedText style={[styles.recommendationText, { color: colors.text }]}>
                            {rec.message}
                          </ThemedText>
                        </View>
                      ))}
                  </View>
                ) : null}
              </View>

              <View style={styles.metricsSectionHeader}>
                <View style={styles.metricsSectionTitleWrap}>
                  <Ionicons name="analytics-outline" size={18} color={colors.textSecondary} />
                  <ThemedText style={[styles.metricsSectionTitle, { color: colors.text }]}>
                    Weather parameters
                  </ThemedText>
                </View>
              </View>

              <View style={styles.compactStatsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${colors.tint}15` }]}>
                    <Ionicons name="thermometer-outline" size={20} color={colors.tint} />
                  </View>
                  <ThemedText style={[styles.statValue, { color: colors.text }]}>
                    {weatherData.features.temp.toFixed(1)}°C
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Temperature
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="water-outline" size={20} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.statValue, { color: colors.text }]}>
                    {weatherData.features.humidity.toFixed(0)}%
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Humidity
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${colors.secondary}15` }]}>
                    <Ionicons name="leaf-outline" size={20} color={colors.secondary} />
                  </View>
                  <ThemedText style={[styles.statValue, { color: colors.text }]}>
                    {weatherData.features.wind_speed.toFixed(0)}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Wind (km/h)
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${colors.accent}15` }]}>
                    <Ionicons name="speedometer-outline" size={20} color={colors.accent} />
                  </View>
                  <ThemedText style={[styles.statValue, { color: colors.text }]}>
                    {weatherData.features.pressure.toFixed(0)}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Pressure (hPa)
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${colors.textSecondary}15` }]}>
                    <Ionicons name="cloud-outline" size={20} color={colors.textSecondary} />
                  </View>
                  <ThemedText style={[styles.statValue, { color: colors.text }]}>
                    {weatherData.features.clouds.toFixed(0)}%
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Cloud cover
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${colors.warning}15` }]}>
                    <Ionicons name="sunny-outline" size={20} color={colors.warning} />
                  </View>
                  <ThemedText style={[styles.statValue, { color: colors.text }]}>
                    {weatherData.features.uv_index.toFixed(1)}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    UV index
                  </ThemedText>
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
    paddingBottom: 14,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    minHeight: 112,
    justifyContent: 'flex-end',
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
  weatherHero: {
    gap: 10,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  temperatureMainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    width: '100%',
    gap: 10,
  },
  temperatureValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  temperature: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.8,
    lineHeight: 48,
  },
  temperatureUnit: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
    opacity: 0.9,
  },
  heroConditionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  shimmerIcon: {
    marginRight: 14,
  },
  shimmerTemp: {
    marginBottom: 8,
  },
  shimmerLocation: {
    marginTop: 0,
  },
  locationInlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    maxWidth: '58%',
  },
  locationInlineText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
    paddingTop: 16,
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
  overviewCard: {
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: -0.5,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  overviewMetaGrid: {
    flexDirection: 'row',
    marginTop: 14,
    marginHorizontal: -5,
  },
  overviewMetaCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 16,
    padding: 14,
  },
  overviewMetaLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  overviewMetaValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  riskFactorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -4,
  },
  riskFactorChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  riskFactorChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recommendationsCompactList: {
    marginTop: 10,
  },
  metricsSectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  metricsSectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricsSectionTitle: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
  },
  compactStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -STAT_CARD_MARGIN,
    marginBottom: 10,
  },
  statCard: {
    width: STAT_CARD_WIDTH,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    margin: STAT_CARD_MARGIN,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 3,
    letterSpacing: -0.5,
    width: '100%',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  recommendationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
