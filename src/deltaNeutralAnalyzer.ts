import { BinanceService } from './binanceService';
import { LongShortAnalyzer, LongShortStats, LongShortAnalysisResult } from './longShortAnalyzer';
import { ProcessedKline } from './types';


export type StrategyResult = LongShortAnalysisResult;


export interface StrategyCorrelation {
  bothWinDays: number;
  bothLoseDays: number;
  strategyAWinsStrategyBLoses: number;
  strategyBWinsStrategyALoses: number;
  correlationCoefficient: number;
  hedgeEffectiveness: number; // Qué tan efectiva es la cobertura mutua
  combinedVolatility: number;
  portfolioSharpeRatio: number;
}


export interface DeltaNeutralResult {
  strategyA: StrategyResult;
  strategyB: StrategyResult;
  correlation: StrategyCorrelation;
  portfolioMetrics: {
    combinedWinRate: number;
    combinedTotalProfit: number;
    combinedAverageDailyProfit: number;
    maxCombinedDrawdown: number;
    portfolioVolatility: number;
    portfolioSharpeRatio: number;
    riskReduction: number; // % de reducción de riesgo vs estrategia individual
    diversificationBenefit: number; // Beneficio de diversificación
  };
  recommendation: {
    overallRecommendation: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
    confidence: number;
    advice: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}


export class DeltaNeutralAnalyzer {
  private binanceService: BinanceService;
  private longShortAnalyzer: LongShortAnalyzer;

