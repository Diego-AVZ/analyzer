const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// 🗄️ Sistema de Cache para Strategy Bundles
class StrategyCache {
  constructor() {
    this.cache = new Map();
    this.TTL = 3600000; // 1 hora en milisegundos
  }

  // Generar clave única para el cache
  generateKey(params = {}) {
    const { limit = 15, riskLevel = 'ALL', timePeriod = 'ALL', sortBy = 'APR' } = params;
    return `strategy-bundles-${limit}-${riskLevel}-${timePeriod}-${sortBy}`;
  }

  // Verificar si el cache es válido
  isValid(entry) {
    if (!entry) return false;
    const now = Date.now();
    return (now - entry.timestamp) < this.TTL;
  }

  // Obtener del cache
  get(params) {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);
    
    if (this.isValid(entry)) {
      console.log(`📦 Cache HIT para ${key}`);
      return {
        ...entry.data,
        cached: true,
        cacheAge: Date.now() - entry.timestamp,
        cacheExpiresIn: this.TTL - (Date.now() - entry.timestamp)
      };
    }
    
    if (entry) {
      console.log(`⏰ Cache EXPIRED para ${key}`);
      this.cache.delete(key);
    }
    
    return null;
  }

  // Guardar en cache
  set(params, data) {
    const key = this.generateKey(params);
    const entry = {
      data,
      timestamp: Date.now()
    };
    
    this.cache.set(key, entry);
    console.log(`💾 Cache SET para ${key}`);
    
    // Limpiar cache expirado cada 10 minutos
    this.cleanup();
  }

  // Limpiar cache expirado
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= this.TTL) {
        this.cache.delete(key);
        console.log(`🧹 Cache CLEANUP: eliminado ${key}`);
      }
    }
  }

  // Obtener estadísticas del cache
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

// Instancia global del cache
const strategyCache = new StrategyCache();

