import { getConfig } from './config';
import { BinanceService } from './binanceService';
import { LongShortAnalyzer, LongShortAnalysisResult } from './longShortAnalyzer';
import { ReportGenerator } from './reportGenerator';
import { AnalysisResult } from './types';
import { fetchFundingFees, getFundingFeesForStrategy, FundingFeesMap } from './fundingFeesService';


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

  
  async run(): Promise<void> {
    try {
      
      const allSymbols = this.getAllUniqueSymbols();

      const symbolData = await this.binanceService.getMultipleKlines(allSymbols);
      
      const failedSymbols = Array.from(symbolData.entries())
        .filter(([_, data]) => !data.success)
        .map(([symbol, _]) => symbol);
      
      if (failedSymbols.length > 0) {
        return;
      }

      const processedData = this.processSymbolData(symbolData);
      
      const strategiesToAnalyze = this.prepareStrategiesForAnalysis(processedData);
      
      if (strategiesToAnalyze.length === 0) {
        return;
      }

      let fundingMap: FundingFeesMap = new Map();
      try {
        fundingMap = await fetchFundingFees();
      } catch (err) {
        // Continuar sin funding fees si el API falla
      }

      const results = this.analyzeLongShortStrategies(strategiesToAnalyze, fundingMap);
      
      this.reportGenerator.generateConsoleReport(results);
      
      await this.saveReports(results);
      
      
    } catch (error) {
      throw error;
    }
  }

  
  private getAllUniqueSymbols(): string[] {
    const symbols = new Set<string>();
    
    this.config.tokenPairs.forEach(pair => {
      symbols.add(pair.longToken);
      symbols.add(pair.shortToken);
    });
    
    return Array.from(symbols);
  }

  
  private processSymbolData(symbolData: Map<string, any>): Map<string, any[]> {
    const processedData = new Map<string, any[]>();
    
    symbolData.forEach((response, symbol) => {
      if (response.success && response.data) {
        const processedKlines = this.binanceService.processKlines(response.data);
        
        if (this.binanceService.validateKlines(processedKlines)) {
          const filteredKlines = this.binanceService.filterValidDays(processedKlines);
          processedData.set(symbol, filteredKlines);
        } else {
        }
      }
    });
    
    return processedData;
  }

  
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
        const { synchronizedA, synchronizedB } = this.binanceService.synchronizeTimestamps(longKlines, shortKlines);
        
        if (synchronizedA.length >= this.config.analysis.minDaysForAnalysis) {
          strategiesToAnalyze.push({
            longToken: pair.longToken,
            shortToken: pair.shortToken,
            longKlines: synchronizedA,
            shortKlines: synchronizedB
          });
          
        } else {
        }
      } else {
      }
    });
    
    return strategiesToAnalyze;
  }

  
  private analyzeLongShortStrategies(strategies: Array<{
    longToken: string;
    shortToken: string;
    longKlines: any[];
    shortKlines: any[];
  }>, fundingMap: FundingFeesMap): LongShortAnalysisResult[] {
    
    const results: LongShortAnalysisResult[] = [];
    
    strategies.forEach((strategy) => {
      const { fundingFeeLong, fundingFeeShort } = getFundingFeesForStrategy(
        fundingMap,
        strategy.longToken,
        strategy.shortToken
      );
      try {
        const stats = this.longShortAnalyzer.analyzeLongShortStrategy(
          strategy.longToken, 
          strategy.shortToken, 
          strategy.longKlines, 
          strategy.shortKlines,
          { fundingFeeLong, fundingFeeShort }
        );
        const result = this.longShortAnalyzer.generateRecommendation(stats);
        results.push(result);
      } catch (error) {
        results.push({
          pair: `LONG ${strategy.longToken}/SHORT ${strategy.shortToken}`,
          stats: {} as any,
          recommendation: 'SELL',
          confidence: 0
        });
      }
    });

    return results;
  }

  
  private async saveReports(results: LongShortAnalysisResult[]): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportsDir = 'reports';
      
      try {
        await fs.mkdir(reportsDir, { recursive: true });
      } catch (error) {
      }
      
      const jsonReport = this.reportGenerator.generateJSONReport(results);
      const jsonPath = path.join(reportsDir, `correlation-analysis-${timestamp}.json`);
      await fs.writeFile(jsonPath, jsonReport, 'utf8');
      
      const csvReport = this.reportGenerator.generateCSVReport(results);
      const csvPath = path.join(reportsDir, `correlation-analysis-${timestamp}.csv`);
      await fs.writeFile(csvPath, csvReport, 'utf8');
      
    } catch (error) {
    }
  }
}


async function main(): Promise<void> {
  try {
    const analyzer = new BinanceCorrelationAnalyzer();
    await analyzer.run();
  } catch (error) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { BinanceCorrelationAnalyzer };
