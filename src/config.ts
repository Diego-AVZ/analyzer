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

export const defaultConfig: AnalysisConfig = {
    tokenPairs: [
        { longToken: 'ETHUSDT', shortToken: 'CAKEUSDT', description: '⚡ BUY - Win Rate 59%, Ganancia 45%' },
        { longToken: 'BTCUSDT', shortToken: 'PEPEUSDT', description: '⚡ BUY - Win Rate 55%, Ganancia 19%' },
        { longToken: 'ETHUSDT', shortToken: 'OPUSDT', description: '⚡ BUY - Win Rate 55%, Ganancia 79%' },
        { longToken: 'ETHUSDT', shortToken: 'GMXUSDT', description: '⚡ BUY - Win Rate 57.5%, Ganancia 68%' },
        { longToken: 'ETHUSDT', shortToken: 'DOTUSDT', description: '📊 HOLD - Win Rate 54.5%, Ganancia 77%' },
        { longToken: 'ETHUSDT', shortToken: 'ARBUSDT', description: '📊 HOLD - Win Rate 58%, Ganancia 34%' },
        { longToken: 'ETHUSDT', shortToken: 'LDOUSDT', description: '📊 HOLD - Win Rate 54.5%, Ganancia 43%' },
        { longToken: 'LINKUSDT', shortToken: 'GMXUSDT', description: '📊 HOLD - Win Rate 53.5%, Ganancia 47%' }
      ],
  
  binanceApi: {
    baseUrl: 'https://api.binance.com/api/v3/klines',
    interval: '1d',
    limit: 100
  },
  
  analysis: {
    minDaysForAnalysis: 30,
    correlationThreshold: -0.1
  }
};

export function getConfig(): AnalysisConfig {
  return defaultConfig;
}

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

export function filterTokenPairs(config: AnalysisConfig, filterFn: (pair: TokenPair) => boolean): AnalysisConfig {
  return {
    ...config,
    tokenPairs: config.tokenPairs.filter(filterFn)
  };
}