  constructor() {
    this.binanceService = new BinanceService(
      'https://api.binance.com/api/v3/klines',
      '1d',
      100
    );
    this.longShortAnalyzer = new LongShortAnalyzer();
  }

  
  async analyzeDeltaNeutral(
    strategyA: { longToken: string; shortToken: string },
    strategyB: { longToken: string; shortToken: string },
    timePeriod: number = 100
  ): Promise<DeltaNeutralResult> {

    this.binanceService = new BinanceService(
      'https://api.binance.com/api/v3/klines',
      '1d',
      timePeriod
    );

    const strategyAResult = await this.analyzeSingleStrategy(
      strategyA.longToken,
      strategyA.shortToken
    );

    const strategyBResult = await this.analyzeSingleStrategy(
      strategyB.longToken,
      strategyB.shortToken
    );

    const correlation = this.analyzeStrategyCorrelation(strategyAResult, strategyBResult);

    const portfolioMetrics = this.calculatePortfolioMetrics(strategyAResult, strategyBResult, correlation);

    const recommendation = this.generateRecommendation(strategyAResult, strategyBResult, correlation, portfolioMetrics);

    const result: DeltaNeutralResult = {
      strategyA: strategyAResult,
      strategyB: strategyBResult,
      correlation,
      portfolioMetrics,
      recommendation
    };

    this.printSummary(result);

    return result;
  }

  
  private async analyzeSingleStrategy(longToken: string, shortToken: string): Promise<StrategyResult> {
    const longTokenData = await this.binanceService.getKlines(longToken.toUpperCase());
    const shortTokenData = await this.binanceService.getKlines(shortToken.toUpperCase());

    if (!longTokenData.success || !shortTokenData.success) {
      throw new Error(`Error obteniendo datos: ${longTokenData.error || shortTokenData.error}`);
    }

    const longKlines = this.binanceService.processKlines(longTokenData.data!);
    const shortKlines = this.binanceService.processKlines(shortTokenData.data!);

    if (!this.binanceService.validateKlines(longKlines) || !this.binanceService.validateKlines(shortKlines)) {
      throw new Error('Datos inválidos obtenidos de Binance');
    }

    const filteredLongKlines = this.binanceService.filterValidDays(longKlines);
    const filteredShortKlines = this.binanceService.filterValidDays(shortKlines);

    const { synchronizedA, synchronizedB } = this.binanceService.synchronizeTimestamps(
      filteredLongKlines,
      filteredShortKlines
    );

    if (synchronizedA.length < 30) {
      throw new Error(`Insuficientes datos válidos: ${synchronizedA.length} días (mínimo: 30)`);
    }

    const stats = this.longShortAnalyzer.analyzeLongShortStrategy(
      longToken.toUpperCase(),
      shortToken.toUpperCase(),
      synchronizedA,
      synchronizedB
    );

    const result = this.longShortAnalyzer.generateRecommendation(stats);
    return result;
  }

  
  private analyzeStrategyCorrelation(strategyA: StrategyResult, strategyB: StrategyResult): StrategyCorrelation {
    const dailyProfitsA = strategyA.stats.dailyProfits;
    const dailyProfitsB = strategyB.stats.dailyProfits;
    
    let bothWinDays = 0;
    let bothLoseDays = 0;
    let strategyAWinsStrategyBLoses = 0;
    let strategyBWinsStrategyALoses = 0;

    for (let i = 0; i < dailyProfitsA.length; i++) {
      const profitA = dailyProfitsA[i];
      const profitB = dailyProfitsB[i];

      if (profitA > 0 && profitB > 0) {
        bothWinDays++;
      } else if (profitA < 0 && profitB < 0) {
        bothLoseDays++;
      } else if (profitA > 0 && profitB < 0) {
        strategyAWinsStrategyBLoses++;
      } else if (profitA < 0 && profitB > 0) {
        strategyBWinsStrategyALoses++;
      }
    }

    const correlationCoefficient = this.calculateCorrelationCoefficient(dailyProfitsA, dailyProfitsB);

    const totalDays = dailyProfitsA.length;
    const hedgeDays = strategyAWinsStrategyBLoses + strategyBWinsStrategyALoses;
    const hedgeEffectiveness = (hedgeDays / totalDays) * 100;

    const combinedVolatility = this.calculateCombinedVolatility(dailyProfitsA, dailyProfitsB);

    const portfolioSharpeRatio = this.calculatePortfolioSharpeRatio(dailyProfitsA, dailyProfitsB);

    return {
      bothWinDays,
      bothLoseDays,
      strategyAWinsStrategyBLoses,
      strategyBWinsStrategyALoses,
      correlationCoefficient,
      hedgeEffectiveness,
      combinedVolatility,
      portfolioSharpeRatio
    };
  }

  
  private calculateCorrelationCoefficient(arrayA: number[], arrayB: number[]): number {
    const n = arrayA.length;
    const sumA = arrayA.reduce((sum, val) => sum + val, 0);
    const sumB = arrayB.reduce((sum, val) => sum + val, 0);
    const sumAB = arrayA.reduce((sum, val, i) => sum + val * arrayB[i], 0);
    const sumA2 = arrayA.reduce((sum, val) => sum + val * val, 0);
    const sumB2 = arrayB.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumAB - sumA * sumB;
    const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  
  private calculateCombinedVolatility(dailyProfitsA: number[], dailyProfitsB: number[]): number {
    const combinedProfits = dailyProfitsA.map((profit, i) => (profit + dailyProfitsB[i]) / 2);
    const mean = combinedProfits.reduce((sum, val) => sum + val, 0) / combinedProfits.length;
    const variance = combinedProfits.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / combinedProfits.length;
    return Math.sqrt(variance);
  }

  
  private calculatePortfolioSharpeRatio(dailyProfitsA: number[], dailyProfitsB: number[]): number {
    const combinedProfits = dailyProfitsA.map((profit, i) => (profit + dailyProfitsB[i]) / 2);
    const mean = combinedProfits.reduce((sum, val) => sum + val, 0) / combinedProfits.length;
    const volatility = this.calculateCombinedVolatility(dailyProfitsA, dailyProfitsB);
    return volatility === 0 ? 0 : mean / volatility;
  }

  
  private calculatePortfolioMetrics(
    strategyA: StrategyResult,
    strategyB: StrategyResult,
    correlation: StrategyCorrelation
  ): DeltaNeutralResult['portfolioMetrics'] {
    const combinedWinRate = (correlation.bothWinDays / strategyA.stats.totalDays) * 100;
    const combinedTotalProfit = (strategyA.stats.totalProfit + strategyB.stats.totalProfit) / 2;
    const combinedAverageDailyProfit = (strategyA.stats.averageDailyProfit + strategyB.stats.averageDailyProfit) / 2;

    const maxDrawdownA = strategyA.stats.maxDrawdown;
    const maxDrawdownB = strategyB.stats.maxDrawdown;
    const maxCombinedDrawdown = Math.max(maxDrawdownA, maxDrawdownB);

    const individualVolatility = (strategyA.stats.profitVolatility + strategyB.stats.profitVolatility) / 2;
    const riskReduction = ((individualVolatility - correlation.combinedVolatility) / individualVolatility) * 100;

    const diversificationBenefit = correlation.hedgeEffectiveness;

    return {
      combinedWinRate,
      combinedTotalProfit,
      combinedAverageDailyProfit,
      maxCombinedDrawdown,
      portfolioVolatility: correlation.combinedVolatility,
      portfolioSharpeRatio: correlation.portfolioSharpeRatio,
      riskReduction,
      diversificationBenefit
    };
  }

  
  private generateRecommendation(
    strategyA: StrategyResult,
    strategyB: StrategyResult,
    correlation: StrategyCorrelation,
    portfolioMetrics: DeltaNeutralResult['portfolioMetrics']
  ): DeltaNeutralResult['recommendation'] {
    let overallRecommendation: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' = 'POOR';
    let confidence = 0;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';

    const criteria = {
      bothStrategiesGood: strategyA.recommendation !== 'SELL' && strategyB.recommendation !== 'SELL',
      lowCorrelation: Math.abs(correlation.correlationCoefficient) < 0.3,
      goodHedgeEffectiveness: correlation.hedgeEffectiveness > 30,
      riskReduction: portfolioMetrics.riskReduction > 10,
      goodCombinedWinRate: portfolioMetrics.combinedWinRate > 50
    };

    const score = Object.values(criteria).filter(Boolean).length;
    
    if (score >= 4) {
      overallRecommendation = 'EXCELLENT';
      confidence = 85;
      riskLevel = 'LOW';
    } else if (score >= 3) {
      overallRecommendation = 'GOOD';
      confidence = 70;
      riskLevel = 'MEDIUM';
    } else if (score >= 2) {
      overallRecommendation = 'MODERATE';
      confidence = 55;
      riskLevel = 'MEDIUM';
    } else {
      overallRecommendation = 'POOR';
      confidence = 30;
      riskLevel = 'HIGH';
    }

    let advice = '';
    if (overallRecommendation === 'EXCELLENT') {
      advice = '🔥 EXCELENTE combinación delta neutral. Ambas estrategias se complementan perfectamente con alta efectividad de cobertura.';
    } else if (overallRecommendation === 'GOOD') {
      advice = '⚡ BUENA combinación. Las estrategias ofrecen diversificación adecuada con cobertura moderada.';
    } else if (overallRecommendation === 'MODERATE') {
      advice = '📊 COMBINACIÓN MODERADA. Considerar gestión de riesgo adicional debido a correlación limitada.';
    } else {
      advice = '⚠️ COMBINACIÓN POCO EFECTIVA. Las estrategias están muy correlacionadas o tienen rendimientos pobres.';
    }

    return {
      overallRecommendation,
      confidence,
      advice,
      riskLevel
    };
  }

  
  private printSummary(result: DeltaNeutralResult): void {
    
    
    
    
    
    
  }
}
