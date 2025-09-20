import { LongShortAnalysisResult } from './longShortAnalyzer';
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
    hedgeEffectiveness: number;
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
        riskReduction: number;
        diversificationBenefit: number;
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
export declare class DeltaNeutralAnalyzer {
    private binanceService;
    private longShortAnalyzer;
    constructor();
    /**
     * Analiza dos estrategias Long/Short y su combinación delta neutral
     */
    analyzeDeltaNeutral(strategyA: {
        longToken: string;
        shortToken: string;
    }, strategyB: {
        longToken: string;
        shortToken: string;
    }, timePeriod?: number): Promise<DeltaNeutralResult>;
    /**
     * Analiza una estrategia individual
     */
    private analyzeSingleStrategy;
    /**
     * Analiza la correlación entre dos estrategias
     */
    private analyzeStrategyCorrelation;
    /**
     * Calcula el coeficiente de correlación entre dos arrays
     */
    private calculateCorrelationCoefficient;
    /**
     * Calcula la volatilidad combinada del portafolio
     */
    private calculateCombinedVolatility;
    /**
     * Calcula el Sharpe ratio del portafolio
     */
    private calculatePortfolioSharpeRatio;
    /**
     * Calcula las métricas del portafolio combinado
     */
    private calculatePortfolioMetrics;
    /**
     * Genera la recomendación final
     */
    private generateRecommendation;
    /**
     * Imprime un resumen del análisis
     */
    private printSummary;
}
//# sourceMappingURL=deltaNeutralAnalyzer.d.ts.map