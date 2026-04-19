import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ModernAlert } from '@/components/ui/modern-alert';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    getWeatherPredictionManual,
    RiskLevel,
    WeatherFeatures,
    WeatherResponse,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Easing,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Animated as RNAnimated,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CONTENT_HORIZONTAL_PADDING = 40;
const STAT_CARD_MARGIN = 6;
const STAT_CARD_WIDTH = Math.floor(
  (width - CONTENT_HORIZONTAL_PADDING - STAT_CARD_MARGIN * 4) / 2
);

/** Reset is synchronous; keep the icon spinning briefly so the motion reads clearly. */
const RESET_SPIN_MS = 480;

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

const MANUAL_INPUT_FIELDS: {
  key: keyof WeatherFeatures;
  label: string;
  unit: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: 'temp', label: 'Temperature', unit: '°C', icon: 'thermometer-outline' },
  { key: 'humidity', label: 'Humidity', unit: '%', icon: 'water-outline' },
  { key: 'wind_speed', label: 'Wind speed', unit: 'km/h', icon: 'leaf-outline' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', icon: 'speedometer-outline' },
  { key: 'clouds', label: 'Cloud cover', unit: '%', icon: 'cloud-outline' },
  { key: 'uv_index', label: 'UV index', unit: '', icon: 'sunny-outline' },
];

