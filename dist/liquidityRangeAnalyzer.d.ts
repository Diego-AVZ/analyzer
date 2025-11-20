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
    currentPriceRatio: number;
    priceRatioRange: {
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
export declare class LiquidityRangeAnalyzer {
    /**
     * Analiza un rango de liquidez específico
     */
    analyzeLiquidityRange(tokenA: string, tokenB: string, klinesA: ProcessedKline[], klinesB: ProcessedKline[], rangeUpPercent: number, rangeDownPercent: number): LiquidityRangeAnalysisResult;
    /**
     * Analiza los datos históricos para el rango especificado
     * Ahora usa el ratio de precios (A/B) en lugar de precios absolutos
     */
    private analyzeHistoricalData;
    /**
     * Estima el impermanent loss para diferentes escenarios
     */
    private estimateImpermanentLoss;
    /**
     * Calcula el impermanent loss para un ratio de precio dado
     * Fórmula para liquidez concentrada: IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
     */
    private calculateImpermanentLoss;
    /**
     * Genera una recomendación basada en el análisis
     */
    private generateRecommendation;
}
//# sourceMappingURL=liquidityRangeAnalyzer.d.ts.map