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

// Nuevos tipos para la calculadora de rangos de liquidez
export interface LiquidityRangeRequest {
  tokenA: string;
  tokenB: string;
  rangeUpPercent: number;
  rangeDownPercent: number;
  timePeriod: number;
}

export interface LiquidityRangeResponse {
  pair: string;
  currentPriceA: number;
  currentPriceB: number;
  rangeA: {
    min: number;
    max: number;
  };
  rangeB: {
    min: number;
    max: number;
  };
  historicalAnalysis: {
    totalDays: number;
    daysInRange: number;
    daysOutOfRangeUp: number;
    daysOutOfRangeDown: number;
    timeInRangePercentage: number;
    averageVolatility: number;
    maxConsecutiveDaysOut: number;
  };
  impermanentLossEstimation: {
    scenarioUp: {
      priceRatio: number;
      impermanentLoss: number;
      finalValue: number; // Si inviertes $1000
    };
    scenarioDown: {
      priceRatio: number;
      impermanentLoss: number;
      finalValue: number; // Si inviertes $1000
    };
    feesNeededToCoverIL: number; // Fees necesarios para cubrir IL promedio
  };
  recommendation: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'RISKY';
  confidence: number;
  advice: string;
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

  async analyzeLiquidityRange(request: LiquidityRangeRequest): Promise<LiquidityRangeResponse> {
    return this.makeRequest<LiquidityRangeResponse>('/liquidity-range', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const apiService = new ApiService();
