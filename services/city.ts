import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_CITY_KEY = 'selected_city';
const CITY_CHANGE_TIMESTAMP_KEY = 'city_change_timestamp';

export interface CityData {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Curated city list for picker search
const POPULAR_CITIES: CityData[] = [
  // Turkey — provinces (81)
  { name: 'Adana', country: 'Turkey', latitude: 36.9914, longitude: 35.3308 },
  { name: 'Adıyaman', country: 'Turkey', latitude: 37.7636, longitude: 38.2786 },
  { name: 'Afyonkarahisar', country: 'Turkey', latitude: 38.7567, longitude: 30.5387 },
  { name: 'Ağrı', country: 'Turkey', latitude: 39.7217, longitude: 43.0567 },
  { name: 'Aksaray', country: 'Turkey', latitude: 38.3686, longitude: 34.0369 },
  { name: 'Amasya', country: 'Turkey', latitude: 40.6533, longitude: 35.8331 },
  { name: 'Ankara', country: 'Turkey', latitude: 39.9334, longitude: 32.8597 },
  { name: 'Antalya', country: 'Turkey', latitude: 36.8841, longitude: 30.7056 },
  { name: 'Ardahan', country: 'Turkey', latitude: 41.1100, longitude: 42.7022 },
  { name: 'Artvin', country: 'Turkey', latitude: 41.1828, longitude: 41.8183 },
  { name: 'Aydın', country: 'Turkey', latitude: 37.8444, longitude: 27.8458 },
  { name: 'Balıkesir', country: 'Turkey', latitude: 39.6484, longitude: 27.8826 },
  { name: 'Bartın', country: 'Turkey', latitude: 41.6344, longitude: 32.3375 },
  { name: 'Batman', country: 'Turkey', latitude: 37.8812, longitude: 41.1351 },
  { name: 'Bayburt', country: 'Turkey', latitude: 40.2552, longitude: 40.2249 },
  { name: 'Bilecik', country: 'Turkey', latitude: 40.1419, longitude: 29.9794 },
  { name: 'Bingöl', country: 'Turkey', latitude: 38.8847, longitude: 40.4981 },
  { name: 'Bitlis', country: 'Turkey', latitude: 38.4000, longitude: 42.1083 },
  { name: 'Bolu', country: 'Turkey', latitude: 40.7356, longitude: 31.6061 },
  { name: 'Burdur', country: 'Turkey', latitude: 37.7206, longitude: 30.2908 },
  { name: 'Bursa', country: 'Turkey', latitude: 40.1826, longitude: 29.0665 },
  { name: 'Çanakkale', country: 'Turkey', latitude: 40.1553, longitude: 26.4142 },
  { name: 'Çankırı', country: 'Turkey', latitude: 40.6019, longitude: 33.6139 },
  { name: 'Çorum', country: 'Turkey', latitude: 40.5506, longitude: 34.9556 },
  { name: 'Denizli', country: 'Turkey', latitude: 37.7765, longitude: 29.0864 },
  { name: 'Diyarbakır', country: 'Turkey', latitude: 37.9144, longitude: 40.2306 },
  { name: 'Düzce', country: 'Turkey', latitude: 40.8438, longitude: 31.1565 },
  { name: 'Edirne', country: 'Turkey', latitude: 41.6772, longitude: 26.5556 },
  { name: 'Elazığ', country: 'Turkey', latitude: 38.6747, longitude: 39.2228 },
  { name: 'Erzincan', country: 'Turkey', latitude: 39.7500, longitude: 39.5000 },
  { name: 'Erzurum', country: 'Turkey', latitude: 39.9042, longitude: 41.2679 },
  { name: 'Eskişehir', country: 'Turkey', latitude: 39.7767, longitude: 30.5206 },
  { name: 'Gaziantep', country: 'Turkey', latitude: 37.0662, longitude: 37.3833 },
  { name: 'Giresun', country: 'Turkey', latitude: 40.9128, longitude: 38.3897 },
  { name: 'Gümüşhane', country: 'Turkey', latitude: 40.4603, longitude: 39.5086 },
  { name: 'Hakkari', country: 'Turkey', latitude: 37.5744, longitude: 43.7408 },
  { name: 'Hatay', country: 'Turkey', latitude: 36.4018, longitude: 36.3498 },
  { name: 'Iğdır', country: 'Turkey', latitude: 39.9167, longitude: 44.0333 },
  { name: 'Isparta', country: 'Turkey', latitude: 37.7647, longitude: 30.5567 },
  { name: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784 },
  { name: 'Izmir', country: 'Turkey', latitude: 38.4237, longitude: 27.1428 },
  { name: 'Kahramanmaraş', country: 'Turkey', latitude: 37.5858, longitude: 36.9371 },
  { name: 'Karabük', country: 'Turkey', latitude: 41.2061, longitude: 32.6208 },
  { name: 'Karaman', country: 'Turkey', latitude: 37.1811, longitude: 33.2150 },
  { name: 'Kars', country: 'Turkey', latitude: 40.6019, longitude: 43.0975 },
  { name: 'Kastamonu', country: 'Turkey', latitude: 41.3767, longitude: 33.7764 },
  { name: 'Kayseri', country: 'Turkey', latitude: 38.7312, longitude: 35.4787 },
  { name: 'Kırıkkale', country: 'Turkey', latitude: 39.8467, longitude: 33.5153 },
  { name: 'Kırklareli', country: 'Turkey', latitude: 41.7333, longitude: 27.2250 },
  { name: 'Kırşehir', country: 'Turkey', latitude: 39.1458, longitude: 34.1606 },
  { name: 'Kilis', country: 'Turkey', latitude: 36.7181, longitude: 37.1214 },
  { name: 'Kocaeli', country: 'Turkey', latitude: 40.8533, longitude: 29.8814 },
  { name: 'Konya', country: 'Turkey', latitude: 37.8746, longitude: 32.4932 },
  { name: 'Kütahya', country: 'Turkey', latitude: 39.4167, longitude: 29.9833 },
  { name: 'Malatya', country: 'Turkey', latitude: 38.3552, longitude: 38.3095 },
  { name: 'Manisa', country: 'Turkey', latitude: 38.6191, longitude: 27.4289 },
  { name: 'Mardin', country: 'Turkey', latitude: 37.3122, longitude: 40.7350 },
  { name: 'Mersin', country: 'Turkey', latitude: 36.8000, longitude: 34.6333 },
  { name: 'Muğla', country: 'Turkey', latitude: 37.2153, longitude: 28.3636 },
  { name: 'Muş', country: 'Turkey', latitude: 38.7333, longitude: 41.4911 },
  { name: 'Nevşehir', country: 'Turkey', latitude: 38.6244, longitude: 34.7239 },
  { name: 'Niğde', country: 'Turkey', latitude: 37.9667, longitude: 34.6833 },
  { name: 'Ordu', country: 'Turkey', latitude: 40.9839, longitude: 37.8764 },
  { name: 'Osmaniye', country: 'Turkey', latitude: 37.0742, longitude: 36.2478 },
  { name: 'Rize', country: 'Turkey', latitude: 41.0201, longitude: 40.5234 },
  { name: 'Sakarya', country: 'Turkey', latitude: 40.7569, longitude: 30.3781 },
  { name: 'Samsun', country: 'Turkey', latitude: 41.2867, longitude: 36.3300 },
  { name: 'Şanlıurfa', country: 'Turkey', latitude: 37.1674, longitude: 38.7955 },
  { name: 'Siirt', country: 'Turkey', latitude: 37.9333, longitude: 41.9500 },
  { name: 'Sinop', country: 'Turkey', latitude: 42.0267, longitude: 35.1550 },
  { name: 'Sivas', country: 'Turkey', latitude: 39.7477, longitude: 37.0179 },
  { name: 'Şırnak', country: 'Turkey', latitude: 37.5167, longitude: 42.4500 },
  { name: 'Tekirdağ', country: 'Turkey', latitude: 40.9833, longitude: 27.5167 },
  { name: 'Tokat', country: 'Turkey', latitude: 40.3139, longitude: 36.5544 },
  { name: 'Trabzon', country: 'Turkey', latitude: 41.0015, longitude: 39.7178 },
  { name: 'Tunceli', country: 'Turkey', latitude: 39.1079, longitude: 39.5401 },
  { name: 'Uşak', country: 'Turkey', latitude: 38.6823, longitude: 29.4082 },
  { name: 'Van', country: 'Turkey', latitude: 38.4891, longitude: 43.4089 },
  { name: 'Yalova', country: 'Turkey', latitude: 40.6500, longitude: 29.2667 },
  { name: 'Yozgat', country: 'Turkey', latitude: 39.8200, longitude: 34.8044 },
  { name: 'Zonguldak', country: 'Turkey', latitude: 41.4564, longitude: 31.7987 },
  
  // United States
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060 },
  { name: 'Los Angeles', country: 'United States', latitude: 34.0522, longitude: -118.2437 },
  { name: 'Chicago', country: 'United States', latitude: 41.8781, longitude: -87.6298 },
  { name: 'San Francisco', country: 'United States', latitude: 37.7749, longitude: -122.4194 },
  
