const API_BASE_URL = 'https://weather-assistant-api.onrender.com';

export interface WeatherFeatures {
  temp: number;
  humidity: number;
  wind_speed: number;
  pressure: number;
  clouds: number;
  uv_index: number;
}

export interface PredictionStates {
  label_rain: boolean;
  label_hot: boolean;
  label_cold: boolean;
  label_uv_high: boolean;
  label_windy: boolean;
}

export interface PredictionProbabilities {
  label_rain: number;
  label_hot: number;
  label_cold: number;
  label_uv_high: number;
  label_windy: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface PredictionConfidences {
  label_rain: ConfidenceLevel | string;
  label_hot: ConfidenceLevel | string;
  label_cold: ConfidenceLevel | string;
  label_uv_high: ConfidenceLevel | string;
  label_windy: ConfidenceLevel | string;
}

export interface Recommendation {
  id: string;
  message: string;
  active: boolean;
}

export interface WeatherMeta {
  source: string;
  lat?: number;
  lon?: number;
  location_name?: string;
  location_region?: string;
  location_country?: string;
  local_time?: string;
  condition?: string;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high';

export interface RiskSummary {
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: string[];
}

export interface PerLabelExplanation {
  label: string;
  probability: number;
  confidence: string;
  predicted: boolean;
}

export interface ExplanationBlock {
  per_label: PerLabelExplanation[];
}

export interface WeatherResponse {
  success: boolean;
  features: WeatherFeatures;
  states: PredictionStates;
  probabilities: PredictionProbabilities;
  confidences: PredictionConfidences;
  label: string;
  proba: number | null;
  summary: string;
  risk_summary: RiskSummary;
  recommendations: Recommendation[];
  meta: WeatherMeta;
  explanation?: ExplanationBlock;
}

export interface WeatherError {
  error: string;
  detail?: string;
}

function predictUrl(options?: { explain?: boolean }) {
  const base = `${API_BASE_URL}/predict`;
  return options?.explain ? `${base}?explain=true` : base;
}

export async function getWeatherPrediction(
  latitude: number,
  longitude: number,
  options?: { explain?: boolean }
): Promise<WeatherResponse> {
  try {
    const response = await fetch(predictUrl(options), {
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

// Forecast using manually entered feature values
export async function getWeatherPredictionManual(
  features: WeatherFeatures,
  options?: { explain?: boolean }
): Promise<WeatherResponse> {
  try {
    const response = await fetch(predictUrl(options), {
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
