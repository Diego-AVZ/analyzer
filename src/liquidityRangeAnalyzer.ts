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
  currentPriceRatio: number; // Precio de A en términos de B (A/B)
  priceRatioRange: {
    min: number; // Ratio mínimo (A/B)
    max: number; // Ratio máximo (A/B)
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


export class LiquidityRangeAnalyzer {
  
  
  analyzeLiquidityRange(
    tokenA: string,
    tokenB: string,
    klinesA: ProcessedKline[],
    klinesB: ProcessedKline[],
    rangeUpPercent: number,
    rangeDownPercent: number
  ): LiquidityRangeAnalysisResult {
    
    const currentPriceA = klinesA[klinesA.length - 1].close;
    const currentPriceB = klinesB[klinesB.length - 1].close;
    
    const currentPriceRatio = currentPriceB !== 0 ? currentPriceA / currentPriceB : 0;
    
    const priceRatioRange = {
      min: currentPriceRatio * (1 - rangeDownPercent / 100),
      max: currentPriceRatio * (1 + rangeUpPercent / 100)
    };
    
    const historicalAnalysis = this.analyzeHistoricalData(klinesA, klinesB, currentPriceRatio, priceRatioRange);
    
    const impermanentLossEstimation = this.estimateImpermanentLoss(rangeUpPercent, rangeDownPercent);
    
    const recommendation = this.generateRecommendation(historicalAnalysis, impermanentLossEstimation);
    
    return {
      pair: `${tokenA}/${tokenB}`,
      currentPriceA,
      currentPriceB,
      currentPriceRatio,
      priceRatioRange,
      historicalAnalysis,
      impermanentLossEstimation,
      recommendation: recommendation.recommendation,
      confidence: recommendation.confidence,
      advice: recommendation.advice
    };
  }
  
  
  private analyzeHistoricalData(
    klinesA: ProcessedKline[],
    klinesB: ProcessedKline[],
    currentPriceRatio: number,
    priceRatioRange: { min: number; max: number }
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
      
      // Calcular el ratio de precios histórico (A/B)
      const historicalPriceRatio = priceB !== 0 ? priceA / priceB : 0;
      
      // Calcular volatilidad del ratio (cambio porcentual del ratio)
      let ratioVolatility = 0;
      if (i > 0) {
        const prevPriceA = klinesA[i - 1].close;
        const prevPriceB = klinesB[i - 1].close;
        const prevRatio = prevPriceB !== 0 ? prevPriceA / prevPriceB : 0;
        if (prevRatio > 0) {
          ratioVolatility = Math.abs((historicalPriceRatio - prevRatio) / prevRatio) * 100;
        }
      }
      volatilities.push(ratioVolatility);
      
      // Verificar si el ratio está en rango
      const ratioInRange = historicalPriceRatio >= priceRatioRange.min && historicalPriceRatio <= priceRatioRange.max;
      
      if (ratioInRange) {
        daysInRange++;
        currentConsecutiveDaysOut = 0; // Resetear contador
      } else {
        currentConsecutiveDaysOut++;
        maxConsecutiveDaysOut = Math.max(maxConsecutiveDaysOut, currentConsecutiveDaysOut);
        
        // Determinar si salió por arriba o abajo del rango del ratio
        if (historicalPriceRatio > priceRatioRange.max) {
          daysOutOfRangeUp++;
        } else if (historicalPriceRatio < priceRatioRange.min) {
          daysOutOfRangeDown++;
        }
      }
    }
    
    const totalDays = klinesA.length;
    const timeInRangePercentage = (daysInRange / totalDays) * 100;
    const averageVolatility = volatilities.length > 0 
      ? volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length 
      : 0;
    
    
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
  
  
  private calculateImpermanentLoss(priceRatio: number): number {
    if (priceRatio <= 0) return 0;
    
    const sqrtRatio = Math.sqrt(priceRatio);
    const il = (2 * sqrtRatio) / (1 + priceRatio) - 1;
    return il * 100; // Convertir a porcentaje
  }
  
  
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
    
    
    return { recommendation, confidence, advice };
  }
}
