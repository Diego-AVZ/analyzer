// Servicio para conectar con el backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api');

// Debug log para verificar la configuración
console.log('Environment:', process.env.NODE_ENV);
console.log('API_BASE_URL:', API_BASE_URL);

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

// Nuevos tipos para Strategy Bundles
export interface StrategyBundle {
  pair: string;
  longToken: string;
  shortToken: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  apr: number;
  tvl: number;
  overallScore: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  // Métricas de 100 días
  winRate100d: number;
  avgDailyProfit100d: number;
  totalProfit100d: number;
  sharpeRatio100d: number;
  consistencyScore100d: number;
  metrics: {
    [period: string]: {
      winRate: number;
      totalProfit: number;
      averageDailyProfit: number;
      sharpeRatio: number;
      consistencyScore: number;
      recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL';
      confidence: number;
      validDays: number;
    };
  };
}

export interface StrategyBundlesResponse {
  strategies: StrategyBundle[];
  totalAnalyzed: number;
  totalFiltered: number;
  returned: number;
  cacheInfo: {
    cached: boolean;
    generatedAt: string;
    cacheAge?: number;
    cacheExpiresIn?: number;
  };
}

export interface StrategyBundlesRequest {
  limit?: number;
  riskLevel?: 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';
  timePeriod?: 'ALL' | '30' | '60' | '100';
  sortBy?: 'APR' | 'WIN_RATE' | 'SHARPE_RATIO' | 'CONSISTENCY';
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

  async getStrategyBundles(request: StrategyBundlesRequest = {}): Promise<StrategyBundlesResponse> {
    const params = new URLSearchParams();
    
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.riskLevel) params.append('riskLevel', request.riskLevel);
    if (request.timePeriod) params.append('timePeriod', request.timePeriod);
    if (request.sortBy) params.append('sortBy', request.sortBy);

    const queryString = params.toString();
    const endpoint = `/strategy-bundles${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<StrategyBundlesResponse>(endpoint);
  }
}

export const apiService = new ApiService();
