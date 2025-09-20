// Servicio para conectar con el backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface AnalysisRequest {
  longToken: string;
  shortToken: string;
  timePeriod: number;
}

export interface AnalysisResponse {
  pair: string;
  stats: {
    longToken: string;
    shortToken: string;
    totalDays: number;
    validDays: number;
    winningDays: number;
    losingDays: number;
    winRate: number;
    lossRate: number;
    totalProfit: number;
    averageDailyProfit: number;
    averageDailyGain: number;  // Ganancia media por día ganador
    averageDailyLoss: number;  // Pérdida media por día perdedor
    totalGain: number;         // Ganancia total de días ganadores
    totalLoss: number;         // Pérdida total de días perdedores
    maxSingleDayProfit: number;
    maxSingleDayLoss: number;
    maxConsecutiveWinningDays: number;
    maxConsecutiveLosingDays: number;
    profitVolatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    consistencyScore: number;
    dailyProfits: number[];
  };
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  strategyAdvice: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async analyzeStrategy(request: AnalysisRequest): Promise<AnalysisResponse> {
    return this.makeRequest<AnalysisResponse>('/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAvailableTokens(): Promise<string[]> {
    return this.makeRequest<string[]>('/tokens');
  }
}

export const apiService = new ApiService();
