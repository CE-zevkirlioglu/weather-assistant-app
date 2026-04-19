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
    View,
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
            'Permission required',
            'Allow notifications in system settings to receive daily updates.\n\nNote: Notifications are limited in Expo Go.',
            'warning',
            'OK'
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
          'Notifications on',
          `Daily notification scheduled for ${formatTime(notificationTime)}.`,
          'success',
          'Great!'
        );
      } else {
        showAlert(
          'Notifications off',
          'Daily notifications have been disabled.',
          'info',
          'OK'
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showAlert(
        'Error',
        'Could not update notification settings. Use a development build for full notification support.',
        'error',
        'OK'
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
      // iOS: persist when Done is tapped
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
          'Saved',
          `Notification time updated to ${formatTime(selectedTime)}.`,
          'success',
          'Great!'
        );
      } catch (error) {
        console.error('Error updating notification time:', error);
        showAlert(
          'Error',
          'Could not update notification time. Please try again.',
          'error',
          'OK'
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
      'City selected',
      `${city.name}, ${city.country} is now used for weather.`,
      'success',
      'OK'
    );
  };

  const handleRemoveCity = async () => {
    await saveSelectedCity(null);
    setSelectedCityState(null);
    showAlert(
      'City cleared',
      'Weather will use your device location.',
      'info',
      'OK'
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
              Settings
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: '#ffffff' }]} numberOfLines={2}>
              Notifications, location, and app info
            </ThemedText>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Notifications */}
          <View style={styles.section}>
            <View style={styles.sectionIntro}>
              <View style={[styles.sectionIntroIcon, { backgroundColor: `${colors.tint}14` }]}>
                <Ionicons name="notifications-outline" size={22} color={colors.tint} />
              </View>
              <View style={styles.sectionIntroText}>
                <ThemedText style={[styles.sectionIntroTitle, { color: colors.text }]}>
                  Notifications
                </ThemedText>
                <ThemedText style={[styles.sectionIntroSubtitle, { color: colors.textSecondary }]}>
                  Daily summary at the time you choose
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.groupCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.groupRow}>
                <View style={styles.groupRowLabelBlock}>
                  <ThemedText style={[styles.groupRowTitle, { color: colors.text }]}>
                    Daily notifications
                  </ThemedText>
                  <ThemedText style={[styles.groupRowHint, { color: colors.textSecondary }]}>
                    Weather summary once per day
                  </ThemedText>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: colors.cardBorder, true: `${colors.tint}80` }}
                  thumbColor={notificationsEnabled ? colors.tint : colors.textSecondary}
                  ios_backgroundColor={colors.cardBorder}
                />
              </View>

              {notificationsEnabled && (
                <>
                  <View
                    style={[
                      styles.groupDivider,
                      { backgroundColor: colors.cardBorder },
                    ]}
                  />
                  <TouchableOpacity
                    style={styles.groupRowTouchable}
                    onPress={() => setShowTimePicker(true)}
                    activeOpacity={0.65}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.icon} />
                    <View style={styles.groupRowMiddle}>
                      <ThemedText style={[styles.groupRowMeta, { color: colors.textSecondary }]}>
                        Notification time
                      </ThemedText>
                      <ThemedText style={[styles.groupRowValue, { color: colors.text }]}>
                        {formatTime(notificationTime)}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {showTimePicker && Platform.OS === 'ios' && (
              <View
                style={[
                  styles.timePickerContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={[styles.timePickerHeader, { borderBottomColor: colors.cardBorder }]}>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(false)}
                    style={styles.timePickerCancelButton}
                  >
                    <ThemedText style={[styles.timePickerButtonText, { color: colors.textSecondary }]}>
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={[styles.timePickerTitle, { color: colors.text }]}>
                    Pick a time
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => {
                      handleTimeChange('save', notificationTime);
                    }}
                    style={styles.timePickerDoneButton}
                  >
                    <ThemedText style={[styles.timePickerButtonText, { color: colors.tint }]}>
                      Done
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

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.sectionIntro}>
              <View style={[styles.sectionIntroIcon, { backgroundColor: `${colors.tint}14` }]}>
                <Ionicons name="location-outline" size={22} color={colors.tint} />
              </View>
              <View style={styles.sectionIntroText}>
                <ThemedText style={[styles.sectionIntroTitle, { color: colors.text }]}>
                  Location
                </ThemedText>
                <ThemedText style={[styles.sectionIntroSubtitle, { color: colors.textSecondary }]}>
                  Pick a city or use device GPS
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.groupCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.locationSummaryBlock}>
                <ThemedText style={[styles.groupRowTitle, { color: colors.text }]}>
                  Weather location
                </ThemedText>
                <ThemedText style={[styles.locationSummaryText, { color: colors.textSecondary }]}>
                  {selectedCity
                    ? `${selectedCity.name}, ${selectedCity.country}`
                    : 'Using device location'}
                </ThemedText>
              </View>

              <View
                style={[
                  styles.groupDivider,
                  { backgroundColor: colors.cardBorder },
                ]}
              />

              <TouchableOpacity
                style={styles.groupRowTouchable}
                onPress={() => setShowCityPicker(true)}
                activeOpacity={0.65}
              >
                <Ionicons name="map-outline" size={20} color={colors.icon} />
                <View style={styles.groupRowMiddle}>
                  <ThemedText style={[styles.groupRowTitle, { color: colors.text }]}>
                    {selectedCity ? 'Change city' : 'Choose city'}
                  </ThemedText>
                  <ThemedText style={[styles.groupRowHint, { color: colors.textSecondary }]}>
                    Browse countries and cities
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {selectedCity ? (
                <>
                  <View
                    style={[
                      styles.groupDivider,
                      { backgroundColor: colors.cardBorder },
                    ]}
                  />
                  <TouchableOpacity
                    style={styles.groupRowTouchable}
                    onPress={handleRemoveCity}
                    activeOpacity={0.65}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                    <View style={styles.groupRowMiddle}>
                      <ThemedText style={[styles.groupRowTitle, { color: colors.error }]}>
                        Clear city selection
                      </ThemedText>
                      <ThemedText style={[styles.groupRowHint, { color: colors.textSecondary }]}>
                        Fall back to device location
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <View style={styles.sectionIntro}>
              <View style={[styles.sectionIntroIcon, { backgroundColor: `${colors.tint}14` }]}>
                <Ionicons name="information-circle-outline" size={22} color={colors.tint} />
              </View>
              <View style={styles.sectionIntroText}>
                <ThemedText style={[styles.sectionIntroTitle, { color: colors.text }]}>
                  About
                </ThemedText>
                <ThemedText style={[styles.sectionIntroSubtitle, { color: colors.textSecondary }]}>
                  App version and summary
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.groupCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.aboutVersionRow}>
                <ThemedText style={[styles.aboutLabel, { color: colors.textSecondary }]}>
                  Version
                </ThemedText>
                <ThemedText style={[styles.aboutVersionValue, { color: colors.text }]}>
                  1.0.0
                </ThemedText>
              </View>
              <View
                style={[
                  styles.groupDivider,
                  { backgroundColor: colors.cardBorder },
                ]}
              />
              <View style={styles.aboutDescriptionBlock}>
                <ThemedText style={[styles.aboutBody, { color: colors.text }]}>
                  Check current conditions, risk levels, and tailored recommendations with Weather Assistant.
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
            <View
              style={[
                styles.modalHeader,
                { backgroundColor: colors.card, borderBottomColor: colors.cardBorder },
              ]}
            >
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
                {selectedCountry ? 'Choose city' : 'Choose country'}
              </ThemedText>
              <View style={styles.modalCloseButton} />
            </View>

            {selectedCountry && (
              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search cities..."
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
                style={[
                  styles.backButton,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => {
                  setSelectedCountry(null);
                  setCitySearchQuery('');
                }}
              >
                <Ionicons name="arrow-back" size={20} color={colors.tint} />
                <ThemedText style={[styles.backButtonText, { color: colors.tint }]}>
                  Back to countries
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
                    style={[
                      styles.countryItem,
                      { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    ]}
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
                      style={[
                        styles.cityItem,
                        { backgroundColor: colors.card, borderColor: colors.cardBorder },
                      ]}
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
                      No cities found
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
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.92,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  sectionIntroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionIntroText: {
    flex: 1,
    minWidth: 0,
  },
  sectionIntroTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  sectionIntroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  groupCard: {
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
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  groupRowLabelBlock: {
    flex: 1,
    marginRight: 14,
    minWidth: 0,
  },
  groupRowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  groupRowHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  groupDivider: {
    height: StyleSheet.hairlineWidth,
  },
  groupRowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 56,
    gap: 10,
  },
  groupRowMiddle: {
    flex: 1,
    minWidth: 0,
  },
  groupRowMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 3,
  },
  groupRowValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  locationSummaryBlock: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  locationSummaryText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  aboutVersionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  aboutLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  aboutVersionValue: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  aboutDescriptionBlock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  aboutBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  timePickerContainer: {
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    paddingTop: 10,
    paddingBottom: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  timePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  timePickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
    paddingTop: 12,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cityItemContent: {
    flex: 1,
    marginRight: 12,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  cityCountry: {
    fontSize: 13,
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
