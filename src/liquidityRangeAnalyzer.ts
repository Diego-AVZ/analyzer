import { ProcessedKline } from './types';

export interface LiquidityRangeStats {
  tokenA: string;
  tokenB: string;
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
  totalDays: number;
  daysInRange: number;
  daysOutOfRangeUp: number;
  daysOutOfRangeDown: number;
  timeInRangePercentage: number;
  averageVolatility: number;
  maxConsecutiveDaysOut: number;
}

export interface ImpermanentLossEstimation {
  scenarioUp: {
    priceRatio: number;
    impermanentLoss: number;
    finalValue: number;
  };
  scenarioDown: {
    priceRatio: number;
    impermanentLoss: number;
    finalValue: number;
  };
  feesNeededToCoverIL: number;
}

export interface LiquidityRangeAnalysisResult {
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
  impermanentLossEstimation: ImpermanentLossEstimation;
  recommendation: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'RISKY';
  confidence: number;
  advice: string;
}

/**
 * Analizador de rangos de liquidez para Uniswap
 */
export class LiquidityRangeAnalyzer {
  
  /**
   * Analiza un rango de liquidez específico
   */
  analyzeLiquidityRange(
    tokenA: string,
    tokenB: string,
    klinesA: ProcessedKline[],
    klinesB: ProcessedKline[],
    rangeUpPercent: number,
    rangeDownPercent: number
  ): LiquidityRangeAnalysisResult {
    console.log(`🔍 Analizando rango de liquidez para ${tokenA}/${tokenB}`);
    console.log(`📊 Rango: +${rangeUpPercent}% / -${rangeDownPercent}%`);
    
    // Obtener precio actual (último precio disponible)
    const currentPriceA = klinesA[klinesA.length - 1].close;
    const currentPriceB = klinesB[klinesB.length - 1].close;
    
    // Calcular rangos
    const rangeA = {
      min: currentPriceA * (1 - rangeDownPercent / 100),
      max: currentPriceA * (1 + rangeUpPercent / 100)
    };
    
    const rangeB = {
      min: currentPriceB * (1 - rangeDownPercent / 100),
      max: currentPriceB * (1 + rangeUpPercent / 100)
    };
    
    console.log(`💰 Precios actuales: ${tokenA}=$${currentPriceA.toFixed(2)}, ${tokenB}=$${currentPriceB.toFixed(2)}`);
    console.log(`📈 Rangos: ${tokenA}=$${rangeA.min.toFixed(2)}-$${rangeA.max.toFixed(2)}, ${tokenB}=$${rangeB.min.toFixed(2)}-$${rangeB.max.toFixed(2)}`);
    
    // Analizar datos históricos
    const historicalAnalysis = this.analyzeHistoricalData(klinesA, klinesB, rangeA, rangeB);
    
    // Estimar impermanent loss
    const impermanentLossEstimation = this.estimateImpermanentLoss(rangeUpPercent, rangeDownPercent);
    
    // Generar recomendación
    const recommendation = this.generateRecommendation(historicalAnalysis, impermanentLossEstimation);
    
    return {
      pair: `${tokenA}/${tokenB}`,
      currentPriceA,
      currentPriceB,
      rangeA,
      rangeB,
      historicalAnalysis,
      impermanentLossEstimation,
      recommendation: recommendation.recommendation,
      confidence: recommendation.confidence,
      advice: recommendation.advice
    };
  }
  
