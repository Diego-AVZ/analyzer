const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3001;

class StrategyCache {
  constructor() {
    this.cache = new Map();
    this.TTL = 3600000;
  }

  generateKey(params = {}) {
    const { limit = 15, riskLevel = 'ALL', timePeriod = 'ALL', sortBy = 'APR', strategyType = 'MAJOR' } = params;
    return `strategy-bundles-${limit}-${riskLevel}-${timePeriod}-${sortBy}-${strategyType}`;
  }

  isValid(entry) {
    if (!entry) return false;
    const now = Date.now();
    return (now - entry.timestamp) < this.TTL;
  }

  get(params) {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);
    
    if (this.isValid(entry)) {
      return {
        ...entry.data,
        cached: true,
        cacheAge: Date.now() - entry.timestamp,
        cacheExpiresIn: this.TTL - (Date.now() - entry.timestamp)
      };
    }
    
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  set(params, data) {
    const key = this.generateKey(params);
    const entry = {
      data,
      timestamp: Date.now()
    };
    
    this.cache.set(key, entry);
    
    this.cleanup();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    const now = Date.now();
    const stats = {
      totalEntries: this.cache.size,
      validEntries: 0,
      expiredEntries: 0,
      oldestEntry: null,
      newestEntry: null
    };

    for (const [key, entry] of this.cache.entries()) {
      if (this.isValid(entry)) {
        stats.validEntries++;
      } else {
        stats.expiredEntries++;
      }

      if (!stats.oldestEntry || entry.timestamp < stats.oldestEntry.timestamp) {
        stats.oldestEntry = { key, timestamp: entry.timestamp };
      }
      if (!stats.newestEntry || entry.timestamp > stats.newestEntry.timestamp) {
        stats.newestEntry = { key, timestamp: entry.timestamp };
      }
    }

    return stats;
  }
}

const strategyCache = new StrategyCache();

