# API Response Interfaces Documentation

This document describes the TypeScript interfaces for all API endpoint responses.

## POST /api/analyze

**Response Interface:**
```typescript
interface AnalyzeResponse {
  pair: string; // e.g., "LONG BTCUSDT/SHORT ETHUSDT"
  stats: {
    longToken: string;
    shortToken: string;
    totalDays: number;
    validDays: number;
    winningDays: number;
    losingDays: number;
    winRate: number; // percentage
    lossRate: number; // percentage
    totalProfit: number;
    totalProfitFromPrices: number;
    averageDailyProfit: number;
    averageDailyGain: number;
    averageDailyLoss: number;
    totalGain: number;
    totalLoss: number;
    maxSingleDayProfit: number;
    maxSingleDayLoss: number;
    maxConsecutiveWinningDays: number;
    maxConsecutiveLosingDays: number;
    profitVolatility: number;
    maxDrawdown: number;
    dailyProfits: number[];
    consecutiveWins: number;
    consecutiveLoss: number;
    consecutivePercentageWins: number;
    consecutivePercentageLoss: number;
    currentConsecutiveWins: number;
    currentConsecutiveLoss: number;
    currentConsecutivePercentageWins: number;
    currentConsecutivePercentageLoss: number;
    rsi: number;
    // NOTE: sharpeRatio, consistencyScore, and recommendation are REMOVED from response
  };
  marketCapAlignment: {
    level: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW' | 'UNKNOWN';
    score: number; // 0-100
    description: string;
    longTokenCategory: 'H' | 'M' | 'L' | 'SUPERL';
    shortTokenCategory: 'H' | 'M' | 'L' | 'SUPERL';
  };
}
```

**Error Response:**
```typescript
interface ErrorResponse {
  error: string;
  details?: string;
}
```

**Example Response:**
```json
{
  "pair": "LONG BTCUSDT/SHORT ETHUSDT",
  "stats": {
    "longToken": "BTCUSDT",
    "shortToken": "ETHUSDT",
    "totalDays": 100,
    "validDays": 95,
    "winningDays": 55,
    "losingDays": 40,
    "winRate": 57.89,
    "lossRate": 42.11,
    "totalProfit": 12.34,
    "totalProfitFromPrices": 12.34,
    "averageDailyProfit": 0.13,
    "averageDailyGain": 2.85,
    "averageDailyLoss": -1.92,
    "totalGain": 156.75,
    "totalLoss": -76.80,
    "maxSingleDayProfit": 5.23,
    "maxSingleDayLoss": -3.45,
    "maxConsecutiveWinningDays": 8,
    "maxConsecutiveLosingDays": 6,
    "profitVolatility": 1.23,
    "maxDrawdown": -8.45,
    "dailyProfits": [0.5, -0.3, 1.2, ...],
    "consecutiveWins": 3,
    "consecutiveLoss": 2,
    "consecutivePercentageWins": 45.5,
    "consecutivePercentageLoss": 30.2,
    "currentConsecutiveWins": 2,
    "currentConsecutiveLoss": 0,
    "currentConsecutivePercentageWins": 15.3,
    "currentConsecutivePercentageLoss": 0,
    "rsi": 58.5
  },
  "marketCapAlignment": {
    "level": "HIGH",
    "score": 100,
    "description": "Both tokens are high market cap, similar volatility expected",
    "longTokenCategory": "H",
    "shortTokenCategory": "H"
  }
}
```

---

## POST /api/delta-neutral

**Response Interface:**
```typescript
interface DeltaNeutralResponse {
  strategyA: {
    pair: string;
    stats: LongShortStats; // Same structure as /api/analyze stats
    recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    confidence: number;
  };
  strategyB: {
    pair: string;
    stats: LongShortStats;
    recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    confidence: number;
  };
  correlation: {
    correlationCoefficient: number;
    interpretation: string;
  };
  combinedAnalysis: {
    totalCombinedProfit: number;
    combinedWinRate: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}
```

---

## POST /api/liquidity-range

**Response Interface:**
```typescript
interface LiquidityRangeResponse {
  tokenA: string;
  tokenB: string;
  currentPriceA: number;
  currentPriceB: number;
  rangeA: {
    min: number;
    max: number;
  };
  rangeB: {
    min: number;
    max: number;
  };
  totalDays: number;
  daysInRange: number;
  daysOutOfRangeUp: number;
  daysOutOfRangeDown: number;
  timeInRangePercentage: number;
  averageVolatility: number;
  maxConsecutiveDaysOut: number;
  impermanentLossEstimation: {
    scenarioUp: {
      priceA: number;
      priceB: number;
      estimatedIL: number;
    };
    scenarioDown: {
      priceA: number;
      priceB: number;
      estimatedIL: number;
    };
    scenarioNeutral: {
      priceA: number;
      priceB: number;
      estimatedIL: number;
    };
  };
}
```

---

## GET /api/tokens

