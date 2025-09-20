import { ProcessedKline, CorrelationStats } from './types';

/**
 * Métricas avanzadas para estrategias de trading basadas en correlaciones inversas
 */
export class AdvancedMetrics {
  
  /**
   * Calcula métricas de momentum y reversión
   */
  calculateMomentumMetrics(klinesA: ProcessedKline[], klinesB: ProcessedKline[]): {
    aMomentum: number;
    bMomentum: number;
    momentumDivergence: number;
    reversalProbability: number;
  } {
    if (klinesA.length < 5 || klinesB.length < 5) {
      return { aMomentum: 0, bMomentum: 0, momentumDivergence: 0, reversalProbability: 0 };
    }

    // Calcular momentum de los últimos 5 días
    const recentA = klinesA.slice(-5);
    const recentB = klinesB.slice(-5);
    
    const aMomentum = recentA.reduce((sum, kline) => sum + kline.dailyChange, 0) / 5;
    const bMomentum = recentB.reduce((sum, kline) => sum + kline.dailyChange, 0) / 5;
    
    const momentumDivergence = Math.abs(aMomentum - bMomentum);
    
    // Calcular probabilidad de reversión basada en divergencia extrema
    const reversalProbability = Math.min(100, momentumDivergence * 10);
    
    return { aMomentum, bMomentum, momentumDivergence, reversalProbability };
  }

  /**
   * Analiza patrones de volumen para detectar señales
   */
  calculateVolumeMetrics(klinesA: ProcessedKline[], klinesB: ProcessedKline[]): {
    aVolumeTrend: number;
    bVolumeTrend: number;
    volumeCorrelation: number;
    volumeSignal: 'HIGH' | 'MEDIUM' | 'LOW';
  } {
    if (klinesA.length < 10 || klinesB.length < 10) {
      return { aVolumeTrend: 0, bVolumeTrend: 0, volumeCorrelation: 0, volumeSignal: 'LOW' };
    }

    // Calcular tendencia de volumen (últimos 10 días vs anteriores)
    const recentA = klinesA.slice(-10);
    const previousA = klinesA.slice(-20, -10);
    const recentB = klinesB.slice(-10);
    const previousB = klinesB.slice(-20, -10);
    
    const avgRecentA = recentA.reduce((sum, kline) => sum + kline.volume, 0) / 10;
    const avgPreviousA = previousA.reduce((sum, kline) => sum + kline.volume, 0) / 10;
    const avgRecentB = recentB.reduce((sum, kline) => sum + kline.volume, 0) / 10;
    const avgPreviousB = previousB.reduce((sum, kline) => sum + kline.volume, 0) / 10;
    
    const aVolumeTrend = ((avgRecentA - avgPreviousA) / avgPreviousA) * 100;
    const bVolumeTrend = ((avgRecentB - avgPreviousB) / avgPreviousB) * 100;
    
    // Correlación de volumen
    const volumeCorrelation = this.calculateCorrelation(
      recentA.map(k => k.volume),
      recentB.map(k => k.volume)
    );
    
    // Señal de volumen basada en tendencias
    let volumeSignal: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (Math.abs(aVolumeTrend) > 50 || Math.abs(bVolumeTrend) > 50) {
      volumeSignal = 'HIGH';
    } else if (Math.abs(aVolumeTrend) > 20 || Math.abs(bVolumeTrend) > 20) {
      volumeSignal = 'MEDIUM';
    }
    
    return { aVolumeTrend, bVolumeTrend, volumeCorrelation, volumeSignal };
  }

