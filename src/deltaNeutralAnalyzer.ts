import { BinanceService } from './binanceService';
import { LongShortAnalyzer, LongShortStats, LongShortAnalysisResult } from './longShortAnalyzer';
import { ProcessedKline } from './types';

/**
 * Resultado de análisis de una estrategia individual
 * Ahora usa la interfaz correcta del LongShortAnalyzer
 */
export type StrategyResult = LongShortAnalysisResult;

/**
 * Análisis de correlación entre dos estrategias
 */
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

/**
 * Resultado del análisis delta neutral
 */
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

/**
 * Analizador de estrategias delta neutral combinadas
 */
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

  /**
   * Analiza dos estrategias Long/Short y su combinación delta neutral
   */
  async analyzeDeltaNeutral(
    strategyA: { longToken: string; shortToken: string },
    strategyB: { longToken: string; shortToken: string },
    timePeriod: number = 100
  ): Promise<DeltaNeutralResult> {
    console.log(`🔍 Iniciando análisis delta neutral...`);
    console.log(`📊 Estrategia A: LONG ${strategyA.longToken}/SHORT ${strategyA.shortToken}`);
    console.log(`📊 Estrategia B: LONG ${strategyB.longToken}/SHORT ${strategyB.shortToken}`);

    // Actualizar período de tiempo
    this.binanceService = new BinanceService(
      'https://api.binance.com/api/v3/klines',
      '1d',
      timePeriod
    );

    // Analizar estrategia A
    console.log(`\n🔬 Analizando Estrategia A...`);
    const strategyAResult = await this.analyzeSingleStrategy(
      strategyA.longToken,
      strategyA.shortToken
    );

    // Analizar estrategia B
    console.log(`\n🔬 Analizando Estrategia B...`);
    const strategyBResult = await this.analyzeSingleStrategy(
      strategyB.longToken,
      strategyB.shortToken
    );

    // Analizar correlación entre estrategias
    console.log(`\n🔗 Analizando correlación entre estrategias...`);
    const correlation = this.analyzeStrategyCorrelation(strategyAResult, strategyBResult);

    // Calcular métricas del portafolio combinado
    console.log(`\n📈 Calculando métricas del portafolio combinado...`);
    const portfolioMetrics = this.calculatePortfolioMetrics(strategyAResult, strategyBResult, correlation);

    // Generar recomendación final
    const recommendation = this.generateRecommendation(strategyAResult, strategyBResult, correlation, portfolioMetrics);

    const result: DeltaNeutralResult = {
      strategyA: strategyAResult,
      strategyB: strategyBResult,
      correlation,
      portfolioMetrics,
      recommendation
    };

    console.log(`\n✅ Análisis delta neutral completado!`);
    this.printSummary(result);

    return result;
  }

  /**
   * Analiza una estrategia individual
   */
  private async analyzeSingleStrategy(longToken: string, shortToken: string): Promise<StrategyResult> {
    // Obtener datos de ambos tokens
    const longTokenData = await this.binanceService.getKlines(longToken.toUpperCase());
    const shortTokenData = await this.binanceService.getKlines(shortToken.toUpperCase());

    if (!longTokenData.success || !shortTokenData.success) {
      throw new Error(`Error obteniendo datos: ${longTokenData.error || shortTokenData.error}`);
    }

    // Procesar los datos
    const longKlines = this.binanceService.processKlines(longTokenData.data!);
    const shortKlines = this.binanceService.processKlines(shortTokenData.data!);

    // Validar datos
    if (!this.binanceService.validateKlines(longKlines) || !this.binanceService.validateKlines(shortKlines)) {
      throw new Error('Datos inválidos obtenidos de Binance');
    }

    // Filtrar días válidos
    const filteredLongKlines = this.binanceService.filterValidDays(longKlines);
    const filteredShortKlines = this.binanceService.filterValidDays(shortKlines);

    // Sincronizar timestamps
    const { synchronizedA, synchronizedB } = this.binanceService.synchronizeTimestamps(
      filteredLongKlines,
      filteredShortKlines
    );

    if (synchronizedA.length < 30) {
      throw new Error(`Insuficientes datos válidos: ${synchronizedA.length} días (mínimo: 30)`);
    }

    // Realizar análisis Long/Short
    const stats = this.longShortAnalyzer.analyzeLongShortStrategy(
      longToken.toUpperCase(),
      shortToken.toUpperCase(),
      synchronizedA,
      synchronizedB
    );

    const result = this.longShortAnalyzer.generateRecommendation(stats);
    return result;
  }

  /**
   * Analiza la correlación entre dos estrategias
   */
  private analyzeStrategyCorrelation(strategyA: StrategyResult, strategyB: StrategyResult): StrategyCorrelation {
    const dailyProfitsA = strategyA.stats.dailyProfits;
    const dailyProfitsB = strategyB.stats.dailyProfits;
    
    let bothWinDays = 0;
    let bothLoseDays = 0;
    let strategyAWinsStrategyBLoses = 0;
    let strategyBWinsStrategyALoses = 0;

    // Contar días por categoría
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

    // Calcular correlación estadística
    const correlationCoefficient = this.calculateCorrelationCoefficient(dailyProfitsA, dailyProfitsB);

    // Calcular efectividad de cobertura
    const totalDays = dailyProfitsA.length;
    const hedgeDays = strategyAWinsStrategyBLoses + strategyBWinsStrategyALoses;
    const hedgeEffectiveness = (hedgeDays / totalDays) * 100;

    // Calcular volatilidad combinada
    const combinedVolatility = this.calculateCombinedVolatility(dailyProfitsA, dailyProfitsB);

    // Calcular Sharpe ratio del portafolio
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

  /**
   * Calcula el coeficiente de correlación entre dos arrays
   */
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

  /**
   * Calcula la volatilidad combinada del portafolio
   */
  private calculateCombinedVolatility(dailyProfitsA: number[], dailyProfitsB: number[]): number {
    const combinedProfits = dailyProfitsA.map((profit, i) => (profit + dailyProfitsB[i]) / 2);
    const mean = combinedProfits.reduce((sum, val) => sum + val, 0) / combinedProfits.length;
    const variance = combinedProfits.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / combinedProfits.length;
    return Math.sqrt(variance);
  }

  /**
   * Calcula el Sharpe ratio del portafolio
   */
  private calculatePortfolioSharpeRatio(dailyProfitsA: number[], dailyProfitsB: number[]): number {
    const combinedProfits = dailyProfitsA.map((profit, i) => (profit + dailyProfitsB[i]) / 2);
    const mean = combinedProfits.reduce((sum, val) => sum + val, 0) / combinedProfits.length;
    const volatility = this.calculateCombinedVolatility(dailyProfitsA, dailyProfitsB);
    return volatility === 0 ? 0 : mean / volatility;
  }

  /**
   * Calcula las métricas del portafolio combinado
   */
  private calculatePortfolioMetrics(
    strategyA: StrategyResult,
    strategyB: StrategyResult,
    correlation: StrategyCorrelation
  ): DeltaNeutralResult['portfolioMetrics'] {
    const combinedWinRate = (correlation.bothWinDays / strategyA.stats.totalDays) * 100;
    const combinedTotalProfit = (strategyA.stats.totalProfit + strategyB.stats.totalProfit) / 2;
    const combinedAverageDailyProfit = (strategyA.stats.averageDailyProfit + strategyB.stats.averageDailyProfit) / 2;

    // Calcular drawdown máximo combinado
    const maxDrawdownA = strategyA.stats.maxDrawdown;
    const maxDrawdownB = strategyB.stats.maxDrawdown;
    const maxCombinedDrawdown = Math.max(maxDrawdownA, maxDrawdownB);

    // Calcular reducción de riesgo
    const individualVolatility = (strategyA.stats.profitVolatility + strategyB.stats.profitVolatility) / 2;
    const riskReduction = ((individualVolatility - correlation.combinedVolatility) / individualVolatility) * 100;

    // Beneficio de diversificación
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

  /**
   * Genera la recomendación final
   */
  private generateRecommendation(
    strategyA: StrategyResult,
    strategyB: StrategyResult,
    correlation: StrategyCorrelation,
    portfolioMetrics: DeltaNeutralResult['portfolioMetrics']
  ): DeltaNeutralResult['recommendation'] {
    let overallRecommendation: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' = 'POOR';
    let confidence = 0;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';

    // Evaluar criterios
    const criteria = {
      bothStrategiesGood: strategyA.recommendation !== 'SELL' && strategyB.recommendation !== 'SELL',
      lowCorrelation: Math.abs(correlation.correlationCoefficient) < 0.3,
      goodHedgeEffectiveness: correlation.hedgeEffectiveness > 30,
      riskReduction: portfolioMetrics.riskReduction > 10,
      goodCombinedWinRate: portfolioMetrics.combinedWinRate > 50
    };

    // Calcular puntuación
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

    // Generar consejo
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

  /**
   * Imprime un resumen del análisis
   */
  private printSummary(result: DeltaNeutralResult): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DEL ANÁLISIS DELTA NEUTRAL');
    console.log('='.repeat(80));
    
    console.log(`\n🎯 ESTRATEGIA A: ${result.strategyA.pair}`);
    console.log(`   • Recomendación: ${result.strategyA.recommendation}`);
    console.log(`   • Win Rate: ${result.strategyA.stats.winRate.toFixed(1)}%`);
    console.log(`   • Ganancia Total: ${result.strategyA.stats.totalProfit.toFixed(2)}%`);
    
    console.log(`\n🎯 ESTRATEGIA B: ${result.strategyB.pair}`);
    console.log(`   • Recomendación: ${result.strategyB.recommendation}`);
    console.log(`   • Win Rate: ${result.strategyB.stats.winRate.toFixed(1)}%`);
    console.log(`   • Ganancia Total: ${result.strategyB.stats.totalProfit.toFixed(2)}%`);
    
    console.log(`\n🔗 CORRELACIÓN ENTRE ESTRATEGIAS:`);
    console.log(`   • Días ambas ganan: ${result.correlation.bothWinDays}`);
    console.log(`   • Días ambas pierden: ${result.correlation.bothLoseDays}`);
    console.log(`   • Días A gana, B pierde: ${result.correlation.strategyAWinsStrategyBLoses}`);
    console.log(`   • Días B gana, A pierde: ${result.correlation.strategyBWinsStrategyALoses}`);
    console.log(`   • Correlación estadística: ${result.correlation.correlationCoefficient.toFixed(3)}`);
    console.log(`   • Efectividad cobertura: ${result.correlation.hedgeEffectiveness.toFixed(1)}%`);
    
    console.log(`\n📈 MÉTRICAS DEL PORTAFOLIO:`);
    console.log(`   • Win Rate combinado: ${result.portfolioMetrics.combinedWinRate.toFixed(1)}%`);
    console.log(`   • Ganancia total combinada: ${result.portfolioMetrics.combinedTotalProfit.toFixed(2)}%`);
    console.log(`   • Volatilidad del portafolio: ${result.portfolioMetrics.portfolioVolatility.toFixed(2)}%`);
    console.log(`   • Sharpe ratio del portafolio: ${result.portfolioMetrics.portfolioSharpeRatio.toFixed(3)}`);
    console.log(`   • Reducción de riesgo: ${result.portfolioMetrics.riskReduction.toFixed(1)}%`);
    
    console.log(`\n🎯 RECOMENDACIÓN FINAL:`);
    console.log(`   • Evaluación: ${result.recommendation.overallRecommendation}`);
    console.log(`   • Confianza: ${result.recommendation.confidence}%`);
    console.log(`   • Nivel de riesgo: ${result.recommendation.riskLevel}`);
    console.log(`   • Consejo: ${result.recommendation.advice}`);
    
    console.log('\n' + '='.repeat(80));
  }
}
