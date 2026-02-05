import { ProcessedKline, CorrelationStats } from './types';

export class LongShortAnalyzer {
  
  analyzeLongShortStrategy(
    longToken: string,
    shortToken: string,
    longKlines: ProcessedKline[],
    shortKlines: ProcessedKline[],
    fundingFees?: { fundingFeeLong?: string; fundingFeeShort?: string }
  ): LongShortStats {
    const totalDays = longKlines.length;
    let validDays = 0;
    let winningDays = 0;
    let losingDays = 0;
    
    let totalProfit = 0;
    let totalGain = 0;
    let totalLoss = 0;
    let maxSingleDayProfit = 0;
    let maxSingleDayLoss = 0;
    
    let consecutiveWinningDays = 0;
    let maxConsecutiveWinningDays = 0;
    let consecutiveLosingDays = 0;
    let maxConsecutiveLosingDays = 0;
    
    const dailyProfits: number[] = [];
    const dailyReturns: number[] = [];

    for (let i = 0; i < totalDays; i++) {
      const longKline = longKlines[i];
      const shortKline = shortKlines[i];
      
      if (longKline.timestamp !== shortKline.timestamp) {
        continue;
      }

      validDays++;
      
      const longChange = longKline.dailyChange;
      const shortChange = shortKline.dailyChange;
      
      const dailyProfit = longChange - shortChange;
      
      dailyProfits.push(dailyProfit);
      dailyReturns.push(dailyProfit);
      totalProfit += dailyProfit;
      
      if (dailyProfit > 0) {
        totalGain += dailyProfit;
      } else if (dailyProfit < 0) {
        totalLoss += dailyProfit;
      }
      
      if (i === 0) {
        maxSingleDayProfit = dailyProfit;
        maxSingleDayLoss = dailyProfit;
      } else {
        maxSingleDayProfit = Math.max(maxSingleDayProfit, dailyProfit);
        maxSingleDayLoss = Math.min(maxSingleDayLoss, dailyProfit);
      }
      
      if (dailyProfit > 0) {
        winningDays++;
        consecutiveWinningDays++;
        consecutiveLosingDays = 0;
        maxConsecutiveWinningDays = Math.max(maxConsecutiveWinningDays, consecutiveWinningDays);
      } else if (dailyProfit < 0) {
        losingDays++;
        consecutiveLosingDays++;
        consecutiveWinningDays = 0;
        maxConsecutiveLosingDays = Math.max(maxConsecutiveLosingDays, consecutiveLosingDays);
      } else {
        consecutiveWinningDays = 0;
        consecutiveLosingDays = 0;
      }
    }

    let totalProfitFromPrices = 0;
    if (longKlines.length > 0 && shortKlines.length > 0) {
      const firstLongKline = longKlines[0];
      const lastLongKline = longKlines[longKlines.length - 1];
      const firstShortKline = shortKlines[0];
      const lastShortKline = shortKlines[shortKlines.length - 1];
      
      if (firstLongKline.close > 0 && firstShortKline.close > 0) {
        const longChange = ((lastLongKline.close - firstLongKline.close) / firstLongKline.close) * 100;
        const shortChange = ((lastShortKline.close - firstShortKline.close) / firstShortKline.close) * 100;
        totalProfitFromPrices = longChange - shortChange;
      }
    }

    const averageDailyProfit = validDays > 0 ? totalProfitFromPrices / validDays : 0;
    const averageDailyGain = winningDays > 0 ? totalGain / winningDays : 0;
    const averageDailyLoss = losingDays > 0 ? totalLoss / losingDays : 0;
    const winRate = validDays > 0 ? (winningDays / validDays) * 100 : 0;
    const lossRate = validDays > 0 ? (losingDays / validDays) * 100 : 0;
    
    const profitVolatility = this.calculateVolatility(dailyProfits);
    const sharpeRatio = profitVolatility > 0 ? averageDailyProfit / profitVolatility : 0;
    const maxDrawdown = this.calculateMaxDrawdown(dailyReturns);
    const consistencyScore = this.calculateConsistencyScore(dailyProfits, averageDailyProfit);

    const consecutiveWins = this.calculateConsecutiveDays(dailyProfits, 'WIN');
    const consecutiveLoss = this.calculateConsecutiveDays(dailyProfits, 'LOSS');
    const consecutivePercentageWins = this.calculateConsecutivePercentage(dailyProfits, 'WIN');
    const consecutivePercentageLoss = this.calculateConsecutivePercentage(dailyProfits, 'LOSS');
    const currentConsecutiveWins = this.calculateCurrentConsecutiveDays(dailyProfits, 'WIN');
    const currentConsecutiveLoss = this.calculateCurrentConsecutiveDays(dailyProfits, 'LOSS');
    const currentConsecutivePercentageWins = this.calculateCurrentConsecutivePercentage(dailyProfits, 'WIN');
    const currentConsecutivePercentageLoss = this.calculateCurrentConsecutivePercentage(dailyProfits, 'LOSS');
    const rsi = this.calculateRSI(dailyProfits);

    const stats: LongShortStats = {
      longToken,
      shortToken,
      totalDays,
      validDays,
      winningDays,
      losingDays,
      winRate,
      lossRate,
      totalProfit,
      totalProfitFromPrices,
      averageDailyProfit,
      averageDailyGain,
      averageDailyLoss,
      totalGain,
      totalLoss,
      maxSingleDayProfit,
      maxSingleDayLoss,
      maxConsecutiveWinningDays,
      maxConsecutiveLosingDays,
      profitVolatility,
      sharpeRatio,
      maxDrawdown,
      consistencyScore,
      dailyProfits,
      recommendation: 0,
      consecutiveWins,
      consecutiveLoss,
      consecutivePercentageWins,
      consecutivePercentageLoss,
      currentConsecutiveWins,
      currentConsecutiveLoss,
      currentConsecutivePercentageWins,
      currentConsecutivePercentageLoss,
      rsi,
      fundingFeeLong: fundingFees?.fundingFeeLong,
      fundingFeeShort: fundingFees?.fundingFeeShort
    };

    stats.recommendation = this.calculateRecommendationScore(stats);

    return stats;
  }

