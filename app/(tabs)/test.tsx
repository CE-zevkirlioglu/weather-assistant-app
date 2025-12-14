import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ModernAlert } from '@/components/ui/modern-alert';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getWeatherPredictionManual, WeatherFeatures, WeatherResponse } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// InputField component'i dışarıda tanımla - klavye sorununu önlemek için
const InputField = React.memo(({ 
  label, 
  value, 
  onChange, 
  unit, 
  icon,
  colors
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  unit: string;
  icon: string;
  colors: typeof Colors['light'];
}) => {
  return (
    <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
      <View style={styles.inputHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.tint}15` }]}>
          <Ionicons name={icon as any} size={20} color={colors.tint} />
        </View>
        <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
          {label}
        </ThemedText>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.cardBorder, backgroundColor: colors.background }]}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="done"
          blurOnSubmit={false}
          editable={true}
          selectTextOnFocus={false}
          importantForAutofill="no"
          autoComplete="off"
          textContentType="none"
        />
        <ThemedText style={[styles.unit, { color: colors.textSecondary }]}>
          {unit}
        </ThemedText>
      </View>
    </View>
  );
});

export default function TestScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const scrollViewRef = useRef<ScrollView>(null);
  const resultsSectionRef = useRef<View>(null);

  // Input değerlerini string olarak tut (düzgün editing için)
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
      setResultsSectionY(null); // Yeni sonuçlar için pozisyonu sıfırla

      // Input değerlerini number'a çevir
      const numericFeatures: WeatherFeatures = {
        temp: parseFloat(inputValues.temp) || 0,
        humidity: parseFloat(inputValues.humidity) || 0,
        wind_speed: parseFloat(inputValues.wind_speed) || 0,
        pressure: parseFloat(inputValues.pressure) || 0,
        clouds: parseFloat(inputValues.clouds) || 0,
        uv_index: parseFloat(inputValues.uv_index) || 0,
      };

      const data = await getWeatherPredictionManual(numericFeatures);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Hava durumu tahmini alınamadı');
      showAlert(
        'Hata',
        err.message || 'Hava durumu tahmini alınamadı',
        'error',
        'Tamam'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Klavyeyi kapat
    Keyboard.dismiss();
    
    // Inputları varsayılan değerlere sıfırla
    setInputValues({
      temp: '20',
      humidity: '50',
      wind_speed: '10',
      pressure: '1013',
      clouds: '30',
      uv_index: '5',
    });
    
    // Response'u sıfırla
    setResult(null);
    setError(null);
    setResultsSectionY(null);
  };

  const updateInputValue = useCallback((key: keyof WeatherFeatures, value: string) => {
    // Sadece sayısal karakterlere izin ver (nokta ve eksi işareti dahil)
    // Boş string'e izin ver (silme işlemi için)
    const cleanedValue = value === '' ? '' : value.replace(/[^0-9.-]/g, '');
    
    // Sadece input values'ı güncelle (features submit ederken parse edilecek)
    setInputValues(prev => ({ ...prev, [key]: cleanedValue }));
  }, []);

  // Her input için ayrı callback oluştur (React.memo için stabil referans)
  const updateTemp = useCallback((value: string) => updateInputValue('temp', value), [updateInputValue]);
  const updateHumidity = useCallback((value: string) => updateInputValue('humidity', value), [updateInputValue]);
  const updateWindSpeed = useCallback((value: string) => updateInputValue('wind_speed', value), [updateInputValue]);
  const updatePressure = useCallback((value: string) => updateInputValue('pressure', value), [updateInputValue]);
  const updateClouds = useCallback((value: string) => updateInputValue('clouds', value), [updateInputValue]);
  const updateUvIndex = useCallback((value: string) => updateInputValue('uv_index', value), [updateInputValue]);

  // Sonuçlar geldiğinde ekranı yukarı kaydır
  useEffect(() => {
    if (result && !loading) {
      // Kısa bir gecikme sonrası scroll yap (render tamamlanması için)
      setTimeout(() => {
        if (resultsSectionY !== null) {
          // Sonuçlar bölümünün gerçek pozisyonunu kullan
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, resultsSectionY - 60), // Sonuçlar bölümünün başlangıcına, 60px üstten boşluk bırakarak kaydır
            animated: true,
          });
        } else {
          // Fallback: Eğer pozisyon henüz ölçülmediyse, büyük bir scroll değeri kullan
          scrollViewRef.current?.scrollTo({
            y: 800, // Tahmini pozisyon - sonuçlar bölümüne kadar kaydır
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
                  Manuel Test
                </ThemedText>
                <ThemedText style={[styles.headerSubtitle, { color: '#ffffff' }]} numberOfLines={1}>
                  Hava durumu verilerini manuel girin
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={handleReset}
                style={styles.resetButton}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={24} color="#ffffff" />
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
          {/* Input Fields */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.tint}15` }]}>
                <Ionicons name="thermometer-outline" size={24} color={colors.tint} />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Hava Durumu Verileri
              </ThemedText>
            </View>

            <InputField
              label="Sıcaklık"
              value={inputValues.temp}
              onChange={updateTemp}
              unit="°C"
              icon="thermometer-outline"
              colors={colors}
            />

            <InputField
              label="Nem"
              value={inputValues.humidity}
              onChange={updateHumidity}
              unit="%"
              icon="water-outline"
              colors={colors}
            />

            <InputField
              label="Rüzgar Hızı"
              value={inputValues.wind_speed}
              onChange={updateWindSpeed}
              unit="km/h"
              icon="leaf-outline"
              colors={colors}
            />

            <InputField
              label="Basınç"
              value={inputValues.pressure}
              onChange={updatePressure}
              unit="hPa"
              icon="speedometer-outline"
              colors={colors}
            />

            <InputField
              label="Bulutluluk"
              value={inputValues.clouds}
              onChange={updateClouds}
              unit="%"
              icon="cloud-outline"
              colors={colors}
            />

            <InputField
              label="UV İndeksi"
              value={inputValues.uv_index}
              onChange={updateUvIndex}
              unit=""
              icon="sunny-outline"
              colors={colors}
            />

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
                    Tahmin Al
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
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.success}15` }]}>
                  <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
                </View>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Sonuçlar
                </ThemedText>
              </View>

              {/* Recommendations - Direkt sonuçlar altında */}
              {result.recommendations.filter((rec) => rec.active).length > 0 ? (
                <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                  {result.recommendations
                    .filter((rec) => rec.active)
                    .map((rec) => (
                      <View key={rec.id} style={styles.recommendationItem}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <ThemedText style={[styles.recommendationText, { color: colors.text }]}>
                          {rec.message}
                        </ThemedText>
                      </View>
                    ))}
                </View>
              ) : (
                <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                  <ThemedText style={[styles.resultSummary, { color: colors.textSecondary }]}>
                    Bu hava durumu için özel bir öneri bulunmamaktadır.
                  </ThemedText>
                </View>
              )}

              {/* Predictions */}
              <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                <ThemedText style={[styles.resultTitle, { color: colors.text }]}>
                  Tahmin
                </ThemedText>
                <View style={styles.predictionRow}>
                  <ThemedText style={[styles.predictionLabel, { color: colors.textSecondary }]}>
                    Etiket:
                  </ThemedText>
                  <ThemedText style={[styles.predictionValue, { color: colors.text }]}>
                    {result.prediction.label}
                  </ThemedText>
                </View>
                <View style={styles.predictionRow}>
                  <ThemedText style={[styles.predictionLabel, { color: colors.textSecondary }]}>
                    Olasılık:
                  </ThemedText>
                  <ThemedText style={[styles.predictionValue, { color: colors.text }]}>
                    {(result.prediction.proba * 100).toFixed(1)}%
                  </ThemedText>
                </View>
              </View>

              {/* States */}
              <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                <ThemedText style={[styles.resultTitle, { color: colors.text }]}>
                  Durumlar
                </ThemedText>
                <View style={styles.statesGrid}>
                  {Object.entries(result.prediction.states).map(([key, value]) => (
                    <View key={key} style={styles.stateItem}>
                      <Ionicons 
                        name={value ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={value ? colors.success : colors.error} 
                      />
                      <ThemedText style={[styles.stateText, { color: colors.text }]}>
                        {key.replace('label_', '').replace('_', ' ')}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
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
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    minHeight: 110,
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
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  headerSubtitle: {
    fontSize: 16,
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
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  inputCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  unit: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 50,
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
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  resultSummary: {
    fontSize: 16,
    lineHeight: 24,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
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
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  recommendationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  statesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  stateText: {
    marginLeft: 6,
    fontSize: 14,
    textTransform: 'capitalize',
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
