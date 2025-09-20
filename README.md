# 📊 Analizador de Correlaciones Inversas - Binance

Este script en TypeScript analiza correlaciones inversas entre pares de tokens de Binance para identificar oportunidades de trading con estrategias Long/Short.

## 🚀 Características

- **Análisis de correlaciones inversas**: Identifica pares donde un token sube cuando el otro baja
- **Métricas estadísticas avanzadas**: Correlación de Pearson, volatilidad, consistencia
- **Señales de trading**: Genera señales de entrada y salida basadas en patrones históricos
- **Reportes detallados**: Genera reportes en consola, JSON y CSV
- **Configuración flexible**: Fácil personalización de pares de tokens y parámetros

## 📋 Requisitos

- Node.js 16+ 
- npm o yarn

## 🛠️ Instalación

1. **Instalar dependencias**:
```bash
npm install
```

2. **Compilar TypeScript**:
```bash
npm run build
```

3. **Ejecutar el análisis**:
```bash
npm start
```

O para desarrollo:
```bash
npm run dev
```

## ⚙️ Configuración

Edita `src/config.ts` para personalizar:

### Pares de Tokens
```typescript
tokenPairs: [
  {
    tokenA: 'BTCUSDT',
    tokenB: 'ETHUSDT',
    description: 'Bitcoin vs Ethereum'
  },
  // Añade más pares...
]
```

### Parámetros de Análisis
```typescript
binanceApi: {
  baseUrl: 'https://api.binance.com/api/v3/klines',
  interval: '1d',        // Intervalo de tiempo
  limit: 200            // Días a analizar
},

analysis: {
  minDaysForAnalysis: 30,           // Mínimo días para análisis válido
  correlationThreshold: -0.3       // Umbral correlación inversa
}
```

## 📊 Métricas Analizadas

### Estadísticas Básicas
1. **Días de correlación inversa**: Cuando A sube más que B baja, o viceversa
2. **Días opuestos**: Cuando uno sube y el otro baja
3. **Días de outperformance**: Cuando un token supera al otro
4. **Diferencia promedio**: % de cambio promedio entre tokens

### Métricas Avanzadas
- **Coeficiente de correlación de Pearson**
- **Volatilidad individual y ratio**
- **Score de consistencia**
- **Días consecutivos de correlación inversa**
- **Métricas de momentum y reversión**
- **Análisis de volumen**
- **Señales de entrada/salida**
- **Métricas de riesgo (VaR, Sharpe ratio, Drawdown)**

## 📈 Interpretación de Resultados

### Recomendaciones
- 🔥 **STRONG_INVERSE**: Correlación inversa fuerte (>40% días, correlación < -0.3)
- ⚡ **MODERATE_INVERSE**: Correlación inversa moderada (25-40% días)
- 📊 **WEAK_INVERSE**: Correlación inversa débil (15-25% días)
- ❌ **NO_CORRELATION**: Sin correlación significativa (<15% días)

### Estrategias Sugeridas
- **Long A cuando B baja**: Si A tiende a subir cuando B baja
- **Short B cuando A sube**: Si B tiende a bajar cuando A sube
- **Posiciones contrarias**: En días de alta volatilidad

## 📁 Estructura del Proyecto

```
src/
├── config.ts              # Configuración de tokens y parámetros
├── types.ts               # Definiciones de tipos TypeScript
├── binanceService.ts      # Servicio para API de Binance
├── correlationAnalyzer.ts  # Analizador de correlaciones
├── advancedMetrics.ts     # Métricas avanzadas para trading
├── reportGenerator.ts     # Generador de reportes
└── index.ts              # Script principal

reports/                   # Reportes generados (JSON y CSV)
├── correlation-analysis-[timestamp].json
└── correlation-analysis-[timestamp].csv
```

## 🔧 Uso Programático

```typescript
import { BinanceCorrelationAnalyzer } from './src/index';

const analyzer = new BinanceCorrelationAnalyzer();
await analyzer.run();
```

## 📊 Ejemplo de Salida

```
📊 REPORTE DE ANÁLISIS DE CORRELACIONES INVERSAS - BINANCE
================================================================================

📋 RESUMEN EJECUTIVO
--------------------------------------------------
🔍 Total de pares analizados: 10
🔥 Correlaciones inversas fuertes: 2
⚡ Correlaciones inversas moderadas: 3
📊 Correlaciones inversas débiles: 3
❌ Sin correlación significativa: 2

🎯 MEJORES OPORTUNIDADES:
1. BTCUSDT/ETHUSDT - Confianza: 85.3%
2. BTCUSDT/SOLUSDT - Confianza: 78.2%

📈 RESULTADOS DETALLADOS POR PAR
--------------------------------------------------

1. BTCUSDT/ETHUSDT
   Recomendación: 🔥 STRONG_INVERSE
   Confianza: 85.3%
   📊 Estadísticas:
      • Días válidos: 198/200
      • Correlación inversa: 42.4%
      • Días opuestos: 38.9%
      • BTCUSDT supera: 52.0%
      • ETHUSDT supera: 48.0%
      • Diferencia promedio: 1.23%
      • Coeficiente correlación: -0.342
      • Volatilidad BTCUSDT: 3.45%
      • Volatilidad ETHUSDT: 4.12%
      • Máximo consecutivo inverso: 7 días
      • Consistencia: 78.5/100
   💡 Estrategia: 🔥 CORRELACIÓN INVERSA FUERTE: 42.4% de días con correlación inversa.
```

## ⚠️ Consideraciones Importantes

- **Datos históricos**: El análisis se basa en datos pasados, no garantiza resultados futuros
- **Gestión de riesgo**: Siempre implementar stop-loss y position sizing adecuado
- **Comisiones**: Considerar spreads y comisiones en las estrategias
- **Monitoreo**: Las correlaciones pueden cambiar con el tiempo
- **Diversificación**: No depender de una sola correlación

## 🐛 Solución de Problemas

### Error de conexión a Binance
- Verificar conexión a internet
- Comprobar que la API de Binance esté disponible
- Revisar límites de rate limiting

### Datos insuficientes
- Aumentar el `limit` en la configuración
- Verificar que los símbolos existan en Binance
- Comprobar que hay suficientes días de trading

### Errores de compilación
- Verificar que TypeScript esté instalado: `npm install -g typescript`
- Limpiar y reinstalar: `rm -rf node_modules package-lock.json && npm install`

## 📝 Licencia

ISC License - Ver archivo LICENSE para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para reportar bugs o solicitar features, abre un issue en GitHub.