  generateRecommendation(stats: LongShortStats): LongShortAnalysisResult {
    let recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    let confidence = 0;

    if (stats.winRate >= 60 && stats.averageDailyProfit >= 0.5) {
      recommendation = 'STRONG_BUY';
      confidence = Math.min(100, stats.winRate + stats.averageDailyProfit * 20);
    } else if (stats.winRate >= 55 && stats.averageDailyProfit >= 0.2) {
      recommendation = 'BUY';
      confidence = Math.min(100, stats.winRate + stats.averageDailyProfit * 20);
    } else if (stats.winRate >= 50 && stats.averageDailyProfit >= 0) {
      recommendation = 'HOLD';
      confidence = Math.min(100, stats.winRate + stats.averageDailyProfit * 20);
    } else if (stats.winRate >= 45) {
      recommendation = 'SELL';
      confidence = Math.min(100, 100 - stats.winRate + Math.abs(stats.averageDailyProfit) * 20);
    } else {
      recommendation = 'STRONG_SELL';
      confidence = Math.min(100, 100 - stats.winRate + Math.abs(stats.averageDailyProfit) * 20);
    }

    return {
      pair: `LONG ${stats.longToken}/SHORT ${stats.shortToken}`,
      stats,
      recommendation,
      confidence
    };
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private calculateConsecutiveDays(dailyProfits: number[], direction: 'WIN' | 'LOSS'): number {
    if (dailyProfits.length === 0) return 0;
    
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    for (let i = 0; i < dailyProfits.length; i++) {
      const profit = dailyProfits[i];
      if (direction === 'WIN' && profit > 0) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else if (direction === 'LOSS' && profit < 0) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    return maxConsecutive;
  }

  private calculateConsecutivePercentage(dailyProfits: number[], direction: 'WIN' | 'LOSS'): number {
    if (dailyProfits.length === 0) return 0;
    
    let maxPercentage = 0;
    let currentPercentage = 0;
    
    for (let i = 0; i < dailyProfits.length; i++) {
      const profit = dailyProfits[i];
      if (direction === 'WIN' && profit > 0) {
        currentPercentage += profit;
        maxPercentage = Math.max(maxPercentage, currentPercentage);
      } else if (direction === 'LOSS' && profit < 0) {
        currentPercentage += Math.abs(profit);
        maxPercentage = Math.max(maxPercentage, currentPercentage);
      } else {
        currentPercentage = 0;
      }
    }
    return maxPercentage;
  }

  private calculateCurrentConsecutiveDays(dailyProfits: number[], direction: 'WIN' | 'LOSS'): number {
    if (dailyProfits.length === 0) return 0;
    
    let consecutive = 0;
    for (let i = dailyProfits.length - 1; i >= 0; i--) {
      const profit = dailyProfits[i];
      if (direction === 'WIN' && profit > 0) {
        consecutive++;
      } else if (direction === 'LOSS' && profit < 0) {
        consecutive++;
      } else {
        break;
      }
    }
    return consecutive;
  }

  private calculateCurrentConsecutivePercentage(dailyProfits: number[], direction: 'WIN' | 'LOSS'): number {
    if (dailyProfits.length === 0) return 0;
    
    let totalPercentage = 0;
    for (let i = dailyProfits.length - 1; i >= 0; i--) {
      const profit = dailyProfits[i];
      if (direction === 'WIN' && profit > 0) {
        totalPercentage += profit;
      } else if (direction === 'LOSS' && profit < 0) {
        totalPercentage += Math.abs(profit);
      } else {
        break;
      }
    }
    return totalPercentage;
  }

  private calculateVolatilityScore(dailyProfits: number[]): number {
    if (dailyProfits.length < 10) return 5;
    
    const recentVolatility = this.calculateVolatility(dailyProfits.slice(-10));
    const historicalVolatility = this.calculateVolatility(dailyProfits);
    
    if (historicalVolatility === 0) return 5;
    
    const volatilityRatio = recentVolatility / historicalVolatility;
    
    if (volatilityRatio > 1.5) return 3;
    if (volatilityRatio > 1.2) return 4;
    if (volatilityRatio < 0.7) return 7;
    if (volatilityRatio < 0.5) return 8;
    return 5;
  }

  private calculateRSI(dailyProfits: number[], period: number = 14): number {
    if (dailyProfits.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = dailyProfits.length - period; i < dailyProfits.length; i++) {
      const change = dailyProfits[i];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    if (avgGain === 0) return 0;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
  }

  private calculateRSIScore(dailyProfits: number[]): number {
    if (dailyProfits.length < 15) return 5;
    
    const rsi = this.calculateRSI(dailyProfits);
    
    if (rsi <= 30) return 8;
    if (rsi <= 40) return 7;
    if (rsi >= 70) return 2;
    if (rsi >= 60) return 3;
    if (rsi >= 50) return 5; 
    return 6; 
  }

  private calculateRecommendationScore(stats: LongShortStats): number {
    const currentConsecutiveWins = stats.currentConsecutiveWins;
    const currentConsecutiveLoss = stats.currentConsecutiveLoss;
    const currentConsecutivePercentageWins = stats.currentConsecutivePercentageWins;
    const currentConsecutivePercentageLoss = stats.currentConsecutivePercentageLoss;
    const consecutiveWins = stats.consecutiveWins;
    const consecutivePercentageWins = stats.consecutivePercentageWins;
    const volatilityScore = this.calculateVolatilityScore(stats.dailyProfits);
    
    let score = 5;
    
    if (stats.winRate < 45) {
      score -= 3;
    } else if (stats.winRate < 50) {
      score -= 2;
    } else if (stats.winRate < 55) {
      score -= 1;
    }
    
    if (stats.winRate >= 60) {
      score += 1;
    } else if (stats.winRate >= 55) {
      score += 0.5;
    }
    
    if (stats.totalProfit < -20) {
      score -= 2;
    } else if (stats.totalProfit < -10) {
      score -= 1;
    } else if (stats.totalProfit < 0) {
      score -= 0.5;
    }
    
    if (stats.totalProfit >= 50) {
      score += 1;
    } else if (stats.totalProfit >= 20) {
      score += 0.5;
    }
    
    if (currentConsecutiveLoss >= 3) {
      score += 2;
    } else if (currentConsecutiveLoss >= 2) {
      score += 1;
    }
    
    if (currentConsecutivePercentageLoss >= 5) {
      score += 1.5;
    } else if (currentConsecutivePercentageLoss >= 3) {
      score += 1;
    }
    
    const winProgress = consecutiveWins > 0 ? currentConsecutiveWins / consecutiveWins : 0;
    const percentageProgress = consecutivePercentageWins > 0 ? currentConsecutivePercentageWins / consecutivePercentageWins : 0;
    
    if (winProgress >= 0.8) {
      score -= 2;
    } else if (winProgress >= 0.6) {
      score -= 1;
    } else if (winProgress >= 0.4) {
      score -= 0.5;
    }
    
    if (percentageProgress >= 0.8) {
      score -= 1.5;
    } else if (percentageProgress >= 0.6) {
      score -= 1;
    } else if (percentageProgress >= 0.4) {
      score -= 0.5;
    }
    
    if (winProgress < 0.3 && percentageProgress < 0.3) {
      score += 1;
    }
    
    score += (volatilityScore - 5) * 0.3;
    
    const rsiScore = this.calculateRSIScore(stats.dailyProfits);
    score += (rsiScore - 5) * 0.4;
    
    return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
  }

  private calculateMaxDrawdown(returns: number[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    let runningTotal = 0;
    
    for (const ret of returns) {
      runningTotal += ret;
      if (runningTotal > peak) {
        peak = runningTotal;
      } else {
        const drawdown = peak - runningTotal;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    return maxDrawdown;
  }

  private calculateConsistencyScore(profits: number[], averageProfit: number): number {
    if (profits.length === 0) return 0;
    
    const variance = profits.reduce((sum, profit) => sum + Math.pow(profit - averageProfit, 2), 0) / profits.length;
    const standardDeviation = Math.sqrt(variance);
    
    return Math.max(0, 100 - (standardDeviation * 10));
  }
}

export interface LongShortStats {
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
  sharpeRatio: number;
  maxDrawdown: number;
  consistencyScore: number;
  dailyProfits: number[];
  recommendation: number;
  consecutiveWins: number;
  consecutiveLoss: number;
  consecutivePercentageWins: number;
  consecutivePercentageLoss: number;
  currentConsecutiveWins: number;
  currentConsecutiveLoss: number;
  currentConsecutivePercentageWins: number;
  currentConsecutivePercentageLoss: number;
  rsi: number;
  fundingFeeLong?: string;
  fundingFeeShort?: string;
}

export interface LongShortAnalysisResult {
  pair: string;
  stats: LongShortStats;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
}
