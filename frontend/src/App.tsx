import React, { useState, useEffect } from 'react';
import './App.css';
import { apiService, AnalysisRequest, AnalysisResponse } from './services/api';
import DeltaNeutralAnalyzer from './components/DeltaNeutralAnalyzer';
import LiquidityRangeCalculator from './components/LiquidityRangeCalculator';

// Usar el tipo del servicio API
type AnalysisResult = AnalysisResponse;

// Tokens disponibles basados en la configuración del backend
const AVAILABLE_TOKENS = [
  'ETHUSDT', 'BTCUSDT', 'APTUSDT', 'INJUSDT', 'CRVUSDT', 'XRPUSDT', 
  'CAKEUSDT', 'DYDXUSDT', 'SUIUSDT', 'XLMUSDT', 'PEPEUSDT', 'OPUSDT',
  'GMXUSDT', 'DOTUSDT', 'ARBUSDT', 'LDOUSDT', 'LINKUSDT', 'AAVEUSDT'
];

// Períodos de tiempo disponibles
const TIME_PERIODS = [
  { value: 30, label: '30 días' },
  { value: 60, label: '60 días' },
  { value: 100, label: '100 días' },
  { value: 200, label: '200 días' }
];

function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'delta-neutral' | 'liquidity-range'>('single');
  const [longToken, setLongToken] = useState('ETHUSDT');
  const [shortToken, setShortToken] = useState('APTUSDT');
  const [timePeriod, setTimePeriod] = useState(100);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para realizar el análisis
  const performAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const request: AnalysisRequest = {
        longToken,
        shortToken,
        timePeriod
      };
      
      const result = await apiService.analyzeStrategy(request);
      setAnalysisResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al realizar el análisis. Inténtalo de nuevo.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el color de la recomendación
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY': return '#00ff00';
      case 'BUY': return '#90ee90';
      case 'HOLD': return '#ffa500';
      case 'SELL': return '#ff6b6b';
      default: return '#666';
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Calculadora de Estrategias Long/Short</h1>
        <p>Análisis de correlaciones inversas entre tokens de Binance</p>
        
        {/* Tabs de navegación */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
          >
            📊 Análisis Individual
          </button>
          <button 
            className={`tab ${activeTab === 'delta-neutral' ? 'active' : ''}`}
            onClick={() => setActiveTab('delta-neutral')}
          >
            🔄 Delta Neutral
          </button>
          <button 
            className={`tab ${activeTab === 'liquidity-range' ? 'active' : ''}`}
            onClick={() => setActiveTab('liquidity-range')}
          >
            💧 Rangos de Liquidez
          </button>
        </div>
      </header>

      <main className="calculator-container">
        {activeTab === 'single' ? (
          <>
            <div className="calculator-form">
              <h2>📊 Configuración del Análisis</h2>
              
              <div className="form-group">
                <label htmlFor="longToken">Token Long (Comprar):</label>
                <select 
                  id="longToken"
                  value={longToken} 
                  onChange={(e) => setLongToken(e.target.value)}
                  disabled={loading}
                >
                  {AVAILABLE_TOKENS.map(token => (
                    <option key={token} value={token}>{token}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="shortToken">Token Short (Vender):</label>
                <select 
                  id="shortToken"
                  value={shortToken} 
                  onChange={(e) => setShortToken(e.target.value)}
                  disabled={loading}
                >
                  {AVAILABLE_TOKENS.filter(token => token !== longToken).map(token => (
                    <option key={token} value={token}>{token}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="timePeriod">Período de Tiempo:</label>
                <select 
                  id="timePeriod"
                  value={timePeriod} 
                  onChange={(e) => setTimePeriod(Number(e.target.value))}
                  disabled={loading}
                >
                  {TIME_PERIODS.map(period => (
                    <option key={period.value} value={period.value}>{period.label}</option>
                  ))}
                </select>
              </div>

              <button 
                className="analyze-button"
                onClick={performAnalysis}
                disabled={loading || longToken === shortToken}
              >
                {loading ? '🔄 Analizando...' : '🚀 Analizar Estrategia'}
              </button>

              {longToken === shortToken && (
                <p className="error-message">⚠️ Los tokens Long y Short deben ser diferentes</p>
              )}
            </div>

        {error && (
          <div className="error-container">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {analysisResult && (
          <div className="results-container">
            <h2>📈 Resultados del Análisis</h2>
            
            <div className="recommendation-card">
              <h3 style={{ color: getRecommendationColor(analysisResult.recommendation) }}>
                {analysisResult.recommendation === 'STRONG_BUY' && '🔥 STRONG BUY'}
                {analysisResult.recommendation === 'BUY' && '⚡ BUY'}
                {analysisResult.recommendation === 'HOLD' && '📊 HOLD'}
                {analysisResult.recommendation === 'SELL' && '❌ SELL'}
              </h3>
              <p className="confidence">Confianza: {analysisResult.confidence}%</p>
              <p className="strategy-advice">{analysisResult.strategyAdvice}</p>
            </div>

            {/* Métricas destacadas */}
            <div className="highlighted-metrics">
              <h3>🎯 Métricas Clave</h3>
              <div className="metrics-grid">
                <div className="metric-card win-rate">
                  <div className="metric-icon">🎯</div>
                  <div className="metric-value">{analysisResult.stats.winRate.toFixed(1)}%</div>
                  <div className="metric-label">Días Ganadores</div>
                  <div className="metric-subtitle">{analysisResult.stats.winningDays} de {analysisResult.stats.totalDays} días</div>
                </div>

                <div className="metric-card gain-average">
                  <div className="metric-icon">📈</div>
                  <div className="metric-value">+{analysisResult.stats.averageDailyProfit.toFixed(3)}%</div>
                  <div className="metric-label">Ganancia Promedio Diaria</div>
                  <div className="metric-subtitle">incluye todos los días</div>
                </div>

                <div className="metric-card gain-total">
                  <div className="metric-icon">💰</div>
                  <div className="metric-value">+{analysisResult.stats.totalGain.toFixed(1)}%</div>
                  <div className="metric-label">Ganancia Total</div>
                  <div className="metric-subtitle">días ganadores únicamente</div>
                </div>

                <div className="metric-card gain-per-winning-day">
                  <div className="metric-icon">🎯</div>
                  <div className="metric-value">+{analysisResult.stats.averageDailyGain.toFixed(3)}%</div>
                  <div className="metric-label">Ganancia Media</div>
                  <div className="metric-subtitle">por día ganador</div>
                </div>

                <div className="metric-card loss-rate">
                  <div className="metric-icon">📉</div>
                  <div className="metric-value">{analysisResult.stats.lossRate.toFixed(1)}%</div>
                  <div className="metric-label">Días Perdedores</div>
                  <div className="metric-subtitle">{analysisResult.stats.losingDays} de {analysisResult.stats.totalDays} días</div>
                </div>

                <div className="metric-card loss-average">
                  <div className="metric-icon">⚠️</div>
                  <div className="metric-value">{analysisResult.stats.averageDailyLoss.toFixed(3)}%</div>
                  <div className="metric-label">Pérdida Media</div>
                  <div className="metric-subtitle">por día perdedor</div>
                </div>

                <div className="metric-card loss-total">
                  <div className="metric-icon">💸</div>
                  <div className="metric-value">{analysisResult.stats.totalLoss.toFixed(1)}%</div>
                  <div className="metric-label">Pérdida Total</div>
                  <div className="metric-subtitle">días perdedores únicamente</div>
                </div>
              </div>

              {/* Ganancia Neta Real */}
              <div className="net-profit-card">
                <h3>💎 Ganancia Neta Real</h3>
                <div className="net-profit-calculation">
                  <div className="calculation-formula">
                    <span className="formula-text">
                      (Ganancia Media × Días Ganadores) - (Pérdida Media × Días Perdedores)
                    </span>
                    <span className="formula-numbers">
                      ({analysisResult.stats.averageDailyGain.toFixed(3)}% × {analysisResult.stats.winningDays}) - ({Math.abs(analysisResult.stats.averageDailyLoss).toFixed(3)}% × {analysisResult.stats.losingDays})
                    </span>
                    <span className="formula-result">
                      = <strong>{analysisResult.stats.totalProfit.toFixed(2)}%</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* APR basado en ganancia neta */}
              <div className="apr-card">
                <h3>📈 APR Anual (Ganancia Neta)</h3>
                <div className="apr-calculation">
                  <div className="metric-value">{(() => {
                    const totalProfit = analysisResult.stats.totalProfit;
                    const totalDays = analysisResult.stats.totalDays;
                    const apr = ((Math.pow(1 + totalProfit/100, 365/totalDays) - 1) * 100);
                    return apr.toFixed(1);
                  })()}%</div>
                  <div className="metric-subtitle">basado en ganancia neta real</div>
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <h4>📊 Estadísticas Generales</h4>
                <p>Días totales: {analysisResult.stats.totalDays}</p>
                <p>Días válidos: {analysisResult.stats.validDays}</p>
                <p>Win Rate: {analysisResult.stats.winRate.toFixed(1)}%</p>
                <p>Loss Rate: {analysisResult.stats.lossRate.toFixed(1)}%</p>
              </div>

              <div className="stat-card">
                <h4>💰 Rendimiento</h4>
                <p>Ganancia total: {analysisResult.stats.totalProfit.toFixed(2)}%</p>
                <p>Ganancia promedio diaria: {analysisResult.stats.averageDailyProfit.toFixed(3)}%</p>
                <p>Ganancia máxima: {analysisResult.stats.maxSingleDayProfit.toFixed(2)}%</p>
                <p>Pérdida máxima: {analysisResult.stats.maxSingleDayLoss.toFixed(2)}%</p>
              </div>

              <div className="stat-card">
                <h4>📈 Consecutivos</h4>
                <p>Días ganadores máx: {analysisResult.stats.maxConsecutiveWinningDays}</p>
                <p>Días perdedores máx: {analysisResult.stats.maxConsecutiveLosingDays}</p>
                <p>Días ganadores: {analysisResult.stats.winningDays}</p>
                <p>Días perdedores: {analysisResult.stats.losingDays}</p>
              </div>

              <div className="stat-card">
                <h4>📉 Métricas de Riesgo</h4>
                <p>Volatilidad: {analysisResult.stats.profitVolatility.toFixed(2)}%</p>
                <p>Sharpe Ratio: {analysisResult.stats.sharpeRatio.toFixed(3)}</p>
                <p>Máximo Drawdown: {analysisResult.stats.maxDrawdown.toFixed(2)}%</p>
                <p>Score Consistencia: {analysisResult.stats.consistencyScore.toFixed(1)}/100</p>
              </div>
            </div>
          </div>
            )}
          </>
        ) : activeTab === 'delta-neutral' ? (
          <DeltaNeutralAnalyzer />
        ) : (
          <LiquidityRangeCalculator />
        )}
      </main>
    </div>
  );
}

export default App;
