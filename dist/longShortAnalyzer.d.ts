import { ProcessedKline } from './types';
/**
 * Analizador específico para estrategias Long/Short
 */
export declare class LongShortAnalyzer {
    /**
     * Analiza la estrategia Long/Short entre dos tokens
     */
    analyzeLongShortStrategy(longToken: string, shortToken: string, longKlines: ProcessedKline[], shortKlines: ProcessedKline[]): LongShortStats;
    /**
     * Genera recomendaciones basadas en las estadísticas de la estrategia
     */
    generateRecommendation(stats: LongShortStats): LongShortAnalysisResult;
    /**
     * Métodos auxiliares
     */
    private calculateVolatility;
    private calculateConsecutiveDays;
    private calculateConsecutivePercentage;
    private calculateVolatilityScore;
    private calculateRecommendationScore;
    private calculateMaxDrawdown;
    private calculateConsistencyScore;
}
/**
 * Tipos específicos para análisis Long/Short
 */
export interface LongShortStats {
    longToken: string;
    shortToken: string;
    totalDays: number;
    validDays: number;
    winningDays: number;
    losingDays: number;
    winRate: number;
    lossRate: number;
    totalProfit: number;
    averageDailyProfit: number;
    averageDailyGain: number;
    averageDailyLoss: number;
    totalGain: number;
    totalLoss: number;
    maxSingleDayProfit: number;
    maxSingleDayLoss: number;
    maxConsecutiveWinningDays: number;
    maxConsecutiveLosingDays: number;
    profitVolatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    consistencyScore: number;
    dailyProfits: number[];
    recommendation: number;
    consecutiveWins: number;
    consecutiveLoss: number;
    consecutivePercentageWins: number;
    consecutivePercentageLoss: number;
}
export interface LongShortAnalysisResult {
    pair: string;
    stats: LongShortStats;
    recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    confidence: number;
    strategyAdvice: string;
}
//# sourceMappingURL=longShortAnalyzer.d.ts.map