  /**
   * Analiza los datos históricos para el rango especificado
   */
  private analyzeHistoricalData(
    klinesA: ProcessedKline[],
    klinesB: ProcessedKline[],
    rangeA: { min: number; max: number },
    rangeB: { min: number; max: number }
  ): {
    totalDays: number;
    daysInRange: number;
    daysOutOfRangeUp: number;
    daysOutOfRangeDown: number;
    timeInRangePercentage: number;
    averageVolatility: number;
    maxConsecutiveDaysOut: number;
  } {
    let daysInRange = 0;
    let daysOutOfRangeUp = 0;
    let daysOutOfRangeDown = 0;
    let maxConsecutiveDaysOut = 0;
    let currentConsecutiveDaysOut = 0;
    
    const volatilities: number[] = [];
    
    for (let i = 0; i < klinesA.length; i++) {
      const priceA = klinesA[i].close;
      const priceB = klinesB[i].close;
      
      // Calcular volatilidad diaria (cambio porcentual)
      const volatilityA = Math.abs(klinesA[i].dailyChange);
      const volatilityB = Math.abs(klinesB[i].dailyChange);
      const avgVolatility = (volatilityA + volatilityB) / 2;
      volatilities.push(avgVolatility);
      
      // Verificar si ambos precios están en rango
      const aInRange = priceA >= rangeA.min && priceA <= rangeA.max;
      const bInRange = priceB >= rangeB.min && priceB <= rangeB.max;
      
      if (aInRange && bInRange) {
        daysInRange++;
        currentConsecutiveDaysOut = 0; // Resetear contador
      } else {
        currentConsecutiveDaysOut++;
        maxConsecutiveDaysOut = Math.max(maxConsecutiveDaysOut, currentConsecutiveDaysOut);
        
        // Determinar si salió por arriba o abajo
        if (priceA > rangeA.max || priceB > rangeB.max) {
          daysOutOfRangeUp++;
        } else if (priceA < rangeA.min || priceB < rangeB.min) {
          daysOutOfRangeDown++;
        }
      }
    }
    
    const totalDays = klinesA.length;
    const timeInRangePercentage = (daysInRange / totalDays) * 100;
    const averageVolatility = volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
    
    console.log(`📊 Análisis histórico completado:`);
    console.log(`   • Días en rango: ${daysInRange}/${totalDays} (${timeInRangePercentage.toFixed(1)}%)`);
    console.log(`   • Salidas por arriba: ${daysOutOfRangeUp}`);
    console.log(`   • Salidas por abajo: ${daysOutOfRangeDown}`);
    console.log(`   • Volatilidad promedio: ${averageVolatility.toFixed(2)}%`);
    console.log(`   • Máx. días consecutivos fuera: ${maxConsecutiveDaysOut}`);
    
    return {
      totalDays,
      daysInRange,
      daysOutOfRangeUp,
      daysOutOfRangeDown,
      timeInRangePercentage,
      averageVolatility,
      maxConsecutiveDaysOut
    };
  }
  
  /**
   * Estima el impermanent loss para diferentes escenarios
   */
  private estimateImpermanentLoss(rangeUpPercent: number, rangeDownPercent: number): ImpermanentLossEstimation {
    // Escenario 1: Precio sube al límite superior del rango
    const priceRatioUp = 1 + (rangeUpPercent / 100);
    const ilUp = this.calculateImpermanentLoss(priceRatioUp);
    const finalValueUp = 1000 * (1 + ilUp / 100); // Asumiendo inversión de $1000
    
    // Escenario 2: Precio baja al límite inferior del rango
    const priceRatioDown = 1 - (rangeDownPercent / 100);
    const ilDown = this.calculateImpermanentLoss(1 / priceRatioDown); // Invertir el ratio
    const finalValueDown = 1000 * (1 + ilDown / 100); // Asumiendo inversión de $1000
    
    // Calcular fees necesarios para cubrir IL promedio
    const avgIL = (Math.abs(ilUp) + Math.abs(ilDown)) / 2;
    const feesNeededToCoverIL = avgIL * 1.2; // 20% de margen adicional
    
    console.log(`💸 Estimación de Impermanent Loss:`);
    console.log(`   • Escenario subida: ${ilUp.toFixed(2)}% IL`);
    console.log(`   • Escenario bajada: ${ilDown.toFixed(2)}% IL`);
    console.log(`   • Fees necesarios: ${feesNeededToCoverIL.toFixed(2)}%`);
    
    return {
      scenarioUp: {
        priceRatio: priceRatioUp,
        impermanentLoss: ilUp,
        finalValue: finalValueUp
      },
      scenarioDown: {
        priceRatio: priceRatioDown,
        impermanentLoss: ilDown,
        finalValue: finalValueDown
      },
      feesNeededToCoverIL
    };
  }
  
