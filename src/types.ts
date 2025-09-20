/**
 * Tipos para el análisis de correlaciones de Binance
 */

// Los datos de Binance vienen como un array, no como un objeto
export type BinanceKline = [
  number,    // 0: Open time
  string,    // 1: Open
  string,    // 2: High
  string,    // 3: Low
  string,    // 4: Close
  string,    // 5: Volume
  number,    // 6: Close time
  string,    // 7: Quote asset volume
  number,    // 8: Number of trades
  string,    // 9: Taker buy base asset volume
  string,    // 10: Taker buy quote asset volume
  string     // 11: Ignore
];

export interface ProcessedKline {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dailyChange: number; // % de cambio diario
  dailyChangeAbs: number; // Cambio absoluto en precio
}

export interface TokenData {
  symbol: string;
  klines: ProcessedKline[];
  averageDailyChange: number;
  volatility: number; // Desviación estándar de los cambios diarios
  totalDays: number;
}

export interface CorrelationStats {
  tokenA: string;
  tokenB: string;
  
  // Estadísticas básicas
  totalDays: number;
  validDays: number; // Días con datos válidos para ambos tokens
  
  // Correlación inversa
  inverseCorrelationDays: number; // Días donde A sube más que B baja, o viceversa
  inverseCorrelationPercentage: number;
  
  // Días donde uno sube y otro baja
  oppositeDirectionDays: number;
  oppositeDirectionPercentage: number;
  
  // Días donde A sube más que B
  aOutperformsB: number;
  aOutperformsBPercentage: number;
  
  // Días donde B sube más que A
  bOutperformsA: number;
  bOutperformsAPercentage: number;
  
  // Métricas de diferencia promedio
  averageDifference: number; // Diferencia promedio entre cambios de A y B
  averageDifferenceWhenAUp: number; // Diferencia promedio cuando A sube
  averageDifferenceWhenBUp: number; // Diferencia promedio cuando B sube
  
  // Correlación estadística
  correlationCoefficient: number;
  
  // Métricas adicionales para estrategia
  maxSingleDayDifference: number;
  minSingleDayDifference: number;
  consistencyScore: number; // Qué tan consistente es la correlación inversa
  
  // Análisis de volatilidad
  aVolatility: number;
  bVolatility: number;
  volatilityRatio: number; // Ratio de volatilidad A/B
  
  // Días consecutivos de correlación inversa
  maxConsecutiveInverseDays: number;
  currentConsecutiveInverseDays: number;
}

export interface AnalysisResult {
  pair: string;
  stats: CorrelationStats;
  recommendation: 'STRONG_INVERSE' | 'MODERATE_INVERSE' | 'WEAK_INVERSE' | 'NO_CORRELATION';
  confidence: number; // 0-100
  strategyAdvice: string;
}

export interface BinanceApiResponse {
  success: boolean;
  data?: BinanceKline[];
  error?: string;
  symbol?: string;
}
