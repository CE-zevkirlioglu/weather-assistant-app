import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

export async function checkLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    // Check permission first
    let hasPermission = await checkLocationPermission();
    
    // Prompt if needed
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        return null;
      }
      hasPermission = true;
    }

    // Low accuracy is faster; sufficient for weather lookups
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

// Prefer last known position when available
export async function getCurrentLocationFast(): Promise<LocationData | null> {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        return null;
      }
    }

    // Last known fix is instant when present
    const lastKnownPosition = await Location.getLastKnownPositionAsync();

    if (lastKnownPosition) {
      return {
        latitude: lastKnownPosition.coords.latitude,
        longitude: lastKnownPosition.coords.longitude,
      };
    }

    // Fall back to a fresh fix
    return await getCurrentLocation();
  } catch (error) {
    console.error('Error getting current location fast:', error);
    return null;
  }
}