  /**
   * Calcula el impermanent loss para un ratio de precio dado
   * Fórmula para liquidez concentrada: IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
   */
  private calculateImpermanentLoss(priceRatio: number): number {
    if (priceRatio <= 0) return 0;
    
    const sqrtRatio = Math.sqrt(priceRatio);
    const il = (2 * sqrtRatio) / (1 + priceRatio) - 1;
    return il * 100; // Convertir a porcentaje
  }
  
  /**
   * Genera una recomendación basada en el análisis
   */
  private generateRecommendation(
    historicalAnalysis: {
      totalDays: number;
      daysInRange: number;
      daysOutOfRangeUp: number;
      daysOutOfRangeDown: number;
      timeInRangePercentage: number;
      averageVolatility: number;
      maxConsecutiveDaysOut: number;
    },
    impermanentLossEstimation: ImpermanentLossEstimation
  ): { recommendation: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'RISKY'; confidence: number; advice: string } {
    const timeInRange = historicalAnalysis.timeInRangePercentage;
    const avgIL = (Math.abs(impermanentLossEstimation.scenarioUp.impermanentLoss) + 
                   Math.abs(impermanentLossEstimation.scenarioDown.impermanentLoss)) / 2;
    const feesNeeded = impermanentLossEstimation.feesNeededToCoverIL;
    const volatility = historicalAnalysis.averageVolatility;
    
    let recommendation: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'RISKY';
    let confidence: number;
    let advice: string;
    
    // Lógica de recomendación
    if (timeInRange >= 80 && avgIL <= 2 && volatility <= 5) {
      recommendation = 'EXCELLENT';
      confidence = 90;
      advice = `Excelente rango! El precio ha estado en rango el ${timeInRange.toFixed(1)}% del tiempo. 
                El IL promedio es bajo (${avgIL.toFixed(1)}%) y la volatilidad es moderada. 
                Este rango es ideal para maximizar fees con bajo riesgo.`;
    } else if (timeInRange >= 70 && avgIL <= 4 && volatility <= 8) {
      recommendation = 'GOOD';
      confidence = 75;
      advice = `Buen rango. El precio ha estado en rango el ${timeInRange.toFixed(1)}% del tiempo. 
                El IL promedio es moderado (${avgIL.toFixed(1)}%) pero manejable. 
                Considera este rango si puedes generar suficientes fees.`;
    } else if (timeInRange >= 60 && avgIL <= 6 && volatility <= 12) {
      recommendation = 'MODERATE';
      confidence = 60;
      advice = `Rango moderado. El precio ha estado en rango el ${timeInRange.toFixed(1)}% del tiempo. 
                El IL promedio es ${avgIL.toFixed(1)}% y necesitarás generar al menos ${feesNeeded.toFixed(1)}% en fees. 
                Considera un rango más amplio si la volatilidad te preocupa.`;
    } else {
      recommendation = 'RISKY';
      confidence = 40;
      advice = `Rango arriesgado. El precio solo ha estado en rango el ${timeInRange.toFixed(1)}% del tiempo. 
                El IL promedio es alto (${avgIL.toFixed(1)}%) y la volatilidad es elevada (${volatility.toFixed(1)}%). 
                Recomendamos un rango más amplio o reconsiderar este par.`;
    }
    
    console.log(`🎯 Recomendación generada: ${recommendation} (${confidence}% confianza)`);
    
    return { recommendation, confidence, advice };
  }
}
