"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceService = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Servicio para interactuar con la API de Binance
 */
class BinanceService {
    constructor(baseUrl, interval, limit) {
        this.baseUrl = baseUrl;
        this.interval = interval;
        this.limit = limit;
    }
    /**
     * Obtiene los datos de klines para un símbolo específico
     */
    async getKlines(symbol) {
        try {
            const url = `${this.baseUrl}?symbol=${symbol}&interval=${this.interval}&limit=${this.limit}`;
            console.log(`📡 Obteniendo datos para ${symbol}...`);
            const response = await axios_1.default.get(url, {
                timeout: 10000, // 10 segundos de timeout
                headers: {
                    'User-Agent': 'Binance-Correlation-Analyzer/1.0.0'
                }
            });
            if (response.status === 200 && Array.isArray(response.data)) {
                console.log(`✅ Datos obtenidos para ${symbol}: ${response.data.length} registros`);
                return {
                    success: true,
                    data: response.data,
                    symbol: symbol
                };
            }
            else {
                return {
                    success: false,
                    error: `Respuesta inválida para ${symbol}`,
                    symbol: symbol
                };
            }
        }
        catch (error) {
            console.error(`❌ Error obteniendo datos para ${symbol}:`, error.message);
            if (error.response) {
                // Error de respuesta HTTP
                const status = error.response.status;
                let errorMessage = `Error HTTP ${status}: ${error.response.data?.msg || error.message}`;
                if (status === 451) {
                    errorMessage = `Error HTTP 451: Binance bloquea el acceso desde esta región. Por favor, contacta al soporte si crees que esto es un error.`;
                }
                return {
                    success: false,
                    error: errorMessage,
                    symbol: symbol
                };
            }
            else if (error.request) {
                // Error de red
                return {
                    success: false,
                    error: `Error de red: ${error.message}`,
                    symbol: symbol
                };
            }
            else {
                // Otro tipo de error
                return {
                    success: false,
                    error: `Error: ${error.message}`,
                    symbol: symbol
                };
            }
        }
    }
    /**
     * Obtiene datos para múltiples símbolos en paralelo
     */
    async getMultipleKlines(symbols) {
        console.log(`🚀 Obteniendo datos para ${symbols.length} símbolos en paralelo...`);
        const promises = symbols.map(symbol => this.getKlines(symbol).then(result => ({ symbol, result })));
        const results = await Promise.allSettled(promises);
        const symbolData = new Map();
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                symbolData.set(result.value.symbol, result.value.result);
            }
            else {
                console.error(`❌ Error en símbolo ${symbols[index]}:`, result.reason);
                symbolData.set(symbols[index], {
                    success: false,
                    error: `Error: ${result.reason}`,
                    symbol: symbols[index]
                });
            }
        });
        return symbolData;
    }
    /**
     * Procesa los datos raw de Binance y calcula métricas adicionales
     */
    processKlines(rawKlines) {
        console.log(`🔧 Procesando ${rawKlines.length} registros raw...`);
        const processed = rawKlines.map((kline, index) => {
            // Los datos vienen como array: [openTime, open, high, low, close, volume, ...]
            const openTime = kline[0];
            const open = parseFloat(kline[1]);
            const high = parseFloat(kline[2]);
            const low = parseFloat(kline[3]);
            const close = parseFloat(kline[4]);
            const volume = parseFloat(kline[5]);
            // Verificar que los valores sean válidos
            if (isNaN(open) || isNaN(close) || isNaN(high) || isNaN(low) || isNaN(volume)) {
                console.warn(`⚠️ Valores NaN en registro ${index}:`, { open, close, high, low, volume });
                return null;
            }
            // Calcular el cambio diario en porcentaje
            const dailyChange = open > 0 ? ((close - open) / open) * 100 : 0;
            const dailyChangeAbs = close - open;
            return {
                timestamp: openTime,
                open,
                high,
                low,
                close,
                volume,
                dailyChange,
                dailyChangeAbs
            };
        }).filter(kline => kline !== null);
        console.log(`✅ Procesados ${processed.length} registros válidos de ${rawKlines.length} totales`);
        return processed;
    }
    /**
     * Valida que los datos sean consistentes y válidos
     */
    validateKlines(klines) {
        if (!klines || klines.length === 0) {
            console.warn('⚠️ No hay datos para validar');
            return false;
        }
        // Verificar que todos los timestamps sean válidos
        const validTimestamps = klines.every(kline => kline.timestamp > 0 &&
            kline.open > 0 &&
            kline.close > 0 &&
            kline.high > 0 &&
            kline.low > 0 &&
            !isNaN(kline.open) &&
            !isNaN(kline.close) &&
            !isNaN(kline.high) &&
            !isNaN(kline.low) &&
            !isNaN(kline.dailyChange));
        if (!validTimestamps) {
            console.warn('⚠️ Algunos datos tienen valores inválidos o NaN');
            // Filtrar datos inválidos en lugar de rechazar todo
            return true; // Permitir continuar con datos filtrados
        }
        // Verificar que los datos estén ordenados por timestamp
        const sortedTimestamps = klines.every((kline, index) => {
            if (index === 0)
                return true;
            return kline.timestamp >= klines[index - 1].timestamp;
        });
        if (!sortedTimestamps) {
            console.warn('⚠️ Los datos no están ordenados por timestamp');
            return true; // Permitir continuar, se puede ordenar después
        }
        return true;
    }
    /**
     * Filtra los datos para asegurar que solo se incluyan días válidos
     */
    filterValidDays(klines) {
        return klines.filter(kline => {
            // Verificar que todos los valores sean números válidos
            const hasValidNumbers = !isNaN(kline.open) &&
                !isNaN(kline.close) &&
                !isNaN(kline.high) &&
                !isNaN(kline.low) &&
                !isNaN(kline.volume) &&
                !isNaN(kline.dailyChange) &&
                !isNaN(kline.dailyChangeAbs);
            if (!hasValidNumbers) {
                return false;
            }
            // Filtrar días con cambios extremos (posibles errores de datos)
            const extremeChange = Math.abs(kline.dailyChange) > 50; // Más del 50% de cambio
            // Filtrar días con volumen muy bajo (posibles datos incorrectos)
            const lowVolume = kline.volume < 100; // Reducido el umbral
            // Verificar que high >= low y que close esté entre high y low
            const validPriceRange = kline.high >= kline.low &&
                kline.close >= kline.low &&
                kline.close <= kline.high &&
                kline.open >= kline.low &&
                kline.open <= kline.high;
            return !extremeChange && !lowVolume && validPriceRange;
        });
    }
    /**
     * Sincroniza los timestamps entre dos conjuntos de datos
     */
    synchronizeTimestamps(klinesA, klinesB) {
        const timestampMapA = new Map();
        const timestampMapB = new Map();
        // Crear mapas de timestamps
        klinesA.forEach(kline => {
            timestampMapA.set(kline.timestamp, kline);
        });
        klinesB.forEach(kline => {
            timestampMapB.set(kline.timestamp, kline);
        });
        // Encontrar timestamps comunes
        const commonTimestamps = Array.from(timestampMapA.keys())
            .filter(timestamp => timestampMapB.has(timestamp))
            .sort((a, b) => a - b);
        // Crear arrays sincronizados
        const synchronizedA = [];
        const synchronizedB = [];
        commonTimestamps.forEach(timestamp => {
            const klineA = timestampMapA.get(timestamp);
            const klineB = timestampMapB.get(timestamp);
            synchronizedA.push(klineA);
            synchronizedB.push(klineB);
        });
        console.log(`🔄 Sincronizados ${commonTimestamps.length} días comunes entre ambos tokens`);
        return { synchronizedA, synchronizedB };
    }
}
exports.BinanceService = BinanceService;
//# sourceMappingURL=binanceService.js.map