**Response Interface:**
```typescript
interface TokensResponse extends Array<TokenInfo> {}

interface TokenInfo {
  symbol: string; // e.g., "BTCUSDT"
  marketCapCategory: 'H' | 'M' | 'L' | 'SUPERL';
}
```

**Example Response:**
```json
[
  {
    "symbol": "BTCUSDT",
    "marketCapCategory": "H"
  },
  {
    "symbol": "ETHUSDT",
    "marketCapCategory": "H"
  },
  {
    "symbol": "LINKUSDT",
    "marketCapCategory": "M"
  }
]
```

---

## GET /api/long-short-history

**Response Interface:**
```typescript
interface LongShortHistoryResponse {
  success: boolean;
  symbol: string; // e.g., "BTCUSDT/ETHUSDT"
  longToken: string;
  shortToken: string;
  data: BinanceKline[]; // Array of kline arrays
  count: number;
}

type BinanceKline = [
  number,    // timestamp
  string,    // openRatio
  string,    // highRatio
  string,    // lowRatio
  string,    // closeRatio
  string,    // volumeRatio
  number,    // closeTimestamp
  string,    // quoteAssetVolume
  number,    // numberOfTrades
  string,    // takerBuyBaseAssetVolume
  string,    // takerBuyQuoteAssetVolume
  string     // ignore
];
```

**Example Response:**
```json
{
  "success": true,
  "symbol": "BTCUSDT/ETHUSDT",
  "longToken": "BTCUSDT",
  "shortToken": "ETHUSDT",
  "data": [
    [1704067200000, "0.05234567", "0.05245678", "0.05223456", "0.05234567", "1234567.89", 1704153599999, "1234567.89", 0, "617283.94", "617283.94", "0"],
    ...
  ],
  "count": 100
}
```

---

## GET /api/strategy-bundles

**Response Interface:**
```typescript
interface StrategyBundlesResponse {
  strategies: StrategyBundle[];
  totalAnalyzed: number;
  totalFiltered: number;
  returned: number;
  strategyType: 'BTC_ETH' | 'MAJOR';
  strategyInfo: {
    type: string;
    description: string;
    longTokens: string[];
    shortTokens: string[];
  };
  cacheInfo: {
    cached: boolean;
    generatedAt: string; // ISO 8601 date string
    cacheAge?: number; // milliseconds (if cached)
    cacheExpiresIn?: number; // milliseconds (if cached)
  };
}

interface StrategyBundle {
  pair: string; // e.g., "BTCUSDT/ETHUSDT"
  longToken: string;
  shortToken: string;
  metrics: {
    '30d'?: PeriodMetrics;
    '60d'?: PeriodMetrics;
    '100d'?: PeriodMetrics;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  apr: number;
  winRate100d: number;
  avgDailyProfit100d: number;
  totalProfit100d: number;
  // NOTE: overallScore, recommendation, confidence, tvl, sharpeRatio100d, consistencyScore100d are REMOVED
}

interface PeriodMetrics {
  winRate: number;
  totalProfit: number;
  totalProfitFromPrices: number;
  averageDailyProfit: number;
  validDays: number;
}
```

