const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Importar los servicios del backend
const { BinanceService } = require('./dist/binanceService');
const { LongShortAnalyzer } = require('./dist/longShortAnalyzer');
const { DeltaNeutralAnalyzer } = require('./dist/deltaNeutralAnalyzer');
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

// Endpoint para obtener tokens disponibles
app.get('/api/tokens', (req, res) => {
  const tokens = [
    'ETHUSDT', 'BTCUSDT', 'APTUSDT', 'INJUSDT', 'CRVUSDT', 'XRPUSDT', 
    'CAKEUSDT', 'DYDXUSDT', 'SUIUSDT', 'XLMUSDT', 'PEPEUSDT', 'OPUSDT',
    'GMXUSDT', 'DOTUSDT', 'ARBUSDT', 'LDOUSDT', 'LINKUSDT'
  ];
  
  res.json(tokens);
});

// Servir la aplicación React para todas las rutas no-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});
