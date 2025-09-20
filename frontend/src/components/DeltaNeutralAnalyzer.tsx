import React, { useState } from 'react';

interface DeltaNeutralRequest {
  strategyA: {
    longToken: string;
    shortToken: string;
  };
  strategyB: {
    longToken: string;
    shortToken: string;
  };
  timePeriod: number;
}

interface StrategyResult {
  pair: string;
  longToken: string;
  shortToken: string;
  stats: {
    totalDays: number;
    validDays: number;
    winningDays: number;
    losingDays: number;
    winRate: number;
    lossRate: number;
    totalProfit: number;
    averageDailyProfit: number;
    averageDailyGain: number;  // Ganancia media por día ganador
    averageDailyLoss: number;  // Pérdida media por día perdedor
    totalGain: number;         // Ganancia total de días ganadores
    totalLoss: number;         // Pérdida total de días perdedores
    maxSingleDayProfit: number;
    maxSingleDayLoss: number;
    maxConsecutiveWinningDays: number;
    maxConsecutiveLosingDays: number;
    profitVolatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    consistencyScore: number;
    dailyProfits: number[];
  };
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  strategyAdvice: string;
}

interface StrategyCorrelation {
  bothWinDays: number;
  bothLoseDays: number;
  strategyAWinsStrategyBLoses: number;
  strategyBWinsStrategyALoses: number;
  correlationCoefficient: number;
  hedgeEffectiveness: number;
  combinedVolatility: number;
  portfolioSharpeRatio: number;
}

