/**
 * Configuración para el análisis de correlaciones entre tokens de Binance
 */
export interface TokenPair {
    longToken: string;
    shortToken: string;
    description?: string;
}
export interface AnalysisConfig {
    tokenPairs: TokenPair[];
    binanceApi: {
        baseUrl: string;
        interval: string;
        limit: number;
    };
    analysis: {
        minDaysForAnalysis: number;
        correlationThreshold: number;
    };
}
export declare const defaultConfig: AnalysisConfig;
/**
 * Función para obtener la configuración personalizada
 * Puedes modificar esta función para cargar configuración desde archivos externos
 */
export declare function getConfig(): AnalysisConfig;
/**
 * Función para añadir nuevos pares de tokens dinámicamente
 */
export declare function addTokenPair(config: AnalysisConfig, longToken: string, shortToken: string, description?: string): AnalysisConfig;
/**
 * Función para filtrar pares de tokens por criterios específicos
 */
export declare function filterTokenPairs(config: AnalysisConfig, filterFn: (pair: TokenPair) => boolean): AnalysisConfig;
//# sourceMappingURL=config.d.ts.map