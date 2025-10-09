import React, { useState, useEffect, useCallback } from 'react';
import { apiService, StrategyBundle, StrategyBundlesRequest } from '../services/api';
import './StrategyBundles.css';

const StrategyBundles: React.FC = () => {
  const [strategies, setStrategies] = useState<StrategyBundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  
  // Filtros y configuración
  const [filters, setFilters] = useState<StrategyBundlesRequest>({
    limit: 15,
    riskLevel: 'ALL',
    timePeriod: 'ALL',
    sortBy: 'APR'
  });

  // Cargar estrategias (memoizada para evitar warnings de dependencias)
  const loadStrategies = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getStrategyBundles(filters);
      setStrategies(response.strategies);
      setCacheInfo(response.cacheInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar las estrategias.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Cargar al montar el componente y cuando cambien los filtros
  useEffect(() => {
    loadStrategies();
  }, [loadStrategies]);

  // Función para obtener el color del nivel de riesgo
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return '#00ff00';
      case 'MEDIUM': return '#ffa500';
      case 'HIGH': return '#ff6b6b';
      default: return '#666';
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

  // Función para formatear el tiempo de cache
  const formatCacheTime = (cacheAge?: number) => {
    if (!cacheAge) return '';
    const minutes = Math.floor(cacheAge / 60000);
    const seconds = Math.floor((cacheAge % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Función para formatear TVL
  const formatTVL = (tvl: number) => {
    if (tvl >= 1) {
      return `$${tvl.toFixed(1)}M`;
    } else {
      return `$${(tvl * 1000).toFixed(0)}K`;
    }
  };

  return (
    <div className="strategy-bundles">
      <div className="strategy-bundles-header">
        <h1>Strategy Bundles</h1>
        <p>Descubre estrategias curadas con rendimiento probado y gestión de riesgo a nivel institucional.</p>
        
        {/* Indicador de cache */}
        {cacheInfo && (
          <div className="cache-indicator">
            {cacheInfo.cached ? (
              <span className="cache-hit">
                📦 Datos desde cache ({formatCacheTime(cacheInfo.cacheAge)})
              </span>
            ) : (
              <span className="cache-miss">
                🔄 Datos actualizados ({new Date(cacheInfo.generatedAt).toLocaleTimeString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label>RIESGO:</label>
          <div className="filter-buttons">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map(risk => (
              <button
                key={risk}
                className={`filter-btn ${filters.riskLevel === risk ? 'active' : ''}`}
                onClick={() => setFilters({...filters, riskLevel: risk as any})}
              >
                {risk === 'ALL' ? 'Todos' : `${risk} Risk`}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>PERÍODO:</label>
          <div className="filter-buttons">
            {['ALL', '30', '60', '100'].map(period => (
              <button
                key={period}
                className={`filter-btn ${filters.timePeriod === period ? 'active' : ''}`}
                onClick={() => setFilters({...filters, timePeriod: period as any})}
              >
                {period === 'ALL' ? 'Todos' : `${period}D`}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <button
            className="sort-btn"
            onClick={() => setFilters({...filters, sortBy: 'APR'})}
          >
            ↕️ Ordenar por APR
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Analizando estrategias...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-section">
          <p>❌ {error}</p>
          <button onClick={loadStrategies} className="retry-btn">
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de estrategias */}
      {!loading && !error && (
        <div className="strategies-grid">
          {strategies.map((strategy, index) => (
            <div key={strategy.pair} className="strategy-card">
              <div className="strategy-header">
                <h3>{strategy.pair}</h3>
                <span 
                  className="risk-badge"
                  style={{ backgroundColor: getRiskColor(strategy.riskLevel) }}
                >
                  {strategy.riskLevel} RISK
                </span>
              </div>
              
              <div className="strategy-description">
                Long {strategy.longToken} • Short {strategy.shortToken}
              </div>

              {/* Gráfico simulado */}
              <div className="strategy-chart">
                <div 
                  className="chart-line"
                  style={{ 
                    backgroundColor: getRecommendationColor(strategy.recommendation),
                    height: '20px',
                    borderRadius: '10px',
                    margin: '10px 0'
                  }}
                ></div>
              </div>

              <div className="strategy-metrics">
                <div className="metric">
                  <div className="metric-label">
                    APR (100D) <span className="help-icon">?</span>
                  </div>
                  <div className="metric-value">{strategy.apr.toFixed(1)}%</div>
                </div>
                
                <div className="metric">
                  <div className="metric-label">
                    % Días Ganadores <span className="help-icon">?</span>
                  </div>
                  <div className="metric-value">{strategy.winRate100d.toFixed(1)}%</div>
                </div>
                
                <div className="metric">
                  <div className="metric-label">
                    Ganancia Media Diaria <span className="help-icon">?</span>
                  </div>
                  <div className="metric-value">{strategy.avgDailyProfit100d.toFixed(2)}%</div>
                </div>
                
                <div className="metric">
                  <div className="metric-label">
                    TVL <span className="help-icon">?</span>
                  </div>
                  <div className="metric-value">{formatTVL(strategy.tvl)}</div>
                </div>
              </div>

              <button className="invest-btn">
                Invest Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Información adicional */}
      {!loading && !error && cacheInfo && (
        <div className="info-section">
          <p>
            Mostrando {strategies.length} de {cacheInfo.totalFiltered} estrategias 
            (analizadas {cacheInfo.totalAnalyzed} pares)
          </p>
        </div>
      )}

    </div>
  );
};

export default StrategyBundles;