  // Europe
  { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050 },
  { name: 'Rome', country: 'Italy', latitude: 41.9028, longitude: 12.4964 },
  { name: 'Madrid', country: 'Spain', latitude: 40.4168, longitude: -3.7038 },
  { name: 'Amsterdam', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041 },
  
  // Asia
  { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Seoul', country: 'South Korea', latitude: 37.5665, longitude: 126.9780 },
  { name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708 },
  { name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  
  // Other
  { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
  { name: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832 },
  { name: 'Mexico City', country: 'Mexico', latitude: 19.4326, longitude: -99.1332 },
  { name: 'São Paulo', country: 'Brazil', latitude: -23.5505, longitude: -46.6333 },
];

// Cities grouped by country name
export function getCitiesByCountry(): Record<string, CityData[]> {
  const citiesByCountry: Record<string, CityData[]> = {};
  
  POPULAR_CITIES.forEach(city => {
    if (!citiesByCountry[city.country]) {
      citiesByCountry[city.country] = [];
    }
    citiesByCountry[city.country].push(city);
  });
  
  // Sort cities within each country
  Object.keys(citiesByCountry).forEach(country => {
    citiesByCountry[country].sort((a, b) => a.name.localeCompare(b.name));
  });
  
  return citiesByCountry;
}

// Distinct country names (sorted)
export function getCountries(): string[] {
  const countries = new Set(POPULAR_CITIES.map(city => city.country));
  return Array.from(countries).sort();
}

// Cities for one country
export function getCitiesByCountryName(country: string): CityData[] {
  return POPULAR_CITIES
    .filter(city => city.country === country)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Persist selected city (or clear)
export async function saveSelectedCity(city: CityData | null): Promise<void> {
  try {
    if (city) {
      await AsyncStorage.setItem(SELECTED_CITY_KEY, JSON.stringify(city));
    } else {
      await AsyncStorage.removeItem(SELECTED_CITY_KEY);
    }
    // Bump timestamp so home screen can refresh
    await AsyncStorage.setItem(CITY_CHANGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    // Ignore
  }
}

// Last city change timestamp
export async function getCityChangeTimestamp(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(CITY_CHANGE_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    return null;
  }
}

// Load selected city from storage
export async function getSelectedCity(): Promise<CityData | null> {
  try {
    const cityString = await AsyncStorage.getItem(SELECTED_CITY_KEY);
    if (!cityString) return null;
    return JSON.parse(cityString);
  } catch (error) {
    return null;
  }
}

// Simple city search
export function searchCities(query: string): CityData[] {
  const lowerQuery = query.toLowerCase();
  return POPULAR_CITIES.filter(
    city => 
      city.name.toLowerCase().includes(lowerQuery) ||
      city.country.toLowerCase().includes(lowerQuery)
  ).slice(0, 50); // Cap results for performance
}
