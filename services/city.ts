import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_CITY_KEY = 'selected_city';
const CITY_CHANGE_TIMESTAMP_KEY = 'city_change_timestamp';

export interface CityData {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Popüler şehirler listesi
const POPULAR_CITIES: CityData[] = [
  // Türkiye - Tüm İller (81 il)
  { name: 'Adana', country: 'Türkiye', latitude: 36.9914, longitude: 35.3308 },
  { name: 'Adıyaman', country: 'Türkiye', latitude: 37.7636, longitude: 38.2786 },
  { name: 'Afyonkarahisar', country: 'Türkiye', latitude: 38.7567, longitude: 30.5387 },
  { name: 'Ağrı', country: 'Türkiye', latitude: 39.7217, longitude: 43.0567 },
  { name: 'Aksaray', country: 'Türkiye', latitude: 38.3686, longitude: 34.0369 },
  { name: 'Amasya', country: 'Türkiye', latitude: 40.6533, longitude: 35.8331 },
  { name: 'Ankara', country: 'Türkiye', latitude: 39.9334, longitude: 32.8597 },
  { name: 'Antalya', country: 'Türkiye', latitude: 36.8841, longitude: 30.7056 },
  { name: 'Ardahan', country: 'Türkiye', latitude: 41.1100, longitude: 42.7022 },
  { name: 'Artvin', country: 'Türkiye', latitude: 41.1828, longitude: 41.8183 },
  { name: 'Aydın', country: 'Türkiye', latitude: 37.8444, longitude: 27.8458 },
  { name: 'Balıkesir', country: 'Türkiye', latitude: 39.6484, longitude: 27.8826 },
  { name: 'Bartın', country: 'Türkiye', latitude: 41.6344, longitude: 32.3375 },
  { name: 'Batman', country: 'Türkiye', latitude: 37.8812, longitude: 41.1351 },
  { name: 'Bayburt', country: 'Türkiye', latitude: 40.2552, longitude: 40.2249 },
  { name: 'Bilecik', country: 'Türkiye', latitude: 40.1419, longitude: 29.9794 },
  { name: 'Bingöl', country: 'Türkiye', latitude: 38.8847, longitude: 40.4981 },
  { name: 'Bitlis', country: 'Türkiye', latitude: 38.4000, longitude: 42.1083 },
  { name: 'Bolu', country: 'Türkiye', latitude: 40.7356, longitude: 31.6061 },
  { name: 'Burdur', country: 'Türkiye', latitude: 37.7206, longitude: 30.2908 },
  { name: 'Bursa', country: 'Türkiye', latitude: 40.1826, longitude: 29.0665 },
  { name: 'Çanakkale', country: 'Türkiye', latitude: 40.1553, longitude: 26.4142 },
  { name: 'Çankırı', country: 'Türkiye', latitude: 40.6019, longitude: 33.6139 },
  { name: 'Çorum', country: 'Türkiye', latitude: 40.5506, longitude: 34.9556 },
  { name: 'Denizli', country: 'Türkiye', latitude: 37.7765, longitude: 29.0864 },
  { name: 'Diyarbakır', country: 'Türkiye', latitude: 37.9144, longitude: 40.2306 },
  { name: 'Düzce', country: 'Türkiye', latitude: 40.8438, longitude: 31.1565 },
  { name: 'Edirne', country: 'Türkiye', latitude: 41.6772, longitude: 26.5556 },
  { name: 'Elazığ', country: 'Türkiye', latitude: 38.6747, longitude: 39.2228 },
  { name: 'Erzincan', country: 'Türkiye', latitude: 39.7500, longitude: 39.5000 },
  { name: 'Erzurum', country: 'Türkiye', latitude: 39.9042, longitude: 41.2679 },
  { name: 'Eskişehir', country: 'Türkiye', latitude: 39.7767, longitude: 30.5206 },
  { name: 'Gaziantep', country: 'Türkiye', latitude: 37.0662, longitude: 37.3833 },
  { name: 'Giresun', country: 'Türkiye', latitude: 40.9128, longitude: 38.3897 },
  { name: 'Gümüşhane', country: 'Türkiye', latitude: 40.4603, longitude: 39.5086 },
  { name: 'Hakkari', country: 'Türkiye', latitude: 37.5744, longitude: 43.7408 },
  { name: 'Hatay', country: 'Türkiye', latitude: 36.4018, longitude: 36.3498 },
  { name: 'Iğdır', country: 'Türkiye', latitude: 39.9167, longitude: 44.0333 },
  { name: 'Isparta', country: 'Türkiye', latitude: 37.7647, longitude: 30.5567 },
  { name: 'İstanbul', country: 'Türkiye', latitude: 41.0082, longitude: 28.9784 },
  { name: 'İzmir', country: 'Türkiye', latitude: 38.4237, longitude: 27.1428 },
  { name: 'Kahramanmaraş', country: 'Türkiye', latitude: 37.5858, longitude: 36.9371 },
  { name: 'Karabük', country: 'Türkiye', latitude: 41.2061, longitude: 32.6208 },
  { name: 'Karaman', country: 'Türkiye', latitude: 37.1811, longitude: 33.2150 },
  { name: 'Kars', country: 'Türkiye', latitude: 40.6019, longitude: 43.0975 },
  { name: 'Kastamonu', country: 'Türkiye', latitude: 41.3767, longitude: 33.7764 },
  { name: 'Kayseri', country: 'Türkiye', latitude: 38.7312, longitude: 35.4787 },
  { name: 'Kırıkkale', country: 'Türkiye', latitude: 39.8467, longitude: 33.5153 },
  { name: 'Kırklareli', country: 'Türkiye', latitude: 41.7333, longitude: 27.2250 },
  { name: 'Kırşehir', country: 'Türkiye', latitude: 39.1458, longitude: 34.1606 },
  { name: 'Kilis', country: 'Türkiye', latitude: 36.7181, longitude: 37.1214 },
  { name: 'Kocaeli', country: 'Türkiye', latitude: 40.8533, longitude: 29.8814 },
  { name: 'Konya', country: 'Türkiye', latitude: 37.8746, longitude: 32.4932 },
  { name: 'Kütahya', country: 'Türkiye', latitude: 39.4167, longitude: 29.9833 },
  { name: 'Malatya', country: 'Türkiye', latitude: 38.3552, longitude: 38.3095 },
  { name: 'Manisa', country: 'Türkiye', latitude: 38.6191, longitude: 27.4289 },
  { name: 'Mardin', country: 'Türkiye', latitude: 37.3122, longitude: 40.7350 },
  { name: 'Mersin', country: 'Türkiye', latitude: 36.8000, longitude: 34.6333 },
  { name: 'Muğla', country: 'Türkiye', latitude: 37.2153, longitude: 28.3636 },
  { name: 'Muş', country: 'Türkiye', latitude: 38.7333, longitude: 41.4911 },
  { name: 'Nevşehir', country: 'Türkiye', latitude: 38.6244, longitude: 34.7239 },
  { name: 'Niğde', country: 'Türkiye', latitude: 37.9667, longitude: 34.6833 },
  { name: 'Ordu', country: 'Türkiye', latitude: 40.9839, longitude: 37.8764 },
  { name: 'Osmaniye', country: 'Türkiye', latitude: 37.0742, longitude: 36.2478 },
  { name: 'Rize', country: 'Türkiye', latitude: 41.0201, longitude: 40.5234 },
  { name: 'Sakarya', country: 'Türkiye', latitude: 40.7569, longitude: 30.3781 },
  { name: 'Samsun', country: 'Türkiye', latitude: 41.2867, longitude: 36.3300 },
  { name: 'Şanlıurfa', country: 'Türkiye', latitude: 37.1674, longitude: 38.7955 },
  { name: 'Siirt', country: 'Türkiye', latitude: 37.9333, longitude: 41.9500 },
  { name: 'Sinop', country: 'Türkiye', latitude: 42.0267, longitude: 35.1550 },
  { name: 'Sivas', country: 'Türkiye', latitude: 39.7477, longitude: 37.0179 },
  { name: 'Şırnak', country: 'Türkiye', latitude: 37.5167, longitude: 42.4500 },
  { name: 'Tekirdağ', country: 'Türkiye', latitude: 40.9833, longitude: 27.5167 },
  { name: 'Tokat', country: 'Türkiye', latitude: 40.3139, longitude: 36.5544 },
  { name: 'Trabzon', country: 'Türkiye', latitude: 41.0015, longitude: 39.7178 },
  { name: 'Tunceli', country: 'Türkiye', latitude: 39.1079, longitude: 39.5401 },
  { name: 'Uşak', country: 'Türkiye', latitude: 38.6823, longitude: 29.4082 },
  { name: 'Van', country: 'Türkiye', latitude: 38.4891, longitude: 43.4089 },
  { name: 'Yalova', country: 'Türkiye', latitude: 40.6500, longitude: 29.2667 },
  { name: 'Yozgat', country: 'Türkiye', latitude: 39.8200, longitude: 34.8044 },
  { name: 'Zonguldak', country: 'Türkiye', latitude: 41.4564, longitude: 31.7987 },
  
  // ABD
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060 },
  { name: 'Los Angeles', country: 'United States', latitude: 34.0522, longitude: -118.2437 },
  { name: 'Chicago', country: 'United States', latitude: 41.8781, longitude: -87.6298 },
  { name: 'San Francisco', country: 'United States', latitude: 37.7749, longitude: -122.4194 },
  
