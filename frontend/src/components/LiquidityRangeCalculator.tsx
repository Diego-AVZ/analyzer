import React, { useState } from 'react';
import { apiService, LiquidityRangeRequest, LiquidityRangeResponse } from '../services/api';

// Tokens disponibles para la calculadora
const AVAILABLE_TOKENS = [
  'BTCUSDT', 'ETHUSDT', 'LINKUSDT', 'SOLUSDT', 'DOTUSDT', 'AVAXUSDT',
  'BNBUSDT', 'DOGEUSDT', 'PEPEUSDT', 'WIFUSDT', 'PENDLEUSDT', 'ARBUSDT',
  'OPUSDT', 'APEUSDT', 'GMXUSDT', 'AAVEUSDT', 'UNIUSDT', 'ADAUSDT',
  'TAOUSDT', 'ATOMUSDT', 'LDOUSDT', 'NEARUSDT', 'TIAUSDT', 'CAKEUSDT',
  'ZROUSDT', 'TRUMPUSDT'
];

// Períodos de tiempo disponibles
const TIME_PERIODS = [
  { value: 30, label: '30 días' },
  { value: 60, label: '60 días' },
  { value: 100, label: '100 días' },
  { value: 200, label: '200 días' }
];

const LiquidityRangeCalculator: React.FC = () => {
  const [tokenA, setTokenA] = useState('ETHUSDT');
  const [tokenB, setTokenB] = useState('LINKUSDT');
  const [rangeUpPercent, setRangeUpPercent] = useState(5);
  const [rangeDownPercent, setRangeDownPercent] = useState(5);
  const [timePeriod, setTimePeriod] = useState(100);
  const [analysisResult, setAnalysisResult] = useState<LiquidityRangeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para realizar el análisis
  const performAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const request: LiquidityRangeRequest = {
        tokenA,
        tokenB,
        rangeUpPercent,
        rangeDownPercent,
        timePeriod
      };
      
      const result = await apiService.analyzeLiquidityRange(request);
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
      case 'EXCELLENT': return '#00ff00';
      case 'GOOD': return '#90ee90';
      case 'MODERATE': return '#ffa500';
      case 'RISKY': return '#ff6b6b';
      default: return '#666';
    }
  };

  // Función para obtener el emoji de la recomendación
  const getRecommendationEmoji = (recommendation: string) => {
    switch (recommendation) {
      case 'EXCELLENT': return '🔥';
      case 'GOOD': return '✅';
      case 'MODERATE': return '⚠️';
      case 'RISKY': return '❌';
      default: return '📊';
    }
  };

  return (
    <div className="liquidity-calculator">
      <div className="calculator-form">
        <h2>💧 Calculadora de Rangos de Liquidez</h2>
        <p className="form-description">
          Analiza rangos de precios históricos para optimizar tu provisión de liquidez en Uniswap
        </p>
        
        <div className="form-group">
          <label htmlFor="tokenA">Token A:</label>
          <select 
            id="tokenA"
            value={tokenA} 
            onChange={(e) => setTokenA(e.target.value)}
            disabled={loading}
          >
            {AVAILABLE_TOKENS.map(token => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="tokenB">Token B:</label>
          <select 
            id="tokenB"
            value={tokenB} 
            onChange={(e) => setTokenB(e.target.value)}
            disabled={loading}
          >
            {AVAILABLE_TOKENS.filter(token => token !== tokenA).map(token => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>

        <div className="range-inputs">
          <div className="form-group">
            <label htmlFor="rangeUp">% Arriba del precio actual:</label>
            <input 
              id="rangeUp"
              type="number" 
              value={rangeUpPercent} 
              onChange={(e) => setRangeUpPercent(Number(e.target.value))}
              min="0.1"
              max="50"
              step="0.1"
              disabled={loading}
            />
            <span className="input-suffix">%</span>
          </div>

          <div className="form-group">
            <label htmlFor="rangeDown">% Abajo del precio actual:</label>
            <input 
              id="rangeDown"
              type="number" 
              value={rangeDownPercent} 
              onChange={(e) => setRangeDownPercent(Number(e.target.value))}
              min="0.1"
              max="50"
              step="0.1"
              disabled={loading}
            />
            <span className="input-suffix">%</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="timePeriod">Período de análisis:</label>
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
          disabled={loading || tokenA === tokenB}
        >
          {loading ? '🔄 Analizando...' : '💧 Analizar Rango de Liquidez'}
        </button>

        {tokenA === tokenB && (
          <p className="error-message">⚠️ Los tokens deben ser diferentes</p>
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
          <h2>📊 Resultados del Análisis</h2>
          
          {/* Recomendación principal */}
          <div className="recommendation-card">
            <h3 style={{ color: getRecommendationColor(analysisResult.recommendation) }}>
              {getRecommendationEmoji(analysisResult.recommendation)} {analysisResult.recommendation}
            </h3>
            <p className="confidence">Confianza: {analysisResult.confidence}%</p>
            <p className="strategy-advice">{analysisResult.advice}</p>
          </div>

          {/* Precios actuales y rangos */}
          <div className="price-info">
            <h3>💰 Precios Actuales y Rango de Liquidez</h3>
            <div className="price-grid">
              <div className="price-card">
                <h4>{tokenA}</h4>
                <div className="current-price">${analysisResult.currentPriceA.toFixed(2)}</div>
              </div>
              
              <div className="price-card">
                <h4>{tokenB}</h4>
                <div className="current-price">${analysisResult.currentPriceB.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="ratio-info" style={{ marginTop: '20px' }}>
              <div className="price-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h4>Ratio de Precios ({tokenA}/{tokenB})</h4>
                <div className="current-price" style={{ fontSize: '1.5em', marginBottom: '10px' }}>
                  {analysisResult.currentPriceRatio.toFixed(6)}
                </div>
                <div className="price-range">
                  <span className="range-label">Rango de liquidez Uniswap V3:</span>
                  <span className="range-values">
                    {analysisResult.priceRatioRange.min.toFixed(6)} - {analysisResult.priceRatioRange.max.toFixed(6)}
                  </span>
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                  Ancho del rango: {((analysisResult.priceRatioRange.max - analysisResult.priceRatioRange.min) / analysisResult.currentPriceRatio * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Análisis histórico */}
          <div className="historical-analysis">
            <h3>📈 Análisis Histórico</h3>
            <div className="analysis-grid">
              <div className="analysis-card">
                <div className="metric-icon">⏱️</div>
                <div className="metric-value">{analysisResult.historicalAnalysis.timeInRangePercentage.toFixed(1)}%</div>
                <div className="metric-label">Tiempo en Rango</div>
                <div className="metric-subtitle">
                  {analysisResult.historicalAnalysis.daysInRange} de {analysisResult.historicalAnalysis.totalDays} días
                </div>
              </div>

              <div className="analysis-card">
                <div className="metric-icon">📈</div>
                <div className="metric-value">{analysisResult.historicalAnalysis.daysOutOfRangeUp}</div>
                <div className="metric-label">Salidas por Arriba</div>
                <div className="metric-subtitle">precio superó el rango superior</div>
              </div>

              <div className="analysis-card">
                <div className="metric-icon">📉</div>
                <div className="metric-value">{analysisResult.historicalAnalysis.daysOutOfRangeDown}</div>
                <div className="metric-label">Salidas por Abajo</div>
                <div className="metric-subtitle">precio cayó del rango inferior</div>
              </div>

              <div className="analysis-card">
                <div className="metric-icon">📊</div>
                <div className="metric-value">{analysisResult.historicalAnalysis.averageVolatility.toFixed(2)}%</div>
                <div className="metric-label">Volatilidad Promedio</div>
                <div className="metric-subtitle">desviación diaria típica</div>
              </div>

              <div className="analysis-card">
                <div className="metric-icon">🔗</div>
                <div className="metric-value">{analysisResult.historicalAnalysis.maxConsecutiveDaysOut}</div>
                <div className="metric-label">Máx. Días Consecutivos Fuera</div>
                <div className="metric-subtitle">mayor racha fuera del rango</div>
              </div>
            </div>
          </div>

          {/* Estimación de Impermanent Loss */}
          <div className="impermanent-loss">
            <h3>💸 Estimación de Impermanent Loss</h3>
            <div className="il-scenarios">
              <div className="scenario-card">
                <h4>📈 Escenario: Precio Sube</h4>
                <div className="scenario-details">
                  <p><strong>Ratio de precio:</strong> {analysisResult.impermanentLossEstimation.scenarioUp.priceRatio.toFixed(2)}x</p>
                  <p><strong>Impermanent Loss:</strong> {analysisResult.impermanentLossEstimation.scenarioUp.impermanentLoss.toFixed(2)}%</p>
                  <p><strong>Valor final (inversión $1000):</strong> ${analysisResult.impermanentLossEstimation.scenarioUp.finalValue.toFixed(2)}</p>
                </div>
              </div>

              <div className="scenario-card">
                <h4>📉 Escenario: Precio Baja</h4>
                <div className="scenario-details">
                  <p><strong>Ratio de precio:</strong> {analysisResult.impermanentLossEstimation.scenarioDown.priceRatio.toFixed(2)}x</p>
                  <p><strong>Impermanent Loss:</strong> {analysisResult.impermanentLossEstimation.scenarioDown.impermanentLoss.toFixed(2)}%</p>
                  <p><strong>Valor final (inversión $1000):</strong> ${analysisResult.impermanentLossEstimation.scenarioDown.finalValue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="fees-analysis">
              <h4>💡 Análisis de Fees</h4>
              <div className="fees-card">
                <p><strong>Fees necesarios para cubrir IL promedio:</strong></p>
                <div className="fees-value">{analysisResult.impermanentLossEstimation.feesNeededToCoverIL.toFixed(2)}%</div>
                <p className="fees-explanation">
                  Necesitas generar al menos {analysisResult.impermanentLossEstimation.feesNeededToCoverIL.toFixed(2)}% en fees 
                  para compensar las pérdidas por impermanent loss en este rango.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiquidityRangeCalculator;
