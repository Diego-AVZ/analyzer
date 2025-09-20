import { getConfig } from './config';
import { BinanceService } from './binanceService';
import { LongShortAnalyzer, LongShortAnalysisResult } from './longShortAnalyzer';
import { ReportGenerator } from './reportGenerator';
import { AnalysisResult } from './types';

/**
 * Script principal para analizar correlaciones inversas entre tokens de Binance
 */
class BinanceCorrelationAnalyzer {
  private config = getConfig();
  private binanceService: BinanceService;
  private longShortAnalyzer: LongShortAnalyzer;
  private reportGenerator: ReportGenerator;

  constructor() {
    this.binanceService = new BinanceService(
      this.config.binanceApi.baseUrl,
      this.config.binanceApi.interval,
      this.config.binanceApi.limit
    );
    this.longShortAnalyzer = new LongShortAnalyzer();
    this.reportGenerator = new ReportGenerator();
  }

  /**
   * Ejecuta el análisis completo
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 Iniciando análisis de estrategias Long/Short de Binance...');
      console.log(`📊 Configuración:`);
      console.log(`   • Estrategias a analizar: ${this.config.tokenPairs.length}`);
      console.log(`   • Intervalo: ${this.config.binanceApi.interval}`);
      console.log(`   • Días: ${this.config.binanceApi.limit}`);
      console.log(`   • Umbral correlación: ${this.config.analysis.correlationThreshold}`);
      
      // Obtener todos los símbolos únicos
      const allSymbols = this.getAllUniqueSymbols();
      console.log(`\n🔍 Símbolos únicos a obtener: ${allSymbols.join(', ')}`);

      // Obtener datos de todos los símbolos
      const symbolData = await this.binanceService.getMultipleKlines(allSymbols);
      
      // Verificar que todos los datos se obtuvieron correctamente
      const failedSymbols = Array.from(symbolData.entries())
        .filter(([_, data]) => !data.success)
        .map(([symbol, _]) => symbol);
      
      if (failedSymbols.length > 0) {
        console.error(`❌ Error obteniendo datos para: ${failedSymbols.join(', ')}`);
        return;
      }

      // Procesar datos y preparar para análisis
      const processedData = this.processSymbolData(symbolData);
      
      // Preparar estrategias para análisis
      const strategiesToAnalyze = this.prepareStrategiesForAnalysis(processedData);
      
      if (strategiesToAnalyze.length === 0) {
        console.error('❌ No hay estrategias válidas para analizar');
        return;
      }

      // Realizar análisis
      console.log(`\n🔬 Iniciando análisis de ${strategiesToAnalyze.length} estrategias Long/Short...`);
      const results = this.analyzeLongShortStrategies(strategiesToAnalyze);
      
      // Generar reportes
      this.reportGenerator.generateConsoleReport(results);
      
      // Guardar reportes en archivos
      await this.saveReports(results);
      
      console.log('\n✅ Análisis completado exitosamente!');
      
    } catch (error) {
      console.error('❌ Error durante el análisis:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los símbolos únicos de la configuración
   */
  private getAllUniqueSymbols(): string[] {
    const symbols = new Set<string>();
    
    this.config.tokenPairs.forEach(pair => {
      symbols.add(pair.longToken);
      symbols.add(pair.shortToken);
    });
    
    return Array.from(symbols);
  }

  /**
   * Procesa los datos de los símbolos
   */
  private processSymbolData(symbolData: Map<string, any>): Map<string, any[]> {
    const processedData = new Map<string, any[]>();
    
    symbolData.forEach((response, symbol) => {
      if (response.success && response.data) {
        const processedKlines = this.binanceService.processKlines(response.data);
        
        if (this.binanceService.validateKlines(processedKlines)) {
          const filteredKlines = this.binanceService.filterValidDays(processedKlines);
          processedData.set(symbol, filteredKlines);
          console.log(`✅ ${symbol}: ${filteredKlines.length} días válidos procesados`);
        } else {
          console.error(`❌ Datos inválidos para ${symbol}`);
        }
      }
    });
    
    return processedData;
  }

