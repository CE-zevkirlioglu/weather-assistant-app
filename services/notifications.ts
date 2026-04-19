import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getWeatherPrediction } from './api';
import { getSelectedCity } from './city';
import { getCurrentLocation } from './location';

const NOTIFICATION_TIME_KEY = 'notification_time';
const NOTIFICATION_ENABLED_KEY = 'notification_enabled';

// Notification handler (may behave differently in Expo Go)
// When the daily trigger fires, fetch fresh data from the API
try {
  // Track notifications emitted from this handler to avoid duplicate processing
  let processingNotificationId: string | null = null;
  let lastProcessedTime: number = 0;
  const PROCESSING_COOLDOWN = 5000; // Debounce duplicate deliveries within 5 seconds
  
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Notifications we schedule from inside the handler must not loop back through fetch logic
      const isFromHandler = notification.request.content.data?.fromHandler === true;
      
      // Skip if we're already handling this identifier (prevents double handling on iOS)
      if (processingNotificationId === notification.request.identifier) {
        return {
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }
      
      // Ignore rapid duplicate deliveries for the same identifier
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
      
      // Daily trigger that should fetch fresh weather before showing anything
      if (notification.request.content.data?.type === 'weather_update' && 
          notification.request.content.data?.needsFetch === true &&
          !isFromHandler) {
        // Mark as in progress
        processingNotificationId = notification.request.identifier;
        lastProcessedTime = now;
        
        try {
          // iOS may render the raw scheduled notification before the handler — cancel to fully hide it
          const originalIdentifier = notification.request.identifier;
          
          // Cancel pending scheduled notifications that might flash before handler runs
          try {
            // Cancel the originating scheduled entry first
            try {
              await Notifications.cancelScheduledNotificationAsync(originalIdentifier);
            } catch (cancelOriginalError) {
              // Ignore
            }
            
            // Then cancel other fetch triggers that match this flow
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

          // Daily trigger fired — fetch fresh weather from the API
          // Prefer saved city when available
          const selectedCity = await getSelectedCity();
          
          if (selectedCity) {
            // Use saved city coordinates
            const weatherData = await getWeatherPrediction(
              selectedCity.latitude,
              selectedCity.longitude
            );

            // Post the rich notification immediately
            // Mark fromHandler so we don't recurse into fetch logic
            const notificationId = `weather-update-${Date.now()}`;
            const locationName = weatherData.meta.location_name || selectedCity.name;
            await Notifications.scheduleNotificationAsync({
              identifier: notificationId,
              content: {
                title: `Weather — ${locationName}`,
                body: weatherData.summary,
                data: { 
                  weatherData, 
                  type: 'weather_update', 
                  needsFetch: false,
                  fromHandler: true, // Mark as from handler
                },
                sound: true,
              },
              trigger: null, // Immediate delivery
            });
            
            // Clear processing flag shortly after (reduces duplicate triggers on iOS)
            setTimeout(() => {
              processingNotificationId = null;
            }, 1000);

            // Reschedule the daily trigger for the next cycle
            // Read persisted hour/minute from AsyncStorage
            try {
              const timeString = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
              if (timeString) {
                const { hour, minute } = JSON.parse(timeString);
                
                // Schedule next daily occurrence
                await Notifications.scheduleNotificationAsync({
                  identifier: 'weather-daily-trigger',
                  content: {
                    title: 'Weather', // Minimal title (hidden by handler on iOS)
                    body: 'Updating...', // Minimal body (hidden by handler on iOS)
                    sound: false, // Silent placeholder
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

            // Suppress the raw scheduled notification UI entirely
            return {
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
            };
          }
          
          // No saved city — fall back to GPS
          const location = await getCurrentLocation();
          
          if (location) {
            const weatherData = await getWeatherPrediction(
              location.latitude,
              location.longitude
            );

            // Post the rich notification immediately
            // Mark fromHandler so we don't recurse into fetch logic
            const notificationId = `weather-update-${Date.now()}`;
            const locationName = weatherData.meta.location_name || 'Location';
            await Notifications.scheduleNotificationAsync({
              identifier: notificationId,
              content: {
                title: `Weather — ${locationName}`,
                body: weatherData.summary,
                data: { 
                  weatherData, 
                  type: 'weather_update', 
                  needsFetch: false,
                  fromHandler: true, // Mark as from handler
                },
                sound: true,
              },
              trigger: null, // Immediate delivery
            });
            
            // Clear processing flag shortly after (reduces duplicate triggers on iOS)
            setTimeout(() => {
              processingNotificationId = null;
            }, 1000);

            // Reschedule the daily trigger for the next cycle
            // Read persisted hour/minute from AsyncStorage
            try {
              const timeString = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
              if (timeString) {
                const { hour, minute } = JSON.parse(timeString);
                
                // Schedule next daily occurrence
                await Notifications.scheduleNotificationAsync({
                  identifier: 'weather-daily-trigger',
                  content: {
                    title: 'Weather', // Minimal title (hidden by handler on iOS)
                    body: 'Updating...', // Minimal body (hidden by handler on iOS)
                    sound: false, // Silent placeholder
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

            // Suppress the raw scheduled notification UI entirely
            return {
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
            };
          } else {
            // Clear processing flag shortly after
            setTimeout(() => {
              processingNotificationId = null;
            }, 1000);
            
            // Surface a user-visible error when location is unavailable
            await Notifications.scheduleNotificationAsync({
              identifier: `weather-error-${Date.now()}`,
              content: {
                title: 'Weather update',
                body: 'Could not read location. Please check location permission.',
                data: { 
                  type: 'weather_update', 
                  needsFetch: false,
                  fromHandler: true, // Mark as from handler
                },
                sound: true,
              },
              trigger: null, // Immediate delivery
            });
            return {
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
            };
          }
        } catch (error) {
          // Clear processing flag shortly after
          setTimeout(() => {
            processingNotificationId = null;
          }, 1000);
          
          // Send a fallback error notification when fetch fails
          try {
            await Notifications.scheduleNotificationAsync({
              identifier: `weather-error-${Date.now()}`,
              content: {
                title: 'Weather update',
                body: 'Could not load weather.',
                data: { 
                  type: 'weather_update', 
                  needsFetch: false,
                  fromHandler: true, // Mark as from handler
                },
                sound: true,
              },
              trigger: null, // Immediate delivery
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

      // Present notifications we generated inside the handler as-is
      if (notification.request.content.data?.fromHandler === true) {
        return {
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      }

      // Final payloads already marked as ready (needsFetch: false)
      if (notification.request.content.data?.needsFetch === false) {
        return {
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      }

      // Default presentation for anything else
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

// No separate notification response listener — setNotificationHandler covers foreground/background

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
    // Ensure notification permission before scheduling
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        throw new Error('Notification permission not granted');
      }
    }
    
    // Clear prior schedules so only one daily trigger remains
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule a minimal daily trigger; the handler replaces it with live API content.
    // UIBackgroundModes enables handler execution; we still cancel the placeholder on iOS when needed.
    await Notifications.scheduleNotificationAsync({
      identifier: 'weather-daily-trigger',
      content: {
        title: 'Weather', // Minimal title (hidden by handler on iOS)
        body: 'Updating...', // Minimal body (hidden by handler on iOS)
        sound: false, // Silent placeholder
        data: { type: 'weather_update', needsFetch: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    // Persist chosen hour/minute
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

// Send an immediate test notification with live weather
export async function sendTestNotification(): Promise<void> {
  try {
    // Permission gate
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
          title: 'Weather update (test)',
          body: weatherData.summary,
          data: { 
            weatherData, 
            type: 'weather_update', 
            needsFetch: false,
            fromHandler: true, // Mark as from handler
          },
          sound: true,
        },
        trigger: null, // Immediate delivery
      });
    } else {
      throw new Error('Could not get location');
    }
  } catch (error) {
    throw error;
  }
}

// Return scheduled notifications (debug)
export async function getScheduledNotifications(): Promise<any[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    return [];
  }
}

// Debug helper: permission + scheduled notifications
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
