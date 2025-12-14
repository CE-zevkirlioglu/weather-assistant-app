import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ModernAlert } from '@/components/ui/modern-alert';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CityData, getCitiesByCountryName, getCountries, getSelectedCity, saveSelectedCity } from '@/services/city';
import {
    cancelAllNotifications,
    getNotificationTime,
    isNotificationEnabled,
    requestNotificationPermissions,
    scheduleDailyNotification,
    setNotificationEnabled,
} from '@/services/notifications';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [selectedCity, setSelectedCityState] = useState<CityData | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState('');
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

  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
    buttonText?: string
  ) => {
    setAlertConfig({ title, message, type, buttonText });
    setAlertVisible(true);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const enabled = await isNotificationEnabled();
      setNotificationsEnabledState(enabled);

      const time = await getNotificationTime();
      if (time) {
        const date = new Date();
        date.setHours(time.hour);
        date.setMinutes(time.minute);
        setNotificationTime(date);
      }

      const city = await getSelectedCity();
      setSelectedCityState(city);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    try {
      if (value) {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          showAlert(
            'İzin Gerekli',
            'Bildirim gönderebilmek için bildirim izni gereklidir. Lütfen ayarlardan izin verin.\n\nNot: Expo Go\'da bildirimler tam olarak desteklenmez.',
            'warning',
            'Anladım'
          );
          return;
        }

        if (!(await getNotificationTime())) {
          const defaultTime = new Date();
          defaultTime.setHours(8);
          defaultTime.setMinutes(0);
          setNotificationTime(defaultTime);
          await scheduleDailyNotification(8, 0);
        } else {
          await scheduleDailyNotification(notificationTime.getHours(), notificationTime.getMinutes());
        }
      } else {
        await cancelAllNotifications();
      }

      await setNotificationEnabled(value);
      setNotificationsEnabledState(value);
      
      // Success feedback
      if (value) {
        showAlert(
          'Bildirimler Aktif',
          `Günlük bildirimler ${formatTime(notificationTime)} saatinde gönderilecek.`,
          'success',
          'Harika!'
        );
      } else {
        showAlert(
          'Bildirimler Kapatıldı',
          'Günlük bildirimler devre dışı bırakıldı.',
          'info',
          'Tamam'
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showAlert(
        'Hata',
        'Bildirim ayarı değiştirilemedi. Expo Go\'da bildirimler tam olarak desteklenmez. Development build kullanmanız önerilir.',
        'error',
        'Anladım'
      );
    }
  };

  const handleTimeChange = async (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedTime) {
        await saveNotificationTime(selectedTime);
      }
    } else {
      // iOS için manuel kaydetme (Tamam butonuna basıldığında)
      if (event === 'save' && selectedTime) {
        await saveNotificationTime(selectedTime);
      }
    }
  };

  const saveNotificationTime = async (selectedTime: Date) => {
    setNotificationTime(selectedTime);
    setShowTimePicker(false);
    
    if (notificationsEnabled) {
      try {
        await scheduleDailyNotification(
          selectedTime.getHours(),
          selectedTime.getMinutes()
        );
        
        // Modern success alert
        showAlert(
          'Başarılı',
          `Bildirim saati ${formatTime(selectedTime)} olarak güncellendi.`,
          'success',
          'Harika!'
        );
      } catch (error) {
        console.error('Error updating notification time:', error);
        showAlert(
          'Hata',
          'Bildirim saati güncellenemedi. Lütfen tekrar deneyin.',
          'error',
          'Tamam'
        );
      }
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleCitySelect = async (city: CityData) => {
    await saveSelectedCity(city);
    setSelectedCityState(city);
    setShowCityPicker(false);
    setSelectedCountry(null);
    setCitySearchQuery('');
    showAlert(
      'Şehir Seçildi',
      `${city.name}, ${city.country} seçildi. Hava durumu bu şehir için gösterilecek.`,
      'success',
      'Tamam'
    );
  };

  const handleRemoveCity = async () => {
    await saveSelectedCity(null);
    setSelectedCityState(null);
    showAlert(
      'Şehir Kaldırıldı',
      'Konum tabanlı hava durumu kullanılacak.',
      'info',
      'Tamam'
    );
  };

  const countries = getCountries();
  const cities = selectedCountry 
    ? getCitiesByCountryName(selectedCountry)
    : [];

  const filteredCities = citySearchQuery
    ? cities.filter(city => 
        city.name.toLowerCase().includes(citySearchQuery.toLowerCase())
      )
    : cities;

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
            <ThemedText style={[styles.headerTitle, { color: '#ffffff' }]} numberOfLines={1}>
              Ayarlar
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: '#ffffff' }]} numberOfLines={1}>
              Uygulama tercihlerinizi yönetin
            </ThemedText>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Notification Settings Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.tint}15` }]}>
                <Ionicons name="notifications-outline" size={24} color={colors.tint} />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Bildirimler
              </ThemedText>
            </View>

            <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
              <View style={styles.settingContent}>
                <View style={styles.settingInfo}>
                  <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
                    Günlük Bildirimler
                  </ThemedText>
                  <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Her gün seçilen saatte hava durumu bildirimi alın
                  </ThemedText>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ 
                    false: isDark ? '#475569' : '#cbd5e1', 
                    true: colors.tint 
                  }}
                  thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
                  ios_backgroundColor={isDark ? '#475569' : '#cbd5e1'}
                />
              </View>
            </View>

            {notificationsEnabled && (
              <TouchableOpacity
                style={[styles.timePickerCard, { backgroundColor: colors.card }]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.timeIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="time-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.timePickerContent}>
                  <ThemedText style={[styles.timePickerLabel, { color: colors.textSecondary }]}>
                    Bildirim Saati
                  </ThemedText>
                  <ThemedText style={[styles.timePickerValue, { color: colors.text }]}>
                    {formatTime(notificationTime)}
                  </ThemedText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}

            {showTimePicker && Platform.OS === 'ios' && (
              <View style={[styles.timePickerContainer, { backgroundColor: colors.card }]}>
                <View style={styles.timePickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(false)}
                    style={styles.timePickerCancelButton}
                  >
                    <ThemedText style={[styles.timePickerButtonText, { color: colors.textSecondary }]}>
                      İptal
                    </ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={[styles.timePickerTitle, { color: colors.text }]}>
                    Saat Seç
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => {
                      handleTimeChange('save', notificationTime);
                    }}
                    style={styles.timePickerDoneButton}
                  >
                    <ThemedText style={[styles.timePickerButtonText, { color: colors.tint }]}>
                      Tamam
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={notificationTime}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={(event, selectedTime) => {
                    if (selectedTime) {
                      setNotificationTime(selectedTime);
                    }
                  }}
                  textColor={colors.text}
                />
              </View>
            )}
            {showTimePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={notificationTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>

          {/* Location Settings Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.accent}15` }]}>
                <Ionicons name="location-outline" size={24} color={colors.accent} />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Konum
              </ThemedText>
            </View>

            <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
              <View style={styles.settingContent}>
                <View style={styles.settingInfo}>
                  <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
                    Şehir Seçimi
                  </ThemedText>
                  <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {selectedCity 
                      ? `${selectedCity.name}, ${selectedCity.country} seçili`
                      : 'Konum tabanlı hava durumu kullanılıyor'}
                  </ThemedText>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.cityPickerCard, { backgroundColor: colors.card }]}
              onPress={() => setShowCityPicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.cityIconContainer, { backgroundColor: `${colors.accent}15` }]}>
                <Ionicons name="map-outline" size={24} color={colors.accent} />
              </View>
              <View style={styles.cityPickerContent}>
                <ThemedText style={[styles.cityPickerLabel, { color: colors.textSecondary }]}>
                  {selectedCity ? 'Şehri Değiştir' : 'Şehir Seç'}
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {selectedCity && (
              <TouchableOpacity
                style={[styles.removeCityCard, { backgroundColor: colors.card }]}
                onPress={handleRemoveCity}
                activeOpacity={0.7}
              >
                <View style={[styles.removeIconContainer, { backgroundColor: `${colors.error}15` }]}>
                  <Ionicons name="close-circle-outline" size={24} color={colors.error} />
                </View>
                <View style={styles.cityPickerContent}>
                  <ThemedText style={[styles.removeCityLabel, { color: colors.error }]}>
                    Şehir Seçimini Kaldır
                  </ThemedText>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* App Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.secondary}15` }]}>
                <Ionicons name="information-circle-outline" size={24} color={colors.secondary} />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Uygulama Bilgisi
              </ThemedText>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Versiyon
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                  1.0.0
                </ThemedText>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <View style={styles.infoColumn}>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
                  Açıklama
                </ThemedText>
                <ThemedText style={[styles.infoDescription, { color: colors.text }]}>
                  Hava durumu asistanı uygulaması ile güncel hava durumu bilgilerine erişin ve öneriler alın.
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Footer Spacing */}
          <View style={styles.footer} />
        </ScrollView>

        {/* Modern Alert */}
        <ModernAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttonText={alertConfig.buttonText}
          onClose={() => setAlertVisible(false)}
        />

        {/* City Picker Modal */}
        <Modal
          visible={showCityPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowCityPicker(false);
            setSelectedCountry(null);
            setCitySearchQuery('');
          }}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                onPress={() => {
                  setShowCityPicker(false);
                  setSelectedCountry(null);
                  setCitySearchQuery('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                {selectedCountry ? 'Şehir Seç' : 'Ülke Seç'}
              </ThemedText>
              <View style={styles.modalCloseButton} />
            </View>

            {selectedCountry && (
              <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Şehir ara..."
                  placeholderTextColor={colors.textSecondary}
                  value={citySearchQuery}
                  onChangeText={setCitySearchQuery}
                />
                {citySearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setCitySearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {selectedCountry && (
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: colors.card }]}
                onPress={() => {
                  setSelectedCountry(null);
                  setCitySearchQuery('');
                }}
              >
                <Ionicons name="arrow-back" size={20} color={colors.tint} />
                <ThemedText style={[styles.backButtonText, { color: colors.tint }]}>
                  Ülkelere Dön
                </ThemedText>
              </TouchableOpacity>
            )}

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
            >
              {!selectedCountry ? (
                // Country List
                countries.map((country) => (
                  <TouchableOpacity
                    key={country}
                    style={[styles.countryItem, { backgroundColor: colors.card }]}
                    onPress={() => setSelectedCountry(country)}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={[styles.countryName, { color: colors.text }]}>
                      {country}
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))
              ) : (
                // City List
                filteredCities.length > 0 ? (
                  filteredCities.map((city) => (
                    <TouchableOpacity
                      key={`${city.name}-${city.country}`}
                      style={[styles.cityItem, { backgroundColor: colors.card }]}
                      onPress={() => handleCitySelect(city)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cityItemContent}>
                        <ThemedText style={[styles.cityName, { color: colors.text }]}>
                          {city.name}
                        </ThemedText>
                        <ThemedText style={[styles.cityCountry, { color: colors.textSecondary }]}>
                          {city.country}
                        </ThemedText>
                      </View>
                      {selectedCity?.name === city.name && selectedCity?.country === city.country && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                    <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Şehir bulunamadı
                    </ThemedText>
                  </View>
                )
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
  settingCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  settingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  timePickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  timeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timePickerContent: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  timePickerValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timePickerContainer: {
    borderRadius: 20,
    marginTop: 12,
    paddingTop: 12,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  timePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  timePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timePickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoColumn: {
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    height: 40,
  },
  cityPickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cityPickerContent: {
    flex: 1,
  },
  cityPickerLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  removeCityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  removeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  removeCityLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  countryName: {
    fontSize: 17,
    fontWeight: '600',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cityItemContent: {
    flex: 1,
  },
  cityName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  cityCountry: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
