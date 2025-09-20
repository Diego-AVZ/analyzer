import { BinanceKline, ProcessedKline, BinanceApiResponse } from './types';
/**
 * Servicio para interactuar con la API de Binance
 */
export declare class BinanceService {
    private readonly baseUrl;
    private readonly interval;
    private readonly limit;
    constructor(baseUrl: string, interval: string, limit: number);
    /**
     * Obtiene los datos de klines para un símbolo específico
     */
    getKlines(symbol: string): Promise<BinanceApiResponse>;
    /**
     * Obtiene datos para múltiples símbolos en paralelo
     */
    getMultipleKlines(symbols: string[]): Promise<Map<string, BinanceApiResponse>>;
    /**
     * Procesa los datos raw de Binance y calcula métricas adicionales
     */
    processKlines(rawKlines: BinanceKline[]): ProcessedKline[];
    /**
     * Valida que los datos sean consistentes y válidos
     */
    validateKlines(klines: ProcessedKline[]): boolean;
    /**
     * Filtra los datos para asegurar que solo se incluyan días válidos
     */
    filterValidDays(klines: ProcessedKline[]): ProcessedKline[];
    /**
     * Sincroniza los timestamps entre dos conjuntos de datos
     */
    synchronizeTimestamps(klinesA: ProcessedKline[], klinesB: ProcessedKline[]): {
        synchronizedA: ProcessedKline[];
        synchronizedB: ProcessedKline[];
    };
}
//# sourceMappingURL=binanceService.d.ts.map