  /**
   * Calcula métricas de volatilidad implícita
   */
  calculateVolatilityMetrics(klinesA: ProcessedKline[], klinesB: ProcessedKline[]): {
    aVolatility: number;
    bVolatility: number;
    volatilityRatio: number;
    volatilityRegime: 'HIGH' | 'MEDIUM' | 'LOW';
    volatilityExpansion: boolean;
  } {
    if (klinesA.length < 20 || klinesB.length < 20) {
      return { 
        aVolatility: 0, 
        bVolatility: 0, 
        volatilityRatio: 0, 
        volatilityRegime: 'LOW',
        volatilityExpansion: false 
      };
    }

    // Volatilidad de los últimos 20 días
    const recentA = klinesA.slice(-20);
    const recentB = klinesB.slice(-20);
    
    const aVolatility = this.calculateVolatility(recentA.map(k => k.dailyChange));
    const bVolatility = this.calculateVolatility(recentB.map(k => k.dailyChange));
    
    const volatilityRatio = bVolatility > 0 ? aVolatility / bVolatility : 0;
    
    // Determinar régimen de volatilidad
    const avgVolatility = (aVolatility + bVolatility) / 2;
    let volatilityRegime: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (avgVolatility > 5) {
      volatilityRegime = 'HIGH';
    } else if (avgVolatility > 2) {
      volatilityRegime = 'MEDIUM';
    }
    
    // Detectar expansión de volatilidad (comparar últimos 10 vs anteriores 10)
    const last10A = klinesA.slice(-10);
    const prev10A = klinesA.slice(-20, -10);
    const last10B = klinesB.slice(-10);
    const prev10B = klinesB.slice(-20, -10);
    
    const volLast10A = this.calculateVolatility(last10A.map(k => k.dailyChange));
    const volPrev10A = this.calculateVolatility(prev10A.map(k => k.dailyChange));
    const volLast10B = this.calculateVolatility(last10B.map(k => k.dailyChange));
    const volPrev10B = this.calculateVolatility(prev10B.map(k => k.dailyChange));
    
    const volatilityExpansion = (volLast10A > volPrev10A * 1.2) || (volLast10B > volPrev10B * 1.2);
    
    return { aVolatility, bVolatility, volatilityRatio, volatilityRegime, volatilityExpansion };
  }

  /**
   * Calcula señales de entrada y salida para estrategias
   */
  calculateTradingSignals(klinesA: ProcessedKline[], klinesB: ProcessedKline[], stats: CorrelationStats): {
    entrySignal: 'LONG_A_SHORT_B' | 'LONG_B_SHORT_A' | 'NEUTRAL';
    exitSignal: 'CLOSE_ALL' | 'HOLD';
    signalStrength: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    expectedReturn: number;
  } {
    if (klinesA.length < 5 || klinesB.length < 5) {
      return {
        entrySignal: 'NEUTRAL',
        exitSignal: 'HOLD',
        signalStrength: 0,
        riskLevel: 'HIGH',
        expectedReturn: 0
      };
    }

    const recentA = klinesA.slice(-5);
    const recentB = klinesB.slice(-5);
    
    // Calcular momentum reciente
    const aMomentum = recentA.reduce((sum, kline) => sum + kline.dailyChange, 0) / 5;
    const bMomentum = recentB.reduce((sum, kline) => sum + kline.dailyChange, 0) / 5;
    
    // Calcular volatilidad reciente
    const aVolatility = this.calculateVolatility(recentA.map(k => k.dailyChange));
    const bVolatility = this.calculateVolatility(recentB.map(k => k.dailyChange));
    
    // Señal de entrada basada en divergencia y correlación inversa
    let entrySignal: 'LONG_A_SHORT_B' | 'LONG_B_SHORT_A' | 'NEUTRAL' = 'NEUTRAL';
    let signalStrength = 0;
    
    if (stats.correlationCoefficient < -0.2) {
      if (aMomentum < -1 && bMomentum > 1) {
        entrySignal = 'LONG_A_SHORT_B';
        signalStrength = Math.min(100, Math.abs(aMomentum - bMomentum) * 10);
      } else if (bMomentum < -1 && aMomentum > 1) {
        entrySignal = 'LONG_B_SHORT_A';
        signalStrength = Math.min(100, Math.abs(aMomentum - bMomentum) * 10);
      }
    }
    
    // Señal de salida basada en convergencia
    let exitSignal: 'CLOSE_ALL' | 'HOLD' = 'HOLD';
    if (Math.abs(aMomentum - bMomentum) < 0.5) {
      exitSignal = 'CLOSE_ALL';
    }
    
    // Nivel de riesgo basado en volatilidad y consistencia
    let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    const avgVolatility = (aVolatility + bVolatility) / 2;
    if (avgVolatility > 5 || stats.consistencyScore < 50) {
      riskLevel = 'HIGH';
    } else if (avgVolatility < 2 && stats.consistencyScore > 70) {
      riskLevel = 'LOW';
    }
    
    // Retorno esperado basado en diferencia promedio histórica
    const expectedReturn = Math.abs(stats.averageDifference) * (signalStrength / 100);
    
    return {
      entrySignal,
      exitSignal,
      signalStrength,
      riskLevel,
      expectedReturn
    };
  }

