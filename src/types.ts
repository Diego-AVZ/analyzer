export type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string
];

export interface ProcessedKline {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dailyChange: number;
  dailyChangeAbs: number;
}

export interface TokenData {
  symbol: string;
  klines: ProcessedKline[];
  averageDailyChange: number;
  volatility: number;
  totalDays: number;
}

export interface CorrelationStats {
  tokenA: string;
  tokenB: string;
  
  totalDays: number;
  validDays: number;
  
  inverseCorrelationDays: number;
  inverseCorrelationPercentage: number;
  
  oppositeDirectionDays: number;
  oppositeDirectionPercentage: number;
  
  aOutperformsB: number;
  aOutperformsBPercentage: number;
  
  bOutperformsA: number;
  bOutperformsAPercentage: number;
  
  averageDifference: number;
  averageDifferenceWhenAUp: number;
  averageDifferenceWhenBUp: number;
  
  correlationCoefficient: number;
  
  maxSingleDayDifference: number;
  minSingleDayDifference: number;
  consistencyScore: number;
  
  aVolatility: number;
  bVolatility: number;
  volatilityRatio: number;
  
  maxConsecutiveInverseDays: number;
  currentConsecutiveInverseDays: number;
}

export interface AnalysisResult {
  pair: string;
  stats: CorrelationStats;
  recommendation: 'STRONG_INVERSE' | 'MODERATE_INVERSE' | 'WEAK_INVERSE' | 'NO_CORRELATION';
  confidence: number;
  strategyAdvice: string;
}

export interface BinanceApiResponse {
  success: boolean;
  data?: BinanceKline[];
  error?: string;
  symbol?: string;
}