  /**
   * Prepara las estrategias para análisis
   */
  private prepareStrategiesForAnalysis(processedData: Map<string, any[]>): Array<{
    longToken: string;
    shortToken: string;
    longKlines: any[];
    shortKlines: any[];
  }> {
    const strategiesToAnalyze: Array<{
      longToken: string;
      shortToken: string;
      longKlines: any[];
      shortKlines: any[];
    }> = [];

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
          
          console.log(`✅ Estrategia LONG ${pair.longToken}/SHORT ${pair.shortToken}: ${synchronizedA.length} días sincronizados`);
        } else {
          console.warn(`⚠️ Estrategia LONG ${pair.longToken}/SHORT ${pair.shortToken}: Solo ${synchronizedA.length} días (mínimo: ${this.config.analysis.minDaysForAnalysis})`);
        }
      } else {
        console.error(`❌ Datos faltantes para estrategia LONG ${pair.longToken}/SHORT ${pair.shortToken}`);
      }
    });
    
    return strategiesToAnalyze;
  }

  /**
   * Analiza múltiples estrategias Long/Short
   */
  private analyzeLongShortStrategies(strategies: Array<{
    longToken: string;
    shortToken: string;
    longKlines: any[];
    shortKlines: any[];
  }>): LongShortAnalysisResult[] {
    console.log(`🚀 Iniciando análisis de ${strategies.length} estrategias Long/Short...`);
    
    const results: LongShortAnalysisResult[] = [];
    
    strategies.forEach((strategy, index) => {
      console.log(`\n📊 Analizando estrategia ${index + 1}/${strategies.length}: LONG ${strategy.longToken}/SHORT ${strategy.shortToken}`);
      
      try {
        const stats = this.longShortAnalyzer.analyzeLongShortStrategy(
          strategy.longToken, 
          strategy.shortToken, 
          strategy.longKlines, 
          strategy.shortKlines
        );
        const result = this.longShortAnalyzer.generateRecommendation(stats);
        results.push(result);
      } catch (error) {
        console.error(`❌ Error analizando LONG ${strategy.longToken}/SHORT ${strategy.shortToken}:`, error);
        results.push({
          pair: `LONG ${strategy.longToken}/SHORT ${strategy.shortToken}`,
          stats: {} as any,
          recommendation: 'SELL',
          confidence: 0,
          strategyAdvice: `Error en el análisis: ${error}`
        });
      }
    });

    return results;
  }

  /**
   * Guarda los reportes en archivos
   */
  private async saveReports(results: LongShortAnalysisResult[]): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportsDir = 'reports';
      
      // Crear directorio de reportes si no existe
      try {
        await fs.mkdir(reportsDir, { recursive: true });
      } catch (error) {
        // El directorio ya existe
      }
      
      // Guardar reporte JSON
      const jsonReport = this.reportGenerator.generateJSONReport(results);
      const jsonPath = path.join(reportsDir, `correlation-analysis-${timestamp}.json`);
      await fs.writeFile(jsonPath, jsonReport, 'utf8');
      console.log(`📄 Reporte JSON guardado: ${jsonPath}`);
      
      // Guardar reporte CSV
      const csvReport = this.reportGenerator.generateCSVReport(results);
      const csvPath = path.join(reportsDir, `correlation-analysis-${timestamp}.csv`);
      await fs.writeFile(csvPath, csvReport, 'utf8');
      console.log(`📊 Reporte CSV guardado: ${csvPath}`);
      
    } catch (error) {
      console.error('❌ Error guardando reportes:', error);
    }
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  try {
    const analyzer = new BinanceCorrelationAnalyzer();
    await analyzer.run();
  } catch (error) {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main();
}

export { BinanceCorrelationAnalyzer };