  /**
   * Calcula métricas de drawdown y riesgo
   */
  calculateRiskMetrics(klinesA: ProcessedKline[], klinesB: ProcessedKline[]): {
    maxDrawdownA: number;
    maxDrawdownB: number;
    sharpeRatioA: number;
    sharpeRatioB: number;
    var95A: number;
    var95B: number;
    riskAdjustedReturn: number;
  } {
    if (klinesA.length < 30 || klinesB.length < 30) {
      return {
        maxDrawdownA: 0,
        maxDrawdownB: 0,
        sharpeRatioA: 0,
        sharpeRatioB: 0,
        var95A: 0,
        var95B: 0,
        riskAdjustedReturn: 0
      };
    }

    // Calcular drawdown máximo
    const maxDrawdownA = this.calculateMaxDrawdown(klinesA);
    const maxDrawdownB = this.calculateMaxDrawdown(klinesB);
    
    // Calcular Sharpe ratio (asumiendo risk-free rate = 0)
    const sharpeRatioA = this.calculateSharpeRatio(klinesA.map(k => k.dailyChange));
    const sharpeRatioB = this.calculateSharpeRatio(klinesB.map(k => k.dailyChange));
    
    // Calcular Value at Risk (VaR) al 95%
    const var95A = this.calculateVaR(klinesA.map(k => k.dailyChange), 0.05);
    const var95B = this.calculateVaR(klinesB.map(k => k.dailyChange), 0.05);
    
    // Retorno ajustado por riesgo
    const avgReturnA = klinesA.reduce((sum, k) => sum + k.dailyChange, 0) / klinesA.length;
    const avgReturnB = klinesB.reduce((sum, k) => sum + k.dailyChange, 0) / klinesB.length;
    const avgVolatilityA = this.calculateVolatility(klinesA.map(k => k.dailyChange));
    const avgVolatilityB = this.calculateVolatility(klinesB.map(k => k.dailyChange));
    
    const riskAdjustedReturn = ((avgReturnA / avgVolatilityA) + (avgReturnB / avgVolatilityB)) / 2;
    
    return {
      maxDrawdownA,
      maxDrawdownB,
      sharpeRatioA,
      sharpeRatioB,
      var95A,
      var95B,
      riskAdjustedReturn
    };
  }

  /**
   * Métodos auxiliares
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private calculateMaxDrawdown(klines: ProcessedKline[]): number {
    let maxDrawdown = 0;
    let peak = klines[0].close;
    
    for (let i = 1; i < klines.length; i++) {
      if (klines[i].close > peak) {
        peak = klines[i].close;
      } else {
        const drawdown = ((peak - klines[i].close) / peak) * 100;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    return maxDrawdown;
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const volatility = this.calculateVolatility(returns);
    
    return volatility === 0 ? 0 : meanReturn / volatility;
  }

  private calculateVaR(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(confidence * sortedReturns.length);
    
    return sortedReturns[index];
  }
}
