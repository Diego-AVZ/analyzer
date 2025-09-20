import { LongShortAnalysisResult } from './longShortAnalyzer';
/**
 * Generador de reportes para el análisis de correlaciones
 */
export declare class ReportGenerator {
    /**
     * Genera un reporte completo en consola
     */
    generateConsoleReport(results: LongShortAnalysisResult[]): void;
    /**
     * Imprime el resumen ejecutivo
     */
    private printExecutiveSummary;
    /**
     * Imprime los resultados detallados
     */
    private printDetailedResults;
    /**
     * Imprime las recomendaciones finales
     */
    private printFinalRecommendations;
    /**
     * Obtiene el emoji correspondiente a la recomendación
     */
    private getRecommendationEmoji;
    /**
     * Genera un reporte en formato JSON para exportar
     */
    generateJSONReport(results: LongShortAnalysisResult[]): string;
    /**
     * Genera un reporte CSV para análisis en Excel
     */
    generateCSVReport(results: LongShortAnalysisResult[]): string;
}
//# sourceMappingURL=reportGenerator.d.ts.map