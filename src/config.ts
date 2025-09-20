/**
 * Configuración para el análisis de correlaciones entre tokens de Binance
 */

export interface TokenPair {
  longToken: string;  // Token que compramos (LONG)
  shortToken: string; // Token que vendemos (SHORT)
  description?: string;
}

export interface AnalysisConfig {
  // Pares de tokens a analizar
  tokenPairs: TokenPair[];
  
  // Configuración de la API de Binance
  binanceApi: {
    baseUrl: string;
    interval: string;
    limit: number;
  };
  
  // Configuración del análisis
  analysis: {
    minDaysForAnalysis: number;
    correlationThreshold: number; // Umbral para considerar correlación inversa significativa
  };
}

export const defaultConfig: AnalysisConfig = {
    tokenPairs: [
        // 🔥 TOP ESTRATEGIAS - Basadas en tus mejores resultados
        { longToken: 'ETHUSDT', shortToken: 'APTUSDT', description: '🔥 STRONG_BUY - Win Rate 62%, Ganancia 56%' },
        { longToken: 'ETHUSDT', shortToken: 'INJUSDT', description: '⚡ BUY - Win Rate 63.3%, Excelente consistencia' },
        { longToken: 'ETHUSDT', shortToken: 'CRVUSDT', description: '⚡ BUY - Win Rate 58.3%, Ganancia 33%' },
        { longToken: 'ETHUSDT', shortToken: 'XRPUSDT', description: '⚡ BUY - Sharpe 0.23, Ganancia 34%' },
        { longToken: 'ETHUSDT', shortToken: 'CAKEUSDT', description: '⚡ BUY - Win Rate 59%, Ganancia 45%' },
        { longToken: 'ETHUSDT', shortToken: 'DYDXUSDT', description: '⚡ BUY - Win Rate 60%, Ganancia 21%' },
        { longToken: 'ETHUSDT', shortToken: 'SUIUSDT', description: '⚡ BUY - Win Rate 56.7%, Ganancia 24%' },
        { longToken: 'BTCUSDT', shortToken: 'XLMUSDT', description: '⚡ BUY - Win Rate 58.3%, Ganancia 15%' },
        { longToken: 'BTCUSDT', shortToken: 'PEPEUSDT', description: '⚡ BUY - Win Rate 55%, Ganancia 19%' },
        { longToken: 'ETHUSDT', shortToken: 'OPUSDT', description: '⚡ BUY - Win Rate 55%, Ganancia 79%' },
        
        // 📊 ESTRATEGIAS ADICIONALES PROMETEDORAS
        { longToken: 'ETHUSDT', shortToken: 'GMXUSDT', description: '⚡ BUY - Win Rate 57.5%, Ganancia 68%' },
        { longToken: 'ETHUSDT', shortToken: 'DOTUSDT', description: '📊 HOLD - Win Rate 54.5%, Ganancia 77%' },
        { longToken: 'ETHUSDT', shortToken: 'ARBUSDT', description: '📊 HOLD - Win Rate 58%, Ganancia 34%' },
        { longToken: 'ETHUSDT', shortToken: 'LDOUSDT', description: '📊 HOLD - Win Rate 54.5%, Ganancia 43%' },
        { longToken: 'LINKUSDT', shortToken: 'GMXUSDT', description: '📊 HOLD - Win Rate 53.5%, Ganancia 47%' }
      ],
  
  binanceApi: {
    baseUrl: 'https://api.binance.com/api/v3/klines',
    interval: '1d',
    limit: 100 // Últimos 200 días para análisis más robusto
  },
  
  analysis: {
    minDaysForAnalysis: 30, // Mínimo de días para considerar el análisis válido
    correlationThreshold: -0.1 // Correlación inversa significativa
  }
};

/**
 * Función para obtener la configuración personalizada
 * Puedes modificar esta función para cargar configuración desde archivos externos
 */
export function getConfig(): AnalysisConfig {
  return defaultConfig;
}

/**
 * Función para añadir nuevos pares de tokens dinámicamente
 */
export function addTokenPair(config: AnalysisConfig, longToken: string, shortToken: string, description?: string): AnalysisConfig {
  const newPair: TokenPair = {
    longToken: longToken.toUpperCase(),
    shortToken: shortToken.toUpperCase(),
    description: description || `LONG ${longToken} vs SHORT ${shortToken}`
  };
  
  return {
    ...config,
    tokenPairs: [...config.tokenPairs, newPair]
  };
}

/**
 * Función para filtrar pares de tokens por criterios específicos
 */
export function filterTokenPairs(config: AnalysisConfig, filterFn: (pair: TokenPair) => boolean): AnalysisConfig {
  return {
    ...config,
    tokenPairs: config.tokenPairs.filter(filterFn)
  };
}