// 🧮 Funciones auxiliares para cálculo de métricas
function calculateOverallScore(metrics) {
  const periods = Object.keys(metrics);
  if (periods.length === 0) return 0;

  // Ponderación por período (narrativa actual = 30d tiene más peso)
  const periodWeights = {
    '30d': 0.50,  // 50% - Narrativa actual del mercado
    '60d': 0.30,  // 30% - Tendencia reciente
    '100d': 0.20  // 20% - Contexto histórico
  };

  let weightedScore = 0;
  let totalWeight = 0;

  for (const period of periods) {
    const metric = metrics[period];
    const weight = periodWeights[period] || 0;
    
    if (metric && metric.validDays >= 30 && weight > 0) {
      // Score compuesto: Win Rate (30%) + Total Profit (25%) + Sharpe (20%) + Consistency (15%) + Recommendation (10%)
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

  // Obtener métricas de cada período
  const m30d = metrics['30d'];
  const m60d = metrics['60d'];
  const m100d = metrics['100d'];

  // Validar que tengamos datos suficientes
  const has30d = m30d && m30d.validDays >= 25;
  const has60d = m60d && m60d.validDays >= 50;
  const has100d = m100d && m100d.validDays >= 80;

  if (!has30d && !has60d && !has100d) return 'HIGH';

  // Criterios ponderados (30d tiene más peso)
  // LOW RISK: Excelente rendimiento en narrativa actual + buenos resultados históricos
  const isLowRisk30d = has30d && m30d.winRate >= 58 && m30d.totalProfit >= 10 && m30d.sharpeRatio >= 0.05;
  const isLowRisk60d = has60d && m60d.winRate >= 55 && m60d.totalProfit >= 15;
  const isLowRisk100d = has100d && m100d.winRate >= 50 && m100d.totalProfit >= 20;

  // MEDIUM RISK: Buen rendimiento reciente aunque histórico sea variable
  const isMediumRisk30d = has30d && m30d.winRate >= 52 && m30d.totalProfit >= 5;
  const isMediumRisk60d = has60d && m60d.winRate >= 50 && m60d.totalProfit >= 8;
  const isMediumRisk100d = has100d && m100d.winRate >= 48;

  // Decisión ponderada (50% peso en 30d, 30% en 60d, 20% en 100d)
  if (isLowRisk30d && (isLowRisk60d || isLowRisk100d)) {
    return 'LOW';
  }

  if (isMediumRisk30d && (isMediumRisk60d || isMediumRisk100d)) {
    return 'MEDIUM';
  }

  // Si 30d es muy bueno pero histórico es malo, MEDIUM (narrativa actual positiva)
  if (isLowRisk30d) {
    return 'MEDIUM';
  }

  return 'HIGH';
}

function getBestRecommendation(metrics) {
  const periods = Object.keys(metrics);
  if (periods.length === 0) return 'HOLD';

  // Dar más peso a la narrativa actual (30d)
  const m30d = metrics['30d'];
  const m60d = metrics['60d'];
  const m100d = metrics['100d'];

  // Si 30d es STRONG_BUY, priorizarlo (narrativa actual)
  if (m30d && m30d.validDays >= 25 && m30d.recommendation === 'STRONG_BUY') {
    // Si al menos otro período también es favorable
    const othersFavorable = 
      (m60d && (m60d.recommendation === 'STRONG_BUY' || m60d.recommendation === 'BUY' || m60d.recommendation === 'HOLD')) ||
      (m100d && (m100d.recommendation === 'STRONG_BUY' || m100d.recommendation === 'BUY' || m100d.recommendation === 'HOLD'));
    
    if (othersFavorable) return 'STRONG_BUY';
    return 'BUY'; // 30d strong buy solo = BUY general
  }

  // Si 30d es BUY
  if (m30d && m30d.validDays >= 25 && m30d.recommendation === 'BUY') {
    const othersBuy = 
      (m60d && (m60d.recommendation === 'STRONG_BUY' || m60d.recommendation === 'BUY')) ||
      (m100d && (m100d.recommendation === 'STRONG_BUY' || m100d.recommendation === 'BUY'));
    
    if (othersBuy) return 'BUY';
  }

  // Contar recomendaciones en todos los períodos (fallback)
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

  // Usar el mejor período para calcular APR (sin reinversión)
  let bestAPR = 0;
  
  for (const period of periods) {
    const metric = metrics[period];
    if (metric && metric.validDays >= 30) {
      const days = parseInt(period.replace('d', ''));
      const totalProfit = metric.totalProfit;
      // APR simple: ganancia total * (365 días / días del período)
      const apr = (totalProfit * 365) / days;
      bestAPR = Math.max(bestAPR, apr);
    }
  }

  return Math.round(bestAPR * 10) / 10; // Redondear a 1 decimal
}

function generateSimulatedTVL(pair, score) {
  // Simular TVL basado en el score y popularidad del par
  const baseTVL = Math.max(1, Math.min(50, score * 2)); // Entre 1M y 50M
  const randomFactor = 0.8 + Math.random() * 0.4; // ±20% variación
  return Math.round(baseTVL * randomFactor * 100) / 100; // Redondear a 2 decimales
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

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));
app.use(express.json());

// Middleware para manejar OPTIONS preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Importar los servicios del backend
const { BinanceService } = require('./dist/binanceService');
const { LongShortAnalyzer } = require('./dist/longShortAnalyzer');
const { DeltaNeutralAnalyzer } = require('./dist/deltaNeutralAnalyzer');
const { LiquidityRangeAnalyzer } = require('./dist/liquidityRangeAnalyzer');
const { getConfig } = require('./dist/config');

// Endpoint para análisis de estrategia Long/Short
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

    console.log(`🔍 Analizando LONG ${longToken}/SHORT ${shortToken} con ${timePeriod} días...`);

    // Crear servicios con configuración personalizada
    const binanceService = new BinanceService(
      'https://api.binance.com/api/v3/klines',
      '1d',
      timePeriod || 100
    );
    
    const longShortAnalyzer = new LongShortAnalyzer();

    // Obtener datos de ambos tokens
    console.log('📊 Obteniendo datos de Binance...');
    const longTokenData = await binanceService.getKlines(longToken.toUpperCase());
    const shortTokenData = await binanceService.getKlines(shortToken.toUpperCase());

    if (!longTokenData.success || !shortTokenData.success) {
      return res.status(500).json({ 
        error: 'Error obteniendo datos de Binance',
        details: longTokenData.error || shortTokenData.error
      });
    }

    // Procesar los datos
    console.log('🔄 Procesando datos...');
    const longKlines = binanceService.processKlines(longTokenData.data);
    const shortKlines = binanceService.processKlines(shortTokenData.data);

    // Validar datos
    if (!binanceService.validateKlines(longKlines) || !binanceService.validateKlines(shortKlines)) {
      return res.status(500).json({ 
        error: 'Datos inválidos obtenidos de Binance' 
      });
    }

    // Filtrar días válidos
    const filteredLongKlines = binanceService.filterValidDays(longKlines);
    const filteredShortKlines = binanceService.filterValidDays(shortKlines);

    // Sincronizar timestamps
    const { synchronizedA, synchronizedB } = binanceService.synchronizeTimestamps(
      filteredLongKlines, 
      filteredShortKlines
    );

    if (synchronizedA.length < 30) {
      return res.status(500).json({ 
        error: `Insuficientes datos válidos: ${synchronizedA.length} días (mínimo: 30)` 
      });
    }

    console.log(`✅ ${synchronizedA.length} días sincronizados para análisis`);

    // Realizar análisis Long/Short
    console.log('🔬 Realizando análisis Long/Short...');
    const stats = longShortAnalyzer.analyzeLongShortStrategy(
      longToken.toUpperCase(),
      shortToken.toUpperCase(),
      synchronizedA,
      synchronizedB
    );

    const result = longShortAnalyzer.generateRecommendation(stats);

    console.log(`✅ Análisis completado: ${result.recommendation} (${result.confidence}%)`);

    // Devolver resultado
    res.json(result);

  } catch (error) {
    console.error('❌ Error en análisis:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Endpoint para análisis delta neutral
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

    console.log(`🔍 Iniciando análisis delta neutral...`);
    console.log(`📊 Estrategia A: LONG ${longTokenA}/SHORT ${shortTokenA}`);
    console.log(`📊 Estrategia B: LONG ${longTokenB}/SHORT ${shortTokenB}`);

    const analyzer = new DeltaNeutralAnalyzer();
    const result = await analyzer.analyzeDeltaNeutral(
      { longToken: longTokenA, shortToken: shortTokenA },
      { longToken: longTokenB, shortToken: shortTokenB },
      timePeriod || 100
    );

    res.json(result);

  } catch (error) {
    console.error('❌ Error en análisis delta neutral:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Endpoint para análisis de rangos de liquidez
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

    console.log(`🔍 Analizando rango de liquidez para ${tokenA}/${tokenB}`);
    console.log(`📊 Rango: +${rangeUpPercent}% / -${rangeDownPercent}% con ${timePeriod} días...`);

    // Crear servicios
    const binanceService = new BinanceService(
      'https://api.binance.com/api/v3/klines',
      '1d',
      timePeriod || 100
    );
    
    const liquidityRangeAnalyzer = new LiquidityRangeAnalyzer();

    // Obtener datos de ambos tokens
    console.log('📊 Obteniendo datos de Binance...');
    const tokenAData = await binanceService.getKlines(tokenA.toUpperCase());
    const tokenBData = await binanceService.getKlines(tokenB.toUpperCase());

    if (!tokenAData.success || !tokenBData.success) {
      return res.status(500).json({ 
        error: 'Error obteniendo datos de Binance',
        details: tokenAData.error || tokenBData.error
      });
    }

    // Procesar los datos
    console.log('🔄 Procesando datos...');
    const klinesA = binanceService.processKlines(tokenAData.data);
    const klinesB = binanceService.processKlines(tokenBData.data);

    // Validar datos
    if (!binanceService.validateKlines(klinesA) || !binanceService.validateKlines(klinesB)) {
      return res.status(500).json({ 
        error: 'Datos inválidos obtenidos de Binance' 
      });
    }

    // Filtrar días válidos
    const filteredKlinesA = binanceService.filterValidDays(klinesA);
    const filteredKlinesB = binanceService.filterValidDays(klinesB);

    // Sincronizar timestamps
    const { synchronizedA, synchronizedB } = binanceService.synchronizeTimestamps(
      filteredKlinesA, 
      filteredKlinesB
    );

    if (synchronizedA.length < 30) {
      return res.status(500).json({ 
        error: `Insuficientes datos válidos: ${synchronizedA.length} días (mínimo: 30)` 
      });
    }

    console.log(`✅ ${synchronizedA.length} días sincronizados para análisis`);

    // Realizar análisis de rango de liquidez
    console.log('🔬 Realizando análisis de rango de liquidez...');
    const result = liquidityRangeAnalyzer.analyzeLiquidityRange(
      tokenA.toUpperCase(),
      tokenB.toUpperCase(),
      synchronizedA,
      synchronizedB,
      rangeUpPercent,
      rangeDownPercent
    );

    console.log(`✅ Análisis completado: ${result.recommendation} (${result.confidence}%)`);

    // Devolver resultado
    res.json(result);

  } catch (error) {
    console.error('❌ Error en análisis de rango de liquidez:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Endpoint para obtener tokens disponibles
app.get('/api/tokens', (req, res) => {
  const tokens = [
    'ETHUSDT', 'BTCUSDT', 'APTUSDT', 'INJUSDT', 'CRVUSDT', 'XRPUSDT', 
    'CAKEUSDT', 'DYDXUSDT', 'SUIUSDT', 'XLMUSDT', 'PEPEUSDT', 'OPUSDT',
    'GMXUSDT', 'DOTUSDT', 'ARBUSDT', 'LDOUSDT', 'LINKUSDT'
  ];
  
  res.json(tokens);
});

// 🚀 Endpoint principal para Strategy Bundles con Cache
app.get('/api/strategy-bundles', async (req, res) => {
  try {
    const { 
      limit = 15, 
      riskLevel = 'ALL', 
      timePeriod = 'ALL', 
      sortBy = 'APR' 
    } = req.query;

    console.log(`🔍 Solicitud Strategy Bundles: limit=${limit}, risk=${riskLevel}, period=${timePeriod}, sort=${sortBy}`);

    // Verificar cache primero
    const cacheParams = { limit: parseInt(limit), riskLevel, timePeriod, sortBy };
    const cachedResult = strategyCache.get(cacheParams);
    
    if (cachedResult) {
      console.log(`✅ Devolviendo resultado desde cache (edad: ${Math.round(cachedResult.cacheAge / 1000)}s)`);
      return res.json(cachedResult);
    }

    console.log(`🔄 Cache MISS - Generando nuevos datos...`);

    // Generar pares sistemáticos (BTC y ETH como LONG vs todos los demás)
    const availableTokens = [
      'ETHUSDT', 'BTCUSDT', 'APTUSDT', 'INJUSDT', 'CRVUSDT', 'XRPUSDT', 
      'CAKEUSDT', 'DYDXUSDT', 'SUIUSDT', 'XLMUSDT', 'PEPEUSDT', 'OPUSDT',
      'GMXUSDT', 'DOTUSDT', 'ARBUSDT', 'LDOUSDT', 'LINKUSDT'
    ];

    const systematicPairs = [];
    
    // BTC vs todos los demás
    for (const token of availableTokens) {
      if (token !== 'BTCUSDT') {
        systematicPairs.push({ longToken: 'BTCUSDT', shortToken: token });
      }
    }
    
    // ETH vs todos los demás
    for (const token of availableTokens) {
      if (token !== 'ETHUSDT') {
        systematicPairs.push({ longToken: 'ETHUSDT', shortToken: token });
      }
    }

    console.log(`📊 Analizando ${systematicPairs.length} pares sistemáticos...`);

    // 🚀 OPTIMIZACIÓN: Cache de datos de tokens para evitar llamadas redundantes
    const tokenDataCache = new Map();
    const timePeriods = [30, 60, 100];
    const analysisResults = [];

    // Función para obtener datos de un token con cache
    async function getTokenData(token, period) {
      const cacheKey = `${token}-${period}`;
      
      if (tokenDataCache.has(cacheKey)) {
        console.log(`📦 Cache HIT para ${token} (${period}d)`);
        return tokenDataCache.get(cacheKey);
      }

      console.log(`🔄 Obteniendo datos de ${token} (${period}d)...`);
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
        console.log(`💾 Cache SET para ${token} (${period}d)`);
        return result;
      } else {
        console.warn(`❌ Error obteniendo datos de ${token}:`, tokenData.error);
        return { success: false, error: tokenData.error };
      }
    }

    // Analizar cada par en los 3 períodos
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

        // Analizar en cada período
        for (const period of timePeriods) {
          try {
            // Obtener datos con cache
            const longTokenData = await getTokenData(pair.longToken, period);
            const shortTokenData = await getTokenData(pair.shortToken, period);

            if (longTokenData.success && shortTokenData.success) {
              const longShortAnalyzer = new LongShortAnalyzer();

              // Sincronizar timestamps
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

                pairResults.metrics[`${period}d`] = {
                  winRate: stats.winRate,
                  totalProfit: stats.totalProfit,
                  averageDailyProfit: stats.averageDailyProfit,
                  sharpeRatio: stats.sharpeRatio,
                  consistencyScore: stats.consistencyScore,
                  recommendation: result.recommendation,
                  confidence: result.confidence,
                  validDays: stats.validDays
                };
              }
            }
          } catch (error) {
            console.warn(`⚠️ Error analizando ${pair.pair} en ${period}d:`, error.message);
          }
        }

        // Calcular score general y determinar riesgo
        if (Object.keys(pairResults.metrics).length > 0) {
          pairResults.overallScore = calculateOverallScore(pairResults.metrics);
          pairResults.riskLevel = determineRiskLevel(pairResults.metrics);
          pairResults.recommendation = getBestRecommendation(pairResults.metrics);
          pairResults.confidence = getAverageConfidence(pairResults.metrics);
          
          analysisResults.push(pairResults);
        }

      } catch (error) {
        console.warn(`⚠️ Error procesando par ${pair.longToken}/${pair.shortToken}:`, error.message);
      }
    }

    console.log(`📊 Cache de tokens: ${tokenDataCache.size} entradas guardadas`);

    // Filtrar y ordenar resultados
    let filteredResults = analysisResults;

    // Filtrar por nivel de riesgo
    if (riskLevel !== 'ALL') {
      filteredResults = filteredResults.filter(result => result.riskLevel === riskLevel);
    }

    // Ordenar por criterio seleccionado
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

    // Limitar resultados
    const finalResults = filteredResults.slice(0, parseInt(limit));

    // Calcular APR y métricas de 100 días para cada resultado
    const resultsWithAPR = finalResults.map(result => ({
      ...result,
      apr: calculateAPR(result.metrics),
      tvl: generateSimulatedTVL(result.pair, result.overallScore),
      // Métricas de 100 días
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
      cacheInfo: {
        cached: false,
        generatedAt: new Date().toISOString()
      }
    };

    // Guardar en cache
    strategyCache.set(cacheParams, response);

    console.log(`✅ Strategy Bundles generados: ${resultsWithAPR.length} estrategias`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error en Strategy Bundles:', error);
    res.status(500).json({ 
      error: 'Error generando strategy bundles',
      details: error.message 
    });
  }
});

// 📊 Endpoint para estadísticas del cache
app.get('/api/cache-stats', (req, res) => {
  const stats = strategyCache.getStats();
  res.json({
    ...stats,
    ttl: strategyCache.TTL,
    ttlHours: strategyCache.TTL / (1000 * 60 * 60)
  });
});

// Servir la aplicación React para todas las rutas no-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});