interface DeltaNeutralResult {
  strategyA: StrategyResult;
  strategyB: StrategyResult;
  correlation: StrategyCorrelation;
  portfolioMetrics: {
    combinedWinRate: number;
    combinedTotalProfit: number;
    combinedAverageDailyProfit: number;
    maxCombinedDrawdown: number;
    portfolioVolatility: number;
    portfolioSharpeRatio: number;
    riskReduction: number;
    diversificationBenefit: number;
  };
  recommendation: {
    overallRecommendation: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
    confidence: number;
    advice: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

const AVAILABLE_TOKENS = [
  'ETHUSDT', 'BTCUSDT', 'APTUSDT', 'INJUSDT', 'CRVUSDT', 'XRPUSDT', 
  'CAKEUSDT', 'DYDXUSDT', 'SUIUSDT', 'XLMUSDT', 'PEPEUSDT', 'OPUSDT',
  'GMXUSDT', 'DOTUSDT', 'ARBUSDT', 'LDOUSDT', 'LINKUSDT'
];

const TIME_PERIODS = [
  { value: 30, label: '30 días' },
  { value: 60, label: '60 días' },
  { value: 100, label: '100 días' },
  { value: 200, label: '200 días' }
];

const DeltaNeutralAnalyzer: React.FC = () => {
  const [strategyA, setStrategyA] = useState({ longToken: 'ETHUSDT', shortToken: 'APTUSDT' });
  const [strategyB, setStrategyB] = useState({ longToken: 'ETHUSDT', shortToken: 'CAKEUSDT' });
  const [timePeriod, setTimePeriod] = useState(100);
  const [result, setResult] = useState<DeltaNeutralResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const request: DeltaNeutralRequest = {
        strategyA,
        strategyB,
        timePeriod
      };
      
      const response = await fetch('http://localhost:3001/api/delta-neutral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const analysisResult = await response.json();
      setResult(analysisResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al realizar el análisis. Inténtalo de nuevo.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'EXCELLENT': return '#00ff00';
      case 'GOOD': return '#90ee90';
      case 'MODERATE': return '#ffa500';
      case 'POOR': return '#ff6b6b';
      default: return '#666';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return '#00ff00';
      case 'MEDIUM': return '#ffa500';
      case 'HIGH': return '#ff6b6b';
      default: return '#666';
    }
  };

  return (
    <div className="delta-neutral-container">
      <h2>🔄 Análisis Delta Neutral</h2>
      <p>Compara dos estrategias Long/Short para crear un portafolio diversificado</p>

      <div className="strategies-form">
        <div className="strategy-section">
          <h3>📊 Estrategia A</h3>
          <div className="strategy-inputs">
            <div className="form-group">
              <label>Token Long:</label>
              <select 
                value={strategyA.longToken} 
                onChange={(e) => setStrategyA({...strategyA, longToken: e.target.value})}
                disabled={loading}
              >
                {AVAILABLE_TOKENS.map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Token Short:</label>
              <select 
                value={strategyA.shortToken} 
                onChange={(e) => setStrategyA({...strategyA, shortToken: e.target.value})}
                disabled={loading}
              >
                {AVAILABLE_TOKENS.filter(token => token !== strategyA.longToken).map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="strategy-section">
          <h3>📊 Estrategia B</h3>
          <div className="strategy-inputs">
            <div className="form-group">
              <label>Token Long:</label>
              <select 
                value={strategyB.longToken} 
                onChange={(e) => setStrategyB({...strategyB, longToken: e.target.value})}
                disabled={loading}
              >
                {AVAILABLE_TOKENS.map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Token Short:</label>
              <select 
                value={strategyB.shortToken} 
                onChange={(e) => setStrategyB({...strategyB, shortToken: e.target.value})}
                disabled={loading}
              >
                {AVAILABLE_TOKENS.filter(token => token !== strategyB.longToken).map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Período de Tiempo:</label>
          <select 
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
          disabled={loading || 
            strategyA.longToken === strategyA.shortToken || 
            strategyB.longToken === strategyB.shortToken
          }
        >
          {loading ? '🔄 Analizando...' : '🔄 Analizar Delta Neutral'}
        </button>

        {(strategyA.longToken === strategyA.shortToken || strategyB.longToken === strategyB.shortToken) && (
          <p className="error-message">⚠️ Los tokens Long y Short deben ser diferentes en ambas estrategias</p>
        )}
      </div>

      {error && (
        <div className="error-container">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="delta-neutral-results">
          <h2>📈 Resultados del Análisis Delta Neutral</h2>
          
          {/* Recomendación general */}
          <div className="recommendation-card">
            <h3 style={{ color: getRecommendationColor(result.recommendation.overallRecommendation) }}>
              {result.recommendation.overallRecommendation === 'EXCELLENT' && '🔥 EXCELENTE'}
              {result.recommendation.overallRecommendation === 'GOOD' && '⚡ BUENA'}
              {result.recommendation.overallRecommendation === 'MODERATE' && '📊 MODERADA'}
              {result.recommendation.overallRecommendation === 'POOR' && '❌ POBRE'}
            </h3>
            <p className="confidence">Confianza: {result.recommendation.confidence}%</p>
            <p className="risk-level" style={{ color: getRiskColor(result.recommendation.riskLevel) }}>
              Riesgo: {result.recommendation.riskLevel}
            </p>
            <p className="strategy-advice">{result.recommendation.advice}</p>
          </div>

          {/* Métricas de correlación */}
          <div className="correlation-metrics">
            <h3>🔗 Correlación entre Estrategias</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">🎯</div>
                <div className="metric-value">{result.correlation.bothWinDays}</div>
                <div className="metric-label">Días Ambas Ganan</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">📉</div>
                <div className="metric-value">{result.correlation.bothLoseDays}</div>
                <div className="metric-label">Días Ambas Pierden</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">⚖️</div>
                <div className="metric-value">{result.correlation.hedgeEffectiveness.toFixed(1)}%</div>
                <div className="metric-label">Efectividad Cobertura</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">📊</div>
                <div className="metric-value">{result.correlation.correlationCoefficient.toFixed(3)}</div>
                <div className="metric-label">Correlación Estadística</div>
              </div>
            </div>
          </div>

          {/* Métricas del portafolio */}
          <div className="portfolio-metrics">
            <h3>📈 Métricas del Portafolio</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">🎯</div>
                <div className="metric-value">{result.portfolioMetrics.combinedWinRate.toFixed(1)}%</div>
                <div className="metric-label">Win Rate Combinado</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">💰</div>
                <div className="metric-value">{result.portfolioMetrics.combinedTotalProfit.toFixed(1)}%</div>
                <div className="metric-label">Ganancia Total</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">📉</div>
                <div className="metric-value">{result.portfolioMetrics.portfolioVolatility.toFixed(2)}%</div>
                <div className="metric-label">Volatilidad Portafolio</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🛡️</div>
                <div className="metric-value">{result.portfolioMetrics.riskReduction.toFixed(1)}%</div>
                <div className="metric-label">Reducción Riesgo</div>
              </div>
            </div>
          </div>

          {/* Detalles de cada estrategia */}
          <div className="strategies-details">
            <div className="strategy-detail">
              <h4>📊 {result.strategyA.pair}</h4>
              <p>Recomendación: <strong>{result.strategyA.recommendation}</strong></p>
              <p>Win Rate: <strong>{result.strategyA.stats.winRate.toFixed(1)}%</strong></p>
              <p>Ganancia Total: <strong>{result.strategyA.stats.totalProfit.toFixed(2)}%</strong></p>
            </div>
            <div className="strategy-detail">
              <h4>📊 {result.strategyB.pair}</h4>
              <p>Recomendación: <strong>{result.strategyB.recommendation}</strong></p>
              <p>Win Rate: <strong>{result.strategyB.stats.winRate.toFixed(1)}%</strong></p>
              <p>Ganancia Total: <strong>{result.strategyB.stats.totalProfit.toFixed(2)}%</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeltaNeutralAnalyzer;
