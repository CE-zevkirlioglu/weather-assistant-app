const API_BASE_URL = 'https://weather-assistant-api.onrender.com';

export interface WeatherFeatures {
  temp: number;
  humidity: number;
  wind_speed: number;
  pressure: number;
  clouds: number;
  uv_index: number;
}

export interface WeatherPrediction {
  states: {
    label_rain: boolean;
    label_hot: boolean;
    label_cold: boolean;
    label_uv_high: boolean;
    label_windy: boolean;
  };
  probabilities: {
    label_rain: number;
    label_hot: number;
    label_cold: number;
    label_uv_high: number;
    label_windy: number;
  };
  confidences: {
    label_rain: string;
    label_hot: string;
    label_cold: string;
    label_uv_high: string;
    label_windy: string;
  };
  label: string;
  proba: number;
}

export interface Recommendation {
  id: string;
  message: string;
  active: boolean;
}

export interface WeatherMeta {
  source: string;
  lat: number;
  lon: number;
  location_name?: string;
  location_region?: string;
  location_country?: string;
  local_time?: string;
  condition?: string;
}

export interface WeatherResponse {
  success: boolean;
  features: WeatherFeatures;
  prediction: WeatherPrediction;
  summary: string;
  recommendations: Recommendation[];
  meta: WeatherMeta;
}

export interface WeatherError {
  error: string;
  detail?: string;
}

export async function getWeatherPrediction(
  latitude: number,
  longitude: number
): Promise<WeatherResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lat: latitude,
        lon: longitude,
      }),
    });

    if (!response.ok) {
      const errorData: WeatherError = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    const data: WeatherResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Weather prediction error:', error);
    throw error;
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok' && data.model_loaded === true;
  } catch (error) {
    console.error('Health check error:', error);
    return false;
  }
}

// Manuel verilerle hava durumu tahmini
export async function getWeatherPredictionManual(
  features: WeatherFeatures
): Promise<WeatherResponse> {
  try {
    // API'ye features objesi gönder
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        features: {
          temp: features.temp,
          humidity: features.humidity,
          wind_speed: features.wind_speed,
          pressure: features.pressure,
          clouds: features.clouds,
          uv_index: features.uv_index,
        },
      }),
    });

    if (!response.ok) {
      const errorData: WeatherError = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    const data: WeatherResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Weather prediction error:', error);
    throw error;
  }
}