  // Avrupa
  { name: 'Londra', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050 },
  { name: 'Roma', country: 'Italy', latitude: 41.9028, longitude: 12.4964 },
  { name: 'Madrid', country: 'Spain', latitude: 40.4168, longitude: -3.7038 },
  { name: 'Amsterdam', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041 },
  
  // Asya
  { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Seoul', country: 'South Korea', latitude: 37.5665, longitude: 126.9780 },
  { name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708 },
  { name: 'Singapur', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  
  // Diğer
  { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
  { name: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832 },
  { name: 'Meksiko', country: 'Mexico', latitude: 19.4326, longitude: -99.1332 },
  { name: 'São Paulo', country: 'Brazil', latitude: -23.5505, longitude: -46.6333 },
];

// Ülkelere göre gruplanmış şehirler
export function getCitiesByCountry(): Record<string, CityData[]> {
  const citiesByCountry: Record<string, CityData[]> = {};
  
  POPULAR_CITIES.forEach(city => {
    if (!citiesByCountry[city.country]) {
      citiesByCountry[city.country] = [];
    }
    citiesByCountry[city.country].push(city);
  });
  
  // Ülkeleri alfabetik sırala
  Object.keys(citiesByCountry).forEach(country => {
    citiesByCountry[country].sort((a, b) => a.name.localeCompare(b.name));
  });
  
  return citiesByCountry;
}

// Tüm ülkeleri al
export function getCountries(): string[] {
  const countries = new Set(POPULAR_CITIES.map(city => city.country));
  return Array.from(countries).sort();
}

// Bir ülkenin şehirlerini al
export function getCitiesByCountryName(country: string): CityData[] {
  return POPULAR_CITIES
    .filter(city => city.country === country)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Seçilen şehri kaydet
export async function saveSelectedCity(city: CityData | null): Promise<void> {
  try {
    if (city) {
      await AsyncStorage.setItem(SELECTED_CITY_KEY, JSON.stringify(city));
    } else {
      await AsyncStorage.removeItem(SELECTED_CITY_KEY);
    }
    // Şehir değişikliği timestamp'ini kaydet
    await AsyncStorage.setItem(CITY_CHANGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    // Ignore
  }
}

// Şehir değişikliği timestamp'ini al
export async function getCityChangeTimestamp(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(CITY_CHANGE_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    return null;
  }
}

// Seçilen şehri al
export async function getSelectedCity(): Promise<CityData | null> {
  try {
    const cityString = await AsyncStorage.getItem(SELECTED_CITY_KEY);
    if (!cityString) return null;
    return JSON.parse(cityString);
  } catch (error) {
    return null;
  }
}

// Şehir arama (basit)
export function searchCities(query: string): CityData[] {
  const lowerQuery = query.toLowerCase();
  return POPULAR_CITIES.filter(
    city => 
      city.name.toLowerCase().includes(lowerQuery) ||
      city.country.toLowerCase().includes(lowerQuery)
  ).slice(0, 50); // Maksimum 50 sonuç
}
