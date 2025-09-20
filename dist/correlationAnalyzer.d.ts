import { ProcessedKline, CorrelationStats, AnalysisResult } from './types';
/**
 * Analizador de correlaciones inversas entre tokens
 */
export declare class CorrelationAnalyzer {
    /**
     * Analiza la correlación entre dos tokens
     */
    analyzeCorrelation(tokenA: string, tokenB: string, klinesA: ProcessedKline[], klinesB: ProcessedKline[]): CorrelationStats;
    /**
     * Calcula el coeficiente de correlación de Pearson
     */
    private calculateCorrelationCoefficient;
    /**
     * Calcula la volatilidad (desviación estándar)
     */
    private calculateVolatility;
    /**
     * Calcula un score de consistencia basado en la variabilidad de las diferencias
     */
    private calculateConsistencyScore;
    /**
     * Genera recomendaciones basadas en las estadísticas
     */
    generateRecommendation(stats: CorrelationStats): AnalysisResult;
    /**
     * Analiza múltiples pares de tokens
     */
    analyzeMultiplePairs(tokenPairs: Array<{
        tokenA: string;
        tokenB: string;
        klinesA: ProcessedKline[];
        klinesB: ProcessedKline[];
    }>): AnalysisResult[];
}
//# sourceMappingURL=correlationAnalyzer.d.ts.map