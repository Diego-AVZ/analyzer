/**
 * Script principal para analizar correlaciones inversas entre tokens de Binance
 */
declare class BinanceCorrelationAnalyzer {
    private config;
    private binanceService;
    private longShortAnalyzer;
    private reportGenerator;
    constructor();
    /**
     * Ejecuta el análisis completo
     */
    run(): Promise<void>;
    /**
     * Obtiene todos los símbolos únicos de la configuración
     */
    private getAllUniqueSymbols;
    /**
     * Procesa los datos de los símbolos
     */
    private processSymbolData;
    /**
     * Prepara las estrategias para análisis
     */
    private prepareStrategiesForAnalysis;
    /**
     * Analiza múltiples estrategias Long/Short
     */
    private analyzeLongShortStrategies;
    /**
     * Guarda los reportes en archivos
     */
    private saveReports;
}
export { BinanceCorrelationAnalyzer };
//# sourceMappingURL=index.d.ts.map