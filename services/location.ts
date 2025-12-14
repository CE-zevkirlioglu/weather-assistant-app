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
    // Önce mevcut izni kontrol et
    let hasPermission = await checkLocationPermission();
    
    // İzin yoksa iste
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        return null;
      }
      hasPermission = true;
    }

    // İzin varsa direkt konum al - daha hızlı accuracy kullan
    // Low accuracy daha hızlı sonuç verir, hava durumu için yeterli
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low, // Balanced yerine Low - daha hızlı
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

// Hızlı konum alma - cached konum varsa onu kullan
export async function getCurrentLocationFast(): Promise<LocationData | null> {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        return null;
      }
    }

    // Önce son bilinen konumu al (çok hızlı)
    const lastKnownPosition = await Location.getLastKnownPositionAsync();

    if (lastKnownPosition) {
      return {
        latitude: lastKnownPosition.coords.latitude,
        longitude: lastKnownPosition.coords.longitude,
      };
    }

    // Son bilinen konum yoksa yeni konum al
    return await getCurrentLocation();
  } catch (error) {
    console.error('Error getting current location fast:', error);
    return null;
  }
}

