import { ProcessedKline, CorrelationStats, AnalysisResult, TokenData } from './types';


export class CorrelationAnalyzer {
  
  
  analyzeCorrelation(tokenA: string, tokenB: string, klinesA: ProcessedKline[], klinesB: ProcessedKline[]): CorrelationStats {
    
    const totalDays = klinesA.length;
    let validDays = 0;
    let inverseCorrelationDays = 0;
    let oppositeDirectionDays = 0;
    let aOutperformsB = 0;
    let bOutperformsA = 0;
    
    let totalDifference = 0;
    let totalDifferenceWhenAUp = 0;
    let totalDifferenceWhenBUp = 0;
    let daysWhenAUp = 0;
    let daysWhenBUp = 0;
    
    let maxSingleDayDifference = 0;
    let minSingleDayDifference = 0;
    
    let consecutiveInverseDays = 0;
    let maxConsecutiveInverseDays = 0;
    let currentConsecutiveInverseDays = 0;
    
    const dailyChangesA: number[] = [];
    const dailyChangesB: number[] = [];
    const differences: number[] = [];

    for (let i = 0; i < totalDays; i++) {
      const klineA = klinesA[i];
      const klineB = klinesB[i];
      
      // Verificar que los timestamps coincidan
      if (klineA.timestamp !== klineB.timestamp) {
        continue;
      }

      validDays++;
      
      const changeA = klineA.dailyChange;
      const changeB = klineB.dailyChange;
      const difference = changeA - changeB;
      
      dailyChangesA.push(changeA);
      dailyChangesB.push(changeB);
      differences.push(difference);
      
      totalDifference += difference;
      
      // Actualizar diferencias máximas y mínimas
      if (i === 0) {
        maxSingleDayDifference = difference;
        minSingleDayDifference = difference;
      } else {
        maxSingleDayDifference = Math.max(maxSingleDayDifference, difference);
        minSingleDayDifference = Math.min(minSingleDayDifference, difference);
      }
      
      // Análisis de dirección
      const aUp = changeA > 0;
      const bUp = changeB > 0;
      const aDown = changeA < 0;
      const bDown = changeB < 0;
      
      // Días donde van en direcciones opuestas
      if ((aUp && bDown) || (aDown && bUp)) {
        oppositeDirectionDays++;
      }
      
      // Días donde A supera a B
      if (changeA > changeB) {
        aOutperformsB++;
        totalDifferenceWhenAUp += difference;
        daysWhenAUp++;
      }
      
      // Días donde B supera a A
      if (changeB > changeA) {
        bOutperformsA++;
        totalDifferenceWhenBUp += difference;
        daysWhenBUp++;
      }
      
      // Correlación inversa: A sube más que B baja, o B sube más que A baja
      const inverseCondition = (aUp && bDown && changeA > Math.abs(changeB)) || 
                               (bUp && aDown && changeB > Math.abs(changeA));
      
      if (inverseCondition) {
        inverseCorrelationDays++;
        consecutiveInverseDays++;
        currentConsecutiveInverseDays = consecutiveInverseDays;
        maxConsecutiveInverseDays = Math.max(maxConsecutiveInverseDays, consecutiveInverseDays);
      } else {
        consecutiveInverseDays = 0;
      }
    }

    // Calcular métricas estadísticas
    const averageDifference = validDays > 0 ? totalDifference / validDays : 0;
    const averageDifferenceWhenAUp = daysWhenAUp > 0 ? totalDifferenceWhenAUp / daysWhenAUp : 0;
    const averageDifferenceWhenBUp = daysWhenBUp > 0 ? totalDifferenceWhenBUp / daysWhenBUp : 0;
    
    // Calcular correlación estadística
    const correlationCoefficient = this.calculateCorrelationCoefficient(dailyChangesA, dailyChangesB);
    
    // Calcular volatilidades
    const aVolatility = this.calculateVolatility(dailyChangesA);
    const bVolatility = this.calculateVolatility(dailyChangesB);
    const volatilityRatio = bVolatility > 0 ? aVolatility / bVolatility : 0;
    
    // Calcular score de consistencia
    const consistencyScore = this.calculateConsistencyScore(differences, averageDifference);

    const stats: CorrelationStats = {
      tokenA,
      tokenB,
      totalDays,
      validDays,
      inverseCorrelationDays,
      inverseCorrelationPercentage: validDays > 0 ? (inverseCorrelationDays / validDays) * 100 : 0,
      oppositeDirectionDays,
      oppositeDirectionPercentage: validDays > 0 ? (oppositeDirectionDays / validDays) * 100 : 0,
      aOutperformsB,
      aOutperformsBPercentage: validDays > 0 ? (aOutperformsB / validDays) * 100 : 0,
      bOutperformsA,
      bOutperformsAPercentage: validDays > 0 ? (bOutperformsA / validDays) * 100 : 0,
      averageDifference,
      averageDifferenceWhenAUp,
      averageDifferenceWhenBUp,
      correlationCoefficient,
      maxSingleDayDifference,
      minSingleDayDifference,
      consistencyScore,
      aVolatility,
      bVolatility,
      volatilityRatio,
      maxConsecutiveInverseDays,
      currentConsecutiveInverseDays
    };

    return stats;
  }

  
  private calculateCorrelationCoefficient(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      return 0;
    }

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

  
  private calculateVolatility(changes: number[]): number {
    if (changes.length === 0) return 0;
    
    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
    
    return Math.sqrt(variance);
  }

  
  private calculateConsistencyScore(differences: number[], averageDifference: number): number {
    if (differences.length === 0) return 0;
    
    const variance = differences.reduce((sum, diff) => sum + Math.pow(diff - averageDifference, 2), 0) / differences.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Score inversamente proporcional a la desviación estándar
    // Más consistente = menor desviación = mayor score
    return Math.max(0, 100 - (standardDeviation * 10));
  }

  
  generateRecommendation(stats: CorrelationStats): AnalysisResult {
    let recommendation: 'STRONG_INVERSE' | 'MODERATE_INVERSE' | 'WEAK_INVERSE' | 'NO_CORRELATION';
    let confidence = 0;
    let strategyAdvice = '';

    // Evaluar correlación inversa
    if (stats.inverseCorrelationPercentage >= 40 && stats.correlationCoefficient <= -0.3) {
      recommendation = 'STRONG_INVERSE';
      confidence = Math.min(100, stats.inverseCorrelationPercentage + Math.abs(stats.correlationCoefficient) * 100);
      strategyAdvice = `🔥 CORRELACIÓN INVERSA FUERTE: ${stats.inverseCorrelationPercentage.toFixed(1)}% de días con correlación inversa. 
      Estrategia recomendada: Long en ${stats.tokenA} cuando ${stats.tokenB} baja, Short en ${stats.tokenB} cuando ${stats.tokenA} sube.
      Diferencia promedio: ${stats.averageDifference.toFixed(2)}%.`;
    } else if (stats.inverseCorrelationPercentage >= 25 && stats.correlationCoefficient <= -0.2) {
      recommendation = 'MODERATE_INVERSE';
      confidence = Math.min(100, stats.inverseCorrelationPercentage + Math.abs(stats.correlationCoefficient) * 100);
      strategyAdvice = `⚡ CORRELACIÓN INVERSA MODERADA: ${stats.inverseCorrelationPercentage.toFixed(1)}% de días con correlación inversa.
      Estrategia recomendada: Considerar posiciones contrarias en días de alta volatilidad.
      Diferencia promedio: ${stats.averageDifference.toFixed(2)}%.`;
    } else if (stats.inverseCorrelationPercentage >= 15) {
      recommendation = 'WEAK_INVERSE';
      confidence = stats.inverseCorrelationPercentage;
      strategyAdvice = `📊 CORRELACIÓN INVERSA DÉBIL: ${stats.inverseCorrelationPercentage.toFixed(1)}% de días con correlación inversa.
      Estrategia recomendada: Análisis adicional necesario antes de implementar estrategia contraria.`;
    } else {
      recommendation = 'NO_CORRELATION';
      confidence = 100 - stats.inverseCorrelationPercentage;
      strategyAdvice = `❌ SIN CORRELACIÓN INVERSA SIGNIFICATIVA: Solo ${stats.inverseCorrelationPercentage.toFixed(1)}% de días con correlación inversa.
      Estrategia recomendada: Buscar otros pares de tokens o estrategias diferentes.`;
    }

    // Añadir información adicional
    strategyAdvice += `\n\n📈 MÉTRICAS ADICIONALES:
    • Días opuestos: ${stats.oppositeDirectionPercentage.toFixed(1)}%
    • ${stats.tokenA} supera a ${stats.tokenB}: ${stats.aOutperformsBPercentage.toFixed(1)}%
    • ${stats.tokenB} supera a ${stats.tokenA}: ${stats.bOutperformsAPercentage.toFixed(1)}%
    • Volatilidad ${stats.tokenA}: ${stats.aVolatility.toFixed(2)}%
    • Volatilidad ${stats.tokenB}: ${stats.bVolatility.toFixed(2)}%
    • Ratio volatilidad: ${stats.volatilityRatio.toFixed(2)}
    • Máximo consecutivo inverso: ${stats.maxConsecutiveInverseDays} días
    • Consistencia: ${stats.consistencyScore.toFixed(1)}/100`;

    return {
      pair: `${stats.tokenA}/${stats.tokenB}`,
      stats,
      recommendation,
      confidence,
      strategyAdvice
    };
  }

  
  analyzeMultiplePairs(tokenPairs: Array<{tokenA: string, tokenB: string, klinesA: ProcessedKline[], klinesB: ProcessedKline[]}>): AnalysisResult[] {
    
    const results: AnalysisResult[] = [];
    
    tokenPairs.forEach((pair, index) => {
      
      try {
        const stats = this.analyzeCorrelation(pair.tokenA, pair.tokenB, pair.klinesA, pair.klinesB);
        const result = this.generateRecommendation(stats);
        results.push(result);
      } catch (error) {
        results.push({
          pair: `${pair.tokenA}/${pair.tokenB}`,
          stats: {} as CorrelationStats,
          recommendation: 'NO_CORRELATION',
          confidence: 0,
          strategyAdvice: `Error en el análisis: ${error}`
        });
      }
    });

    return results;
  }
}
