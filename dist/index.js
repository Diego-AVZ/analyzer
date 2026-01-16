"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceCorrelationAnalyzer = void 0;
const config_1 = require("./config");
const binanceService_1 = require("./binanceService");
const longShortAnalyzer_1 = require("./longShortAnalyzer");
const reportGenerator_1 = require("./reportGenerator");
class BinanceCorrelationAnalyzer {
    constructor() {
        this.config = (0, config_1.getConfig)();
        this.binanceService = new binanceService_1.BinanceService(this.config.binanceApi.baseUrl, this.config.binanceApi.interval, this.config.binanceApi.limit);
        this.longShortAnalyzer = new longShortAnalyzer_1.LongShortAnalyzer();
        this.reportGenerator = new reportGenerator_1.ReportGenerator();
    }
    async run() {
        try {
            // Obtener todos los símbolos únicos
            const allSymbols = this.getAllUniqueSymbols();
            // Obtener datos de todos los símbolos
            const symbolData = await this.binanceService.getMultipleKlines(allSymbols);
            // Verificar que todos los datos se obtuvieron correctamente
            const failedSymbols = Array.from(symbolData.entries())
                .filter(([_, data]) => !data.success)
                .map(([symbol, _]) => symbol);
            if (failedSymbols.length > 0) {
                return;
            }
            // Procesar datos y preparar para análisis
            const processedData = this.processSymbolData(symbolData);
            // Preparar estrategias para análisis
            const strategiesToAnalyze = this.prepareStrategiesForAnalysis(processedData);
            if (strategiesToAnalyze.length === 0) {
                return;
            }
            // Realizar análisis
            const results = this.analyzeLongShortStrategies(strategiesToAnalyze);
            // Generar reportes
            this.reportGenerator.generateConsoleReport(results);
            // Guardar reportes en archivos
            await this.saveReports(results);
        }
        catch (error) {
            throw error;
        }
    }
    getAllUniqueSymbols() {
        const symbols = new Set();
        this.config.tokenPairs.forEach(pair => {
            symbols.add(pair.longToken);
            symbols.add(pair.shortToken);
        });
        return Array.from(symbols);
    }
    processSymbolData(symbolData) {
        const processedData = new Map();
        symbolData.forEach((response, symbol) => {
            if (response.success && response.data) {
                const processedKlines = this.binanceService.processKlines(response.data);
                if (this.binanceService.validateKlines(processedKlines)) {
                    const filteredKlines = this.binanceService.filterValidDays(processedKlines);
                    processedData.set(symbol, filteredKlines);
                }
                else {
                }
            }
        });
        return processedData;
    }
    prepareStrategiesForAnalysis(processedData) {
        const strategiesToAnalyze = [];
        this.config.tokenPairs.forEach(pair => {
            const longKlines = processedData.get(pair.longToken);
            const shortKlines = processedData.get(pair.shortToken);
            if (longKlines && shortKlines) {
                // Sincronizar timestamps
                const { synchronizedA, synchronizedB } = this.binanceService.synchronizeTimestamps(longKlines, shortKlines);
                if (synchronizedA.length >= this.config.analysis.minDaysForAnalysis) {
                    strategiesToAnalyze.push({
                        longToken: pair.longToken,
                        shortToken: pair.shortToken,
                        longKlines: synchronizedA,
                        shortKlines: synchronizedB
                    });
                }
                else {
                }
            }
            else {
            }
        });
        return strategiesToAnalyze;
    }
    analyzeLongShortStrategies(strategies) {
        const results = [];
        strategies.forEach((strategy, index) => {
            try {
                const stats = this.longShortAnalyzer.analyzeLongShortStrategy(strategy.longToken, strategy.shortToken, strategy.longKlines, strategy.shortKlines);
                const result = this.longShortAnalyzer.generateRecommendation(stats);
                results.push(result);
            }
            catch (error) {
                results.push({
                    pair: `LONG ${strategy.longToken}/SHORT ${strategy.shortToken}`,
                    stats: {},
                    recommendation: 'SELL',
                    confidence: 0
                });
            }
        });
        return results;
    }
    async saveReports(results) {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportsDir = 'reports';
            // Crear directorio de reportes si no existe
            try {
                await fs.mkdir(reportsDir, { recursive: true });
            }
            catch (error) {
                // El directorio ya existe
            }
            // Guardar reporte JSON
            const jsonReport = this.reportGenerator.generateJSONReport(results);
            const jsonPath = path.join(reportsDir, `correlation-analysis-${timestamp}.json`);
            await fs.writeFile(jsonPath, jsonReport, 'utf8');
            // Guardar reporte CSV
            const csvReport = this.reportGenerator.generateCSVReport(results);
            const csvPath = path.join(reportsDir, `correlation-analysis-${timestamp}.csv`);
            await fs.writeFile(csvPath, csvReport, 'utf8');
        }
        catch (error) {
        }
    }
}
exports.BinanceCorrelationAnalyzer = BinanceCorrelationAnalyzer;
async function main() {
    try {
        const analyzer = new BinanceCorrelationAnalyzer();
        await analyzer.run();
    }
    catch (error) {
        process.exit(1);
    }
}
// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}
