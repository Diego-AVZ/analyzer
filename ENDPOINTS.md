# Endpoints del Backend

**URL Base:** `http://localhost:3001`

## Endpoints Disponibles

### 1. POST /api/analyze
Analiza una estrategia long/short entre dos tokens.

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "longToken": "BTCUSDT",
    "shortToken": "ETHUSDT",
    "timePeriod": 100
  }'
```

**Parámetros:**
- `longToken` (requerido): Token para posición long
- `shortToken` (requerido): Token para posición short
- `timePeriod` (opcional): Período de tiempo en días (default: 100)

---

### 2. POST /api/delta-neutral
Analiza una estrategia delta neutral con dos pares de tokens.

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3001/api/delta-neutral \
  -H "Content-Type: application/json" \
  -d '{
    "strategyA": {
      "longToken": "BTCUSDT",
      "shortToken": "ETHUSDT"
    },
    "strategyB": {
      "longToken": "LINKUSDT",
      "shortToken": "SOLUSDT"
    },
    "timePeriod": 100
  }'
```

**Parámetros:**
- `strategyA.longToken` (requerido): Token long de la estrategia A
- `strategyA.shortToken` (requerido): Token short de la estrategia A
- `strategyB.longToken` (requerido): Token long de la estrategia B
- `strategyB.shortToken` (requerido): Token short de la estrategia B
- `timePeriod` (opcional): Período de tiempo en días (default: 100)

---

### 3. POST /api/liquidity-range
Analiza el rango de liquidez entre dos tokens.

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3001/api/liquidity-range \
  -H "Content-Type: application/json" \
  -d '{
    "tokenA": "BTCUSDT",
    "tokenB": "ETHUSDT",
    "rangeUpPercent": 5,
    "rangeDownPercent": 5,
    "timePeriod": 100
  }'
```

**Parámetros:**
- `tokenA` (requerido): Primer token
- `tokenB` (requerido): Segundo token
- `rangeUpPercent` (requerido): Porcentaje de rango hacia arriba
- `rangeDownPercent` (requerido): Porcentaje de rango hacia abajo
- `timePeriod` (opcional): Período de tiempo en días (default: 100)

---

### 4. GET /api/tokens
Obtiene la lista de tokens disponibles.

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3001/api/tokens
```

**Parámetros:** Ninguno

---

### 5. GET /api/long-short-history
Obtiene el historial de ratios entre dos tokens.

**Ejemplo con curl:**
```bash
curl -X GET "http://localhost:3001/api/long-short-history?longToken=BTCUSDT&shortToken=ETHUSDT&timePeriod=100"
```

**Parámetros (query string):**
- `longToken` (requerido): Token para posición long
- `shortToken` (requerido): Token para posición short
- `timePeriod` (opcional): Período de tiempo en días (default: 100)

---

### 6. GET /api/strategy-bundles
Obtiene bundles de estrategias analizadas.

**Ejemplo con curl:**
```bash
curl -X GET "http://localhost:3001/api/strategy-bundles?limit=15&riskLevel=ALL&timePeriod=ALL&sortBy=APR&strategyType=MAJOR"
```

**Parámetros (query string):**
- `limit` (opcional): Número de resultados (default: 15)
- `riskLevel` (opcional): Nivel de riesgo - 'LOW', 'MEDIUM', 'HIGH', 'ALL' (default: 'ALL')
- `timePeriod` (opcional): Período de tiempo - '30d', '60d', '100d', 'ALL' (default: 'ALL')
- `sortBy` (opcional): Ordenar por - 'APR', 'WIN_RATE', 'SHARPE_RATIO', 'CONSISTENCY' (default: 'APR')
- `strategyType` (opcional): Tipo de estrategia - 'BTC_ETH', 'MAJOR' (default: 'MAJOR')

---

### 7. GET /api/cache-stats
Obtiene estadísticas de la caché de estrategias.

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3001/api/cache-stats
```

**Parámetros:** Ninguno

---

### 8. GET /api/contract-senders
Obtiene los msg.senders únicos de un contrato en Arbitrum.

**Ejemplo con curl:**
```bash
curl -X GET "http://localhost:3001/api/contract-senders?fromBlock=0&toBlock=99999999&maxTxs=1000"
```

**Parámetros (query string):**
- `fromBlock` (opcional): Bloque inicial (default: 0)
- `toBlock` (opcional): Bloque final (default: 99999999)
- `maxTxs` (opcional): Límite de transacciones a procesar (default: sin límite)

---

## Notas

- Todos los endpoints devuelven JSON
- Los errores se devuelven con el código de estado HTTP apropiado
- El servidor corre en el puerto 3001 por defecto
- Los tokens deben tener el formato correcto (ej: BTCUSDT, ETHUSDT)