function calculateOverallScore(metrics) {
  const periods = Object.keys(metrics);
  if (periods.length === 0) return 0;

  const periodWeights = {
    '30d': 0.50,
    '60d': 0.30,
    '100d': 0.20
  };

  let weightedScore = 0;
  let totalWeight = 0;

  for (const period of periods) {
    const metric = metrics[period];
    const weight = periodWeights[period] || 0;
    
    if (metric && metric.validDays >= 30 && weight > 0) {
      const winRateScore = Math.min(metric.winRate, 100) * 0.3;
      const profitScore = Math.max(0, Math.min(metric.totalProfit, 200)) * 0.25;
      const sharpeScore = Math.max(0, Math.min(metric.sharpeRatio * 10, 20)) * 0.2;
      const consistencyScore = Math.min(metric.consistencyScore, 100) * 0.15;
      
      let recommendationScore = 0;
      switch (metric.recommendation) {
        case 'STRONG_BUY': recommendationScore = 10; break;
        case 'BUY': recommendationScore = 7; break;
        case 'HOLD': recommendationScore = 4; break;
        case 'SELL': recommendationScore = 0; break;
      }
      recommendationScore *= 0.1;

      const periodScore = winRateScore + profitScore + sharpeScore + consistencyScore + recommendationScore;
      weightedScore += periodScore * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

function determineRiskLevel(metrics) {
  const periods = Object.keys(metrics);
  if (periods.length === 0) return 'HIGH';

  const m30d = metrics['30d'];
  const m60d = metrics['60d'];
  const m100d = metrics['100d'];

  const has30d = m30d && m30d.validDays >= 25;
  const has60d = m60d && m60d.validDays >= 50;
  const has100d = m100d && m100d.validDays >= 80;

  if (!has30d && !has60d && !has100d) return 'HIGH';

  const isLowRisk30d = has30d && m30d.winRate >= 58 && m30d.totalProfit >= 10 && m30d.sharpeRatio >= 0.05;
  const isLowRisk60d = has60d && m60d.winRate >= 55 && m60d.totalProfit >= 15;
  const isLowRisk100d = has100d && m100d.winRate >= 50 && m100d.totalProfit >= 20;

  const isMediumRisk30d = has30d && m30d.winRate >= 52 && m30d.totalProfit >= 5;
  const isMediumRisk60d = has60d && m60d.winRate >= 50 && m60d.totalProfit >= 8;
  const isMediumRisk100d = has100d && m100d.winRate >= 48;

  if (isLowRisk30d && (isLowRisk60d || isLowRisk100d)) {
    return 'LOW';
  }

  if (isMediumRisk30d && (isMediumRisk60d || isMediumRisk100d)) {
    return 'MEDIUM';
  }

  if (isLowRisk30d) {
    return 'MEDIUM';
  }

  return 'HIGH';
}

function getBestRecommendation(metrics) {
  const periods = Object.keys(metrics);
  if (periods.length === 0) return 'HOLD';

  const m30d = metrics['30d'];
  const m60d = metrics['60d'];
  const m100d = metrics['100d'];

  if (m30d && m30d.validDays >= 25 && m30d.recommendation === 'STRONG_BUY') {
    const othersFavorable = 
      (m60d && (m60d.recommendation === 'STRONG_BUY' || m60d.recommendation === 'BUY' || m60d.recommendation === 'HOLD')) ||
      (m100d && (m100d.recommendation === 'STRONG_BUY' || m100d.recommendation === 'BUY' || m100d.recommendation === 'HOLD'));
    
    if (othersFavorable) return 'STRONG_BUY';
    return 'BUY';
  }

  if (m30d && m30d.validDays >= 25 && m30d.recommendation === 'BUY') {
    const othersBuy = 
      (m60d && (m60d.recommendation === 'STRONG_BUY' || m60d.recommendation === 'BUY')) ||
      (m100d && (m100d.recommendation === 'STRONG_BUY' || m100d.recommendation === 'BUY'));
    
    if (othersBuy) return 'BUY';
  }

  let strongBuyCount = 0;
  let buyCount = 0;

  for (const period of periods) {
    const metric = metrics[period];
    if (metric && metric.validDays >= 30) {
      if (metric.recommendation === 'STRONG_BUY') strongBuyCount++;
      if (metric.recommendation === 'BUY') buyCount++;
    }
  }

  if (strongBuyCount >= 2) return 'STRONG_BUY';
  if (buyCount >= 2 || (buyCount >= 1 && strongBuyCount >= 1)) return 'BUY';
  return 'HOLD';
}

function getAverageConfidence(metrics) {
  const periods = Object.keys(metrics);
  if (periods.length === 0) return 0;

  let totalConfidence = 0;
  let validPeriods = 0;

  for (const period of periods) {
    const metric = metrics[period];
    if (metric && metric.validDays >= 30) {
      totalConfidence += metric.confidence;
      validPeriods++;
    }
  }

  return validPeriods > 0 ? totalConfidence / validPeriods : 0;
}

function calculateAPR(metrics) {
  const periods = Object.keys(metrics);
  if (periods.length === 0) return 0;

  const periodPriority = ['200d', '100d', '60d', '30d'];
  
  for (const period of periodPriority) {
    const metric = metrics[period];
    if (metric && metric.validDays >= 30) {
      const days = parseInt(period.replace('d', ''));
      
      if (metric.initialLongPrice && metric.finalLongPrice && 
          metric.initialShortPrice && metric.finalShortPrice) {
        
        const longReturn = metric.initialLongPrice > 0 
          ? ((metric.finalLongPrice - metric.initialLongPrice) / metric.initialLongPrice) * 100 
          : 0;
        
        const shortReturn = metric.initialShortPrice > 0 
          ? ((metric.initialShortPrice - metric.finalShortPrice) / metric.initialShortPrice) * 100 
          : 0;
        
        const longContribution = longReturn * 0.5;
        const shortContribution = shortReturn * 0.5;
        
        const totalReturnPercent = longContribution + shortContribution;
        
        const apr = (totalReturnPercent / days) * 365;
        
        return Math.round(apr * 10) / 10;
      }
      
      const totalReturnPercent = metric.totalProfit;
      
      const apr = (totalReturnPercent / days) * 365;
      
      return Math.round(apr * 10) / 10;
    }
  }

  return 0;
}

function generateSimulatedTVL(pair, score) {
  const baseTVL = Math.max(1, Math.min(50, score * 2));
  const randomFactor = 0.8 + Math.random() * 0.4;
  return Math.round(baseTVL * randomFactor * 100) / 100;
}

function getBestWinRate(metrics) {
  const periods = Object.keys(metrics);
  let bestWinRate = 0;
  
  for (const period of periods) {
    const metric = metrics[period];
    if (metric && metric.validDays >= 30) {
      bestWinRate = Math.max(bestWinRate, metric.winRate);
    }
  }
  
  return bestWinRate;
}

function getBestSharpeRatio(metrics) {
  const periods = Object.keys(metrics);
  let bestSharpe = 0;
  
  for (const period of periods) {
    const metric = metrics[period];
    if (metric && metric.validDays >= 30) {
      bestSharpe = Math.max(bestSharpe, metric.sharpeRatio);
    }
  }
  
  return bestSharpe;
}

function getBestConsistency(metrics) {
  const periods = Object.keys(metrics);
  let bestConsistency = 0;
  
  for (const period of periods) {
    const metric = metrics[period];
    if (metric && metric.validDays >= 30) {
      bestConsistency = Math.max(bestConsistency, metric.consistencyScore);
    }
  }
  
  return bestConsistency;
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));
app.use(express.json());

app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

app.use(express.static(path.join(__dirname, 'frontend/build')));

const { BinanceService } = require('./dist/binanceService');
const { LongShortAnalyzer } = require('./dist/longShortAnalyzer');
const { DeltaNeutralAnalyzer } = require('./dist/deltaNeutralAnalyzer');
const { LiquidityRangeAnalyzer } = require('./dist/liquidityRangeAnalyzer');
const { getConfig } = require('./dist/config');

app.post('/api/analyze', async (req, res) => {
  try {
    const { longToken, shortToken, timePeriod } = req.body;
    
    if (!longToken || !shortToken) {
      return res.status(400).json({ 
        error: 'Se requieren longToken y shortToken' 
      });
    }

    if (longToken === shortToken) {
      return res.status(400).json({ 
        error: 'Los tokens Long y Short deben ser diferentes' 
      });
    }

    const binanceService = new BinanceService(
      'https://api.binance.com/api/v3/klines',
      '1d',
      timePeriod || 100
    );
    
    const longShortAnalyzer = new LongShortAnalyzer();

    const longTokenData = await binanceService.getKlines(longToken.toUpperCase());
    const shortTokenData = await binanceService.getKlines(shortToken.toUpperCase());

    if (!longTokenData.success || !shortTokenData.success) {
      return res.status(500).json({ 
        error: 'Error obteniendo datos de Binance',
        details: longTokenData.error || shortTokenData.error
      });
    }

    const longKlines = binanceService.processKlines(longTokenData.data);
    const shortKlines = binanceService.processKlines(shortTokenData.data);

    if (!binanceService.validateKlines(longKlines) || !binanceService.validateKlines(shortKlines)) {
      return res.status(500).json({ 
        error: 'Datos inválidos obtenidos de Binance' 
      });
    }

    const filteredLongKlines = binanceService.filterValidDays(longKlines);
    const filteredShortKlines = binanceService.filterValidDays(shortKlines);

    const { synchronizedA, synchronizedB } = binanceService.synchronizeTimestamps(
      filteredLongKlines, 
      filteredShortKlines
    );

    if (synchronizedA.length < 30) {
      return res.status(500).json({ 
        error: `Insuficientes datos válidos: ${synchronizedA.length} días (mínimo: 30)` 
      });
    }

    const stats = longShortAnalyzer.analyzeLongShortStrategy(
      longToken.toUpperCase(),
      shortToken.toUpperCase(),
      synchronizedA,
      synchronizedB
    );

    const result = longShortAnalyzer.generateRecommendation(stats);

    const firstLongKline = synchronizedA[0];
    const lastLongKline = synchronizedA[synchronizedA.length - 1];
    const firstShortKline = synchronizedB[0];
    const lastShortKline = synchronizedB[synchronizedB.length - 1];

    const days = synchronizedA.length;
    
    const longReturn = firstLongKline.open > 0 
      ? ((lastLongKline.close - firstLongKline.open) / firstLongKline.open) * 100 
      : 0;
    
    const shortReturn = firstShortKline.open > 0 
      ? ((firstShortKline.open - lastShortKline.close) / firstShortKline.open) * 100 
      : 0;
    
    const longContribution = longReturn * 0.5;
    const shortContribution = shortReturn * 0.5;
    
    const totalReturnPercent = longContribution + shortContribution;
    
    const apr = (totalReturnPercent / days) * 365;

    const response = {
      ...result,
      apr: Math.round(apr * 10) / 10,
      periodDays: days,
      initialLongPrice: firstLongKline.open,
      finalLongPrice: lastLongKline.close,
      initialShortPrice: firstShortKline.open,
      finalShortPrice: lastShortKline.close
    };

    res.json(response);

  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

app.post('/api/delta-neutral', async (req, res) => {
  try {
    const { 
      strategyA: { longToken: longTokenA, shortToken: shortTokenA },
      strategyB: { longToken: longTokenB, shortToken: shortTokenB },
      timePeriod 
    } = req.body;
    
    if (!longTokenA || !shortTokenA || !longTokenB || !shortTokenB) {
      return res.status(400).json({ 
        error: 'Se requieren todos los tokens para ambas estrategias' 
      });
    }

    const analyzer = new DeltaNeutralAnalyzer();
    const result = await analyzer.analyzeDeltaNeutral(
      { longToken: longTokenA, shortToken: shortTokenA },
      { longToken: longTokenB, shortToken: shortTokenB },
      timePeriod || 100
    );

    res.json(result);

  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

app.post('/api/liquidity-range', async (req, res) => {
  try {
    const { tokenA, tokenB, rangeUpPercent, rangeDownPercent, timePeriod } = req.body;
    
    if (!tokenA || !tokenB) {
      return res.status(400).json({ 
        error: 'Se requieren tokenA y tokenB' 
      });
    }

    if (tokenA === tokenB) {
      return res.status(400).json({ 
        error: 'Los tokens deben ser diferentes' 
      });
    }

    if (!rangeUpPercent || !rangeDownPercent || rangeUpPercent <= 0 || rangeDownPercent <= 0) {
      return res.status(400).json({ 
        error: 'Los porcentajes de rango deben ser positivos' 
      });
    }

    const binanceService = new BinanceService(
      'https://api.binance.com/api/v3/klines',
      '1d',
      timePeriod || 100
    );
    
    const liquidityRangeAnalyzer = new LiquidityRangeAnalyzer();

    const tokenAData = await binanceService.getKlines(tokenA.toUpperCase());
    const tokenBData = await binanceService.getKlines(tokenB.toUpperCase());

    if (!tokenAData.success || !tokenBData.success) {
      return res.status(500).json({ 
        error: 'Error obteniendo datos de Binance',
        details: tokenAData.error || tokenBData.error
      });
    }

    const klinesA = binanceService.processKlines(tokenAData.data);
    const klinesB = binanceService.processKlines(tokenBData.data);

    if (!binanceService.validateKlines(klinesA) || !binanceService.validateKlines(klinesB)) {
      return res.status(500).json({ 
        error: 'Datos inválidos obtenidos de Binance' 
      });
    }

    const filteredKlinesA = binanceService.filterValidDays(klinesA);
    const filteredKlinesB = binanceService.filterValidDays(klinesB);

    const { synchronizedA, synchronizedB } = binanceService.synchronizeTimestamps(
      filteredKlinesA, 
      filteredKlinesB
    );

    if (synchronizedA.length < 30) {
      return res.status(500).json({ 
        error: `Insuficientes datos válidos: ${synchronizedA.length} días (mínimo: 30)` 
      });
    }

    const result = liquidityRangeAnalyzer.analyzeLiquidityRange(
      tokenA.toUpperCase(),
      tokenB.toUpperCase(),
      synchronizedA,
      synchronizedB,
      rangeUpPercent,
      rangeDownPercent
    );

    res.json(result);

  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

app.get('/api/tokens', (req, res) => {
  const tokens = [
    'ETHUSDT', 'BTCUSDT', 'APTUSDT', 'INJUSDT', 'CRVUSDT', 'XRPUSDT', 
    'CAKEUSDT', 'DYDXUSDT', 'SUIUSDT', 'XLMUSDT', 'PEPEUSDT', 'OPUSDT',
    'GMXUSDT', 'DOTUSDT', 'ARBUSDT', 'LDOUSDT', 'LINKUSDT'
  ];
  
  res.json(tokens);
});

app.get('/api/long-short-history', async (req, res) => {
  try {
    const { longToken, shortToken, timePeriod = 100 } = req.query;
    
    if (!longToken || !shortToken) {
      return res.status(400).json({ 
        error: 'Se requieren longToken y shortToken como parámetros de consulta' 
      });
    }

    if (longToken === shortToken) {
      return res.status(400).json({ 
        error: 'Los tokens Long y Short deben ser diferentes' 
      });
    }

    const binanceService = new BinanceService(
      'https://api.binance.com/api/v3/klines',
      '1d',
      parseInt(timePeriod) || 100
    );
    
    const longTokenUpper = longToken.toUpperCase();
    const shortTokenUpper = shortToken.toUpperCase();
    
    // Asegurar que los tokens tengan el sufijo USDT si no lo tienen
    const longTokenSymbol = longTokenUpper.endsWith('USDT') ? longTokenUpper : `${longTokenUpper}USDT`;
    const shortTokenSymbol = shortTokenUpper.endsWith('USDT') ? shortTokenUpper : `${shortTokenUpper}USDT`;

    const longTokenData = await binanceService.getKlines(longTokenSymbol);
    const shortTokenData = await binanceService.getKlines(shortTokenSymbol);

    if (!longTokenData.success || !shortTokenData.success) {
      return res.status(500).json({ 
        error: 'Error obteniendo datos de Binance',
        details: longTokenData.error || shortTokenData.error
      });
    }

    const longKlines = binanceService.processKlines(longTokenData.data);
    const shortKlines = binanceService.processKlines(shortTokenData.data);

    if (!binanceService.validateKlines(longKlines) || !binanceService.validateKlines(shortKlines)) {
      return res.status(500).json({ 
        error: 'Datos inválidos obtenidos de Binance' 
      });
    }

    const filteredLongKlines = binanceService.filterValidDays(longKlines);
    const filteredShortKlines = binanceService.filterValidDays(shortKlines);

    const { synchronizedA, synchronizedB } = binanceService.synchronizeTimestamps(
      filteredLongKlines, 
      filteredShortKlines
    );

    if (synchronizedA.length === 0) {
      return res.status(500).json({ 
        error: 'No se encontraron datos sincronizados entre los tokens' 
      });
    }

    // Calcular el ratio longToken/shortToken para cada vela
    const ratioKlines = synchronizedA.map((longKline, index) => {
      const shortKline = synchronizedB[index];
      
      // Calcular ratios: longToken / shortToken
      const openRatio = shortKline.open !== 0 ? (longKline.open / shortKline.open) : 0;
      const highRatio = shortKline.high !== 0 ? (longKline.high / shortKline.high) : 0;
      const lowRatio = shortKline.low !== 0 ? (longKline.low / shortKline.low) : 0;
      const closeRatio = shortKline.close !== 0 ? (longKline.close / shortKline.close) : 0;
      
      // Calcular volumen combinado (promedio de ambos)
      const volumeRatio = (longKline.volume + shortKline.volume) / 2;
      
      // Crear BinanceKline con el formato correcto
      const ratioKline = [
        longKline.timestamp,                    // 0: Open time
        openRatio.toFixed(8),                   // 1: Open (ratio)
        highRatio.toFixed(8),                   // 2: High (ratio)
        lowRatio.toFixed(8),                    // 3: Low (ratio)
        closeRatio.toFixed(8),                  // 4: Close (ratio)
        volumeRatio.toFixed(8),                 // 5: Volume (promedio)
        longKline.timestamp + 86400000 - 1,      // 6: Close time (24h - 1ms)
        volumeRatio.toFixed(8),                 // 7: Quote asset volume
        0,                                       // 8: Number of trades (no disponible)
        (volumeRatio * 0.5).toFixed(8),         // 9: Taker buy base asset volume (estimado)
        (volumeRatio * 0.5).toFixed(8),         // 10: Taker buy quote asset volume (estimado)
        '0'                                      // 11: Ignore
      ];
      
      return ratioKline;
    });

    res.json({
      success: true,
      symbol: `${longTokenSymbol}/${shortTokenSymbol}`,
      longToken: longTokenSymbol,
      shortToken: shortTokenSymbol,
      data: ratioKlines,
      count: ratioKlines.length
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

app.get('/api/strategy-bundles', async (req, res) => {
  try {
    const { 
      limit = 15, 
      riskLevel = 'ALL', 
      timePeriod = 'ALL', 
      sortBy = 'APR',
      strategyType = 'MAJOR'
    } = req.query;

    const cacheParams = { limit: parseInt(limit), riskLevel, timePeriod, sortBy, strategyType };
    const cachedResult = strategyCache.get(cacheParams);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const availableTokens = [
      'BTCUSDT', 'ETHUSDT', 'LINKUSDT', 'SOLUSDT', 'DOTUSDT', 'AVAXUSDT',
      'BNBUSDT', 'DOGEUSDT', 'PEPEUSDT', 'WIFUSDT', 'PENDLEUSDT', 'ARBUSDT',
      'OPUSDT', 'APEUSDT', 'GMXUSDT', 'AAVEUSDT', 'UNIUSDT', 'ADAUSDT',
      'TAOUSDT', 'ATOMUSDT', 'LDOUSDT', 'NEARUSDT', 'TIAUSDT', 'CAKEUSDT',
      'ZROUSDT', 'TRUMPUSDT'
    ];

    const systematicPairs = [];
    
    const longTokens = ['BTCUSDT', 'ETHUSDT', 'LINKUSDT', 'SOLUSDT', 'BNBUSDT'];
    
    let targetLongTokens = [];
    let targetShortTokens = [];
    
    if (strategyType === 'BTC_ETH') {
      targetLongTokens = ['BTCUSDT', 'ETHUSDT'];
      targetShortTokens = availableTokens;
    } else if (strategyType === 'MAJOR') {
      targetLongTokens = longTokens;
      targetShortTokens = availableTokens;
    } else {
      targetLongTokens = longTokens;
      targetShortTokens = availableTokens;
    }
    
    for (const longToken of targetLongTokens) {
      for (const token of targetShortTokens) {
        if (token !== longToken) {
          systematicPairs.push({ longToken: longToken, shortToken: token });
        }
      }
    }

    const tokenDataCache = new Map();
    const timePeriods = [30, 60, 100];
    const analysisResults = [];

    async function getTokenData(token, period) {
      const cacheKey = `${token}-${period}`;
      
      if (tokenDataCache.has(cacheKey)) {
        return tokenDataCache.get(cacheKey);
      }

      const binanceService = new BinanceService(
        'https://api.binance.com/api/v3/klines',
        '1d',
        period
      );

      const tokenData = await binanceService.getKlines(token);
      
      if (tokenData.success) {
        const processedData = binanceService.processKlines(tokenData.data);
        const filteredData = binanceService.filterValidDays(processedData);
        
        const result = {
          success: true,
          data: filteredData,
          binanceService
        };
        
        tokenDataCache.set(cacheKey, result);
        return result;
      } else {
        return { success: false, error: tokenData.error };
      }
    }

    for (const pair of systematicPairs) {
      try {
        const pairResults = {
          pair: `${pair.longToken}/${pair.shortToken}`,
          longToken: pair.longToken,
          shortToken: pair.shortToken,
          metrics: {},
          overallScore: 0,
          riskLevel: 'MEDIUM',
          recommendation: 'HOLD',
          confidence: 0
        };

        for (const period of timePeriods) {
          try {
            const longTokenData = await getTokenData(pair.longToken, period);
            const shortTokenData = await getTokenData(pair.shortToken, period);

            if (longTokenData.success && shortTokenData.success) {
              const longShortAnalyzer = new LongShortAnalyzer();

              const { synchronizedA, synchronizedB } = longTokenData.binanceService.synchronizeTimestamps(
                longTokenData.data, 
                shortTokenData.data
              );

              if (synchronizedA.length >= 30) {
                const stats = longShortAnalyzer.analyzeLongShortStrategy(
                  pair.longToken,
                  pair.shortToken,
                  synchronizedA,
                  synchronizedB
                );

                const result = longShortAnalyzer.generateRecommendation(stats);

                const firstLongKline = synchronizedA[0];
                const lastLongKline = synchronizedA[synchronizedA.length - 1];
                const firstShortKline = synchronizedB[0];
                const lastShortKline = synchronizedB[synchronizedB.length - 1];

                pairResults.metrics[`${period}d`] = {
                  winRate: stats.winRate,
                  totalProfit: stats.totalProfit,
                  averageDailyProfit: stats.averageDailyProfit,
                  sharpeRatio: stats.sharpeRatio,
                  consistencyScore: stats.consistencyScore,
                  recommendation: result.recommendation,
                  confidence: result.confidence,
                  validDays: stats.validDays,
                  initialLongPrice: firstLongKline.open,
                  finalLongPrice: lastLongKline.close,
                  initialShortPrice: firstShortKline.open,
                  finalShortPrice: lastShortKline.close
                };
              }
            }
          } catch (error) {
          }
        }

        if (Object.keys(pairResults.metrics).length > 0) {
          pairResults.overallScore = calculateOverallScore(pairResults.metrics);
          pairResults.riskLevel = determineRiskLevel(pairResults.metrics);
          pairResults.recommendation = getBestRecommendation(pairResults.metrics);
          pairResults.confidence = getAverageConfidence(pairResults.metrics);
          
          analysisResults.push(pairResults);
        }

      } catch (error) {
      }
    }

    let filteredResults = analysisResults;

    if (riskLevel !== 'ALL') {
      filteredResults = filteredResults.filter(result => result.riskLevel === riskLevel);
    }

    filteredResults.sort((a, b) => {
      switch (sortBy) {
        case 'APR':
          return b.overallScore - a.overallScore;
        case 'WIN_RATE':
          return getBestWinRate(b.metrics) - getBestWinRate(a.metrics);
        case 'SHARPE_RATIO':
          return getBestSharpeRatio(b.metrics) - getBestSharpeRatio(a.metrics);
        case 'CONSISTENCY':
          return getBestConsistency(b.metrics) - getBestConsistency(a.metrics);
        default:
          return b.overallScore - a.overallScore;
      }
    });

    const finalResults = filteredResults.slice(0, parseInt(limit));

    const resultsWithAPR = finalResults.map(result => ({
      ...result,
      apr: calculateAPR(result.metrics),
      tvl: generateSimulatedTVL(result.pair, result.overallScore),
      winRate100d: result.metrics['100d']?.winRate || 0,
      avgDailyProfit100d: result.metrics['100d']?.averageDailyProfit || 0,
      totalProfit100d: result.metrics['100d']?.totalProfit || 0,
      sharpeRatio100d: result.metrics['100d']?.sharpeRatio || 0,
      consistencyScore100d: result.metrics['100d']?.consistencyScore || 0
    }));

    const response = {
      strategies: resultsWithAPR,
      totalAnalyzed: systematicPairs.length,
      totalFiltered: filteredResults.length,
      returned: resultsWithAPR.length,
      strategyType: strategyType,
      strategyInfo: {
        type: strategyType,
        description: strategyType === 'BTC_ETH' 
          ? 'Análisis enfocado solo en BTC y ETH' 
          : 'Análisis con todos los tokens principales',
        longTokens: targetLongTokens,
        shortTokens: targetShortTokens.slice(0, 5)
      },
      cacheInfo: {
        cached: false,
        generatedAt: new Date().toISOString()
      }
    };

    strategyCache.set(cacheParams, response);

    res.json(response);

  } catch (error) {
    res.status(500).json({ 
      error: 'Error generando strategy bundles',
      details: error.message 
    });
  }
});

app.get('/api/cache-stats', (req, res) => {
  const stats = strategyCache.getStats();
  res.json({
    ...stats,
    ttl: strategyCache.TTL,
    ttlHours: strategyCache.TTL / (1000 * 60 * 60)
  });
});

app.get('/api/contract-senders', async (req, res) => {
  try {
    const contractAddress = '0xF201797e767872541a8149A4906FF73615189646';
    const apiKey = 'GGBW6DZQN28DS8PFKNJRE7FP47DCCIA3J6';
    // API V2 de Etherscan - funciona para todas las redes incluyendo Arbitrum
    const apiUrl = 'https://api.etherscan.io/v2/api';
    const chainId = 42161; // Arbitrum One
    
    // Parámetros opcionales de query
    const fromBlock = req.query.fromBlock ? parseInt(req.query.fromBlock) : 0;
    const toBlock = req.query.toBlock ? parseInt(req.query.toBlock) : 99999999;
    const maxTxs = req.query.maxTxs ? parseInt(req.query.maxTxs) : null; // Límite opcional de transacciones a procesar
    
    const uniqueSenders = new Set();
    let page = 1;
    const offset = 10000; // Máximo por página
    let hasMore = true;
    let totalTxsProcessed = 0;
    
    console.log(`Iniciando búsqueda de msg.senders para contrato ${contractAddress} en Arbitrum (chainId: ${chainId})...`);
    console.log(`Rango de bloques: ${fromBlock} - ${toBlock}${maxTxs ? `, máximo ${maxTxs} transacciones` : ''}`);
    
    while (hasMore) {
      try {
        // Si hay un límite de transacciones y ya lo alcanzamos, parar
        if (maxTxs && totalTxsProcessed >= maxTxs) {
          console.log(`Límite de transacciones alcanzado: ${totalTxsProcessed}/${maxTxs}`);
          hasMore = false;
          break;
        }
        
        // Obtener transacciones donde el contrato es el destino (to)
        // Esto nos da las transacciones que llamaron al contrato (msg.sender = from)
        const response = await axios.get(apiUrl, {
          params: {
            chainid: chainId,
            module: 'account',
            action: 'txlist',
            address: contractAddress,
            startblock: fromBlock,
            endblock: toBlock,
            page: page,
            offset: offset,
            sort: 'asc',
            apikey: apiKey
          }
        });
        
        console.log(`Página ${page} - Status: ${response.data.status}, Message: ${response.data.message || 'OK'}`);
        
        if (response.data.status === '1' && response.data.result && Array.isArray(response.data.result)) {
          const transactions = response.data.result;
          
          console.log(`Página ${page}: ${transactions.length} transacciones encontradas`);
          
          // Filtrar solo las transacciones donde el contrato es el destino (to)
          // El msg.sender es el campo 'from' de estas transacciones
          for (const tx of transactions) {
            // Si hay un límite y ya lo alcanzamos, parar
            if (maxTxs && totalTxsProcessed >= maxTxs) {
              hasMore = false;
              break;
            }
            
            // Solo considerar transacciones donde el contrato es el destino
            if (tx.to && tx.to.toLowerCase() === contractAddress.toLowerCase()) {
              // El msg.sender es el 'from' de la transacción
              if (tx.from && tx.from.toLowerCase() !== contractAddress.toLowerCase()) {
                uniqueSenders.add(tx.from);
              }
              totalTxsProcessed++;
            }
          }
          
          // Si no hay transacciones o hay menos del offset, es la última página
          if (transactions.length === 0 || transactions.length < offset) {
            hasMore = false;
          } else if (!maxTxs || totalTxsProcessed < maxTxs) {
            page++;
          } else {
            hasMore = false;
          }
        } else {
          // Si la respuesta indica error o no hay más resultados
          console.log(`Respuesta API: ${JSON.stringify(response.data)}`);
          if (response.data.message) {
            if (response.data.message.includes('No transactions found') || 
                response.data.message === 'OK' && (!response.data.result || response.data.result.length === 0)) {
              hasMore = false;
            } else if (response.data.status === '0') {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
        
        // Pequeña pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Error en página ${page}:`, error.message);
        if (error.response) {
          console.error(`Response data:`, error.response.data);
        }
        hasMore = false;
      }
    }
    
    const sendersList = Array.from(uniqueSenders);
    
    console.log(`Total de msg.senders únicos encontrados: ${sendersList.length}`);
    
    res.json({
      success: true,
      contractAddress: contractAddress,
      network: 'Arbitrum',
      fromBlock: fromBlock,
      toBlock: toBlock,
      maxTxs: maxTxs || 'unlimited',
      totalTxsProcessed: totalTxsProcessed,
      totalUniqueSenders: sendersList.length,
      senders: sendersList,
      pagesProcessed: page
    });
    
  } catch (error) {
    console.error('Error general:', error);
    res.status(500).json({
      error: 'Error obteniendo los msg.senders del contrato',
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
  });
}

module.exports = app;