**Example Response:**
```json
{
  "strategies": [
    {
      "pair": "BTCUSDT/ETHUSDT",
      "longToken": "BTCUSDT",
      "shortToken": "ETHUSDT",
      "metrics": {
        "30d": {
          "winRate": 58.5,
          "totalProfit": 3.45,
          "totalProfitFromPrices": 3.45,
          "averageDailyProfit": 0.115,
          "validDays": 30
        },
        "60d": {
          "winRate": 56.2,
          "totalProfit": 7.89,
          "totalProfitFromPrices": 7.89,
          "averageDailyProfit": 0.131,
          "validDays": 60
        },
        "100d": {
          "winRate": 55.8,
          "totalProfit": 12.34,
          "totalProfitFromPrices": 12.34,
          "averageDailyProfit": 0.123,
          "validDays": 100
        }
      },
      "riskLevel": "MEDIUM",
      "apr": 45.2,
      "winRate100d": 55.8,
      "avgDailyProfit100d": 0.123,
      "totalProfit100d": 12.34
    }
  ],
  "totalAnalyzed": 150,
  "totalFiltered": 45,
  "returned": 15,
  "strategyType": "MAJOR",
  "strategyInfo": {
    "type": "MAJOR",
    "description": "Analysis with all major tokens",
    "longTokens": ["BTCUSDT", "ETHUSDT", "LINKUSDT", "SOLUSDT", "BNBUSDT"],
    "shortTokens": ["BTCUSDT", "ETHUSDT", "LINKUSDT", "SOLUSDT", "DOTUSDT"]
  },
  "cacheInfo": {
    "cached": false,
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## GET /api/cache-stats

**Response Interface:**
```typescript
interface CacheStatsResponse {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  oldestEntry: {
    key: string;
    timestamp: number;
  } | null;
  newestEntry: {
    key: string;
    timestamp: number;
  } | null;
  ttl: number; // milliseconds
  ttlHours: number;
}
```

**Example Response:**
```json
{
  "totalEntries": 10,
  "validEntries": 8,
  "expiredEntries": 2,
  "oldestEntry": {
    "key": "strategy-bundles-15-ALL-ALL-APR-MAJOR",
    "timestamp": 1704067200000
  },
  "newestEntry": {
    "key": "strategy-bundles-15-ALL-ALL-APR-BTC_ETH",
    "timestamp": 1704153600000
  },
  "ttl": 3600000,
  "ttlHours": 1
}
```

---

## GET /api/contract-senders

**Response Interface:**
```typescript
interface ContractSendersResponse {
  success: boolean;
  contractAddress: string;
  network: string; // "Arbitrum"
  fromBlock: number;
  toBlock: number;
  maxTxs: number | 'unlimited';
  totalTxsProcessed: number;
  totalUniqueSenders: number;
  senders: string[]; // Array of Ethereum addresses
  pagesProcessed: number;
}
```

**Example Response:**
```json
{
  "success": true,
  "contractAddress": "0xF201797e767872541a8149A4906FF73615189646",
  "network": "Arbitrum",
  "fromBlock": 0,
  "toBlock": 99999999,
  "maxTxs": 1000,
  "totalTxsProcessed": 1000,
  "totalUniqueSenders": 450,
  "senders": [
    "0x1234567890123456789012345678901234567890",
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    ...
  ],
  "pagesProcessed": 10
}
```

---

## Error Responses

All endpoints return errors in the following format:

```typescript
interface ErrorResponse {
  error: string;
  details?: string;
  stack?: string; // Only in non-production environments
}
```

**HTTP Status Codes:**
- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Server error

**Example Error Responses:**

```json
{
  "error": "longToken and shortToken are required"
}
```

```json
{
  "error": "Error fetching data from Binance",
  "details": "Network error: timeout"
}
```

---

## Removed Fields

The following fields have been **REMOVED** from responses and should not be expected:

### POST /api/analyze
- `stats.sharpeRatio`
- `stats.consistencyScore`
- `stats.recommendation`
- `recommendation` (top-level)
- `confidence` (top-level)

### GET /api/strategy-bundles
- `overallScore`
- `recommendation`
- `confidence`
- `tvl`
- `sharpeRatio100d`
- `consistencyScore100d`

---

## TypeScript Definitions

For use in TypeScript projects, you can copy these interfaces:

```typescript
// POST /api/analyze
interface AnalyzeResponse {
  pair: string;
  stats: Omit<LongShortStats, 'sharpeRatio' | 'consistencyScore' | 'recommendation'>;
  marketCapAlignment: {
    level: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW' | 'UNKNOWN';
    score: number;
    description: string;
    longTokenCategory: 'H' | 'M' | 'L' | 'SUPERL';
    shortTokenCategory: 'H' | 'M' | 'L' | 'SUPERL';
  };
}

interface LongShortStats {
  longToken: string;
  shortToken: string;
  totalDays: number;
  validDays: number;
  winningDays: number;
  losingDays: number;
  winRate: number;
  lossRate: number;
  totalProfit: number;
  totalProfitFromPrices: number;
  averageDailyProfit: number;
  averageDailyGain: number;
  averageDailyLoss: number;
  totalGain: number;
  totalLoss: number;
  maxSingleDayProfit: number;
  maxSingleDayLoss: number;
  maxConsecutiveWinningDays: number;
  maxConsecutiveLosingDays: number;
  profitVolatility: number;
  maxDrawdown: number;
  dailyProfits: number[];
  consecutiveWins: number;
  consecutiveLoss: number;
  consecutivePercentageWins: number;
  consecutivePercentageLoss: number;
  currentConsecutiveWins: number;
  currentConsecutiveLoss: number;
  currentConsecutivePercentageWins: number;
  currentConsecutivePercentageLoss: number;
  rsi: number;
}

// GET /api/strategy-bundles
interface StrategyBundlesResponse {
  strategies: StrategyBundle[];
  totalAnalyzed: number;
  totalFiltered: number;
  returned: number;
  strategyType: 'BTC_ETH' | 'MAJOR';
  strategyInfo: {
    type: string;
    description: string;
    longTokens: string[];
    shortTokens: string[];
  };
  cacheInfo: {
    cached: boolean;
    generatedAt: string;
    cacheAge?: number;
    cacheExpiresIn?: number;
  };
}

interface StrategyBundle {
  pair: string;
  longToken: string;
  shortToken: string;
  metrics: {
    '30d'?: PeriodMetrics;
    '60d'?: PeriodMetrics;
    '100d'?: PeriodMetrics;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  apr: number;
  winRate100d: number;
  avgDailyProfit100d: number;
  totalProfit100d: number;
}

interface PeriodMetrics {
  winRate: number;
  totalProfit: number;
  totalProfitFromPrices: number;
  averageDailyProfit: number;
  validDays: number;
}

// Common error response
interface ErrorResponse {
  error: string;
  details?: string;
  stack?: string;
}
```
