import { ProcessedKline, CorrelationStats } from './types';
/**
 * Métricas avanzadas para estrategias de trading basadas en correlaciones inversas
 */
export declare class AdvancedMetrics {
    /**
     * Calcula métricas de momentum y reversión
     */
    calculateMomentumMetrics(klinesA: ProcessedKline[], klinesB: ProcessedKline[]): {
        aMomentum: number;
        bMomentum: number;
        momentumDivergence: number;
        reversalProbability: number;
    };
    /**
     * Analiza patrones de volumen para detectar señales
     */
    calculateVolumeMetrics(klinesA: ProcessedKline[], klinesB: ProcessedKline[]): {
        aVolumeTrend: number;
        bVolumeTrend: number;
        volumeCorrelation: number;
        volumeSignal: 'HIGH' | 'MEDIUM' | 'LOW';
    };
    /**
     * Calcula métricas de volatilidad implícita
     */
    calculateVolatilityMetrics(klinesA: ProcessedKline[], klinesB: ProcessedKline[]): {
        aVolatility: number;
        bVolatility: number;
        volatilityRatio: number;
        volatilityRegime: 'HIGH' | 'MEDIUM' | 'LOW';
        volatilityExpansion: boolean;
    };
    /**
     * Calcula señales de entrada y salida para estrategias
     */
    calculateTradingSignals(klinesA: ProcessedKline[], klinesB: ProcessedKline[], stats: CorrelationStats): {
        entrySignal: 'LONG_A_SHORT_B' | 'LONG_B_SHORT_A' | 'NEUTRAL';
        exitSignal: 'CLOSE_ALL' | 'HOLD';
        signalStrength: number;
        riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
        expectedReturn: number;
    };
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
    };
    /**
     * Métodos auxiliares
     */
    private calculateCorrelation;
    private calculateVolatility;
    private calculateMaxDrawdown;
    private calculateSharpeRatio;
    private calculateVaR;
}
//# sourceMappingURL=advancedMetrics.d.ts.map