export default function TestScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const scrollViewRef = useRef<ScrollView>(null);
  const resultsSectionRef = useRef<View>(null);

  // Keep inputs as strings for smoother editing
  const [inputValues, setInputValues] = useState<Record<keyof WeatherFeatures, string>>({
    temp: '20',
    humidity: '50',
    wind_speed: '10',
    pressure: '1013',
    clouds: '30',
    uv_index: '5',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeatherResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [resultsSectionY, setResultsSectionY] = useState<number | null>(null);
  const [explainMode, setExplainMode] = useState(false);
  const [resetSpinning, setResetSpinning] = useState(false);
  const resetSpin = useRef(new RNAnimated.Value(0)).current;
  const resetSpinDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    buttonText?: string;
  }>({
    title: '',
    message: '',
    type: 'success',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
    buttonText?: string
  ) => {
    setAlertConfig({ title, message, type, buttonText });
    setAlertVisible(true);
  };

  const handleSubmit = async () => {
    // Klavyeyi kapat
    Keyboard.dismiss();

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setResultsSectionY(null); // Reset scroll anchor for new results

      // Parse inputs to numbers
      const numericFeatures: WeatherFeatures = {
        temp: parseFloat(inputValues.temp) || 0,
        humidity: parseFloat(inputValues.humidity) || 0,
        wind_speed: parseFloat(inputValues.wind_speed) || 0,
        pressure: parseFloat(inputValues.pressure) || 0,
        clouds: parseFloat(inputValues.clouds) || 0,
        uv_index: parseFloat(inputValues.uv_index) || 0,
      };

      const data = await getWeatherPredictionManual(numericFeatures, {
        explain: explainMode,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Could not get forecast');
      showAlert(
        'Error',
        err.message || 'Could not get forecast',
        'error',
        'OK'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    Keyboard.dismiss();

    if (resetSpinDoneTimerRef.current) {
      clearTimeout(resetSpinDoneTimerRef.current);
      resetSpinDoneTimerRef.current = null;
    }

    setResetSpinning(true);

    setInputValues({
      temp: '20',
      humidity: '50',
      wind_speed: '10',
      pressure: '1013',
      clouds: '30',
      uv_index: '5',
    });

    setResult(null);
    setError(null);
    setResultsSectionY(null);

    resetSpinDoneTimerRef.current = setTimeout(() => {
      setResetSpinning(false);
      resetSpinDoneTimerRef.current = null;
    }, RESET_SPIN_MS);
  };

  useEffect(() => {
    return () => {
      if (resetSpinDoneTimerRef.current) {
        clearTimeout(resetSpinDoneTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!resetSpinning) {
      resetSpin.setValue(0);
      return;
    }

    resetSpin.setValue(0);
    const loop = RNAnimated.loop(
      RNAnimated.timing(resetSpin, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();

    return () => {
      loop.stop();
      resetSpin.setValue(0);
    };
  }, [resetSpinning, resetSpin]);

  const resetSpinDeg = resetSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const updateInputValue = useCallback((key: keyof WeatherFeatures, value: string) => {
    // Allow digits, dot, minus; allow empty while deleting
    const cleanedValue = value === '' ? '' : value.replace(/[^0-9.-]/g, '');
    
    // Update raw strings; parse on submit
    setInputValues(prev => ({ ...prev, [key]: cleanedValue }));
  }, []);

  // Scroll toward results when they appear
  useEffect(() => {
    if (result && !loading) {
      // Brief delay so layout has settled
      setTimeout(() => {
        if (resultsSectionY !== null) {
          // Use measured results section Y
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, resultsSectionY - 60), // Align results ~60px below top
            animated: true,
          });
        } else {
          // Fallback before layout measurement
          scrollViewRef.current?.scrollTo({
            y: 800,
            animated: true,
          });
        }
      }, 500);
    }
  }, [result, loading, resultsSectionY]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={isDark ? ['#1e293b', '#0f172a'] : ['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerTitleContainer}>
                <ThemedText style={[styles.headerTitle, { color: '#ffffff' }]} numberOfLines={1}>
                  Manual test
                </ThemedText>
                <ThemedText style={[styles.headerSubtitle, { color: '#ffffff' }]} numberOfLines={1}>
                  Enter values and compare with the API response
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={handleReset}
                style={styles.resetButton}
                activeOpacity={0.7}
                disabled={resetSpinning}
              >
                <RNAnimated.View style={{ transform: [{ rotate: resetSpinDeg }] }}>
                  <Ionicons name="refresh-outline" size={24} color="#ffffff" />
                </RNAnimated.View>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            nestedScrollEnabled={true}
          >
          {/* Manual inputs — compact grouped form */}
          <View style={styles.section}>
            <View style={styles.manualSectionHeader}>
              <View style={[styles.manualSectionIconWrap, { backgroundColor: `${colors.tint}14` }]}>
                <Ionicons name="create-outline" size={22} color={colors.tint} />
              </View>
              <View style={styles.manualSectionTitles}>
                <ThemedText style={[styles.manualSectionTitle, { color: colors.text }]}>
                  Weather inputs
                </ThemedText>
                <ThemedText style={[styles.manualSectionSubtitle, { color: colors.textSecondary }]}>
                  One value per row — sent to the model on Run
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.manualFormCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              {MANUAL_INPUT_FIELDS.map((field, index) => {
                const showDivider = index < MANUAL_INPUT_FIELDS.length - 1;
                return (
                  <View
                    key={field.key}
                    style={[
                      styles.manualRow,
                      showDivider && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name={field.icon}
                      size={20}
                      color={colors.icon}
                      style={styles.manualRowIcon}
                    />
                    <ThemedText
                      style={[styles.manualRowLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {field.label}
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.manualInput,
                        {
                          color: colors.text,
                          borderBottomColor: colors.tint,
                        },
                      ]}
                      value={inputValues[field.key]}
                      onChangeText={(v) => updateInputValue(field.key, v)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      returnKeyType="done"
                      blurOnSubmit={false}
                      selectTextOnFocus
                      importantForAutofill="no"
                      autoComplete="off"
                      textContentType="none"
                    />
                    {field.unit ? (
                      <ThemedText style={[styles.manualUnit, { color: colors.textSecondary }]}>
                        {field.unit}
                      </ThemedText>
                    ) : (
                      <View style={styles.manualUnitSpacer} />
                    )}
                  </View>
                );
              })}
            </View>

            <View style={[styles.explainRow, { backgroundColor: colors.card }]}>
              <View style={styles.explainRowText}>
                <ThemedText style={[styles.explainLabel, { color: colors.text }]}>
                  Detailed explanation (explain)
                </ThemedText>
                <ThemedText style={[styles.explainHint, { color: colors.textSecondary }]}>
                  Sends ?explain=true to the API
                </ThemedText>
              </View>
              <Switch
                value={explainMode}
                onValueChange={setExplainMode}
                trackColor={{ false: colors.cardBorder, true: `${colors.tint}80` }}
                thumbColor={explainMode ? colors.tint : colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.tint }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.submitButtonText}>
                    Get forecast
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Results */}
          {result && (
            <Animated.View 
              ref={resultsSectionRef}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.section}
              onLayout={(event) => {
                const { y } = event.nativeEvent.layout;
                setResultsSectionY(y);
              }}
            >
              <View style={[styles.card, styles.overviewCard, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="grid-outline" size={22} color={colors.tint} />
                  <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
                    Forecast overview
                  </ThemedText>
                </View>

                <ThemedText style={[styles.summaryText, { color: colors.text }]}>
                  {result.summary}
                </ThemedText>

                {result.risk_summary ? (
                  <>
                    <View style={styles.overviewMetaGrid}>
                      <View style={[styles.overviewMetaCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <ThemedText style={[styles.overviewMetaLabel, { color: colors.textSecondary }]}>
                          Risk level
                        </ThemedText>
                        <ThemedText style={[styles.overviewMetaValue, { color: colors.text }]}>
                          {riskLevelLabelEn(result.risk_summary.risk_level)}
                        </ThemedText>
                      </View>
                      <View style={[styles.overviewMetaCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <ThemedText style={[styles.overviewMetaLabel, { color: colors.textSecondary }]}>
                          Risk score
                        </ThemedText>
                        <ThemedText style={[styles.overviewMetaValue, { color: colors.text }]}>
                          {(result.risk_summary.risk_score * 100).toFixed(0)}%
                        </ThemedText>
                      </View>
                    </View>

                    {result.risk_summary.risk_factors?.length > 0 ? (
                      <View style={styles.riskFactorsRow}>
                        {result.risk_summary.risk_factors.map((code) => (
                          <View
                            key={code}
                            style={[
                              styles.riskFactorChip,
                              {
                                borderColor: colors.cardBorder,
                                backgroundColor: colors.backgroundSecondary,
                              },
                            ]}
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

                {result.recommendations.filter((rec) => rec.active).length > 0 ? (
                  <View style={styles.recommendationsCompactList}>
                    {result.recommendations
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
                ) : (
                  <ThemedText style={[styles.noRecommendationsNote, { color: colors.textSecondary }]}>
                    No specific recommendations for these inputs.
                  </ThemedText>
                )}
              </View>

              <View style={styles.metricsSectionHeader}>
                <View style={styles.metricsSectionTitleWrap}>
                  <Ionicons name="analytics-outline" size={18} color={colors.textSecondary} />
                  <ThemedText style={[styles.metricsSectionTitle, { color: colors.text }]}>
                    Parameters sent to the model
                  </ThemedText>
                </View>
              </View>

              <View style={styles.compactStatsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${colors.tint}15` }]}>
                    <Ionicons name="thermometer-outline" size={20} color={colors.tint} />
                  </View>
                  <ThemedText style={[styles.statValue, { color: colors.text }]}>
                    {result.features.temp.toFixed(1)}°C
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
                    {result.features.humidity.toFixed(0)}%
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
                    {result.features.wind_speed.toFixed(0)}
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
                    {result.features.pressure.toFixed(0)}
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
                    {result.features.clouds.toFixed(0)}%
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
                    {result.features.uv_index.toFixed(1)}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    UV index
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="git-branch-outline" size={22} color={colors.tint} />
                  <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
                    Model output
                  </ThemedText>
                </View>

                <View style={styles.predictionRow}>
                  <ThemedText style={[styles.predictionLabel, { color: colors.textSecondary }]}>
                    Rain label
                  </ThemedText>
                  <ThemedText style={[styles.predictionValue, { color: colors.text }]}>
                    {result.label}
                  </ThemedText>
                </View>
                <View style={styles.predictionRow}>
                  <ThemedText style={[styles.predictionLabel, { color: colors.textSecondary }]}>
                    Probability
                  </ThemedText>
                  <ThemedText style={[styles.predictionValue, { color: colors.text }]}>
                    {result.proba != null ? `${(result.proba * 100).toFixed(1)}%` : '—'}
                  </ThemedText>
                </View>

                <ThemedText style={[styles.flagsSectionLabel, { color: colors.textSecondary }]}>
                  Flags
                </ThemedText>
                <View style={styles.flagChipRow}>
                  {Object.entries(result.states).map(([key, value]) => (
                    <View
                      key={key}
                      style={[
                        styles.flagChip,
                        {
                          borderColor: value ? `${colors.success}55` : `${colors.error}55`,
                          backgroundColor: value ? `${colors.success}12` : `${colors.error}10`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={value ? 'checkmark-circle' : 'close-circle'}
                        size={14}
                        color={value ? colors.success : colors.error}
                      />
                      <ThemedText style={[styles.flagChipText, { color: colors.text }]}>
                        {key.replace('label_', '').replace(/_/g, ' ')}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>

              {result.explanation?.per_label && result.explanation.per_label.length > 0 && (
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="list-outline" size={22} color={colors.tint} />
                    <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
                      Per-label explanation (explain)
                    </ThemedText>
                  </View>
                  {result.explanation.per_label.map((row) => (
                    <View key={row.label} style={styles.explainPerLabelRow}>
                      <ThemedText style={[styles.explainPerLabelTitle, { color: colors.text }]}>
                        {row.label}
                      </ThemedText>
                      <ThemedText style={[styles.explainPerLabelMeta, { color: colors.textSecondary }]}>
                        {(row.probability * 100).toFixed(1)}% · {row.confidence} ·{' '}
                        {row.predicted ? 'yes' : 'no'}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {/* Error */}
          {error && !loading && (
            <View style={[styles.errorCard, { backgroundColor: colors.card }]}>
              <Ionicons name="alert-circle-outline" size={24} color={colors.error} />
              <ThemedText style={[styles.errorText, { color: colors.text }]}>
                {error}
              </ThemedText>
            </View>
          )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Modern Alert */}
        <ModernAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttonText={alertConfig.buttonText}
          onClose={() => setAlertVisible(false)}
        />
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
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    minHeight: 100,
    justifyContent: 'flex-end',
  },
  headerContent: {
    width: '100%',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 32,
  },
  manualSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  manualSectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  manualSectionTitles: {
    flex: 1,
    minWidth: 0,
  },
  manualSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  manualSectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  manualFormCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  manualRowIcon: {
    width: 24,
    marginRight: 10,
  },
  manualRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  manualInput: {
    width: 82,
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 2,
    textAlign: 'right',
    borderBottomWidth: 2,
  },
  manualUnit: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 42,
  },
  manualUnitSpacer: {
    width: 42,
    marginLeft: 8,
  },
  explainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  explainRowText: {
    flex: 1,
    marginRight: 12,
  },
  explainLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  explainHint: {
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
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
  noRecommendationsNote: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
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
    marginBottom: 14,
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
  flagsSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flagChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  flagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginHorizontal: 4,
    marginBottom: 8,
    gap: 6,
  },
  flagChipText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  explainPerLabelRow: {
    marginBottom: 12,
  },
  explainPerLabelTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  explainPerLabelMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionLabel: {
    fontSize: 15,
  },
  predictionValue: {
    fontSize: 15,
    fontWeight: '700',
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
});
